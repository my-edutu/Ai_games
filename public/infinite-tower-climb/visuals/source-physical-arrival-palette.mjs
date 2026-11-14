// Physically owned Clockwork -> Void entrance palette. This is not a floor
// transition or a new route: every shade follows an already-observed genuine
// zero-HP guardian, the original cap/roof and the living player on F9.
// Source distance, not the browser clock or slow WebGL submissions, controls
// how the original bronze engineering becomes the next biome's violet metal.
import { observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
const valid=Number.isSafeInteger;
const clamp01=n=>Math.min(1,Math.max(0,n));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t);};

export function observedSourcePhysicalArrivalPalette(source,held=null) {
  const p=source?.player, w=source?.lastGuardianCrossing;
  if(!source || !p || source.lifecycle!=='running' ||
     source.floor!==9 || source.theme!=='void' ||
     typeof source.runToken!=='string' || !source.runToken ||
     !(p.health>0) || !valid(source.tick) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     !Array.isArray(source.platforms))return null;
  const ground=source.platforms.find(item=>item?.id==='f9:ground');
  if(!ground || ![ground.x,ground.y,ground.width,ground.height].every(valid) ||
     ground.width<=0 || ground.height<=0)return null;
  let crossingX,roofY,sourceTick,kind;
  if(w!=null){
    const cap=w.cap,guardian=w.guardian;
    if(w.runToken!==source.runToken || w.fromFloor!==8 ||
       w.toFloor!==9 || cap?.id!=='f8:cap' ||
       guardian?.kind!=='guardian' || guardian.active!==false ||
       !valid(guardian.health) || guardian.health>0 ||
       ![w.sourceTick,w.crossingX,w.exitX,w.halfWidth,w.halfHeight,
          cap.x,cap.y,cap.width,cap.height].every(valid) ||
       cap.width<=0 || cap.height<=0 ||
       w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
       w.exitX!==cap.x+Math.floor(cap.width*.76) ||
       w.crossingX<w.exitX || w.crossingX>w.exitX+60000 ||
       ground.y+ground.height!==cap.y+cap.height)return null;
    crossingX=w.crossingX;roofY=cap.y+cap.height;
    sourceTick=w.sourceTick;kind='recorded-source-zero-hp';
    // If the old GPU original is still held, it must be the SAME real roof,
    // not an unrelated decorative gate from a prior expedition.
    if(held && (held.runToken!==source.runToken ||
       held.floor!==9 || held.oldRoofY!==roofY ||
       held.thresholdX!==w.exitX))return null;
  } else {
    // The first portrait browser receipt may arrive BEFORE the immutable
    // HP-zero crossing record. Accept ONLY the already validated same-run
    // former cap and grounded source corridor; never infer a victory.
    if(!observedStagedOriginalCapBeforeRecordedCrossing(source,held) ||
       ![held?.observedCrossingX,held?.oldRoofY,held?.sourceTick].every(valid) ||
       ground.y+ground.height!==held.oldRoofY)return null;
    crossingX=held.observedCrossingX;roofY=held.oldRoofY;
    sourceTick=held.sourceTick;kind='verified-original-roof-receipt';
  }
  const sole=p.y-p.halfHeight,travel=p.x-crossingX,age=source.tick-sourceTick;
  if(!valid(sole) || !valid(travel) || !valid(age) || age<0 || age>70 ||
     travel<0 || travel>100000 ||
     sole<roofY-2500 || sole>roofY+160000 ||
     p.x-p.halfWidth<ground.x ||
     p.x+p.halfWidth>ground.x+ground.width ||
     !(p.grounded===false && p.state==='airborne' &&
         p.groundedPlatformId==null && Number.isFinite(p.vy) ||
       p.grounded===true && (p.state==='standing' || p.state==='hurt') &&
         p.vy===0 && sole===roofY &&
         (p.groundedPlatformId==='f9:ground' ||
          p.groundedPlatformId==='f8:cap')))return null;
  // The full-body climber remains warm at the actual old sill, and walks
  // through a 90m material transition into the existing next-floor palette.
  // This changes NO geometry, physics, inputs, tick, enemy or gameplay state.
  // The actual F9 grounded runway may end only ~1.5m beyond the boss
  // crossing. An old horizontal-only 9m tint corridor could therefore NEVER
  // complete during honest onward gameplay, then disappear abruptly when the
  // avatar jumped up the next platform. Use the current authoritative feet
  // in BOTH walk and ascent dimensions, in the same fixed source units.
  // This is a conservative straight-line displacement from the REAL old
  // sill (not fictitious distance walked or a simulated extra frame).
  const rise=Math.max(0,sole-roofY);
  const pathDisplacement=Math.hypot(travel,rise);
  const progress=smooth((pathDisplacement-6000)/84000);
  const oldWeight=1-progress;
  return {sourceBound:true,sourceTick:source.tick,crossingTick:sourceTick,
    kind,travel,rise,pathDisplacement,roofY,oldWeight,progress,
    limitation:'Verified original threshold and real 3D body displacement, not a new collider, native film or independent acceptance'};
}

// One physically occupied ORIGINAL bronze arch, never a fabricated successor
// portal. Keep it solid until the recorded body has CLEARED its opening; after
// that, optical retirement is limited by BOTH genuine 3D departure and
// successful renderer submissions. A browser poll, timestamp jump or fake
// victory cannot use this to spend an unseen original doorway.
export function observedSourceGatewayDeparturePresence(source,held) {
  if(held?.guardianGateRetained!==true ||
     !valid(held?.submittedFrames) || held.submittedFrames<0 ||
     held.submittedFrames>10 ||
     !Number.isFinite(held.visibleSeconds) ||
     held.visibleSeconds<0 || held.visibleSeconds>=1.65 ||
     !valid(held.thresholdX)) return null;
  const physical=observedSourcePhysicalArrivalPalette(source,held);
  if(!physical?.sourceBound)return null;
  const p=source.player;
  const wholeBodyCleared=
    p.x-p.halfWidth>=held.thresholdX+4000 ||
    physical.rise>=70000;
  const displayedSeconds=smooth((held.visibleSeconds-.12)/.90);
  const submittedFrames=smooth((held.submittedFrames-1)/5);
  const visibleProgress=Math.min(displayedSeconds,submittedFrames);
  // Do not erase the real bronze gate while the actual climber still occupies
  // the threshold. Only a fully-cleared original opening can retire its
  // physically shared surrounding gallery / material.
  const consumed=wholeBodyCleared
    ?Math.min(physical.progress,visibleProgress):0;
  return {sourceBound:true,sourceTick:source.tick,
    actualSourcePosition:true,wholeBodyCleared,
    opacity:1-consumed,sourceProgress:physical.progress,
    submittedProgress:visibleProgress,
    limitation:'Existing original gate material only; no actual video pixel or acceptance claim'};
}
