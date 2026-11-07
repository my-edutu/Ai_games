'use strict';
// Bounded accumulation of overlapping original-host 50ms source pages.
// A 110-second sliding host window must not erase the early genuine
// guardian episode before a 180-second uninterrupted native video ends.
function createTowerFixedStepTraceCollector(limit=5200) {
  if(!Number.isSafeInteger(limit)||limit<2)throw new RangeError('trace limit');
  const ticks=[],seen=new Map();
  let duplicates=0,conflicts=0,invalid=0,outOfOrder=0,missing=0,evicted=0;
  const key=s=>s.runToken+':'+s.tick+':'+s.lifecycle;
  function add(page){
    if(!Array.isArray(page))return;
    for(const s of page){
      if(!s||!Number.isFinite(s.atMs)||!Number.isSafeInteger(s.tick)||
        s.tick<0||!Number.isSafeInteger(s.floor)||s.floor<0||
        typeof s.runToken!=='string'||!s.runToken||
        typeof s.lifecycle!=='string'||!s.lifecycle){invalid++;continue;}
      const id=key(s);
      if(seen.has(id)){
        duplicates++;
        if(seen.get(id)!==(s.checksum??null))conflicts++;
        continue;
      }
      const previous=ticks[ticks.length-1];
      if(previous&&(s.atMs<previous.atMs||
        (s.runToken===previous.runToken&&s.tick<previous.tick))){
        outOfOrder++;continue;
      }
      if(previous&&s.runToken===previous.runToken&&s.tick>previous.tick+1)
        missing+=s.tick-previous.tick-1;
      ticks.push(s);seen.set(id,s.checksum??null);
      if(ticks.length>limit){
        const oldest=ticks.shift();seen.delete(key(oldest));evicted++;
      }
    }
  }
  return{add,snapshot:()=>ticks.slice(),status:()=>({
    ticksRetained:ticks.length,duplicates,conflicts,invalid,outOfOrder,
    missingFixedSteps:missing,evicted,
    uninterruptedTrace:invalid===0&&conflicts===0&&outOfOrder===0&&
      missing===0&&evicted===0,
    videoVerdict:'NOT EVALUATED',
  })};
}
module.exports={createTowerFixedStepTraceCollector};
