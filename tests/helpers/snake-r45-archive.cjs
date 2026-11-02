'use strict';
// Exact historical-source restoration only. For earlier visual comparisons,
// keep the R45 production animation in BOTH arms unless the predecessor is
// explicitly R45 or an older R39 build without the public anticipation scalar.
const originalTongue="    const tonguePhase = (time + 0.9) % 3.8;\n    const flick = tonguePhase > 3.35 ? Math.pow(Math.sin((tonguePhase - 3.35) / 0.45 * Math.PI), 0.65) : 0;\n    tongue.visible = !reduced && eaten < 0.04 && flick > 0.02;\n    tongue.scale.z = Math.max(0.04, flick);\n    tongue.rotation.y = Math.sin(time * 37) * 0.07;\n";
const begin='    // BEGIN R45 PUBLIC FOOD TONGUE INVESTIGATION\n';
const end='    // END R45 PUBLIC FOOD TONGUE INVESTIGATION\n';
// Older SHA controls must not accidentally contain later R48 acting.
const round48 = /^[ \t]*\/\/ BEGIN R48 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R48 [^\n]*\n/gm;
// T2 original pigment is deliberately preserved in both rendered old/new
// animation arms. Remove only its exact bounded section from historical
// Git-SHA audits dating before the new botanical skin. Do not alter the
// archived expected SHA or the historical pose/geometry comparison.
const t2Skin = /^[ \t]*\/\/ BEGIN T2 BOTANICAL DORSAL PIGMENT\n[\s\S]*?^[ \t]*\/\/ END T2 BOTANICAL DORSAL PIGMENT\n/gm;
function restorePreT2Skin(source) {
  if ((source.match(t2Skin) || []).length !== 1) throw new Error('Expected exactly one reversible T2 skin block');
  return source.replace(t2Skin, '');
}
// Only historical source SHA provenance omits R55's five bounded blocks.
// Real contemporary before/after renders keep all other later character work.
const round55 = /^[ \t]*\/\/ BEGIN R55 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R55 [^\n]*\n/gm;
function restorePreR55(source) {
  if ((source.match(round55) || []).length !== 5) throw new Error('Expected five bounded R55 additions');
  return restorePreT2Skin(source.replace(round55, ''));
}
function restorePreR48(source) {
  source = restorePreR55(source);
  if ((source.match(round48) || []).length !== 2) throw new Error('Expected two bounded R48 sections');
  return source.replace(round48, '');
}
function restorePreR45(source) {
  source = restorePreR48(source);
  const first=source.indexOf(begin),last=source.indexOf(end,first+begin.length);
  if(first<0||last<0||source.indexOf(begin,first+begin.length)!==-1
    ||source.indexOf(end,last+end.length)!==-1) {
    throw new Error('Expected exactly one bounded R45 source replacement');
  }
  return source.slice(0,first)+originalTongue+source.slice(last+end.length);
}
module.exports={restorePreR45,restorePreR48,restorePreR55,restorePreT2Skin};
