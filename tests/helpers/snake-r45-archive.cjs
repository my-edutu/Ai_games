'use strict';
// Exact historical-source restoration only. For earlier visual comparisons,
// keep the R45 production animation in BOTH arms unless the predecessor is
// explicitly R45 or an older R39 build without the public anticipation scalar.
const originalTongue="    const tonguePhase = (time + 0.9) % 3.8;\n    const flick = tonguePhase > 3.35 ? Math.pow(Math.sin((tonguePhase - 3.35) / 0.45 * Math.PI), 0.65) : 0;\n    tongue.visible = !reduced && eaten < 0.04 && flick > 0.02;\n    tongue.scale.z = Math.max(0.04, flick);\n    tongue.rotation.y = Math.sin(time * 37) * 0.07;\n";
const begin='    // BEGIN R45 PUBLIC FOOD TONGUE INVESTIGATION\n';
const end='    // END R45 PUBLIC FOOD TONGUE INVESTIGATION\n';
function restorePreR45(source) {
  const first=source.indexOf(begin),last=source.indexOf(end,first+begin.length);
  if(first<0||last<0||source.indexOf(begin,first+begin.length)!==-1
    ||source.indexOf(end,last+end.length)!==-1) {
    throw new Error('Expected exactly one bounded R45 source replacement');
  }
  return source.slice(0,first)+originalTongue+source.slice(last+end.length);
}
module.exports={restorePreR45};
