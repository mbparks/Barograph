# The Weather, Recorded in Ink

*A draft announcement for Gears of Resistance / mbparks.com*

There is a particular kind of instrument I keep returning to: the kind that records. Not the kind that tells you a number and forgets it, but the kind that leaves a trace, so that a week later you can run your finger along the paper and say, here is where the front came through, here is the cold night, here is the long steady fair spell.

BAROGRAPH is Field Instrument No. 067, and it is exactly that: a Victorian observatory drum for my personal weather station, rendered in a browser. Seven days of chart paper wrap the cylinder. Pressure is drawn in oxblood ink, temperature in prussian, and a brass pen arm rests on the present moment, twitching faintly as it writes. In the night theme the whole apparatus sits in flickering gaslight.

Below the drum is the instrument shelf: a mercury thermometer with a dew point marker, an aneroid barometer with a proper set hand (turn of the last century readers will know the ritual: tap the glass, note where the needle has wandered from where you set it), a hygrometer, a wind rose, a rain gauge that fills as the day's total accumulates, and a storm glass. The storm glass grows fern fronds when the pressure is falling hard. Real storm glasses never actually predicted anything. Mine doesn't either. I consider this historically accurate.

The data comes off my rooftop by way of Weather Underground and a small Cloudflare Worker called WX-RELAY that keeps the API key server-side and caches at the edge. If the wire goes quiet, the instrument falls back to its last cached readings; failing that, it plays a demonstration week of synthetic weather and says so honestly on a badge. Everything else is a single HTML file, no build step, local-first, GPL-3.0, in keeping with the standing rules of the Field Instrument series.

The instrument, as always, is the argument: owning your data and understanding your tools is worth the learning curve. The weather over Mountain Maryland was going to happen anyway. Now it leaves a trace.

BAROGRAPH is Field Instrument No. 067 in the catalog at mbparks.com.
