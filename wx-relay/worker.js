/*
 * WX-RELAY v0.1.0
 * Cloudflare Worker proxy for the Weather Underground PWS API.
 * Keeps the WU API key server-side. Static pages on mbparks.com
 * call this Worker instead of api.weather.com directly.
 *
 * Secrets (set via wrangler secret put):
 *   WU_API_KEY      Weather Underground API key
 *
 * Vars (set in wrangler.toml):
 *   STATION_ID      WU PWS station ID (e.g. KMDCUMBE12)
 *   ALLOWED_ORIGINS Comma-separated list of origins allowed via CORS
 *   DEBUG           "true" to enable console logging
 *
 * License: GPL-3.0
 */

const VERSION = '0.1.0';

// Route table. Each Worker route maps to a WU v2 PWS endpoint.
// ttl = edge cache lifetime in seconds. Keeps us well inside the
// free-tier rate limits (30 calls/min, 1500 calls/day) no matter
// how many visitors hit the page.
const ROUTES = {
  '/current': { path: 'observations/current',  ttl: 60,   needsDate: false },
  '/today':   { path: 'observations/all/1day', ttl: 120,  needsDate: false },
  '/7day':    { path: 'dailysummary/7day',     ttl: 900,  needsDate: false },
  '/hourly':  { path: 'history/hourly',        ttl: 3600, needsDate: true  },
  '/daily':   { path: 'history/daily',         ttl: 3600, needsDate: true  },
};

const VALID_UNITS = new Set(['e', 'm', 'h', 's']);

export default {
  async fetch(request, env, ctx) {
    const debug = env.DEBUG === 'true';
    const log = (...args) => { if (debug) console.log('[wx-relay]', ...args); };

    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return jsonError('Method not allowed', 405, cors);
    }

    // Health / version check
    if (url.pathname === '/' || url.pathname === '/status') {
      return jsonOk({ ok: true, service: 'wx-relay', version: VERSION, routes: Object.keys(ROUTES) }, cors);
    }

    const route = ROUTES[url.pathname];
    if (!route) {
      return jsonError('Unknown route. Try /current, /today, /7day, /hourly, /daily, or /status.', 404, cors);
    }

    if (!env.WU_API_KEY) {
      return jsonError('Server misconfiguration: WU_API_KEY secret is not set.', 500, cors);
    }
    if (!env.STATION_ID) {
      return jsonError('Server misconfiguration: STATION_ID var is not set.', 500, cors);
    }

    // Units: e (imperial), m (metric), h (UK hybrid), s (SI). Default imperial.
    const units = url.searchParams.get('units') || 'e';
    if (!VALID_UNITS.has(units)) {
      return jsonError('Invalid units. Use e, m, h, or s.', 400, cors);
    }

    // Date required for history routes, format YYYYMMDD
    let date = null;
    if (route.needsDate) {
      date = url.searchParams.get('date') || '';
      if (!/^\d{8}$/.test(date)) {
        return jsonError('This route requires ?date=YYYYMMDD.', 400, cors);
      }
    }

    // Build upstream URL (key stays server-side, never echoed to client)
    const upstream = new URL(`https://api.weather.com/v2/pws/${route.path}`);
    upstream.searchParams.set('stationId', env.STATION_ID);
    upstream.searchParams.set('format', 'json');
    upstream.searchParams.set('units', units);
    upstream.searchParams.set('numericPrecision', 'decimal');
    if (date) upstream.searchParams.set('date', date);
    upstream.searchParams.set('apiKey', env.WU_API_KEY);

    // Edge cache keyed on the incoming request URL (no key in it)
    const cache = caches.default;
    const cacheKey = new Request(`https://wx-relay.cache${url.pathname}?units=${units}${date ? `&date=${date}` : ''}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
      log('cache hit', url.pathname);
      const hit = new Response(cached.body, cached);
      applyHeaders(hit.headers, cors);
      hit.headers.set('X-WX-Relay-Cache', 'hit');
      return hit;
    }

    log('cache miss, fetching upstream', route.path);

    let upstreamResp;
    try {
      upstreamResp = await fetch(upstream.toString(), {
        headers: { 'Accept': 'application/json' },
      });
    } catch (err) {
      log('upstream fetch failed', err && err.message);
      return jsonError('Upstream fetch failed: ' + (err && err.message ? err.message : 'unknown error'), 502, cors);
    }

    if (!upstreamResp.ok) {
      // 204 from WU means the station has no data for the request
      if (upstreamResp.status === 204) {
        return jsonError('No data available for this station and time range.', 404, cors);
      }
      log('upstream error status', upstreamResp.status);
      return jsonError(`Weather Underground returned status ${upstreamResp.status}.`, 502, cors);
    }

    let body;
    try {
      body = await upstreamResp.text();
      JSON.parse(body); // validate before caching
    } catch (err) {
      return jsonError('Upstream returned invalid JSON.', 502, cors);
    }

    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${route.ttl}`,
      'X-WX-Relay-Version': VERSION,
      'X-WX-Relay-Cache': 'miss',
    });
    applyHeaders(headers, cors);

    const response = new Response(body, { status: 200, headers });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function applyHeaders(target, extra) {
  for (const [k, v] of Object.entries(extra)) target.set(k, v);
}

function jsonOk(obj, cors) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  applyHeaders(headers, cors);
  return new Response(JSON.stringify(obj), { status: 200, headers });
}

function jsonError(message, status, cors) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  applyHeaders(headers, cors);
  return new Response(JSON.stringify({ error: message, status }), { status, headers });
}
