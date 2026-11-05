'use strict';
// Byte-exact historical control for the real df113 serpent (Git blob c8af8e31).
// Later independent T2 pigment changes must not silently invalidate the
// original bend-allocation experiment or short-circuit real WebGL capture.
// Reconstruct only recognized source regions; preserve a cryptographic parent.
const crypto = require('node:crypto');
const blob = content => crypto.createHash('sha1')
  .update('blob ' + Buffer.byteLength(content) + '\0').update(content).digest('hex');
const previousBlob = 'c8af8e31e827cb50addabb2782f7f1f4e36faa12';
const oldPigment = "// BEGIN T2 BOTANICAL DORSAL PIGMENT\n        // The old entire transverse saddles made the animal resemble a\n        // yellow-striped toy at game distance. Retain the exact existing\n        // original scale relief and two sunlight anchors, but reveal deep\n        // jade between small asymmetrical leaf-shaped dorsal islands.\n        // All pigment is authored once in the same four pre-owned textures.\n        const spineMask = 1 - smooth(.095, .235, Math.abs(around - .25));\n        const leafWarp = .009 * Math.sin(around * 6.283 * 7 + along * 6.283 * 2)\n          + .006 * Math.sin(around * 6.283 * 11 - along * 6.283 * 5);\n        const leafHalfWidth = .045 + .043 * spineMask;\n        const leafCore = 1 - smooth(leafHalfWidth * .62, leafHalfWidth,\n          bandDistance + leafWarp);\n        const preservedGold = isHead\n          ? spineMask * (.25 + .75 * (1 - smooth(.045, .29, Math.abs(along - .76))))\n          : spineMask * leafCore;\n        const darkLeafScale = (1 - underside) * (1 - preservedGold)\n          * (.5 + .5 * Math.sin(along * 6.283 * 13 + around * 6.283 * 9))\n          * (.5 + .5 * Math.cos(around * 6.283 * 17 - along * 6.283 * 3));\n        const jadeR = (50 + mottling * 12 - edge * 16) * backLight;\n        const jadeG = (139 + mottling * 16 - edge * 23) * backLight;\n        const jadeB = (75 + mottling * 10 - edge * 13) * backLight;\n        const leafShadow = darkLeafScale * 12;\n        r = r * preservedGold + (jadeR - leafShadow) * (1 - preservedGold);\n        g = g * preservedGold + (jadeG - leafShadow * .72) * (1 - preservedGold);\n        b = b * preservedGold + (jadeB - leafShadow * .56) * (1 - preservedGold);\n        // END T2 BOTANICAL DORSAL PIGMENT\n";
function restoreBendParent(source) {
  const begin = '// BEGIN T2 CURVATURE-ALLOCATED BODY RINGS\n';
  const end = '// END T2 CURVATURE-ALLOCATED BODY RINGS\n';
  const i=source.indexOf(begin), j=source.indexOf(end);
  if(i<0||j<i||source.indexOf(begin,i+1)>=0||source.indexOf(end,j+1)>=0)
    throw new Error('T2 exact-source curvature bracket missing or ambiguous');
  let old=source.slice(0,i)+source.slice(j+end.length);
  const removed='      // Curvature budgets are fragment-local. Portal breaks cannot be used\n'+
    '      // as invented neighbors to round across a discontinuity.\n'+
    '      const overviewRings = lowDetail ? distributeSerpentBendRings(path) : null;\n';
  const updated='        const subdivisions = lowDetail ? overviewRings[s]\n'+
    '          : clamp(Math.ceil(segmentLength * 7), 2, 14);';
  const previous='        const subdivisions = clamp(Math.ceil(segmentLength * (lowDetail ? 3 : 7)), 2, 14);';
  if(old.split(removed).length!==2 || old.split(updated).length!==2)
    throw new Error('T2 exact-source curvature reversal drift');
  old=old.replace(removed,'').replace(updated,previous);
  const p='// BEGIN T2 BOTANICAL DORSAL PIGMENT\n',q='// END T2 BOTANICAL DORSAL PIGMENT\n';
  const s=old.indexOf(p),e=old.indexOf(q);
  if(s<0||e<s||old.indexOf(p,s+1)>=0||old.indexOf(q,e+1)>=0)
    throw new Error('T2 exact-source pigment bracket missing or ambiguous');
  old=old.slice(0,s)+oldPigment+old.slice(e+q.length);
  if(blob(old)!==previousBlob)throw new Error('Original exact Git source hash mismatch');
  return old;
}
module.exports={restoreBendParent,previousBlob,blob};
