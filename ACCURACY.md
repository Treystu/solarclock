# Accuracy — It's 16:20 Somewhere (v2, Julian-centuries method)

## Method
Apparent solar time = UTC + longitude × 4 min/° + Equation of Time.
The Equation of Time and declination come from `solarPosition()` — the
NOAA / Meeus solar-position computation from Julian centuries (geometric
mean longitude and anomaly, equation of center, apparent longitude,
corrected obliquity) — copied verbatim from the accuracy-fixed
Treystu/solarclock (commit 74d6ffc) into `solar.js`, and inlined
byte-identical into `index.html` by `build.py`. EoT is recomputed from
the exact instant on every redraw — no fractional-year fit, no
day-of-year table, no cached values. No refraction or elevation clock
terms: those affect sunrise/sunset, not the time of day.

## Anchors — shipped EoT vs published values
| Check | Shipped code | Reference | Δ |
|---|---|---|---|
| EoT 2026-02-11 12:00Z | −14.226 min | −14.2 min (published 2026 minimum, solarposition.org) | 0.03 min |
| EoT 2026-11-03 12:00Z | +16.492 min | +16.5 min (published 2026 maximum, solarposition.org) | 0.01 min |
| EoT 2026-11-27 22:05:43Z | +12.251 min | — | — |
| Apparent solar time, Pāhoa (lon −154.944005) at 2026-11-27T22:05:43Z | 11:58:11 | 11:58:11 (fixed solarclock, same instant) | 0 s |

The shipped EoT is bit-identical to the fixed solarclock's (max diff
0.0 min over 8 sampled instants) — the copy is exact, and the fixed
solarclock's EoT was itself verified against an independently written
implementation of the same method to 0.0000 s over 54 samples.

## Inversion test — the band, judged by the fixed page's own clock
Probe longitudes were run through the fixed solarclock's own
`apparentSolarTime` (lat 19.442640, elev 330). λ\* is the rendered
band's west edge (the exact 16:20:00 line); offsets are degrees east
of λ\* (solar time increases eastward, so the 16:20 minute unfolds
east of the line):

| Offset | 2026-11-27T22:05:43Z (λ\*=−89.4919°) | 2026-06-21T03:00:00Z (λ\*=−159.5643°) | 2026-02-11T18:30:00Z (λ\*=−28.9437°) |
|---|---|---|---|
| −0.010° (just west, outside) | 16:19:57 | 16:19:57 | 16:19:57 |
| −0.001° (just west, outside) | 16:19:59 | 16:19:59 | 16:19:59 |
| 0.000° (the line) | 16:20:00 | 16:19:59 | 16:20:00 |
| +0.0625° | 16:20:15 | 16:20:14 | 16:20:15 |
| +0.125° (band centre) | 16:20:30 | 16:20:29 | 16:20:30 |
| +0.1875° | 16:20:45 | 16:20:44 | 16:20:45 |
| +0.249° (inner east edge) | 16:20:59 | 16:20:59 | 16:20:59 |
| +0.251° (just east, outside) | 16:21:00 | 16:21:00 | 16:21:00 |
| +0.260° | 16:21:02 | 16:21:02 | 16:21:02 |

Inside reads 16:20:xx, just outside reads 16:19:59 / 16:21:00, as
specified. Two honest blemishes, both in the reference display, not the
geometry: at the June instant the at-the-line probe reads 16:19:59 and
the interior probes read one second low — a sub-second floating-point
artifact surfaced by the fixed page's floor-to-second display (its
continuous value at the line is 16:20:00.0). Readings are identical at
latitudes 19.44, −33.87, and 64.15 — solar time is latitude-independent,
as it must be.

## Correction of the v1 record
Version 1 of this build used NOAA's fractional-year EoT fit and reported
a worst error of 0.14 min **against fractional-year reference values**.
That framing was superseded the same day: measured across 2026, the
fractional-year fit itself deviates from the Julian-centuries method by
up to **47.1 s** (max on 2026-01-12). The published 2026 values side
with the Julian-centuries method, which is why v2 ships it. The v1
numbers were accurate relative to their stated references; they are not
the accuracy of this build and should not be quoted for it.

## Honest limits
- "Perfect" here means: a second-level display on a method good to a
  few seconds against published values. Not zero error.
- Embedded city coordinates are good to ~0.1°, so city arrival times
  carry ~±25 s.
- The page runs on the viewer's device clock; a wrong device clock
  shifts the band by the same amount.
