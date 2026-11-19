// P0 same physical F8->F9 gateway/roof/environment owner. The previously
// source-verified old gate can outlive an incoming cold WebGL shaft upload;
// a monotonically cooled distant-sky lease must NOT recolor that still
// returned real doorway to a completely different room in one frame.
// This pure policy never grants a floor, victory, collision or GPU evidence.
const clamp=x=>Math.max(0,Math.min(1,x));
export function sourceSynchronizedHorizonWeight(source,oldWeightBeforeVoid,
    earnedVoidSkyMaxOldWeight,certifiedHorizon) {
  if(!Number.isFinite(oldWeightBeforeVoid) ||
      !Number.isFinite(earnedVoidSkyMaxOldWeight))return 0;
  const old=clamp(oldWeightBeforeVoid);
  const distant=clamp(earnedVoidSkyMaxOldWeight);
  const ordinary=Math.min(old,distant);
  // Only the CURRENT authentic same-run far-side world certificate can
  // keep the warm 3D room alive. In particular, an arbitrary floor counter,
  // historical success, a new run, stale snapshot or sky-only lease cannot.
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !Number.isSafeInteger(source.tick) ||
     certifiedHorizon?.sourceBound!==true ||
     certifiedHorizon.kind!=='physically-supported-returned-old-and-new-shaft' ||
     certifiedHorizon.sourceTick!==source.tick ||
     !Number.isFinite(certifiedHorizon.oldWeight))return ordinary;
  return Math.max(ordinary,Math.min(old,clamp(certifiedHorizon.oldWeight)));
}
