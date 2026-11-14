// P0: keep the ORIGINAL returned Floor 8 lens in the successor camera's
// coordinate space for one source-earned crossing. This does not interpolate
// gameplay, invent a door, rewind a player, or use an assumed GPU frame rate.
// The consumer must separately verify both bodies in-frame and clear core rays.
const integer=Number.isSafeInteger;
const finite=Number.isFinite;
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
      prior.floor!==8 || cap.id!=='f8:cap' ||
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
