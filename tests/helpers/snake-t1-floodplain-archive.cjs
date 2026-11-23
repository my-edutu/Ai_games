'use strict';
const BEGIN='      // BEGIN T1 FLOODPLAIN COURTYARD COLOR REBUILD\n';
const END='      // END T1 FLOODPLAIN COURTYARD COLOR REBUILD\n';
const ANCHOR='      // END R52 GROVE CANOPY SHADE\n';
function find(source){
  const a=source.indexOf(BEGIN),b=source.indexOf(END);
  if(a<0||b<=a||source.indexOf(BEGIN,a+1)>=0||source.indexOf(END,b+1)>=0)
    throw new Error('Expected exactly one reversible T1 floodplain court block');
  return {a,end:b+END.length,body:source.slice(a,b+END.length)};
}
function stripT1Floodplain(source){const {a,end}=find(source);return source.slice(0,a)+source.slice(end);}
function reapplyT1Floodplain(old,current){
  if(old.includes(BEGIN))throw new Error('The archived court already has T1');
  const anchor=old.includes(ANCHOR)?ANCHOR:'      // END R50 ORIGINAL QUARRY MINERAL WASH\n';
  if(old.split(anchor).length!==2)throw new Error('Original R52/R50 shade anchor must be unique');
  return old.replace(anchor,anchor+find(current).body);
}
module.exports={stripT1Floodplain,reapplyT1Floodplain};
