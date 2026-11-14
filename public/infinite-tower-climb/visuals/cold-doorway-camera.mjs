// Camera framing for the ORIGINAL, already-walked guardian doorway during a
// slow first Floor 9 WebGL submission. This consumes the same immutable HP-zero
// crossing and exact retained original GPU roof witness as the world renderer.
// A late native frame must not throw away its real bronze arch merely because
// the shorter cosmetic passage animation has expired. This is not an avatar
// interpolation, temporal replay, new floor, trigger or camera cut.
import { pointFor, SCALE, guardianTraversalGatePose } from './coordinates.mjs';
import { observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
import { observedSourceGatewayDeparturePresence } from './source-physical-arrival-palette.mjs';

const validInt = Number.isSafeInteger;
const finite = Number.isFinite;

// This is not a substitute for a recorded win: the original authored door
// and defeated old guardian have ALREADY been observed and retained by World.
// Until an immutable record arrives, frame only that same bounded source
// receipt; if a record exists but conflicts, the lower-authority receipt is
// never allowed to override it.
export function observedPriorGroundedOriginalDoorwayLens(source,held,drawnHero,aspect,zoom=1) {
  if (!observedStagedOriginalCapBeforeRecordedCrossing(source,held) ||
      !drawnHero || !finite(aspect) || aspect<=0 || aspect>=2.5 ||
      !finite(zoom) || zoom<=0 || zoom>1.1) return null;
  const p=source.player;
  const actual=pointFor(p.x,p.y,source.chunkBaseY,source.worldWidth,25);
  if (![drawnHero.x,drawnHero.y,drawnHero.z].every(finite) ||
      Math.hypot(actual.x-drawnHero.x,actual.z-drawnHero.z)>3 ||
      Math.abs(actual.y-drawnHero.y)>3) return null;
  const pose=guardianTraversalGatePose(held.thresholdX,held.oldRoofY,
    source.chunkBaseY,source.worldWidth);
  if(!pose)return null;
  const gate={x:pose.x,y:pose.y+2,z:pose.z};
  const bodyY=drawnHero.y+p.halfHeight/SCALE;
  const span=Math.hypot(drawnHero.x-gate.x,drawnHero.z-gate.z);
  const rise=Math.abs(bodyY-gate.y);
  if(span>26||rise>28)return null;
  const proximity=Math.max(0,1-span/26);
  return {sourceTick:source.tick,sourceBound:true,coldOriginalArch:true,
    witnessKind:'previous-defeated-guardian-and-observed-grounded-receipt',
    focus:[(drawnHero.x+gate.x)*.5,(bodyY+gate.y)*.5,
      (drawnHero.z+gate.z)*.5],
    gateway:[gate.x,gate.y,gate.z],
    focusWeight:Math.min(.44,.16+proximity*.28),
    radius:Math.min(83,Math.max(aspect<.85?62:52,
      (aspect<.85?62:52)+span*.9))*
      Math.min(1.25,Math.max(.85,zoom)),span,rise};
}

export function observedSourceBoundColdDoorwayLens(source, held, drawnHero, aspect, zoom = 1) {
  if (source?.lastGuardianCrossing == null)
    return observedPriorGroundedOriginalDoorwayLens(source,held,drawnHero,aspect,zoom);
  // One physical original doorway cannot disappear from the camera on the
  // eighth returned WebGL frame while World still paints its genuine bronze
  // materials. Follow exactly that SAME source-validated optical lifetime,
  // with no camera-only timer, fake pose, or scene resurrected after disposal.
  const originalGateway = observedSourceGatewayDeparturePresence(source,held);
  if (originalGateway?.sourceBound !== true ||
      originalGateway.opacity <= .035) return null;
  const p = source?.player, w = source?.lastGuardianCrossing, cap = w?.cap;
  if (!p || !w || !cap || !held || !drawnHero ||
      source?.lifecycle !== 'running' || source.floor !== 9 ||
      source.theme !== 'void' || source.runToken !== held.runToken ||
      w.runToken !== source.runToken || w.fromFloor !== 8 || w.toFloor !== 9 ||
      cap.id !== 'f8:cap' || held.oldCapId !== cap.id ||
      w.guardian?.kind !== 'guardian' || w.guardian.active !== false ||
      !finite(w.guardian.health) || w.guardian.health > 0 ||
      w.sourceTick !== held.crossingTick ||
      ![source.tick, source.worldWidth, source.chunkBaseY,
        w.sourceTick, held.sourceTick, held.oldRoofY, held.thresholdX,
        held.oldCapX, held.oldCapWidth, held.submittedFrames,
        p.x, p.y, p.halfWidth, p.halfHeight, w.exitX,
        cap.x, cap.y, cap.width, cap.height, w.crossingX]
        .every(validInt) ||
      source.tick < held.sourceTick || source.tick - w.sourceTick > 70 ||
      held.sourceTick < w.sourceTick || held.sourceTick - w.sourceTick > 12 ||
      held.submittedFrames < 0 || held.submittedFrames > 60 ||
      !finite(held.visibleSeconds) || held.visibleSeconds < 0 ||
      held.visibleSeconds >= 3 ||
      source.worldWidth <= 0 || p.halfWidth <= 0 || p.halfHeight <= 0 ||
      !(p.health > 0) || !finite(aspect) || aspect <= 0 || aspect >= 2.5 ||
      !finite(zoom) || zoom <= 0 || zoom > 1.1 ||
      cap.width <= 0 || cap.height <= 0 ||
      cap.x !== held.oldCapX || cap.width !== held.oldCapWidth ||
      cap.y + cap.height !== held.oldRoofY || w.exitX !== held.thresholdX ||
      w.exitX !== cap.x + Math.floor(cap.width * .76) ||
      p.x < w.crossingX || p.x > w.exitX + 90000 ||
      p.halfWidth !== w.halfWidth || p.halfHeight !== w.halfHeight ||
      !Array.isArray(source.platforms)) return null;

  const ground = source.platforms.find(s => s?.id === 'f9:ground');
  const soles = p.y - p.halfHeight;
  if (!ground || ![ground.x, ground.y, ground.width, ground.height, soles]
      .every(validInt) || ground.width <= 0 || ground.height <= 0 ||
      ground.y + ground.height !== held.oldRoofY ||
      p.x - p.halfWidth < ground.x ||
      p.x + p.halfWidth > ground.x + ground.width ||
      soles < held.oldRoofY - 2500 || soles > held.oldRoofY + 160000 ||
      !(p.grounded === false && p.state === 'airborne' &&
        finite(p.vy) && p.groundedPlatformId == null ||
        p.grounded === true && (p.state === 'standing' || p.state === 'hurt') &&
        p.vy === 0 && soles === held.oldRoofY &&
        (p.groundedPlatformId === 'f9:ground' ||
          p.groundedPlatformId === 'f8:cap'))) return null;

  const actual = pointFor(p.x, p.y, source.chunkBaseY,
    source.worldWidth, 25);
  // Gaze at the center of the SAME source-mounted, cross-route bronze
  // gateway retained by the real World owner. The old 27.78m camera target
  // was outside its actual 24.25m seal and biased the shot toward thin air.
  const pose=guardianTraversalGatePose(held.thresholdX,held.oldRoofY,
    source.chunkBaseY,source.worldWidth);
  if (!pose) return null;
  const gateway = {x:pose.x,y:pose.y+2,z:pose.z};
  if (![drawnHero.x, drawnHero.y, drawnHero.z].every(finite) ||
      Math.hypot(actual.x - drawnHero.x, actual.z - drawnHero.z) > 3 ||
      Math.abs(actual.y - drawnHero.y) > 3) return null;
  const bodyY = drawnHero.y + p.halfHeight / SCALE;
  const span = Math.hypot(drawnHero.x - gateway.x, drawnHero.z - gateway.z);
  const rise = Math.abs(bodyY - gateway.y);
  // A true next-floor body must still share the physical shot with the
  // *original* gate. Once the real body leaves the sightline, retire the
  // old-world gaze immediately; ordinary Floor 9 follow takes over.
  if (span > 26 || rise > 28) return null;
  const proximity = Math.max(0, 1 - span / 26);
  const weight = Math.min(.44, .16 + proximity * .28);
  return {
    sourceTick: source.tick, sourceBound: true, coldOriginalArch: true,
    focus: [(drawnHero.x + gateway.x) * .5,
      (bodyY + gateway.y) * .5, (drawnHero.z + gateway.z) * .5],
    gateway: [gateway.x, gateway.y, gateway.z],
    focusWeight: weight,
    // Only an exterior viewpoint request; core and actor-safety vetoes
    // remain in scene.mjs and can reject it on any submitted frame.
    radius: Math.min(83, Math.max(aspect < .85 ? 62 : 52,
      (aspect < .85 ? 62 : 52) + span * .9)) *
      Math.min(1.25, Math.max(.85, zoom)),
    span, rise,
  };
}
