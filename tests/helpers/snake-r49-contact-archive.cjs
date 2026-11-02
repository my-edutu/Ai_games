'use strict';
const { stripR51Adaptive } = require('./snake-r51-adaptive-archive.cjs');
// An optional, exact-source R49 layer for historical renderer A/B controls.
// Complete old source is recovered by removing only these three additions.
const names = ['CONTACT POSE BASELINE', 'CONTACT POSE COMPARE', 'CONTACT POSE UPLOAD GATE'];
function stripR49Contact(source) {
  source = stripR51Adaptive(source);
  const counts = names.map(name => source.split('// BEGIN R49 ' + name + '\n').length - 1);
  if (counts.every(count => count === 0)) return source;
  if (counts.some(count => count !== 1)) throw new Error('Incomplete R49 renderer archive');
  let result = source;
  for (const name of names) {
    const begin = '  // BEGIN R49 ' + name + '\n';
    const end = '  // END R49 ' + name + '\n';
    const start = result.indexOf(begin), finish = result.indexOf(end);
    if (start < 0 || finish < start || result.indexOf(begin, start + 1) >= 0) {
      throw new Error('R49 renderer archive block mismatch: ' + name);
    }
    // The compare block is indented six spaces, unlike the other two.
    const blockStart = result.lastIndexOf('\n', start - 1) + 1;
    result = result.slice(0, blockStart) + result.slice(finish + end.length);
  }
  return result;
}
module.exports = { stripR49Contact };
