// Solar math core for "It's 16:20 Somewhere".
// Method: NOAA fractional-year algorithm (the published GML solar calculator
// formulas). Apparent solar time = UTC + longitude correction + Equation of
// Time. No refraction/elevation clock terms: those affect rise/set only.
// This file is inlined byte-identical into index.html by build.py.

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

// Day of year, 1-based (Jan 1 = 1). The original code returned this + 1.
function dayOfYearUTC(date) {
  const y = date.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, date.getUTCMonth(), date.getUTCDate());
  return Math.floor((cur - start) / 86400000) + 1;
}

function utcHoursOfDay(date) {
  return date.getUTCHours() + date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000;
}

// Fractional year angle gamma (radians), NOAA form.
function fractionalYear(date) {
  const doy = dayOfYearUTC(date);
  return (2 * Math.PI / 365) * (doy - 1 + (utcHoursOfDay(date) - 12) / 24);
}

// Equation of Time in minutes. Sign convention: apparent = mean + EoT.
function equationOfTimeMin(date) {
  const g = fractionalYear(date);
  return 229.18 * (0.000075
    + 0.001868 * Math.cos(g)
    - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g)
    - 0.040849 * Math.sin(2 * g));
}

// Solar declination in degrees, NOAA series.
function solarDeclinationDeg(date) {
  const g = fractionalYear(date);
  const rad = 0.006918
    - 0.399912 * Math.cos(g)
    + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g)
    + 0.00148 * Math.sin(3 * g);
  return rad * 180 / Math.PI;
}

// Normalize longitude to [-180, 180).
function normLon(lon) {
  let x = ((lon + 180) % 360 + 360) % 360 - 180;
  return x;
}

// Apparent (or mean, if useEoT=false) solar time in hours [0,24) at a
// longitude (degrees, east positive) at a UTC instant.
function solarTimeHours(lonDeg, date, useEoT) {
  const eotH = useEoT ? equationOfTimeMin(date) / 60 : 0;
  let h = utcHoursOfDay(date) + lonDeg / 15 + eotH;
  return ((h % 24) + 24) % 24;
}

// The band where solar time is inside the target minute:
// returns {west, widthDeg} with west in [-180,180); the band is
// [west, west + widthDeg] going east (may wrap past +180).
// West edge is where solar time is exactly target (HH:MM:00).
function bandWestEdge(date, targetHours, useEoT) {
  const eotH = useEoT ? equationOfTimeMin(date) / 60 : 0;
  const west = normLon(15 * (targetHours - utcHoursOfDay(date) - eotH));
  return { west: west, widthDeg: 0.25 };
}

// Subsolar point: declination latitude; longitude where solar time = 12:00.
function subsolarPoint(date, useEoT) {
  const eotH = useEoT ? equationOfTimeMin(date) / 60 : 0;
  return {
    lat: solarDeclinationDeg(date),
    lon: normLon(15 * (12 - utcHoursOfDay(date) - eotH))
  };
}

// Seconds of clock time until solar time at lonDeg next reaches targetHours.
// Solar time advances 1:1 with clock time except for EoT drift (< ~0.05%
// effect over a day); one refinement iteration accounts for it.
function secondsUntilSolarTime(lonDeg, date, targetHours, useEoT) {
  const now = solarTimeHours(lonDeg, date, useEoT);
  let deltaH = targetHours - now;
  if (deltaH < 0) deltaH += 24;
  let secs = deltaH * 3600;
  if (useEoT) {
    const later = new Date(date.getTime() + secs * 1000);
    const driftMin = equationOfTimeMin(later) - equationOfTimeMin(date);
    secs -= driftMin * 60; // EoT change adds directly to solar time
    if (secs < -60) secs += 86400;
  }
  return secs;
}
