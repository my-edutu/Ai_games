import * as THREE from '/tower/vendor/three.module.js';
import { createTowerWorld, THEMES } from './world.mjs';
import { createClimber, createEnemy } from './characters.mjs';
import { SCALE, pointFor, angleFor, guardianGateAnchorX } from './coordinates.mjs';
import { snapshotVelocity } from './motion.mjs';
import { createRenderProgress } from './render-progress.mjs';
import { createTowerFinale } from './finale.mjs';
import { observedGuardianPassage, createTowerGuardianPassage } from './guardian-passage.mjs';
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
  const ticks=Number.isFinite(enemy.telegraphTicksRemaining)
    ? clamp(enemy.telegraphTicksRemaining,1,8):8;
  const laneHalf=.10+(1-ticks/8)*.095;
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
function followClimberContact(position, target, blend, state) {
  position.lerp(target, blend);
  if (state === 'standing') position.y = target.y;
  return position;
}

// Camera motion must follow the OUTSIDE of the cylindrical tower. A Cartesian
// lerp between valid front-left and front-right viewpoints crosses the solid
// core, briefly hiding the real climber, guardian and their HP-operated gate.
// The shortest angular arc keeps the entire transition outside the walkable
// 27.18-unit outer deck, including overview/follow and floor transitions.
// This is presentation only and makes no additional render or raycast calls.
function followTowerCamera(position, target, blend) {
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
  const azimuth = from + turn * alpha;
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
function followTowerFocus(position, target, blend) {
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
  const azimuth = from + turn * alpha;
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
  const boundedDt = Math.min(dt, .05), severity = Math.min(3, pressure);
  const response = Math.min(.28,
    (1 - Math.exp(-boundedDt * (3 + severity * 8))) * Math.min(1, .4 + severity));
  const actorAngle = Math.atan2(actor.x, actor.z);
  const cameraAngle = Math.atan2(position.x, position.z);
  const cameraArc = Math.atan2(
    Math.sin(actorAngle - cameraAngle), Math.cos(actorAngle - cameraAngle));
  const cameraStep = Math.min(.16, boundedDt * 6.5);
  const orbitBlend = Math.min(response, cameraStep / Math.max(.001, Math.abs(cameraArc)));
  const radius = Math.max(27.35, Math.hypot(position.x, position.z));
  orbitTarget.set(Math.sin(actorAngle) * radius, position.y,
    Math.cos(actorAngle) * radius);
  followTowerCamera(position, orbitTarget, orbitBlend);
  const focusAngle = Math.atan2(gaze.x, gaze.z);
  const focusArc = Math.atan2(
    Math.sin(actorAngle - focusAngle), Math.cos(actorAngle - focusAngle));
  const focusStep = Math.min(.16, boundedDt * 7);
  followTowerFocus(gaze, actor,
    Math.min(response, focusStep / Math.max(.001, Math.abs(focusArc))));
  return orbitBlend;
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

// Evidence-only approximate core occlusion for the inset bronze lock. A point
// can project inside the phone viewport while sitting behind the tower; do not
// award it a camera-composition preference or a visible-gate diagnostic then.
// World meshes may add occlusion, so this is a necessary, not sufficient, test.
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
    || !['aligning', 'jumping', 'air-control'].includes(mode)) return null;
  const target = snapshot.platforms.find(platform => platform.id === snapshot.intent.targetPlatformId);
  if (!target || target.width <= 0) return null;
  const feet = player.y - player.halfHeight;
  const onTarget = player.state === 'standing' && Math.abs(feet - target.y - target.height) < 2000
    && player.x + (player.halfWidth || 9000) >= target.x
    && player.x - (player.halfWidth || 9000) <= target.x + target.width;
  return onTarget ? null : target;
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

// Fit a small local encounter, preserving the hero's 18%-high baseline whenever
// the actual route fits. A long portrait crossing may require a wider view;
// that tradeoff is preferable to cropping the real destination or opponent.
function composeFollowView(snapshot, hero, aspect, orbit = 0, zoom = 1) {
  const player = snapshot.player, height = player.halfHeight * 2 / SCALE;
  const heroAngle = angleFor(player.x, snapshot.worldWidth);
  const body = { x: hero.x, y: hero.y + height * .52, z: hero.z };
  const target = intendedLanding(snapshot);
  let landing = null;
  if (target) landing = pointFor(target.x + target.width / 2,
    target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
  let threat = null, nearest = Infinity;
  // The tactical nearest-object camera may prefer a small bolt or hazard
  // while the guardian is visibly losing HP. Keep a separate, source-backed
  // combat anchor rather than allowing that important opponent to disappear.
  let contactGuardian = null, contactGuardianDistance = Infinity;
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
      const activeContact = player.state !== 'airborne' && (healthRatio < 1 || enemy.telegraph ||
        player.attacking || ['engaging-enemy', 'bracing-telegraph', 'evading-telegraph'].includes(snapshot.intent?.mode));
      if (!activeContact || dx > 90000 || dy > 60000) continue;
      const score = dx + dy * 1.4;
      if (score < contactGuardianDistance) {
        contactGuardianDistance = score;
        contactGuardian = { ...pointFor(enemy.x, enemy.y, snapshot.chunkBaseY, snapshot.worldWidth),
          halfWidth: enemy.halfWidth / SCALE, halfHeight: enemy.halfHeight / SCALE,
          sourceX: enemy.x, sourceY: enemy.y, healthRatio };
      }
    }
    for (const hazard of snapshot.hazards || []) if (hazard.active) consider(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, hazard.width / 2, hazard.height / 2, 1.2);
    // A fired bolt already moving farther from the climber is no longer an
    // immediate tactical threat; do not let it crop the contact source.
    for (const bolt of snapshot.projectiles || []) if (bolt.owner === 'enemy'
      && (bolt.x - player.x) * bolt.vx <= 0) consider(bolt.x, bolt.y, 3000, 3000, 1.7);
  }
  // Stage a real close-range encounter before the distant route marker. The
  // existing world-space landing beacon remains visible; only camera fitting
  // temporarily favors actual attackers and their observed telegraph.
  const encounter = !!contactGuardian || (!!threat && (threat.imminentWindup
    || ['engaging-enemy', 'bracing-telegraph', 'evading-telegraph', 'evading-projectile'].includes(snapshot.intent?.mode)));
  const routeLanding = encounter ? null : landing;
  // The only mechanical gate to frame is the one already placed on the
  // observed guardian cap. No predicted clearance or unearned cutscene.
  const cap = contactGuardian && snapshot.platforms?.find(platform =>
    typeof platform.id === 'string' && platform.id.endsWith(':cap') &&
    Math.abs(guardianGateAnchorX(snapshot, platform) - contactGuardian.sourceX) < 100000 &&
    Math.abs(platform.y + platform.height - contactGuardian.sourceY) < 80000);
  const gateAnchorX = cap ? guardianGateAnchorX(snapshot, cap) : null;
  const gate = cap ? pointFor(gateAnchorX, cap.y + cap.height,
    snapshot.chunkBaseY, snapshot.worldWidth, 21.8) : null;
  const gatePoints = gate ? [
    { ...gate, y: gate.y + 2.5 }, { ...gate, y: gate.y + 5.2 },
    ...[-1, 1].map(side => ({ x: gate.x + Math.cos(gate.angle) * side * 3.4,
      y: gate.y + 2.7, z: gate.z - Math.sin(gate.angle) * side * 3.4 })),
  ] : [];
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
  if (gate) {
    // A very small shared camera bias brings the true HP-driven architecture
    // closer to the guardian; the actor/hazard bounds remain the hard limit.
    center.x = lerp(center.x, gate.x, .12);
    center.y = lerp(center.y, gate.y + 2.5, .12);
    center.z = lerp(center.z, gate.z, .12);
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
  if (routeLanding) {
    // Include the real usable width, rather than only a guessed touch point.
    // The outer walking band is outside the architectural core at radius 23.4.
    for (const x of [target.x, target.x + target.width]) {
      const edge = pointFor(x, target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
      points.push(edge, { ...edge, y: edge.y + .4 }); sightlines.push(edge);
    }
    points.push(pointFor(target.x + target.width / 2, target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 24.4));
  }
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
  function solve(lean) {
    const angle = Math.atan2(center.x, center.z) + direction * .08 + orbit + lean;
    // Active traversal gets a modest overlook so the destination presents a
    // usable top. Grounded encounters keep the established near-eye framing.
    const sin = Math.sin(angle), cos = Math.cos(angle), pitch = routeLanding ? .18 : .055, level = Math.sqrt(1 - pitch * pitch);
    const out = { x: sin * level, y: pitch, z: cos * level };
    const right = { x: cos, y: 0, z: -sin }, up = { x: -sin * pitch, y: level, z: -cos * pitch };
    const bodyDepth = dot(relative(body), out);
    const minimumActorShare = encounter ? (aspect < .85 ? .205 : .225) : .18;
    let distance = bodyDepth + height * level / (2 * tangent * minimumActorShare);
    for (const point of points) {
      const delta = relative(point), depth = dot(delta, out);
      distance = Math.max(distance,
        depth + Math.abs(dot(delta, right)) / (tangent * Math.max(.25, aspect) * horizontalSafe),
        depth + Math.abs(dot(delta, up)) / (tangent * .66));
    }
    distance = Math.max(12, distance) * zoom;
    const position = { x: center.x + out.x * distance, y: center.y + out.y * distance, z: center.z + out.z * distance };
    const clear = sightlines.every(point => {
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
    const gateCoreClear = !!gate && towerCoreSightlineClear(position, gate);
    const gateFramed = gatePoints.length > 0 && gateCoreClear &&
      gatePoints.every(point => visible(point, .93, .86));
    return { focus: center, position, distance, landing, targetId: target?.id || null, lean, clear,
      guardianStaged: !!contactGuardian, guardianFramed, gateFramed, gateCoreClear, gateAnchorX,
      heroFraction: height * level / (2 * tangent * (distance - bodyDepth)) };
  }
  let best = solve(0);
  const preferredFraction = (encounter ? (aspect < .85 ? .195 : .215) : .165) / zoom;
  if (subject && best.heroFraction < preferredFraction) {
    // View along a broad crossing: the real destination recedes into depth,
    // instead of shrinking the entire encounter to fit a narrow screen.
    for (const amount of (aspect < .85 ? [.45, .75, .95, 1.1] : [.25, .5, .75])) {
      const candidate = solve(direction * amount);
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
    const quality = view => (!view.clear || !view.guardianFramed || view.heroFraction < .15)
      ? -1000 + view.heroFraction
      : 150 + (view.gateFramed ? 16 : 0) +
        Math.min(.24, view.heroFraction) * 16 - Math.abs(view.lean) * 1.6;
    let bestQuality = quality(best);
    for (const amount of [0, .22, .45, .7, .95, 1.13, -.22, -.45, -.7]) {
      const candidate = solve(direction * amount), candidateQuality = quality(candidate);
      if (candidateQuality <= bestQuality + .01) continue;
      best = candidate;
      bestQuality = candidateQuality;
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
  const center = (left + right) / 2, span = Math.min((right - left) * .31, .13);
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
  const anchor = pointFor(platform.x + platform.width / 2, platform.y + platform.height,
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

// GPU submission duration is an overload signal, NOT a presented-frame/FPS
// measurement. Keep every art/lighting feature from the chosen quality tier;
// only reduce the drawing-buffer pixel count when repeated submissions stall.
// Independently reviewed hardware performance remains a separate release gate.
function createTowerResolutionPolicy() {
  const floor = .6;
  let scale = 1, overload = 0, healthy = 0, cooldown = 0, adaptations = 0;
  let lastSubmissionMs = null;
  return {
    get scale() { return scale; }, get adaptations() { return adaptations; },
    get lastSubmissionMs() { return lastSubmissionMs; },
    record(durationMs, visible) {
      if (!visible || !Number.isFinite(durationMs) || durationMs < 0) {
        overload = 0; healthy = 0; return false;
      }
      lastSubmissionMs = Math.round(durationMs * 10) / 10;
      if (cooldown) cooldown--;
      if (durationMs >= 180) { overload++; healthy = 0; }
      else if (durationMs <= 35) { healthy++; overload = 0; }
      else { overload = 0; healthy = 0; }
      if (overload >= 2 && cooldown === 0 && scale > floor) {
        scale = Math.max(floor, Math.round(scale * 80) / 100);
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
    reset() { scale = 1; overload = 0; healthy = 0; cooldown = 0; adaptations = 0; lastSubmissionMs = null; },
  };
}

export function createTowerScene(canvas, settings = {}) {
  const options = { camera: 'follow', quality: innerWidth < 700 ? 'low' : 'high', reducedMotion: false, ...settings };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x83534d);
  scene.fog = new THREE.FogExp2(0x9a5751, 0.0045);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.2, 1200);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = options.quality === 'high';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  canvas.dataset.renderer = 'three-webgl';
  const resolutionPolicy = createTowerResolutionPolicy();
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
  const enemies = new Map(), pickups = new Map(), projectiles = new Map();
  const sharedGeometry = new Set(), sharedMaterials = new Set();
  const ownGeometry = geometry => { sharedGeometry.add(geometry); return geometry; };
  const ownMaterial = material => { sharedMaterials.add(material); return material; };
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
  let elapsed = 0, lastTime = 0, renderErrors = 0, contextLost = false, disposed = false;
  let contactUntil=0,contactHero=false,contactEnemyId=null;
  let landingMoment=-Infinity,landingRun=null,landingFloor=null,landingWeight=0;
  let baseY = 0, themeKey = '', cameraAngle = .15, lastRevision = '', orbit = 0, zoom = 1;
  const renderProgress = createRenderProgress();
  const actorTarget = new THREE.Vector3();
  const actorFramePoint = new THREE.Vector3();
  const actorOrbitTarget = new THREE.Vector3();
  let actorRescueFraction = 0;
  const guardianSightPoints=[];
  const lookAt = new THREE.Vector3();
  let actorYaw = 0;
  const visibilityChanged = () => {
    lastTime = 0;
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
    basePixelRatio = options.quality === 'low' || innerWidth < 700 ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    // Protect 390px mobile readability and the existing one-pixel-per-CSS-pixel
    // phone contract. Desktop overload can adapt without changing the art tier.
    renderPixelRatio = Math.round(basePixelRatio * (innerWidth >= 700 ? resolutionPolicy.scale : 1) * 1000) / 1000;
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
  }
  function rebuildGraphicsResources() {
    // Dispose while WebGL is still lost: Three's disposal listeners otherwise
    // retain old-context buffers and VAOs after its restore handler resets caches.
    // Rebuild resource owners, including their detached/cached geometries.
    releaseEnvironment();
    reflectionFirstFrame = true;
    clearActors();
    scene.remove(world.group, climber.group, finale.group, passage.group);
    world.dispose(); climber.dispose(); finale.dispose(); passage.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    sun.shadow.dispose(); sun.shadow.map = null; sun.shadow.mapPass = null;
    world = createTowerWorld(); climber = createClimber(); finale = createTowerFinale(THREE);
    passage = createTowerGuardianPassage(THREE);
    climber.group.name = 'ExpeditionClimber';
    scene.add(world.group, climber.group, finale.group, passage.group);
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
    renderProgress.expectFrame(performance.now());
    const newRun = snapshot && next.runToken !== snapshot.runToken;
    if (newRun) { clearActors(); passage.clear(); initialized = false; previous = null; landingMoment=-Infinity; landingRun=null; landingHalo.visible=false; actorRescueFraction = 0; }
    if (snapshot && baseY !== next.chunkBaseY) {
      const shift = (baseY - next.chunkBaseY) / SCALE;
      climber.group.position.y += shift; camera.position.y += shift; lookAt.y += shift;
      for (const entry of enemies.values()) entry.model.group.position.y += shift;
      for (let i = 0; i < MAX_PARTICLES; i++) particlePositions[i * 3 + 1] += shift;
    }
    previous = newRun ? null : snapshot;
    snapshot = next; baseY = next.chunkBaseY;
    // A decisive guardian hit can also advance the REAL fixed-step floor.
    // The previous gate is discarded with its old world; preserve only a short
    // non-colliding bronze passage memory, witnessed in adjacent real source
    // snapshots. Never infer a victory from animation time, a new run or a
    // missing guardian. The new floor's autonomous physics stay untouched.
    const clearedGuardian = observedGuardianPassage(previous, next);
    if (previous && previous.floor !== next.floor) passage.clear();
    // The old source-driven lock existed at the PREVIOUS floor's fixed
    // guardian-approach anchor on its actual cap, not the new climber or
    // an arbitrary center. Preserve that exact world location through the
    // floor switch so the cleared gate remains physically continuous.
    const guardianCap = clearedGuardian && previous.platforms?.find(platform =>
      platform.id === `f${previous.floor}:cap` && Number.isFinite(platform.x) &&
      Number.isFinite(platform.width) && platform.width > 0 &&
      Number.isFinite(platform.y) && Number.isFinite(platform.height));
    if (guardianCap && Number.isFinite(next.worldWidth) && next.worldWidth > 0) {
      const gateAnchorX = guardianGateAnchorX(previous, guardianCap);
      passage.begin(previous, next, pointFor(gateAnchorX,
        guardianCap.y + guardianCap.height, next.chunkBaseY, next.worldWidth, 21.8));
    }
    // A landing is observable only across consecutive source snapshots in the
    // same real run/floor. Skipped long intervals and decorative ledge poses
    // cannot invent a contact or shake the camera.
    const landed = previous && previous.runToken === next.runToken && previous.floor === next.floor
      && next.tick > previous.tick && next.tick - previous.tick <= 8
      && previous.player.state === 'airborne' && previous.player.vy < -350
      && next.player.state === 'standing' && next.player.vy === 0 && next.player.health > 0;
    if (landed) {
      const deck = pointFor(next.player.x, next.player.y - next.player.halfHeight,
        next.chunkBaseY, next.worldWidth, 27.16);
      landingHalo.position.set(deck.x, deck.y + .085, deck.z);
      landingMoment = elapsed; landingRun = next.runToken; landingFloor = next.floor;
      landingWeight = clamp(-previous.player.vy / 14000, .4, 1);
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
    world.update(snapshot, dt, elapsed, options);
    const p = snapshot.player;
    const targetPlatform = intendedLanding(snapshot);
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
    if (!initialized) { climber.group.position.copy(actorTarget); actorYaw = desiredYaw; }
    else { followClimberContact(climber.group.position, actorTarget, blend, p.state); actorYaw += Math.atan2(Math.sin(desiredYaw - actorYaw), Math.cos(desiredYaw - actorYaw)) * blend; }
    climber.group.rotation.y = actorYaw;
    climber.group.scale.setScalar(p.halfHeight * 2 / SCALE / 2.8);
    const followComposition = options.camera === 'overview' ? null : composeFollowView(snapshot, climber.group.position, camera.aspect, orbit, zoom);
    const viewPosition = initialized ? camera.position : followComposition?.position || camera.position;
    const viewAngle = Math.atan2(viewPosition.x - climber.group.position.x, viewPosition.z - climber.group.position.z) - actorYaw;
    options.viewAzimuth = Math.atan2(Math.sin(viewAngle), Math.cos(viewAngle));
    // An actual low-health resource detour is a visible autonomous decision.
    // Aim the skinned visor at the public health pickup instead of the stale
    // ascent target. This changes no physics or collision and draws no HUD.
    const resourceTarget = snapshot.intent?.mode === 'collecting-resource'
      ? snapshot.pickups.filter(item => item.kind === 'health')
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x) || a.id.localeCompare(b.id))[0]
      : null;
    climber.animate({ ...p,
      intentMode: snapshot.intent?.mode,
      targetDx: resourceTarget ? resourceTarget.x - p.x : targetPlatform ? targetPlatform.x + targetPlatform.width / 2 - p.x : 0,
      targetDy: resourceTarget ? resourceTarget.y - p.y : targetPlatform ? targetPlatform.y + targetPlatform.height - p.y : 0,
      // Real snapshot platform top, inside the existing radial walking surface.
      // No grab, pause, lift or authoritative collision is fabricated.
      ledgeTarget,
      ledgeMantle,
      ledgeSurface,
      // Bound the transient contact handoff to this exact authoritative
      // run/platform/tick, so a restart cannot reuse an earlier grip pose.
      runToken: snapshot.runToken,
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
      const chargeLeft = Number.isFinite(e.telegraphTicksRemaining)
        ? clamp(e.telegraphTicksRemaining,1,8):8;
      const threatBase = e.kind === 'guardian' ? 3.5 : 2.2;
      entry.warning.scale.setScalar(threatBase*(options.reducedMotion?1:.82+.2*(1-chargeLeft/8)));
      entry.threatLane.visible = e.active && e.telegraph && !options.stale;
      if(entry.threatLane.visible)poseThreatLane(entry.threatLane,e,snapshot);
      // The incomplete arc shrinks across the enemy's true remaining ticks.
      // Rotation is optional; reduced motion retains size and shape information.
      entry.chargeArc.visible = e.active && e.telegraph && e.kind !== 'sentinel' && !options.stale;
      if (entry.chargeArc.visible) {
        const remaining = Number.isFinite(e.telegraphTicksRemaining)
          ? clamp(e.telegraphTicksRemaining, 1, 8) / 8 : 1;
        entry.chargeArc.position.copy(model.position);
        entry.chargeArc.position.y += e.halfHeight * 2 / SCALE * .69;
        scratch.copy(camera.position).sub(entry.chargeArc.position).normalize();
        entry.chargeArc.position.addScaledVector(scratch, .55);
        entry.chargeArc.quaternion.copy(camera.quaternion);
        if (!options.reducedMotion) entry.chargeArc.rotateZ((1 - remaining) * Math.PI * .72);
        entry.chargeArc.scale.setScalar((e.kind === 'guardian' ? 2.1 : 1.25) * (.58 + remaining * .42));
      }
      const impact = entry.impact;
      impact.visible = (e.active || elapsed < entry.deadUntil)
        && (elapsed < entry.impactUntil || entry.impactFramesRemaining > 0);
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
    // A contact pulse is a short, bounded camera response to observed damage,
    // never an invented attack. Reduced motion retains the world-space cues.
    const contactProgress=options.stale?0:clamp((contactUntil-elapsed)/.24,0,1);
    const landingProgress=clamp((elapsed-landingMoment)/.6,0,1);
    landingHalo.visible=!options.stale && snapshot.lifecycle==='running'
      && landingRun===snapshot.runToken && landingFloor===snapshot.floor && landingProgress<1;
    if(landingHalo.visible){
      landingHalo.scale.setScalar(options.reducedMotion ? .85 + landingWeight*.2
        : .55 + landingProgress*(1.15+landingWeight*.65));
      landingHalo.material.opacity=landingWeight*(options.reducedMotion ? .62
        : .78*(1-landingProgress)*(1-landingProgress));
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
    if (!overview && releaseWeight > 0) {
      destination.y += releaseWeight * 1.4;
      focus.y += releaseWeight * .65;
      // A source-witnessed glance at the released lock keeps the real climber
      // in view and never replaces the authoritative camera/floor change.
      const releaseFocus = passage.focusPoint();
      if (releaseFocus) focus.lerp(releaseFocus, Math.min(.18, releaseWeight * .15));
    }
    // Reveal the height of the actual terminal position, not a fabricated
    // victory pose: the result/intermission phase owns this quiet camera crane.
    // Reduced motion freezes the treatment to a stable, wider composition.
    if (!overview && snapshot.result && ['result', 'intermission'].includes(snapshot.lifecycle)) {
      scratch.copy(destination).sub(climber.group.position);
      destination.addScaledVector(scratch, .22);
      destination.y += 3.1;
      focus.y += 1.1;
    }
    // Follow source-observed guardian action a little faster than exploration:
    // a real HP change should not be over before the camera catches its actor.
    // All motion remains bounded and presentation-only; reduced motion is still.
    let cameraRate = towerCameraRate(camera.position, destination,
      !overview && !!followComposition?.guardianStaged, overview);
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
    }
    const cameraBlend = options.reducedMotion ? 1 : 1 - Math.exp(-dt * cameraRate);
    if (!initialized) { camera.position.copy(destination); lookAt.copy(focus); initialized = true; }
    else {
      followTowerCamera(camera.position, destination, cameraBlend);
      followTowerFocus(lookAt, focus, cameraBlend);
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
    }
    if(!options.reducedMotion && !options.stale && options.camera==='follow'&&contactProgress>0)
      camera.position.y+=(contactHero?-.24:.18)*Math.sin((1-contactProgress)*Math.PI);
    if(!options.reducedMotion && options.camera==='follow' && landingHalo.visible)
      camera.position.y-=landingWeight*.13*Math.sin(landingProgress*Math.PI);
    camera.lookAt(lookAt);
    world.revealGuardianSightlines(camera,guardianSightPoints);
    updateLandingBeacon(landingBeacon, targetPlatform, snapshot, camera);
    sky.position.copy(camera.position);
    sun.target.position.set(0, targetY, 0);
    sun.position.set(-40, targetY + 55, 52);
    rim.target.position.set(0, targetY, 0);
    rim.position.set(45, targetY + 18, -30);
    bounce.target.position.set(0, targetY, 0);
    bounce.position.set(-18, targetY - 22, 32);
  }

  function animate(now) {
    if (disposed) return;
    frameHandle = requestAnimationFrame(animate);
    const deltaMs = lastTime ? now - lastTime : 16.67;
    lastTime = now;
    if (contextLost || !snapshot) return;
    const dt = clamp(deltaMs / 1000, .001, .5);
    const motionDt = options.stale ? 0 : dt;
    elapsed += motionDt;
    try {
      // A drawing-buffer resize invalidates its previous contents. Always
      // resize BEFORE the next render, never immediately after submission.
      if (resolutionDirty) { resize(); resolutionDirty = false; }
      const submissionStart = performance.now();
      update(motionDt); renderer.render(scene, camera);
      if (innerWidth >= 700 && resolutionPolicy.record(performance.now() - submissionStart,
        document.visibilityState === 'visible' && !options.stale)) resolutionDirty = true;
      // Count a contact frame only after Three has submitted it. Delayed
      // software rendering must not consume an unseen cue on elapsed time
      // alone; submissions are NOT proof of displayed hardware FPS.
      for (const entry of enemies.values()) {
        if (entry.impact.visible && entry.impactFramesRemaining > 0) entry.impactFramesRemaining--;
      }
      renderProgress.submitted(snapshot, performance.now());
    } catch (error) {
      renderErrors++; options.onStatus?.('The 3D view is recovering', 'error');
      if (renderErrors === 1) console.error('Tower renderer:', error);
      // A persistent view error should be visible and bounded, while server ticks continue.
      if (renderErrors >= 3) contextLost = true;
    }
  }
  const lost = event => {
    event.preventDefault(); contextLost = true;
    options.onStatus?.('Graphics interrupted · ascent continues', 'recovering');
    rebuildGraphicsResources();
  };
  const restored = () => {
    contextLost = false; renderErrors = 0; lastTime = 0;
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
  function setCamera(mode) { if (['follow', 'overview'].includes(mode)) { options.camera = mode; orbit = 0; zoom = 1; } }
  function setMotion(reduced) { options.reducedMotion = !!reduced; }
  function setStale(stale) { options.stale = !!stale; }
  function setQuality(quality) {
    const nextQuality = quality === 'low' ? 'low' : 'high';
    if (options.quality !== nextQuality) {
      options.quality = nextQuality;
      resolutionPolicy.reset(); resolutionDirty = false;
      reflectionDirty = true;
      reflectionFirstFrame = true;
    }
    renderer.shadowMap.enabled = options.quality === 'high';
    renderer.shadowMap.needsUpdate = true;
    resize();
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
      const cap = snapshot.platforms?.find(platform =>
        typeof platform.id === 'string' && platform.id.endsWith(':cap'));
      const gate = cap ? pointFor(guardianGateAnchorX(snapshot, cap), cap.y + cap.height,
        snapshot.chunkBaseY, snapshot.worldWidth, 21.8) : null;
      const guardianCenter = ndc(guardian);
      const gateCenter = gate ? ndc({ ...gate, y: gate.y + 2.5 }) : null;
      const visible = point => !!point && point.every(Number.isFinite) &&
        Math.abs(point[0]) <= .85 && Math.abs(point[1]) <= .78 &&
        point[2] >= -1 && point[2] <= 1;
      encounterCamera = { tick: snapshot.tick, health: liveGuardian.health,
        maxHealth: liveGuardian.maxHealth, intent: snapshot.intent?.mode ?? null,
        actorNdc: ndc(actor), guardianNdc: guardianCenter, gateNdc: gateCenter,
        guardianInFrame: visible(guardianCenter), gateInFrame: visible(gateCenter),
        guardianCoreClear: towerCoreSightlineClear(camera.position, guardian, 23.5),
        gateCoreClear: !!gate && towerCoreSightlineClear(camera.position, gate),
        gateProjectedAndCoreClear: visible(gateCenter) && !!gate &&
          towerCoreSightlineClear(camera.position, gate),
        metric: 'Actual smoothed-camera NDC and approximate core sightline, NOT raster visibility, quality or supported-device FPS' };
    }
    // "frames" remains a compatibility alias for renderer submissions. The
    // accepted snapshot below can be newer than lastSubmitted; neither proves
    // GPU completion or visibility in a captured/composited output.
    return { renderer: 'three-webgl', frames: submissionProgress.submittedFrames, tick: snapshot?.tick ?? 0, floor: snapshot?.floor ?? 0, theme: snapshot?.theme ?? '',
      camera: options.camera, quality: options.quality, reducedMotion: options.reducedMotion, stale: !!options.stale, contextLost, renderErrors,
      resolution: { basePixelRatio, pixelRatio: renderPixelRatio, scale: innerWidth >= 700 ? resolutionPolicy.scale : 1,
        adaptations: resolutionPolicy.adaptations, submissionMs: resolutionPolicy.lastSubmissionMs,
        measurement: 'JS scene-update-and-render-call duration; not presented FPS' },
      renderProgress: submissionProgress,
      calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures, programs: renderer.info.programs.length, characters: 1 + enemies.size,
      ledgeContact: ledgeContactEvidence,
      ledgeProjection: measureLedgeProjection(snapshot, climber.group, camera),
      landingBeacon: { visible: landingBeacon.visible, targetId: landingBeacon.userData.targetPlatformId || null,
        position: landingBeacon.position.toArray(), triangles: landingBeacon.geometry.index.count / 3, depthTest: landingBeacon.material.depthTest },
      activeParticles: particleLife.filter(life => life > 0).length,
      observedEnemyImpacts: [...enemies.values()].filter(entry => entry.impact.visible).length,
      observedTouchdown: landingHalo.visible ? { runToken: landingRun, floor: landingFloor,
        strength: landingWeight, position: landingHalo.position.toArray() } : null,
      activeTelegraphLanes: [...enemies.values()].filter(entry => entry.threatLane.visible).length,
      activeWindupArcs: [...enemies.values()].filter(entry => entry.chargeArc.visible).length,
      contactPulse: !options.stale && elapsed<contactUntil ? { hero:contactHero, enemyId:contactEnemyId } : null, frameMs,
      lighting: { environmentReady: !!reflectionTarget, environmentState: disposed ? 'disposed' : reflectionDirty ? 'pending' : reflectionTarget ? 'ready' : 'direct', environmentBuilds: reflectionBuilds,
        environmentFailures: reflectionFailures, environmentLastError: reflectionLastError,
        environmentSize: reflectionTarget ? [reflectionTarget.width, reflectionTarget.height] : [0, 0], shadowLights: 1, shadowMapSize: sun.shadow.mapSize.x },
      world: world.diagnostics(), finale: finale.diagnostics(), passage: passage.diagnostics(),
      encounterCamera, actorCamera, cameraPosition: camera.position.toArray(), climberPosition: climber.group.position.toArray() };
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
    clearActors(); climber.dispose(); world.dispose(); finale.dispose(); passage.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    renderer.dispose(); scene.clear();
  }
  return { accept, setCamera, setMotion, setStale, setQuality, diagnostics, dispose };
}
