'use strict';
// REAL browser HTTP polling consumes immutable true authority steps, in order.
// Reviewer checkpoints hold actual snapshots; they never invent game outcomes.
function createOrderedReplayFeed(snapshots){
 if(!Array.isArray(snapshots)||!snapshots.length)throw new TypeError('Nonempty real authority snapshots required');
 let ceiling=0,next=0,requests=0,holds=0,last=-1;
 const delivered=new Set();
 return Object.freeze({
  allowThrough(index){
   if(!Number.isSafeInteger(index)||index<ceiling||index>=snapshots.length)
    throw new RangeError('Milestone gate must advance within the true expedition');
   ceiling=index;
  },
  pull(){
   const index=Math.min(next,ceiling);
   if(index<last)throw new Error('Authority snapshot replay regressed');
   if(index===ceiling)holds++;
   delivered.add(index);last=index;requests++;
   if(next<ceiling)next++;
   return {index,snapshot:snapshots[index]};
  },
  metrics(){return {requests,uniqueDelivered:delivered.size,lastDeliveredIndex:last,
   total:snapshots.length,heldRequests:holds,
   pace:'real browser /dungeon/state polling with milestone holds'};}
 });
}
module.exports={createOrderedReplayFeed};
