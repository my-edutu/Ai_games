import { pointFor } from './coordinates.mjs';
import { observedRecordedGuardianDoorstepHandoff } from './guardian-passage.mjs';
// Only a real unlocked cap threshold may request this optional camera escort.
// Pure, source-independent framing veto: never touches authority or input.
export function gatewayScreenError(ndc) {
  if (!Array.isArray(ndc) || ndc.length !== 3 ||
      !ndc.every(Number.isFinite) || ndc[2] < -1 || ndc[2] > 1)
    return Infinity;
  return Math.max(0, Math.abs(ndc[0]) / .78 - 1,
    Math.abs(ndc[1]) / .76 - 1);
}
function readableBody(body) {
  return Array.isArray(body) && body.length === 4 &&
    body.every(Number.isFinite) && body[2] >= -1 && body[2] <= 1 &&
    body[3] >= .035 && Math.abs(body[0]) <= .77 &&
    Math.abs(body[1]) + body[3] <= .76;
}
export function acceptEarnedGatewayEscort({
  gateBefore, gateAfter, actorBefore, actorAfter,
  actorCoreClear, gatewayCoreClear,
}) {
  const before = gatewayScreenError(gateBefore);
  const after = gatewayScreenError(gateAfter);
  if (!actorCoreClear || !gatewayCoreClear ||
      !readableBody(actorBefore) || !readableBody(actorAfter) ||
      !Number.isFinite(before) || !Number.isFinite(after) ||
      before <= .035 || after > before - .018) return 0;
  return before - after;
}

// Deterministic per-frame budget for the SAME unlocked physical doorway.
// Source-earned state and actor/core projections, not this helper, determine
// whether any correction may be applied. Wider desktop uses a gentler lens;
// portrait stays body-safe with the existing post-correction veto.
export function earnedGatewayEscortResponse(aspect, dt) {
  if (!Number.isFinite(aspect) || aspect <= 0 || aspect >= 2.5 ||
      !Number.isFinite(dt) || dt <= 0) return 0;
  const portrait = aspect < .85;
  return Math.min(portrait ? .20 : .11,
    1 - Math.exp(-Math.min(dt, .06) * (portrait ? 8 : 5)));
}

 

// The old portrait approach multiplied camera radius without checking that
// the *new* sightlines still passed outside the opaque clockwork tower core.
// A larger climber is not an improvement if the machine hides the actual
// actor or hard-earned walkable gateway. This source-agnostic geometric
// limiter only authorizes an exterior-orbit dolly; it does not shift players,
// alter the encounter, create cameras, or make a capture-quality claim.
// Sample the whole proposed radial path, not just the final camera point,
// so a dangerous intermediate contraction is not crossed by interpolation.
export function safeEarnedGatewayDollyRadius(camera, requestedRadius, actor,
  gateway, coreRadius = 23.5) {
  const points = [camera,actor,gateway];
  if (!points.every(point=>point &&
      [point.x,point.y,point.z].every(Number.isFinite)) ||
      !Number.isFinite(requestedRadius) || requestedRadius<=0 ||
      !Number.isFinite(coreRadius) || coreRadius<=0) return null;
  const radius=Math.hypot(camera.x,camera.z);
  if (!Number.isFinite(radius) || radius<=coreRadius+1 ||
      requestedRadius<=coreRadius+1) return null;
  if (requestedRadius>=radius) return radius;
  const clear = (x,z,subject)=>{
    const dx=subject.x-x,dz=subject.z-z,denom=dx*dx+dz*dz;
    const t=denom>1e-8 ?
      Math.max(0,Math.min(1,-(x*dx+z*dz)/denom)) : 0;
    return Math.hypot(x+t*dx,z+t*dz)>=coreRadius;
  };
  if (!clear(camera.x,camera.z,actor) ||
      !clear(camera.x,camera.z,gateway)) return radius;
  let approved=radius;
  for (let step=1;step<=12;step++) {
    const proposed=radius+(requestedRadius-radius)*step/12;
    const scale=proposed/radius,x=camera.x*scale,z=camera.z*scale;
    if (!clear(x,z,actor) || !clear(x,z,gateway)) break;
    approved=proposed;
  }
  return approved;
}

// Source-earned grounded cap procession. Presentation-only: this cannot
// unlock doors, move the hero, award a victory or change fixed-step authority.
// The panoramic arrival yields to a closer continuous exterior-orbit shot
// only for a REAL nearby body walking toward the defeated guardian's doorway.
export function observedGroundedGatewayShot(snapshot, earned, aspect, zoom = 1) {
  const p = snapshot?.player, cap = earned?.cap;
  if (snapshot?.lifecycle !== 'running' || snapshot?.stale ||
      earned?.runToken !== snapshot?.runToken ||
      earned?.floor !== snapshot?.floor ||
      cap?.id !== ('f' + snapshot.floor + ':cap') ||
      (p?.state !== 'standing' && p?.state !== 'hurt') ||
      p?.grounded !== true || p?.groundedPlatformId !== cap?.id ||
      !(p?.health > 0) ||
      ![aspect, zoom, snapshot.tick, snapshot.worldWidth,
        p?.x, p?.y, p?.halfHeight,
        cap?.x, cap?.y, cap?.width, cap?.height].every(Number.isFinite) ||
      aspect <= 0 || aspect >= 2.5 || zoom <= 0 || zoom > 1.1 ||
      cap.width <= 0 || cap.height <= 0 || p.halfHeight <= 0 ||
      snapshot.worldWidth <= 0) return null;
  const feet = p.y - p.halfHeight;
  if (Math.abs(feet - (cap.y + cap.height)) > 4500 ||
      p.x < cap.x || p.x > cap.x + cap.width) return null;
  const physicalExit = cap.x + Math.floor(cap.width * .76);
  const exitX = Number.isSafeInteger(snapshot.guardianExitX) &&
    snapshot.guardianExitX === physicalExit ? snapshot.guardianExitX : physicalExit;
  const distance = Math.abs(exitX - p.x);
  const approachWindow = Math.min(85000, cap.width * .32);
  if (approachWindow <= 10000 || distance >= approachWindow) return null;
  const approach = 1 - distance / approachWindow;
  const portrait = aspect < .85;
  // The old full-cap panorama could shrink the mobile climber below a
  // readable silhouette. Resolve only the last real physical walk, without
  // cutting, crossing the solid core or demanding any additional draw pass.
  const farRadius = portrait ? 67 : 56;
  const nearRadius = portrait ? 44 : 37;
  const radius = Math.max(30, (farRadius - (farRadius - nearRadius) * approach) *
    Math.min(1.25, Math.max(.85, zoom)));
  return { sourceTick: snapshot.tick, radius,
    focusWeight: Math.min(.42, approach * (portrait ? .42 : .34)),
    approach, exitX };
}



 
// Real earned-cap AIRBORNE continuation of the same walkable guardian threshold.
// Matched 390x844 gameplay at ee9a223e showed the climber jump/dash in front
// of an enormous clockwork dial just as the source released the gateway. The
// grounded-only escort stopped at takeoff, allowing the actual threshold to
// disappear from the phone composition while the body remained on the cap
// approach. Keep the existing physical roof, source defeat, immutable run and
// whole-body footprint as mandatory gates; the camera may never create a
// landing, move the body or open the door. This is a gentler exterior-orbit
// request than the supported walking shot; scene.mjs still vets both sightlines.
export function observedAirborneGatewayShot(snapshot, earned, aspect, zoom = 1) {
  const p = snapshot?.player, cap = earned?.cap;
  if (snapshot?.lifecycle !== 'running' || snapshot?.stale ||
      earned?.runToken !== snapshot?.runToken ||
      earned?.floor !== snapshot?.floor ||
      cap?.id !== ('f' + snapshot.floor + ':cap') ||
      !['airborne','dashing'].includes(p?.state) || p?.grounded !== false ||
      !(p?.health > 0) ||
      ![aspect,zoom,snapshot.tick,snapshot.worldWidth,p?.x,p?.y,
        p?.halfWidth,p?.halfHeight,cap?.x,cap?.y,cap?.width,cap?.height]
        .every(Number.isFinite) ||
      aspect <= 0 || aspect >= 2.5 || zoom <= 0 || zoom > 1.1 ||
      cap.width <= 0 || cap.height <= 0 || p.halfWidth <= 0 ||
      p.halfHeight <= 0 || snapshot.worldWidth <= 0) return null;
  const roof = cap.y + cap.height;
  const feet = p.y - p.halfHeight;
  // Only a real near-roof trajectory along the physical cap. A falling hero,
  // remote combat or an already-advanced floor must not borrow the camera.
  if (feet < roof - 6000 || feet > roof + 62000 ||
      p.x-p.halfWidth < cap.x ||
      p.x+p.halfWidth > cap.x+cap.width) return null;
  const exitX = cap.x + Math.floor(cap.width * .76);
  const distance = Math.abs(exitX - p.x);
  const window = Math.min(90000, cap.width * .36);
  if (window <= 12000 || distance >= window) return null;
  const approach = 1 - distance / window;
  const portrait = aspect < .85;
  const far = portrait ? 60 : 53;
  const near = portrait ? 47 : 42;
  const radius = Math.max(30, (far - (far-near)*approach) *
    Math.min(1.25,Math.max(.85,zoom)));
  return {sourceTick:snapshot.tick, radius,
    focusWeight:Math.min(.29,.10+approach*(portrait?.19:.15)),
    approach,exitX,realAirborneCap:true};
}

// Final living-guardian approach is a REAL source beat, not an early unlock.
// The recorded portrait duel lets the boss fight remain readable but often
// shrinks the hero and earned doorway during the 1-HP final aerial exchanges.
// Prepare the same exterior orbital shot WHILE the real lock is still closed,
// rather than asking the camera to converge during a ~0.4s post-defeat walk.
// Every projection/core/actor safety veto remains in scene.mjs. No game
// authority, scene clock, simulated win, floor, or camera cut is changed.
export function observedLiveGuardianLastStandShot(snapshot, lock, aspect, zoom = 1) {
  const p = snapshot?.player, cap = lock?.cap, guardian = lock?.guardian;
  if (snapshot?.stale || snapshot?.lifecycle !== 'running' ||
      lock?.runToken !== snapshot.runToken || lock?.floor !== snapshot.floor ||
      cap?.id !== ('f' + snapshot.floor + ':cap') ||
      guardian?.active !== true || !(guardian?.health > 0) ||
      !(guardian?.maxHealth > 0) ||
      guardian.health > Math.max(1, Math.ceil(guardian.maxHealth * .25)) ||
      (p?.state !== 'standing' && p?.state !== 'hurt' && p?.state !== 'airborne') ||
      !(p?.health > 0) ||
      ![aspect, zoom, p?.x, p?.y, p?.halfHeight,
        cap?.x, cap?.y, cap?.width, cap?.height].every(Number.isFinite) ||
      aspect <= 0 || aspect >= 2.5 || zoom <= 0 || zoom > 1.1 ||
      p.halfHeight <= 0 || cap.width <= 0 || cap.height <= 0 ||
      p.x < cap.x || p.x > cap.x + cap.width ||
      (p.grounded && p.groundedPlatformId !== cap.id)) return null;
  const feet = p.y - p.halfHeight;
  const roof = cap.y + cap.height;
  // Keep this near the physically witnessed cap: no arbitrary off-deck,
  // high-altitude or stale post-fight camera invitation.
  if (feet < roof - 8000 || feet > roof + 110000) return null;
  const exitX = cap.x + Math.floor(cap.width * .76);
  const distance = Math.abs(exitX - p.x);
  const window = Math.min(125000, cap.width * .48);
  if (window <= 10000 || distance >= window) return null;
  const approach = 1 - distance / window;
  const portrait = aspect < .85;
  const farRadius = portrait ? 59 : 52;
  const nearRadius = portrait ? 46 : 40;
  const radius = Math.max(30, (farRadius - (farRadius-nearRadius)*approach) *
    Math.min(1.25, Math.max(.85, zoom)));
  return { sourceTick:snapshot.tick, radius,
    focusWeight:Math.min(.24, .1 + approach * .14), approach, exitX };
}

// The SOURCE-verified grounded Floor8→9 passage outlives the old floor's
// geometry. The 3D arch is retained by the passage owner; this requests that
// the *same exterior follow camera* continues to frame it during the first
// real next-floor walking steps. It cannot cause a transition, create ground,
// forge a victory, freeze the world or claim that a WebM has been accepted.
export function observedGroundedHandoffShot(snapshot, passage, aspect, zoom = 1) {
  const p = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || snapshot?.stale ||
      passage?.sourceBound !== true || passage?.active !== true ||
      passage?.stage !== 'handoff' ||
      passage?.continuousGroundedHandoff !== true ||
      passage?.innerDoorAssemblyVisible !== true ||
      passage?.runToken !== snapshot?.runToken ||
      passage?.floor !== snapshot?.floor ||
      !Number.isSafeInteger(snapshot?.tick) ||
      !Number.isSafeInteger(passage?.sourceTick) ||
      passage.sourceTick > snapshot.tick ||
      snapshot.tick - passage.sourceTick > 60 ||
      !Number.isSafeInteger(snapshot?.floor) ||
      !(p?.health > 0) || p?.grounded !== true ||
      (p?.state !== 'standing' && p?.state !== 'hurt') ||
      (p?.groundedPlatformId !== 'f' + snapshot.floor + ':ground' &&
         !observedRecordedGuardianDoorstepHandoff(snapshot)) ||
      ![aspect, zoom, snapshot.worldWidth, snapshot.chunkBaseY,
        p?.x, p?.y, p?.halfHeight,
        passage?.ageSeconds, passage?.durationSeconds].every(Number.isFinite) ||
      aspect <= 0 || aspect >= 2.5 || zoom <= 0 || zoom > 1.1 ||
      snapshot.worldWidth <= 0 || p.halfHeight <= 0 ||
      passage.ageSeconds < 0 || passage.durationSeconds <= 0 ||
      passage.ageSeconds >= passage.durationSeconds ||
      !Array.isArray(passage.focusPosition) ||
      passage.focusPosition.length !== 3 ||
      !passage.focusPosition.every(Number.isFinite)) return null;
  // The camera can escort only a physically nearby hero on the new floor,
  // not an old doorway left behind or a detached rendered memory. Observe
  // the actual ground-contact sole against the true source-anchored arch.
  const actor = pointFor(p.x, p.y - p.halfHeight,
    snapshot.chunkBaseY, snapshot.worldWidth, 25);
  const gate = passage.focusPosition;
  const planar = Math.hypot(actor.x - gate[0], actor.z - gate[2]);
  // The inner arch is a WALKABLE threshold, not a hovering cinematic
  // target. A source body more than 4.5m above/below its sole reference
  // cannot borrow the prior floor's gate shot. The former 8m allowance
  // admitted a 9.5m fabricated vertical displacement in real contracts.
  if (planar >= 12 || Math.abs(actor.y - gate[1]) > 4.5) return null;
  const remaining = Math.max(0, Math.min(1,
    (passage.durationSeconds - passage.ageSeconds) /
      Math.max(.1, passage.durationSeconds - 1.05)));
  const proximity = Math.max(0, Math.min(1, (12 - planar) / 10));
  const weight = remaining * proximity;
  if (weight < .04) return null;
  const radius = (aspect < .85 ? 53 : 45) *
    Math.min(1.25, Math.max(.85, zoom));
  return {sourceTick:snapshot.tick, radius,
    focusWeight:Math.min(.36, .36 * weight),
    groundedHandoff:true, proximity, remaining};
}

// A legitimate first Floor9 jump should keep the same already-earned
// doorway in the exterior camera, not turn it into an instant scene cut.
// Read-only presentation. Ground contact remains strictly owned by the
// separate observedGroundedHandoffShot and authoritative source.
export function observedAirborneHandoffShot(snapshot, passage, aspect, zoom = 1) {
  const p=snapshot?.player;
  if(snapshot?.lifecycle!=='running'||snapshot?.stale||
      passage?.sourceBound!==true||passage?.active!==true||
      passage?.stage!=='handoff'||passage?.continuousGroundedHandoff!==true||
      passage?.innerDoorAssemblyVisible!==true||
      passage?.runToken!==snapshot?.runToken||
      passage?.floor!==snapshot?.floor||
      !Number.isSafeInteger(snapshot?.tick)||
      !Number.isSafeInteger(passage?.sourceTick)||
      snapshot.tick<passage.sourceTick||
      snapshot.tick-passage.sourceTick>24||
      !(p?.health>0)||p?.grounded!==false||
      p?.state!=='airborne'||!Number.isFinite(p?.vy)||
      ![aspect,zoom,snapshot.worldWidth,snapshot.chunkBaseY,p?.x,p?.y,
        p?.halfHeight,passage?.ageSeconds,passage?.durationSeconds]
        .every(Number.isFinite)||
      aspect<=0||aspect>=2.5||zoom<=0||zoom>1.1||
      snapshot.worldWidth<=0||p.halfHeight<=0||
      passage.ageSeconds<0||passage.durationSeconds<=0||
      passage.ageSeconds>=passage.durationSeconds||
      !Array.isArray(passage.focusPosition)||
      passage.focusPosition.length!==3||
      !passage.focusPosition.every(Number.isFinite))return null;
  const sole=pointFor(p.x,p.y-p.halfHeight,
    snapshot.chunkBaseY,snapshot.worldWidth,25);
  const gate=passage.focusPosition;
  const planar=Math.hypot(sole.x-gate[0],sole.z-gate[2]);
  const height=sole.y-gate[1];
  // The authored focus is 2.6m above the true cap soles, not the roof;
  // an authentic 0.8m first jump therefore registers height -1.8m.
  // Exclude detached lower/upper levels while preserving this real arc.
  if(planar>=9||height< -3.5||height>5.5)return null;
  const remaining=Math.max(0,Math.min(1,
    (passage.durationSeconds-passage.ageSeconds)/
    Math.max(.1,passage.durationSeconds-1.05)));
  const proximity=Math.max(0,Math.min(1,(9-planar)/7));
  const heightWeight=Math.max(0,Math.min(1,(5.5-height)/5.5));
  const weight=remaining*proximity*heightWeight;
  if(weight<.055)return null;
  return {sourceTick:snapshot.tick,
    radius:(aspect<.85?53:45)*Math.min(1.25,Math.max(.85,zoom)),
    focusWeight:Math.min(.24,.24*weight),
    airborneHandoff:true,proximity,remaining};
}
