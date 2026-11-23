'use strict';
// Unique one-section historical restoration. No expected historical SHA changes.
const PREVIOUS = "  let outward = normalize(portrait ? { x: 0.52, y: 0.85, z: 0.02 } : { x: 0.12, y: 0.77, z: 0.67 });\n";
const OPEN = "  // BEGIN R56 PORTRAIT OVERVIEW STAGING\n";
const CLOSE = "  // END R56 PORTRAIT OVERVIEW STAGING\n";
function restorePreR56Portrait(source) {
  const a = source.indexOf(OPEN), b = source.indexOf(CLOSE);
  if (a < 0 || b <= a || source.indexOf(OPEN, a + OPEN.length) !== -1 ||
      source.indexOf(CLOSE, b + CLOSE.length) !== -1)
    throw new Error('Expected one reversible R56 portrait camera insertion');
  return source.slice(0, a) + PREVIOUS + source.slice(b + CLOSE.length);
}
module.exports = { restorePreR56Portrait };
