// P0 same physical F8->F9 gateway/roof/environment owner. The previously
// source-verified old gate can outlive an incoming cold WebGL shaft upload;
// a monotonically cooled distant-sky lease must NOT recolor that still
// returned real doorway to a completely different room in one frame.
// This pure policy never grants a floor, victory, collision or GPU evidence.
const clamp=x=>Math.max(0,Math.min(1,x));
export function sourceSynchronizedHorizonWeight(source,oldWeightBeforeVoid,
    earnedVoidSkyMaxOldWeight,certifiedHorizon,returnedSuccessor=null) {
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
  const sameRoom=Math.max(ordinary,Math.min(old,certifiedHorizon.oldWeight));
  // Original 1x native film from immutable 0420b5c: Floor 9 HUD at
  // 26.5s desktop / 26.0s portrait, but the distant Void world did not
  // settle until 30.0s / 29.75s. The 42%-only ambient cooling ceiling
  // kept the world majority-bronze after real F9 geometry had appeared,
  // then snapped to purple when the old source material finally retired.
  //
  // The Scene owns a monotone, run-scoped distant atmosphere lease; ONLY
  // returned WebGL frames that observedSourceEarnedVoidHorizon verifies
  // against real HP0 guardian, walkable F9 flight/support and renderer
  // duration can spend that lease. Do not REWARM an already-earned distant
  // lease when a GPU stall or later source tick removes the live receipt.
  // The original bronze gate, 3D roof, guardian tells and gameplay authority
  // retain their independent World/source-owned materials and mechanics.
  const returnedNow=returnedSuccessor?.sourceBound===true &&
    returnedSuccessor.runToken===source.runToken &&
    returnedSuccessor.sourceTick===source.tick &&
    Number.isSafeInteger(returnedSuccessor.firstBearingReturnedFrames) &&
    returnedSuccessor.firstBearingReturnedFrames>=2 &&
    returnedSuccessor.firstBearingReturnedFrames<=30 &&
    Number.isFinite(returnedSuccessor.maxOldHorizonWeight) &&
    returnedSuccessor.maxOldHorizonWeight>=0 &&
    returnedSuccessor.maxOldHorizonWeight<=1;
  // The returned F9 bearing is a valid *destination* witness, but it is
  // not authority to repaint a still-source-certified Clockwork room purple
  // before the real old gateway, roof and retained steel have receded.
  // Match the SAME current-tick World material receipt. A previously cooled
  // monotone lease remains the hard upper bound: this NEVER rewarmed sky.
  const matchedOriginalMaterial=returnedNow
    ?Math.min(old,certifiedHorizon.oldWeight):0;
  const distantOldBound=returnedNow
    ?Math.min(distant,Math.max(returnedSuccessor.maxOldHorizonWeight,
        matchedOriginalMaterial)):distant;
  return Math.min(sameRoom,distantOldBound);
}

// A second, often-overlooked cause of the native F8->F9 hard cut: the
// independent distant-sky lease was spent down by returned Void bearings
// while the SAME physically returned doorway and World materials were still
// source-certified bronze. Clamp the one-way sky spend to genuine old-room
// coverage before it enters the monotone lease. This never invents a frame,
// changes gameplay, or rewinds an already cooled atmosphere.
export function sourceReturnedSkyLeaseMaxOld(source,previous,returned,certified,oldRoomWeight) {
  if(!Number.isFinite(previous)||previous<0||previous>1)return 0;
  if(source?.floor!==9 || source.theme!=='void' ||
    source.lifecycle!=='running' || !(source.player?.health>0) ||
    typeof source.runToken!=='string' || !source.runToken ||
    !Number.isSafeInteger(source.tick) ||
    returned?.sourceBound!==true ||
    returned.runToken!==source.runToken ||
    returned.sourceTick!==source.tick ||
    !Number.isSafeInteger(returned.firstBearingReturnedFrames) ||
    returned.firstBearingReturnedFrames<2 ||
    returned.firstBearingReturnedFrames>30 ||
    !Number.isFinite(returned.maxOldHorizonWeight) ||
    returned.maxOldHorizonWeight<0 || returned.maxOldHorizonWeight>1)
    return previous;
  const kind=certified?.kind;
  const sameMaterial=certified?.sourceBound===true &&
    certified.sourceTick===source.tick &&
    Number.isFinite(certified.oldWeight) &&
    certified.oldWeight>=0 && certified.oldWeight<=1 &&
    Number.isFinite(oldRoomWeight) && oldRoomWeight>=0 && oldRoomWeight<=1 &&
    (kind==='physically-supported-returned-old-and-new-shaft' ||
      (kind==='live-same-run-physical-gateway' &&
        certified.historicalOpticalTail===false) ||
      (kind==='previous-certified-returned-material' &&
        certified.historicalOpticalTail===true));
  const actuallyReturnedOldMaterial=sameMaterial
    ?Math.min(certified.oldWeight,oldRoomWeight):0;
  return Math.min(previous,Math.max(returned.maxOldHorizonWeight,
    actuallyReturnedOldMaterial));
}
