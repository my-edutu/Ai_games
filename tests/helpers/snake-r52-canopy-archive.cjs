'use strict';
// Historical SHA assertions must compare the exact dated source, not later art.
// New and old render arms keep R52 unless intentionally comparing this round.
const START = "      // BEGIN R52 GROVE CANOPY SHADE\n";
const END = "      // END R52 GROVE CANOPY SHADE\n";
function stripR52Canopy(source) {
  const a=source.indexOf(START), b=source.indexOf(END);
  if (a<0||b<=a||source.indexOf(START,a+1)>=0||source.indexOf(END,b+1)>=0)
    throw new Error('Expected exactly one reversible R52 original canopy block');
  return source.slice(0,a)+source.slice(b+END.length);
}
function reapplyR52Canopy(archived,current) {
  if(archived.includes(START))throw new Error('Already has R52 art');
  const a=current.indexOf(START),b=current.indexOf(END);
  if(a<0||b<=a||current.indexOf(START,a+1)>=0)throw new Error('Cannot find unique R52 source');
  const anchor='      // END R50 ORIGINAL QUARRY MINERAL WASH\n';
  if(archived.split(anchor).length!==2)throw new Error('Missing unique R50 shade anchor');
  return archived.replace(anchor,anchor+current.slice(a,b+END.length));
}
module.exports={stripR52Canopy,reapplyR52Canopy};
