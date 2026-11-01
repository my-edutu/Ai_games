'use strict';
// Reconstruct the byte-exact pre-R47 source for an authentic browser A/B.
// Refuse drift/duplicate markers instead of silently comparing wrong versions.
function removeBlock(s,name,replacement='') {
  const begin='// BEGIN R47 '+name, end='// END R47 '+name;
  const a=s.indexOf(begin),b=s.indexOf(end);
  if(a<0||b<a||s.indexOf(begin,a+1)!==-1||s.indexOf(end,b+1)!==-1)
    throw new Error('R47 source archive mismatch: '+name);
  const line=s.lastIndexOf('\n',a-1)+1,after=s.indexOf('\n',b);
  if(after<0)throw new Error('R47 source block missing trailing line: '+name);
  return s.slice(0,line)+replacement+s.slice(after+1);
}
function restorePreR47(source){
  const originalGate='    if (button.hidden !== !visible) button.hidden = !visible;\n    if (!visible || !snapshot || !context) return;\n';
  return removeBlock(removeBlock(removeBlock(source,'HIDDEN BEFORE PUBLIC FRAME'),
    'PUBLIC REVISION CACHE'),'UPDATE ON PUBLIC REVISION',originalGate);
}
module.exports={restorePreR47};
