// P0: keep the ORIGINAL returned Floor 8 lens in the successor camera's
// coordinate space for one source-earned crossing. This does not interpolate
// gameplay, invent a door, rewind a player, or use an assumed GPU frame rate.
// The consumer must separately verify both bodies in-frame and clear core rays.
import { observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
import { observedSourceSuccessorRaisedDeck, observedSourceRetainedRaisedExit, SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS } from './source-physical-arrival-palette.mjs';
const integer=Number.isSafeInteger;
const finite=Number.isFinite;
// The last real Floor8 returned frame can precede the killing blow. In the
// original candidate's 1x desktop/portrait recordings, the last source-
 // observed live 3D old-floor frames were tick438/tick434 at guardian HP1;
// the immutable HP-zero record arrived later at tick441. Requiring an
// impossible earlier GPU-submitted zero-HP frame made the bridge inert.
// Capture a TRUE previous F8 source-visible living guardian/cap/camera;
// permit its use ONLY after immutable source records the actual HP-zero exit.
export function observedOriginalGatewaySubmittedView(source,camera,gaze) {
  const cap=source?.platforms?.find(p=>p?.id==='f8:cap');
  const guardian=source?.enemies?.find(e=>e?.kind==='guardian' &&
    // Published render enemies are ALREADY scoped to source.floor=8 and
    // intentionally omit enemy.floor. A former exact-floor predicate here
    // silently rejected every actual submitted F8 guardian/camera and made
    // the later authentic F9 old-gateway lens unreachable in native play.
    // An explicitly contradictory floor (test/replay instrumentation) is
    // still a veto: this is NOT a licence to borrow another floor's camera.
    (e.floor===undefined || e.floor===8) &&
    Number.isFinite(e.health) && e.health>=0);
  const p=source?.player;
  if(source?.floor!==8 || source.theme!=='clockwork' ||
     source.lifecycle!=='running' ||
     typeof source.runToken!=='string' || !source.runToken ||
     !cap || !guardian || !(p?.health>0) ||
     ![source.tick,source.chunkBaseY,source.worldWidth,
       source.guardianExitX,cap.x,cap.y,cap.width,cap.height,p.x]
       .every(integer) || cap.width<=0 || cap.height<=0 ||
     source.guardianExitX!==cap.x+Math.floor(cap.width*.76) ||
     Math.abs(p.x-source.guardianExitX)>90000 ||
     !Array.isArray(camera) || !Array.isArray(gaze) ||
     camera.length!==3 || gaze.length!==3 ||
     !camera.every(finite) || !gaze.every(finite))return null;
  return {runToken:source.runToken,floor:8,tick:source.tick,
    chunkBaseY:source.chunkBaseY,
    oldCapId:'f8:cap',oldRoofY:cap.y+cap.height,
    thresholdX:source.guardianExitX,
    originalGuardianObserved:true,originalGuardianHealth:guardian.health,
    camera:camera.slice(),gaze:gaze.slice(),
    witness:'Original F8 actor/guardian/cap and GPU-returned camera; never implies defeat'};
}

// The original native desktop film's first F9 renderer returned the SAME
// authentic grounded crossing receipt (source tick 475) without the delayed
// immutable lastGuardianCrossing record. The old helper demanded that record
// AND a previously returned F8 camera within 25 ticks: the actual old camera
// was 37 ticks earlier. Both conditions rejected the only physical bridge.
// We may retain a previously submitted real F8 lens on that first F9 frame
// ONLY when the independent old-cap/HP0/grounded seam was already verified,
// with the original GPU owner in hand; no invented guardian defeat or actor.
// Live hero, original gate and opaque tower-core projection are independently
// vetoed in Scene after applying this proposed presentation-only lens.
export function sourceOriginalGatewayCameraBridge(snapshot,held,prior,view={}) {
  const w=snapshot?.lastGuardianCrossing,p=snapshot?.player;
  const recorded=w!=null;
  const cap=recorded?w.cap:null;
  const initialGrounded=!recorded &&
    observedStagedOriginalCapBeforeRecordedCrossing(snapshot,held);
  if(!snapshot || !held || !prior || !p ||
      (!recorded&&!initialGrounded) ||
      view.stale || view.overview || view.reducedMotion ||
      view.camera!=='follow' || snapshot.lifecycle!=='running' ||
      snapshot.floor!==9 || snapshot.theme!=='void' ||
      held.guardianGateRetained!==true ||
      snapshot.runToken!==prior.runToken ||
      snapshot.runToken!==held.runToken ||
      prior.floor!==8 || prior.oldCapId!=='f8:cap' ||
      prior.originalGuardianObserved!==true ||
      !finite(prior.originalGuardianHealth) ||
      prior.originalGuardianHealth<0 ||
      held.oldCapId!=='f8:cap' ||
      !(p.health>0) ||
      ![snapshot.tick,snapshot.chunkBaseY,prior.tick,prior.chunkBaseY,
        prior.oldRoofY,prior.thresholdX,held.oldRoofY,held.thresholdX,
        held.submittedFrames,p.x,p.y,p.halfHeight].every(integer) ||
      !finite(held.visibleSeconds) ||
      !Array.isArray(prior.camera) || !Array.isArray(prior.gaze) ||
      prior.camera.length!==3 || prior.gaze.length!==3 ||
      !prior.camera.every(finite) || !prior.gaze.every(finite) ||
      prior.oldRoofY!==held.oldRoofY ||
      prior.thresholdX!==held.thresholdX ||
      held.submittedFrames<0 || held.submittedFrames>=20 ||
      // Never extend an old-floor camera after ten returned frames merely
      // because historical source records still exist. The SAME real
      // retained original gateway must have positive GPU material coverage.
      (held.submittedFrames>=10 &&
        (!finite(held.originalGatewayOpacity) ||
          held.originalGatewayOpacity<=.035 ||
          held.originalGatewayOpacity>1)) ||
      held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
      // Each successful renderer return contributes at most 100ms to the
      // source-owned old-to-new palette, so no impossible history can steer
      // the camera further after a cold renderer stalls or source skips.
      held.visibleSeconds>held.submittedFrames*.1+1e-8 ||
      p.halfHeight<=0 || Math.abs(p.x-held.thresholdX)>90000 ||
      p.y-p.halfHeight<held.oldRoofY-2500 ||
      p.y-p.halfHeight>held.oldRoofY+230000 ||
      (p.y-p.halfHeight>held.oldRoofY+160000 &&
       p.grounded===true &&
       !observedSourceSuccessorRaisedDeck(snapshot,held.oldRoofY))) return null;
  // The source-backed GPU render can skip 30-40 fixed ticks on first cold
  // Floor9 construction. Reuse ONLY the already-rendered same cap/roof F8
  // view up to 48 ticks back; Scene must still accept the actual current hero
  // and exact original doorway in safe NDC with no opaque core obstruction.
  const realCrossingTick=recorded?w.sourceTick:held.tick;
  if(!integer(realCrossingTick) ||
     prior.tick>realCrossingTick ||
     realCrossingTick-prior.tick>48 ||
     snapshot.tick<realCrossingTick ||
     // Genuine first f9:p2 raised-platform landing is observed around tick535,
     // sixty ticks after source475 grounded crossing. Match the SAME finite
     // 70-tick original gate/material/cold-camera envelope, while preserving
     // the strict 12-tick unrecorded receipt and other WebGL, support, crop
     // and guardian proof vetoes; no invented old frame is generated.
     snapshot.tick-realCrossingTick>(recorded
       ?(observedSourceRetainedRaisedExit(snapshot,held,held.oldRoofY)
         ?SOURCE_GATEWAY_RAISED_OPTICAL_MAX_TICKS:70)
       :12)) return null;
  if(recorded){
    if(!cap || w.runToken!==snapshot.runToken ||
      w.fromFloor!==8 || w.toFloor!==9 ||
      cap.id!=='f8:cap' || held.oldCapId!==cap.id ||
      w.guardian?.kind!=='guardian' ||
      w.guardian.active!==false || !(w.guardian.health<=0) ||
      !finite(w.guardian.health) ||
      ![w.exitX,cap.y,cap.height].every(integer) ||
      held.oldRoofY!==cap.y+cap.height ||
      w.exitX!==held.thresholdX) return null;
  } else {
    // The only alternate proof is an already-rendered ORIGINAL, exact
    // first-floor receipt. No next-floor preview, dead enemy inference,
    // source delay or browser clock can create this proof.
    if(!initialGrounded ||
      !integer(held.sourceTick) || held.sourceTick!==held.tick ||
      !integer(held.observedCrossingX) ||
      !integer(held.observedCrossingY)) return null;
  }
  const yShift=(prior.chunkBaseY-snapshot.chunkBaseY)/10000;
  if(!finite(yShift) || Math.abs(yShift)>1000)return null;
  // The prior camera expired after ten submissions even when native 1x
  // WebM showed substantially less than a second of old/new geometry.
  // That detached the final follow shot from the still-bronze real gateway.
  // Retire the original 3D shot with BOTH actually returned display duration
  // and submission count; normal-speed recording must still verify pixels.
  // Keep the prior immutable old-frame/HP0/grounded-support checks above.
  const timeProgress=Math.min(1,held.visibleSeconds/1.25);
  const frameProgress=Math.min(1,held.submittedFrames/12);
  const progress=Math.min(timeProgress,frameProgress);
  const eased=progress*progress*(3-2*progress);
  // The actual original gateway's material coverage is a separate veto:
  // never retain a historic camera once the genuine painted doorway itself
  // retired, even if its old source certificate is still valid.
  const oldGateWeight=finite(held.originalGatewayOpacity)
    ?Math.max(0,Math.min(1,held.originalGatewayOpacity)):1;
  const weight=.72*(1-eased)*(1-eased)*oldGateWeight;
  if(weight<=.0005)return null;
  return {sourceBound:true,sourceTick:snapshot.tick,
    crossingTick:realCrossingTick,
    proof:recorded?'immutable-guardian-defeat':'verified-grounded-original-source-receipt',
    camera:[prior.camera[0],prior.camera[1]+yShift,prior.camera[2]],
    gaze:[prior.gaze[0],prior.gaze[1]+yShift,prior.gaze[2]],
    weight,originalFloor:8,successorFloor:9,
    limitation:'Real prior F8 WebGL camera, exact HP0/grounded old-cap evidence; scene must independently veto obstructed/cropped actor or gate; not native WebM proof'};
}
