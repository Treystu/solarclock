// Solar math core for "It's 16:20 Somewhere" — v2, Julian-centuries method.
// solarPosition() below is copied verbatim from the accuracy-fixed
// Treystu/solarclock (commit 74d6ffc): NOAA / Meeus solar position from
// Julian centuries. Equation of Time and declination come from the true
// apparent solar longitude — no fractional-year fit, no day-of-year table.
// Apparent solar time = UTC + longitude x 4 min + Equation of Time.
// No refraction/elevation clock terms: those affect rise/set only.
// This file is inlined byte-identical into index.html by build.py.

function solarPosition(date) {
    const julianDay = date.getTime() / 86400000 + 2440587.5;
    const T = (julianDay - 2451545.0) / 36525; // Julian centuries since J2000.0
    const deg = Math.PI / 180;

    // Geometric mean longitude of the Sun (degrees)
    let L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
    L0 = ((L0 % 360) + 360) % 360;
    // Geometric mean anomaly (degrees)
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    // Eccentricity of Earth's orbit
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    // Sun's equation of center (degrees)
    const C = Math.sin(M * deg) * (1.914602 - T * (0.004817 + 0.000014 * T))
            + Math.sin(2 * M * deg) * (0.019993 - 0.000101 * T)
            + Math.sin(3 * M * deg) * 0.000289;
    // Apparent longitude (degrees), corrected for nutation / aberration
    const omega = 125.04 - 1934.136 * T;
    const lambda = (L0 + C) - 0.00569 - 0.00478 * Math.sin(omega * deg);
    // Obliquity of the ecliptic, corrected (degrees)
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * deg);

    // Equation of Time (minutes): Meeus / NOAA GML formulation
    const y = Math.pow(Math.tan((eps / 2) * deg), 2);
    const eotRad = y * Math.sin(2 * L0 * deg)
        - 2 * e * Math.sin(M * deg)
        + 4 * e * y * Math.sin(M * deg) * Math.cos(2 * L0 * deg)
        - 0.5 * y * y * Math.sin(4 * L0 * deg)
        - 1.25 * e * e * Math.sin(2 * M * deg);
    const eqTime = 4 * eotRad / deg; // radians -> degrees -> minutes of time (4 min/deg)

    // Declination (radians)
    const declination = Math.asin(Math.sin(eps * deg) * Math.sin(lambda * deg));

    return { eqTime, declination };
}

// Equation of Time in minutes. Sign convention: apparent = mean + EoT.
function equationOfTimeMin(date) {
  return solarPosition(date).eqTime;
}

// Solar declination in degrees.
function solarDeclinationDeg(date) {
  return solarPosition(date).declination * 180 / Math.PI;
}

function utcHoursOfDay(date) {
  return date.getUTCHours() + date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000;
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
// West edge is where solar time is exactly target (HH:MM:00);
// solar time increases eastward, so the minute unfolds east of the line.
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
// Solar time advances 1:1 with clock time except for EoT drift; one
// refinement iteration accounts for it.
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
