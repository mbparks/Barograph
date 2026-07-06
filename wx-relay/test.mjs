import worker from './worker.js';

const env = { WU_API_KEY: 'testkey', STATION_ID: 'KMDTEST1', ALLOWED_ORIGINS: 'https://mbparks.com', DEBUG: 'false' };
const ctx = { waitUntil: () => {} };

// Stub the edge cache and upstream fetch
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
let capturedUrl = null;
globalThis.fetch = async (url) => {
  capturedUrl = url;
  return new Response(JSON.stringify({ observations: [{ stationID: 'KMDTEST1' }] }), { status: 200 });
};

const req = (path, origin) => new Request('https://wx-relay.test' + path, { headers: origin ? { Origin: origin } : {} });

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : (fail++, console.log('FAIL:', name)); };

// status route
let r = await worker.fetch(req('/status'), env, ctx);
let j = await r.json();
check('status ok', r.status === 200 && j.service === 'wx-relay');

// current route builds correct upstream URL, key present upstream but not in response
r = await worker.fetch(req('/current', 'https://mbparks.com'), env, ctx);
j = await r.json();
check('current 200', r.status === 200);
check('upstream path', capturedUrl.includes('observations/current'));
check('upstream has station', capturedUrl.includes('stationId=KMDTEST1'));
check('upstream has key', capturedUrl.includes('apiKey=testkey'));
check('cors echo', r.headers.get('Access-Control-Allow-Origin') === 'https://mbparks.com');
check('key not leaked in body', !JSON.stringify(j).includes('testkey'));

// disallowed origin gets no CORS header
r = await worker.fetch(req('/current', 'https://evil.example'), env, ctx);
check('cors blocked', r.headers.get('Access-Control-Allow-Origin') === null);

// history route requires date
r = await worker.fetch(req('/hourly'), env, ctx);
check('hourly no date 400', r.status === 400);
r = await worker.fetch(req('/hourly?date=20260704'), env, ctx);
check('hourly with date 200', r.status === 200 && capturedUrl.includes('date=20260704') && capturedUrl.includes('history/hourly'));

// bad units
r = await worker.fetch(req('/current?units=x'), env, ctx);
check('bad units 400', r.status === 400);

// unknown route
r = await worker.fetch(req('/nope'), env, ctx);
check('unknown 404', r.status === 404);

// method guard
r = await worker.fetch(new Request('https://wx-relay.test/current', { method: 'POST' }), env, ctx);
check('POST 405', r.status === 405);

// default allowlist kicks in when ALLOWED_ORIGINS var is absent
r = await worker.fetch(req('/current', 'https://mbparks.com'), { WU_API_KEY: 'testkey', STATION_ID: 'KMDTEST1' }, ctx);
check('default allowlist serves mbparks.com', r.headers.get('Access-Control-Allow-Origin') === 'https://mbparks.com');
r = await worker.fetch(req('/current', 'https://evil.example'), { WU_API_KEY: 'testkey', STATION_ID: 'KMDTEST1' }, ctx);
check('default allowlist still blocks others', r.headers.get('Access-Control-Allow-Origin') === null);

// cached responses never leak another origin's CORS header
{
  let stored = null;
  globalThis.caches = { default: { match: async () => stored, put: async (k, v) => { stored = v; } } };
  r = await worker.fetch(req('/7day', 'https://mbparks.com'), env, ctx);
  check('miss carries cors', r.headers.get('Access-Control-Allow-Origin') === 'https://mbparks.com');
  check('cached copy has no cors', stored !== null && stored.headers.get('Access-Control-Allow-Origin') === null);
  r = await worker.fetch(req('/7day', 'https://evil.example'), env, ctx);
  check('cache hit blocks disallowed origin', r.headers.get('X-WX-Relay-Cache') === 'hit' && r.headers.get('Access-Control-Allow-Origin') === null);
  r = await worker.fetch(req('/7day', 'https://mbparks.com'), env, ctx);
  check('cache hit echoes allowed origin', r.headers.get('X-WX-Relay-Cache') === 'hit' && r.headers.get('Access-Control-Allow-Origin') === 'https://mbparks.com');
  globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
}

// missing secret
r = await worker.fetch(req('/current'), { STATION_ID: 'X' }, ctx);
j = await r.json();
check('missing key 500', r.status === 500 && j.error.includes('WU_API_KEY'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
