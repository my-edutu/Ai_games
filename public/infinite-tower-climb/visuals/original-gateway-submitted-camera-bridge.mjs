// P0: keep the ORIGINAL returned Floor 8 lens in the successor camera's
// coordinate space for one source-earned crossing. This does not interpolate
// gameplay, invent a door, rewind a player, or use an assumed GPU frame rate.
// The consumer must separately verify both bodies in-frame and clear core rays.
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
    e.floor===8 && Number.isFinite(e.health) && e.health>=0);
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

export function sourceOriginalGatewayCameraBridge(snapshot,held,prior,view={}) {
  const w=snapshot?.lastGuardianCrossing, p=snapshot?.player,cap=w?.cap;
  if(!snapshot || !held || !prior || !w || !p || !cap ||
      view.stale || view.overview || view.reducedMotion ||
      view.camera!=='follow' || snapshot.lifecycle!=='running' ||
      snapshot.floor!==9 || snapshot.theme!=='void' ||
      held.guardianGateRetained!==true ||
      snapshot.runToken!==prior.runToken ||
      snapshot.runToken!==held.runToken ||
      w.runToken!==snapshot.runToken ||
      w.fromFloor!==8 || w.toFloor!==9 ||
      prior.floor!==8 || prior.oldCapId!=='f8:cap' ||
      prior.originalGuardianObserved!==true ||
      !finite(prior.originalGuardianHealth) ||
      prior.originalGuardianHealth<0 || cap.id!=='f8:cap' ||
      held.oldCapId!==cap.id ||
      w.guardian?.kind!=='guardian' ||
      w.guardian.active!==false || !(w.guardian.health<=0) ||
      !finite(w.guardian.health) || !(p.health>0) ||
      ![snapshot.tick,snapshot.chunkBaseY,prior.tick,prior.chunkBaseY,
        prior.oldRoofY,prior.thresholdX,w.sourceTick,w.exitX,
        cap.y,cap.height,held.oldRoofY,held.thresholdX,
        held.submittedFrames,p.x,p.y,p.halfHeight].every(integer) ||
      !finite(held.visibleSeconds) ||
      !Array.isArray(prior.camera) || !Array.isArray(prior.gaze) ||
      prior.camera.length!==3 || prior.gaze.length!==3 ||
      !prior.camera.every(finite) || !prior.gaze.every(finite) ||
      held.oldRoofY!==cap.y+cap.height ||
      prior.oldRoofY!==held.oldRoofY ||
      prior.thresholdX!==held.thresholdX || w.exitX!==held.thresholdX ||
      held.submittedFrames<0 || held.submittedFrames>=10 ||
      held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
      snapshot.tick<w.sourceTick || snapshot.tick-w.sourceTick>48 ||
      prior.tick>w.sourceTick || w.sourceTick-prior.tick>25 ||
      p.halfHeight<=0 || Math.abs(p.x-held.thresholdX)>90000 ||
      (p.y-p.halfHeight)<held.oldRoofY-2500 ||
      (p.y-p.halfHeight)>held.oldRoofY+160000) return null;
  // Same original 3D roof: the old camera Y is relative to the old chunk
  // origin. Rebase only presentation coordinates, never source coordinates.
  const yShift=(prior.chunkBaseY-snapshot.chunkBaseY)/10000;
  if(!finite(yShift) || Math.abs(yShift)>1000)return null;
  const progress=held.submittedFrames/10;
  const weight=.72*(1-progress)*(1-progress);
  return {sourceBound:true,sourceTick:snapshot.tick,crossingTick:w.sourceTick,
    camera:[prior.camera[0],prior.camera[1]+yShift,prior.camera[2]],
    gaze:[prior.gaze[0],prior.gaze[1]+yShift,prior.gaze[2]],
    weight,originalFloor:8,successorFloor:9,
    limitation:'Returned original GPU camera; candidate may be rejected by live 3D actor, doorway and core safety'};
}
