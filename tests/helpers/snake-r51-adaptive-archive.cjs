'use strict';
const {stripR53Startup}=require('./snake-r53-startup-archive.cjs');
// Reconstruct byte-exact R50 renderer for historical SHA controls and
// matched-source WebGL comparisons. Every R51 change is delimited once.
const names = ['RESCUE PIXEL RATIO','RESCUE STATE','RESCUE CONTROL',
  'RESCUE STATS','RESCUE VISIBILITY RESET'];
function stripR51Adaptive(source) {
  source=stripR53Startup(source);
  const counts = names.map(name => source.split('// BEGIN R51 ' + name + '\n').length - 1);
  if (counts.every(count => count === 0)) return source;
  if (counts.some(count => count !== 1)) throw Error('Incomplete R51 renderer archive');
  let text = source;
  for (const name of names) {
    const begin = '// BEGIN R51 ' + name + '\n', end = '// END R51 ' + name + '\n';
    const at = text.indexOf(begin), endAt = text.indexOf(end, at);
    if (at < 0 || endAt < at || text.indexOf(begin, at+1) >= 0)
      throw Error('R51 renderer archive block mismatch: ' + name);
    const lineStart = text.lastIndexOf('\n', at - 1) + 1;
    text = text.slice(0, lineStart) + text.slice(endAt + end.length);
  }
  return text;
}
module.exports = { stripR51Adaptive };
