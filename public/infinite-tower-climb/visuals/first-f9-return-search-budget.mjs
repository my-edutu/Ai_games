// Cold source-earned Floor 8-to-9 crossing: the first live WebGL return
// cannot afford two unbounded, independent camera candidate ladders while
// the ORIGINAL steel, new roof and successor platform meshes are built.
// Spend the first returned frame on a few spread, safety-verified camera
// alternatives. Once WebGL really returns, the FULL original searches resume.
// No source simulation, physics, boss, collision or renderer evidence mutation.
export function firstF9ReturnedGatewaySearchBudget(source,held,lens,lastSubmitted,options={}) {
  if(source?.floor!==9 || source?.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !Number.isSafeInteger(source.tick) ||
     held?.runToken!==source.runToken || held.floor!==9 ||
     held.guardianGateRetained!==true ||
     held.verifiedObservedFloorAdvance!==true ||
     held.oldCapId!=='f8:cap' ||
     !Number.isSafeInteger(held.crossingTick) ||
     held.crossingTick>source.tick ||
     lens?.sourceBound!==true || lens.coldOriginalArch!==true ||
     lens.sourceTick!==source.tick ||
     lastSubmitted?.runToken!==source.runToken ||
     lastSubmitted.floor!==8 ||
     !Number.isSafeInteger(lastSubmitted.tick) ||
     lastSubmitted.tick>=source.tick ||
     options.camera!=='follow' || options.stale===true ||
     options.reducedMotion===true) return null;
  // The first frame still checks the live actor and physical occlusion for
  // each trial. The deferred alternatives are re-enabled by the genuine
  // successful frame's lastSubmitted.floor=9, not elapsed wall time.
  return Object.freeze({sourceBound:true,sourceTick:source.tick,
    deckTrialLimit:3,doorwayTrialLimit:2,
    limitation:'First cold F9 GPU-return priority, not proof of an improved native crossing'});
}
// Spread the finite proposals rather than choose three adjacent viewpoints:
// original and outer candidates remain available without spending the
// full first-return CPU budget. Never mutate the authoritative trial list.
export function sampleColdFirstReturnGatewayTrials(trials,limit) {
  if(!Array.isArray(trials))return [];
  if(!Number.isSafeInteger(limit)||limit<=0||trials.length<=limit)
    return trials;
  if(limit===1)return [trials[0]];
  const result=[];
  for(let i=0;i<limit;i++)
    result.push(trials[Math.round(i*(trials.length-1)/(limit-1))]);
  return result;
}
