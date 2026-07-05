# BAROGRAPH

Field Instrument No. 067. A Victorian observatory drum that records live weather from a personal weather station. The drum carries seven days of chart paper: pressure drawn in oxblood ink, temperature in prussian, with the pen resting on the present moment. Around it, a shelf of instruments: mercury thermometer, aneroid barometer with set hand, hygrometer, wind rose, rain gauge, and a storm glass whose crystals answer the pressure trend.

Current version: 1.0.0

## Data source

BAROGRAPH is fed by WX-RELAY, a Cloudflare Worker that proxies the Weather Underground PWS API and keeps the key server-side. The default worker URL is set in Settings and can be changed to any WX-RELAY deployment. Routes used: `/current` (refresh loop), `/today` and `/hourly?date=YYYYMMDD` (drum traces).

## Features

- Seven-day drum with cylindrical wrap: time compresses toward the drum edges, grid lines sag with the paper, a brass pen arm scratches at the last observation, and the drum sits in flickering gaslight in the night theme.
- Aneroid barometer with a set hand marking the reading three hours past, in the manner of a hall barometer, plus classic RAIN / CHANGE / FAIR engraving.
- Storm glass with four states (clear, faint haze, blooming stars, climbing ferns) keyed to the three-hour pressure trend, with period-appropriate captions.
- Live, cached, and demo sources: if the wire goes quiet the instrument falls back to its last cached readings, and failing that to a demonstration week of synthetic weather. The badge in the header always tells you which you are looking at.
- Local-first: settings and the latest readings persist in the browser. Export and import carry them between machines.
- Three themes (night default, day, high contrast), all verified programmatically for WCAG AA contrast in the test harness.
- Imperial and metric units end to end, including drum scales, dial faces, and gauge graduations.
- Respects prefers-reduced-motion: pen scratch, lamp flicker, and rain drops all go still.

## Test harness

Append `?test=1` to the page URL to run the built-in harness in the browser. The same sixteen tests run headless in node by extracting the embedded script. Coverage: WU payload normalization, series building and de-duplication, pressure trend thresholds, storm glass states, compass points, drum geometry monotonicity and edge compression, demo determinism, SVG well-formedness across all three themes, and WCAG contrast ratios for every theme palette.

## Known limitations

- No sound in this release. A clockwork tick and rain-on-glass ambience are on the roadmap, with the standard mute button.
- Typefaces (IM Fell English) load from Google Fonts. Without a network the instrument degrades gracefully to Georgia and remains fully functional; a self-hosted font option is a candidate for a later release.
- Drum history depends on the WU history endpoints. A station that only recently began reporting will show a shorter trace.
- The seven previous-day history fetches happen once per hour; a station with gaps in its record will show pen lifts (breaks) in the trace, which is honest behavior for a barograph.
- Humidity is collected in the series but not yet traced on the drum. A third ink is a candidate for v1.1.
- The storm glass is poetic, not predictive. Real storm glasses were not predictive either.

## Development standards

Single-file HTML, no build step, local-first, GPL-3.0. Night-default theming with day and high contrast modes. Version number displayed in the header, footer, and page title. Debug logging behind the Settings toggle. Feedback drawer with copy-to-clipboard and optional mailto. Each release is preserved as its own file under `releases/`.

## Changelog

- 1.0.0: Initial release. Seven-day drum with pressure and temperature traces, pen arm, gaslight flicker. Thermometer, aneroid with set hand, hygrometer, wind rose, rain gauge, storm glass, heliography and station plaques. Live/cached/demo sources, export/import, three themes, sixteen-test harness.

## License

GPL-3.0
