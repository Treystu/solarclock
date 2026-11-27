# Accuracy — It's 16:20 Somewhere

## Method
Apparent solar time = UTC + longitude × 4 min/° + Equation of Time.
Equation of Time and solar declination: NOAA's published fractional-year
series (the GML solar calculator formulas), implemented in `solar.js`
(inlined byte-identical into `index.html` by `build.py`). No refraction or
elevation clock terms — those affect sunrise/sunset, not the time of day
(the original build added them as constant offsets; that was one of its
defects).

## Why the original was replaced
Astra verification (GPT-6.2 Astra, 2026-11-27) of the original
"Tesla Solar Clock" at commit abd1ace: **INACCURATE — 18.1 minutes slow**
at the Pāhoa defaults on 2026-11-27 (displayed 11:39:46 vs true ~11:57:53).
Its Equation of Time matched 0 of 6 NOAA reference dates within ±1 min
(worst −30.8 min, Nov 3; wrong sign in Feb and Nov), its day-of-year ran
+1 all year, and its refraction/elevation terms were physically wrong as
constant clock corrections. Longitude assembly was accurate.

## Test table — shipped EoT vs NOAA reference (12:00Z, `node test-solar.js`)
| Date | EoT code (min) | EoT NOAA (min) | Error (min) | Decl. error (°) |
|---|---|---|---|---|
| 2026-01-01 | −2.90 | −2.90 | 0.00 | 0.00 |
| 2026-02-11 | −14.20 | −14.20 | 0.00 | 0.00 |
| 2026-03-20 | −8.16 | −8.16 | 0.00 | 0.00 |
| 2026-06-21 | −1.33 | −1.33 | 0.00 | 0.00 |
| 2026-11-03 | +16.37 | +16.37 | 0.00 | 0.00 |
| 2026-11-27 | +12.08 | +11.94 | +0.14 | +0.07 |

Worst EoT error: **0.14 min** ≈ 8 s of time ≈ 0.035° of band position.
Full-path check at the Astra test instant (2026-11-27T22:05:43Z, lon
−154.944005): shipped code gives apparent solar time **11:57:53**, matching
the reference to the second.

## Cold run of the shipped file
The solar code was extracted back out of the built `index.html`, confirmed
byte-identical to the tested `solar.js`, and at six instants (including the
year boundary and 2028-02-29) in both apparent and mean modes the solar
time at the band's west edge is exactly 16:20:00 and at its east edge
exactly 16:21:00. An independent Python implementation of the same NOAA
formulas reproduces the band west edge to 0.0000° on all six instants.

## Honest limits
- Page label: EoT good to ~0.2 min (~3 s of band passage, ~0.05°).
- Embedded city coordinates are good to ~0.1°, so city arrival times
  carry ~±25 s.
- The page runs on the viewer's device clock; a wrong device clock shifts
  the band by the same amount.
