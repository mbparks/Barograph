# WX-RELAY

A Cloudflare Worker that proxies the Weather Underground Personal Weather Station (PWS) API. The API key lives server-side as a Worker secret, so static pages on mbparks.com can fetch live station data without exposing the key in client-side code.

Current version: 0.1.0

## Routes

All routes are GET and return JSON.

| Route | Upstream WU endpoint | Edge cache | Notes |
|---|---|---|---|
| `/status` | none | none | Health check, returns version and route list |
| `/current` | `observations/current` | 60 s | Latest observation from the station |
| `/today` | `observations/all/1day` | 120 s | All rapid observations since midnight |
| `/7day` | `dailysummary/7day` | 15 min | Daily summaries for the past week |
| `/hourly?date=YYYYMMDD` | `history/hourly` | 1 hr | Hourly history for one day |
| `/daily?date=YYYYMMDD` | `history/daily` | 1 hr | Daily summary for one day |

Optional on every data route: `?units=e` (imperial, default), `m` (metric), `h` (UK hybrid), `s` (SI).

Example client call:

```js
const resp = await fetch('https://wx-relay.YOURSUBDOMAIN.workers.dev/current');
const data = await resp.json();
const obs = data.observations[0];
console.log(obs.imperial.temp, obs.humidity, obs.imperial.windSpeed);
```

## Setup

1. Edit `wrangler.toml`: set `STATION_ID` to your WU PWS station ID and confirm `ALLOWED_ORIGINS`.
2. Store the API key as a secret (you will be prompted to paste it):

```
wrangler secret put WU_API_KEY
```

3. Deploy:

```
wrangler deploy
```

4. Verify:

```
curl https://wx-relay.YOURSUBDOMAIN.workers.dev/status
curl https://wx-relay.YOURSUBDOMAIN.workers.dev/current
```

## Design notes

- Edge caching (Cloudflare Cache API) keeps the Worker well inside the WU free-tier limits of 30 calls per minute and 1,500 calls per day, regardless of visitor traffic. The `X-WX-Relay-Cache` response header reports `hit` or `miss`.
- CORS is restricted to the origins listed in `ALLOWED_ORIGINS`. Requests from other origins still work server-to-server (curl) but will be blocked by browsers.
- Errors return clean JSON with an `error` field rather than throwing, so client code can branch on `data.error`.
- Console logging is behind the `DEBUG` var. Set it to `"true"` and watch with `wrangler tail`.
- A version marker is sent on every response as `X-WX-Relay-Version` for deployment fingerprinting.

## Known limitations

- Read-only. This Worker does not upload observations to Weather Underground; your station hardware continues to do that directly.
- The WU history endpoints only go back as far as WU retains data for your station.
- The `/today` route can return a large payload late in the day (one record roughly every 5 minutes).
- No rate limiting on the Worker itself beyond edge caching. If abuse ever becomes a problem, Cloudflare WAF rules or a token check can be added.
- Single station only. Multi-station support would need a station allowlist to avoid becoming an open proxy.

## Changelog

- 0.1.1: CORS hardening. A default allowlist (mbparks.com and www.mbparks.com) is baked into the worker, so a deployment that loses the ALLOWED_ORIGINS var (for example, code pasted into the Cloudflare dashboard) still serves the home domains; the var, when present, overrides the default. Edge-cached responses are now stored without CORS headers and headers are applied per request, so a cache hit can never echo one origin's Access-Control-Allow-Origin to another. Six new harness tests, twenty in all.
- 0.1.0: Initial release. Routes for current, today, 7day, hourly, daily. Edge caching, CORS allowlist, debug logging, JSON error envelope.

## License

GPL-3.0
