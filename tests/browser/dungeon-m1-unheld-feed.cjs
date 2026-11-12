'use strict';
// Genuine ordered DungeonRuntime snapshots, delivered at the real spectator's
// own network-poll cadence. Preparation may repeat the entry state BEFORE
// recording; after begin() no milestone, attack or result may be held.
function createUnheldAuthorityFeed(snapshots){
 if(!Array.isArray(snapshots)||snapshots.length<2||snapshots.some(s=>typeof s?.checksum!=='string'))
  throw new TypeError('Nonempty authentic checksummed authority trace required');
 let started=false,index=0,prepHolds=0,terminalHolds=0,requests=0;
 const delivered=new Set();
 return Object.freeze({
  begin(){if(started)throw new Error('Unheld stream already running');started=true;},
  pull(){
   if(!started){prepHolds++;return {index:0,snapshot:snapshots[0]};}
   const i=Math.min(index,snapshots.length-1);
   delivered.add(i);requests++;
   if(index<snapshots.length)index++;
   else terminalHolds++;
   return {index:i,snapshot:snapshots[i]};
  },
  metrics(){return Object.freeze({started,requests,uniqueDelivered:delivered.size,
   lastDeliveredIndex:Math.min(index-1,snapshots.length-1),total:snapshots.length,
   prepHolds,terminalHolds,intermediateHolds:0,
   policy:'unheld real browser polling, one authentic consecutive tick per request'});}
 });
}
module.exports={createUnheldAuthorityFeed};
