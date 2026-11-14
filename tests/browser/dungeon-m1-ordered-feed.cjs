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

/**
 * Pure evidence pacing, NOT gameplay acceleration. Genuine ordered source
 * HTTP snapshots and their exact actually-rendered checksums are immutable.
 * On 2026-11-14 1,569 real source ticks separated first floor and defeat;
 * software WebGL failed at 420s while still delivering them IN ORDER.
 * Preserve 420s on ordinary chapters. Add 800ms for each remaining source
 * tick beyond 750, capped at 1.1m ms and the dedicated 33min job budget.
 */
function planOrganicCheckpointWait({fromIndex=NaN,toIndex=NaN}={}){
 if(!Number.isSafeInteger(fromIndex)||fromIndex<0||
  !Number.isSafeInteger(toIndex)||toIndex<fromIndex)
  throw new RangeError('Ordered non-negative original source indices required');
 return Math.min(1100000,420000+Math.max(0,toIndex-fromIndex-750)*800);
}
module.exports={createOrderedReplayFeed,describeOrganicCheckpoint,planOrganicCheckpointWait};

/**
 * Read-only checkpoint evidence for the real organic WebGL journey. A slow
 * software renderer can stall before its *rendered* Warden state even while
 * the complete seeded authoritative expedition exists. Report separately
 * whether its ORIGINAL sequential HTTP feed delivered the needed tick and
 * whether a genuine positive WebGL frame rendered that exact checksum.
 * Neither an expected checksum alone nor an unrendered source state passes.
 */
function describeOrganicCheckpoint({stage='',expectedIndex=NaN,
 expectedChecksum='',renderedChecksum=null,renderedFrame=0,feed=null}={}){
 const m=feed?.metrics?.();
 if(typeof stage!=='string'||!stage||!m||
  !Number.isSafeInteger(expectedIndex)||expectedIndex<0||
  expectedIndex>=m.total||!Number.isSafeInteger(m.lastDeliveredIndex)||
  typeof expectedChecksum!=='string'||!expectedChecksum)
  throw new RangeError('Original checkpoint index, source checksum and feed required');
 const delivered=m.lastDeliveredIndex>=expectedIndex;
 const frameValid=Number.isSafeInteger(renderedFrame)&&renderedFrame>0;
 const accepted=delivered&&frameValid&&renderedChecksum===expectedChecksum;
 const status=accepted?'EXACT_RENDERED_CHECKPOINT':
  delivered?'DELIVERED_NOT_RENDERED':'NOT_DELIVERED';
 return Object.freeze({stage,status,accepted,
  expectedSourceIndex:expectedIndex,expectedChecksum,
  latestDeliveredIndex:m.lastDeliveredIndex,
  missingDeliveredSnapshots:Math.max(0,expectedIndex-m.lastDeliveredIndex),
  renderedFrame:frameValid?renderedFrame:null,
  renderedChecksum:typeof renderedChecksum==='string'?renderedChecksum:null,
  source:'real-DungeonRuntime-step-ordered-feed-and-original-WebGL-frame',
  noFabricatedTraversal:true});
}
