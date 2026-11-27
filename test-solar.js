// Tests for solar.js v2 (Julian-centuries solarPosition, copied from the
// accuracy-fixed Treystu/solarclock@74d6ffc). Run: node test-solar.js
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/solar.js', 'utf8'));

let fails = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : ''));
  if (!ok) fails++;
}

// Published 2026 EoT extremes (solarposition.org, via the fix seat's
// verification): min -14.2 min on Feb 11, max +16.5 min on Nov 3.
const eotFeb = equationOfTimeMin(new Date('2026-02-11T12:00:00Z'));
const eotNov = equationOfTimeMin(new Date('2026-11-03T12:00:00Z'));
check('EoT Feb 11 2026 ~ -14.226', Math.abs(eotFeb - -14.226) < 0.01, eotFeb.toFixed(3));
check('EoT Nov 3 2026 ~ +16.492', Math.abs(eotNov - 16.492) < 0.01, eotNov.toFixed(3));
check('EoT Feb 11 within 0.1 of published -14.2', Math.abs(eotFeb - -14.2) < 0.1);
check('EoT Nov 3 within 0.1 of published +16.5', Math.abs(eotNov - 16.5) < 0.1);

// Full-path: apparent solar time at Pahoa at the Astra test instant.
// The fixed solarclock displays 11:58:11.
const d = new Date('2026-11-27T22:05:43Z');
const ast = solarTimeHours(-154.944005, d, true);
const astSec = ast * 3600;
check('AST Pahoa 2026-11-27T22:05:43Z ~ 11:58:11', Math.abs(astSec - (11 * 3600 + 58 * 60 + 11)) <= 1,
  'got ' + ast.toFixed(6) + ' h');

// Declination at solstices.
const declJun = solarDeclinationDeg(new Date('2026-06-21T12:00:00Z'));
const declDec = solarDeclinationDeg(new Date('2026-12-21T12:00:00Z'));
check('Declination Jun 21 ~ +23.44', Math.abs(declJun - 23.44) < 0.05, declJun.toFixed(2));
check('Declination Dec 21 ~ -23.44', Math.abs(declDec - -23.44) < 0.05, declDec.toFixed(2));

// Band self-consistency: solar time at the west edge is exactly the
// target; at the east edge exactly one minute later. Both modes,
// including year boundary and leap day.
for (const iso of ['2026-11-27T22:05:43Z', '2026-06-21T03:00:00Z', '2026-12-31T23:59:30Z', '2028-02-29T12:00:00Z']) {
  const t = new Date(iso);
  for (const useEoT of [true, false]) {
    const b = bandWestEdge(t, 16 + 20 / 60, useEoT);
    const w = solarTimeHours(b.west, t, useEoT);
    const e = solarTimeHours(normLon(b.west + 0.25), t, useEoT);
    check(`band edges ${iso} EoT=${useEoT}`,
      Math.abs(w - (16 + 20 / 60)) < 1e-9 && Math.abs(e - (16 + 21 / 60)) < 1e-9,
      `west=${b.west.toFixed(4)}`);
  }
}

console.log(fails === 0 ? 'ALL PASS' : fails + ' FAILURES');
process.exit(fails === 0 ? 0 : 1);
