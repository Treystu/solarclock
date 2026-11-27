// Test: shipped solar.js vs NOAA reference values (from the Astra pack,
// computed independently by the sending seat from NOAA formulas).
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/solar.js', 'utf8'));

const refs = [
  // [ISO instant, true doy, EoT ref (min), decl ref (deg)]
  ['2026-01-01T12:00:00Z', 1, -2.90, -23.06],
  ['2026-02-11T12:00:00Z', 42, -14.20, -14.29],
  ['2026-03-20T12:00:00Z', 79, -8.16, -0.46],
  ['2026-06-21T12:00:00Z', 172, -1.33, 23.45],
  ['2026-11-03T12:00:00Z', 307, 16.37, -14.83],
  ['2026-11-27T12:00:00Z', 331, 11.94, -21.07],
];

console.log('date        doy ok  EoT code  EoT ref  err(min)  decl code  decl ref  err(deg)');
let worst = 0;
for (const [iso, doy, eotRef, declRef] of refs) {
  const d = new Date(iso);
  const eot = equationOfTimeMin(d);
  const decl = solarDeclinationDeg(d);
  const err = eot - eotRef;
  worst = Math.max(worst, Math.abs(err));
  console.log(`${iso.slice(0, 10)}  ${dayOfYearUTC(d) === doy ? 'yes' : 'NO'}     ` +
    `${eot.toFixed(2).padStart(7)} ${eotRef.toFixed(2).padStart(8)}  ${err >= 0 ? '+' : ''}${err.toFixed(2)}     ` +
    `${decl.toFixed(2).padStart(7)} ${declRef.toFixed(2).padStart(8)}   ${(decl - declRef >= 0 ? '+' : '') + (decl - declRef).toFixed(2)}`);
}
console.log('worst EoT error (min):', worst.toFixed(3));

// Full apparent solar time check: 2026-11-27T22:05:43Z at Pahoa lon.
// Reference ~11:57:53 (Astra pack, before rise/set-only terms).
const d = new Date('2026-11-27T22:05:43Z');
const ast = solarTimeHours(-154.944005, d, true);
const hh = Math.floor(ast), mm = Math.floor((ast - hh) * 60), ss = Math.floor(((ast - hh) * 60 - mm) * 60);
console.log(`AST Pahoa 2026-11-27T22:05:43Z: ${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} (ref ~11:57:53)`);
console.log(`EoT at that instant: ${equationOfTimeMin(d).toFixed(2)} min`);

// Band edges at that same instant (target 16:20 apparent):
const b = bandWestEdge(d, 16 + 20 / 60, true);
console.log(`Band west edge: ${b.west.toFixed(4)} deg, east edge: ${normLon(b.west + 0.25).toFixed(4)} deg`);
// Independent check: solar time at west edge must be exactly 16:20:00.
console.log(`AST at west edge: ${solarTimeHours(b.west, d, true).toFixed(6)} h (target ${(16 + 20 / 60).toFixed(6)})`);
console.log(`AST at east edge: ${solarTimeHours(normLon(b.west + 0.25), d, true).toFixed(6)} h (target ${(16 + 21 / 60).toFixed(6)})`);
// Seconds until 16:20 at Pahoa from that instant (AST 11:57:5x -> ~4h22m):
console.log(`Seconds until 16:20 at Pahoa: ${secondsUntilSolarTime(-154.944005, d, 16 + 20 / 60, true).toFixed(1)}`);
