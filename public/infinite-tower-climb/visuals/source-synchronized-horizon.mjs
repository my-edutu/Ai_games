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
     certifiedHorizon.sourceTick!==source.tick ||
     !Number.isFinite(certifiedHorizon.oldWeight) ||
     certifiedHorizon.oldWeight<0 || certifiedHorizon.oldWeight>1)
    return ordinary;
  // The World GPU owner has THREE distinct genuinely qualified old-room
  // paint receipts. The original far-side route was already protected, but
  // the live source-crossing and previously returned material-tail receipts
  // were wrongly treated as "ordinary" distant sky. After an early real
  // Void bearing return, that monotone sky lease reaches zero WHILE the
  // current already-rendered roof/gate and the original stone/steel are
  // still bronze. This paints one physical threshold as two unrelated rooms.
  // Never let distant Void cooling overrule any of the SAME World-owned,
  // current-tick, source/return-validated material receipts. The tail was
  // validated against the frozen guardian/run and finite returned-frame age
  // by observedCertifiedClockworkHorizon before it reached this function.
  // No source receipt => no warm scene, fake crossing, or extra GPU clock.
  const kind=certifiedHorizon.kind;
  const earnedFarSide=kind==='physically-supported-returned-old-and-new-shaft';
  const liveGate=kind==='live-same-run-physical-gateway' &&
    certifiedHorizon.historicalOpticalTail===false;
  const returnedTail=kind==='previous-certified-returned-material' &&
    certifiedHorizon.historicalOpticalTail===true;
  if(!earnedFarSide && !liveGate && !returnedTail)return ordinary;
  return Math.max(ordinary,Math.min(old,certifiedHorizon.oldWeight));
}
