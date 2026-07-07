# BAROGRAPH

Field Instrument No. 067. A Victorian observatory drum that records live weather from a personal weather station. The drum carries seven days of chart paper: pressure drawn in oxblood ink, temperature in prussian, with the pen resting on the present moment. Two pens ride the drum at once: brass stops beneath it choose which measurements they record, each writing in its own ink against its own scale. Around them, a shelf of instruments: mercury thermometer, aneroid barometer with set hand, hygrometer, wind rose, rain gauge, and a storm glass whose crystals answer the pressure trend.

Current version: 1.4.3

## Data source

BAROGRAPH is fed by WX-RELAY, a Cloudflare Worker that proxies the Weather Underground PWS API and keeps the key server-side. The default worker URL is set in Settings and can be changed to any WX-RELAY deployment. Routes used: `/current` (refresh loop), `/today` and `/hourly?date=YYYYMMDD` (drum traces).

## Features

- Two pens, seven inks: pressure (oxblood), temperature (prussian), wind (verdigris, with gusts as pen flicks), humidity (sunbury), rain (indigo, dropping to nought at midnight in the manner of a siphon recorder), sun (burnt umber), and ultraviolet (iron gall). Brass stops beneath the drum toggle measurements on and off, up to two at a time; the first choice takes the left-hand scale and grid, the newest takes the right-hand scale, and choosing a third lifts the oldest pen. Scale numerals are printed in their trace's ink, and the plinth engraving names the active inks. The selection persists with your settings.
- A flat, honest chart: linear time across aged paper, no faux cylinder or brass apparatus, with a day of blank ruled chart ahead of the present and ink dots resting on the latest observations. The card still sits in flickering gaslight in the night theme.
- Hover readout: rest the pointer anywhere on the chart and a hairline crosshair snaps to the nearest observation, marking each active trace with a ring in its ink and a card reading out the time and values.
- Aneroid barometer with a set hand marking the reading three hours past, in the manner of a hall barometer, plus classic RAIN / CHANGE / FAIR engraving.
- Storm glass with four states (clear, faint haze, blooming stars, climbing ferns) keyed to the three-hour pressure trend, with period-appropriate captions.
- Live, cached, and demo sources: if the wire goes quiet the instrument falls back to its last cached readings, and failing that to a demonstration week of synthetic weather. The badge in the header always tells you which you are looking at.
- Local-first: settings and the latest readings persist in the browser. Export and import carry them between machines.
- Three themes (night default, day, high contrast), all verified programmatically for WCAG AA contrast in the test harness.
- Imperial and metric units end to end, including drum scales, dial faces, and gauge graduations.
- Respects prefers-reduced-motion: pen scratch, lamp flicker, and rain drops all go still.

## Test harness

Append `?test=1` to the page URL to run the built-in harness in the browser. The same thirty tests run headless in node by extracting the embedded script. Coverage: WU payload normalization, series building and de-duplication, pressure trend thresholds, storm glass states, compass points, drum geometry monotonicity and edge compression, Beaufort scale words, wind, gust, rain, solar, and ultraviolet extraction from history fields, humidity and sun words, weekly rainfall summation, tidy scale maxima, channel toggling limits, per-channel scale domains, every channel pairing across themes, demo determinism and siphon behavior, SVG well-formedness across all three themes, and WCAG contrast ratios for every theme palette.

## Known limitations

- No sound in this release. A clockwork tick and rain-on-glass ambience are on the roadmap, with the standard mute button.
- Typefaces (IM Fell English) load from Google Fonts. Without a network the instrument degrades gracefully to Georgia and remains fully functional; a self-hosted font option is a candidate for a later release.
- Drum history depends on the WU history endpoints. A station that only recently began reporting will show a shorter trace.
- The seven previous-day history fetches happen once per hour; a station with gaps in its record will show pen lifts (breaks) in the trace, which is honest behavior for a barograph.
- The rain channel relies on the station's day-cumulative rainfall total; a station that resets its total on a different schedule will show the siphon drop at its own reset hour.
- The storm glass is poetic, not predictive. Real storm glasses were not predictive either.

## Development standards

Single-file HTML, no build step, local-first, GPL-3.0. Night-default theming with day and high contrast modes. Version number displayed in the header, footer, and page title. Debug logging behind the Settings toggle. Feedback drawer with copy-to-clipboard and optional mailto. Each release is preserved as its own file under `releases/`.

## Changelog

- 1.4.3: The retired worker URL now migrates in any spelling (trailing slash and all) and the corrected setting is written back to storage, so the settings drawer shows the current relay.
- 1.4.2: Default relay is now https://wx-relay.mike-268.workers.dev. Saved settings holding the retired weatherstation URL migrate automatically on load.
- 1.4.1: Gauge captions enlarged for legibility.
- 1.4.0: Less apparatus, more chart. The faux cylinder is retired: time runs linear across a flat sheet of aged paper, and the pillars, spindle, plinth, and pen arm are gone. The seven inks, bold on-paper scales, day ruling, gust flicks, siphon rain, and the blank day ahead of the present all remain. New: hover readout, a hairline crosshair that snaps to the nearest observation with ink-ringed markers on each active trace and a card showing the time and values. Thirty tests.
- 1.3.2: The pen no longer writes at the very edge of the paper. The drum now carries a day of blank ruled chart ahead of the present moment, so the pen rides about half an inch in from the right, with the coming day line preprinted on the empty paper before it.
- 1.3.1: Legibility pass on the drum scales. Numerals are now printed on the chart paper inside the margins, large and bold in their trace's ink, with a paper-colored halo so they stay readable where a trace crosses them. The right-hand scale no longer hides behind the pen gantry. Unit tags moved inside the top corners in the same style.
- 1.3.0: One drum, seven inks, two pens. The register wall is consolidated onto the drum itself: brass stops beneath it toggle any measurement on or off, two at a time, each trace in its own ink with its own scale (first choice left, newest right). Choosing a third lifts the oldest pen; the drum always keeps at least one. Ultraviolet gains its own iron gall ink. The generic register strip and the four standalone registers are retired. Selection persists in settings and export. Twenty-nine tests.
- 1.2.2: Rain gauge fix: a trace amount of rain smaller than the glass inset produced a negative fill height and a console error; the water level is now clamped so any measurable rain shows at least a sliver. Inline SVG favicon added (a small drum in brass and oxblood), ending the favicon 404. Edge-value regression test across all dial builders. Twenty-eight tests.
- 1.2.1: Trace geometry fix: ink lines now follow the paper's curvature exactly on every register, matching their grid lines. Previously traces rode 26 pixels high against their scales and values near the top of a scale could crest over the paper rim. Register value bands are now inset from the rims, with a regression test pinning a 100 percent trace against the top edge. The hygrograph's ink is properly named sunbury. Twenty-seven tests.
- 1.2.0: The full meteorograph. Three new registers below the anemograph: hygrograph (humidity in sunbury), pluviograph (daily cumulative rainfall in indigo with siphon resets at midnight), and actinograph (solar radiation in burnt umber, ultraviolet stippled). All four strips rewritten onto one generic register renderer. Rain, solar, and ultraviolet now collected in series, refresh, cache, and demo weather. Six new harness tests, twenty-six in all.
- 1.1.0: Anemograph strip below the drum. Wind speed in verdigris ink, gusts as pen flicks, Beaufort engravings at the margin, day lines aligned with the drum above. Wind and gust now collected in the series, live refresh, cache, and demo weather. Beaufort caption under the strip with the week's high gust. Four new harness tests, twenty in all.
- 1.0.0: Initial release. Seven-day drum with pressure and temperature traces, pen arm, gaslight flicker. Thermometer, aneroid with set hand, hygrometer, wind rose, rain gauge, storm glass, heliography and station plaques. Live/cached/demo sources, export/import, three themes, sixteen-test harness.

## License

GPL-3.0
