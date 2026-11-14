// Lean source-owned presentation witness. Full forensic passage diagnostics
// stay available on demand; the normal frame never builds those nested reports.
// This is observational only: no enemy, floor, camera, or actor is advanced.
export function towerPassageLiveWitness(s) {
  const active=s?.active===true;
  const stage=typeof s?.stage==='string'?s.stage:'idle';
  const handoff=active && stage==='handoff' && s.continuousGroundedHandoff===true;
  const f=s?.focus;
  const focus=active && f &&
    [f.x,f.y,f.z].every(Number.isFinite) ? [f.x,f.y,f.z] : null;
  return {
    sourceBound:true,
    active,stage,runToken:s?.runToken??null,floor:s?.floor??null,
    sourceTick:s?.sourceTick??-1,ageSeconds:s?.ageSeconds??0,
    durationSeconds:s?.durationSeconds??0,
    handoffSubmittedFrames:s?.handoffSubmittedFrames??0,
    handoffDisplaySeconds:s?.handoffDisplaySeconds??0,
    handoffVisibleWindowSeconds:s?.handoffVisibleWindowSeconds??0,
    continuousGroundedHandoff:handoff,
    exteriorMemoryFrameVisible:active && s?.exteriorMemoryFrameVisible===true,
    innerDoorAssemblyVisible:active && s?.innerDoorAssemblyVisible===true,
    sourceMeasuredApproachOpen:s?.sourceMeasuredApproachOpen??0,
    inlayProgress:s?.inlayProgress??0,
    inlaySourceTick:s?.inlaySourceTick??-1,
    focusPosition:focus,
  };
}
