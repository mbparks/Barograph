# WeatherStation

The weather over Mountain Maryland, kept and recorded. Two instruments in one repository:

## wx-relay

A Cloudflare Worker that proxies the Weather Underground PWS API for a personal weather station. Keeps the API key server-side, caches at the edge to stay within free-tier limits, and serves clean JSON to static pages. Routes: `/status`, `/current`, `/today`, `/7day`, `/hourly?date=YYYYMMDD`, `/daily?date=YYYYMMDD`. See `wx-relay/README.md` for deployment and configuration.

## barograph

Field Instrument No. 067. A Victorian observatory drum that renders the station's last seven days as ink traces on rotating chart paper, with a shelf of instruments: mercury thermometer, aneroid barometer with set hand, hygrometer, wind rose, rain gauge, and storm glass. Single-file HTML, no build step, local-first, three themes, built-in test harness at `?test=1`. See `barograph/README.md`.

## Architecture

The station reports to Weather Underground. WX-RELAY fetches and caches at the Cloudflare edge. BAROGRAPH, or any other static page, fetches from the relay. The key never leaves the Worker.

## License

GPL-3.0
