import * as THREE from '/tower/vendor/three.module.js';
import { createTowerColdFloorResolution } from './cold-floor-resolution.mjs';
import { observedGroundedBiomeThreshold } from './biome-threshold.mjs';
import { auditOriginalGuardianCrossing } from './gateway-source-audit.mjs';
import { createTowerWorld, THEMES } from './world.mjs';
import { sourceTriangleOwner } from './mesh-provenance.mjs';
import { observedLandingHazardPressure } from './landing-pressure.mjs';
import { createClimber, createEnemy } from './characters.mjs';
import { readRenderedGuardianCenter, observedDrawnGuardianCameraAnchor } from './rendered-guardian-center.mjs';
import { observedWoundedCapAirDuel } from './wounded-cap-duel.mjs';
import { SCALE, pointFor, angleFor, guardianGateAnchorX } from './coordinates.mjs';
import { snapshotVelocity } from './motion.mjs';
import { createRenderProgress } from './render-progress.mjs';
import { createTowerFinale } from './finale.mjs';
import { observedGuardianPassage, observedRecordedGuardianHandoff, observedRecordedGuardianAirborneHandoff, observedRecordedGuardianDoorstepHandoff, observedLockedGuardianCap, observedUnlockedGuardianCap, observedPassageApproach, createTowerGuardianPassage } from './guardian-passage.mjs';
import { createTowerRouteIntent, witnessedHealthPickup } from './route-intent.mjs';
import { createTowerLandingApproach } from './landing-approach.mjs';
import { createTowerMovingDeckSuspension } from './moving-deck-suspension.mjs';
import { createTowerHazardPressure, observedConcurrentHazardCluster } from './hazard-pressure.mjs';
import { observedActionStage, guardedCrossfireAimGain } from './action-staging.mjs';
import { observedTraversalKinetics } from './traversal-kinetics.mjs';
import { observedLandingShotSpan } from './landing-shot-span.mjs';
import { observedHealthRecovery, createTowerRecoveryTransfer } from './recovery-transfer.mjs';
import { createTowerGuardianCircuit, observedGuardianCircuit, observedGuardianLockStage, observedGuardianRelayStage, observedGuardianPowerSpineStage } from './guardian-circuit.mjs';
import { createTowerAtmosphere } from './atmosphere.mjs';
import { createTowerGuardianShotStage } from './guardian-shot-stage.mjs';
import { createObservedGuardianGuardStage } from './guardian-guard-stage.mjs';
import { witnessedAirbornePulse, witnessedGuardianCounterPulse } from './airborne-pulse.mjs';
import { guardianFramePressure, guardianCameraRecoveryBlend, acceptGuardianCameraRescue, guardianExteriorPortraitStandoff, boundedObservedGuardianOrbit } from './guardian-camera-safety.mjs';
import { guardianGateSilhouetteInterference, guardianGateScreenDominance, guardianDuelEdgePressure, guardianLiveFightLockPriority } from './guardian-gate-intrusion.mjs';
import { observedGuardianTransmissionCorners } from './guardian-transmission-layout.mjs';
import { observedSourceBoundColdDoorwayLens } from './cold-doorway-camera.mjs';
import { sourceDoorwayFrameGain, sourceDoorwayFrameSteps } from './physical-threshold-shot.mjs';
import { gatewayScreenError, acceptEarnedGatewayEscort, earnedGatewayEscortResponse, observedGroundedGatewayShot, observedAirborneGatewayShot, observedLiveGuardianLastStandShot, observedGroundedHandoffShot, observedAirborneHandoffShot, observedEarnedCrossfloorJointShot, safeEarnedGatewayDollyRadius } from './guardian-gateway-framing.mjs';
import { acceptObservedDuelDolly } from './duel-lens.mjs';
import { sourceCriticalSightlinePriorities } from './critical-sightlines.mjs';
import { weightedGuardianWorldOcclusion, selectGuardianWorldShoulder, boundedGuardianWorldAngle } from './guardian-world-occlusion.mjs';
import { observedGuardianPortraitOpticalFov, observedGuardianPortraitActionFov, boundedGuardianOpticalFov, GUARDIAN_OPTICAL_BASE_FOV } from './guardian-optical-shot.mjs';
import { towerRenderFaultDecision, towerRenderRetryReady } from './render-recovery.mjs';
import { guardedJointShotGain, observedJointBodyPressure } from './joint-shot.mjs';
import { createObservedMovingDeckRide } from './moving-deck-ride.mjs';
// A tiny 3D attack lane follows only a REAL enemy telegraph. The curved ribbon
// traces the same cylindrical projection as authoritative horizontal shots and
// keeps its world-space origin at the firing actor, never at a guessed target.
// Fourteen reusable segments per active enemy: no per-frame geometry allocation.
const THREAT_LANE_SEGMENTS=14;
function createThreatLaneGeometry(){
  const geometry=new THREE.BufferGeometry();
  const vertices=new Float32Array((THREAT_LANE_SEGMENTS+1)*6);
  const indices=[];
  for(let i=0;i<THREAT_LANE_SEGMENTS;i++){
    const a=2*i,b=a+2;
    indices.push(a,a+1,b,a+1,b+1,b);
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  return geometry;
}
function poseThreatLane(lane, enemy, frame){
  const points=lane.geometry.getAttribute('position');
  const distance=Math.min(120000,frame.worldWidth*.245);
  const direction=enemy.facing===-1?-1:1;
  // A real approaching strike tightens its projected danger contour. The
  // source's 8 fixed windup ticks, not the animation clock, own the warning;
  // this adds no prediction, text overlay or authoritative collision.
  const total=enemy.telegraphTotalTicks===6?6:8;
  const ticks=Number.isFinite(enemy.telegraphTicksRemaining)
    ? clamp(enemy.telegraphTicksRemaining,1,total):total;
  const laneHalf=.10+(1-ticks/total)*.095;
  for(let i=0;i<=THREAT_LANE_SEGMENTS;i++){
    const x=clamp(enemy.x+direction*(9000+distance*i/THREAT_LANE_SEGMENTS),0,frame.worldWidth);
    const mapped=pointFor(x,enemy.y,frame.chunkBaseY,frame.worldWidth,26.15);
    points.setXYZ(i*2,mapped.x,mapped.y-laneHalf,mapped.z);
    points.setXYZ(i*2+1,mapped.x,mapped.y+laneHalf,mapped.z);
  }
  points.needsUpdate=true;
}
// A curved source-observed projectile trail, at most one authoritative
// velocity step behind the actual shot; never a predicted hit or fake collider.
// Its per-actor geometry is bounded and disposed on removal/restart/context loss.
const SHOT_TRACE_SEGMENTS=8;
function createProjectileRibbonGeometry(){
 const geometry=new THREE.BufferGeometry();
 const positions=new Float32Array((SHOT_TRACE_SEGMENTS+1)*6),indices=[];
 for(let i=0;i<SHOT_TRACE_SEGMENTS;i++){const a=2*i,b=a+2;indices.push(a,a+1,b,a+1,b+1,b);}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 geometry.setIndex(indices);return geometry;
}
function poseProjectileRibbon(ribbon,shot,frame){
 const points=ribbon.geometry.getAttribute('position');
 const travel=clamp(shot.vx,-20000,20000);
 for(let i=0;i<=SHOT_TRACE_SEGMENTS;i++){
  const t=i/SHOT_TRACE_SEGMENTS,x=clamp(shot.x-travel*t,0,frame.worldWidth);
  const mapped=pointFor(x,shot.y,frame.chunkBaseY,frame.worldWidth,25.8);
  const half=.026+(1-t)*.15;
  points.setXYZ(i*2,mapped.x,mapped.y-half,mapped.z);
  points.setXYZ(i*2+1,mapped.x,mapped.y+half,mapped.z);
 }
 points.needsUpdate=true;
}
// Position-only correction runs inside the real scene module. The scene's
// CPU/VM fixtures intentionally remove ESM imports to test WebGL boundaries;
// keeping this pure helper local also makes those fixtures exercise actual code.
function followClimberContact(position, target, blend, state, sourceRimBoundary = false) {
  // A genuine fingertip grip or authoritative sole-over-deck transition is a
  // solid geometric boundary, not an interpolation target. At low browser
  // cadence the smoothed root otherwise intersects the opaque deck even
  // though the same source tick looks correct at another viewport/frame rate.
  // Lock only these source-observed boundary poses; ordinary locomotion
  // retains its damped, continuous follow. No simulated x/y or collision moves.
  if (sourceRimBoundary) position.copy(target);
  else {
    position.lerp(target, blend);
    if (state === 'standing') position.y = target.y;
  }
  return position;
}

// Camera motion must follow the OUTSIDE of the cylindrical tower. A Cartesian
// lerp between valid front-left and front-right viewpoints crosses the solid
// core, briefly hiding the real climber, guardian and their HP-operated gate.
// The shortest angular arc keeps the entire transition outside the walkable
// 27.18-unit outer deck, including overview/follow and floor transitions.
// This is presentation only and makes no additional render or raycast calls.
// Normal-speed original 390x844 guardian film at exact SHA 7fd5fb0a,
// run 42878341492, shows a fast series of changing tower-side viewpoints
// around native 14-23s. While BOTH genuinely drawn combatants are safely in
// picture, allow one calm CONTINUOUS exterior orbit rather than accelerating
// each small lens-score change into a new near-side architectural close pass.
// The first clipped actor/guardian, genuine core obstruction, stale source or
// slow frame INSTANTLY releases this comfort cap so camera safety remains first.
// This pure function consumes only current rendered projections, not future
// hits, synthetic boss poses, floor skips or gameplay-mutating events.
function towerDuelOrbitBudget(dt, aspect, actorNdc, guardianNdc,
    actorCoreClear, guardianCoreClear, foregroundPressure=0) {
  if (!Number.isFinite(dt) || dt <= 0 || dt > .1 ||
      !Number.isFinite(aspect) || aspect <= 0 || aspect > 3 ||
      !actorCoreClear || !guardianCoreClear || !actorNdc || !guardianNdc)
    return Infinity;
  const safe = (p, x, y) => [p.x,p.y,p.z].every(Number.isFinite) &&
    Math.abs(p.x) <= x && Math.abs(p.y) <= y &&
    p.z >= -1 && p.z <= 1;
  if (!safe(actorNdc,.66,.68) || !safe(guardianNdc,.69,.68) ||
      foregroundPressure > .26) return Infinity;
  // Camera turns at <=109 degrees/sec in an already readable portrait duel;
  // even landscape gets a bound. True panic/unsafe frames are never limited.
  return Math.min(.14, dt * (aspect < .85 ? 1.9 : 2.3));
}

function followTowerCamera(position, target, blend, maxAngularStep = Infinity) {
  const alpha = Math.max(0, Math.min(1, blend));
  const radius = Math.hypot(position.x, position.z);
  const targetRadius = Math.hypot(target.x, target.z);
  if (radius < .001 || targetRadius < .001) {
    position.copy(target);
    return position;
  }
  const from = Math.atan2(position.x, position.z);
  const to = Math.atan2(target.x, target.z);
  const turn = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const wantedStep = turn * alpha;
  const boundedStep = Number.isFinite(maxAngularStep) && maxAngularStep >= 0
    ? Math.sign(wantedStep) * Math.min(Math.abs(wantedStep), maxAngularStep)
    : wantedStep;
  const azimuth = from + boundedStep;
  const safeRadius = Math.max(27.35, radius + (targetRadius - radius) * alpha);
  position.set(Math.sin(azimuth) * safeRadius,
    position.y + (target.y - position.y) * alpha,
    Math.cos(azimuth) * safeRadius);
  return position;
}

// The aim target moves along the same cylindrical stage as the camera. A
// Cartesian midpoint between actors across a wide tower arc can stare through
// the empty/opaque core even when the camera itself stays outside. Keep the
// look-at point on its real source-derived annular route, with no artificial
// focus offset or anticipation; the endpoint remains the exact chosen pose.
function followTowerFocus(position, target, blend, maxAngularStep = Infinity) {
  const alpha = Math.max(0, Math.min(1, blend));
  const radius = Math.hypot(position.x, position.z);
  const targetRadius = Math.hypot(target.x, target.z);
  if (radius < .001 || targetRadius < .001) {
    position.copy(target);
    return position;
  }
  const from = Math.atan2(position.x, position.z);
  const to = Math.atan2(target.x, target.z);
  const turn = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const wantedStep = turn * alpha;
  const boundedStep = Number.isFinite(maxAngularStep) && maxAngularStep >= 0
    ? Math.sign(wantedStep) * Math.min(Math.abs(wantedStep), maxAngularStep)
    : wantedStep;
  const azimuth = from + boundedStep;
  const blendedRadius = radius + (targetRadius - radius) * alpha;
  position.set(Math.sin(azimuth) * blendedRadius,
    position.y + (target.y - position.y) * alpha,
    Math.cos(azimuth) * blendedRadius);
  return position;
}

// Genuine guardian contact gets a bounded camera catch-up when the chosen
// readable viewpoint is around the tower. Ordinary ascent keeps its calmer
// existing follow rate. Nothing anticipates a combat hit or slows the clock.
function towerCameraRate(current, target, guardianStaged, overview) {
  if (!guardianStaged || overview) return 3.5;
  const currentAngle = Math.atan2(current.x, current.z);
  const targetAngle = Math.atan2(target.x, target.z);
  const angularError = Math.abs(Math.atan2(
    Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle)));
  const radialError = Math.abs(Math.hypot(current.x, current.z) -
    Math.hypot(target.x, target.z)) / Math.max(27.35, Math.hypot(target.x, target.z));
  return Math.min(13.5, 5.2 + angularError * 5.2 + radialError * 2.4);
}

// The observed real-play portrait capture can briefly place the actual hero
// 1.2–2 NDC widths outside the image during dash/floor transitions. A fixed
// leisurely follow rate is cinematic only while the climber is still visible.
// Adapt BOTH the exterior-orbit camera and its annular gaze to the previous
// rendered frame's real climber screen position. No predictive physics,
// screen-space fake actor, authoritative clock or additional GPU passes.
// Quiet when the actor is centered; hard-capped to avoid violent camera whips.
function towerCameraActorSafetyRate(rate, ndcX, ndcY, aspect) {
  if (![rate, ndcX, ndcY, aspect].every(Number.isFinite) || aspect <= 0)
    return rate;
  const horizontal = aspect < .85 ? .7 : .8;
  const pressure = Math.max(0, Math.abs(ndcX) / horizontal - .75,
    Math.abs(ndcY) / .78 - .75);
  return Math.min(18, rate + pressure * 10);
}

// A REAL nearby guardian must become readable BEFORE its first wound, not
// several slow camera seconds after the opening hit. This bounded follow-rate
// correction uses its CURRENT projected body center from the preceding camera
// image. Never pull the camera toward an unseen, dead or distant opponent.
// The hero's existing offscreen rescue and safe exterior-orbit view still win.
function towerCameraGuardianSafetyRate(rate, ndcX, ndcY, aspect) {
  if (![rate, ndcX, ndcY, aspect].every(Number.isFinite) || aspect <= 0)
    return rate;
  const horizontal = aspect < .85 ? .8 : .87;
  const pressure = Math.max(0, Math.abs(ndcX) / horizontal - .78,
    Math.abs(ndcY) / .82 - .78);
  return pressure ? Math.max(rate, Math.min(17.5, 6.5 + pressure * 11)) : rate;
}

// Emergency stage direction is only a FALLBACK for a real, projected actor
// leaving the picture or becoming hidden by the solid cylindrical core.
// Keep the previous readable route/guardian composition whenever it is safe:
// this responds to a measured view failure, not a guessed future AI action.
// A bounded exterior orbit plus annular gaze avoids fake teleporting, a cut,
// scene-wide hiding/transparency, allocations or extra GPU submissions.
function recoverTowerActorView(position, gaze, actor, ndcX, ndcY, ndcZ, aspect, dt, orbitTarget) {
  // Hot-path validity checks avoid allocating a temporary array for each
  // submitted frame. Renderer recovery also rejects non-finite source poses.
  if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY) ||
    !Number.isFinite(ndcZ) || !Number.isFinite(aspect) ||
    !Number.isFinite(dt) || !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) || !Number.isFinite(position.z) ||
    !Number.isFinite(gaze.x) || !Number.isFinite(gaze.y) ||
    !Number.isFinite(gaze.z) || !Number.isFinite(actor.x) ||
    !Number.isFinite(actor.y) || !Number.isFinite(actor.z) ||
    aspect <= 0 || dt <= 0) return 0;
  const safeX = aspect < .85 ? .72 : .80;
  const projectedPressure = Math.max(
    Math.abs(ndcX) / safeX - 1, Math.abs(ndcY) / .78 - 1,
    ndcZ < -1 || ndcZ > 1 ? 1 : 0, 0);
  const occluded = !towerCoreSightlineClear(position, actor, 23.5);
  const pressure = Math.max(projectedPressure, occluded ? 1 : 0);
  if (pressure <= 0) return 0;
  // Real source-pinned portrait danger playback (candidate cb70b64, 2026-11-02)
  // still lost the real airborne climber at x=-1.2967 NDC. Its software
  // compositor sometimes submits frames >400ms apart; retaining the gentle
  // inside-frame .28 cap when the actor is ALREADY outside the picture can
  // leave several seconds of genuine traversal invisible. Escalate only
  // from a measured out-of-view projection, never from future simulation.
  const offscreen = Math.abs(ndcX) > 1 || Math.abs(ndcY) > 1 ||
    ndcZ < -1 || ndcZ > 1;
  const boundedDt = Math.min(dt, offscreen ? .10 : .05);
  const severity = Math.min(3, pressure);
  const response = Math.min(offscreen ? .48 : .28,
    (1 - Math.exp(-boundedDt * (3 + severity * 8))) * Math.min(1, .4 + severity));
  const actorAngle = Math.atan2(actor.x, actor.z);
  const cameraAngle = Math.atan2(position.x, position.z);
  const cameraArc = Math.atan2(
    Math.sin(actorAngle - cameraAngle), Math.cos(actorAngle - cameraAngle));
  const cameraStep = Math.min(offscreen ? .28 : .16,
    boundedDt * (offscreen ? 9 : 6.5));
  const orbitBlend = Math.min(response, cameraStep / Math.max(.001, Math.abs(cameraArc)));
  const radius = Math.max(27.35, Math.hypot(position.x, position.z));
  orbitTarget.set(Math.sin(actorAngle) * radius, position.y,
    Math.cos(actorAngle) * radius);
  followTowerCamera(position, orbitTarget, orbitBlend);
  const focusAngle = Math.atan2(gaze.x, gaze.z);
  const focusArc = Math.atan2(
    Math.sin(actorAngle - focusAngle), Math.cos(actorAngle - focusAngle));
  const focusStep = Math.min(offscreen ? .3 : .16,
    boundedDt * (offscreen ? 9.5 : 7));
  followTowerFocus(gaze, actor,
    Math.min(response, focusStep / Math.max(.001, Math.abs(focusArc))));
  return orbitBlend;
}

// A measured second-stage portrait rescue for the actual 3D protagonist.
// The ordinary route/guardian lens stays primary. Only PRESENT, in-picture
// actor pixels beyond the 78% safe margin can request a short extra exterior
// orbit and gaze response. Keep it only if the actual after-view is safer.
// No prediction, new mesh, GPU pass, game tick or authoritative mutation.
function refineTowerActorSafeFrame(camera, gaze, actor, dt,
  projection, orbitTarget, previousCamera, previousGaze,
  protectedSubject = null, protectedProjection = null) {
  if (!camera || !gaze || !actor || !projection || !orbitTarget ||
    !previousCamera || !previousGaze || !Number.isFinite(camera.aspect) ||
    camera.aspect >= .85 || camera.aspect <= 0 ||
    !Number.isFinite(dt) || dt <= 0) return 0;
  camera.lookAt(gaze);
  camera.updateMatrixWorld(true);
  projection.copy(actor).project(camera);
  if (!Number.isFinite(projection.x) || !Number.isFinite(projection.y) ||
    !Number.isFinite(projection.z) ||
    Math.abs(projection.x)>1 || Math.abs(projection.y)>1 ||
    projection.z < -1 || projection.z > 1) return 0;
  const before = Math.max(0, Math.abs(projection.x)/.78-1,
    Math.abs(projection.y)/.78-1);
  if(before<=.005) return 0;
  previousCamera.copy(camera.position);
  previousGaze.copy(gaze);
  // When a real, visible opponent is present, never repair the climber by
  // ejecting the other living combatant from the same camera frame.
  const protect = !!protectedSubject && !!protectedProjection &&
    Number.isFinite(protectedSubject.x) &&
    Number.isFinite(protectedSubject.y) &&
    Number.isFinite(protectedSubject.z) &&
    towerCoreSightlineClear(camera.position, protectedSubject, 23.5);
  if (protect) protectedProjection.copy(protectedSubject).project(camera);
  const protectedReadable = protect &&
    Number.isFinite(protectedProjection.x) &&
    Number.isFinite(protectedProjection.y) &&
    Number.isFinite(protectedProjection.z) &&
    Math.abs(protectedProjection.x) <= .82 &&
    Math.abs(protectedProjection.y) <= .80 &&
    protectedProjection.z >= -1 && protectedProjection.z <= 1;
  // Normal-speed authentic source 558924dc portrait outcome retained three
  // 0.84–0.88 NDC actor-margin breaches after a one-shot .012s rescue.
  // A measured TWO-step exterior orbit + gaze continuation is allowed ONLY
  // for a presently clipped, yet still visible, live protagonist. Each step
  // must independently improve the actual projected frame and preserve clear
  // tower-core sightlines. No prediction, camera cut, simulation mutation,
  // extra GPU pass or per-frame allocated objects.
  let previousPressure=before;
  let lastFraction=0;
  const firstAzimuth=Math.atan2(previousCamera.x,previousCamera.z);
  for(let attempt=0;attempt<3;attempt++){
    const step=recoverTowerActorView(camera.position,gaze,actor,
      projection.x,projection.y,projection.z,camera.aspect,
      Math.min(dt,.009),orbitTarget);
    if(step<=0)break;
    camera.lookAt(gaze);
    camera.updateMatrixWorld(true);
    projection.copy(actor).project(camera);
    if (protectedReadable) protectedProjection.copy(protectedSubject).project(camera);
    const protectedSafe = !protectedReadable ||
      (Number.isFinite(protectedProjection.x) &&
       Number.isFinite(protectedProjection.y) &&
       Number.isFinite(protectedProjection.z) &&
       Math.abs(protectedProjection.x) <= .82 &&
       Math.abs(protectedProjection.y) <= .80 &&
       protectedProjection.z >= -1 && protectedProjection.z <= 1 &&
       towerCoreSightlineClear(camera.position, protectedSubject, 23.5));
    const after=Math.max(0,Math.abs(projection.x)/.78-1,
      Math.abs(projection.y)/.78-1);
    const angle=Math.atan2(camera.position.x,camera.position.z);
    const turn=Math.abs(Math.atan2(Math.sin(angle-firstAzimuth),
      Math.cos(angle-firstAzimuth)));
    // Reject the entire continuation if any part hides the real climber or
    // makes an intermediate state worse; no frame may pass through opaque core.
    if(!Number.isFinite(after)||after+.0002>=previousPressure||
      Math.abs(projection.x)>1||Math.abs(projection.y)>1||
      projection.z < -1||projection.z > 1||turn>=.095||!protectedSafe||
      !towerCoreSightlineClear(camera.position,actor,23.5)){
      camera.position.copy(previousCamera);
      gaze.copy(previousGaze);
      camera.lookAt(gaze);
      camera.updateMatrixWorld(true);
      return 0;
    }
    previousPressure=after;
    lastFraction=Math.max(lastFraction,step);
    if(after<=.005)break;
  }
  if(lastFraction>0&&previousPressure+.0005<before)return lastFraction;
  camera.position.copy(previousCamera);
  gaze.copy(previousGaze);
  camera.lookAt(gaze);
  camera.updateMatrixWorld(true);
  return 0;
}

// Source-authentic portrait outcome film at c9a6cca8 contained SEVEN
// unsafe hero samples during live ascent (not during the actual ending).
// A final scene-space gaze adjustment protects the real hero after every
// impact, guardian shot and camera move. Never alter source gameplay or
// move the exterior camera through the solid tower. Roll back if the actual
// projection fails to improve or an already-visible subject is cropped.
function correctTowerPortraitFocus(camera,gaze,actor,guardian,landing,dt,
    actorProjection,guardianProjection,landingProjection,oldGaze,
    actorHalfHeight=0,guardianHalfHeight=0) {
  if(!camera||!gaze||!actor||!actorProjection||!guardianProjection||
     !landingProjection||!oldGaze||!camera.position||!camera.matrixWorld||
     !Number.isFinite(camera.aspect)||camera.aspect<=0||camera.aspect>=.85||
     !Number.isFinite(camera.fov)||camera.fov<=0||camera.fov>=150||
     !Number.isFinite(dt)||dt<=0) return 0;
  // A center point can fit on a phone while the real skinned climber's
  // head and boots are both cropped. Include observed body half-height in
  // the already-authoritative stage camera's framing contract. Conservative
  // perspective bounds include camera pitch and never change gameplay state.
  const bodySpan=(point,projected,halfHeight)=>{
    if(!Number.isFinite(halfHeight)||halfHeight<=0)return 0;
    const m=camera.matrixWorld.elements;
    const dx=point.x-camera.position.x,dy=point.y-camera.position.y,
      dz=point.z-camera.position.z;
    const depth=-(dx*m[8]+dy*m[9]+dz*m[10]);
    const tangent=Math.tan(camera.fov*Math.PI/360);
    const nearDepth=depth-Math.abs(m[9]*halfHeight);
    if(!Number.isFinite(nearDepth)||nearDepth<=1||tangent<=0)return Infinity;
    return halfHeight*(Math.abs(m[5])+
      Math.abs(projected.y)*tangent*Math.abs(m[9]))/(nearDepth*tangent);
  };
  camera.lookAt(gaze);camera.updateMatrixWorld(true);
  actorProjection.copy(actor).project(camera);
  const {x,y,z}=actorProjection;
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z)||
     Math.abs(x)>=1||Math.abs(y)>=1||z<=-1||z>=1||
     !towerCoreSightlineClear(camera.position,actor,23.5))return 0;
  const beforeSpan=bodySpan(actor,actorProjection,actorHalfHeight);
  if(!Number.isFinite(beforeSpan))return 0;
  const before=Math.max(Math.abs(x)/.78,(Math.abs(y)+beforeSpan)/.78);
  if(before<=1.015)return 0;
  let protectGuardian=false,protectLanding=false,guardianBeforePressure=0;
  if(guardian&&Number.isFinite(guardian.x)&&Number.isFinite(guardian.y)&&
     Number.isFinite(guardian.z)&&towerCoreSightlineClear(camera.position,guardian,23.5)){
    guardianProjection.copy(guardian).project(camera);
    protectGuardian=Number.isFinite(guardianProjection.x)&&
      Number.isFinite(guardianProjection.y)&&Number.isFinite(guardianProjection.z)&&
      Math.abs(guardianProjection.x)<=.82&&Math.abs(guardianProjection.y)<=.80&&
      guardianProjection.z>=-1&&guardianProjection.z<=1;
    if(protectGuardian){
      const guardianSpan=bodySpan(guardian,guardianProjection,guardianHalfHeight);
      if(!Number.isFinite(guardianSpan))return 0;
      guardianBeforePressure=Math.max(
        Math.abs(guardianProjection.x)/.82,
        (Math.abs(guardianProjection.y)+guardianSpan)/.80);
    }
  }
  if(landing&&Number.isFinite(landing.x)&&Number.isFinite(landing.y)&&
     Number.isFinite(landing.z)&&towerCoreSightlineClear(camera.position,landing,23.5)){
    landingProjection.copy(landing).project(camera);
    protectLanding=Number.isFinite(landingProjection.x)&&
      Number.isFinite(landingProjection.y)&&Number.isFinite(landingProjection.z)&&
      Math.abs(landingProjection.x)<=.9&&Math.abs(landingProjection.y)<=.88&&
      landingProjection.z>=-1&&landingProjection.z<=1;
  }
  const m=camera.matrixWorld.elements;
  const depth=-((actor.x-camera.position.x)*m[8]+
    (actor.y-camera.position.y)*m[9]+(actor.z-camera.position.z)*m[10]);
  const span=Math.tan(camera.fov*Math.PI/360)*depth;
  if(!Number.isFinite(span)||span<=0||depth<=1)return 0;
  const speed=Math.max(.35,Math.min(1,dt*22));
  const horizontal=Math.sign(x)*Math.max(0,Math.abs(x)-.68);
  // Pan toward the genuinely clipped head OR boots, not merely the torso.
  // A too-tall body cannot be rescued by inventing a zoom/camera cut; the
  // before/after bound below rejects pan attempts that crop its opposite end.
  const headOverflow=Math.max(0,y+beforeSpan-.70);
  const bootOverflow=Math.max(0,-.70-y+beforeSpan);
  const vertical=headOverflow>=bootOverflow?headOverflow:-bootOverflow;
  const sx=Math.max(-1.3,Math.min(1.3,horizontal*span*camera.aspect*speed));
  const sy=Math.max(-.9,Math.min(.9,vertical*span*speed));
  if(Math.abs(sx)+Math.abs(sy)<.001)return 0;
  oldGaze.copy(gaze);
  gaze.x+=m[0]*sx+m[4]*sy;
  gaze.y+=m[1]*sx+m[5]*sy;
  gaze.z+=m[2]*sx+m[6]*sy;
  camera.lookAt(gaze);camera.updateMatrixWorld(true);
  actorProjection.copy(actor).project(camera);
  const afterSpan=bodySpan(actor,actorProjection,actorHalfHeight);
  const after=Math.max(Math.abs(actorProjection.x)/.78,
    (Math.abs(actorProjection.y)+afterSpan)/.78);
  let good=Number.isFinite(after)&&after+.012<before&&
    Number.isFinite(actorProjection.z)&&
    Math.abs(actorProjection.x)<.96&&Math.abs(actorProjection.y)<.96&&
    actorProjection.z>=-1&&actorProjection.z<=1&&
    towerCoreSightlineClear(camera.position,actor,23.5);
  if(good&&protectGuardian){
    guardianProjection.copy(guardian).project(camera);
    good=Number.isFinite(guardianProjection.x)&&Number.isFinite(guardianProjection.y)&&
      Number.isFinite(guardianProjection.z)&&
      Math.abs(guardianProjection.x)<=.82&&Math.abs(guardianProjection.y)<=.80&&
      guardianProjection.z>=-1&&guardianProjection.z<=1&&
      Number.isFinite(guardianBeforePressure)&&
      Math.max(Math.abs(guardianProjection.x)/.82,
        (Math.abs(guardianProjection.y)+
          bodySpan(guardian,guardianProjection,guardianHalfHeight))/.80)
        <=Math.max(1,guardianBeforePressure)+.005&&
      towerCoreSightlineClear(camera.position,guardian,23.5);
  }
  if(good&&protectLanding){
    landingProjection.copy(landing).project(camera);
    good=Number.isFinite(landingProjection.x)&&Number.isFinite(landingProjection.y)&&
      Number.isFinite(landingProjection.z)&&
      Math.abs(landingProjection.x)<=.9&&Math.abs(landingProjection.y)<=.88&&
      landingProjection.z>=-1&&landingProjection.z<=1&&
      towerCoreSightlineClear(camera.position,landing,23.5);
  }
  if(good)return before-after;
  gaze.copy(oldGaze);camera.lookAt(gaze);camera.updateMatrixWorld(true);
  return 0;
}

// Wide jumps must keep the camera's chosen stage on the exterior cylinder.
// Cartesian midpoint focus can stare straight into opaque stone. Only the
// real visible actor, live route and observed threat select these coordinates.
function blendTowerStageFocus(center, subject, weight) {
  const amount = clamp(weight, 0, 1);
  const r0 = Math.hypot(center.x, center.z), r1 = Math.hypot(subject.x, subject.z);
  const start = Math.atan2(center.x, center.z);
  const end = Math.atan2(subject.x, subject.z);
  const arc = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  // Preserve the proven close-route camera: even a small geometric focus
  // shift can shrink the hero or place its real destination beacon behind
  // a stone upright. Reserve exterior-arc correction for exceptional
  // opposite-side routes where a Cartesian chord goes deep into the core.
  if (r0 > 1 && r1 > 1 && Math.abs(arc) > 1.05) {
    const angle = start + arc * amount, radius = lerp(r0, r1, amount);
    center.x = Math.sin(angle) * radius; center.z = Math.cos(angle) * radius;
  } else {
    center.x = lerp(center.x, subject.x, amount);
    center.z = lerp(center.z, subject.z, amount);
  }
  center.y = lerp(center.y, subject.y, amount);
  return center;
}

// A genuine terminal source gets its own physical stage framing: the last
// CLIMBER position and eight source-earned memorial rungs must fit together
// on a phone. No victory pose, fake checkpoint, camera cut or HUD narration.
// Unlike the mid-ascent camera this wide exterior shot cannot look through the
// solid tower core to a fictional destination. User orbit/zoom still work.
function composeTowerTerminalShot(hero, aspect, zoom = 1, orbit = 0,
  resultAgeSeconds = 0, reducedMotion = false) {
  if (!hero || ![hero.x, hero.y, hero.z, aspect, zoom, orbit,
    resultAgeSeconds].every(Number.isFinite) || aspect <= 0) return null;
  const portrait = aspect < .85;
  const heroRadius = Math.max(27.35, Math.hypot(hero.x, hero.z));
  // The actual source outcome is an entire physical sequence: begin with an
  // exterior establishing view of the fallen climber and earned-floor rungs,
  // then resolve onto their silhouettes over 1.9 seconds. No fabricated
  // result, scene cut, extra render pass, or authoritative time change.
  const established = clamp((resultAgeSeconds - .25) / 1.9, 0, 1);
  const finish = reducedMotion ? 1 : established * established * (3 - 2 * established);
  const wide = portrait ? 35 : 29;
  const close = portrait ? 27.5 : 23.7;
  // Respect a viewer's wider zoom. The close portrait lens still admits the
  // ~8-unit-wide physical terminal memorial and the true skinned character.
  const radius = heroRadius + (wide + (close - wide) * finish) *
    clamp(zoom, 1, 1.35);
  const angle = Math.atan2(hero.x, hero.z) + (portrait ? .015 : .08) +
    clamp(orbit, -.5, .5) * .25 +
    (reducedMotion ? 0 : (1 - finish) * .025);
  const position = new THREE.Vector3(Math.sin(angle) * radius,
    hero.y + (portrait ? 8.2 - 1.3 * finish : 6.5 - .9 * finish),
    Math.cos(angle) * radius);
  const focus = new THREE.Vector3(hero.x, hero.y + 2.1, hero.z);
  return { position, focus, stageProgress: finish };
}

// Evidence-only approximate core occlusion for the inset bronze lock. A point
// can project inside the phone viewport while sitting behind the tower; do not
// award it a camera-composition preference or a visible-gate diagnostic then.
// World meshes may add occlusion, so this is a necessary, not sufficient, test.
// Reads only fixed-step public snapshots. A single stage cue links real guardian
// attrition and windup with the skinned climber's camera-side illumination.
// No invented hits, RNG, authority mutation, extra light or flickering.
function createObservedTowerLightDirector() {
  let token = null, floor = null, lastTick = -1, lastHealth = null;
  let tension = 0, armor = 0, motion = 0, hitGlow = 0;
  const cue = { threat: 0, armor: 0, motion: 0, guardian: false };
  function reset() {
    token = null; floor = null; lastTick = -1; lastHealth = null;
    tension = 0; armor = 0; motion = 0; hitGlow = 0;
    cue.threat = 0; cue.armor = 0; cue.motion = 0; cue.guardian = false;
  }
  function sample(snapshot, dt, stale = false, reduced = false) {
    if (!snapshot?.player || !Number.isSafeInteger(snapshot.tick)) {
      reset(); return cue;
    }
    if (token !== snapshot.runToken || floor !== snapshot.floor) {
      reset(); token = snapshot.runToken; floor = snapshot.floor;
    }
    const running = snapshot.lifecycle === 'running' && snapshot.player.health > 0 && !stale;
    const guardian = running && snapshot.enemies?.find(enemy =>
      enemy.kind === 'guardian' && enemy.active && enemy.maxHealth > 0);
    if (snapshot.tick > lastTick) {
      if (guardian && lastHealth !== null && lastTick >= 0 &&
        snapshot.tick - lastTick <= 8 && guardian.health < lastHealth) hitGlow = 1;
      lastHealth = guardian ? guardian.health : null;
      lastTick = snapshot.tick;
    }
    const targetThreat = running ? Math.max(guardian?.telegraph ? 1 : 0,
      snapshot.dangerPermille >= 800 ? .42 : 0) : 0;
    const targetArmor = guardian ? Math.max(0, Math.min(1,
      1 - guardian.health / guardian.maxHealth)) : 0;
    const moving = running && (snapshot.player.state === 'dashing' ||
      Math.abs(snapshot.player.vx) > 4500) ? 1 : 0;
    const seconds = Number.isFinite(dt) ? Math.max(0, Math.min(.08, dt)) : 0;
    const blend = 1 - Math.exp(-seconds * 3.6);
    tension += (targetThreat - tension) * blend;
    armor += (targetArmor - armor) * blend;
    motion += (moving - motion) * blend;
    hitGlow = Math.max(0, hitGlow - seconds * 1.8);
    cue.threat = reduced ? 0 : Math.min(1, tension + hitGlow * .28);
    cue.armor = Math.max(0, Math.min(1, armor));
    cue.motion = reduced ? 0 : Math.max(0, Math.min(1, motion));
    cue.guardian = !!guardian;
    return cue;
  }
  return { sample, reset, cue };
}

// Only PREVIOUSLY OBSERVED climber positions enter this bounded source ledger.
// It cannot predict a jump, create a phantom collider or carry a wake into a
// fresh floor/run. Its render is optional and absent in reduced-motion mode.
function createObservedTowerMotionLedger() {
  const samples = [];
  function reset() { samples.length = 0; }
  function accept(previous, next) {
    if (!previous?.player || !next?.player ||
      previous.runToken !== next.runToken || previous.floor !== next.floor ||
      next.lifecycle !== 'running' || next.player.health <= 0 ||
      !Number.isSafeInteger(next.tick) || !Number.isSafeInteger(previous.tick) ||
      next.tick <= previous.tick || next.tick - previous.tick > 8) {
      reset(); return;
    }
    const dx = next.player.x - previous.player.x, dy = next.player.y - previous.player.y;
    const moving = next.player.state === 'airborne' || next.player.state === 'dashing' ||
      previous.player.state === 'airborne' || previous.player.state === 'dashing' ||
      Math.abs(next.player.vx) > 4500;
    if (moving && Number.isFinite(dx) && Number.isFinite(dy) &&
      Number.isFinite(next.player.x) && Number.isFinite(next.player.y) &&
      Math.abs(dx) + Math.abs(dy) > 700) {
      if (!samples.length) samples.push({ tick: previous.tick,
        x: previous.player.x, y: previous.player.y });
      samples.push({ tick: next.tick, x: next.player.x, y: next.player.y });
    }
    while (samples.length && (samples.length > 13 || next.tick - samples[0].tick > 18))
      samples.shift();
  }
  return { samples, reset, accept };
}

// Actual projected BODY share; center-only NDC checks can miss tiny heroes.
function measureDuelBodyNdc(center, halfHeight, lens, top, bottom, result) {
  top.copy(center); top.y += halfHeight; top.project(lens);
  bottom.copy(center); bottom.y -= halfHeight; bottom.project(lens);
  result[0] = (top.x + bottom.x) * .5;
  result[1] = (top.y + bottom.y) * .5;
  result[2] = Math.max(top.z, bottom.z);
  result[3] = Math.abs(top.y - bottom.y) * .5;
}
function towerCoreSightlineClear(position, point, coreRadius = 21.6) {
  const dx = point.x - position.x, dz = point.z - position.z;
  const denominator = dx * dx + dz * dz;
  const t = denominator > 1e-8
    ? Math.max(0, Math.min(1, -(position.x * dx + position.z * dz) / denominator))
    : 0;
  return Math.hypot(position.x + t * dx, position.z + t * dz) >= coreRadius;
}

// The hand's rigid meshes are batched onto the right-elbow bone. Transform its
// authored wrist point after posing so the cosmetic strike follows real motion.
function positionStrikeCue(arc, rig, camera) {
  const elbow = rig.getObjectByName('1-elbow');
  if (!elbow) { arc.visible = false; return false; }
  elbow.updateWorldMatrix(true, false);
  arc.position.set(0, -.39, .015);
  elbow.localToWorld(arc.position);
  arc.quaternion.copy(camera.quaternion);
  return true;
}

const MAX_PARTICLES=96;
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const scratch = new THREE.Vector3();
const focus = new THREE.Vector3();
const destination = new THREE.Vector3();
const seeded = value => { const n = Math.sin(value * 127.13 + 38.37) * 43758.5453; return n - Math.floor(n); };

// The retained AI target can outlive the action that selected it. In particular,
// the first standing snapshot still carries the preceding air-control intent.
// A destination marking is a statement about the present route, not a guess.
function intendedLanding(snapshot) {
  const player = snapshot.player, mode = snapshot.intent?.mode?.replace(/^oracle-/, '');
  if ((snapshot.lifecycle && snapshot.lifecycle !== 'running') || player.health <= 0
    || !['aligning', 'jumping', 'air-control', 'settling-landing'].includes(mode)) return null;
  const target = snapshot.platforms.find(platform => platform.id === snapshot.intent.targetPlatformId);
  if (!target || target.width <= 0) return null;
  const feet = player.y - player.halfHeight;
  const onTarget = player.state === 'standing' && Math.abs(feet - target.y - target.height) < 2000
    && player.x + (player.halfWidth || 9000) >= target.x
    && player.x - (player.halfWidth || 9000) <= target.x + target.width;
  return onTarget ? null : target;
}


/**
 * Source-observed contact depth for the actual 3D climber. A platform is only
 * eligible when it exists NOW underneath the player's true fixed-step feet.
 * Never extrapolate a deck's movement or make an AI-selected destination look
 * like a secured landing. This is a render-only depth cue.
 */
function observedTowerFooting(snapshot) {
  const player = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || !player || player.health <= 0
    || !Array.isArray(snapshot.platforms) || !Number.isFinite(snapshot.worldWidth)
    || snapshot.worldWidth <= 0 || !Number.isFinite(player.x)
    || !Number.isFinite(player.y) || !Number.isFinite(player.halfHeight)
    || player.halfHeight <= 0) return null;
  const feet = player.y - player.halfHeight;
  const halfWidth = Number.isFinite(player.halfWidth) && player.halfWidth > 0
    ? player.halfWidth : 9000;
  let closest = null, clearance = Infinity;
  for (const platform of snapshot.platforms) {
    if (!platform || typeof platform.id !== 'string'
      || ![platform.x, platform.y, platform.width, platform.height].every(Number.isFinite)
      || platform.width <= 0 || platform.height <= 0
      || player.x + halfWidth < platform.x
      || player.x - halfWidth > platform.x + platform.width) continue;
    const top = platform.y + platform.height;
    const gap = feet - top;
    // Decks above the feet, more than 18 world units below, or outside the
    // actual overlap cannot own a shadow. Small standing contact tolerances
    // account for fixed-point support and moving deck quantization.
    if (gap < -1800 || gap > 180000 || Math.max(0, gap) >= clearance) continue;
    clearance = Math.max(0, gap);
    closest = { platformId: platform.id, x: Math.max(platform.x,
      Math.min(player.x, platform.x + platform.width)), top,
      clearance, grounded: player.state === 'standing' && gap <= 2500 };
  }
  return closest;
}

// The cap is the TRUE current-floor summit, not the AI's predicted landing.
// A distant cosmetic beacon must never masquerade as an unlocked gate, a
// defeated guardian, or a completed floor. This only reads public snapshots.
function observeTowerCrown(snapshot) {
  const hero = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || !hero || hero.health <= 0 ||
    !Number.isSafeInteger(snapshot.floor) || !Number.isSafeInteger(snapshot.tick) ||
    typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
    !Number.isFinite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
    !Number.isFinite(snapshot.chunkBaseY) || !Number.isFinite(hero.y) ||
    !Array.isArray(snapshot.platforms)) return null;
  const cap = snapshot.platforms.find(platform =>
    platform?.id === 'f' + snapshot.floor + ':cap' &&
    [platform.x, platform.y, platform.width, platform.height].every(Number.isFinite) &&
    platform.width > 0 && platform.height > 0);
  if (!cap) return null;
  const top = cap.y + cap.height;
  const distance = (top - hero.y) / SCALE;
  if (!Number.isFinite(distance) || distance < -9 || distance > 70) return null;
  const guardian = snapshot.enemies?.find(enemy =>
    enemy.kind === 'guardian' && enemy.active === true &&
    typeof enemy.id === 'string' && enemy.id &&
    Number.isFinite(enemy.health) && Number.isFinite(enemy.maxHealth) &&
    enemy.maxHealth > 0 && enemy.health > 0 && enemy.health <= enemy.maxHealth);
  const anchorX = guardian ? guardianGateAnchorX(snapshot, cap)
    : cap.x + cap.width * .5;
  if (!Number.isFinite(anchorX)) return null;
  return {
    capId: cap.id, anchorX, top, width: snapshot.worldWidth,
    baseY: snapshot.chunkBaseY, sourceTick: snapshot.tick,
    distance, guardianId: guardian?.id || null,
    guardianHealthRatio: guardian ? clamp(guardian.health / guardian.maxHealth, 0, 1) : null,
    telegraph: guardian?.telegraph === true,
  };
}

function ledgeContactPoint(snapshot, platform) {
  const player = snapshot?.player;
  if (!platform || !player || player.state !== 'airborne' || player.vy <= 0 ||
    player.health <= 0 || player.attacking) return null;
  const values = [player.x, player.y, player.halfHeight, player.halfWidth, player.facing,
    platform.x, platform.y, platform.width, platform.height];
  if (!values.every(Number.isFinite) || player.halfHeight <= 0 ||
    player.halfWidth <= 0 || platform.width <= 0) return null;
  const top = platform.y + platform.height;
  const aboveFeet = top - (player.y - player.halfHeight);
  const fullHeight = player.halfHeight * 2;
  // Contact is possible only around upper-torso/raised-arm height.
  if (aboveFeet < fullHeight * .59 || aboveFeet > fullHeight * .93) return null;
  const intendedX = player.x + Math.sign(player.facing) * player.halfWidth * .65;
  const touchX = Math.max(platform.x, Math.min(intendedX, platform.x + platform.width));
  if (Math.abs(touchX - player.x) > player.halfWidth * 1.2) return null;
  return { x: touchX, y: top };
}

// One-way 2D ascents otherwise put the visible helmet THROUGH an opaque
// annular deck. Keep physics, feet height and every authoritative x/y tick
// unchanged: guide only the 3D presentation through an exterior climbing lane
// before the crown reaches the slab, then let normal grounded follow return
// the robot onto the deck. The corridor starts early to avoid a one-frame pop.
function climbApproachRadius(snapshot, platform) {
  const player = snapshot?.player;
  if (!platform || !player || player.state !== 'airborne' || player.vy <= 0
    || player.health <= 0 || player.attacking) return 25;
  const values = [player.x, player.y, player.halfHeight, player.halfWidth,
    platform.x, platform.y, platform.width, platform.height];
  if (!values.every(Number.isFinite) || player.halfHeight <= 0
    || player.halfWidth <= 0 || platform.width <= 0) return 25;
  // A remote deck at the same height must never pull the climber off its lane.
  if (player.x + player.halfWidth * 1.5 < platform.x
    || player.x - player.halfWidth * 1.5 > platform.x + platform.width) return 25;
  const height = player.halfHeight * 2;
  const aboveFeet = platform.y + platform.height - (player.y - player.halfHeight);
  // Keep the true fingertip-contact crown outside opaque stone while its
  // head overlaps the deck. The old approach stayed at radius 28.05 even
  // *after* the actual boots reached the platform collision top: a floating
  // step beyond the outer rim in both GPU views. Start the return only once
  // the helmet is above the slab, and move the visible rig root into the
  // 22.4..27.18 walking band as the authoritative feet cross its height.
  // This stages a boot-over-rim opportunity, not proof of sole contact,
  // a new gameplay collision or
  // an invented standing state; keep subsequent release bounded and smooth.
  if (aboveFeet > height * 1.65 || aboveFeet < -height * 1.25) return 25;
  if (aboveFeet >= 0) {
    const approach = Math.max(0, Math.min(1, (height * 1.65 - aboveFeet) / (height * .65)));
    const overRim = Math.max(0, Math.min(1, (height * .78 - aboveFeet) / (height * .78)));
    const weight = overRim * overRim * (3 - 2 * overRim);
    return 25 + 3.05 * approach - .95 * weight;
  }
  const cleared = Math.min(1, -aboveFeet / (height * 1.25));
  const retreat = cleared * cleared * (3 - 2 * cleared);
  return 25 + 2.1 * (1 - retreat);
}

// Deterministic presentation keyframe driven by the *real* intended platform,
// not by a guessed wall or a timer. The first physical grip remains the IK
// solver's domain; after clearance this only stages the visible push-off and
// subsequent free leap. The authoritative player path stays unchanged.
function ledgeMantlePose(snapshot, platform) {
  const player = snapshot?.player;
  if (!platform || !player || player.state !== 'airborne' || player.vy <= 0
    || player.health <= 0 || player.attacking) return null;
  const values = [player.x, player.y, player.halfHeight, player.halfWidth,
    platform.x, platform.y, platform.width, platform.height];
  if (!values.every(Number.isFinite) || player.halfHeight <= 0
    || player.halfWidth <= 0 || platform.width <= 0
    || player.x + player.halfWidth * 1.5 < platform.x
    || player.x - player.halfWidth * 1.5 > platform.x + platform.width) return null;
  const height = player.halfHeight * 2;
  const clearance = player.y - player.halfHeight - platform.y - platform.height;
  if (clearance <= -height * .9 || clearance >= height * 1.5) return null;
  const progress = Math.max(0, Math.min(1, (clearance + height * .85) / (height * 1.5)));
  const enter = Math.max(0, Math.min(1, (clearance + height * .9) / (height * .25)));
  const leave = Math.max(0, Math.min(1, (height * 1.5 - clearance) / (height * .75)));
  const weight = Math.min(enter, leave);
  return weight > 0 ? { progress, weight } : null;
}

// An armored guardian can stand under the final one-way cap with less vertical
// space than its full visible crest. Let only the presentation rig tuck its head;
// the cap, hitboxes, authored height, replay and public state remain unchanged.
// Measure the actual posed fingertip, never merely the requested deck point.
// This creates no collision, grabs, lights or authority-side contact.
function measureLedgeFingertip(climberGroup, target, platformId) {
  if (!target) return null;
  const worldTarget = new THREE.Vector3(target.x, target.y, target.z);
  const body = climberGroup.getObjectByName('articulated-body');
  if (!body) return { platformId, target: worldTarget.toArray(), fingertip: null, errorWorld: null, reason: 'missing-body' };
  const localTarget = body.worldToLocal(worldTarget.clone());
  const elbow = climberGroup.getObjectByName((localTarget.x >= 0 ? 1 : -1) + '-elbow');
  if (!elbow) return { platformId, target: worldTarget.toArray(), fingertip: null, errorWorld: null, reason: 'missing-elbow' };
  elbow.updateWorldMatrix(true, false);
  const fingertip = elbow.localToWorld(new THREE.Vector3(0, -.802, .108));
  const helmet = climberGroup.getObjectByName('expressive-helmet');
  helmet?.updateWorldMatrix(true, false);
  const helmetWorld = helmet ? helmet.localToWorld(new THREE.Vector3()) : null;
  // Conservative 0.7-unit armor envelope, measured against the real 27.18
  // radius of the deck's front rim. Geometry diagnostics are NOT visual proof.
  const helmetClearanceWorld = helmetWorld
    ? Math.hypot(helmetWorld.x, helmetWorld.z) - 27.18 - .7 * climberGroup.scale.x
    : null;
  return { platformId, target: worldTarget.toArray(), fingertip: fingertip.toArray(),
    errorWorld: fingertip.distanceTo(worldTarget), helmetWorld: helmetWorld?.toArray() || null,
    helmetClearanceWorld, reason: null };
}

// Evidence-only projection of the actual animated boots and lower walking deck.
// NDC coordinates are geometric proxies, not raster occlusion or live FPS.
// This runs only when diagnostics are requested; it never alters game state.
function measureLedgeProjection(snapshot, climberGroup, camera) {
  const player = snapshot?.player;
  if (!player || !climberGroup || !camera) return null;
  climberGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const project = point => point.clone().project(camera).toArray();
  const root = climberGroup.getWorldPosition(new THREE.Vector3());
  const ankles = [];
  for (const side of [-1, 1]) {
    const joint = climberGroup.getObjectByName(side + '-ankle');
    if (!joint) continue;
    joint.updateWorldMatrix(true, false);
    const world = joint.getWorldPosition(new THREE.Vector3());
    ankles.push({ side, world: world.toArray(), ndc: project(world) });
  }
  const feetY = player.y - player.halfHeight;
  let lower = null, bestTop = -Infinity;
  for (const platform of snapshot.platforms || []) {
    if (!Number.isFinite(platform.x) || !Number.isFinite(platform.y)
      || !Number.isFinite(platform.width) || !Number.isFinite(platform.height)
      || platform.width <= 0 || player.x + player.halfWidth < platform.x
      || player.x - player.halfWidth > platform.x + platform.width) continue;
    const top = platform.y + platform.height;
    if (top > feetY + Math.max(2000, player.halfHeight * .3) || top <= bestTop) continue;
    bestTop = top;
    lower = platform;
  }
  let lowerDeck = null;
  if (lower) {
    const x = Math.min(lower.x + lower.width, Math.max(lower.x, player.x));
    lowerDeck = {
      platformId: lower.id,
      topWorldY: (bestTop - snapshot.chunkBaseY) / SCALE,
      samples: [22.4, 24.8, 27.18].map(radius => {
        const point = pointFor(x, bestTop, snapshot.chunkBaseY, snapshot.worldWidth, radius);
        const world = new THREE.Vector3(point.x, point.y, point.z);
        return { radius, world: world.toArray(), ndc: project(world) };
      }),
    };
  }
  return { tick: snapshot.tick, state: player.state,
    rootRadius: Math.hypot(root.x, root.z), rootWorld: root.toArray(),
    ankles, lowerDeck };
}

function guardianCanopyClearance(snapshot, enemy) {
  if (enemy.kind !== 'guardian' || !enemy.active) return Infinity;
  const feet = enemy.y - enemy.halfHeight;
  const fullHeight = enemy.halfHeight * 2 / SCALE;
  let clearance = Infinity;
  for (const deck of snapshot.platforms || []) {
    if (!deck.id.endsWith(':cap') || deck.x > enemy.x + enemy.halfWidth
      || deck.x + deck.width < enemy.x - enemy.halfWidth) continue;
    // The cap's curved walking surface stays at collision height. Its thin
    // visual underside and a margin reserve 0.12 world units above the crest.
    const room = (deck.y + deck.height - feet) / SCALE - .12;
    if (room > 0 && room < fullHeight + .25) clearance = Math.min(clearance, room);
  }
  return clearance;
}

// Sample the visible helmet's outer contour in the animated bone's own local
// coordinates, not a center-only ray. At desktop width the cap crosses the
// upper right edge while both center rays remain clear. The 0.05-unit rim guard
// accommodates the armored extrusion bevel. Nine fixed rays per visible
// guardian reuse their Vector3s and never alter the skinned rig or authority.
const GUARDIAN_CROWN_CONTOUR = [
  [0, 0, .43], [0, .34, .24],
  [-.5, .38, .2], [.5, .38, .2],
  [-.5, .12, .2], [.5, .12, .2],
  [-.45, -.24, .3], [.45, -.24, .3], [0, -.22, .48],
];
function sampleGuardianCrownSightlines(head, reuse) {
  for (let i = 0; i < GUARDIAN_CROWN_CONTOUR.length; i++) {
    const target = reuse[i] ||= new THREE.Vector3();
    target.set(...GUARDIAN_CROWN_CONTOUR[i]);
    head.localToWorld(target);
  }
  reuse.length = GUARDIAN_CROWN_CONTOUR.length;
  return reuse;
}

// Projected whole-body occlusion is the missing physical camera constraint.
// Original 390x844 footage at exact 9095a5b0 (20s) shows an enormous
// foreground guardian/maul obscuring the real climber even when BOTH centres
// remain inside the cropped screen. Plan from the source's complete hitbox
// corners; audit the currently submitted view with current model positions.
// This is a conservative rectangular upper bound, NOT pixel-perfect footage.
// Both players, AI, guardian collision, hazard, gateway and source ticks remain
// untouched. No extra rendered objects or per-frame allocations are required.
function observedDuelBounds(corners) {
  if (!Array.isArray(corners) || corners.length !== 4 ||
    corners.some(point => !Array.isArray(point) || point.length !== 3 ||
      !point.every(Number.isFinite) || point[2] <= 0)) return null;
  const x = corners.map(point => point[0]), y = corners.map(point => point[1]);
  return {left:Math.min(...x),right:Math.max(...x),
    bottom:Math.min(...y),top:Math.max(...y),
    depth:corners.reduce((sum,point)=>sum+point[2],0)/4};
}
function observedGuardianForegroundPressure(actor, guardian) {
  const fields=['left','right','bottom','top','depth'];
  if (!actor || !guardian ||
      [actor,guardian].some(box=>fields.some(key=>!Number.isFinite(box[key])) ||
        box.right<=box.left || box.top<=box.bottom || box.depth<=0))
    return {occlusion:0,dominance:0};
  const actorW=actor.right-actor.left, actorH=actor.top-actor.bottom;
  const guardianW=guardian.right-guardian.left, guardianH=guardian.top-guardian.bottom;
  const x=Math.max(0,Math.min(actor.right,guardian.right)-Math.max(actor.left,guardian.left));
  const y=Math.max(0,Math.min(actor.top,guardian.top)-Math.max(actor.bottom,guardian.bottom));
  // A larger guardian is legitimate; a 3x-close-up hiding the source hero is
  // not. Only a genuinely nearer opponent can occlude the player in depth.
  const inFront=guardian.depth < actor.depth-Math.max(.35,actor.depth*.025);
  return {
    occlusion:inFront?Math.min(1,x*y/(actorW*actorH)):0,
    dominance:inFront?Math.min(1.5,Math.max(0,guardianH/actorH-2.35)/1.9):0,
  };
}

// Keep a previously source-safe guardian shot unless the challenger delivers
// a material gain. Without this, tiny HP/telegraph changes can select a new
// orbit every fixed tick and make the fight feel like a roaming debug camera.
// A blocked core, cropped guardian or tiny protagonist is NEVER retained.
// Presentation only: no state/AI/physics, extra mesh or renderer submission.
function retainGuardianCameraShot(best, previous, quality) {
  if (!previous || !previous.clear || !previous.guardianFramed ||
    !Number.isFinite(previous.heroFraction) || previous.heroFraction < .15) return best;
  // Don't retain a center-safe but physically hidden climber for "comfort".
  // In a real foreground body overlap the safety correction outranks
  // hysteresis, but is not triggered by a large guardian BEHIND the hero.
  if (previous.guardianForegroundOcclusion > .32 &&
      best.guardianForegroundOcclusion < previous.guardianForegroundOcclusion-.10)
    return best;
  const priorScore = quality(previous), bestScore = quality(best);
  return Number.isFinite(priorScore) && Number.isFinite(bestScore) &&
    priorScore >= bestScore - 2.25 ? previous : best;
}

// A physically coherent two-body fight must remain legible, not merely have
// both source-authenticated hitboxes technically inside a tiny phone picture.
// Score the smaller REAL projected silhouette heavily, so a wide camera
// cannot trade a thumbnail-sized guardian for a flattering bronze landmark.
// No screen-space stand-ins, source mutations, zoom cuts or extra draw passes.
function observedGuardianDuelLegibility(heroCorners, guardianCorners) {
  const bodyHeight = corners => {
    if (!Array.isArray(corners) || corners.length !== 4 ||
        corners.some(p => !Array.isArray(p) || p.length !== 3 ||
          !p.every(Number.isFinite) || p[2] <= 0)) return 0;
    return Math.max(0, (Math.max(...corners.map(p => p[1])) -
      Math.min(...corners.map(p => p[1]))) / 2);
  };
  const heroFraction = bodyHeight(heroCorners);
  const guardianFraction = bodyHeight(guardianCorners);
  // Invalid or absent physical bodies never earn a framing preference.
  // Otherwise a missing guardian would still score the hero on its own.
  if (heroFraction <= 0 || guardianFraction <= 0)
    return { heroFraction, guardianFraction, score: 0 };
  const smaller = Math.min(heroFraction, guardianFraction);
  return { heroFraction, guardianFraction,
    score: Math.min(.26, smaller) * 105 +
      (Math.min(.26, heroFraction) + Math.min(.26, guardianFraction)) * 18 };
}

// The live tactical pilot can deliberately land clear of real current active
// spikes AND occupied enemy bodies. All three arrival cues (camera destination, deck ink,
// and chevron) must honor the same SOURCE-declared lane as the existing 3D
// choice stones. A historical-v1, ordinary route or untrusted frame stays at
// the platform midpoint. This is a present-observation projection, never a
// predicted collision, new platform or authority state. Keep this partition
// contract synchronized with route-intent.mjs and the tactical AI.
function observedSourceLandingX(snapshot, deck) {
  const center = deck.x + deck.width * .5;
  const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
  const summary = snapshot?.intent?.summary;
  const declared = (mode === 'air-control' &&
    (summary === 'Steering for a clear landing lane' ||
      summary === 'Boosting toward a distant safe landing' ||
      summary === 'Using earned air recovery to reach observed landing')) ||
    (mode === 'settling-landing' && summary === 'Braking into a clear landing lane');
  const player = snapshot?.player;
  if (!declared || !Number.isFinite(player?.halfWidth) ||
      !Number.isFinite(player?.x) || !Number.isFinite(player?.y) ||
      !Array.isArray(snapshot?.hazards)) return center;
  const halfWidth = player.halfWidth;
  const margin = Math.max(halfWidth + 4000,
    Math.min(18000, Math.floor(deck.width / 8)));
  const left = deck.x + margin, right = deck.x + deck.width - margin;
  if (left >= right) return center;
  const top = deck.y + deck.height;
  let lanes = [{ left, right }];
  for (const hazard of snapshot.hazards) {
    if (!(typeof observedLandingHazardPressure === 'function'
        ? observedLandingHazardPressure(snapshot, hazard, top)
        : hazard.active === true &&
          [hazard.x, hazard.y, hazard.width, hazard.height].every(Number.isFinite) &&
          hazard.y < top + 2 * (player.halfHeight || 0) &&
          hazard.y + hazard.height > top)) continue;
    const blockedLeft = hazard.x - halfWidth - 2500;
    const blockedRight = hazard.x + hazard.width + halfWidth + 2500;
    const remainder = [];
    for (const lane of lanes) {
      if (blockedRight <= lane.left || blockedLeft >= lane.right) {
        remainder.push(lane); continue;
      }
      const l = Math.min(lane.right, blockedLeft);
      const r = Math.max(lane.left, blockedRight);
      if (l - lane.left >= 10000) remainder.push({ left: lane.left, right: l });
      if (lane.right - r >= 10000) remainder.push({ left: r, right: lane.right });
    }
    lanes = remainder;
    if (!lanes.length) return center;
  }
  // Keep the physical arrival camera, deck markings and chevrons aligned
  // with the same PRESENT enemy-clear corridor chosen by the tactical pilot.
  // Never forecast a patrol position or imply that future contact is impossible.
  if (lanes.length) for (const enemy of snapshot.enemies || []) {
    if (!enemy.active ||
        ![enemy.x, enemy.y, enemy.halfWidth, enemy.halfHeight].every(Number.isFinite) ||
        enemy.y - enemy.halfHeight >= top + 2 * (player.halfHeight || 0) ||
        enemy.y + enemy.halfHeight <= top) continue;
    const blockedLeft = enemy.x - enemy.halfWidth - halfWidth - 2500;
    const blockedRight = enemy.x + enemy.halfWidth + halfWidth + 2500;
    const remainder = [];
    for (const lane of lanes) {
      if (blockedRight <= lane.left || blockedLeft >= lane.right) {
        remainder.push(lane); continue;
      }
      const l = Math.min(lane.right, blockedLeft);
      const r = Math.max(lane.left, blockedRight);
      if (l - lane.left >= 10000) remainder.push({ left: lane.left, right: l });
      if (lane.right - r >= 10000) remainder.push({ left: r, right: lane.right });
    }
    lanes = remainder;
    if (!lanes.length) return center;
  }
  let best = lanes[0], bestX = Math.max(best.left, Math.min(best.right, player.x));
  for (const lane of lanes.slice(1)) {
    const x = Math.max(lane.left, Math.min(lane.right, player.x));
    const distance = Math.abs(x - player.x);
    const priorDistance = Math.abs(bestX - player.x);
    if (distance < priorDistance ||
        (distance === priorDistance && lane.right - lane.left > best.right - best.left)) {
      best = lane; bestX = x;
    }
  }
  return bestX;
}

// Fit a small local encounter, preserving the hero's 18%-high baseline whenever
// the actual route fits. A long portrait crossing may require a wider view;
// that tradeoff is preferable to cropping the real destination or opponent.
function composeFollowView(snapshot, hero, aspect, orbit = 0, zoom = 1, previousGuardianLean = null, threatenedGuardianId = null, threatenedShotPoint = null, rangedGuardianId = null, actualPulsePoint = null, liveGuardianId = null, liveShotPoint = null, drawnGuardian = null, drawnGuardianId = null) {
  const player = snapshot.player, height = player.halfHeight * 2 / SCALE;
  const heroAngle = angleFor(player.x, snapshot.worldWidth);
  const body = { x: hero.x, y: hero.y + height * .52, z: hero.z };
  const target = intendedLanding(snapshot);
  let landing = null;
  if (target) landing = pointFor(observedSourceLandingX(snapshot, target),
    target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
  // A genuinely selected and currently supported health pickup is a camera
  // destination too. Reuse EXACTLY the route renderer's guarded observation:
  // never look at an ambiguous, dangerous or already collected item.
  const recoverySupport = snapshot.intent?.mode?.replace(/^oracle-/, '') === 'collecting-resource'
    ? snapshot.platforms?.find(deck => deck.id === snapshot.intent?.targetPlatformId) : null;
  const observedAid = recoverySupport ? witnessedHealthPickup(snapshot, recoverySupport) : null;
  if (observedAid && !target) landing = pointFor(observedAid.x, observedAid.y,
    snapshot.chunkBaseY, snapshot.worldWidth, 25.3);
  let threat = null, nearest = Infinity;
  // The tactical nearest-object camera may prefer a small bolt or hazard
  // while the guardian is visibly losing HP. Keep a separate, source-backed
  // combat anchor rather than allowing that important opponent to disappear.
  let contactGuardian = null, contactGuardianDistance = Infinity;
  // The same exact-current-source lock that owns the physical gate makes the
  // wounded guardian camera-eligible during real cap-bound air-control. This
  // prevents ordinary landing intent from breaking a still-active 3D duel.
  const lockedCap = observedLockedGuardianCap(snapshot);
  function consider(x, y, halfWidth, halfHeight, priority = 1, guardian = false, winding = false) {
    const dx = Math.abs(x - player.x), dy = Math.abs(y - player.y);
    if (dx > 90000 || dy > 60000) return;
    const score = (dx + dy * 1.4) / priority;
    if (score >= nearest) return;
    nearest = score;
    threat = { ...pointFor(x, y, snapshot.chunkBaseY, snapshot.worldWidth),
      halfWidth: halfWidth / SCALE, halfHeight: halfHeight / SCALE,
      guardian, imminentWindup: guardian && winding && dx < 55000 && dy < 28000 };
  }
  if (player.health > 0) {
    for (const enemy of snapshot.enemies || []) {
      if (!enemy.active) continue;
      consider(enemy.x, enemy.y, enemy.halfWidth, enemy.halfHeight, enemy.telegraph ? 1.5 : 1, enemy.kind === 'guardian', !!enemy.telegraph);
      if (enemy.kind !== 'guardian') continue;
      const dx = Math.abs(enemy.x - player.x), dy = Math.abs(enemy.y - player.y);
      const healthRatio = Number.isFinite(enemy.health) && Number.isFinite(enemy.maxHealth) && enemy.maxHealth > 0
        ? clamp(enemy.health / enemy.maxHealth, 0, 1) : 1;
      // The source-selected cap route is a genuine approach to an occupied
      // boss gate. Stage its living guardian before the first hit, while there
      // is still time for a portrait viewer to read the enemy silhouette.
      // Ordinary climbing and airborne landings keep the route-first camera.
      const approachingLockedGate =
        snapshot.intent?.targetPlatformId === `f${snapshot.floor}:cap` &&
        ['aligning', 'settling-launch'].includes(snapshot.intent?.mode);
      // A real horizontal shot can threaten a mid-air climber. The previous
      // grounded-only camera rule abandoned this exact high-stakes silhouette.
      // Aerial coverage is enabled ONLY by the genuine source-facing,
      // height-overlapping guardian warning already checked by the 3D stage.
      // Ordinary leaps retain their destination-first camera.
      const witnessedAirShot = player.state === 'airborne' &&
        enemy.telegraph === true && enemy.id === threatenedGuardianId;
      // An actual earned projectile flying toward this living guardian is a
      // second physical combat camera subject. Previously the 90k gate let
      // long-range source combat happen outside the portrait picture. Extend
      // only the safe GROUNDED shot lens; real airborne landings stay first.
      const witnessedRangedDuel = enemy.id === rangedGuardianId && !!actualPulsePoint &&
        (player.state === 'standing' ||
          // A live mid-air shot deserves a physical two-body frame only when
          // nearby. The real landing must remain the first aerial objective.
          (player.state === 'airborne' && dx <= 90000));
      // True in-flight enemy-owned bolt keeps the adjacent living guardian in
      // this continuous 3D encounter. Shooter ID is unavailable: coincidence
      // does not claim this guardian fired it, and landing remains protected.
      const witnessedLiveCrossfire = enemy.id === liveGuardianId &&
        !!liveShotPoint && dx <= 90000 &&
        Math.abs(player.y-enemy.y) <= player.halfHeight+enemy.halfHeight+3500;
      // The original portrait source episode at tick 321 reveals a large
      // authority-to-render-camera projection disagreement during an airborne
      // duel; the physically drawn skinned actor is still inside the frame.
      // Do not treat every jump/air-control step near a wounded boss as
      // combat: source-selected airborne landings must retain their camera.
      // But when the authority is STILL handling the combat or its recovery,
      // the wounded live opponent must not disappear between telegraph and
      // projectile ticks. The existing full-body/core/landing vetoes apply.
      const airborneCombatRecovery = [
        'recovering', 'engaging-enemy', 'bracing-telegraph',
        'evading-telegraph', 'evading-projectile'
      ].includes(snapshot.intent?.mode);
      const witnessedWoundedAirDuel = player.state === 'airborne' &&
        airborneCombatRecovery && enemy.kind === 'guardian' &&
        enemy.health > 0 && healthRatio < 1 &&
        dx <= 90000 && dy <= 60000;
      const witnessedCapAirDuel = observedWoundedCapAirDuel(snapshot, enemy, lockedCap);
      const activeContact = (player.state !== 'airborne' || witnessedAirShot ||
        witnessedRangedDuel || witnessedLiveCrossfire || witnessedWoundedAirDuel ||
        witnessedCapAirDuel) &&
        (approachingLockedGate || healthRatio < 1 || enemy.telegraph ||
        witnessedAirShot || witnessedRangedDuel || witnessedLiveCrossfire ||
        witnessedWoundedAirDuel || witnessedCapAirDuel || player.attacking ||
        ['engaging-enemy', 'bracing-telegraph', 'evading-telegraph'].includes(snapshot.intent?.mode));
      if (!activeContact || dx > (witnessedRangedDuel ? 135000 : 90000) ||
          dy > 60000) continue;
      const score = dx + dy * 1.4;
      if (score < contactGuardianDistance) {
        contactGuardianDistance = score;
        // The fixed-step source authorizes THIS enemy and its threat. The shot
        // must nevertheless fit the boss actually drawn by the smoothed rig,
        // not chase a center that can diverge by >1 NDC during floor-8 combat.
        // Only an identity/run/floor/tick-validated prior submitted rig may
        // replace its presentation anchor; neither combat nor target changes.
        const observedRig = drawnGuardian && drawnGuardianId === enemy.id;
        const contactPoint = pointFor(enemy.x, enemy.y,
          snapshot.chunkBaseY, snapshot.worldWidth);
        if (observedRig) {
          contactPoint.x = drawnGuardian.x;
          contactPoint.y = drawnGuardian.y;
          contactPoint.z = drawnGuardian.z;
        }
        contactGuardian = { ...contactPoint,
          halfWidth: enemy.halfWidth / SCALE, halfHeight: enemy.halfHeight / SCALE,
          sourceX: enemy.x, sourceY: enemy.y, guardianId: enemy.id, healthRatio,
          renderedAnchor: !!observedRig };
      }
    }
    // A physically charging trap is meaningful to the live climber BEFORE
    // activation. Only the exact published fixed-step warning AND the pilot's
    // actual evading-hazard decision can earn this short hazard camera anchor.
    // Keep the committed landing in frame while airborne; true combat and
    // source guardian framing still have their own higher-priority anchors.
    // Compose both authentic, simultaneous pressure chambers as one physical
    // threat while the pilot makes its actual escape decision. Existing enemy,
    // landing and guardian subjects retain their priority.
    // Standalone camera-contract VM fixtures strip ESM imports; the shipped
    // browser module always supplies this pure source-observation helper.
    const pairedPressure = typeof observedConcurrentHazardCluster === 'function'
      ? observedConcurrentHazardCluster(snapshot) : null;
    if (pairedPressure) consider(pairedPressure.x,pairedPressure.y,
      pairedPressure.halfWidth,pairedPressure.halfHeight,1.45);
    for (const hazard of snapshot.hazards || []) {
      const charging = snapshot.intent?.mode === 'evading-hazard' &&
        Number.isSafeInteger(hazard.chargeTicksRemaining) &&
        hazard.chargeTicksRemaining >= 1 && hazard.chargeTicksRemaining <= 12;
      if (hazard.active || charging) consider(
        hazard.x + hazard.width / 2, hazard.y + hazard.height / 2,
        hazard.width / 2, hazard.height / 2, charging ? 1.3 : 1.2);
    }
    // A fired bolt already moving farther from the climber is no longer an
    // immediate tactical threat; do not let it crop the contact source.
    for (const bolt of snapshot.projectiles || []) if (bolt.owner === 'enemy'
      && (bolt.x - player.x) * bolt.vx <= 0) consider(bolt.x, bolt.y, 3000, 3000, 1.7);
  }
  // Stage a real close-range encounter before the distant route marker. The
  // existing world-space landing beacon remains visible; only camera fitting
  // temporarily favors actual attackers and their observed telegraph.
  const encounter = !!contactGuardian || (!!threat && (threat.imminentWindup
    || ['engaging-enemy', 'bracing-telegraph', 'evading-telegraph', 'evading-projectile', 'evading-hazard'].includes(snapshot.intent?.mode)));
  // A source-observed mid-air duel may SHARE the camera with the guardian,
  // but may never erase the already committed physical landing destination.
  const routeLanding = encounter && player.state !== 'airborne' ? null : landing;
  // Stage the SAME actual exterior bronze cap lock that the renderer poses:
  // the older inner-cap focus at radius 21.8 could look centered yet hide the
  // visible HP-retracting teeth at radius 27.78, especially on a phone. The
  // observed guardian ID must match the opponent this shot is protecting.
  const guardianCircuitSource = contactGuardian ? observedGuardianCircuit(snapshot) : null;
  const liveLockPriority = guardianLiveFightLockPriority(guardianCircuitSource);
  const lockStage = guardianCircuitSource?.guardianId === contactGuardian?.guardianId
    ? observedGuardianLockStage(guardianCircuitSource) : null;
  const gateAnchorX = lockStage ? guardianCircuitSource.toX : null;
  const gate = lockStage?.center || null;
  // A missing guardian MUST NOT be treated as an ID match (undefined ===
  // undefined). Ordinary climbs must never attempt a release-camera read.
  const relay = guardianCircuitSource &&
    guardianCircuitSource.guardianId === contactGuardian?.guardianId
    ? observedGuardianRelayStage(guardianCircuitSource)?.center || null : null;
  // Keep gate width a soft composition preference, never a hard camera bound:
  // the real climber and attacker's complete silhouettes still take priority.
  const powerSpine = guardianCircuitSource &&
    guardianCircuitSource.guardianId === contactGuardian?.guardianId
    ? observedGuardianPowerSpineStage(guardianCircuitSource)?.center || null : null;
  // The physical warning vanes AND the camera use the identical present
  // observed attack lane. The focus cannot hijack normal jumping, a stale
  // encounter or a different source guardian's projectile.
  const shotFocus = contactGuardian && threatenedGuardianId === contactGuardian.guardianId
    ? threatenedShotPoint : contactGuardian &&
      rangedGuardianId === contactGuardian.guardianId ? actualPulsePoint :
      contactGuardian && liveGuardianId === contactGuardian.guardianId ? liveShotPoint : null;
  const gatePoints = lockStage
    ? [lockStage.center, ...lockStage.bolts.slice(2, 6)] : [];
  // The actual 14m+ source-locked vertical seal is often projected ACROSS
  // the living climber/guardian on a phone. Existing gateFramed scoring
  // rewarded the largest obstructing cyan lattice. Sample the REAL gate's
  // full-height exterior corners: preserve visual lock feedback but favor
  // a clear pair of bodies over an attractive, blocking doorway close-up.
  // No camera cuts, new renderer draws, source mutation or fake safe bypass.
  const lockCorners = contactGuardian && gate
    ? (() => {
        const angle = Math.atan2(gate.x, gate.z);
        const halfWidth = 3.11;
        const height = Number.isSafeInteger(snapshot.guardianSealHeight) &&
          snapshot.guardianSealHeight >= 140000
          ? snapshot.guardianSealHeight / SCALE : 14;
        const corners = [];
        for (const side of [-1, 1]) for (const end of [-1, 1])
          corners.push({
            x: gate.x + Math.cos(angle) * side * halfWidth,
            y: gate.y + (end < 0 ? -2.2 : height - 2.2),
            z: gate.z - Math.sin(angle) * side * halfWidth,
          });
        return corners;
      })() : null;
  // Full actual bronze winch/weight envelope, not just the narrow cyan lock.
  // Frame BOTH real fighters while the non-colliding gallery is behind them.
  const transmissionCorners = contactGuardian && gate &&
    typeof observedGuardianTransmissionCorners === 'function'
    ? observedGuardianTransmissionCorners(gate) : null;
  const center = { ...body };
  if (routeLanding) blendTowerStageFocus(center, landing, .38);
  if (threat) blendTowerStageFocus(center, threat, routeLanding ? .18 : .5);
  if (contactGuardian && !threat?.guardian) {
    // Preserve an incoming shot's tactical influence without letting it
    // replace the damage-taking guardian with a projectile-only composition.
    center.x = lerp(center.x, contactGuardian.x, .38);
    center.y = lerp(center.y, contactGuardian.y, .38);
    center.z = lerp(center.z, contactGuardian.z, .38);
  }
  if (gate && liveLockPriority.focusBias > 0) {
    // The full-height source lock physically dominates the phone fighting
    // corridor. Let its pull grow ONLY with authentic guardian HP loss, so
    // the living combatants remain primary until a truly earned release.
    // The post-defeat physical threshold has its own existing camera stage.
    center.x = lerp(center.x, gate.x, liveLockPriority.focusBias);
    center.y = lerp(center.y, gate.y + 2.5, liveLockPriority.focusBias);
    center.z = lerp(center.z, gate.z, liveLockPriority.focusBias);
  }
  center.y += height * (routeLanding ? .12 : .08);
  const tangent = Math.tan(42 * Math.PI / 360);
  const horizontalSafe = aspect < .85 ? (routeLanding ? .85 : .9) : .84;
  const relative = point => ({ x: point.x - center.x, y: point.y - center.y, z: point.z - center.z });
  const dot = (point, axis) => point.x * axis.x + point.y * axis.y + point.z * axis.z;
  const points = [], sightlines = [body], guardianCorners = [];
  function includeBody(point, halfWidth, halfHeight, bearing, collected = null) {
    for (const side of [-1, 1]) for (const vertical of [-1, 1]) {
      const corner = {
        x: point.x + Math.cos(bearing) * halfWidth * side,
        y: point.y + halfHeight * vertical,
        z: point.z - Math.sin(bearing) * halfWidth * side,
      };
      points.push(corner);
      if (collected) collected.push(corner);
    }
  }
  includeBody(body, (player.halfWidth || 9000) / SCALE, height * .52, heroAngle);
  // Track the real route's camera-fit points separately from combatants.
  // If an authentic aerial boss exchange spans a huge cap, we may relax
  // ONLY those bounds, not the climber/guardian collision silhouettes.
  const landingPointStart = points.length;
  const landingSightlineStart = sightlines.length;
  if (routeLanding) {
    if (observedAid && !target) {
      // Recovery's hard bound is the REAL pickup, not a fabricated platform
      // jump. Keep hero+aid visible without forcing a combat camera cut.
      points.push(routeLanding, { ...routeLanding, y: routeLanding.y + .65 });
      sightlines.push(routeLanding);
    } else if (target) {
      // Real guardian projectile flight can demand the climber, living boss
      // AND its already selected touchdown in one narrow portrait view. The
      // previous lens expanded over the ENTIRE cap (often ~250k source units),
      // shrinking the actual climber below the protected 14% screen share.
      // In that one witnessed airborne duel, compose around the real selected
      // landing FOOTPRINT instead; the complete deck remains physical in
      // world geometry and gameplay. Non-combat ascent still frames its full
      // usable width, and no camera may invent a new destination.
      const airdrop = !!contactGuardian && player.state === 'airborne';
      const touchdownX = observedSourceLandingX(snapshot, target);
      const halfFootprint = Math.min(target.width * .45,
        Math.max((player.halfWidth || 9000) * 1.35, 9000));
      // When the actual autonomous pilot has declared its current airborne
      // braking lane, do not turn a giant cap into a compulsory panorama.
      // Preserve the complete physical deck and all real hazard/actor bounds;
      // fit the SOURCE-OBSERVED landing corridor only on unusually wide
      // targets. The existing guardian-airborne framing wins during a duel.
      // Scene VM fixtures without ESM helpers retain the old full-deck view.
      const landingShot = !airdrop &&
        typeof observedLandingShotSpan === 'function'
        ? observedLandingShotSpan(snapshot, target, touchdownX) : null;
      const left = airdrop ? clamp(touchdownX - halfFootprint,
        target.x, target.x + target.width) : (landingShot?.left ?? target.x);
      const right = airdrop ? clamp(touchdownX + halfFootprint,
        target.x, target.x + target.width) :
        (landingShot?.right ?? target.x + target.width);
      for (const x of [left, right]) {
        const edge = pointFor(x, target.y + target.height,
          snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
        points.push(edge, { ...edge, y: edge.y + .4 }); sightlines.push(edge);
      }
      points.push(pointFor(airdrop ? touchdownX :
        (landingShot?.x ?? target.x + target.width / 2),
        target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 24.4));
    }
  }
  const landingPointEnd = points.length;
  const landingSightlineEnd = sightlines.length;
  if (threat && (!contactGuardian || !threat.guardian)) {
    includeBody(threat, threat.halfWidth, threat.halfHeight, threat.angle);
    sightlines.push(threat);
  }
  if (contactGuardian) {
    includeBody(contactGuardian, contactGuardian.halfWidth, contactGuardian.halfHeight,
      contactGuardian.angle, guardianCorners);
    sightlines.push(contactGuardian);
  }
  // Gate points are evidence and an optional composition preference, never
  // hard perspective bounds. A recessed capstan can be far across the tower:
  // forcing it into every phone shot shrinks both combat actors below the
  // protected readable silhouette and may push the camera into the core.
  // Prioritize a complete hero + guardian; reveal the gate when it fits.
  const subject = contactGuardian || routeLanding || threat;
  const direction = subject ? (Math.sign(body.x - subject.x) || 1) : 1;
  function solve(lean, hardLandingFit = true, lensScale = 1) {
    const angle = Math.atan2(center.x, center.z) + direction * .08 + orbit + lean;
    // Active traversal gets a modest overlook so the destination presents a
    // usable top. Grounded encounters keep the established near-eye framing.
    const sin = Math.sin(angle), cos = Math.cos(angle), pitch = routeLanding ? .18 : .055, level = Math.sqrt(1 - pitch * pitch);
    const out = { x: sin * level, y: pitch, z: cos * level };
    const right = { x: cos, y: 0, z: -sin }, up = { x: -sin * pitch, y: level, z: -cos * pitch };
    const bodyDepth = dot(relative(body), out);
    const minimumActorShare = encounter ? (aspect < .85 ? .205 : .225) : .18;
    let distance = bodyDepth + height * level / (2 * tangent * minimumActorShare);
    for (let index = 0; index < points.length; index++) {
      // The route still owns its physical marker and target ID. During a
      // witnessed mid-air duel, do not let a distant cap's huge footprint
      // turn the living characters into illegible specks on a phone.
      if (!hardLandingFit && index >= landingPointStart && index < landingPointEnd) continue;
      const point = points[index];
      const delta = relative(point), depth = dot(delta, out);
      distance = Math.max(distance,
        depth + Math.abs(dot(delta, right)) / (tangent * Math.max(.25, aspect) * horizontalSafe),
        depth + Math.abs(dot(delta, up)) / (tangent * .66));
    }
    distance = Math.max(12, distance) * zoom * lensScale;
    const position = { x: center.x + out.x * distance, y: center.y + out.y * distance, z: center.z + out.z * distance };
    const clear = sightlines.every((point, index) => {
      // Retain solid-core sightlines to both present, living actors. A huge
      // off-axis cap footprint is only a SOFT objective during a witnessed
      // airborne fight; testing every distant edge as a hard line-of-sight
      // would veto all close two-body rescues even when the actors are clear.
      if (!hardLandingFit && index >= landingSightlineStart &&
          index < landingSightlineEnd) return true;
      const dx = point.x - position.x, dz = point.z - position.z;
      const t = clamp(-(position.x * dx + position.z * dz) / Math.max(.001, dx * dx + dz * dz), 0, 1);
      return Math.hypot(position.x + dx * t, position.z + dz * t) >= 23.5;
    });
    // Actual perspective tests, rather than assuming a clear core sightline
    // means the guardian and capstan are also inside a portrait crop.
    const visible = (point, safeX, safeY) => {
      const delta = relative(point), depth = distance - dot(delta, out);
      return depth > .2 && Math.abs(dot(delta, right)) <= depth * tangent * aspect * safeX
        && Math.abs(dot(delta, up)) <= depth * tangent * safeY;
    };
    const guardianFramed = guardianCorners.length > 0 &&
      guardianCorners.every(point => visible(point, .84, .75));
    const relayFramed = !!relay && visible(relay, .88, .78) &&
      towerCoreSightlineClear(position, relay, 23.5);
    const powerSpineFramed = !!powerSpine && visible(powerSpine, .88, .78) &&
      towerCoreSightlineClear(position, powerSpine, 23.5);
    const shotFramed = !!shotFocus && visible(shotFocus, .89, .76) &&
      towerCoreSightlineClear(position, shotFocus, 23.5);
    const gateCoreClear = !!gate && towerCoreSightlineClear(position, gate, 23.5);
    const gateFramed = gatePoints.length > 0 && gateCoreClear &&
      gatePoints.every(point => visible(point, .93, .86));
    // Match body/gate projections in the SAME candidate camera. A distant
    // landmark in safe crop is not a good shot if its actual 3D lock masks
    // the hero or the source guardian. Depth distinguishes foreground from
    // distracting background; no extra raycasts or GPU passes are necessary.
    const projectNdc = point => {
      const delta = relative(point), depth = distance - dot(delta, out);
      return depth > .2
        ? [dot(delta, right) / (depth * tangent * aspect),
          dot(delta, up) / (depth * tangent), depth]
        : [NaN, NaN, -1];
    };
    const heroNdcCorners = points.slice(0, 4).map(projectNdc);
    const guardianNdcCorners = guardianCorners.map(projectNdc);
    const gateNdcCorners = lockCorners ? lockCorners.map(projectNdc) : null;
    const transmissionNdcCorners = transmissionCorners ? transmissionCorners.map(projectNdc) : null;
    const duelLegibility = contactGuardian
      ? observedGuardianDuelLegibility(heroNdcCorners, guardianNdcCorners)
      : {heroFraction:0,guardianFraction:0,score:0};
    const duelForeground=contactGuardian
      ? observedGuardianForegroundPressure(
        observedDuelBounds(heroNdcCorners), observedDuelBounds(guardianNdcCorners))
      : {occlusion:0,dominance:0};
    // A tighter source duel lens is permitted only after validating the full
    // actual hero AND boss in the physical, unobstructed exterior shot.
    const actorFramed = points.slice(0,4).every(point => visible(point,.82,.76));
    const gateIntrusion = gateNdcCorners
      ? guardianGateSilhouetteInterference(heroNdcCorners,
        guardianNdcCorners, gateNdcCorners) : 0;
    // A full-height gate that fills the middle of the screen but narrowly
    // misses both actor rectangles is STILL an unreadable guardian shot.
    // Favor a shared fighter corridor over visual landmark dominance while
    // keeping the real lock visible whenever that is actually compatible.
    const gateDominance = gateNdcCorners
      ? guardianGateScreenDominance(heroNdcCorners,
        guardianNdcCorners, gateNdcCorners) : 0;
    const transmissionIntrusion = transmissionNdcCorners
      ? guardianGateSilhouetteInterference(heroNdcCorners, guardianNdcCorners, transmissionNdcCorners) : 0;
    const transmissionDominance = transmissionNdcCorners
      ? guardianGateScreenDominance(heroNdcCorners, guardianNdcCorners, transmissionNdcCorners) : 0;
    const duelEdgePressure = guardianNdcCorners.length
      ? guardianDuelEdgePressure(heroNdcCorners, guardianNdcCorners) : 0;
    return { focus: { ...center }, position, distance, landing, targetId: target?.id || null, lean, clear, gateIntrusion, gateDominance, transmissionIntrusion, transmissionDominance, duelEdgePressure,
      actorFramed, guardianFraction:duelLegibility.guardianFraction,
      duelLegibility:duelLegibility.score,
      guardianForegroundOcclusion:duelForeground.occlusion,
      guardianForegroundDominance:duelForeground.dominance, lensScale,
      landingFramed: !!routeLanding && visible(routeLanding, .88, .8) &&
        towerCoreSightlineClear(position, routeLanding, 23.5),
      duelLandingSoftened: !hardLandingFit,
      guardianStaged: !!contactGuardian, guardianFramed, gateFramed, gateCoreClear, gateAnchorX,
      guardianPlannerAnchor: contactGuardian
        ? contactGuardian.renderedAnchor ? 'recent-drawn-rig' : 'fixed-step-source' : null,
      relayFramed, powerSpineFramed, shotFramed,
      heroFraction: height * level / (2 * tangent * (distance - bodyDepth)) };
  }
  let best = solve(0);
  let hardLandingFit = true;
  // A source-observed airborne guardian fight is an actual action beat, not
  // a panorama of an oversized destination cap. First try the REAL full
  // footprint. Only if it makes the fighter smaller than a 15%-high picture
  // may this director center the two living bodies and keep the same REAL
  // landing as a soft preference. No target, collision or event is changed.
  // No intervention for ordinary jumps or speculative/offline encounters.
  if (contactGuardian && routeLanding && player.state === 'airborne' &&
      best.heroFraction < .15 &&
      (contactGuardian.guardianId === rangedGuardianId ||
       contactGuardian.guardianId === threatenedGuardianId ||
       contactGuardian.guardianId === liveGuardianId)) {
    const normalCenter = { ...center };
    center.x = lerp(body.x, contactGuardian.x, .48);
    center.y = lerp(body.y, contactGuardian.y, .48);
    center.z = lerp(body.z, contactGuardian.z, .48);
    // A head-on close-up can be blocked by the solid tower even when an
    // oblique shot has both real combatants and their landing in view.
    // Previously we tried only lean=0 for the relaxed landing footprint and
    // then returned to the impossibly wide cap panorama. Search a bounded
    // pair of exterior shoulders while preserving every guardian silhouette
    // corner and both actor-to-camera core sightlines.
    const aerialLeans = Number.isFinite(previousGuardianLean) &&
      Math.abs(previousGuardianLean) <= 1.2
      ? [previousGuardianLean, 0, .22, -.22, .45, -.45, .7, -.7, .95, -.95, 1.13, -1.13]
      : [0, .22, -.22, .45, -.45, .7, -.7, .95, -.95, 1.13, -1.13];
    let rescue = null;
    let rescueScore = -Infinity;
    for (const amount of aerialLeans) {
      const candidate = solve(amount, false);
      if (!candidate.clear || !candidate.guardianFramed ||
          !Number.isFinite(candidate.heroFraction)) continue;
      // The living climber is the primary subject. A true visible touchdown
      // and observed attack lane decide otherwise similar views; the small
      // shoulder penalty discourages a nervous every-tick orbit reversal.
      const score = candidate.heroFraction * 10 +
        (candidate.landingFramed ? .09 : 0) +
        (candidate.shotFramed ? .035 : 0) - Math.abs(amount) * .012;
      if (score > rescueScore + .001) {
        rescue = candidate;
        rescueScore = score;
      }
    }
    if (rescue && rescue.heroFraction > best.heroFraction + .006) {
      best = rescue;
      hardLandingFit = false;
    } else Object.assign(center, normalCenter);
  }
  const preferredFraction = (encounter ? (aspect < .85 ? .195 : .215) : .165) / zoom;
  if (subject && best.heroFraction < preferredFraction) {
    // View along a broad crossing: the real destination recedes into depth,
    // instead of shrinking the entire encounter to fit a narrow screen.
    for (const amount of (aspect < .85 ? [.45, .75, .95, 1.1] : [.25, .5, .75])) {
      const candidate = solve(direction * amount, hardLandingFit);
      if (candidate.clear && candidate.heroFraction > best.heroFraction) best = candidate;
      if (best.heroFraction >= preferredFraction) break;
    }
  }
  // Select the *same real encounter* from a few bounded, stable orbit angles.
  // An arbitrary fixed portrait orbit can have a clear tower ray yet crop the
  // live guardian/HP-driven gate. Prefer their true projected silhouette while
  // preserving the climber and an unobstructed actor sightline. No new GPU work,
  // cinematic time scale, camera cut or authoritative gameplay change.
  if (contactGuardian) {
    // NEVER trade the player or attacker's silhouette for an attractive
    // but unsafe wide shot of a distant mechanism. A true visible gate wins
    // only among cameras with both actors framed and a clear tower sightline.
    const quality = view => (!view.clear || !view.actorFramed ||
      !view.guardianFramed || view.heroFraction < .15)
      ? -1000 + view.heroFraction
      : 150 + (view.gateFramed ? liveLockPriority.frameBonus : 0) +
        // The source-hoisted guardian clutch must not steal portrait framing.
        // True hero/boss crop, warning lane, exterior core, and authentic
        // touchdown stay mandatory; bronze HP hardware is only context.
        (view.relayFramed ? (aspect < .85 ? 1.5 : 3) : 0) +
        // Damage must read as a connected battle-to-gate mechanism on a
        // phone; prefer the first true power-spine clutch only among shots
        // with both real actors, exterior clearance and readable hero scale.
        (guardianCircuitSource?.openedFraction > 0 && view.powerSpineFramed
          ? (aspect < .85 ? 1.5 : 3) : 0) +
        // Prioritize the actual warning lane while real contact is imminent,
        // never at the expense of a cropped actor or hidden guardian.
        (view.shotFramed ? 11 : 0) +
        // Real projected guardian and hero height share one protected score.
        // The smaller actor controls the result, not a decorative capstan.
        view.duelLegibility +
        Math.min(.24, view.heroFraction) * 16 - Math.abs(view.lean) * 1.6 -
        // The actual 9095a5b0 phone fight shows the guardian's close-up
        // armor/hammer masking the real skinned hero although both centers
        // technically fit. Penalize observed frontal body obstruction AND
        // oversized boss scale before rewarding any decorative lock landmark.
        view.guardianForegroundOcclusion * 125 -
        view.guardianForegroundDominance * 38 -
        // A gate-centered shot can be "framed" and still make the actual
        // fight unreadable. Do not pay +16 gate points for a silhouette-
        // covering foreground lock; protect BOTH real actors first.
        view.gateIntrusion * 46 -
        // The original 72-second 390x844 footage at candidate 180e619e
        // still places a huge teal lock in the central fighting lane around
        // 14-24 seconds even when it narrowly misses both rectangles.
        // Prefer a more legible physical exterior orbit with both bodies
        // away from the unsafe phone edges. These are scoring preferences,
        // NOT hidden geometry, gameplay time changes or camera cuts.
        view.gateDominance * 54 -
        // Favor a complete source duel over near-camera non-colliding machinery.
        view.transmissionIntrusion * 54 -
        view.transmissionDominance * 40 -
        view.duelEdgePressure * 14;
    let bestQuality = quality(best);
    const choose = candidate => {
      const candidateQuality = quality(candidate);
      // Do not sacrifice an actual airborne destination already in frame
      // merely to enlarge an opponent; the pilot still owns that landing.
      if (routeLanding && player.state === 'airborne' &&
          best.landingFramed && !candidate.landingFramed) return;
      if (candidateQuality <= bestQuality + .01) return;
      best = candidate;
      bestQuality = candidateQuality;
    };
    for (const amount of [0, .22, .45, .7, .95, 1.13, -.22, -.45, -.7,
      -.95, -1.13]) choose(solve(direction * amount, hardLandingFit));
    // The original 390x844 film shows both real actors reduced to small
    // distant silhouettes around the locked gateway. Test a bounded tighter
    // exterior lens against the SAME world/collider/landing projections. It
    // is rejected unless all physical sightlines and body bounds still pass.
    // A stable source-shot hysteresis below prevents every-tick orbit hunting.
    if (aspect < .85 && (best.heroFraction < .23 ||
        best.guardianFraction < .20)) {
      for (const angle of [best.lean, 0, direction * .22, direction * .45,
        -direction * .22, -direction * .45]) {
        choose(solve(angle, hardLandingFit, .91));
      }
    }
    // Re-evaluate only the previous SOURCE encounter lens, not every historic
    // camera pose. A marginal quality difference cannot force a phone
    // orbit reversal, but genuine cropped action or an opened gate can.
    if (Number.isFinite(previousGuardianLean) && Math.abs(previousGuardianLean) <= 1.2) {
      best = retainGuardianCameraShot(best, solve(previousGuardianLean, hardLandingFit), quality);
    }
  }
  return best;
}

function createLandingCueGeometry() {
  // A bounded fascia plus four contrasting top corners. The top silhouette is
  // exclusive to the active target, distinct from permanent moving-deck trim.
  const quads = 40, geometry = new THREE.BufferGeometry(), indices = [], colors = new Float32Array(quads * 12);
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(quads * 12), 3).setUsage(THREE.DynamicDrawUsage));
  for (let quad = 0; quad < quads; quad++) {
    const start = quad * 4; indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    const color = new THREE.Color(quad < 24 ? 0x76ddff : quad < 32 ? 0x132f3a : 0xe3fbff);
    for (let corner = 0; corner < 4; corner++) colors.set([color.r, color.g, color.b], quad * 12 + corner * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

function updateLandingCueGeometry(geometry, platform, snapshot) {
  const positions = geometry.attributes.position, radius = 27.24;
  const left = angleFor(platform.x, snapshot.worldWidth), right = angleFor(platform.x + platform.width, snapshot.worldWidth);
  const top = (platform.y + platform.height - snapshot.chunkBaseY) / SCALE;
  const insetDepth = platform.id.endsWith(':cap') ? .12 : 1;
  function quad(index, from, to, low, high) {
    for (const [corner, angle, y] of [[0, from, low], [1, to, low], [2, to, high], [3, from, high]]) {
      positions.setXYZ(index * 4 + corner, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    }
  }
  for (let segment = 0; segment < 22; segment++) quad(segment, lerp(left, right, segment / 22), lerp(left, right, (segment + 1) / 22), top - .21 * insetDepth, top - .085 * insetDepth);
  const notch = Math.min(.22 / radius, (right - left) * .15);
  quad(22, left, left + notch, top - .55 * insetDepth, top - .085 * insetDepth);
  quad(23, right - notch, right, top - .55 * insetDepth, top - .085 * insetDepth);
  function surfaceQuad(index, from, to, inner, outer) {
    const angles = [Math.min(from, to), Math.max(from, to)], radii = [Math.min(inner, outer), Math.max(inner, outer)];
    for (const [corner, angle, r] of [[0, angles[0], radii[0]], [1, angles[1], radii[0]], [2, angles[1], radii[1]], [3, angles[0], radii[1]]]) {
      positions.setXYZ(index * 4 + corner, Math.sin(angle) * r, top, Math.cos(angle) * r);
    }
  }
  const span = Math.min((right - left) * .31, .13);
  const center = clamp(angleFor(observedSourceLandingX(snapshot, platform), snapshot.worldWidth),
    left + span, right - span);
  for (let layer = 0; layer < 2; layer++) {
    const line = layer ? .20 : .38, angularLine = Math.min(line / 25, (right - left) * .1);
    const arm = Math.min((right - left) * .18, (layer ? 1.45 : 1.63) / 25);
    let index = 24 + layer * 8;
    for (const side of [-1, 1]) for (const radialSide of [-1, 1]) {
      const angle = center + side * span, r = radialSide < 0 ? 24.05 : 26.65;
      surfaceQuad(index++, angle, angle - side * arm, r - line / 2, r + line / 2);
      surfaceQuad(index++, angle - angularLine / 2, angle + angularLine / 2, r, r - radialSide * (layer ? .88 : 1.0));
    }
  }
  positions.needsUpdate = true;
  geometry.computeBoundingSphere();
}

// A navigation glyph, not a collectible or extra collision surface. Its dark
// silhouette and two downward chevrons remain distinct from the gold shards.
function createLandingBeaconGeometry() {
  const geometry = new THREE.BufferGeometry(), vertices = [], colors = [], indices = [];
  function quad(points, color) {
    const start = vertices.length / 3;
    for (const [x, y, z] of points) { vertices.push(x, y, z); colors.push(color.r, color.g, color.b); }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  for (const level of [0, 1]) for (const inner of [false, true]) {
    const color = new THREE.Color(inner ? 0xb4f6ff : 0x102832);
    const width = inner ? .68 : .9, thickness = inner ? .18 : .38;
    const bottom = level * .95 + (inner ? .15 : 0), z = inner ? .012 : 0;
    for (const side of [-1, 1]) quad([
      [0, bottom, z], [side * width, bottom + .62, z],
      [side * width, bottom + .62 + thickness, z], [0, bottom + thickness, z],
    ], color);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  return geometry;
}

function updateLandingBeacon(beacon, platform, snapshot, camera) {
  beacon.visible = !!platform;
  beacon.userData.targetPlatformId = platform?.id || null;
  if (!platform) return;
  // Put the glyph on the camera-facing walking lane of the real deck
  // (physical radial span 22.4..27.18). The central 24.8 anchor was behind
  // the foreground upright in the source-pinned left-desktop view; the prior
  // 27.24 anchor floated outside the rim. Compact arms keep all glyph vertices
  // above the actual deck while retaining depth testing and target identity.
  const anchor = pointFor(observedSourceLandingX(snapshot, platform), platform.y + platform.height,
    snapshot.chunkBaseY, snapshot.worldWidth, 26.5);
  beacon.position.set(anchor.x, anchor.y + .65, anchor.z);
  beacon.quaternion.copy(camera.quaternion);
}

// The sky carries the biome; the broad reflected sources reveal the authored
// roughness of ceramic, stone and metal without a screen-space glow pass.
const LIGHTING = Object.freeze({
  foundry: { top: 0x302238, horizon: 0x9d5847, bottom: 0x282633, fill: 0x9cd4ed, bounce: 0xe28a50, ambient: .72, key: 3.4, rim: 1.5, ground: .55, reflection: .9, exposure: 1.0 },
  ruins: { top: 0x365c6b, horizon: 0x9fbdaf, bottom: 0x29454a, fill: 0xa6e3e1, bounce: 0x8db581, ambient: .82, key: 3.5, rim: 1.2, ground: .28, reflection: .8, exposure: 1.02 },
  storm: { top: 0x263b58, horizon: 0x7c9caf, bottom: 0x252e45, fill: 0x8dceff, bounce: 0x718ccc, ambient: .7, key: 3.2, rim: 1.7, ground: .32, reflection: .92, exposure: 1.02 },
  clockwork: { top: 0x374754, horizon: 0xa99a7d, bottom: 0x343943, fill: 0xa5cfe5, bounce: 0xdca45b, ambient: .75, key: 3.5, rim: 1.3, ground: .4, reflection: .86, exposure: 1.0 },
  void: { top: 0x201b36, horizon: 0x68527f, bottom: 0x252139, fill: 0xc0b8ff, bounce: 0x9870c6, ambient: .68, key: 2.9, rim: 1.65, ground: .32, reflection: .82, exposure: 1.08 },
});

function createReflectionEnvironment(renderer, theme, lighting) {
  // A fixed 256x128 source produces one 336x256 half-float CubeUV target
  // (about 0.66 MiB). No scene capture, per-frame convolution or external HDRI.
  const width = 256, height = 128;
  const pixels = new Uint16Array(width * height * 4);
  const key = new THREE.Color(theme.sun);
  const fill = new THREE.Color(lighting.fill);
  const ground = new THREE.Color(lighting.bounce);
  const upper = fill.clone().lerp(new THREE.Color(theme.ambient), .45);
  const lower = ground.clone().multiplyScalar(.25);
  const radiance = new THREE.Color();
  const keyDirection = new THREE.Vector3(-.48, .66, .58).normalize();
  const edgeDirection = new THREE.Vector3(.78, .28, -.56).normalize();
  const faceDirection = new THREE.Vector3(.18, .3, .94).normalize();
  const heatDirection = new THREE.Vector3(-.15, -.7, .7).normalize();
  const direction = new THREE.Vector3();
  for (let y = 0; y < height; y++) {
    const latitude = ((y + .5) / height - .5) * Math.PI;
    const ring = Math.cos(latitude), vertical = Math.sin(latitude);
    for (let x = 0; x < width; x++) {
      const longitude = ((x + .5) / width - .5) * TAU;
      direction.set(Math.cos(longitude) * ring, vertical, Math.sin(longitude) * ring);
      const warm = Math.pow(Math.max(0, direction.dot(keyDirection)), 22) * 5;
      const cool = Math.pow(Math.max(0, direction.dot(edgeDirection)), 28) * 4
        + Math.pow(Math.max(0, direction.dot(faceDirection)), 14) * 1.65;
      const heat = Math.pow(Math.max(0, direction.dot(heatDirection)), 12) * .7;
      const canopy = Math.pow(Math.max(0, vertical), 4) * .45;
      radiance.copy(lower).lerp(upper, clamp(vertical * .75 + .5, 0, 1)).multiplyScalar(.22);
      radiance.r += key.r * warm + fill.r * cool + ground.r * heat + upper.r * canopy;
      radiance.g += key.g * warm + fill.g * cool + ground.g * heat + upper.g * canopy;
      radiance.b += key.b * warm + fill.b * cool + ground.b * heat + upper.b * canopy;
      const index = (y * width + x) * 4;
      pixels[index] = THREE.DataUtils.toHalfFloat(radiance.r);
      pixels[index + 1] = THREE.DataUtils.toHalfFloat(radiance.g);
      pixels[index + 2] = THREE.DataUtils.toHalfFloat(radiance.b);
      pixels[index + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }
  const source = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  source.name = 'TowerRadianceSource';
  source.colorSpace = THREE.LinearSRGBColorSpace;
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.minFilter = source.magFilter = THREE.LinearFilter;
  source.wrapS = THREE.RepeatWrapping;
  source.needsUpdate = true;
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace(), previousMip = renderer.getActiveMipmapLevel();
  const previousXR = renderer.xr.enabled, previousAutoClear = renderer.autoClear, previousToneMapping = renderer.toneMapping;
  let generator = null, allocatedOutput = null;
  try {
    try {
      // Three 0.186 returns its output only after conversion. Capture that
      // exact allocation first, because a later failure may leave scratch bound.
      // This per-instance seam is covered by the pinned-version failure tests;
      // neither renderer methods nor Three's shared prototype are replaced.
      generator = new class extends THREE.PMREMGenerator {
        _allocateTargets() {
          allocatedOutput = super._allocateTargets();
          return allocatedOutput;
        }
      }(renderer);
      const target = generator.fromEquirectangular(source);
      allocatedOutput ??= target;
      target.texture.name = 'TowerReflections';
      return target;
    } finally {
      // PMREM's own success-only cleanup is not reached when conversion throws.
      // Restore the caller before disposing conversion resources on either path.
      try {
        renderer.setRenderTarget(previousTarget, previousFace, previousMip);
      } finally {
        renderer.xr.enabled = previousXR;
        renderer.autoClear = previousAutoClear;
        renderer.toneMapping = previousToneMapping;
        try { generator?.dispose(); }
        finally { source.dispose(); }
      }
    }
  } catch (error) {
    allocatedOutput?.dispose();
    throw error;
  }
}

// Both scene/render execution duration and the interval between visible
// requestAnimationFrame callbacks are bounded adaptation signals, NOT display
// FPS or physical GPU timing. The original 390px source-pinned danger WebM at
// b489786c showed ~298ms median callback interval but ~20ms scene calls:
// the old call-duration-only controller NEVER adapted (scale=1, 0 adaptations).
// Keep real gameplay, lighting tier and full-resolution DOM HUD unchanged;
// lower only 3D framebuffer cost after sustained actually observed starvation.
// Independent supported-device benchmarks remain a separate release gate.
function createTowerResolutionPolicy() {
  // Real portrait danger film at 3ed44c36 recorded median 216ms submission
  // intervals and >600ms tail stalls. A fixed full-resolution phone framebuffer
  // made that overload permanent. Keep at least 78% linear pixel density on
  // compact views, while desktop retains its established 60% emergency floor.
  let compact = false;
  const minimumScale = () => compact ? .78 : .6;
  let scale = 1, overload = 0, healthy = 0, cooldown = 0, adaptations = 0;
  let lastSubmissionMs = null, lastCallbackGapMs = null;
  return {
    get scale() { return scale; }, get adaptations() { return adaptations; },
    get compact() { return compact; }, get minimumScale() { return minimumScale(); },
    get lastSubmissionMs() { return lastSubmissionMs; },
    get lastCallbackGapMs() { return lastCallbackGapMs; },
    clearPacing() { overload = 0; healthy = 0; lastCallbackGapMs = null; },
    setCompact(next) {
      // Width/orientation changes re-enter a full-density baseline before
      // profiling again; a stale desktop throttle must not blur a phone HUD.
      if (typeof next !== 'boolean' || next === compact) return false;
      compact = next;
      scale = 1; overload = 0; healthy = 0; cooldown = 0;
      lastSubmissionMs = null; lastCallbackGapMs = null;
      return true;
    },
    record(durationMs, visible, callbackGapMs = null) {
      if (!visible || !Number.isFinite(durationMs) || durationMs < 0) {
        overload = 0; healthy = 0; lastCallbackGapMs = null; return false;
      }
      lastSubmissionMs = Math.round(durationMs * 10) / 10;
      // A 2.4-second+ callback gap indicates a tab suspension or a heavily
      // interrupted browser. Never downscale the recovered game for ONE pause.
      // This is also capped to reject timestamp anomalies; null is permitted
      // for legacy unit probes where no callback cadence is available.
      const gapValid = Number.isFinite(callbackGapMs) && callbackGapMs > 0;
      if (gapValid && callbackGapMs > 2400) {
        overload = 0; healthy = 0; lastCallbackGapMs = null; return false;
      }
      const gap = gapValid ? callbackGapMs : null;
      lastCallbackGapMs = gap === null ? null : Math.round(gap * 10) / 10;
      if (cooldown) cooldown--;
      const slowCall = durationMs >= 180;
      const starvedCallback = gap !== null && gap >= 120;
      if (slowCall || starvedCallback) { overload++; healthy = 0; }
      else if (durationMs <= 35 && (gap === null || gap <= 50)) {
        healthy++; overload = 0;
      } else { overload = 0; healthy = 0; }
      // Two genuinely slow scene calls OR three consecutive starved visible
      // animation callbacks earn one limited resolution change. A short scene
      // call during a 300ms rAF backlog must NOT count as a healthy frame.
      if (overload >= (slowCall ? 2 : 3) && cooldown === 0 && scale > minimumScale()) {
        scale = Math.max(minimumScale(), Math.round(scale * 80) / 100);
        overload = 0; healthy = 0; cooldown = 2; adaptations++;
        return true;
      }
      if (healthy >= 90 && cooldown === 0 && scale < 1) {
        scale = Math.min(1, Math.round((scale + .1) * 100) / 100);
        overload = 0; healthy = 0; cooldown = 12; adaptations++;
        return true;
      }
      return false;
    },
    reset() { scale = 1; overload = 0; healthy = 0; cooldown = 0;
      adaptations = 0; lastSubmissionMs = null; lastCallbackGapMs = null; },
  };
}

// Presentational evidence for an ACTUAL boot/deck collision. Never creates
// a landing, target or platform: only consecutive source ticks may earn it.
function observedPhysicalTouchdown(before, after) {
  if (!before || !after || before.lifecycle !== 'running' ||
    after.lifecycle !== 'running' || typeof after.runToken !== 'string' ||
    !after.runToken || before.runToken !== after.runToken ||
    !Number.isSafeInteger(before.floor) || before.floor !== after.floor ||
    !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick) ||
    after.tick <= before.tick || after.tick - before.tick > 8 ||
    before.player?.state !== 'airborne' || after.player?.state !== 'standing' ||
    !Number.isFinite(before.player.vy) || before.player.vy >= -350 ||
    after.player.vy !== 0 || !(after.player.health > 0) ||
    ![after.player.x, after.player.y, after.player.halfWidth,
      after.player.halfHeight, after.chunkBaseY, after.worldWidth].every(Number.isFinite) ||
    after.player.halfWidth <= 0 || after.player.halfHeight <= 0 ||
    after.worldWidth <= 0 || !Array.isArray(after.platforms)) return null;
  const feet = after.player.y - after.player.halfHeight;
  let landing = null, smallestError = Infinity;
  for (const platform of after.platforms) {
    if (!platform || typeof platform.id !== 'string' || !platform.id ||
      ![platform.x, platform.y, platform.width, platform.height].every(Number.isFinite) ||
      platform.width <= 0 || platform.height <= 0 ||
      after.player.x + after.player.halfWidth < platform.x ||
      after.player.x - after.player.halfWidth > platform.x + platform.width) continue;
    const error = Math.abs(feet - (platform.y + platform.height));
    if (error <= 2500 && error < smallestError) {
      landing = platform; smallestError = error;
    }
  }
  return landing ? {
    runToken: after.runToken, floor: after.floor, tick: after.tick,
    platformId: landing.id, kind: landing.kind,
    x: after.player.x, left: landing.x, right: landing.x + landing.width,
    top: landing.y + landing.height, halfWidth: after.player.halfWidth,
    strength: Math.max(.4, Math.min(1, -before.player.vy / 14000)),
    worldWidth: after.worldWidth, observedOnly: true,
  } : null;
}
// End observed physical touchdown.

export function createTowerScene(canvas, settings = {}) {
  const options = { camera: 'follow', quality: innerWidth < 700 ? 'low' : 'high', reducedMotion: false, ...settings };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x83534d);
  scene.fog = new THREE.FogExp2(0x9a5751, 0.0045);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.2, 1200);
  // Low-tier playback is fill-rate constrained in recorded software WebGL;
  // never allocate multisample color buffers for its entire tower scene.
  // UI captions/status remain independent DOM text at full CSS resolution.
  const renderer = new THREE.WebGLRenderer({ canvas,
    antialias: options.quality === 'high' && innerWidth >= 700,
    alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = options.quality === 'high';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  canvas.dataset.renderer = 'three-webgl';
  const resolutionPolicy = createTowerResolutionPolicy();
  // A source-qualified, first-frame-only lower WebGL framebuffer budget.
  // The HTML/HUD remains full CSS resolution, and ordinary source floors do not change.
  const coldFloorPolicy = createTowerColdFloorResolution();
  let coldFloorScale = 1;
  // Lighting and the sky are one continuous physical threshold, not a
  // purple cut at the instant the authoritative floor counter increments.
  // The only permit is the already-owned source-grounded, open inner arch.
  // Original colors are allocated once, never per rendered frame.
  const thresholdColors = (() => {
    const colors = key => {
      const light=LIGHTING[key], biome=THEMES[key] || THEMES.foundry;
      return {
        fog:new THREE.Color(biome.fog).lerp(new THREE.Color(light.horizon),.3),
        top:new THREE.Color(light.top),horizon:new THREE.Color(light.horizon),
        bottom:new THREE.Color(light.bottom),
        hemi:new THREE.Color(biome.ambient).lerp(new THREE.Color(light.fill),.25),
        hemiGround:new THREE.Color(light.bounce).multiplyScalar(.3),
        sun:new THREE.Color(biome.sun),rim:new THREE.Color(light.fill),
        bounce:new THREE.Color(light.bounce),
      };
    };
    return {from:colors('clockwork'),to:colors('void')};
  })();
  let lastBiomeHandoffOldWeight=0;
  let renderPixelRatio = 1, basePixelRatio = 1, resolutionDirty = false;

  const hemi = new THREE.HemisphereLight(0xe8e0d3, 0x442a32, .72);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdfbc, 3.4);
  sun.position.set(-40, 65, 52);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 70, bottom: -30, near: 0.5, far: 180 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.055;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0x9cd4ed, 1.5);
  rim.position.set(45, 25, -30);
  const bounce = new THREE.DirectionalLight(0xe28a50, .55);
  bounce.position.set(-18, -20, 32);
  scene.add(rim, rim.target, bounce, bounce.target);
  const observedStageLight = createObservedTowerLightDirector();
  // Reuse the existing, shadow-free bounce to light a SOURCE-present action
  // subject. No extra light, geometry, texture, shadow pass or HUD draw.
  const actionLightTarget = new THREE.Vector3();
  const actionHazardTint = new THREE.Color(0xff9d73);
  const actionGuardianTint = new THREE.Color(0x9ddde7);
  const actionGateTint = new THREE.Color(0xb6f0d3);
  const actionLandingTint = new THREE.Color(0xf5d3a2);
  let actionLightRunFloor = null, actionLightKind = 'none', actionLightSourceTick = -1;
  const warmRimTint = new THREE.Color(0xffc994);
  const interruptedRimTint = new THREE.Color(0x8be7e4);
  const operatorRimTint = new THREE.Color(0xb4aae9);

  const skyGeometry = new THREE.SphereGeometry(800, 24, 12);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color(0x392f4c) }, horizon: { value: new THREE.Color(0xe6a57c) }, bottom: { value: new THREE.Color(0x4d5664) } },
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vDirection; uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom;
      void main(){float h=normalize(vDirection).y;
      vec3 c=mix(bottom,horizon,smoothstep(-.55,.08,h));
      c=mix(c,top,smoothstep(.05,.65,h)); gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -100;
  scene.add(sky);
  let reflectionTarget = null, reflectionDirty = true, reflectionFirstFrame = true, reflectionBuilds = 0;
  let reflectionFailures = 0, reflectionLastError = null;
  function releaseEnvironment() {
    scene.environment = null;
    reflectionTarget?.dispose();
    reflectionTarget = null;
    reflectionDirty = true;
  }
  function refreshEnvironment() {
    releaseEnvironment();
    // Optional reflections get one attempt for this theme/context generation.
    // Failure keeps the direct-light scene alive; it is not a lost GL context.
    reflectionDirty = false;
    // Low tier deliberately uses direct lighting, avoiding the PMREM shader
    // sampling cost measured in the software-renderer probe. High retains the
    // complete reference look once its first direct-lit frame is submitted.
    if (options.quality === 'low') return;
    try {
      reflectionTarget = createReflectionEnvironment(renderer, THEMES[themeKey] || THEMES.foundry, LIGHTING[themeKey] || LIGHTING.foundry);
      scene.environment = reflectionTarget.texture;
      reflectionBuilds++;
    } catch (error) {
      reflectionFailures++;
      reflectionLastError = String(error?.message || error).slice(0, 240);
      console.warn('Tower reflections unavailable; continuing with direct lighting.', { theme: themeKey, error: reflectionLastError });
    }
  }

  let ledgeContactEvidence = null;
  let world = createTowerWorld();
  scene.add(world.group);
  let climber = createClimber();
  climber.group.name = 'ExpeditionClimber';
  scene.add(climber.group);
  // A real result has a spatial ending; this renderer cannot award a win,
  // resurrect an actor or alter the authoritative 20Hz simulation.
  let finale = createTowerFinale(THREE);
  scene.add(finale.group);
  let passage = createTowerGuardianPassage(THREE);
  scene.add(passage.group);
  // Source-backed 3D AI intention: a single bounded draw in the real world,
  // retired during combat, terminal states, restart and graphics recovery.
  let routeIntent = createTowerRouteIntent(THREE);
  scene.add(routeIntent.group);
  // The same observed source intent physically identifies the next actual
  // 3D landing deck, without forecasting a collision-safe arrival.
  let landingApproach = createTowerLandingApproach(THREE);
  scene.add(landingApproach.group);
  // A real moving carriage carries an articulated under-deck chassis,
  // showing structural weight and motion without adding a traversable surface.
  // One observed, one-draw instanced stage across all supported viewports.
  let movingDeckSuspension = createTowerMovingDeckSuspension(THREE);
  scene.add(movingDeckSuspension.group);
  // Real source-scheduled danger earns its own physical pre-activation language:
  // one instanced 3D pressure stage, no authored collisions, future AI knowledge,
  // screen text, animation clock or additional shadow pass.
  let hazardPressure = createTowerHazardPressure(THREE);
  scene.add(hazardPressure.group);
  let guardianCircuit = createTowerGuardianCircuit(THREE);
  scene.add(guardianCircuit.group);
  // True guardian charge -> projectile: one exterior world-space warning draw,
  // not a screen label or a guessed hit. The fired-shot ribbon remains source-owned.
  let guardianShotStage = createTowerGuardianShotStage(THREE);
  scene.add(guardianShotStage.group);
  // Only genuine source guardian guard ticks make these original physical
  // interlocking battens visible. This is a single instanced 3D draw, never
  // a projected HUD shield or an additional combat hitbox.
  let guardianGuardStage = createObservedGuardianGuardStage(THREE);
  scene.add(guardianGuardStage.group);
  // The biome has real world-depth motes, not UI flakes. One GPU draw,
  // source-tick animation; hidden during stale/terminal/reduced-motion play.
  let atmosphere = createTowerAtmosphere(THREE);
  scene.add(atmosphere.group);
  const enemies = new Map(), pickups = new Map(), projectiles = new Map();
  const sharedGeometry = new Set(), sharedMaterials = new Set();
  const ownGeometry = geometry => { sharedGeometry.add(geometry); return geometry; };
  const ownMaterial = material => { sharedMaterials.add(material); return material; };
  // Original source-pinned 390x844 guardian film at bca7593d (native 15-17s)
  // and the actual 3D triangle owner at tick 307 identify THIS objective
  // halo/spoke assembly as the giant foreground metal wheel between the live
  // climber and guardian. The three decorative biome rotors were behind them.
  // Replace the complete near-camera eight-spoked wheel with a physically
  // OPEN forged summit arch and four small perimeter finials. Its bearing
  // remains the real authoritative cap; it is an objective, NEVER a victory
  // badge or gameplay collider. Keep the two bounded depth-tested draws.
  const crownStage = new THREE.Group();
  crownStage.name = 'ObservedCurrentFloorSummitCrown';
  const crownMetal = ownMaterial(new THREE.MeshStandardMaterial({
    color: 0xa38b72, emissive: 0x304650, emissiveIntensity: .13,
    metalness: .68, roughness: .44, depthTest: true, depthWrite: true,
  }));
  // The lower 115-degree sector is genuine empty space, not opacity.
  // Half-size outboard silhouette, NO spoke crossing the action corridor.
  // Opening stays at the bottom through source-tick sway/reduced motion.
  const crownRing = new THREE.Mesh(
    ownGeometry(new THREE.TorusGeometry(1.95, .11, 7, 32, Math.PI * 1.36)), crownMetal);
  crownRing.name = 'ActualCapNavigationHalo';
  crownRing.castShadow = false;
  const crownBeams = new THREE.InstancedMesh(
    ownGeometry(new THREE.BoxGeometry(.17, .84, .18)), crownMetal, 4);
  crownBeams.name = 'ActualCapNavigationSpokes';
  crownBeams.castShadow = false;
  crownBeams.receiveShadow = false;
  crownBeams.frustumCulled = false;
  const crownPose = new THREE.Object3D();
  // Four real outboard buttress finials carry the open arch, rather than
  // a centered metal rotor. No vertical/horizontal center bars or near-facing
  // slab may bury the skinned hero, live guardian or their real cap route.
  const crownFinials = [
    [-1.50, -.95, -.13], [1.50, -.95, .13],
    [-1.71, -.18, -.23], [1.71, -.18, .23],
  ];
  for (let index = 0; index < crownFinials.length; index++) {
    const [x, y, tilt] = crownFinials[index];
    crownPose.position.set(x, y, 0);
    crownPose.rotation.set(0, 0, tilt);
    crownPose.scale.set(1, 1, 1);
    crownPose.updateMatrix();
    crownBeams.setMatrixAt(index, crownPose.matrix);
  }
  crownBeams.instanceMatrix.needsUpdate = true;
  crownStage.add(crownRing, crownBeams);
  crownStage.visible = false;
  scene.add(crownStage);
  let observedCrown = null;
  const paleCrownMetal = new THREE.Color(0xb4c7c0);
  const gemGeometry = ownGeometry(new THREE.OctahedronGeometry(.42));
  const ringGeometry = ownGeometry(new THREE.TorusGeometry(.65, .035, 6, 24));
  const boltGeometry = ownGeometry(new THREE.SphereGeometry(.21, 10, 7));
  const collectibleMaterials = {};
  for (const [kind, color] of Object.entries({ health: 0x69ffd5, stamina: 0x75c8ff, shard: 0xffda7b })) {
    collectibleMaterials[kind] = ownMaterial(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .7, metalness: .45, roughness: .22 }));
  }
  const boltMaterials = {
    player: ownMaterial(new THREE.MeshBasicMaterial({ color: 0x7eeeff })),
    enemy: ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff805e })),
  };
  const ribbonMaterials = {
    player: ownMaterial(new THREE.MeshBasicMaterial({ color: 0x7eeeff, transparent: true, opacity: .68, side: THREE.DoubleSide, depthTest: true, depthWrite: false, toneMapped: false })),
    enemy: ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff805e, transparent: true, opacity: .73, side: THREE.DoubleSide, depthTest: true, depthWrite: false, toneMapped: false })),
  };
  // Shared, depth-tested enemy charge arc driven by a real observed windup.
  // It does not predict collisions or advance a second rules clock.
  const chargeArcGeometry = ownGeometry(new THREE.TorusGeometry(.82, .055, 6, 32, Math.PI * 1.72));
  const chargeArcMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0xffdf9c, transparent: true, opacity: .86, depthTest: true,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  }));
  const healthBarGeometry = ownGeometry(new THREE.PlaneGeometry(1, 1));
  const healthBarDark = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x172329, transparent: true, opacity: .88, depthTest: false, depthWrite: false }));
  const healthBarRed = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff9867, transparent: true, opacity: 1, depthTest: false, depthWrite: false }));
  const warningMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffcb75, transparent: true, opacity: .65, depthWrite: false }));
  const threatLaneMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0xffb16e, transparent: true, opacity: .38, side: THREE.DoubleSide,
    depthWrite: false, depthTest: true, toneMapped: false,
  }));
  // A restrained, depth-tested contact outline survives low quality and reduced
  // motion, where expensive particle bursts are intentionally disabled.
  const impactMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0xfff0bd, transparent: true, opacity: .92, depthTest: true, depthWrite: false, toneMapped: false,
  }));
  const landingCue = new THREE.Mesh(ownGeometry(createLandingCueGeometry()), ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
  landingCue.name = 'IntendedLandingEdge';
  landingCue.renderOrder = 2;
  landingCue.visible = false;
  scene.add(landingCue);
  let landingCueKey = '';
  const landingBeacon = new THREE.Mesh(ownGeometry(createLandingBeaconGeometry()), ownMaterial(new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.DoubleSide, toneMapped: false, depthTest: true, depthWrite: false,
  })));
  landingBeacon.name = 'IntendedLandingBeacon'; landingBeacon.visible = false;
  scene.add(landingBeacon);
  const attackArc = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(.56, .038, 6, 20, Math.PI * .75)), ownMaterial(new THREE.MeshBasicMaterial({ color: 0xabf5ff, transparent: true, opacity: .7, depthTest: true, depthWrite: false })));
  attackArc.visible = false;
  scene.add(attackArc);
  // One world-space contact ring, shared by every genuine touchdown. It rests
  // on the authoritative deck top, costs one draw at most, and remains readable
  // on the low tier where particle bursts are deliberately disabled.
  const landingHalo = new THREE.Mesh(
    ownGeometry(new THREE.TorusGeometry(1, .055, 6, 40)),
    ownMaterial(new THREE.MeshBasicMaterial({
      color: 0xb5eff0, transparent: true, opacity: 0,
      depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    })),
  );
  landingHalo.name = 'ObservedDeckTouchdown';
  landingHalo.rotation.x = -Math.PI / 2;
  landingHalo.visible = false;
  scene.add(landingHalo);
  // One source-earned, depth-tested 3D impact cluster integrated with the
  // existing contact halo, weighty camera and opt-in landing audio.
  // No extra collider, HUD, sound, light or shadow pass.
  const touchdownDebris = new THREE.InstancedMesh(
    ownGeometry(new THREE.IcosahedronGeometry(.26, 0)),
    ownMaterial(new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: .15, roughness: .76,
      emissive: 0x243839, emissiveIntensity: .2,
      depthTest: true, depthWrite: true,
    })), 16);
  touchdownDebris.name = 'WitnessedPhysicalDeckImpact';
  touchdownDebris.count = 0; touchdownDebris.visible = false;
  touchdownDebris.frustumCulled = false;
  touchdownDebris.castShadow = false; touchdownDebris.receiveShadow = false;
  touchdownDebris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const touchdownPose = new THREE.Object3D();
  const touchdownTint = new THREE.Color();
  for (let i = 0; i < 16; i++) touchdownDebris.setColorAt(i,
    touchdownTint.setHex(i % 3 === 0 ? 0xf4e4bc : i % 3 === 1 ? 0x85d7cc : 0x9a9e9c));
  touchdownDebris.instanceColor.needsUpdate = true;
  scene.add(touchdownDebris);

  // One original shader-only deck footprint provides a consistent physical
  // depth reference through regular jumping, moving decks and guardian action.
  // Unlike route markers, it shows only a real PRESENT surface beneath feet;
  // it never claims a predicted landing or adds HUD text.
  const footingShadow = new THREE.Mesh(
    ownGeometry(new THREE.PlaneGeometry(1, 1)),
    ownMaterial(new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 } },
      transparent: true, depthTest: true, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: 'varying vec2 vUvLocal; void main(){vUvLocal=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUvLocal; uniform float uOpacity;
        void main(){
          float radius=length((vUvLocal-vec2(.5))*2.);
          float shade=1.-smoothstep(.04,.98,radius);
          float edge=exp(-pow((radius-.76)*7.,2.));
          if(radius>1.)discard;
          vec3 ink=mix(vec3(.014,.024,.035),vec3(.26,.49,.53),edge*.32);
          gl_FragColor=vec4(ink,uOpacity*(shade*.78+edge*.20));
          #include <colorspace_fragment>
        }`,
    })),
  );
  footingShadow.name = 'ObservedPhysicalDeckFooting';
  footingShadow.rotation.x = -Math.PI / 2;
  footingShadow.visible = false;
  footingShadow.castShadow = false;
  footingShadow.frustumCulled = false;
  footingShadow.renderOrder = 2;
  scene.add(footingShadow);
  let observedFooting = null;
  // The same moving deck that drives a source-observed gear/piston now gives
  // the skinned rider one bounded counterweight pose. Zero extra GPU draws.
  const movingDeckRide = createObservedMovingDeckRide();
  let observedRidePose = null;
  // One low-cost source-earned recovery event completes the already-authentic
  // AI detour -> picked-up aid -> skinned armor restoration loop in real 3D.
  let recoveryTransfer = createTowerRecoveryTransfer(THREE);
  scene.add(recoveryTransfer.group);

  // Existing source route stays authoritative. One instanced world-space
  // movement echo helps follow a real dash/launch on a small phone viewport.
  const motionLedger = createObservedTowerMotionLedger();
  const motionEcho = new THREE.InstancedMesh(
    ownGeometry(new THREE.TetrahedronGeometry(.19, 0)),
    ownMaterial(new THREE.MeshBasicMaterial({ color: 0x9fe2f2,
      transparent: true, opacity: .6, depthTest: true,
      depthWrite: false, toneMapped: false })), 13);
  motionEcho.name = 'ObservedClimberMotionEcho';
  motionEcho.count = 0; motionEcho.visible = false;
  motionEcho.frustumCulled = false; motionEcho.castShadow = false;
  motionEcho.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(motionEcho);
  const echoTransform = new THREE.Object3D();
  let echoDrawnTick = -1;

  const particlePositions = new Float32Array(MAX_PARTICLES * 3);
  const particleColors = new Float32Array(MAX_PARTICLES * 3);
  const particleSizes = new Float32Array(MAX_PARTICLES);
  const particleLife = new Float32Array(MAX_PARTICLES);
  const particleVelocity = new Float32Array(MAX_PARTICLES * 3);
  const particleGeometry = ownGeometry(new THREE.BufferGeometry());
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  const particleMaterial = ownMaterial(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size; varying vec3 vColor; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=size*180./max(1.,-mv.z);}`,
    fragmentShader: `varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,(1.-d)*(1.-d));}`,
  }));
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  scene.add(particles);
  let particleCursor = 0;
  function burst(position, color, count = 12) {
    if (options.reducedMotion || options.quality === 'low') return;
    const c = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const i = particleCursor++ % MAX_PARTICLES, b = i * 3, phase = i + (snapshot?.tick || 0);
      particlePositions.set([position.x, position.y + .8, position.z], b);
      particleColors.set([c.r, c.g, c.b], b);
      particleVelocity.set([(seeded(phase) - .5) * 4, 1 + seeded(phase + 17) * 3, (seeded(phase + 36) - .5) * 3], b);
      particleLife[i] = .45 + seeded(phase + 8) * .4;
    }
  }

  let snapshot = null, previous = null, initialized = false, frameHandle = 0;
  let gatewaySourceAudit = null;
  // The chosen combat lens belongs to one real guardian on one source floor.
  // Reset across encounter exits, floor changes, restarts and stale transport.
  let guardianShotKey = null, guardianShotLean = null;
  // The *observed* terminal→new-token handoff receives a brief exterior
  // establishing sweep. Camera-only: no source clock, physics or AI changes.
  let authenticRestartSweep = null;
  // One genuine terminal token owns one physical memorial camera passage.
  // Context-loss rebuild, floor changes and actual new runs retire the shot.
  let terminalCameraRun = null, terminalCameraBegan = 0;
  // Real newly observed player-owned airborne projectile, not a guessed
  // ability input. Render-only for the original climber's existing rig.
  let airbornePulse = null, guardianCounterPulse = null;
  let elapsed = 0, lastTime = 0, renderErrors = 0, contextLost = false, disposed = false;
  // A JavaScript/render-submission exception is NOT WebGL context loss. The
  // fixed-step expedition must continue while view recovery is bounded.
  let renderFaultState = 'live', renderFaultRetryAt = 0;
  let renderRecoveryAttempts = 0, renderFaultCount = 0;
  let contactUntil=0,contactHero=false,contactEnemyId=null;
  let landingMoment=-Infinity,landingRun=null,landingFloor=null,landingWeight=0;
  let physicalTouchdown = null;
  let baseY = 0, themeKey = '', cameraAngle = .15, lastRevision = '', orbit = 0, zoom = 1;
  const renderProgress = createRenderProgress();
  const actorTarget = new THREE.Vector3();
  const actorFramePoint = new THREE.Vector3();
  const actorOrbitTarget = new THREE.Vector3();
  // One retained source-hazard sightline, independent of the real selected
  // landing. Neither is allowed to disappear during the same airborne duel.
  const observedHazardSightline = new THREE.Vector3();
  const observedLandingSightline = new THREE.Vector3();
  const actorSafeProjection = new THREE.Vector3();
  const actorSafePreviousCamera = new THREE.Vector3();
  const actorSafePreviousGaze = new THREE.Vector3();
  let actorSafeRefinements = 0;
  const portraitAimGuardianProjection = new THREE.Vector3();
  const portraitAimLandingProjection = new THREE.Vector3();
  const portraitAimLanding = new THREE.Vector3();
  const portraitAimPreviousFocus = new THREE.Vector3();
  let portraitAimCorrections = 0, portraitAimLastGain = 0;
  let actorRescueFraction = 0;
  // Reused CPU-only vectors and NDC arrays; no per-frame draw, material or
  // allocation. A genuine off-frame guardian may catch the approved two-body
  // lens, but only if the real climber stays readable and the core is clear.
  const guardianRescuePoint = new THREE.Vector3();
  // Share one read-only witness of the genuinely drawn, interpolated boss across
  // the lens, actor protection, real landing, hazard and decorative sightlines.
  const guardianDrawnCenter = new THREE.Vector3();
  let guardianDrawnSourceTick = -1;
  // Persistent identity prevents a dead boss, floor change or fresh expedition
  // from borrowing a previous camera-frame position. No per-frame allocation.
  const guardianDrawnObservation = { id:null, runToken:null, floor:null, sourceTick:-1 };
  // Diagnostic witness from the LAST genuine camera composition. update() owns
  // followComposition locally; the public 20Hz recorder calls diagnostics()
  // independently. Never read an update-local variable there or reuse a shot
  // across an episode, floor, source tick or stale transport.
  const guardianPlannerWitness = {
    runToken:null, floor:null, tick:-1, guardianId:null, anchor:null
  };
  // Real portrait footage shows the drawn bronze guardian and maul filling
  // the frame as the camera passes too close to its moving physical body.
  // Reuse one pair of tested exterior radial corrections per rendered frame;
  // neither a new camera nor any change to the source's actor positions.
  const guardianStandoffPreviousCamera = new THREE.Vector3();
  const guardianStandoffHeroNdc = [0,0,0,0];
  const guardianStandoffBossNdc = [0,0,0,0];
  let guardianStandoffTargetLift = 0, guardianStandoffFrameLift = 0;
  let guardianStandoffApplications = 0;
  // Real completed WebGL submissions, not the ideal destination or a prior
  // unrendered proposal, are the reference for a stable 2-body guardian lens.
  const lastSubmittedGuardianCamera = new THREE.Vector3();
  const lastSubmittedGuardianFocus = new THREE.Vector3();
  const lastSubmittedGuardian = {runToken:null,floor:null,tick:-1};
  const guardianOrbitPreviousCamera = new THREE.Vector3();
  const guardianOrbitPreviousFocus = new THREE.Vector3();
  const guardianOrbitHeroNdc = [0,0,0,0];
  const guardianOrbitBossNdc = [0,0,0,0];
  let guardianOrbitCappedFrames = 0, guardianOrbitVetoedFrames = 0;
  let guardianOrbitLastStep = 0;
  // Measure REAL opaque world geometry at two physical points on each actor.
  // Only during source-authenticated portrait guardian combat, at most once
  // per ten source ticks. Reuse ALL rays/vectors, never add a renderer pass.
  const guardianWorldRay = new THREE.Raycaster();
  const guardianWorldRayHits = [];
  const guardianWorldRayTarget = new THREE.Vector3();
  const candidateWorldPos = new THREE.Vector3();
  const previousWorldPos = new THREE.Vector3();
  let guardianWorldProbePosition = camera.position;
  let worldGuardianLanding = null;
  let guardianWorldTargetAngle = null, guardianWorldLastTick = -Infinity;
  let guardianWorldLastEpisode = null;
  let guardianWorldOcclusionSamples = 0, guardianWorldOcclusionImprovements = 0;
  let guardianWorldOcclusionRejected = 0, guardianWorldLastGain = 0;
  let guardianWorldLastRayObstructed = true;
  // Reuse current full-body screen envelopes and a single source-selected
  // landing projection. This physical two-subject zoom has no additional
  // renderer pass, mesh, simulated outcome or raycast per presented frame.
  const opticalActor = [0,0,0,0], opticalPartner = [0,0,0,0];
  const opticalLandingNdc = [0,0,0];
  let guardianPortraitOpticalTarget = GUARDIAN_OPTICAL_BASE_FOV;
  let guardianPortraitOpticalChanges = 0, guardianPortraitOpticalKind = 'off';
  let guardianPortraitOpticalSourceTick = -1;
  function raycastGuardianWorldOcclusion(x,y,z) {
    guardianWorldRayTarget.set(x,y,z).sub(guardianWorldProbePosition);
    const distance=guardianWorldRayTarget.length();
    if (!Number.isFinite(distance) || distance <= .75) return false;
    guardianWorldRay.set(guardianWorldProbePosition,
      guardianWorldRayTarget.multiplyScalar(1/distance));
    guardianWorldRay.near=.15;
    guardianWorldRay.far=distance-.45;
    guardianWorldRayHits.length=0;
    guardianWorldRay.intersectObjects(world.group.children,true,guardianWorldRayHits);
    for (const hit of guardianWorldRayHits) {
      let visible=true,ancestor=hit.object;
      while (ancestor && ancestor!==world.group) {
        if (ancestor.visible===false) {visible=false;break;}
        ancestor=ancestor.parent;
      }
      if (!visible) continue;
      const mat=Array.isArray(hit.object.material)
        ? hit.object.material[hit.face?.materialIndex??0]
        : hit.object.material;
      if (!mat || mat.visible===false ||
          (mat.transparent && (mat.opacity??1)<.70)) continue;
      guardianWorldRayHits.length=0;
      return true;
    }
    guardianWorldRayHits.length=0;
    return false;
  }
  const guardianRescuePreviousCamera = new THREE.Vector3();
  const guardianRescuePreviousGaze = new THREE.Vector3();
  const guardianRescueActorProjection = new THREE.Vector3();
  const guardianRescueEnemyProjection = new THREE.Vector3();
  // Preallocate two physical camera-space projected-body envelopes; the
  // guardian's massive nearer armor may mask a still-centered real hero.
  const submittedHeroBounds={left:0,right:0,bottom:0,top:0,depth:0};
  const submittedGuardianBounds={left:0,right:0,bottom:0,top:0,depth:0};
  const guardianBefore = [0, 0, 0], guardianAfter = [0, 0, 0];
  const actorBefore = [0, 0, 0], actorAfter = [0, 0, 0];
  let guardianRescueBlend = 0, guardianRescueApplications = 0;
  // Reusable measurements and camera backups; no per-frame allocation/render.
  const duelPreviousCamera = new THREE.Vector3();
  const duelTop = new THREE.Vector3(), duelBottom = new THREE.Vector3();
  const duelActorBefore = [0, 0, 0, 0], duelActorAfter = [0, 0, 0, 0];
  const duelGuardianBefore = [0, 0, 0, 0], duelGuardianAfter = [0, 0, 0, 0];
  let duelDollyApplications = 0, duelAirborneApplications = 0,
    duelDollyLastStep = 0;
  // One joint camera safety path for a REAL two-body portrait deadlock.
  // The previously approved, source-selected exterior shot is the only
  // destination; the actual rendered frame judges every proposed move.
  const jointPreviousCamera = new THREE.Vector3(), jointPreviousFocus = new THREE.Vector3();
  const jointActorBefore = [0,0,0,0], jointActorAfter = [0,0,0,0];
  const jointGuardianBefore = [0,0,0,0], jointGuardianAfter = [0,0,0,0];
  const jointLandingBefore = [0,0,0], jointLandingAfter = [0,0,0];
  let jointShotApplications = 0, jointShotLastGain = 0;
  // Reused live source crossfire shot. No GPU pass, allocations, predictive
  // route, new camera, source input or extra scene node.
  const crossfireHazardPoint = new THREE.Vector3();
  const crossfireGuardianPoint = new THREE.Vector3();
  const crossfireLandingPoint = new THREE.Vector3();
  const crossfirePreviousFocus = new THREE.Vector3();
  const crossfireHazardProjection = new THREE.Vector3();
  const crossfireLandingProjection = new THREE.Vector3();
  const crossfireTop = new THREE.Vector3(), crossfireBottom = new THREE.Vector3();
  const crossfireActorBefore = [0,0,0,0], crossfireActorAfter = [0,0,0,0];
  const crossfireGuardianBefore = [0,0,0,0], crossfireGuardianAfter = [0,0,0,0];
  const crossfireHazardBefore = [0,0,0], crossfireHazardAfter = [0,0,0];
  const crossfireLandingBefore = [0,0,0], crossfireLandingAfter = [0,0,0];
  let crossfireAimApplications = 0, crossfireAimLastGain = 0;
  // Reused projections keep the earned-door escort inside the one real lens.
  const earnedGatewayFocus = new THREE.Vector3();
  const earnedGatewayProjection = new THREE.Vector3();
  const earnedGatewayPreviousFocus = new THREE.Vector3();
  const earnedGatewayActorBefore = [0,0,0,0], earnedGatewayActorAfter = [0,0,0,0];
  const earnedGatewayBefore = [0,0,0], earnedGatewayAfter = [0,0,0];
  let earnedGatewayEscortLastGain = 0, earnedGatewayEscortApplications = 0;
  let physicalThresholdFrameGain = 0, physicalThresholdFrameCorrections = 0;
  let physicalThresholdFrameSourceBound = false;
  const thresholdHero = new THREE.Vector3(), thresholdGate = new THREE.Vector3();
  const thresholdGaze = new THREE.Vector3(), thresholdPreviousGaze = new THREE.Vector3();
  const thresholdPreviousCamera = new THREE.Vector3(), thresholdBestCamera = new THREE.Vector3();
  const thresholdBestGaze = new THREE.Vector3(), thresholdProjection = new THREE.Vector3();
  const thresholdHeroBefore = [0,0,0,0], thresholdGateBefore = [0,0,0,0];
  const thresholdHeroAfter = [0,0,0,0], thresholdGateAfter = [0,0,0,0];
  const guardianSightPoints=[];
  const climberCapSightPoint = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  let actorYaw = 0;
  const visibilityChanged = () => {
    lastTime = 0;
    resolutionPolicy.clearPacing();
    renderProgress.setVisible(document.visibilityState === 'visible', performance.now());
  };
  const cachedRestore = event => {
    if (!event.persisted) return;
    renderProgress.reset(performance.now());
    visibilityChanged();
  };
  document.addEventListener('visibilitychange', visibilityChanged);
  addEventListener('pageshow', cachedRestore);
  visibilityChanged();

  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    const compact = w < 700;
    resolutionPolicy.setCompact(compact);
    basePixelRatio = options.quality === 'low' || compact ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    // High-density HUD is still CSS/DOM; only the 3D framebuffer adapts when
    // repeated real submissions stall. Keep an explicit 78% phone clarity floor.
    renderPixelRatio = Math.round(basePixelRatio * Math.min(resolutionPolicy.scale, coldFloorScale) * 1000) / 1000;
    renderer.setPixelRatio(renderPixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function removeEnemy(entry) {
    scene.remove(entry.model.group, entry.bar, entry.warning, entry.impact, entry.threatLane, entry.chargeArc);
    entry.threatLane.geometry.dispose();
    entry.model.dispose();
  }
  function clearActors() {
    for (const entry of enemies.values()) removeEnemy(entry);
    enemies.clear();
    for (const group of pickups.values()) scene.remove(group);
    pickups.clear();
    for (const group of projectiles.values()){
      scene.remove(group,group.userData.ribbon);
      group.userData.ribbon?.geometry.dispose();
    }
    projectiles.clear();
    particleLife.fill(0);
    motionLedger.reset(); motionEcho.count = 0; motionEcho.visible = false;
    footingShadow.visible = false; observedFooting = null;
    movingDeckRide.reset(); observedRidePose = null;
    landingApproach.clear();
    hazardPressure.clear();
    physicalTouchdown = null; touchdownDebris.count = 0; touchdownDebris.visible = false;
    recoveryTransfer.clear();
    atmosphere.clear();
    guardianShotStage.clear();
    airbornePulse = null; guardianCounterPulse = null;
    crownStage.visible = false; observedCrown = null;
    echoDrawnTick = -1; observedStageLight.reset();
    guardianRescueBlend = 0; guardianRescueApplications = 0;
    duelDollyApplications = 0; duelAirborneApplications = 0;
    duelDollyLastStep = 0;
    actorSafeRefinements = 0;
    terminalCameraRun = null; terminalCameraBegan = 0;
  }
  function rebuildGraphicsResources() {
    // Dispose while WebGL is still lost: Three's disposal listeners otherwise
    // retain old-context buffers and VAOs after its restore handler resets caches.
    // Rebuild resource owners, including their detached/cached geometries.
    releaseEnvironment();
    reflectionFirstFrame = true;
    clearActors();
    scene.remove(world.group, climber.group, finale.group, passage.group, routeIntent.group, landingApproach.group, movingDeckSuspension.group, hazardPressure.group, guardianCircuit.group, guardianShotStage.group, guardianGuardStage.group, atmosphere.group, recoveryTransfer.group);
    world.dispose(); climber.dispose(); finale.dispose(); passage.dispose(); routeIntent.dispose(); landingApproach.dispose(); movingDeckSuspension.dispose(); hazardPressure.dispose(); guardianCircuit.dispose(); guardianShotStage.dispose(); guardianGuardStage.dispose(); atmosphere.dispose(); recoveryTransfer.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    sun.shadow.dispose(); sun.shadow.map = null; sun.shadow.mapPass = null;
    world = createTowerWorld(); climber = createClimber(); finale = createTowerFinale(THREE);
    passage = createTowerGuardianPassage(THREE);
    routeIntent = createTowerRouteIntent(THREE);
    landingApproach = createTowerLandingApproach(THREE);
    movingDeckSuspension = createTowerMovingDeckSuspension(THREE);
    hazardPressure = createTowerHazardPressure(THREE);
    guardianCircuit = createTowerGuardianCircuit(THREE);
    guardianShotStage = createTowerGuardianShotStage(THREE);
    guardianGuardStage = createObservedGuardianGuardStage(THREE);
    atmosphere = createTowerAtmosphere(THREE);
    recoveryTransfer = createTowerRecoveryTransfer(THREE);
    climber.group.name = 'ExpeditionClimber';
    scene.add(world.group, climber.group, finale.group, passage.group, routeIntent.group, landingApproach.group, movingDeckSuspension.group, hazardPressure.group, guardianCircuit.group, guardianShotStage.group, guardianGuardStage.group, atmosphere.group, recoveryTransfer.group);
    initialized = false;
    if (snapshot) updateEntities(snapshot);
  }
  function addEnemy(entity) {
    const model = createEnemy(entity.kind);
    const bar = new THREE.Group();
    const back = new THREE.Mesh(healthBarGeometry, healthBarDark);
    back.scale.set(entity.kind === 'guardian' ? 3.8 : 2, .14, 1);
    const fill = new THREE.Mesh(healthBarGeometry, healthBarRed);
    fill.position.z = .01;
    // Both are in the transparent list. An opaque fill would be submitted
    // before, and then covered by, the dark transparent background.
    back.renderOrder = 20; fill.renderOrder = 21;
    bar.add(back, fill);
    const warning = new THREE.Mesh(ringGeometry, warningMaterial);
    warning.rotation.x = -Math.PI / 2;
    warning.scale.setScalar(entity.kind === 'guardian' ? 3.5 : 2.2);
    const impact = new THREE.Mesh(ringGeometry, impactMaterial);
    impact.name = 'ObservedEnemyImpact'; impact.visible = false; impact.renderOrder = 22;
    const threatLane=new THREE.Mesh(createThreatLaneGeometry(),threatLaneMaterial);
    threatLane.name='ObservedEnemyTelegraphLane';threatLane.visible=false;
    threatLane.frustumCulled=false;threatLane.renderOrder=3;
    const chargeArc = new THREE.Mesh(chargeArcGeometry, chargeArcMaterial);
    chargeArc.name = 'ObservedEnemyWindup'; chargeArc.visible = false;
    chargeArc.renderOrder = 4;
    scene.add(model.group, bar, warning, impact, threatLane, chargeArc);
    const entry = { model, bar, fill, back, warning, impact, threatLane, chargeArc, initialized: false, x: entity.x, direction: entity.facing || -1, state: entity, deadUntil: 0, fireUntil: 0, impactUntil: 0, impactFramesRemaining: 0 };
    enemies.set(entity.id, entry);
    return entry;
  }
  function updateEntities(next) {
    const elapsedTicks = previous?.runToken === next.runToken && previous?.floor === next.floor ? next.tick - previous.tick : 0;
    const ids = new Set(next.enemies.map(e => e.id));
    for (const [id, entry] of enemies) if (!ids.has(id)) { removeEnemy(entry); enemies.delete(id); }
    for (const entity of next.enemies) {
      let entry = enemies.get(entity.id);
      if (!entry) entry = addEnemy(entity);
      if (entry.state.active && !entity.active) { burst(entry.model.group.position, 0xffbc6a, 18); entry.deadUntil = elapsed + .65; }
      // Only real same-run, same-floor health loss triggers a contact cue. A new
      // enemy, stale poll, heal or new run cannot fabricate a hit. The cue is
      // presentation-only: the host already resolved all authoritative combat.
      if (elapsedTicks > 0 && entry.state.active
        && Number.isFinite(entity.health) && Number.isFinite(entry.state.health)
        && entity.health < entry.state.health) {
        entry.impactUntil = elapsed + .6;
        // Real software GL can take seconds between render submissions. Keep
        // three attempted frames, then retire after ordinary 600ms on devices
        // that can actually display that many frames in time.
        entry.impactFramesRemaining = 3;
        // Physical combat is already resolved on the server. Only a genuine
        // same-run health delta can trigger the visual reaction and shards.
        burst(entry.model.group.position, entity.kind==='guardian'?0xffcd83:0xff9b69, 12);
        contactUntil=elapsed+.24;contactEnemyId=entity.id;contactHero=false;
      }
      if (entity.active && entity.attackCooldown > (entry.state.attackCooldown ?? entity.attackCooldown)) entry.fireUntil = elapsed + .2;
      const delta = entity.x - entry.x;
      if (entity.facing) entry.direction = entity.facing;
      else if (Math.abs(delta) > 20) entry.direction = Math.sign(delta);
      const vx = snapshotVelocity(entry.x, entity.x, elapsedTicks);
      entry.x = entity.x;
      entry.state = { ...entity, vx, vy: 0 };
    }
    const pickupIds = new Set(next.pickups.map(p => p.id));
    for (const [id, group] of pickups) if (!pickupIds.has(id)) { burst(group.position, 0xffdc91, 8); scene.remove(group); pickups.delete(id); }
    for (const pick of next.pickups) if (!pickups.has(pick.id)) {
      const group = new THREE.Group();
      const material = collectibleMaterials[pick.kind] || collectibleMaterials.shard;
      const gem = new THREE.Mesh(gemGeometry, material), ring = new THREE.Mesh(ringGeometry, material);
      gem.castShadow = true; ring.rotation.x = Math.PI / 2;
      group.add(gem, ring); scene.add(group); pickups.set(pick.id, group);
    }
    const projectileIds = new Set(next.projectiles.map(p => p.id));
    for (const [id, group] of projectiles) if (!projectileIds.has(id)) {
      scene.remove(group,group.userData.ribbon);
      group.userData.ribbon?.geometry.dispose();
      projectiles.delete(id);
    }
    for (const projectile of next.projectiles) if (!projectiles.has(projectile.id)) {
      const group = new THREE.Group(), mat = boltMaterials[projectile.owner] || boltMaterials.enemy;
      const dot = new THREE.Mesh(boltGeometry, mat);
      const ribbon = new THREE.Mesh(createProjectileRibbonGeometry(), ribbonMaterials[projectile.owner] || ribbonMaterials.enemy);
      ribbon.name = 'ObservedProjectileTravel';ribbon.frustumCulled=false;ribbon.renderOrder=4;
      group.add(dot);group.userData.ribbon=ribbon;
      projectiles.set(projectile.id, group);scene.add(group,ribbon);
    }
  }

  function accept(frame) {
    if (disposed || !frame?.snapshot) return;
    const next = frame.snapshot;
    const revision = `${next.runToken}:${next.revision}:${next.publicChecksum}`;
    if (revision === lastRevision) return;
    lastRevision = revision;
    // Record the current ORIGINAL browser-accepted fixed-step snapshot before
    // scene updates. Its floor change must not be mistaken for a presented
    // native-video frame; the renderer independently records submission.
    renderProgress.received(next, performance.now());
    const newRun = snapshot && next.runToken !== snapshot.runToken;
    if (newRun) {
      authenticRestartSweep = snapshot.result &&
        ['result', 'intermission'].includes(snapshot.lifecycle) &&
        ['game', 'technical', 'operator'].includes(snapshot.result.kind) &&
        next.lifecycle === 'running'
        ? { runToken: next.runToken, began: elapsed } : null;
      gatewaySourceAudit = null;
      clearActors(); passage.clear(); initialized = false; previous = null; landingMoment=-Infinity; landingRun=null; landingHalo.visible=false; footingShadow.visible=false; observedFooting=null; actorRescueFraction = 0;
    }
    if (snapshot && baseY !== next.chunkBaseY) {
      const shift = (baseY - next.chunkBaseY) / SCALE;
      climber.group.position.y += shift; camera.position.y += shift; lookAt.y += shift;
      for (const entry of enemies.values()) entry.model.group.position.y += shift;
      for (let i = 0; i < MAX_PARTICLES; i++) particlePositions[i * 3 + 1] += shift;
    }
    previous = newRun ? null : snapshot;
    snapshot = next; baseY = next.chunkBaseY;
    // Only a physically fired NEW player bolt on adjacent immutable source
    // ticks can trigger the gauntlet recoil. No ability prediction or visual
    // pulse from old packets, another floor or a fresh run.
    const pulse = options.stale || typeof witnessedAirbornePulse !== 'function'
      ? null : witnessedAirbornePulse(previous, next);
    if (pulse) airbornePulse = { ...pulse, startedAt: elapsed };
    // Give the SAME original skinned gauntlet a planted counterfire recoil only
    // after source proves the real player bolt was fired during guardian charge.
    const counter = options.stale || typeof witnessedGuardianCounterPulse !== 'function'
      ? null : witnessedGuardianCounterPulse(previous, next);
    if (counter) guardianCounterPulse = { ...counter, startedAt: elapsed };
    motionLedger.accept(previous, next);
    // Authority may heal +1 on a floor advance or upgrade without any
    // collectible. A visible rescue transfer is earned ONLY by an actual
    // nearby health pickup disappearing on a same-run, same-floor HP increase.
    const recovered = observedHealthRecovery(previous, next);
    if (recovered && !options.stale) {
      const consumedAt = pointFor(recovered.x, recovered.y,
        next.chunkBaseY, next.worldWidth, 25.3);
      recoveryTransfer.begin(recovered, consumedAt, elapsed);
    }
    // A decisive guardian hit can also advance the REAL fixed-step floor.
    // The previous gate is discarded with its old world; preserve only a short
    // non-colliding bronze passage memory, witnessed in adjacent real source
    // snapshots. Never infer a victory from animation time, a new run or a
    // missing guardian. The new floor's autonomous physics stay untouched.
    const earnedOpenCap = !options.stale ? observedUnlockedGuardianCap(next) : null;
    if (earnedOpenCap) {
      // Display the real, still-to-be-crossed doorway as soon as source
      // proves a guardian defeat. Never turn this into an auto-win, camera
      // cut, fabricated collision or UI instruction.
      const cap = earnedOpenCap.cap;
      passage.unlock(next, pointFor(guardianGateAnchorX(next, cap),
        cap.y + cap.height + 20000, next.chunkBaseY,
        next.worldWidth, 27.78));
    } else {
      // The living guardian blocks this exact source cap plane in physics.
      // Stage the SAME on-deck closed leaves and vertical energy barrier
      // before any source-authorized HP defeat, on both desktop and phone.
      // No second ghost gateway or independent animation clock.
      const lockedCap = !options.stale ? observedLockedGuardianCap(next) : null;
      if (lockedCap) {
        const cap = lockedCap.cap;
        passage.lock(next, pointFor(guardianGateAnchorX(next, cap),
          cap.y + cap.height + 20000, next.chunkBaseY,
          next.worldWidth, 27.78));
      } else if (passage.diagnostics().stage === 'guardian-locked' ||
          (next.lifecycle !== 'running' &&
          passage.diagnostics().stage === 'earned-open')) {
        passage.clear();
      }
    }
    const clearedGuardian = observedGuardianPassage(previous, next);
    // The browser can lag an authoritative 20Hz source by 16+ ticks while
    // WebGL submits a cold frame. A preceding *browser-observed* Floor8
    // packet proves a guardian was present but is NOT proof that the feet
    // occupied the cap clearance at the exact source crossing. Previously
    // that loose guardian check outranked the immutable exact crossing and
    // discarded the original real cap+gate at the FIRST Floor9 rebuild.
    // Prefer the independently validated recorded previous source endpoint,
    // including tick451 itself. Fall back to earlier observed transitions
    // only when the authoritative record is absent or not safely matched.
    // This cannot authorize a floor, collider, HP loss or extra movement.
    const recordedGroundedGatewayPrevious = !options.stale &&
      passage.diagnostics().stage !== 'handoff'
      ? observedRecordedGuardianHandoff(next) : null;
    const recordedAirborneGatewayPrevious = !options.stale &&
      !recordedGroundedGatewayPrevious &&
      passage.diagnostics().stage !== 'handoff'
      ? observedRecordedGuardianAirborneHandoff(next) : null;
    const recordedDoorstepGatewayPrevious = !options.stale &&
      !recordedGroundedGatewayPrevious && !recordedAirborneGatewayPrevious &&
      passage.diagnostics().stage !== 'handoff'
      ? observedRecordedGuardianDoorstepHandoff(next) : null;
    const recordedGatewayPrevious = recordedGroundedGatewayPrevious ||
      recordedAirborneGatewayPrevious || recordedDoorstepGatewayPrevious;
    const gatewayPrevious = recordedGatewayPrevious ||
      (clearedGuardian ? previous : null);
    // Immutable-source P0 forensic. The actual original 1x film at tick453
    // still selected the generic history despite source tick451 HP0 contact.
    // Record a bounded, public-only veto classification for the next real
    // 960x600 and 390x844 capture; it never changes passage eligibility.
    if (next.floor===9 && previous?.floor===8 &&
        previous.runToken===next.runToken) {
      gatewaySourceAudit = {
        ...auditOriginalGuardianCrossing(next,previous),
        selectedSource:recordedGroundedGatewayPrevious
          ? 'exact-immutable-crossing' :
          recordedAirborneGatewayPrevious ? 'exact-immutable-airborne-continuation' :
          recordedDoorstepGatewayPrevious ? 'exact-immutable-roof-contact-seam' :
          clearedGuardian ? 'old-browser-guardian-only' : 'neither',
        renderedGatewayNotYetProven:true,
      };
    } else if (next.floor!==9) gatewaySourceAudit=null;
    if (previous && previous.floor !== next.floor && !gatewayPrevious)
      passage.clear();
    // The old source-driven lock existed at the PREVIOUS floor's fixed
    // guardian-approach anchor on its actual cap, not the new climber or
    // an arbitrary center. Preserve that exact world location through the
    // floor switch so the cleared gate remains physically continuous.
    const guardianCap = gatewayPrevious && gatewayPrevious.platforms?.find(platform =>
      platform.id === `f${gatewayPrevious.floor}:cap` && Number.isFinite(platform.x) &&
      Number.isFinite(platform.width) && platform.width > 0 &&
      Number.isFinite(platform.y) && Number.isFinite(platform.height));
    // A genuine adjacent-floor event must preserve the PREVIOUS guardian's
    // complete exposed HP-lock geometry, including its elevated source cap
    // center. Simply using the deck top would bury the opening two world
    // units below the actual bronze lock, even with the correct radius.
    const previousLock = recordedGatewayPrevious ? null :
      clearedGuardian ? observedGuardianCircuit(previous) : null;
    // The earned passage persists for several real movement ticks after the
    // guardian's death. An inactive zero-HP source body is still authoritative
    // proof of defeat, whereas observedGuardianCircuit intentionally stops
    // rendering its live health conduit. Reconstruct ONLY the original cap
    // anchor and defeated body position from that previous source snapshot.
    const defeated = gatewayPrevious ? gatewayPrevious.enemies?.find(enemy =>
      enemy.kind === 'guardian' && enemy.active === false &&
      Number.isFinite(enemy.health) && enemy.health <= 0 &&
      [enemy.x, enemy.y, enemy.halfHeight].every(Number.isFinite)) : null;
    if (guardianCap && (previousLock || defeated) &&
        Number.isFinite(next.worldWidth) && next.worldWidth > 0) {
      const gateAnchorX = guardianGateAnchorX(gatewayPrevious, guardianCap);
      if (!previousLock || gateAnchorX === previousLock.toX) {
        const gateY = previousLock?.toY ??
          guardianCap.y + guardianCap.height + 20000;
        const guardianX = previousLock?.fromX ?? defeated.x;
        const guardianY = previousLock?.fromY ??
          defeated.y - defeated.halfHeight + 9000;
        const started = passage.begin(gatewayPrevious, next, pointFor(gateAnchorX,
          gateY, next.chunkBaseY, next.worldWidth, 27.78),
          pointFor(guardianX, guardianY,
            next.chunkBaseY, next.worldWidth, 27.65));
        // Keep the ORIGINAL GPU-resident old cap deck through the same
        // authenticated grounded doorway crossing instead of cutting straight
        // to an unrelated violet scene. Never retain a whole old floor or
        // allow this presentation request to grant floor progression.
        if (started && passage.diagnostics().continuousGroundedHandoff)
          world.stageGroundedCapContinuation(gatewayPrevious, next);
      }
    }
    // Maintain one honest visual path beyond the defeated guardian: the same
    // 12 non-colliding bronze inlays are rebuilt from the real new-floor
    // ground at the transition and lit only as the authoritative climber
    // continues grounded traversal. A restart, airborne step or stale source
    // retires the visual; it cannot cause floor progression.
    passage.trackSuccessor(next, options.stale);
    // A landing is observable only across consecutive source snapshots in the
    // same real run/floor. Skipped long intervals and decorative ledge poses
    // cannot invent a contact or shake the camera.
    const landed = previous && previous.runToken === next.runToken && previous.floor === next.floor
      && next.tick > previous.tick && next.tick - previous.tick <= 8
      && previous.player.state === 'airborne' && previous.player.vy < -350
      && next.player.state === 'standing' && next.player.vy === 0 && next.player.health > 0;
    if (landed) {
      // The ring, fragments, camera weight and opt-in landing audio all refer
      // to a genuine occupied deck. An airborne->standing flag alone may
      // represent another lifecycle or recovery mechanism, not an impact.
      const contact = observedPhysicalTouchdown(previous, next);
      if (contact) {
        const deck = pointFor(contact.x, contact.top,
          next.chunkBaseY, next.worldWidth, 27.16);
        landingHalo.position.set(deck.x, deck.y + .085, deck.z);
        landingMoment = elapsed; landingRun = next.runToken;
        landingFloor = next.floor; landingWeight = contact.strength;
        physicalTouchdown = contact;
      } else {
        landingHalo.visible = false;
        physicalTouchdown = null;
      }
    }
    updateEntities(next);
    if (previous && next.player.health < previous.player.health) {
      burst(climber.group.position, 0xff855f, 16);
      contactUntil=elapsed+.24;contactHero=true;contactEnemyId=null;
    }
    if (previous && next.player.state === 'airborne' && previous.player.state === 'standing') burst(climber.group.position, 0xadf8e8, 6);
    if (themeKey !== next.theme) {
      themeKey = next.theme;
      const theme = THEMES[themeKey] || THEMES.foundry;
      const lighting = LIGHTING[themeKey] || LIGHTING.foundry;
      scene.fog.color.set(theme.fog).lerp(new THREE.Color(lighting.horizon), .3);
      skyMaterial.uniforms.top.value.set(lighting.top);
      skyMaterial.uniforms.horizon.value.set(lighting.horizon);
      skyMaterial.uniforms.bottom.value.set(lighting.bottom);
      hemi.color.set(theme.ambient).lerp(new THREE.Color(lighting.fill), .25);
      hemi.groundColor.set(lighting.bounce).multiplyScalar(.3);
      hemi.intensity = lighting.ambient;
      sun.color.set(theme.sun); sun.intensity = lighting.key;
      rim.color.set(lighting.fill); rim.intensity = lighting.rim;
      bounce.color.set(lighting.bounce); bounce.intensity = lighting.ground;
      scene.environmentIntensity = lighting.reflection;
      renderer.toneMappingExposure = lighting.exposure;
      reflectionDirty = true;
      reflectionFirstFrame = true;
    }
  }

  function update(dt) {
    if (!snapshot) return;
    // update() runs only with a valid context. Snapshot/theme changes accepted
    // during interruption therefore cannot allocate replacement GPU resources.
    if (reflectionDirty) {
      if (options.quality !== 'low' && reflectionFirstFrame) {
        // Never make the very first visible frame wait for the costly PMREM
        // conversion. Retire prior-biome reflections immediately; direct lights
        // still show the truthful scene. Conversion may run next submission.
        releaseEnvironment();
        reflectionFirstFrame = false;
      } else {
        refreshEnvironment();
        reflectionFirstFrame = false;
      }
    }
    // The real old cap/door, environmental horizon and camera share the
    // existing source-verified submitted-frame passage clock.
    world.update(snapshot, dt, elapsed, options, passage.diagnostics());
    // Only the actually selected/occupied source moving deck gets an extra
    // non-colliding mechanical undercarriage; duplicate render frames do not
    // advance it, and live guardians retain visual priority.
    movingDeckSuspension.update(snapshot, options);
    hazardPressure.update(snapshot, options);
    // Architectural depth and motion are shared across all five authored
    // biomes; the current source tick and character own every weather pose.
    atmosphere.update(snapshot, options);
    const p = snapshot.player;
    const lightCue = observedStageLight.sample(snapshot, dt,
      !!options.stale, !!options.reducedMotion);
    // Same authoritative, public airborne velocity owns the visual weather
    // and opt-in wind; the existing lights add a restrained continuous
    // traversal accent, not an extra draw or a fictional success signal.
    const traversalBeat = observedTraversalKinetics(snapshot);
    const liveAirflow = options.stale || options.reducedMotion ? 0 :
      traversalBeat.airflow;
    const targetPlatform = intendedLanding(snapshot);
    const actionStage = !options.stale && !options.reducedMotion
      ? observedActionStage(snapshot, targetPlatform) : null;
    // The rendered footprint is an actual beneath-feet SOURCE deck, including
    // an observed moving platform. The gap softens its shade as the hero rises;
    // no shadow survives a stale packet, dead actor, result or restart.
    observedFooting = !options.stale ? observedTowerFooting(snapshot) : null;
    observedRidePose = movingDeckRide.sample(snapshot, observedFooting, options);
    footingShadow.visible = !!observedFooting;
    if (observedFooting) {
      const footprint = pointFor(observedFooting.x, observedFooting.top,
        snapshot.chunkBaseY, snapshot.worldWidth, 26.8);
      const airGap = observedFooting.clearance / SCALE;
      footingShadow.position.set(footprint.x, footprint.y + .07, footprint.z);
      const spread = Math.min(2.4, airGap * .095);
      footingShadow.scale.set(2.1 + spread, 1.3 + spread * .55, 1);
      footingShadow.material.uniforms.uOpacity.value = observedFooting.grounded
        ? .44 : Math.max(.06, .34 * (1 - Math.min(1, airGap / 18)));
    }
    // The AI's actual next landing is the only route we visualize. Hide
    // intention while true enemy windups demand full viewer attention.
    // Resource recovery uses the CURRENT supporting deck, not a future
    // landing. The normal landing beacon remains hidden during this choice.
    const recoverySupport = snapshot.intent?.mode?.replace(/^oracle-/, '') === 'collecting-resource'
      ? snapshot.platforms?.find(deck => deck.id === snapshot.intent?.targetPlatformId) : null;
    routeIntent.update(snapshot, recoverySupport || targetPlatform, options);
    // The current selected deck retains a readable physical threshold even
    // while its source-driven moving carriage changes world position.
    // Real health detours and guardian windups yield to higher-priority cues.
    landingApproach.update(snapshot, recoverySupport ? null : targetPlatform,
      !recoverySupport && targetPlatform
        ? observedSourceLandingX(snapshot, targetPlatform) : null, options);
    // HP-operated real-world lock: one depth-tested architectural twin-rail
    // connection from the live guardian to its existing cap anchor.
    guardianCircuit.update(snapshot, options);
    guardianShotStage.update(snapshot, options);
    // The summit's physical bearing stays pinned to the REAL cap throughout
    // route replans, moving decks and guardian HP changes. Only observed
    // combat loss alters its metal; telegraphs dim it for danger readability.
    observedCrown = !options.stale ? observeTowerCrown(snapshot) : null;
    crownStage.visible = !!observedCrown;
    if (observedCrown) {
      // Inboard by 6.13 world units from the previously camera-facing
      // radius 28.85, safely beyond the core while behind the real
      // radius-25..27 bodies. Present objective, not a foreground obstruction.
      // The cap ID, horizontal bearing and elevation remain source-owned.
      const beacon = pointFor(observedCrown.anchorX,
        observedCrown.top + 37000, observedCrown.baseY,
        observedCrown.width, 22.72);
      crownStage.position.set(beacon.x, beacon.y, beacon.z);
      crownStage.rotation.y = beacon.angle;
      crownRing.rotation.z = options.reducedMotion ? -Math.PI * .18 :
        -Math.PI * .18 + .022 * Math.sin(observedCrown.sourceTick * .033);
      const actualLoss = observedCrown.guardianHealthRatio === null ? 0 :
        1 - observedCrown.guardianHealthRatio;
      crownMetal.color.set(0xa38b72).lerp(paleCrownMetal, actualLoss * .55);
      crownMetal.emissiveIntensity = observedCrown.telegraph ? .045 :
        .12 + actualLoss * .16;
    }
    const ledgeContact = ledgeContactPoint(snapshot, targetPlatform);
    const ledgeTarget = ledgeContact ? pointFor(ledgeContact.x, ledgeContact.y,
      snapshot.chunkBaseY, snapshot.worldWidth, 27.1) : null;
    const approachRadius = climbApproachRadius(snapshot, targetPlatform);
    const ledgeMantle = ledgeMantlePose(snapshot, targetPlatform);
    // The skinned boot may settle only onto the authoritative intended deck's
    // actual top. Its world-space Y and radial walking band are presentation
    // inputs; they are never reported to or used by the simulation authority.
    const ledgeSurface = ledgeMantle && targetPlatform ? {
      platformId: targetPlatform.id,
      y: pointFor(targetPlatform.x, targetPlatform.y+targetPlatform.height,
        snapshot.chunkBaseY, snapshot.worldWidth, 27.1).y,
      innerRadius: 22.4, outerRadius: 27.18,
    } : null;
    const mapped = pointFor(p.x, p.y - p.halfHeight, snapshot.chunkBaseY, snapshot.worldWidth, approachRadius);
    actorTarget.set(mapped.x, mapped.y, mapped.z);
    const moving = Math.abs(p.vx) > 500;
    const desiredYaw = mapped.angle + (moving || p.state === 'dashing' ? p.facing * Math.PI / 2 : p.facing * .32);
    const blend = 1 - Math.exp(-dt * 17);
    // The exact-source ledge film exposed desktop-only contact penetration:
    // at tick 131 the desktop root lagged to r=27.606 and its helmet cut into
    // the slab, while the same portrait snapshot was safely at r=28.041.
    // The real authoritative hand grip and actual sole crossing must never
    // be delayed by wall-clock smoothing into solid architecture. A cosmetic
    // landing cue, guessed future jump or dormant platform cannot trigger it.
    const sourceSoleOverRim = !!ledgeMantle && !!targetPlatform &&
      p.y - p.halfHeight >= targetPlatform.y + targetPlatform.height;
    const sourceRimBoundary = !!ledgeContact || sourceSoleOverRim;
    if (!initialized) { climber.group.position.copy(actorTarget); actorYaw = desiredYaw; }
    else { followClimberContact(climber.group.position, actorTarget, blend, p.state, sourceRimBoundary); actorYaw += Math.atan2(Math.sin(desiredYaw - actorYaw), Math.cos(desiredYaw - actorYaw)) * blend; }
    climber.group.rotation.y = actorYaw;
    climber.group.scale.setScalar(p.halfHeight * 2 / SCALE / 2.8);
    recoveryTransfer.update(snapshot, climber.group.position, elapsed, options);
    const echoes = motionLedger.samples;
    motionEcho.visible = !options.stale && !options.reducedMotion &&
      snapshot.lifecycle === 'running' && p.health > 0 && echoes.length > 1;
    if (motionEcho.visible && echoDrawnTick !== snapshot.tick) {
      let count = 0;
      for (const item of echoes) {
        const age = snapshot.tick - item.tick;
        if (age < 0 || age > 18 || count >= 13) continue;
        const point = pointFor(item.x, item.y - p.halfHeight,
          snapshot.chunkBaseY, snapshot.worldWidth, 27.55);
        echoTransform.position.set(point.x, point.y + .5, point.z);
        const strength = Math.max(.22, 1 - age / 18);
        echoTransform.scale.setScalar(.52 + strength * 1.4);
        echoTransform.rotation.set(0, point.angle, age * .2);
        echoTransform.updateMatrix();
        motionEcho.setMatrixAt(count++, echoTransform.matrix);
      }
      motionEcho.count = count;
      motionEcho.instanceMatrix.needsUpdate = count > 0;
      echoDrawnTick = snapshot.tick;
    }
    const sourceGuardian = !options.stale && snapshot.lifecycle === 'running' &&
      p.health > 0 ? snapshot.enemies?.find(enemy =>
        enemy.kind === 'guardian' && enemy.active) : null;
    const nextGuardianShotKey = sourceGuardian
      ? `${snapshot.runToken}:${snapshot.floor}:${sourceGuardian.id}` : null;
    if (nextGuardianShotKey !== guardianShotKey) {
      guardianShotKey = nextGuardianShotKey;
      guardianShotLean = null;
    }
    // Both combat composition and skinned threat response read the SAME
    // authenticated, present-tick shot corridor. Never stage an airborne
    // guardian from speculation or stale source, and never hijack a routine jump.
    const guardianWarning = guardianShotStage.diagnostics();
    // A witnessed new expedition opens on a readable exterior establishing
    // view, then gently closes back to the player's normal follow lens.
    // This is a true scene reset, never a fake defeat, freeze or time warp.
    if (authenticRestartSweep && (authenticRestartSweep.runToken !== snapshot.runToken ||
      snapshot.lifecycle !== 'running' || elapsed - authenticRestartSweep.began >= 3.2))
      authenticRestartSweep = null;
    const restartReveal = authenticRestartSweep && !options.stale &&
      !options.reducedMotion && options.camera === 'follow'
      ? Math.pow(1 - clamp((elapsed - authenticRestartSweep.began) / 3.2, 0, 1), 2) : 0;
    const drawnGuardianAnchor = !options.stale && !options.reducedMotion
      ? observedDrawnGuardianCameraAnchor(sourceGuardian, guardianDrawnCenter,
          guardianDrawnObservation, snapshot) : null;
    const followComposition = options.camera === 'overview' ? null :
      composeFollowView(snapshot, climber.group.position, camera.aspect,
        orbit - restartReveal * .11, zoom + restartReveal * .17, guardianShotLean,
        !options.stale && guardianWarning.visible ? guardianWarning.guardianId : null,
        !options.stale && guardianWarning.visible ? guardianShotStage.focusPoint() : null,
        !options.stale ? guardianWarning.pulseGuardianId : null,
        !options.stale && typeof guardianShotStage.pulseFocusPoint === 'function'
          ? guardianShotStage.pulseFocusPoint() : null,
        !options.stale ? guardianWarning.liveHostileGuardianId : null,
        !options.stale ? guardianShotStage.liveHostileFocusPoint() : null,
        drawnGuardianAnchor, sourceGuardian?.id ?? null);
    guardianPlannerWitness.runToken = snapshot.runToken;
    guardianPlannerWitness.floor = snapshot.floor;
    guardianPlannerWitness.tick = snapshot.tick;
    guardianPlannerWitness.guardianId = sourceGuardian?.id ?? null;
    guardianPlannerWitness.anchor = !options.stale &&
      sourceGuardian?.health > 0 && followComposition?.guardianStaged
        ? followComposition.guardianPlannerAnchor ?? null : null;
    guardianShotLean = !options.stale && followComposition?.guardianStaged
      ? followComposition.lean : null;
    const viewPosition = initialized ? camera.position : followComposition?.position || camera.position;
    const viewAngle = Math.atan2(viewPosition.x - climber.group.position.x, viewPosition.z - climber.group.position.z) - actorYaw;
    options.viewAzimuth = Math.atan2(Math.sin(viewAngle), Math.cos(viewAngle));
    // An actual low-health resource detour is a visible autonomous decision.
    // Aim the skinned visor at the public health pickup instead of the stale
    // ascent target. This changes no physics or collision and draws no HUD.
    const earnedGate = !options.stale ? observedUnlockedGuardianCap(snapshot) : null;
    const earnedExitX = earnedGate ? guardianGateAnchorX(snapshot, earnedGate.cap) : null;
    const earnedExitY = earnedGate
      ? earnedGate.cap.y + earnedGate.cap.height + 20000 : null;
    const resourceTarget = snapshot.intent?.mode === 'collecting-resource'
      ? snapshot.pickups.filter(item => item.kind === 'health')
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x) || a.id.localeCompare(b.id))[0]
      : null;
    // During a genuine guardian approach, the physical eyes and helmet must
    // acknowledge the actual opponent instead of a stale midpoint beacon.
    // This source-bound pose changes neither the AI's target nor combat rules.
    // The physical skinned visor turns toward the same true ranged duel as
    // the follow camera. No independent animation target or speculative hit.
    const rangedDuelFocus = !!sourceGuardian &&
      guardianWarning.pulseGuardianId === sourceGuardian.id &&
      ((p.state === 'standing' && !options.stale) ||
        (p.state === 'airborne' && !options.stale &&
          Math.abs(sourceGuardian.x - p.x) <= 90000));
    const duelFocus = sourceGuardian &&
      [sourceGuardian.x, sourceGuardian.y, p.x, p.y].every(Number.isFinite) &&
      Math.abs(sourceGuardian.x - p.x) <= (rangedDuelFocus ? 135000 : 90000) &&
      Math.abs(sourceGuardian.y - p.y) <= 60000 &&
      (rangedDuelFocus || sourceGuardian.telegraph || p.attacking ||
        ['engaging-enemy', 'bracing-telegraph', 'evading-telegraph',
          'evading-projectile'].includes(snapshot.intent?.mode));
    const witnessedShot = duelFocus && guardianWarning.visible &&
      guardianWarning.guardianId === sourceGuardian.id &&
      Number.isFinite(guardianWarning.remainingChargeTicks);
    const observedPulse = p.state === 'airborne' ? airbornePulse :
      p.state === 'standing' ? guardianCounterPulse : null;
    climber.animate({ ...p,
      // Only a real result is allowed to end a still-living climber's
      // expedition with a physical kneel or neutral halt. A lethal result
      // continues to use its existing dead pose; a new run clears both.
      terminalKind: snapshot.lifecycle !== 'running' ? snapshot.result?.kind : null,
      terminalReason: snapshot.lifecycle !== 'running' ? snapshot.result?.reason : null,
      intentMode: snapshot.intent?.mode,
      // A real source-new bolt causes a short existing-rig recoil without
      // modifying attack authority or creating a phantom strike in air.
      earnedPulseAge: !options.stale && observedPulse &&
        observedPulse.runToken === snapshot.runToken &&
        observedPulse.floor === snapshot.floor &&
        snapshot.lifecycle === 'running' && p.health > 0
        ? elapsed - observedPulse.startedAt : null,
      platformRide: observedRidePose,
      traversalBeat,
      // The same authentic floor-advance gate memory can weight the skinned
      // ascent handoff. No invented win: only the adjacent source guardian
      // passage exposes a nonzero weight, then retires on its own.
      guardianReleaseWeight: !options.stale && snapshot.lifecycle === 'running' &&
        p.health > 0 ? passage.cameraWeight() : 0,
      incomingGuardianCharge: witnessedShot
        ? clamp((8 - guardianWarning.remainingChargeTicks) / 7, 0, 1) : null,
      incomingGuardianSide: witnessedShot ? Math.sign(sourceGuardian.x - p.x) : 0,
      targetDx: duelFocus ? sourceGuardian.x - p.x : earnedGate ? earnedExitX - p.x : resourceTarget ? resourceTarget.x - p.x : targetPlatform ? targetPlatform.x + targetPlatform.width / 2 - p.x : 0,
      targetDy: duelFocus ? sourceGuardian.y - p.y : earnedGate ? earnedExitY - p.y : resourceTarget ? resourceTarget.y - p.y : targetPlatform ? targetPlatform.y + targetPlatform.height - p.y : 0,
      // Real snapshot platform top, inside the existing radial walking surface.
      // No grab, pause, lift or authoritative collision is fabricated.
      ledgeTarget,
      ledgeMantle,
      ledgeSurface,
      // Bound the transient contact handoff to this exact authoritative
      // run/platform/tick, so a restart cannot reuse an earlier grip pose.
      runToken: snapshot.runToken,
      floor: snapshot.floor,
      ledgePlatformId: targetPlatform?.id ?? null,
      tick: snapshot.tick,
    }, dt, elapsed, options);
    ledgeContactEvidence = ledgeTarget ? measureLedgeFingertip(climber.group, ledgeTarget, targetPlatform.id) : null;
    finale.update(snapshot, climber.group.position, elapsed, options);
    passage.update(dt, options);
    attackArc.visible = !!p.attacking && p.health > 0;
    if (attackArc.visible && positionStrikeCue(attackArc, climber.group, camera)) {
      attackArc.rotateZ(p.facing > 0 ? -.8 : Math.PI - .8);
    }
    landingCue.visible = !!targetPlatform;
    if (targetPlatform) {
      const key = `${snapshot.worldWidth}:${snapshot.chunkBaseY}:${targetPlatform.id}:${targetPlatform.x}:${targetPlatform.y}:${targetPlatform.width}:${targetPlatform.height}`;
      if (landingCueKey !== key) { updateLandingCueGeometry(landingCue.geometry, targetPlatform, snapshot); landingCueKey = key; }
    }
    guardianSightPoints.length=0;
    // A real climber crossing beneath an opaque cap needs the same bounded
    // architectural sightline protection already provided to the guardian.
    // This only softens camera-obstructing cap materials; no ghost character,
    // X-ray overlay, route prediction or collider change. The visor is read
    // from its actual solved skinned world transform after animation.
    if (!options.stale && snapshot.lifecycle === 'running' && p.health > 0) {
      const cap = snapshot.platforms.find(deck => deck.id === `f${snapshot.floor}:cap`);
      // Only inspect the relevant crown crossing. Otherwise the ordinary
      // endless ascent must not pay a repeated cap raycast for a distant hero
      // or make out-of-view masonry unnecessarily translucent.
      const crownY = cap && cap.y + cap.height;
      const nearCrown = Number.isFinite(crownY) &&
        Math.abs(p.y + p.halfHeight - crownY) <= 65000;
      if (nearCrown) {
        const visor = climber.group.getObjectByName('expressive-helmet');
        if (visor) guardianSightPoints.push(visor.getWorldPosition(climberCapSightPoint));
      }
    }
    for (const entry of enemies.values()) {
      const e = entry.state;
      const position = pointFor(e.x, e.y - e.halfHeight, snapshot.chunkBaseY, snapshot.worldWidth);
      destination.set(position.x, position.y, position.z);
      const model = entry.model.group;
      const enemyYaw = position.angle + entry.direction * 1.12;
      if (!entry.initialized) { model.position.copy(destination); entry.yaw = enemyYaw; entry.initialized = true; }
      else { model.position.lerp(destination, blend); entry.yaw += Math.atan2(Math.sin(enemyYaw - entry.yaw), Math.cos(enemyYaw - entry.yaw)) * blend; }
      model.rotation.y = entry.yaw;
      model.scale.setScalar(e.halfHeight * 2 / SCALE / (e.kind === 'guardian' ? 5.6 : 2.8));
      entry.model.animate({ ...e, canopyClearance: guardianCanopyClearance(snapshot, e), firing: elapsed < entry.fireUntil }, dt, elapsed, options);
      if(e.active&&e.kind==='guardian'){
        const crest=model.getObjectByName('armored-head');
        if(crest){
          entry.crestSightPoints ||= [];
          guardianSightPoints.push(...sampleGuardianCrownSightlines(crest, entry.crestSightPoints));
        }
      }
      model.visible = e.active || elapsed < entry.deadUntil;
      entry.bar.visible = e.active;
      entry.bar.position.copy(model.position); entry.bar.position.y += e.halfHeight * 2 / SCALE + .6;
      entry.bar.quaternion.copy(camera.quaternion);
      const width = e.kind === 'guardian' ? 3.8 : 2;
      entry.fill.scale.set(width * Math.max(0, e.health / Math.max(1, e.maxHealth)), .09, 1);
      entry.fill.position.x = (entry.fill.scale.x - width) / 2;
      entry.warning.position.copy(model.position); entry.warning.position.y += .08;
      entry.warning.visible = e.active && e.telegraph && !options.stale;
      // A guardian's *true* remaining charge ticks make the deck warning
      // contract inward as its maul rises. Reduced motion retains a constant
      // physical danger ring. No imaginary strike/hit is presented.
      const chargeTotal = e.kind === 'guardian'&&e.telegraphTotalTicks===6?6:8;
      const chargeLeft = Number.isFinite(e.telegraphTicksRemaining)
        ? clamp(e.telegraphTicksRemaining,1,chargeTotal):chargeTotal;
      const threatBase = e.kind === 'guardian' ? 3.5 : 2.2;
      entry.warning.scale.setScalar(threatBase*(options.reducedMotion?1:.82+.2*(1-chargeLeft/chargeTotal)));
      // The guardian has a real exterior source-facing shot stage instead.
      // Never stack the old inner-core stripe over that same encounter;
      // non-guardian authentic telegraphs keep their original 3D strip.
      entry.threatLane.visible = e.active && e.telegraph && !options.stale && e.kind !== 'guardian';
      if(entry.threatLane.visible)poseThreatLane(entry.threatLane,e,snapshot);
      // The incomplete arc shrinks across the enemy's true remaining ticks.
      // Rotation is optional; reduced motion retains size and shape information.
      entry.chargeArc.visible = e.active && e.telegraph && e.kind !== 'sentinel' && !options.stale;
      if (entry.chargeArc.visible) {
        const remaining = Number.isFinite(e.telegraphTicksRemaining)
          ? clamp(e.telegraphTicksRemaining, 1, chargeTotal) / chargeTotal : 1;
        entry.chargeArc.position.copy(model.position);
        entry.chargeArc.position.y += e.halfHeight * 2 / SCALE * .69;
        scratch.copy(camera.position).sub(entry.chargeArc.position).normalize();
        entry.chargeArc.position.addScaledVector(scratch, .55);
        entry.chargeArc.quaternion.copy(camera.quaternion);
        if (!options.reducedMotion) entry.chargeArc.rotateZ((1 - remaining) * Math.PI * .72);
        entry.chargeArc.scale.setScalar((e.kind === 'guardian' ? 2.1 : 1.25) * (.58 + remaining * .42));
      }
      const impact = entry.impact;
      // Reuse the owned 3D armor-impact marker during a genuinely interrupted
      // guardian windup. The existing red threat ring stays OFF because this
      // enemy cannot fire until its fixed-step stagger has expired.
      const interrupted = !options.stale && snapshot.lifecycle === 'running' &&
        e.kind === 'guardian' && e.active &&
        Number.isFinite(e.staggerTicksRemaining) && e.staggerTicksRemaining > 0;
      impact.visible = (e.active || elapsed < entry.deadUntil)
        && (elapsed < entry.impactUntil || entry.impactFramesRemaining > 0 || interrupted);
      if (impact.visible) {
        impact.position.copy(model.position);
        impact.position.y += e.halfHeight * 2 / SCALE * .62;
        // Place the cue just in front of the actual armor, not through the deck.
        scratch.copy(camera.position).sub(impact.position).normalize();
        impact.position.addScaledVector(scratch, e.kind === 'guardian' ? .85 : .5);
        impact.quaternion.copy(camera.quaternion);
        impact.scale.setScalar(e.kind === 'guardian' ? 1.5 : .95);
      }
    }
    // The true defense phase owns one physical 3D interlock and a counterstep
    // window; read the updated living guardian model, never a guessed pose.
    const guardingEntry=[...enemies.values()].find(entry=>
      entry.state.kind==='guardian'&&entry.state.active&&
      Number.isFinite(entry.state.guardTicksRemaining)&&
      entry.state.guardTicksRemaining>0);
    guardianGuardStage.update(snapshot,guardingEntry?.model.group,
      guardingEntry?.state,options);
    // A contact pulse is a short, bounded camera response to observed damage,
    // never an invented attack. Reduced motion retains the world-space cues.
    const contactProgress=options.stale?0:clamp((contactUntil-elapsed)/.24,0,1);
    const landingProgress=clamp((elapsed-landingMoment)/.6,0,1);
    const actual = physicalTouchdown;
    // Moving decks carry their own real contact impression for its short
    // lifetime; the original decal must not hang in empty air as the source
    // platform travels. Never project from a guessed or vanished landing.
    const actualDeck = actual && snapshot.platforms?.find(deck =>
      deck.id === actual.platformId &&
      [deck.x, deck.y, deck.width, deck.height].every(Number.isFinite) &&
      deck.width > 0 && deck.height > 0);
    const witnessedDeck = !!actualDeck && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0 &&
      actual.runToken === snapshot.runToken && actual.floor === snapshot.floor &&
      Number.isSafeInteger(snapshot.tick) &&
      snapshot.tick >= actual.tick && snapshot.tick - actual.tick <= 16 &&
      snapshot.worldWidth === actual.worldWidth &&
      landingRun === snapshot.runToken && landingFloor === snapshot.floor;
    const burstAge = elapsed - landingMoment;
    const carriedX = witnessedDeck ? clamp(actual.x + actualDeck.x - actual.left,
      actualDeck.x + actual.halfWidth, actualDeck.x + actualDeck.width - actual.halfWidth) : null;
    const deckTop = witnessedDeck ? actualDeck.y + actualDeck.height : null;
    landingHalo.visible = witnessedDeck && landingProgress < 1;
    if (landingHalo.visible) {
      const onDeck = pointFor(carriedX, deckTop, snapshot.chunkBaseY,
        snapshot.worldWidth, 27.16);
      landingHalo.position.set(onDeck.x, onDeck.y + .085, onDeck.z);
      landingHalo.scale.setScalar(options.reducedMotion ? .85 + landingWeight*.2
        : .55 + landingProgress*(1.15+landingWeight*.65));
      landingHalo.material.opacity=landingWeight*(options.reducedMotion ? .62
        : .78*(1-landingProgress)*(1-landingProgress));
    }
    // All three visible contact stages share the very same verified physical
    // deck, even when it translates. Neither a dead/restarted run nor a stale
    // source packet can retain a free-floating or counterfeit impact.
    const hasDeck = landingHalo.visible && burstAge >= 0 && burstAge < .65;
    touchdownDebris.visible = hasDeck;
    touchdownDebris.count = 0;
    if (hasDeck) {
      const quiet = !!options.reducedMotion;
      const count = quiet ? 4 : options.quality === 'low' ? 8 : 16;
      const progress = clamp(burstAge / .65, 0, 1);
      const travel = quiet ? .2 : .2 + .8 * progress;
      const spread = Math.min(14000, Math.max(1000,
        (actualDeck.width - 2 * actual.halfWidth) * .28));
      for (let i = 0; i < count; i++) {
        const theta = i * Math.PI * 2 / count;
        const x = clamp(carriedX + Math.sin(theta) * spread * travel,
          actualDeck.x + 1000, actualDeck.x + actualDeck.width - 1000);
        const radius = 25.6 + Math.cos(theta) * (quiet ? .22 : .24 + .46 * progress);
        const at = pointFor(x, deckTop, snapshot.chunkBaseY, actual.worldWidth, radius);
        const lift = quiet ? .12 : .09 + Math.sin(progress * Math.PI) *
          (.25 + actual.strength * .48);
        touchdownPose.position.set(at.x, at.y + lift, at.z);
        touchdownPose.scale.setScalar(quiet ? .28 :
          (.42 - .28 * progress) * (.65 + .35 * actual.strength));
        touchdownPose.rotation.set(0, theta,
          quiet ? 0 : progress * (i % 2 ? -1.3 : 1.3));
        touchdownPose.updateMatrix();
        touchdownDebris.setMatrixAt(i, touchdownPose.matrix);
      }
      touchdownDebris.count = count;
      touchdownDebris.instanceMatrix.needsUpdate = true;
    }
    for (const pick of snapshot.pickups) {
      const group = pickups.get(pick.id);
      const mapped = pointFor(pick.x, pick.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.2);
      group.position.set(mapped.x, mapped.y + (options.reducedMotion ? 0 : Math.sin(elapsed * 2 + pick.x) * .16), mapped.z);
      const soughtHealth = snapshot.intent?.mode === 'collecting-resource' && pick.kind === 'health';
      // A contained in-world beacon, not another text cluster: this glow is
      // attached to the genuine collectible and vanishes when authority takes it.
      group.scale.setScalar(soughtHealth ? (options.reducedMotion ? 1.16 : 1.16 + .08 * Math.sin(elapsed * 5)) : 1);
      group.rotation.y = options.reducedMotion ? .3 : elapsed * (soughtHealth ? 1.2 : .7);
    }
    for (const p of snapshot.projectiles) {
      const group = projectiles.get(p.id), mapped = pointFor(p.x, p.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.8);
      group.position.set(mapped.x, mapped.y, mapped.z);
      group.rotation.y = mapped.angle + (p.vx < 0 ? Math.PI : 0);
      poseProjectileRibbon(group.userData.ribbon,p,snapshot);
    }
    let particlesChanged = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      // A previous size can remain after clearActors() retired a run. Flush it
      // once; idle frames must not re-upload 96 unchanged GPU particles.
      if (particleLife[i] <= 0 && particleSizes[i] <= 0) continue;
      particlesChanged = true;
      particleLife[i] = Math.max(0, particleLife[i] - dt);
      particleSizes[i] = particleLife[i] * 8;
      if (!particleLife[i]) continue;
      const b = i * 3;
      particleVelocity[b + 1] -= dt * 4;
      for (let a = 0; a < 3; a++) particlePositions[b + a] += particleVelocity[b + a] * dt;
    }
    if (particlesChanged) for (const attribute of Object.values(particleGeometry.attributes)) attribute.needsUpdate = true;
    // The source selects WHICH living boss is in combat. The already submitted
    // rig chooses WHERE its visibly interpolated body is now. Never substitute
    // authoritative coordinates for drawn combatant pixels in post-camera guards.
    guardianDrawnSourceTick = readRenderedGuardianCenter(
      sourceGuardian, enemies, guardianDrawnCenter, SCALE)
      ? snapshot.tick : -1;
    if (guardianDrawnSourceTick === snapshot.tick) {
      guardianDrawnObservation.id = sourceGuardian.id;
      guardianDrawnObservation.runToken = snapshot.runToken;
      guardianDrawnObservation.floor = snapshot.floor;
      guardianDrawnObservation.sourceTick = snapshot.tick;
    } else {
      guardianDrawnObservation.id = null;
      guardianDrawnObservation.sourceTick = -1;
    }
    const currentGuardianDrawPoint = guardianDrawnSourceTick === snapshot.tick
      ? guardianDrawnCenter : null;
    const portrait = camera.aspect < .85;
    const overview = options.camera === 'overview';
    let targetY;
    if (overview) {
      const wantedAngle = .27 + orbit;
      cameraAngle = initialized ? lerp(cameraAngle, wantedAngle, 1 - Math.exp(-dt * 2.5)) : wantedAngle;
      const radius = (portrait ? 145 : 110) * zoom;
      targetY = 21; focus.set(0, targetY, 0);
      destination.set(Math.sin(cameraAngle) * radius, targetY + 18, Math.cos(cameraAngle) * radius);
    } else {
      focus.copy(followComposition.focus); destination.copy(followComposition.position); targetY = followComposition.focus.y;
    }
    // An authentic guardian clearance leaves a floor-local architectural
    // passage behind the climber while the follow camera acknowledges the
    // ascent. Do not alter overview or reduced-motion camera conventions.
    const releaseWeight = options.stale || options.reducedMotion ? 0 : passage.cameraWeight();
    // Keep the SAME continuous follow shot through a genuinely unlocked cap.
    // The old time-only glance could look away before the climber physically
    // reached the bronze doorway, particularly in a narrow portrait camera.
    // Public cap geometry and the REAL current player x decide the lead; no
    // guessed win, hidden route data or second camera/renderer is involved.
    const liveExit = !overview && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0
      ? observedUnlockedGuardianCap(snapshot) : null;
    const earnedPassageStage = liveExit ? passage.diagnostics() : null;
    const sourceEarnedWalk = !overview && !options.reducedMotion &&
      !options.stale && liveExit &&
      earnedPassageStage?.active &&
      earnedPassageStage.stage === 'earned-open' &&
      earnedPassageStage.runToken === snapshot.runToken &&
      earnedPassageStage.floor === snapshot.floor
      ? observedGroundedGatewayShot(snapshot, liveExit, camera.aspect, zoom) : null;
    // The same SOURCE-EARNED gate remains physically ahead of a real airborne
    // step or dash. The grounded-only cinematic ceased at takeoff in exact
    // portrait film; the giant dial then occupied the frame while the hero
    // and live threshold left the action sightline. The airborne helper is
    // strict about current-run defeat, cap geometry, whole-body footprint and
    // true height above the source roof. It cannot grant progression.
    const sourceAirborneWalk = !overview && !options.reducedMotion &&
      !options.stale && liveExit && earnedPassageStage?.active &&
      earnedPassageStage.stage === 'earned-open' &&
      earnedPassageStage.runToken === snapshot.runToken &&
      earnedPassageStage.floor === snapshot.floor
      ? observedAirborneGatewayShot(snapshot, liveExit, camera.aspect, zoom) : null;
    // Genuine portrait footage at f812 (guardian 1HP before tick 441, physical
    // floor-nine crossing at tick 451) left too little post-defeat wall-time
    // for the camera to find the real inner doorway. Build the SAME exterior
    // camera composition during only the actual living boss's final quarter
    // of HP, with its physical cap under the source hero. The lock stays SHUT.
    // Existing actor/core sightline vetoes remain mandatory downstream.
    const liveLastStand = !overview && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0
      ? observedLockedGuardianCap(snapshot) : null;
    const sourceLastStand = !overview && !options.reducedMotion &&
      !options.stale && liveLastStand &&
      passage.diagnostics().stage === 'guardian-locked'
      ? observedLiveGuardianLastStandShot(snapshot, liveLastStand, camera.aspect, zoom)
      : null;
    // The grounded source 8→9 handoff retains the same real threshold, but
    // the previous camera abandoned it when the new floor removed liveExit.
    // Continue this single safe exterior follow shot only while the player is
    // genuinely supported on Floor9 and physically close to the old doorway.
    const sourceGroundedHandoffShot = !overview && !options.stale &&
      !options.reducedMotion && snapshot.lifecycle === 'running'
      ? observedGroundedHandoffShot(snapshot, passage.diagnostics(),
          camera.aspect, zoom) : null;
    const sourceAirborneHandoffShot = !overview && !options.stale &&
      !options.reducedMotion && snapshot.lifecycle === 'running' &&
      typeof observedAirborneHandoffShot === 'function'
      ? observedAirborneHandoffShot(snapshot, passage.diagnostics(),
          camera.aspect, zoom) : null;
    // Preserve the truthful old bronze gate in the *first actually submitted*
    // Floor 9 shot even when its shorter decorative passage animation expired.
    // The world owner only exposes a source-validated ORIGINAL mesh witness.
    const coldArchProof = !overview && !options.stale && !options.reducedMotion &&
      snapshot.lifecycle === 'running' && snapshot.floor === 9
        ? world.retainedFilmHandoff?.(snapshot) : null;
    const coldArchLens = coldArchProof
      ? observedSourceBoundColdDoorwayLens(snapshot, coldArchProof,
          climber.group.position, camera.aspect, zoom) : null;
    const realCapLens = sourceEarnedWalk || sourceAirborneWalk || sourceLastStand ||
      sourceGroundedHandoffShot || sourceAirborneHandoffShot || coldArchLens;
    // Prior source-pinned desktop and phone films never kept the actual
    // BODY and physical old gateway together on the first Floor9 frames.
    // Let that same proof request a two-subject gaze, never a new viewpoint.
    const jointThresholdShot = !overview && !options.stale &&
      !options.reducedMotion && snapshot.lifecycle === 'running' &&
      (sourceGroundedHandoffShot || sourceAirborneHandoffShot)
      ? observedEarnedCrossfloorJointShot(snapshot, passage.diagnostics(),
          climber.group.position, camera.aspect, zoom) : null;
    const realCapStage = sourceEarnedWalk || sourceAirborneWalk
      ? earnedPassageStage : sourceLastStand || sourceGroundedHandoffShot ||
        sourceAirborneHandoffShot ? passage.diagnostics()
          : coldArchLens ? {focusPosition:coldArchLens.gateway} : null;
    // The source-qualified next-floor camera request must also reach the
    // real visual rescue below. Before this, the follow lens tracked the
    // doorway but the safety-gated escort could never run: it depended only
    // on OLD-floor exit progress, already reset to zero on Floor9.
    const groundedHandoffEscort =
      sourceGroundedHandoffShot?.groundedHandoff === true &&
      sourceGroundedHandoffShot.sourceTick === snapshot.tick
        ? sourceGroundedHandoffShot.focusWeight : 0;
    const airborneHandoffEscort =
      sourceAirborneHandoffShot?.airborneHandoff === true &&
      sourceAirborneHandoffShot.sourceTick === snapshot.tick
        ? sourceAirborneHandoffShot.focusWeight : 0;
    // Keep the SAME real camera, with a source-first cap position and radius:
    // no extra scene, invented time window, generated floor or camera cut.
    if (realCapLens && Array.isArray(realCapStage?.focusPosition) &&
        realCapStage.focusPosition.length === 3 &&
        realCapStage.focusPosition.every(Number.isFinite)) {
      // The prior blind radial contraction brought the climber closer, but
      // could put the actual moving camera behind the opaque tower core.
      // The authorized gateway focus is the PHYSICAL inner doorway, not
      // the temporary guardian-defeat memorial gaze. Every proposed
      // intermediate position needs an unobstructed hero AND door.
      earnedGatewayFocus.set(...realCapStage.focusPosition);
      const currentRadius = Math.hypot(destination.x, destination.z);
      if (currentRadius > realCapLens.radius) {
        const safeRadius = safeEarnedGatewayDollyRadius(destination,
          realCapLens.radius, climber.group.position, earnedGatewayFocus);
        if (safeRadius !== null && safeRadius < currentRadius) {
          const contraction = safeRadius / currentRadius;
          destination.x *= contraction;
          destination.z *= contraction;
        }
      }
      focus.lerp(earnedGatewayFocus, realCapLens.focusWeight);
      if (coldArchLens?.coldOriginalArch) {
        // The source owns BOTH the new living body and original doorway.
        // Share one exterior follow gaze after the first GPU return, never a
        // last-second re-spawn/camera cut. The subsequent actor/core safety
        // and physical sightline checks keep priority.
        const [x,y,z] = coldArchLens.focus;
        const w = coldArchLens.focusWeight;
        focus.x += (x - focus.x) * w;
        focus.y += (y - focus.y) * w;
        focus.z += (z - focus.z) * w;
        const existingRadius = Math.hypot(destination.x,destination.z);
        if (existingRadius > 1 && existingRadius < coldArchLens.radius) {
          // Expand at most 12% per REAL frame. The ordinary lens may be
          // too tight to hold the original arch and actual progressing
          // climber together after a costly new-floor WebGL submission.
          const scale = Math.min(1.12,coldArchLens.radius/existingRadius);
          const x = destination.x * scale, z = destination.z * scale;
          const proposed = {x,y:destination.y,z};
          if (towerCoreSightlineClear(proposed,climber.group.position) &&
              towerCoreSightlineClear(proposed,earnedGatewayFocus)) {
            destination.x=x;destination.z=z;
          }
        }
      }
      if (jointThresholdShot) {
        // Reuse the current focus vector; no extra camera or render target.
        // Preserve the ordinary actor/core rescue and manual overview vetoes.
        const [x,y,z] = jointThresholdShot.focus;
        const w = jointThresholdShot.focusWeight;
        focus.x += (x - focus.x) * w;
        focus.y += (y - focus.y) * w;
        focus.z += (z - focus.z) * w;
      }
    }
    const arrivalFraming = liveExit &&
      earnedPassageStage?.stage === 'earned-open'
      ? observedPassageApproach(snapshot, liveExit) : 0;
    // A gateway that first appears after defeating the guardian is not
    // enough: the genuine cap crossing must remain readable through the
    // *walk*, rather than re-entering the lens only in the final few steps.
    // The cap promenade has a source-tick-backed position; it provides a
    // bounded camera escort as the real climber approaches the earned door.
    // Actor, guardian and destination safety still outrank this optional
    // composition. No separate camera, cut or gameplay control is created.
    const sourceWalkProgress = liveExit &&
      passage.diagnostics().stage === 'earned-open' && !options.reducedMotion
      ? passage.diagnostics().inlayProgress : 0;
    const walkwayLead = Math.max(0, Math.min(.34,
      (sourceWalkProgress - .18) / .65 * .34));
    const physicalEscort = Math.max(releaseWeight, walkwayLead);
    if (!overview && physicalEscort > 0) {
      destination.y += physicalEscort * 1.4;
      focus.y += physicalEscort * .65;
      // A source-witnessed glance begins as an unobtrusive elevated escort,
      // then keeps the ACTUAL passage in frame as the actor walks through.
      // The later live actor-projection rescue vetoes an unsafe crop.
      const releaseFocus = passage.focusPoint();
      if (releaseFocus) focus.lerp(releaseFocus,
        Math.max(Math.min(.18, physicalEscort * .15),
          arrivalFraming * (portrait ? .30 : .24)));
    }
    // The authentic result/intermission needs a COMPLETE visual sentence.
    // Frame the climber + the physical source-earned floor-rung memorial, not
    // the last stale air-control target. Keep the entire lens on the OUTSIDE
    // of the solid tower while the 20 Hz authority runs normally.
    const terminalStaged = !overview && finale.group.visible && !!snapshot.result
      && ['result', 'intermission'].includes(snapshot.lifecycle);
    if (!terminalStaged) terminalCameraRun = null;
    if (terminalStaged) {
      // The source, not the camera, determines whether the expedition ended.
      // An actual new run/restart gets an independent shot; an old terminal
      // frame can never stage a fictitious reward or prolong intermission.
      if (terminalCameraRun !== snapshot.runToken) {
        terminalCameraRun = snapshot.runToken;
        terminalCameraBegan = elapsed;
      }
      const shot = composeTowerTerminalShot(climber.group.position,
        camera.aspect, zoom, orbit,
        Math.max(0, elapsed - terminalCameraBegan), options.reducedMotion);
      if (shot) {
        destination.copy(shot.position);
        focus.copy(shot.focus);
        targetY = focus.y;
      }
    }
    // An actual upward arc should briefly feel lighter near zero vertical
    // velocity, then regain deck scale as the descending climber approaches
    // a *currently selected, observed* supporting surface. This is a subtle
    // camera-weight layer over the same uncut exterior follow shot; guardian,
    // crusher, genuine landing and terminal shots retain precedence. The
    // portrait/full-body rescue below still vetoes unsafe composition.
    if (!overview && !terminalStaged && !options.stale &&
        !options.reducedMotion && snapshot.lifecycle === 'running' &&
        p.health > 0 && p.state === 'airborne' && !sourceGuardian &&
        (!actionStage || actionStage.kind === 'climber' ||
          actionStage.kind === 'landing')) {
      const hang = traversalBeat.apex;
      const approach = traversalBeat.landingReadiness;
      destination.y += hang * (portrait ? 1.35 : 1.05) -
        approach * (portrait ? .68 : .43);
      focus.y += hang * (portrait ? .54 : .41) - approach * .22;
    }
    // Follow source-observed guardian action a little faster than exploration:
    // a real HP change should not be over before the camera catches its actor.
    // All motion remains bounded and presentation-only; reduced motion is still.
    // Target the exterior of the LIVING, genuinely drawn guardian's large
    // 3D body, before the smoothed orbit can accidentally run through its
    // armor and hammer. The source actor, source halfHeight and real current
    // drawn guardian must all be present in this SAME snapshot. Preserve the
    // existing hero/core checks and original source-owned movement.
    guardianStandoffTargetLift = 0;
    const protectLivingGuardian = !overview && portrait &&
      !options.stale && !options.reducedMotion &&
      snapshot.lifecycle === 'running' && p.health > 0 &&
      sourceGuardian?.active === true && sourceGuardian.health > 0 &&
      followComposition?.guardianStaged && currentGuardianDrawPoint &&
      Number.isFinite(sourceGuardian.halfHeight) &&
      sourceGuardian.halfHeight > 0 && zoom <= 1.03;
    if (protectLivingGuardian) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      const plannedStandoff = guardianExteriorPortraitStandoff(
        destination, currentGuardianDrawPoint, actorFramePoint,
        sourceGuardian.halfHeight / SCALE, camera.aspect);
      if (plannedStandoff) {
        destination.x = plannedStandoff.x;
        destination.z = plannedStandoff.z;
        guardianStandoffTargetLift = plannedStandoff.step;
      }
    }
    let cameraRate = towerCameraRate(camera.position, destination,
      !overview && !!followComposition?.guardianStaged, overview);
    if (terminalStaged) cameraRate = Math.max(cameraRate, 6.5);
    if (guardianStandoffTargetLift > 0)
      cameraRate = Math.max(cameraRate, 7.2);
    // Source-near crossing deserves a responsive continuous lens, but NEVER
    // alters simulation time or overrides the actor/guardian safety checks.
    if (arrivalFraming > 0 && !options.reducedMotion)
      cameraRate = Math.max(cameraRate, 3.8 + arrivalFraming * 2.4);
    if (sourceEarnedWalk)
      cameraRate = Math.max(cameraRate, 4.3 + 2.1 * sourceEarnedWalk.approach);
    // Keep the same bounded follow camera responsive during the actual
    // supported successor-floor steps; no hard cut or timeline hold.
    if (groundedHandoffEscort > .04 && !options.reducedMotion)
      cameraRate = Math.max(cameraRate, 3.9 + 4 * groundedHandoffEscort);
    // The original first Floor9 observation is often AIRBORNE. Previously
    // its genuine escort had no corresponding camera follow-rate response,
    // so the visual actor and old threshold separated before the first
    // completed cold Three.js submission.
    if (airborneHandoffEscort > .04 && !options.reducedMotion)
      cameraRate = Math.max(cameraRate, 3.9 + 4 * airborneHandoffEscort);
    if (!overview && !options.reducedMotion && initialized) {
      // Project the real current climber into the camera image from the
      // previous submitted pose. This catches a fast dash, launch or new-floor
      // traversal BEFORE ordinary slow interpolation loses the hero at the
      // portrait edge. Preserve the outside-core orbit and gaze together.
      camera.updateMatrixWorld(true);
      scratch.copy(climber.group.position);
      scratch.y += p.halfHeight / SCALE;
      scratch.project(camera);
      cameraRate = towerCameraActorSafetyRate(cameraRate,
        scratch.x, scratch.y, camera.aspect);
      // An observed guardian cropped in the PREVIOUS submitted image gets a
      // faster, continuous exterior orbit toward the already safe composition.
      // The actor and the airborne landing remain higher-priority objectives.
      if (!options.stale && followComposition?.guardianStaged && sourceGuardian &&
          Number.isFinite(sourceGuardian.x) && Number.isFinite(sourceGuardian.y)) {
        const enemyPoint = currentGuardianDrawPoint || pointFor(sourceGuardian.x, sourceGuardian.y,
          snapshot.chunkBaseY, snapshot.worldWidth, 27.15);
        scratch.set(enemyPoint.x, enemyPoint.y, enemyPoint.z).project(camera);
        cameraRate = towerCameraGuardianSafetyRate(cameraRate,
          scratch.x, scratch.y, camera.aspect);
      }
    }
    // Never limit first pose, stale footage, reduced motion, overview,
    // an unseen guardian, or a cropped/hidden actor. Actual CURRENT submitted
    // drawn body locations decide whether the stable dual-subject orbit applies.
    let duelOrbitBudget = Infinity;
    if (initialized && !overview && !options.reducedMotion &&
        !options.stale && snapshot.lifecycle === 'running' && p.health > 0 &&
        sourceGuardian?.active && followComposition?.guardianStaged &&
        currentGuardianDrawPoint) {
      camera.lookAt(lookAt);
      camera.updateMatrixWorld(true);
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      scratch.copy(actorFramePoint).project(camera);
      guardianRescueEnemyProjection.copy(currentGuardianDrawPoint).project(camera);
      const heroDepth=camera.position.distanceTo(actorFramePoint);
      const guardianDepth=camera.position.distanceTo(currentGuardianDrawPoint);
      const lensTangent=Math.tan(camera.fov*Math.PI/360);
      const projectBody=(target, center, depth, halfWidth, halfHeight)=>{
        const factor=1/Math.max(.25,depth*lensTangent);
        const hx=Math.max(0,halfWidth)*factor/camera.aspect;
        const hy=Math.max(0,halfHeight)*factor;
        target.left=center.x-hx;target.right=center.x+hx;
        target.bottom=center.y-hy;target.top=center.y+hy;
        target.depth=depth;
      };
      projectBody(submittedHeroBounds,scratch,heroDepth,
        p.halfWidth/SCALE,p.halfHeight/SCALE);
      projectBody(submittedGuardianBounds,guardianRescueEnemyProjection,guardianDepth,
        sourceGuardian.halfWidth/SCALE,sourceGuardian.halfHeight/SCALE);
      const foreground=observedGuardianForegroundPressure(
        submittedHeroBounds,submittedGuardianBounds);
      duelOrbitBudget = towerDuelOrbitBudget(dt, camera.aspect, scratch,
        guardianRescueEnemyProjection,
        towerCoreSightlineClear(camera.position, actorFramePoint, 23.5),
        towerCoreSightlineClear(camera.position, currentGuardianDrawPoint, 23.5),
        foreground.occlusion+foreground.dominance*.3);
    }
    const cameraBlend = options.reducedMotion ? 1 : 1 - Math.exp(-dt * cameraRate);
    if (!initialized) { camera.position.copy(destination); lookAt.copy(focus); initialized = true; }
    else {
      followTowerCamera(camera.position, destination, cameraBlend, duelOrbitBudget);
      followTowerFocus(lookAt, focus, cameraBlend, duelOrbitBudget);
    }
    // When the smoothed camera still genuinely loses the visible climber,
    // recover on the EXTERIOR tower arc rather than letting several seconds
    // of portrait climbing happen offscreen. The composer remains the primary
    // director; this can only intervene in a running, live, non-reduced-motion
    // frame, and never alters a replay, result, HUD or simulation snapshot.
    actorRescueFraction = 0;
    if (!overview && initialized && !options.reducedMotion && !options.stale
      && snapshot.lifecycle === 'running' && p.health > 0) {
      camera.lookAt(lookAt);
      camera.updateMatrixWorld(true);
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      scratch.copy(actorFramePoint).project(camera);
      actorRescueFraction = recoverTowerActorView(camera.position, lookAt,
        actorFramePoint, scratch.x, scratch.y, scratch.z,
        camera.aspect, dt, actorOrbitTarget);
      // A final real-submitted-frame safe margin check follows the guardian
      // chase and source-earned impact camera below, not the early lens.
    }
    // Keep both real combat subjects readable in the SAME uninterrupted shot.
    // Merely accelerating the camera was insufficient in the portrait videos:
    // the slow exterior orbit could leave the fighting guardian outside the
    // crop while its HP and real cap machinery were already changing.
    //
    // Only a currently alive, source-observed guardian on a successfully
    // planned TWO-BODY exterior lens can request this guarded correction.
    // Save the actual smoothed camera, try a bounded continuation toward that
    // already validated lens, and KEEP it only when the guardian's screen
    // error measurably decreases without cropping/occluding the climber.
    // No teleport, fake enemy, time slowdown, extra render or prediction.
    guardianRescueBlend = 0;
    if (!overview && !options.reducedMotion && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0 &&
      actorRescueFraction === 0 && followComposition?.guardianStaged &&
      followComposition.clear && followComposition.guardianFramed &&
      // The source-backed aerial two-body lens protects a 14%-high hero:
      // its real guardian must not be ignored by the post-smoothing camera
      // merely because the grounded 16% comfort threshold is unreachable in
      // a narrow landing shot. The same projected actor/core rescue vetoes
      // below still reject any unsafe or hidden camera.
      followComposition.heroFraction >=
        (p.state === 'airborne' && followComposition.duelLandingSoftened &&
         (guardianWarning.pulseGuardianId === sourceGuardian?.id ||
          guardianWarning.guardianId === sourceGuardian?.id) ? .14 : .16) &&
      sourceGuardian &&
      [sourceGuardian.x, sourceGuardian.y].every(Number.isFinite)) {
      const observed = currentGuardianDrawPoint || pointFor(sourceGuardian.x, sourceGuardian.y,
        snapshot.chunkBaseY, snapshot.worldWidth, 27.15);
      guardianRescuePoint.copy(observed);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld(true);
      guardianRescueEnemyProjection.copy(guardianRescuePoint).project(camera);
      guardianRescueActorProjection.copy(actorFramePoint).project(camera);
      guardianBefore[0] = guardianRescueEnemyProjection.x;
      guardianBefore[1] = guardianRescueEnemyProjection.y;
      guardianBefore[2] = guardianRescueEnemyProjection.z;
      actorBefore[0] = guardianRescueActorProjection.x;
      actorBefore[1] = guardianRescueActorProjection.y;
      actorBefore[2] = guardianRescueActorProjection.z;
      const pressure = guardianFramePressure(guardianBefore, camera.aspect);
      if (pressure > .12 && Number.isFinite(pressure)) {
        const step = guardianCameraRecoveryBlend(pressure, dt);
        guardianRescuePreviousCamera.copy(camera.position);
        guardianRescuePreviousGaze.copy(lookAt);
        followTowerCamera(camera.position, destination, step);
        followTowerFocus(lookAt, focus, step);
        camera.lookAt(lookAt);
        camera.updateMatrixWorld(true);
        guardianRescueEnemyProjection.copy(guardianRescuePoint).project(camera);
        guardianRescueActorProjection.copy(actorFramePoint).project(camera);
        guardianAfter[0] = guardianRescueEnemyProjection.x;
        guardianAfter[1] = guardianRescueEnemyProjection.y;
        guardianAfter[2] = guardianRescueEnemyProjection.z;
        actorAfter[0] = guardianRescueActorProjection.x;
        actorAfter[1] = guardianRescueActorProjection.y;
        actorAfter[2] = guardianRescueActorProjection.z;
        if (acceptGuardianCameraRescue({
          aspect: camera.aspect, guardianBefore, guardianAfter, actorBefore,
          actorAfter,
          actorCoreClear: towerCoreSightlineClear(camera.position, actorFramePoint, 23.5),
          guardianCoreClear: towerCoreSightlineClear(camera.position, guardianRescuePoint, 23.5),
        })) {
          guardianRescueBlend = step;
          guardianRescueApplications++;
        } else {
          camera.position.copy(guardianRescuePreviousCamera);
          lookAt.copy(guardianRescuePreviousGaze);
          camera.lookAt(lookAt);
          camera.updateMatrixWorld(true);
        }
      }
    }
    if(!options.reducedMotion && !options.stale && options.camera==='follow'&&contactProgress>0)
      camera.position.y+=(contactHero?-.24:.18)*Math.sin((1-contactProgress)*Math.PI);
    if(!options.reducedMotion && options.camera==='follow' && landingHalo.visible)
      camera.position.y-=landingWeight*.13*Math.sin(landingProgress*Math.PI);
    // Source-authentic portrait video still loses the hero safe frame AFTER
    // the guardian chase or touchdown shake. Perform the measured rescue last,
    // while protecting an opponent that is already visible and core-clear.
    // No fake body, cut, gameplay tick, HUD element or extra WebGL pass.
    if (!overview && !options.reducedMotion && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0 &&
      camera.aspect < .85) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      const protectGuardian = !!sourceGuardian &&
        !!followComposition?.guardianStaged &&
        Number.isFinite(sourceGuardian.x) && Number.isFinite(sourceGuardian.y);
      if (protectGuardian) {
        const observed = currentGuardianDrawPoint || pointFor(sourceGuardian.x, sourceGuardian.y,
          snapshot.chunkBaseY, snapshot.worldWidth, 27.15);
        guardianRescuePoint.copy(observed);
      }
      const verified = refineTowerActorSafeFrame(camera, lookAt, actorFramePoint,
        dt, actorSafeProjection, actorOrbitTarget,
        actorSafePreviousCamera, actorSafePreviousGaze,
        protectGuardian ? guardianRescuePoint : null,
        protectGuardian ? guardianRescueEnemyProjection : null);
      if (verified > 0) {
        actorRescueFraction = Math.max(actorRescueFraction, verified);
        actorSafeRefinements = Math.min(1000000, actorSafeRefinements + 1);
      }
    }
    // Older original-source portrait film shows a tiny airborne climber
    // during real guardian exchanges. Extend the EXISTING two-body safe
    // physical lens, not another camera layer; the source-selected landing
    // must remain legible or the proposed dolly is rolled back.
    duelDollyLastStep = 0;
    const airborneDuelLanding = p.state === 'airborne' &&
      targetPlatform && typeof targetPlatform.id === 'string' &&
      snapshot.intent?.targetPlatformId === targetPlatform.id &&
      [targetPlatform.x, targetPlatform.y, targetPlatform.width,
        targetPlatform.height].every(Number.isFinite) &&
      targetPlatform.width > 0 && targetPlatform.height > 0;
    if (!overview && !options.reducedMotion && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0 &&
      (p.state === 'standing' || airborneDuelLanding) &&
      zoom <= 1.02 && camera.aspect < .85 &&
      sourceGuardian && sourceGuardian.health > 0 &&
      Number.isFinite(sourceGuardian.halfHeight) && sourceGuardian.halfHeight > 0 &&
      Number.isFinite(p.halfHeight) && p.halfHeight > 0 &&
      followComposition?.guardianStaged && followComposition.clear &&
      followComposition.guardianFramed &&
      (sourceGuardian.telegraph || sourceGuardian.health < sourceGuardian.maxHealth ||
        ['engaging-enemy', 'bracing-telegraph', 'evading-telegraph'].includes(snapshot.intent?.mode))) {
      const site = currentGuardianDrawPoint || pointFor(sourceGuardian.x, sourceGuardian.y,
        snapshot.chunkBaseY, snapshot.worldWidth, 27.15);
      guardianRescuePoint.copy(site);
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      camera.lookAt(lookAt); camera.updateMatrixWorld(true);
      measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
        camera, duelTop, duelBottom, duelActorBefore);
      measureDuelBodyNdc(guardianRescuePoint, sourceGuardian.halfHeight / SCALE,
        camera, duelTop, duelBottom, duelGuardianBefore);
      if (airborneDuelLanding) {
        const landed = pointFor(observedSourceLandingX(snapshot, targetPlatform),
          targetPlatform.y + targetPlatform.height,
          snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
        portraitAimLanding.set(landed.x, landed.y, landed.z);
        portraitAimLandingProjection.copy(portraitAimLanding).project(camera);
        jointLandingBefore[0] = portraitAimLandingProjection.x;
        jointLandingBefore[1] = portraitAimLandingProjection.y;
        jointLandingBefore[2] = portraitAimLandingProjection.z;
      }
      const previousRadius = Math.hypot(camera.position.x, camera.position.z);
      // A midair motion arc changes the visible body quickly: cap both radius
      // and frame-rate-dependent displacement below the grounded lens.
      const nextRadius = Math.max(30.8, previousRadius -
        Math.min(airborneDuelLanding ? .46 : .85,
          dt * (airborneDuelLanding ? 8 : 13)));
      if (nextRadius < previousRadius - .1 && duelActorBefore[3] < .16 &&
        previousRadius > 30.9) {
        duelPreviousCamera.copy(camera.position);
        const scale = nextRadius / previousRadius;
        camera.position.x *= scale; camera.position.z *= scale;
        camera.lookAt(lookAt); camera.updateMatrixWorld(true);
        measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
          camera, duelTop, duelBottom, duelActorAfter);
        measureDuelBodyNdc(guardianRescuePoint, sourceGuardian.halfHeight / SCALE,
          camera, duelTop, duelBottom, duelGuardianAfter);
        if (airborneDuelLanding) {
          portraitAimLandingProjection.copy(portraitAimLanding).project(camera);
          jointLandingAfter[0] = portraitAimLandingProjection.x;
          jointLandingAfter[1] = portraitAimLandingProjection.y;
          jointLandingAfter[2] = portraitAimLandingProjection.z;
        }
        if (acceptObservedDuelDolly({
          aspect: camera.aspect, actorBefore: duelActorBefore,
          actorAfter: duelActorAfter, guardianBefore: duelGuardianBefore,
          guardianAfter: duelGuardianAfter,
          radiusBefore: previousRadius, radiusAfter: nextRadius,
          airborne: !!airborneDuelLanding,
          landingBefore: airborneDuelLanding ? jointLandingBefore : null,
          landingAfter: airborneDuelLanding ? jointLandingAfter : null,
          actorCoreClear: towerCoreSightlineClear(camera.position, actorFramePoint, 23.5),
          guardianCoreClear: towerCoreSightlineClear(camera.position, guardianRescuePoint, 23.5),
        })) {
          duelDollyApplications = Math.min(1000000, duelDollyApplications + 1);
          if (airborneDuelLanding) duelAirborneApplications =
            Math.min(1000000, duelAirborneApplications + 1);
          duelDollyLastStep = previousRadius - nextRadius;
        } else {
          camera.position.copy(duelPreviousCamera);
          camera.lookAt(lookAt); camera.updateMatrixWorld(true);
        }
      }
    }
    // Source-observed final portrait composition: applies to live ascent and
    // airborne landings, NOT only terminal memorial or staged test poses.
    // This follows every prior real impact/camera adjustment.
    portraitAimLastGain=0;
    if(!overview&&!options.reducedMotion&&!options.stale&&
       snapshot.lifecycle==='running'&&p.health>0&&
       camera.aspect>0&&camera.aspect<.85) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y+=p.halfHeight/SCALE;
      const protectGuardian=!!sourceGuardian&&!!followComposition?.guardianStaged&&
        Number.isFinite(sourceGuardian.x)&&Number.isFinite(sourceGuardian.y);
      if(protectGuardian){
        const point=currentGuardianDrawPoint || pointFor(sourceGuardian.x,sourceGuardian.y,
          snapshot.chunkBaseY,snapshot.worldWidth,27.15);
        guardianRescuePoint.copy(point);
      }
      let protectLanding=false;
      if(p.state==='airborne'&&targetPlatform&&
         Number.isFinite(targetPlatform.y)&&Number.isFinite(targetPlatform.height)){
        const point=pointFor(observedSourceLandingX(snapshot,targetPlatform),
          targetPlatform.y+targetPlatform.height,snapshot.chunkBaseY,
          snapshot.worldWidth,26.7);
        portraitAimLanding.set(point.x,point.y,point.z);
        protectLanding=true;
      }
      portraitAimLastGain=correctTowerPortraitFocus(camera,lookAt,actorFramePoint,
        protectGuardian?guardianRescuePoint:null,
        protectLanding?portraitAimLanding:null,dt,actorSafeProjection,
        portraitAimGuardianProjection,portraitAimLandingProjection,
        portraitAimPreviousFocus,p.halfHeight/SCALE,
        protectGuardian&&Number.isFinite(sourceGuardian.halfHeight)?
          sourceGuardian.halfHeight/SCALE:0);
      if(portraitAimLastGain>0)portraitAimCorrections=Math.min(1000000,
        portraitAimCorrections+1);
    }
    // Earlier unilateral rescues cannot always resolve the real phone case
    // where BOTH the climber and guardian have drifted outside safe bounds.
    // Make one bounded, continuous follow toward the already validated
    // TWO-body exterior composition. Accept only a measurable FULL-BODY
    // crop improvement; an observed airborne landing remains protected.
    // This never changes a source tick, gameplay decision or geometry.
    jointShotLastGain = 0;
    if (!overview && !options.reducedMotion && !options.stale &&
      options.camera === 'follow' && snapshot.lifecycle === 'running' &&
      p.health > 0 && zoom <= 1.02 && camera.aspect > 0 &&
      camera.aspect < .85 && Number.isFinite(dt) && dt > 0 &&
      sourceGuardian?.health > 0 && sourceGuardian.active === true &&
      Number.isFinite(sourceGuardian.halfHeight) && sourceGuardian.halfHeight > 0 &&
      Number.isFinite(p.halfHeight) && p.halfHeight > 0 &&
      followComposition?.guardianStaged && followComposition.clear &&
      followComposition.guardianFramed) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      const position = currentGuardianDrawPoint || pointFor(sourceGuardian.x, sourceGuardian.y,
        snapshot.chunkBaseY, snapshot.worldWidth, 27.15);
      guardianRescuePoint.copy(position);
      camera.lookAt(lookAt); camera.updateMatrixWorld(true);
      measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
        camera, duelTop, duelBottom, jointActorBefore);
      measureDuelBodyNdc(guardianRescuePoint, sourceGuardian.halfHeight / SCALE,
        camera, duelTop, duelBottom, jointGuardianBefore);
      const startWorst = Math.max(
        observedJointBodyPressure(jointActorBefore, camera.aspect),
        observedJointBodyPressure(jointGuardianBefore, camera.aspect, 'guardian'));
      if (startWorst > .065 && Number.isFinite(startWorst)) {
        let preserveLanding = false;
        if (p.state === 'airborne' && targetPlatform &&
          [targetPlatform.x, targetPlatform.y, targetPlatform.width,
            targetPlatform.height].every(Number.isFinite) &&
          targetPlatform.width > 0 && targetPlatform.height > 0) {
          const landed = pointFor(observedSourceLandingX(snapshot,targetPlatform),
            targetPlatform.y + targetPlatform.height,
            snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
          portraitAimLanding.set(landed.x,landed.y,landed.z).project(camera);
          jointLandingBefore[0] = portraitAimLanding.x;
          jointLandingBefore[1] = portraitAimLanding.y;
          jointLandingBefore[2] = portraitAimLanding.z;
          portraitAimLanding.set(landed.x,landed.y,landed.z);
          preserveLanding = true;
        }
        jointPreviousCamera.copy(camera.position);
        jointPreviousFocus.copy(lookAt);
        const jointBlend = Math.min(.23,
          1 - Math.exp(-Math.min(.06, dt) * 12));
        followTowerCamera(camera.position, destination, jointBlend);
        followTowerFocus(lookAt, focus, jointBlend);
        camera.lookAt(lookAt); camera.updateMatrixWorld(true);
        measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
          camera, duelTop, duelBottom, jointActorAfter);
        measureDuelBodyNdc(guardianRescuePoint, sourceGuardian.halfHeight / SCALE,
          camera, duelTop, duelBottom, jointGuardianAfter);
        if (preserveLanding) {
          portraitAimLandingProjection.copy(portraitAimLanding).project(camera);
          jointLandingAfter[0] = portraitAimLandingProjection.x;
          jointLandingAfter[1] = portraitAimLandingProjection.y;
          jointLandingAfter[2] = portraitAimLandingProjection.z;
        }
        const gain = guardedJointShotGain({
          aspect: camera.aspect, actorBefore: jointActorBefore,
          actorAfter: jointActorAfter, guardianBefore: jointGuardianBefore,
          guardianAfter: jointGuardianAfter,
          landingBefore: preserveLanding ? jointLandingBefore : null,
          landingAfter: preserveLanding ? jointLandingAfter : null,
          actorCoreClear: towerCoreSightlineClear(camera.position, actorFramePoint, 23.5),
          guardianCoreClear: towerCoreSightlineClear(camera.position, guardianRescuePoint, 23.5),
          landingCoreClear: !preserveLanding ||
            towerCoreSightlineClear(camera.position, portraitAimLanding, 23.5),
        });
        if (gain > 0) {
          jointShotLastGain = gain;
          jointShotApplications = Math.min(1000000, jointShotApplications + 1);
        } else {
          camera.position.copy(jointPreviousCamera);
          lookAt.copy(jointPreviousFocus);
          camera.lookAt(lookAt); camera.updateMatrixWorld(true);
        }
      }
    }
    // During REAL guardian + close shutter crossfire the existing cinematic
    // boss camera can make the mechanically imminent trap invisible. Reuse the
    // current shutter stage's SOURCE position and nudge the same camera's gaze
    // only if the actual hazard projection improves while full-body guardian,
    // climber and visible airborne landing remain protected. No camera cut,
    // lens swap, authority/policy change or new render submission.
    crossfireAimLastGain = 0;
    if (!overview && !options.reducedMotion && !options.stale &&
      snapshot.lifecycle === 'running' && p.health > 0 &&
      actionStage?.kind === 'hazard' && sourceGuardian?.active === true &&
      sourceGuardian.health > 0 && followComposition?.guardianStaged &&
      Number.isFinite(dt) && dt > 0 && Number.isFinite(camera.aspect) &&
      camera.aspect > 0 && camera.aspect < 2 &&
      Number.isFinite(p.halfHeight) && p.halfHeight > 0 &&
      Number.isFinite(sourceGuardian.halfHeight) &&
      sourceGuardian.halfHeight > 0) {
      const liveTrap = pointFor(actionStage.x, actionStage.y,
        snapshot.chunkBaseY, snapshot.worldWidth, 27.1);
      const liveGuardian = currentGuardianDrawPoint || pointFor(sourceGuardian.x, sourceGuardian.y,
        snapshot.chunkBaseY, snapshot.worldWidth, 27.15);
      crossfireHazardPoint.set(liveTrap.x, liveTrap.y, liveTrap.z);
      crossfireGuardianPoint.set(liveGuardian.x, liveGuardian.y, liveGuardian.z);
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      camera.lookAt(lookAt);
      camera.updateMatrixWorld(true);
      measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
        camera, crossfireTop, crossfireBottom, crossfireActorBefore);
      measureDuelBodyNdc(crossfireGuardianPoint, sourceGuardian.halfHeight / SCALE,
        camera, crossfireTop, crossfireBottom, crossfireGuardianBefore);
      crossfireHazardProjection.copy(crossfireHazardPoint).project(camera);
      crossfireHazardBefore[0] = crossfireHazardProjection.x;
      crossfireHazardBefore[1] = crossfireHazardProjection.y;
      crossfireHazardBefore[2] = crossfireHazardProjection.z;
      let keepLanding = false;
      if (p.state === 'airborne' && targetPlatform &&
        [targetPlatform.y, targetPlatform.height,
          snapshot.worldWidth].every(Number.isFinite)) {
        const approach = pointFor(observedSourceLandingX(snapshot,targetPlatform),
          targetPlatform.y + targetPlatform.height,
          snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
        crossfireLandingPoint.set(approach.x,approach.y,approach.z);
        crossfireLandingProjection.copy(crossfireLandingPoint).project(camera);
        crossfireLandingBefore[0] = crossfireLandingProjection.x;
        crossfireLandingBefore[1] = crossfireLandingProjection.y;
        crossfireLandingBefore[2] = crossfireLandingProjection.z;
        // Only an already-visible destination needs active protection.
        keepLanding = crossfireLandingBefore.every(Number.isFinite) &&
          Math.abs(crossfireLandingBefore[0]) < .88 &&
          Math.abs(crossfireLandingBefore[1]) < .83 &&
          crossfireLandingBefore[2] >= -1 && crossfireLandingBefore[2] <= 1;
      }
      const hX = crossfireHazardBefore[0], hY = crossfireHazardBefore[1];
      if (Number.isFinite(hX) && Number.isFinite(hY) &&
        Math.max(Math.abs(hX)/.67,Math.abs(hY)/.73)>1.035 &&
        crossfireHazardBefore[2]>=-1 && crossfireHazardBefore[2]<=1 &&
        towerCoreSightlineClear(camera.position,crossfireHazardPoint,23.5)) {
        const m = camera.matrixWorld.elements;
        const dx = crossfireHazardPoint.x-camera.position.x;
        const dy = crossfireHazardPoint.y-camera.position.y;
        const dz = crossfireHazardPoint.z-camera.position.z;
        const depth = -(dx*m[8]+dy*m[9]+dz*m[10]);
        const tangent = Math.tan(camera.fov * Math.PI / 360);
        if (depth > 1 && Number.isFinite(depth) &&
          tangent > 0 && Number.isFinite(tangent)) {
          crossfirePreviousFocus.copy(lookAt);
          const response = Math.min(.21,1-Math.exp(-Math.min(.06,dt)*5));
          const sx = clamp(hX-clamp(hX,-.63,.63),-1,1) *
            depth * tangent * camera.aspect * response;
          const sy = clamp(hY-clamp(hY,-.69,.69),-1,1) *
            depth * tangent * response;
          lookAt.x += m[0]*sx + m[4]*sy;
          lookAt.y += m[1]*sx + m[5]*sy;
          lookAt.z += m[2]*sx + m[6]*sy;
          camera.lookAt(lookAt); camera.updateMatrixWorld(true);
          measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
            camera, crossfireTop, crossfireBottom, crossfireActorAfter);
          measureDuelBodyNdc(crossfireGuardianPoint, sourceGuardian.halfHeight / SCALE,
            camera, crossfireTop, crossfireBottom, crossfireGuardianAfter);
          crossfireHazardProjection.copy(crossfireHazardPoint).project(camera);
          crossfireHazardAfter[0] = crossfireHazardProjection.x;
          crossfireHazardAfter[1] = crossfireHazardProjection.y;
          crossfireHazardAfter[2] = crossfireHazardProjection.z;
          if (keepLanding) {
            crossfireLandingProjection.copy(crossfireLandingPoint).project(camera);
            crossfireLandingAfter[0] = crossfireLandingProjection.x;
            crossfireLandingAfter[1] = crossfireLandingProjection.y;
            crossfireLandingAfter[2] = crossfireLandingProjection.z;
          }
          const gain = guardedCrossfireAimGain({
            aspect:camera.aspect,actorBefore:crossfireActorBefore,
            actorAfter:crossfireActorAfter,
            guardianBefore:crossfireGuardianBefore,
            guardianAfter:crossfireGuardianAfter,
            hazardBefore:crossfireHazardBefore,
            hazardAfter:crossfireHazardAfter,
            landingBefore:keepLanding?crossfireLandingBefore:null,
            landingAfter:keepLanding?crossfireLandingAfter:null,
            actorCoreClear:towerCoreSightlineClear(camera.position,actorFramePoint,23.5),
            guardianCoreClear:towerCoreSightlineClear(camera.position,crossfireGuardianPoint,23.5),
            hazardCoreClear:towerCoreSightlineClear(camera.position,crossfireHazardPoint,23.5),
            landingCoreClear:!keepLanding ||
              towerCoreSightlineClear(camera.position,crossfireLandingPoint,23.5),
          });
          if (gain > 0) {
            crossfireAimLastGain = gain;
            crossfireAimApplications = Math.min(1000000,crossfireAimApplications+1);
          } else {
            lookAt.copy(crossfirePreviousFocus);
            camera.lookAt(lookAt);camera.updateMatrixWorld(true);
          }
        }
      }
    }
    // The earned inner bronze doorway must be readable at the REAL cap
    // for desktop and portrait alike. Earlier source-pinned 960x600 and
    // 390x844 film often showed a guardian victory with no legible walkable
    // gateway. Escort only this actual source-unlocked threshold; the full
    // climber and both real tower-core sightlines retain an absolute veto.
    // No invented victory, camera cut, authoritative motion or new draw call.
    earnedGatewayEscortLastGain = 0;
    const earnedStage = !overview && !options.stale &&
      (!!liveExit || !!sourceGroundedHandoffShot || !!sourceAirborneHandoffShot)
      ? passage.diagnostics() : null;
    const gatewayEarned = !!earnedStage?.active &&
      ((earnedStage.stage === 'earned-open' && !!liveExit) ||
       (earnedStage.stage === 'handoff' &&
         (!!sourceGroundedHandoffShot || !!sourceAirborneHandoffShot))) &&
      earnedStage.runToken === snapshot.runToken &&
      earnedStage.floor === snapshot.floor &&
      Array.isArray(earnedStage.focusPosition) &&
      earnedStage.focusPosition.length === 3 &&
      earnedStage.focusPosition.every(Number.isFinite);
    if (gatewayEarned) earnedGatewayFocus.set(...earnedStage.focusPosition);
    if (gatewayEarned && !options.reducedMotion &&
        options.camera === 'follow' &&
        (p.state === 'standing' || !!sourceAirborneWalk?.realAirborneCap ||
          !!sourceAirborneHandoffShot?.airborneHandoff) &&
        camera.aspect > 0 && camera.aspect < 2.5 &&
        Number.isFinite(dt) && dt > 0 && zoom <= 1.1 &&
        (arrivalFraming > .16 || sourceWalkProgress > .24 ||
          (sourceAirborneWalk?.approach ?? 0) > .16 ||
          groundedHandoffEscort > .04 || airborneHandoffEscort > .04)) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      camera.lookAt(lookAt); camera.updateMatrixWorld(true);
      earnedGatewayProjection.copy(earnedGatewayFocus).project(camera);
      earnedGatewayBefore[0] = earnedGatewayProjection.x;
      earnedGatewayBefore[1] = earnedGatewayProjection.y;
      earnedGatewayBefore[2] = earnedGatewayProjection.z;
      const sourceError = gatewayScreenError(earnedGatewayBefore);
      if (Number.isFinite(sourceError) && sourceError > .05 &&
          towerCoreSightlineClear(camera.position, earnedGatewayFocus, 23.5)) {
        const matrix = camera.matrixWorld.elements;
        const dx = earnedGatewayFocus.x - camera.position.x;
        const dy = earnedGatewayFocus.y - camera.position.y;
        const dz = earnedGatewayFocus.z - camera.position.z;
        const depth = -(dx * matrix[8] + dy * matrix[9] + dz * matrix[10]);
        const tangent = Math.tan(camera.fov * Math.PI / 360);
        if (Number.isFinite(depth) && depth > 1 &&
            Number.isFinite(tangent) && tangent > 0) {
          measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
            camera, duelTop, duelBottom, earnedGatewayActorBefore);
          earnedGatewayPreviousFocus.copy(lookAt);
          // Desktop has a wider action corridor and needs less correction;
          // portrait keeps the proven safe body-first correction budget.
          const response = earnedGatewayEscortResponse(camera.aspect, dt);
          const sx = clamp(earnedGatewayBefore[0] -
              clamp(earnedGatewayBefore[0], -.66, .66), -1.25, 1.25) *
            depth * tangent * camera.aspect * response;
          const sy = clamp(earnedGatewayBefore[1] -
              clamp(earnedGatewayBefore[1], -.68, .68), -1, 1) *
            depth * tangent * response;
          lookAt.x += matrix[0] * sx + matrix[4] * sy;
          lookAt.y += matrix[1] * sx + matrix[5] * sy;
          lookAt.z += matrix[2] * sx + matrix[6] * sy;
          camera.lookAt(lookAt); camera.updateMatrixWorld(true);
          earnedGatewayProjection.copy(earnedGatewayFocus).project(camera);
          earnedGatewayAfter[0] = earnedGatewayProjection.x;
          earnedGatewayAfter[1] = earnedGatewayProjection.y;
          earnedGatewayAfter[2] = earnedGatewayProjection.z;
          measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
            camera, duelTop, duelBottom, earnedGatewayActorAfter);
          const gain = acceptEarnedGatewayEscort({
            gateBefore: earnedGatewayBefore, gateAfter: earnedGatewayAfter,
            actorBefore: earnedGatewayActorBefore,
            actorAfter: earnedGatewayActorAfter,
            actorCoreClear: towerCoreSightlineClear(camera.position,
              actorFramePoint, 23.5),
            gatewayCoreClear: towerCoreSightlineClear(camera.position,
              earnedGatewayFocus, 23.5),
          });
          if (gain > 0) {
            earnedGatewayEscortLastGain = gain;
            earnedGatewayEscortApplications = Math.min(1000000,
              earnedGatewayEscortApplications + 1);
          } else {
            lookAt.copy(earnedGatewayPreviousFocus);
            camera.lookAt(lookAt); camera.updateMatrixWorld(true);
          }
        }
      }
    }
    // Last submitted-camera guard: downstream combat, impact and gateway
    // escorts could still pull the physical camera into the guardian's
    // articulated bronze forearms. Separate radially on the tower EXTERIOR,
    // at a bounded distance per render, with BOTH real body envelopes, the
    // tower core and the current airborne landing revalidated. Roll back the
    // proposed camera if ANY safety requirement fails; no jump cut, hiding,
    // invented animation pose, extra pass or simulation authority.
    guardianStandoffFrameLift = 0;
    if (protectLivingGuardian) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      const frameStandoff = guardianExteriorPortraitStandoff(
        camera.position, currentGuardianDrawPoint, actorFramePoint,
        sourceGuardian.halfHeight / SCALE, camera.aspect,
        Math.min(1.1, Math.max(.10, dt * 13)));
      if (frameStandoff) {
        guardianStandoffPreviousCamera.copy(camera.position);
        camera.position.set(frameStandoff.x, frameStandoff.y, frameStandoff.z);
        camera.lookAt(lookAt);
        camera.updateMatrixWorld(true);
        measureDuelBodyNdc(actorFramePoint, p.halfHeight / SCALE,
          camera, duelTop, duelBottom, guardianStandoffHeroNdc);
        measureDuelBodyNdc(currentGuardianDrawPoint,
          sourceGuardian.halfHeight / SCALE, camera, duelTop, duelBottom,
          guardianStandoffBossNdc);
        const h = guardianStandoffHeroNdc, g = guardianStandoffBossNdc;
        let safe = towerCoreSightlineClear(camera.position, actorFramePoint, 23.5) &&
          towerCoreSightlineClear(camera.position, currentGuardianDrawPoint, 23.5) &&
          h.every(Number.isFinite) && g.every(Number.isFinite) &&
          h[2] >= -1 && h[2] <= 1 && g[2] >= -1 && g[2] <= 1 &&
          Math.abs(h[0]) + h[3] * .14 < .78 &&
          Math.abs(h[1]) + h[3] < .78 &&
          Math.abs(g[0]) + g[3] * .14 < .84 &&
          Math.abs(g[1]) + g[3] < .80 &&
          h[3] >= .065;
        if (safe && airborneDuelLanding) {
          portraitAimLandingProjection.copy(portraitAimLanding).project(camera);
          safe = portraitAimLandingProjection.z >= -1 &&
            portraitAimLandingProjection.z <= 1 &&
            Math.abs(portraitAimLandingProjection.x) < .78 &&
            Math.abs(portraitAimLandingProjection.y) < .76;
        }
        if (safe) {
          guardianStandoffFrameLift = frameStandoff.step;
          guardianStandoffApplications = Math.min(1000000,
            guardianStandoffApplications + 1);
        } else {
          camera.position.copy(guardianStandoffPreviousCamera);
          camera.lookAt(lookAt);
          camera.updateMatrixWorld(true);
        }
      }
    }
    // The final real guardian camera can still abruptly flip between valid
    // exterior shoulders after several source-first emergency rescues. An
    // original normal-speed 390x844 guardian recording at SHA 653fa1c6
    // showed an almost 100-degree change over ~one source second. The duel
    // comfort budget above applies BEFORE those late corrections; protect the
    // actual submitted-frame continuity here instead, without suppressing
    // an urgent rescue or taking control of source movement.
    guardianOrbitLastStep = 0;
    const previousGuardianSubmitted = protectLivingGuardian &&
      lastSubmittedGuardian.runToken === snapshot.runToken &&
      lastSubmittedGuardian.floor === snapshot.floor &&
      snapshot.tick >= lastSubmittedGuardian.tick;
    const boundedSubmittedView = previousGuardianSubmitted
      ? boundedObservedGuardianOrbit(lastSubmittedGuardianCamera,
        camera.position, dt, camera.aspect) : null;
    if (boundedSubmittedView) {
      guardianOrbitPreviousCamera.copy(camera.position);
      guardianOrbitPreviousFocus.copy(lookAt);
      const boundedGaze = boundedObservedGuardianOrbit(
        lastSubmittedGuardianFocus, lookAt, dt, camera.aspect, 1.05, 23.5);
      camera.position.set(boundedSubmittedView.x,
        boundedSubmittedView.y, boundedSubmittedView.z);
      if (boundedGaze) lookAt.set(boundedGaze.x,boundedGaze.y,boundedGaze.z);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld(true);
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      measureDuelBodyNdc(actorFramePoint,p.halfHeight/SCALE,
        camera,duelTop,duelBottom,guardianOrbitHeroNdc);
      measureDuelBodyNdc(currentGuardianDrawPoint,
        sourceGuardian.halfHeight/SCALE,camera,duelTop,duelBottom,
        guardianOrbitBossNdc);
      const h = guardianOrbitHeroNdc, g = guardianOrbitBossNdc;
      let safe = h.every(Number.isFinite) && g.every(Number.isFinite) &&
        h[2] >= -1 && h[2] <= 1 && g[2] >= -1 && g[2] <= 1 &&
        Math.abs(h[0])+h[3]*.14 < .78 &&
        Math.abs(h[1])+h[3] < .78 &&
        Math.abs(g[0])+g[3]*.14 < .84 &&
        Math.abs(g[1])+g[3] < .80 &&
        h[3] >= .065 &&
        towerCoreSightlineClear(camera.position,actorFramePoint,23.5) &&
        towerCoreSightlineClear(camera.position,currentGuardianDrawPoint,23.5);
      if (safe && airborneDuelLanding) {
        portraitAimLandingProjection.copy(portraitAimLanding).project(camera);
        safe = portraitAimLandingProjection.z >= -1 &&
          portraitAimLandingProjection.z <= 1 &&
          Math.abs(portraitAimLandingProjection.x) < .78 &&
          Math.abs(portraitAimLandingProjection.y) < .76 &&
          towerCoreSightlineClear(camera.position,portraitAimLanding,23.5);
      }
      if (safe) {
        guardianOrbitLastStep = boundedSubmittedView.angularStep;
        guardianOrbitCappedFrames = Math.min(1000000,guardianOrbitCappedFrames+1);
      } else {
        // The live hero, attack, actual landing and core ALWAYS take priority.
        guardianOrbitVetoedFrames = Math.min(1000000,guardianOrbitVetoedFrames+1);
        camera.position.copy(guardianOrbitPreviousCamera);
        lookAt.copy(guardianOrbitPreviousFocus);
      }
    }
    // Original 390x844 source-pinned guardian footage around 16-24s shows
    // genuine opaque gallery posts between the living hero and boss. Existing
    // core-radius tests cannot detect a load-bearing rib or a bronze doorway.
    // Measure actual scene triangles at a throttled rate, choose an exterior
    // shoulder only if it IMPROVES the real hero and boss ray obstruction,
    // then move through a bounded arc with the source actor/landing protected.
    // Do not alter spectator input, reduced-motion, authority or gameplay.
    guardianWorldLastGain = 0;
    const worldRayActive = protectLivingGuardian &&
      options.camera === 'follow' && Math.abs(orbit) < .025 &&
      snapshot.lifecycle === 'running' && sourceGuardian?.active === true &&
      sourceGuardian.health > 0 && snapshot.floor === 8;
    const worldRayEpisode=worldRayActive ? snapshot.runToken + ':' + snapshot.floor : null;
    if (!worldRayActive || worldRayEpisode !== guardianWorldLastEpisode) {
      guardianWorldTargetAngle=null;
      guardianWorldLastTick=-Infinity;
      guardianWorldLastRayObstructed=true;
      guardianWorldLastEpisode=worldRayEpisode;
    }
    if (worldRayActive) {
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y += p.halfHeight / SCALE;
      worldGuardianLanding=airborneDuelLanding ? portraitAimLanding : null;
      const halfHero=p.halfHeight/SCALE;
      const halfBoss=sourceGuardian.halfHeight/SCALE;
      const radius=Math.hypot(camera.position.x,camera.position.z);
      const currentAngle=Math.atan2(camera.position.x,camera.position.z);
      // Ray observations require current actual world matrices. Decorative
      // transparency is excluded; real opaque foreground architecture counts.
      if (snapshot.tick >= guardianWorldLastTick + 10 && radius>25) {
        guardianWorldLastTick=snapshot.tick;
        guardianWorldOcclusionSamples=Math.min(1000000,guardianWorldOcclusionSamples+1);
        scene.updateMatrixWorld(true);
        const inspect=pos=>{
          guardianWorldProbePosition=pos;
          return weightedGuardianWorldOcclusion(raycastGuardianWorldOcclusion,
            actorFramePoint,currentGuardianDrawPoint,halfHero,halfBoss);
        };
        const baseWorldRay=inspect(camera.position);
        guardianWorldLastRayObstructed=baseWorldRay === null ||
          baseWorldRay.weighted > 0;
        const safeShoulder=angle=>{
          candidateWorldPos.set(Math.sin(angle)*radius,
            camera.position.y,Math.cos(angle)*radius);
          if (!towerCoreSightlineClear(candidateWorldPos,actorFramePoint,23.5) ||
              !towerCoreSightlineClear(candidateWorldPos,currentGuardianDrawPoint,23.5) ||
              (worldGuardianLanding &&
                !towerCoreSightlineClear(candidateWorldPos,worldGuardianLanding,23.5)))
            return null;
          previousWorldPos.copy(camera.position);
          camera.position.copy(candidateWorldPos);
          camera.lookAt(lookAt);
          camera.updateMatrixWorld(true);
          measureDuelBodyNdc(actorFramePoint,halfHero,
            camera,duelTop,duelBottom,guardianOrbitHeroNdc);
          measureDuelBodyNdc(currentGuardianDrawPoint,halfBoss,
            camera,duelTop,duelBottom,guardianOrbitBossNdc);
          const h=guardianOrbitHeroNdc,g=guardianOrbitBossNdc;
          let safe=h.every(Number.isFinite)&&g.every(Number.isFinite)&&
            h[2]>=-1&&h[2]<=1&&g[2]>=-1&&g[2]<=1&&
            Math.abs(h[0])+h[3]*.14<.76&&Math.abs(h[1])+h[3]<.77&&
            Math.abs(g[0])+g[3]*.14<.82&&Math.abs(g[1])+g[3]<.79&&
            h[3]>=.065;
          if (safe && worldGuardianLanding) {
            portraitAimLandingProjection.copy(worldGuardianLanding).project(camera);
            safe=portraitAimLandingProjection.z>=-1&&
              portraitAimLandingProjection.z<=1&&
              Math.abs(portraitAimLandingProjection.x)<.77&&
              Math.abs(portraitAimLandingProjection.y)<.75;
          }
          camera.position.copy(previousWorldPos);
          camera.lookAt(lookAt);
          camera.updateMatrixWorld(true);
          return safe?inspect(candidateWorldPos):null;
        };
        const left=safeShoulder(currentAngle-.24);
        const right=safeShoulder(currentAngle+.24);
        const better=selectGuardianWorldShoulder(baseWorldRay,left,right);
        if (better) {
          guardianWorldTargetAngle=currentAngle+better.direction*.24;
          guardianWorldLastGain=better.gain;
        } else guardianWorldTargetAngle=null;
      }
      if (guardianWorldTargetAngle !== null) {
        const nextAngle=boundedGuardianWorldAngle(currentAngle,guardianWorldTargetAngle,dt);
        if (nextAngle!==null) {
          candidateWorldPos.set(Math.sin(nextAngle)*radius,
            camera.position.y,Math.cos(nextAngle)*radius);
          previousWorldPos.copy(camera.position);
          camera.position.copy(candidateWorldPos);
          camera.lookAt(lookAt);
          camera.updateMatrixWorld(true);
          measureDuelBodyNdc(actorFramePoint,halfHero,
            camera,duelTop,duelBottom,guardianOrbitHeroNdc);
          measureDuelBodyNdc(currentGuardianDrawPoint,halfBoss,
            camera,duelTop,duelBottom,guardianOrbitBossNdc);
          const h=guardianOrbitHeroNdc,g=guardianOrbitBossNdc;
          let safe=h.every(Number.isFinite)&&g.every(Number.isFinite)&&
            h[2]>=-1&&h[2]<=1&&g[2]>=-1&&g[2]<=1&&
            Math.abs(h[0])+h[3]*.14<.78&&Math.abs(h[1])+h[3]<.78&&
            Math.abs(g[0])+g[3]*.14<.84&&Math.abs(g[1])+g[3]<.80&&
            h[3]>=.065&&
            towerCoreSightlineClear(candidateWorldPos,actorFramePoint,23.5)&&
            towerCoreSightlineClear(candidateWorldPos,currentGuardianDrawPoint,23.5);
          if (safe && worldGuardianLanding) {
            portraitAimLandingProjection.copy(worldGuardianLanding).project(camera);
            safe=portraitAimLandingProjection.z>=-1&&
              portraitAimLandingProjection.z<=1&&
              Math.abs(portraitAimLandingProjection.x)<.78&&
              Math.abs(portraitAimLandingProjection.y)<.76&&
              towerCoreSightlineClear(candidateWorldPos,worldGuardianLanding,23.5);
          }
          if (safe) {
            guardianWorldOcclusionImprovements=Math.min(1000000,
              guardianWorldOcclusionImprovements+1);
            if (Math.abs(Math.atan2(Math.sin(guardianWorldTargetAngle-nextAngle),
              Math.cos(guardianWorldTargetAngle-nextAngle)))<.008)
              guardianWorldTargetAngle=null;
          } else {
            camera.position.copy(previousWorldPos);
            camera.lookAt(lookAt);
            guardianWorldTargetAngle=null;
            guardianWorldOcclusionRejected=Math.min(1000000,
              guardianWorldOcclusionRejected+1);
          }
        }
      }
    }
    camera.lookAt(lookAt);
    camera.updateMatrixWorld(true);
    // Cohesive PORTRAIT ACTION OPTICS: the original 390x844, 1x guardian
    // footage alternates tiny figures with separated / vertically cropped
    // airborne climber and live boss. The previous closer-only 31-degree
    // optic cannot show both when the physical action spreads vertically.
    // From the SAME rendered full-body measurements, open toward a bounded
    // 62-degree safety lens when necessary; otherwise keep the existing
    // opt-in close two-actor shot. Source-earned gateway/landing, exterior
    // core rays and all original camera comfort checks remain mandatory.
    // A real crusher windup, still-blocked world ray, manual spectator orbit,
    // stale source or reduced-motion request vetoes the closer lens.
    // Optical zoom never advances the 20Hz simulation, moves the actor,
    // changes the ray/collision world, invents a gateway or cuts the camera.
    guardianPortraitOpticalTarget=GUARDIAN_OPTICAL_BASE_FOV;
    guardianPortraitOpticalKind='off';
    guardianPortraitOpticalSourceTick=-1;
    const opticalGuardian=protectLivingGuardian &&
      sourceGuardian?.active===true && !!currentGuardianDrawPoint;
    const opticalEarned=!opticalGuardian && gatewayEarned &&
      (sourceEarnedWalk || sourceAirborneWalk) && !!liveExit;
    // The same source-authenticated original bronze doorway remains a real
    // second subject on the first Floor9 render. Do not silently drop the
    // portrait two-subject safety optic merely because the source floor
    // advanced: the climber and old arch must fit the SAME continuous shot.
    const opticalHandoff=!opticalGuardian &&
      coldArchLens?.coldOriginalArch===true &&
      coldArchLens.sourceTick===snapshot.tick;
    const opticalAllowed=!overview && !options.stale &&
      !options.reducedMotion && options.camera==='follow' &&
      camera.aspect>.35 && camera.aspect<.85 &&
      Math.abs(orbit)<.025 && zoom<=1.03 &&
      snapshot.lifecycle==='running' &&
      ((snapshot.floor===8 && (opticalGuardian || opticalEarned)) ||
        (snapshot.floor===9 && opticalHandoff)) &&
      p.health>0 &&
      actionStage?.kind!=='hazard';
    if (opticalAllowed) {
      const partner=opticalGuardian
        ?currentGuardianDrawPoint:earnedGatewayFocus;
      const partnerHalfHeight=opticalGuardian
        ?sourceGuardian.halfHeight/SCALE:2.1;
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y+=p.halfHeight/SCALE;
      const coreClear=towerCoreSightlineClear(camera.position,
        actorFramePoint,23.5) &&
        towerCoreSightlineClear(camera.position,partner,23.5);
      measureDuelBodyNdc(actorFramePoint,p.halfHeight/SCALE,
        camera,duelTop,duelBottom,opticalActor);
      measureDuelBodyNdc(partner,partnerHalfHeight,
        camera,duelTop,duelBottom,opticalPartner);
      let landing=null;
      if (p.state==='airborne' && targetPlatform) {
        const x=observedSourceLandingX(snapshot,targetPlatform);
        const landingWorld=pointFor(x,targetPlatform.y+targetPlatform.height,
          snapshot.chunkBaseY,snapshot.worldWidth,26.7);
        portraitAimLandingProjection.copy(landingWorld).project(camera);
        opticalLandingNdc[0]=portraitAimLandingProjection.x;
        opticalLandingNdc[1]=portraitAimLandingProjection.y;
        opticalLandingNdc[2]=portraitAimLandingProjection.z;
        landing=opticalLandingNdc;
      }
      guardianPortraitOpticalTarget=observedGuardianPortraitActionFov({
        aspect:camera.aspect,currentFov:camera.fov,
        actor:opticalActor,partner:opticalPartner,landing,
        blocked:!coreClear || (opticalGuardian &&
          guardianWorldLastRayObstructed),
      });
      guardianPortraitOpticalKind=opticalGuardian?'guardian':
        opticalHandoff?'source-original-floor-nine-gateway':'earned-gateway';
      guardianPortraitOpticalSourceTick=snapshot.tick;
    }
    // A rejected or finished original shot continuously returns to the
    // 42-degree authoring lens. Never carry a wide rescue or close portrait
    // lens into a dead boss, another expedition or spectator turn. Floor9
    // keeps it only for a live, source-proven original gateway sightline.
    const opticalNext=options.reducedMotion
      ?GUARDIAN_OPTICAL_BASE_FOV
      :boundedGuardianOpticalFov(camera.fov,
        guardianPortraitOpticalTarget,dt);
    if (Math.abs(opticalNext-camera.fov)>.0001) {
      camera.fov=opticalNext;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      guardianPortraitOpticalChanges=Math.min(1000000,
        guardianPortraitOpticalChanges+1);
    }
    // POST-DIRECTOR PHYSICAL CROSSING: the ordinary follow, guardian, hero
    // rescue and portrait optical lens have already selected their positions.
    // A genuine *retained original* Floor8 bronze arch is still behind the
    // actual Floor9 body in the same world. On the real cold WebGL frame the
    // previous early focus correction could be entirely overwritten. Inspect
    // the final real projection and take a tiny, reversible exterior gaze /
    // shoulder step only if that same doorway becomes measurably more visible
    // WITHOUT losing the full hero or looking through the solid tower core.
    // No second camera, source interpolation, collider, floor or authoring
    // shortcut. This is bypassed for overview, manual orbit and reduced motion.
    physicalThresholdFrameGain = 0;
    const thresholdSteps = coldArchLens?.coldOriginalArch === true &&
      coldArchLens.sourceTick === snapshot.tick &&
      options.camera === 'follow' && !overview && !options.stale &&
      !options.reducedMotion && Math.abs(orbit) < .025 &&
      snapshot.lifecycle === 'running' && snapshot.floor === 9 && p.health > 0
        ? sourceDoorwayFrameSteps(dt,camera.aspect) : null;
    physicalThresholdFrameSourceBound = !!thresholdSteps;
    if (thresholdSteps && Array.isArray(coldArchLens.gateway)) {
      thresholdHero.copy(climber.group.position);
      thresholdHero.y += p.halfHeight / SCALE;
      thresholdGate.set(...coldArchLens.gateway);
      thresholdPreviousCamera.copy(camera.position);
      thresholdPreviousGaze.copy(lookAt);
      measureDuelBodyNdc(thresholdHero,p.halfHeight/SCALE,
        camera,duelTop,duelBottom,thresholdHeroBefore);
      measureDuelBodyNdc(thresholdGate,2.1,
        camera,duelTop,duelBottom,thresholdGateBefore);
      thresholdGaze.copy(thresholdHero).lerp(thresholdGate,.50);
      thresholdGaze.sub(thresholdPreviousGaze);
      const gazeDistance=thresholdGaze.length();
      if (gazeDistance > .0001) {
        thresholdGaze.multiplyScalar(Math.min(1,thresholdSteps.gazeMetres/gazeDistance));
        const originalAngle=Math.atan2(camera.position.x,camera.position.z);
        const radius=Math.hypot(camera.position.x,camera.position.z);
        let best=0;
        for (const shoulder of [0,-1,1]) {
          camera.position.copy(thresholdPreviousCamera);
          lookAt.copy(thresholdPreviousGaze).add(thresholdGaze);
          if (shoulder && radius>25){
            const angle=originalAngle+shoulder*thresholdSteps.orbitRadians;
            camera.position.x=Math.sin(angle)*radius;
            camera.position.z=Math.cos(angle)*radius;
          }
          if (!towerCoreSightlineClear(camera.position,thresholdHero,23.5) ||
              !towerCoreSightlineClear(camera.position,thresholdGate,23.5))
            continue;
          camera.lookAt(lookAt);
          camera.updateMatrixWorld(true);
          measureDuelBodyNdc(thresholdHero,p.halfHeight/SCALE,
            camera,duelTop,duelBottom,thresholdHeroAfter);
          measureDuelBodyNdc(thresholdGate,2.1,
            camera,duelTop,duelBottom,thresholdGateAfter);
          const gain=sourceDoorwayFrameGain(
            thresholdHeroBefore,thresholdGateBefore,
            thresholdHeroAfter,thresholdGateAfter,true,true);
          if (gain>best){
            best=gain;
            thresholdBestCamera.copy(camera.position);
            thresholdBestGaze.copy(lookAt);
          }
        }
        if (best>0){
          camera.position.copy(thresholdBestCamera);
          lookAt.copy(thresholdBestGaze);
          physicalThresholdFrameGain=best;
          physicalThresholdFrameCorrections=Math.min(1000000,
            physicalThresholdFrameCorrections+1);
        } else {
          camera.position.copy(thresholdPreviousCamera);
          lookAt.copy(thresholdPreviousGaze);
        }
        camera.lookAt(lookAt);
        camera.updateMatrixWorld(true);
      }
    }
    world.revealGuardianSightlines(camera,guardianSightPoints);
    // Foreground visibility is tested against the very same ACTUAL smoothed
    // camera submitted this frame, never the desired/planned lens. A viewer
    // must see the climber, real living boss and committed airborne landing
    // before the tower's atmospheric gears. Nothing touches gameplay state.
    const protectLiveRoute=!options.stale&&snapshot.lifecycle==='running'&&
      p.health>0&&options.camera==='follow';
    // The authenticated outcome camera previously disabled ALL decorative
    // clockwork sightline protection, including for the actual fallen climber.
    // Keep the hero and the 3D earned-floor memorial visible during both real
    // result and intermission; their present world coordinates come only from
    // the already source-gated finale group, never a simulated victory.
    const protectTerminalScene=terminalStaged && !options.stale &&
      options.camera==='follow' && !!finale.sightlineAnchor(actorOrbitTarget);
    // A real source-selected airborne destination is mandatory even when the
    // decorative landing beacon is not yet visible. The live shutter/trap
    // is a SECOND safety target, never a replacement for that landing.
    const sightlinePriorities=sourceCriticalSightlinePriorities({
      live:protectLiveRoute,
      observedLanding:!!targetPlatform &&
        (landingApproach.diagnostics().visible || airborneDuelLanding),
      observedHazard:actionStage?.kind==='hazard' &&
        [actionStage.x,actionStage.y].every(Number.isFinite),
      // A source-proven original GPU gateway is still an actual sightline
      // on the new floor; previously only the vanished old-floor exit flag
      // protected it, so opaque Floor9 scenery could bury a retained arch.
      earnedGateway:gatewayEarned || opticalHandoff,
      airborneGateway:sourceAirborneWalk?.realAirborneCap === true ||
        (opticalHandoff && p.state==='airborne' && p.grounded===false),
    });
    if(protectLiveRoute || protectTerminalScene){
      actorFramePoint.copy(climber.group.position);
      actorFramePoint.y+=p.halfHeight/SCALE;
      if(protectLiveRoute){
      if(sourceGuardian){
        const observed=currentGuardianDrawPoint || pointFor(sourceGuardian.x,sourceGuardian.y,
          snapshot.chunkBaseY,snapshot.worldWidth,27.15);
        guardianRescuePoint.copy(observed);
      }
      // Actual gate takes precedence over a distant future landing ONLY
      // during the near-roof earned airborne crossing. Crusher warnings and
      // the source-driven enemy still retain their safety priority.
      if (sightlinePriorities.arrival) {
        const landing=pointFor(observedSourceLandingX(snapshot,targetPlatform),
          targetPlatform.y+targetPlatform.height,snapshot.chunkBaseY,
          snapshot.worldWidth,26.7);
        observedLandingSightline.set(landing.x,landing.y,landing.z);
      }
      if (sightlinePriorities.gate && sourceAirborneWalk?.realAirborneCap === true) {
        // The gate camera must not erase a physical airborne landing.
        actorOrbitTarget.copy(earnedGatewayFocus);
      } else if(sightlinePriorities.arrival){
        actorOrbitTarget.copy(observedLandingSightline);
      } else if (sightlinePriorities.hazard) {
        // Only when there is no real landing, the hazard is the primary
        // destination. When there IS a landing it remains a separate ray.
        const hazard=pointFor(actionStage.x,actionStage.y,
          snapshot.chunkBaseY,snapshot.worldWidth,27.1);
        actorOrbitTarget.set(hazard.x,hazard.y,hazard.z);
      } else if (sightlinePriorities.gate) {
        // Use the EXISTING gear sightline corridor for the defeated boss's
        // real deck threshold after enemy, landing and hazard protection.
        actorOrbitTarget.copy(earnedGatewayFocus);
      }
      }
    }
    if(sightlinePriorities.hazard){
      const sourceHazard=pointFor(actionStage.x,actionStage.y,
        snapshot.chunkBaseY,snapshot.worldWidth,27.1);
      observedHazardSightline.set(sourceHazard.x,sourceHazard.y,sourceHazard.z);
    }
    world.protectRouteSightlines(camera,
      (protectLiveRoute||protectTerminalScene)?actorFramePoint:null,
      protectLiveRoute&&sourceGuardian?guardianRescuePoint:null,
      protectTerminalScene?actorOrbitTarget:
        protectLiveRoute&&sightlinePriorities.arrival?observedLandingSightline:
        protectLiveRoute&&sightlinePriorities.gate?earnedGatewayFocus:null,
      dt,options,
      (protectLiveRoute||protectTerminalScene)?p.halfHeight/SCALE:0,
      protectLiveRoute&&sourceGuardian&&Number.isFinite(sourceGuardian.halfHeight)
        ?sourceGuardian.halfHeight/SCALE:0,
      sightlinePriorities.hazard?observedHazardSightline:null,
      protectLiveRoute&&sightlinePriorities.gate&&sightlinePriorities.arrival
        ?earnedGatewayFocus:null);
    updateLandingBeacon(landingBeacon, targetPlatform, snapshot, camera);
    sky.position.copy(camera.position);
    sun.target.position.set(0, targetY, 0);
    sun.position.set(-40, targetY + 55, 52);
    // Existing shadow-free rim follows the real skinned silhouette through
    // a full exterior orbit; only true HP/windup/motion changes its soft fill.
    // No new draw, light, shadow map, overlay, or flash frequency.
    const lighting = LIGHTING[themeKey] || LIGHTING.foundry;
    // A stopped expedition gets a quiet physical lighting tableau instead of
    // combat flash or a false victory bloom. Different genuine result KINDS
    // remain distinguishable from the world, even with the HUD hidden.
    sun.intensity = lighting.key * (1 - lightCue.threat * .075) * (terminalStaged ? .78 : 1);
    hemi.intensity = lighting.ambient * (1 + lightCue.motion * .055 + liveAirflow * .04) * (terminalStaged ? .88 : 1);
    rim.intensity = lighting.rim * (1 + lightCue.armor * .18 + lightCue.threat * .2 + liveAirflow * .10) *
      (terminalStaged ? 1.08 : 1);
    const endingTint = snapshot.result?.kind === 'technical' ? interruptedRimTint :
      snapshot.result?.kind === 'operator' ? operatorRimTint : warmRimTint;
    rim.color.set(lighting.fill).lerp(endingTint, terminalStaged ? .38 : lightCue.threat * .32);
    const lightBearing = Math.atan2(camera.position.x, camera.position.z) + 1.12;
    rim.target.position.set(climber.group.position.x,
      climber.group.position.y + p.halfHeight / SCALE, climber.group.position.z);
    rim.position.set(climber.group.position.x + Math.sin(lightBearing) * 46,
      climber.group.position.y + 21,
      climber.group.position.z + Math.cos(lightBearing) * 46);
    // Direct the existing lower-cost fill toward the *actual* decision:
    // live guardian, present charging shutter, selected touchdown, or climber.
    // Soft, bounded staging provides depth/action hierarchy across climbing,
    // danger, combat and recovery, without flicker or extra GPU lights.
    const stagePose = actionStage ? pointFor(actionStage.x, actionStage.y,
      snapshot.chunkBaseY, snapshot.worldWidth, 27.1) : null;
    const nextStageX = stagePose?.x ?? 0, nextStageY = stagePose?.y ?? targetY,
      nextStageZ = stagePose?.z ?? 0;
    const stageKey = `${snapshot.runToken}:${snapshot.floor}`;
    if (actionLightRunFloor !== stageKey) {
      actionLightRunFloor = stageKey;
      actionLightTarget.set(nextStageX, nextStageY, nextStageZ);
    } else {
      const lightBlend = Math.min(.35, 1 - Math.exp(-Math.min(.08,dt) * 3.6));
      actionLightTarget.x += (nextStageX - actionLightTarget.x) * lightBlend;
      actionLightTarget.y += (nextStageY - actionLightTarget.y) * lightBlend;
      actionLightTarget.z += (nextStageZ - actionLightTarget.z) * lightBlend;
    }
    actionLightKind = actionStage?.kind || 'none';
    actionLightSourceTick = actionStage?.sourceTick ?? -1;
    bounce.color.set(lighting.bounce);
    if (actionLightKind === 'hazard') bounce.color.lerp(actionHazardTint, .46);
    else if (actionLightKind === 'guardian') bounce.color.lerp(actionGuardianTint, .4);
    else if (actionLightKind === 'earned-gate') bounce.color.lerp(actionGateTint, .32);
    else if (actionLightKind === 'landing') bounce.color.lerp(actionLandingTint, .18);
    bounce.intensity = lighting.ground * (1 + lightCue.threat * .1 +
      (actionLightKind === 'hazard' ? .22 : actionLightKind === 'guardian' ? .2 :
       actionLightKind === 'earned-gate' ? .16 : 0));
    bounce.target.position.copy(actionLightTarget);
    const lightAzimuth = Math.atan2(camera.position.x,camera.position.z) + .48;
    bounce.position.set(actionLightTarget.x + Math.sin(lightAzimuth) * 34,
      actionLightTarget.y + 16,
      actionLightTarget.z + Math.cos(lightAzimuth) * 34);
    // Source and actual submitted-gateway time jointly own the cold
    // Clockwork->Astral arrival. The geometry and simulation have already
    // reached Floor9; only the environmental horizon/lighting acclimatizes.
    // Before the first renderer return, keep the prior warm horizon; then
    // transition ALL environmental channels together with the grounded arch.
    // Do not overwrite physical dangers, hero/boss lighting, or user camera.
    const thresholdLight=observedGroundedBiomeThreshold(snapshot,passage.diagnostics(),options,
      world.retainedFilmHandoff?.(snapshot) ?? null);
    const oldWeight=thresholdLight?.oldWeight ?? 0;
    if(thresholdLight || lastBiomeHandoffOldWeight>0){
      const from=thresholdColors.from,to=thresholdColors.to;
      scene.fog.color.copy(to.fog).lerp(from.fog,oldWeight);
      skyMaterial.uniforms.top.value.copy(to.top).lerp(from.top,oldWeight);
      skyMaterial.uniforms.horizon.value.copy(to.horizon).lerp(from.horizon,oldWeight);
      skyMaterial.uniforms.bottom.value.copy(to.bottom).lerp(from.bottom,oldWeight);
      hemi.color.copy(to.hemi).lerp(from.hemi,oldWeight);
      hemi.groundColor.copy(to.hemiGround).lerp(from.hemiGround,oldWeight);
      sun.color.copy(to.sun).lerp(from.sun,oldWeight);
      sun.intensity *= 1+(LIGHTING.clockwork.key/LIGHTING.void.key-1)*oldWeight;
      hemi.intensity *= 1+(LIGHTING.clockwork.ambient/LIGHTING.void.ambient-1)*oldWeight;
      rim.intensity *= 1+(LIGHTING.clockwork.rim/LIGHTING.void.rim-1)*oldWeight;
      // The rim and lower fill keep their genuine strike/hazard tint, while
      // their shared biome base moves from warm to violet without a flash.
      rim.color.lerp(from.rim,oldWeight);
      bounce.color.lerp(from.bounce,oldWeight);
      bounce.intensity *= 1+(LIGHTING.clockwork.ground/LIGHTING.void.ground-1)*oldWeight;
      renderer.toneMappingExposure=LIGHTING.void.exposure+
        (LIGHTING.clockwork.exposure-LIGHTING.void.exposure)*oldWeight;
      scene.environmentIntensity=LIGHTING.void.reflection+
        (LIGHTING.clockwork.reflection-LIGHTING.void.reflection)*oldWeight;
    }
    lastBiomeHandoffOldWeight=oldWeight;
  }

  function clearTowerRenderFault() {
    renderErrors = 0;
    renderFaultState = 'live';
    renderFaultRetryAt = 0;
    renderRecoveryAttempts = 0;
    lastTime = 0;
  }
  function animate(now) {
    if (disposed) return;
    frameHandle = requestAnimationFrame(animate);
    const deltaMs = lastTime ? now - lastTime : 16.67;
    lastTime = now;
    if (contextLost || !snapshot || renderFaultState === 'failed') return;
    if (renderFaultState === 'retrying' &&
        !towerRenderRetryReady(renderFaultState, renderFaultRetryAt, now)) return;
    const dt = clamp(deltaMs / 1000, .001, .5);
    const motionDt = options.stale ? 0 : dt;
    try {
      // Recover the existing 3D renderer state WITHOUT creating another
      // authoritative run, resetting replay, or simulating any missing ticks.
      // Do not rebuild/dispose the world on a JavaScript exception: that path
      // belongs to an actual webglcontextlost event.
      if (renderFaultState === 'retrying') {
        renderer.resetState();
        resolutionDirty = true;
        lastTime = 0;
        renderFaultState = 'live';
      }
      elapsed += motionDt;
      if (resolutionDirty) { resize(); resolutionDirty = false; }
      // The source-to-native-film gate has measured 0.9–1.14s from browser
      // acceptance to returned Three.js submission on real Floor 9 arrivals.
      // Split the actual first frame at the CPU scene-build / WebGL-return
      // boundary, instead of guessing that HTTP, camera or GPU is responsible.
      const submissionStart = performance.now();
      update(motionDt);
      // The genuine Floor8->9 guardian exit is already verified by the live
      // passage owner. A cold THREE framebuffer can now be bounded *before*
      // the expensive first post-doorway render, not after an HTTP receipt.
      // Change the low-tier canvas ONLY, never the authoritative snapshot.
      const nextColdScale = coldFloorPolicy.observe(snapshot,passage.diagnostics(),
        {stale:options.stale,camera:options.camera,quality:options.quality,reducedMotion:options.reducedMotion});
      if (nextColdScale !== coldFloorScale) {
        coldFloorScale = nextColdScale;
        resize();
      }
      const sceneReadyAt = performance.now();
      renderer.render(scene, camera);
      const rendererReturnedAt = performance.now();
      // Only a genuinely submitted frame establishes the NEXT frame's
      // reference. Failed WebGL, stale snapshots, floor changes or run
      // restarts cannot reuse a previous guardian's lens.
      if (!options.stale && snapshot?.lifecycle === 'running') {
        lastSubmittedGuardianCamera.copy(camera.position);
        lastSubmittedGuardianFocus.copy(lookAt);
        lastSubmittedGuardian.runToken = snapshot.runToken;
        lastSubmittedGuardian.floor = snapshot.floor;
        lastSubmittedGuardian.tick = snapshot.tick;
      } else {
        lastSubmittedGuardian.runToken = null;
        lastSubmittedGuardian.floor = null;
        lastSubmittedGuardian.tick = -1;
      }
      if (resolutionPolicy.record(performance.now() - submissionStart,
        document.visibilityState === 'visible' && !options.stale, deltaMs)) resolutionDirty = true;
      // Count a contact frame only after Three has submitted it. Delayed
      // software rendering must not consume an unseen cue on elapsed time.
      for (const entry of enemies.values()) {
        if (entry.impact.visible && entry.impactFramesRemaining > 0) entry.impactFramesRemaining--;
      }
      // First-frame budget advances only on returned real Three.js work.
      // A stalled, failed or unsubmitted scene cannot consume presentation.
      // The following frame's observe() changes scale and calls resize once.
      // Do not eagerly resize again before that observation (two GPU reallocations).
      coldFloorPolicy.submitted(snapshot);
      // Deferred original distant architecture may appear only AFTER the
      // first source-authentic new-floor 3D submission actually returned.
      // Only the successfully returned original render owns the old/new
      // world presentation clock; source packets and stalled RAFs do not.
      world.noteFrameSubmitted?.(snapshot,options,dt);
      // The source-earned physical gateway is timed from an actual returned
      // Three.js submission, not from a browser receipt or stalled render.
      // Its owned run/floor/tick gate rejects stale and interrupted attempts.
      passage.noteFrameSubmitted?.(snapshot,options);
      const coldWorld = world.lastRebuild?.();
      // Only an EXACT current-source rebuild may attribute its own cost;
      // older floor, run, quality or later animation cannot borrow a witness.
      const coldWorldMs = coldWorld?.runToken === snapshot.runToken &&
        coldWorld?.floor === snapshot.floor &&
        coldWorld?.sourceTick === snapshot.tick &&
        coldWorld?.key === `${snapshot.runToken}:${snapshot.floor}:${snapshot.theme}:${options.quality}`
        ? coldWorld.cpuBuildMs : null;
      renderProgress.submitted(snapshot, rendererReturnedAt, Date.now(), {
        sceneUpdateMs: sceneReadyAt - submissionStart,
        rendererReturnMs: rendererReturnedAt - sceneReadyAt,
        worldRebuildMs: coldWorldMs,
        totalSubmissionMs: rendererReturnedAt - submissionStart,
      });
      // The callback owns UI-only phase coherence: never let an HTML failure
      // convert a genuinely submitted 3D frame into a fake renderer failure.
      try { options.onSubmittedFrame?.(snapshot); }
      catch (error) { console.error('Tower visible HUD phase commit failed:', error); }
      // Only a genuinely completed source frame clears a transient failure
      // streak. A fresh source tick alone cannot certify a graphics recovery.
      if (renderErrors || renderRecoveryAttempts) {
        options.onStatus?.('3D view restored · expedition continues', 'online');
      }
      renderErrors = 0;
      renderRecoveryAttempts = 0;
      renderFaultRetryAt = 0;
      renderFaultState = 'live';
    } catch (error) {
      coldFloorPolicy.reset();coldFloorScale = 1;resolutionDirty = true;
      renderErrors++;
      renderFaultCount++;
      if (renderErrors === 1) console.error('Tower renderer:', error);
      const decision = towerRenderFaultDecision(renderErrors, renderRecoveryAttempts, now);
      renderFaultState = decision.state;
      renderRecoveryAttempts = decision.attempts;
      renderFaultRetryAt = decision.retryAt ?? 0;
      options.onStatus?.(renderFaultState === 'failed'
        ? '3D graphics stopped · switch graphics quality or reload'
        : '3D view recovering · expedition continues',
        renderFaultState === 'failed' ? 'error' : 'degraded');
    }
  }
  const lost = event => {
    event.preventDefault(); contextLost = true;
    coldFloorPolicy.reset(); coldFloorScale = 1;
    resolutionPolicy.clearPacing();
    clearTowerRenderFault();
    options.onStatus?.('Graphics interrupted · ascent continues', 'recovering');
    rebuildGraphicsResources();
  };
  const restored = () => {
    contextLost = false;
    coldFloorPolicy.reset(); coldFloorScale = 1;
    clearTowerRenderFault();
    renderProgress.reset(performance.now());
    resolutionPolicy.reset(); resolutionDirty = false;
    resize(); options.onStatus?.('Preparing the 3D view', 'recovering');
  };
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  frameHandle = requestAnimationFrame(animate);

  let pointerX = null;
  const pointerDown = event => { pointerX = event.clientX; canvas.setPointerCapture?.(event.pointerId); };
  const pointerMove = event => { if (pointerX === null) return; orbit = clamp(orbit + (pointerX - event.clientX) * .003, -.5, .5); pointerX = event.clientX; };
  const pointerUp = () => { pointerX = null; };
  const wheel = event => { event.preventDefault(); zoom = clamp(zoom + event.deltaY * .0005, options.camera === 'overview' ? .7 : .8, 1.35); };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.title = 'Drag to look around. Scroll to zoom. Camera buttons reset the view.';
  function setCamera(mode) { if (['follow', 'overview'].includes(mode)) { options.camera = mode; orbit = 0; zoom = 1; authenticRestartSweep = null; } }
  function setMotion(reduced) { options.reducedMotion = !!reduced; }
  function setStale(stale) { options.stale = !!stale; }
  function setQuality(quality) {
    const nextQuality = quality === 'low' ? 'low' : 'high';
    if (options.quality !== nextQuality) {
      options.quality = nextQuality;
      // Explicit tier switching is a user-controlled escape from a terminal
      // view-only fault; the authoritative simulation is not restarted.
      clearTowerRenderFault();
      renderProgress.reset(performance.now());
      resolutionPolicy.reset(); resolutionDirty = false;
      coldFloorPolicy.reset(); coldFloorScale = 1;
      reflectionDirty = true;
      reflectionFirstFrame = true;
    }
    renderer.shadowMap.enabled = options.quality === 'high';
    renderer.shadowMap.needsUpdate = true;
    resize();
  }
  // P0 source-authentic guardian film: the visible 390x844 giant wheel at
  // 15.2s was NOT identified by the four registered decorative clock/rack
  // AABBs (each recorded zero screen coverage). Never guess and move another
  // gameplay-adjacent mesh. During explicitly opted-in evidence capture ONLY,
  // raycast real submitted Three objects at four fixed portrait film samples.
  // These are mesh/triangle witnesses, NOT proof of final composited pixels.
  const ownerAuditRay = new THREE.Raycaster();
  const ownerAuditNdc = new THREE.Vector2();
  const ownerAuditHits = [];
  let ownerAuditLastRun = '', ownerAuditLastTick = -Infinity;
  // Diagnostics is consumed by the live app on every 20Hz host poll.
  // Retain the last eight real camera ray witnesses for the independent
  // 1Hz recorder; otherwise the application's poll silently eats them.
  const ownerAuditRetained = [];
  let ownerAuditEpisode = '';
  function observedCameraMeshOwners() {
    if (typeof window === 'undefined' || window.__TOWER_MESH_OWNER_AUDIT__ !== true ||
        !snapshot || snapshot.floor !== 8 ||
        snapshot.lifecycle !== 'running' || options.stale ||
        !snapshot.player || snapshot.player.health <= 0 ||
        !Number.isSafeInteger(snapshot.tick) || camera.aspect >= .85) {
      ownerAuditRetained.length = 0;
      ownerAuditEpisode = '';
      return [];
    }
    // Scope to the real floor and camera, not a guessed theme string.
    // The actual rendered theme is captured in each witness.
    // No effect on authority, appearance, camera, frame cadence or ordinary
    // players. At most four actual-camera triangle queries per 12 source ticks.
    const episode = snapshot.runToken + ':' + snapshot.floor;
    if (ownerAuditEpisode !== episode) {
      ownerAuditEpisode = episode;
      ownerAuditRetained.length = 0;
    }
    if (ownerAuditLastRun === snapshot.runToken &&
        snapshot.tick - ownerAuditLastTick < 12)
      return ownerAuditRetained.slice();
    ownerAuditLastRun = snapshot.runToken;
    ownerAuditLastTick = snapshot.tick;
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    const samples = [[-.55,.26],[-.34,.26],[-.16,.10],[.04,-.08]];
    const report = [];
    for (const [x,y] of samples) {
      ownerAuditNdc.set(x,y);
      ownerAuditRay.setFromCamera(ownerAuditNdc,camera);
      ownerAuditRay.near = .15;
      ownerAuditRay.far = 125;
      ownerAuditHits.length = 0;
      ownerAuditRay.intersectObjects(scene.children,true,ownerAuditHits);
      const hits = [];
      for (const hit of ownerAuditHits) {
        if (!hit.object?.isMesh) continue;
        let current = hit.object, visible = true;
        const path = [];
        for (let depth=0;current && depth<7;depth++,current=current.parent) {
          if (!current.visible) visible=false;
          path.push(current.name || current.type || 'unnamed');
        }
        if (!visible) continue;
        const material = Array.isArray(hit.object.material)
          ? hit.object.material[hit.face?.materialIndex || 0]
          : hit.object.material;
        if (!material || material.visible === false ||
            (material.transparent && material.opacity <= .01)) continue;
        hits.push({
          path, type:hit.object.type,
          geometry:hit.object.geometry?.type || 'buffer-batch',
          material:material.name || 'unnamed',
          color:material.color?.getHexString?.() || null,
          opacity:Number((material.opacity ?? 1).toFixed(3)),
          distance:Number(hit.distance.toFixed(3)),
          point:hit.point.toArray().map(n=>Number(n.toFixed(2))),
          faceIndex:Number.isSafeInteger(hit.faceIndex)?hit.faceIndex:null,
          instanceId:Number.isSafeInteger(hit.instanceId)?hit.instanceId:null,
          // This identifies the original authored assembly inside a real
          // submitted, material-merged triangle. Null for untouched meshes.
          // The original video and authority are unchanged; this is not an
          // occlusion or visibility verdict.
          originalAuthoring:sourceTriangleOwner(hit.object.geometry,hit.faceIndex),
        });
        if (hits.length===5) break;
      }
      report.push({ndc:[x,y],hits});
    }
    ownerAuditHits.length=0;
    // Return a run-isolated, tick-keyed rolling window, not a one-time event.
    // No new renderer draws, gameplay mutations, hidden props or synthetic hits.
    const witness = {runToken:snapshot.runToken,floor:snapshot.floor,
      tick:snapshot.tick,theme:snapshot.theme ?? null,
      viewportAspect:Number(camera.aspect.toFixed(4)),
      cameraPosition:camera.position.toArray().map(n=>Number(n.toFixed(2))),
      probes:report,source:'opt-in bounded current-Three-mesh raycasts',
      limitation:'Ray intersection is NOT proof of composited WebM pixels, occlusion quality or source-event timecode'};
    ownerAuditRetained.push(witness);
    if(ownerAuditRetained.length>8) ownerAuditRetained.shift();
    return ownerAuditRetained.slice();
  }
  function diagnostics() {
    const { frameMs, ...submissionProgress } = renderProgress.diagnostics(performance.now());
    const liveGuardian = snapshot?.enemies?.find(enemy => enemy.kind === 'guardian' && enemy.active);
    // Observe the real hero across ALL floors, not only when a guardian exists.
    // NDC proves screen bounds at this sample, not actual video raster visibility.
    camera.updateMatrixWorld(true);
    const actorProjection = snapshot?.player ? climber.group.position.clone() : null;
    if (actorProjection) actorProjection.y += snapshot.player.halfHeight / SCALE;
    if (actorProjection) actorProjection.project(camera);
    const actorNdc = actorProjection ? [actorProjection.x, actorProjection.y, actorProjection.z]
      .map(value => Number(value.toFixed(4))) : null;
    const actorCamera = { ndc: actorNdc,
      inPicture: !!actorNdc && actorNdc.every(Number.isFinite)
        && Math.abs(actorNdc[0]) <= 1 && Math.abs(actorNdc[1]) <= 1
        && actorNdc[2] >= -1 && actorNdc[2] <= 1,
      coreClear: !!actorProjection && towerCoreSightlineClear(camera.position,
        climber.group.position, 23.5),
      emergencyOrbitBlend: Number(actorRescueFraction.toFixed(4)),
      inSafeFrame: !!actorNdc && actorNdc.every(Number.isFinite)
        && Math.abs(actorNdc[0]) <= .78 && Math.abs(actorNdc[1]) <= .78
        && actorNdc[2] >= -1 && actorNdc[2] <= 1,
      cameraAzimuth: Number(Math.atan2(camera.position.x, camera.position.z).toFixed(4)),
      focusRadius: Number(Math.hypot(lookAt.x, lookAt.z).toFixed(4)),
      metric: 'Actual smoothed camera source projection, NOT video-raster visibility or supported-device FPS' };
    let encounterCamera = null;
    if (liveGuardian && snapshot?.worldWidth > 0) {
      // Observed camera pixels, not the unsmoothed ideal plan. Capture scripts
      // can now compare source HP against the actual rendered crop per tick.
      camera.updateMatrixWorld(true);
      const ndc = point => {
        const projected = new THREE.Vector3(point.x, point.y, point.z).project(camera);
        return [projected.x, projected.y, projected.z].map(value => Number(value.toFixed(4)));
      };
      const guardian = pointFor(liveGuardian.x, liveGuardian.y,
        snapshot.chunkBaseY, snapshot.worldWidth);
      const actor = pointFor(snapshot.player.x, snapshot.player.y,
        snapshot.chunkBaseY, snapshot.worldWidth);
      const circuit = observedGuardianCircuit(snapshot);
      const lockStage = circuit?.guardianId === liveGuardian.id
        ? observedGuardianLockStage(circuit) : null;
      const gate = lockStage?.center || null;
      const relay = circuit?.guardianId === liveGuardian.id
        ? observedGuardianRelayStage(circuit)?.center || null : null;
      const guardianCenter = ndc(guardian);
      // Do not confuse the published fixed-step enemy position with the
      // interpolated original rig actually sent to Three.js this frame.
      const drawnGuardianNdc = guardianDrawnSourceTick === snapshot.tick
        ? ndc(guardianDrawnCenter) : null;
      const gateCenter = gate ? ndc(gate) : null;
      const relayCenter = relay ? ndc(relay) : null;
      const visible = point => !!point && point.every(Number.isFinite) &&
        Math.abs(point[0]) <= .85 && Math.abs(point[1]) <= .78 &&
        point[2] >= -1 && point[2] <= 1;
      encounterCamera = { tick: snapshot.tick, health: liveGuardian.health,
        maxHealth: liveGuardian.maxHealth, intent: snapshot.intent?.mode ?? null,
        actorNdc: ndc(actor), guardianNdc: guardianCenter, gateNdc: gateCenter,
        guardianDrawNdc: drawnGuardianNdc,
        guardianDrawInFrame: visible(drawnGuardianNdc),
        guardianPlannerAnchor: !options.stale &&
          snapshot?.lifecycle === 'running' && snapshot.player?.health > 0 &&
          liveGuardian.health > 0 &&
          guardianPlannerWitness.runToken === snapshot.runToken &&
          guardianPlannerWitness.floor === snapshot.floor &&
          guardianPlannerWitness.tick === snapshot.tick &&
          guardianPlannerWitness.guardianId === liveGuardian.id
            ? guardianPlannerWitness.anchor : null,
        guardianDrawSourceTick: guardianDrawnSourceTick === snapshot.tick
          ? guardianDrawnSourceTick : null,
        guardianSourceToDrawNdcDelta: drawnGuardianNdc
          ? [Number((drawnGuardianNdc[0] - guardianCenter[0]).toFixed(4)),
            Number((drawnGuardianNdc[1] - guardianCenter[1]).toFixed(4))] : null,
        nearbyRelayNdc: relayCenter,
        nearbyRelayInFrame: visible(relayCenter),
        nearbyRelayCoreClear: !!relay && towerCoreSightlineClear(camera.position, relay, 23.5),
        guardianInFrame: visible(guardianCenter), gateInFrame: visible(gateCenter),
        guardianCoreClear: towerCoreSightlineClear(camera.position, guardian, 23.5),
        gateCoreClear: !!gate && towerCoreSightlineClear(camera.position, gate, 23.5),
        gateProjectedAndCoreClear: visible(gateCenter) && !!gate &&
          towerCoreSightlineClear(camera.position, gate, 23.5),
        gateSource: lockStage ? 'live-exterior-hp-lock' : 'not-present',
        gateSourceTick: lockStage?.sourceTick ?? null,
        gateReleaseFraction: lockStage?.releaseFraction ?? null,
        metric: 'Actual smoothed-camera projection of the LIVE exterior cap teeth, not the inner recessed cap; NDC/core sightline are NOT raster visibility, quality or supported-device FPS' };
    }
    // Source-bound actual projected doorway, NEVER proof of visible WebM
    // pixels, collision/crossing or hardware frame-time.
    let earnedGatewayCamera = null;
    const earnedSource = !options.stale &&
      snapshot?.lifecycle === 'running' && snapshot?.player?.health > 0
      ? observedUnlockedGuardianCap(snapshot) : null;
    const earnedProof = earnedSource ? passage.diagnostics() : null;
    if (earnedProof?.active && earnedProof.stage === 'earned-open' &&
        earnedProof.runToken === snapshot.runToken &&
        earnedProof.floor === snapshot.floor &&
        Array.isArray(earnedProof.focusPosition) &&
        earnedProof.focusPosition.length === 3 &&
        earnedProof.focusPosition.every(Number.isFinite)) {
      const point = new THREE.Vector3(...earnedProof.focusPosition);
      const pixel = point.clone().project(camera);
      const ndc = [pixel.x,pixel.y,pixel.z]
        .map(v => Number(v.toFixed(4)));
      earnedGatewayCamera = {
        sourceTick: snapshot.tick, runToken: snapshot.runToken,
        floor: snapshot.floor, gateNdc: ndc,
        gateInSafeCrop: gatewayScreenError(ndc) === 0,
        gateCoreClear: towerCoreSightlineClear(camera.position,point,23.5),
        escortGain: Number(earnedGatewayEscortLastGain.toFixed(4)),
        escortApplications: earnedGatewayEscortApplications,
        actorInSafeCrop: actorCamera.inSafeFrame,
        source: 'source-defeated-guardian-and-real-cap-threshold',
        limitation: 'Actual camera projection, NOT native video pixels or physical crossing',
      };
    }
    // "frames" remains a compatibility alias for renderer submissions. The
    // accepted snapshot below can be newer than lastSubmitted; neither proves
    // GPU completion or visibility in a captured/composited output.
    return { renderer: 'three-webgl', frames: submissionProgress.submittedFrames, tick: snapshot?.tick ?? 0, floor: snapshot?.floor ?? 0, theme: snapshot?.theme ?? '',
      camera: options.camera, quality: options.quality, reducedMotion: options.reducedMotion, stale: !!options.stale, contextLost, renderErrors,
      renderFault: { state: renderFaultState, resetAttempts: renderRecoveryAttempts,
        retryRemainingMs: renderFaultState === 'retrying'
          ? Math.max(0, Math.round(renderFaultRetryAt - performance.now())) : null,
        totalExceptions: renderFaultCount, authoritativeGameplayPaused: false },
      actorSafeRefinements,
      portraitAimCorrections,
      jointShotApplications,
      jointShotLastGain: Number(jointShotLastGain.toFixed(4)),
      jointShotEvidence: 'Measured same-frame source-body camera-crop relief only; not full-motion A/B quality, GPU FPS or hardware proof',
      portraitAimLastGain: Number(portraitAimLastGain.toFixed(4)),
      portraitAimEvidence: 'Post-action actual source projection; not raster visibility, A/B quality or device FPS',
      duelDollyApplications, duelAirborneApplications,
      duelDollyLastStep: Number(duelDollyLastStep.toFixed(4)),
      duelDollyEvidence: 'Real portrait body projection only; not verified raster visibility or quality vote',
      resolution: { basePixelRatio, pixelRatio: renderPixelRatio, scale: resolutionPolicy.scale,
        compact: resolutionPolicy.compact, minimumScale: resolutionPolicy.minimumScale,
        adaptations: resolutionPolicy.adaptations, submissionMs: resolutionPolicy.lastSubmissionMs,
        callbackGapMs: resolutionPolicy.lastCallbackGapMs,
        measurement: 'JS scene duration and visible requestAnimationFrame callback gap; neither is presented FPS' },
      renderProgress: submissionProgress,
      calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures, programs: renderer.info.programs.length, characters: 1 + enemies.size,
      ledgeContact: ledgeContactEvidence,
      ledgeProjection: measureLedgeProjection(snapshot, climber.group, camera),
      landingBeacon: { visible: landingBeacon.visible, targetId: landingBeacon.userData.targetPlatformId || null,
        position: landingBeacon.position.toArray(), triangles: landingBeacon.geometry.index.count / 3, depthTest: landingBeacon.material.depthTest },
      activeParticles: particleLife.filter(life => life > 0).length,
      observedMotionEcho: { visible: motionEcho.visible, sourceSamples: motionLedger.samples.length,
        instances: motionEcho.count, lastSourceTick: echoDrawnTick,
        extraDraws: motionEcho.visible && motionEcho.count ? 1 : 0 },
      observedActionLighting: { kind: actionLightKind, sourceTick: actionLightSourceTick,
        shadowLightsAdded: 0, drawsAdded: 0, authoritative: false,
        evidence: 'Published current combat, hazard, or landing only; not a quality preference or measured hardware FPS' },
      observedStageLight: { guardian: observedStageLight.cue.guardian,
        threat: Number(observedStageLight.cue.threat.toFixed(4)),
        armor: Number(observedStageLight.cue.armor.toFixed(4)),
        motion: Number(observedStageLight.cue.motion.toFixed(4)),
        extraShadowLights: 0 },
      observedEnemyImpacts: [...enemies.values()].filter(entry => entry.impact.visible).length,
      physicalFooting: observedFooting && footingShadow.visible ? {
        platformId: observedFooting.platformId, clearance: observedFooting.clearance,
        grounded: observedFooting.grounded, sourceTick: snapshot.tick,
        footprint: footingShadow.position.toArray(),
        evidence: 'Current source-observed overlapping deck, not predicted landing or actual raster visibility',
      } : null,
      climberIntegrity: snapshot?.player ? {
        sourceTick: snapshot.tick,
        sourceHealth: snapshot.player.health,
        maxHealth: snapshot.player.maxHealth,
        shellAngle: Number((climber.group.getObjectByName('integrity-shell-1')?.rotation.y || 0).toFixed(4)),
        evidence: 'Articulated original suit opened only by observed source HP; not video-raster or hardware quality',
      } : null,
      movingDeckRider: observedRidePose ? { platformId: observedRidePose.platformId,
        sourceTick: observedRidePose.sourceTick, drivenTick: observedRidePose.lastDrivenTick,
        sourceDisplacement: observedRidePose.actualDisplacement,
        visualLean: observedRidePose.lean, physicallyGrounded: observedRidePose.grounded,
        proof: 'Occupied moving deck and observed source ticks, not hardware visual quality' } : null,
      observedTouchdown: landingHalo.visible ? { runToken: landingRun, floor: landingFloor,
        strength: landingWeight, position: landingHalo.position.toArray(),
        physicalDeckContact: !!touchdownDebris.visible,
        platformId: touchdownDebris.visible ? physicalTouchdown.platformId : null,
        fragmentInstances: touchdownDebris.count,
        fragmentDraws: touchdownDebris.visible ? 1 : 0,
        evidence: 'Real source deck contact and bounded cosmetic 3D material; NOT video, GPU FPS or quality score' } : null,
      activeTelegraphLanes: [...enemies.values()].filter(entry => entry.threatLane.visible).length,
      activeWindupArcs: [...enemies.values()].filter(entry => entry.chargeArc.visible).length,
      contactPulse: !options.stale && elapsed<contactUntil ? { hero:contactHero, enemyId:contactEnemyId } : null, frameMs,
      lighting: { environmentReady: !!reflectionTarget, environmentState: disposed ? 'disposed' : reflectionDirty ? 'pending' : reflectionTarget ? 'ready' : 'direct', environmentBuilds: reflectionBuilds,
        environmentFailures: reflectionFailures, environmentLastError: reflectionLastError,
        environmentSize: reflectionTarget ? [reflectionTarget.width, reflectionTarget.height] : [0, 0], shadowLights: 1, shadowMapSize: sun.shadow.mapSize.x },
      cameraRayMeshOwners: observedCameraMeshOwners(),
      cameraRayMeshOwnerAudit: {
        requested: typeof window !== 'undefined' &&
          window.__TOWER_MESH_OWNER_AUDIT__ === true,
        floor: snapshot?.floor ?? null, theme: snapshot?.theme ?? null,
        sourceTick: snapshot?.tick ?? null, health: snapshot?.player?.health ?? null,
        current: snapshot?.lifecycle === 'running' && !options.stale,
        retained: ownerAuditRetained.length,
        evidenceOnly: true,
      },
      world: world.diagnostics(), finale: finale.diagnostics(), passage: passage.diagnostics(),
    groundedBiomeThreshold: snapshot
      ? observedGroundedBiomeThreshold(snapshot,passage.diagnostics(),options) : null,
    groundedGatewaySourceAudit:gatewaySourceAudit,
      authenticRestartSweep: authenticRestartSweep ? {
        sourceBound: true, runToken: authenticRestartSweep.runToken,
        ageSeconds: Math.max(0, Number((elapsed - authenticRestartSweep.began).toFixed(3))),
        cameraOnly: true, motionDisabled: !!options.reducedMotion,
      } : null,
      routeIntent: routeIntent.diagnostics(), landingApproach: landingApproach.diagnostics(), movingDeckSuspension: movingDeckSuspension.diagnostics(), hazardPressure: hazardPressure.diagnostics(), guardianCircuit: guardianCircuit.diagnostics(),
      guardianShotStage: guardianShotStage.diagnostics(),
      witnessedAirbornePulse: airbornePulse && airbornePulse.runToken === snapshot?.runToken &&
        airbornePulse.floor === snapshot?.floor && !options.stale &&
        snapshot?.lifecycle === 'running' && snapshot?.player?.state === 'airborne'
        ? { sourceTick: airbornePulse.tick, projectileId: airbornePulse.projectileId,
            ageSeconds: Math.max(0, elapsed - airbornePulse.startedAt), renderOnly: true } : null,
      witnessedGuardianCounterPulse: guardianCounterPulse &&
        guardianCounterPulse.runToken === snapshot?.runToken &&
        guardianCounterPulse.floor === snapshot?.floor && !options.stale &&
        snapshot?.lifecycle === 'running' && snapshot?.player?.state === 'standing'
        ? { sourceTick: guardianCounterPulse.tick,
            projectileId: guardianCounterPulse.projectileId,
            guardianId: guardianCounterPulse.guardianId,
            ageSeconds: Math.max(0, elapsed - guardianCounterPulse.startedAt),
            renderOnly: true } : null,
      atmosphere: atmosphere.diagnostics(),
      recoveryTransfer: recoveryTransfer.diagnostics(),
      summitCrown: observedCrown && crownStage.visible ? {
        capId: observedCrown.capId, sourceTick: observedCrown.sourceTick,
        guardianId: observedCrown.guardianId,
        observedGuardianHealthRatio: observedCrown.guardianHealthRatio,
        realSourceDistance: observedCrown.distance,
        objectiveNotVictory: true, visible: true, extraDraws: 2,
        source: 'Current-floor authoritative cap; no fake objective, gate unlock or gameplay effect',
      } : { visible: false, extraDraws: 0, objectiveNotVictory: true },
      terminalCamera: finale.group.visible ? {
        sourceBound: true, lifecycle: snapshot.lifecycle,
        presentedSourceResult: !!snapshot.result,
        staged: options.camera !== 'overview',
        actorInPicture: actorCamera.inPicture,
        actorCoreClear: actorCamera.coreClear,
        cameraRadius: Number(Math.hypot(camera.position.x, camera.position.z).toFixed(4)),
        criterion: 'Actual smoothed source-final camera; source projection only, not verified video visibility',
      } : null,
      guardianRescueBlend: Number(guardianRescueBlend.toFixed(4)),
      physicalThresholdCamera: {sourceBound: physicalThresholdFrameSourceBound,
        lastGain:Number(physicalThresholdFrameGain.toFixed(4)),
        acceptedFrames:physicalThresholdFrameCorrections,
        limitation:'Same original GPU doorway and actual body NDC; not visible WebM acceptance'},
      guardianRescueApplications,
      guardianSubmittedOrbitContinuity: {
        cappedFrames:guardianOrbitCappedFrames,
        vetoedFrames:guardianOrbitVetoedFrames,
        lastAngularStep:Number(guardianOrbitLastStep.toFixed(4)),
        lastSourceTick:lastSubmittedGuardian.runToken === snapshot?.runToken &&
          lastSubmittedGuardian.floor === snapshot?.floor
          ? lastSubmittedGuardian.tick : null,
        evidence:'Current real submitted portrait live-guardian camera, source-safe fallback; not WebM motion acceptance or hardware FPS',
      },
      guardianPortraitOptical: {
        fovDegrees:Number(camera.fov.toFixed(3)),
        requestedDegrees:Number(guardianPortraitOpticalTarget.toFixed(3)),
        changes:guardianPortraitOpticalChanges,
        stage:guardianPortraitOpticalKind,
        sourceTick:guardianPortraitOpticalSourceTick,
        safeguard:'real post-correction body/landing NDC, opaque tower core, source-earned cap and prior world rays',
        limitation:'Submitted-camera optics only; NOT proof of native WebM visible actors, grounded passage, performance or preference',
      },
      guardianWorldOcclusion: {
        raySamples:guardianWorldOcclusionSamples,
        boundedShoulderFrames:guardianWorldOcclusionImprovements,
        safetyVetoes:guardianWorldOcclusionRejected,
        lastGeometryScoreGain:guardianWorldLastGain,
        source:'real current Three.js opaque world triangle rays / both drawn actors',
        limitation:'Throttled scene geometry witness, NOT native WebM painted pixels, A/B preference or hardware FPS'
      },
      guardianRescueEvidence: 'Approved dual-subject source projection + exterior-core guards; NOT raster visibility or quality score',
      encounterCamera, actorCamera, earnedGatewayCamera, cameraPosition: camera.position.toArray(), climberPosition: climber.group.position.toArray() };
  }
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frameHandle); observer.disconnect();
    document.removeEventListener('visibilitychange', visibilityChanged);
    removeEventListener('pageshow', cachedRestore);
    canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored);
    canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerUp); canvas.removeEventListener('wheel', wheel);
    releaseEnvironment();
    sun.shadow.dispose(); sun.shadow.map = null; sun.shadow.mapPass = null;
    clearActors(); climber.dispose(); world.dispose(); finale.dispose(); passage.dispose(); routeIntent.dispose(); landingApproach.dispose(); movingDeckSuspension.dispose(); hazardPressure.dispose(); guardianCircuit.dispose(); guardianShotStage.dispose(); guardianGuardStage.dispose(); atmosphere.dispose(); recoveryTransfer.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    renderer.dispose(); scene.clear();
  }
  return { accept, setCamera, setMotion, setStale, setQuality, diagnostics, dispose };
}
