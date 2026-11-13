import * as THREE from '/tower/vendor/three.module.js';
import { SCALE, ARC, angleFor, pointFor, guardianGateAnchorX, GUARDIAN_CAP_CORRIDOR } from './coordinates.mjs';
import { observedSourceEarnedAirborneHandoff, observedSourceEarnedDoorstepHandoff, observedRecordedGuardianDoorstepHandoff } from './guardian-passage.mjs';
import { createStoneSurfaceAsset, applyStoneSurface } from './world-surface.mjs';
import { observedSceneHierarchy } from './scene-hierarchy.mjs';
import { originalMeshPath } from './mesh-provenance.mjs';
import { GUARDIAN_TRANSMISSION_LAYOUT } from './guardian-transmission-layout.mjs';
import { observedClockworkRoofContinuity, observedRetainedOriginalCapRoofContact, observedSourceEarnedColdFrameContinuation, holdIncomingStructuralShell, observedQueuedOriginalCapAtFirstRender } from './crossfloor-arrival.mjs';

// All geometry is presentation-only. Collision extents come exclusively from the snapshot.
// Display-submission-timed copy of the ACTUAL source cap landing surface:
// static before the first completed Three.js frame, then ease the original
// bronze landing into the already-real Floor9 crystal material. Keeping the
// old/source mesh in its exact roof plane is essential; a new decorative
// bridge or a HUD tint would not fix the occluded physical ground contact.
export function observedRetainedOriginalBronzeCover(submittedFrames, visibleSeconds) {
  if (!Number.isSafeInteger(submittedFrames) || submittedFrames < 0 ||
      !Number.isFinite(visibleSeconds) || visibleSeconds < 0) return 0;
  const t = Math.max(0, Math.min(1, (visibleSeconds - .12) / 1.25));
  return .94 * (1 - t * t * (3 - 2 * t));
}
export const THEMES = Object.freeze({
  foundry: { name:'Foundry', sky:0x45333f, fog:0x99796d, accent:0xff9d42, ambient:0xe8e0d3, sun:0xffdfbc },
  ruins: { name:'Sunken Ruins', sky:0x8cb8bd, fog:0xa9c9bd, accent:0x72e0b3, ambient:0xd9f0d3, sun:0xffe5ae },
  storm: { name:'Storm Spire', sky:0x4c657c, fog:0x718c9e, accent:0x8ce7ff, ambient:0xc5e4fb, sun:0xffddbc },
  clockwork: { name:'Clockwork', sky:0x697b83, fog:0xa0afa4, accent:0xffcf75, ambient:0xffe7c1, sun:0xffdd9d },
  void: { name:'Astral Vault', sky:0x26223f, fog:0x514267, accent:0xc9a1ff, ambient:0xc2baf0, sun:0xffccbc }
});
const PALETTES = {
  foundry:{stone:0x82918d,dark:0x29373c,metal:0x596c70,edge:0xd4c7a7,landing:0x88928d,glow:0xff982f},
  ruins:{stone:0x777a68,dark:0x293d36,metal:0x65745a,edge:0xa99f7d,landing:0x9a987e,glow:0x80e4b1},
  storm:{stone:0x485e6d,dark:0x223440,metal:0x587789,edge:0x9db0b7,landing:0x718890,glow:0x8eeaff},
  clockwork:{stone:0x625e51,dark:0x25323b,metal:0xa06a35,edge:0xb8a47d,landing:0x8e8269,glow:0xffc35f},
  void:{stone:0x514963,dark:0x28233c,metal:0x6a577e,edge:0xb3a3c9,landing:0x726982,glow:0xc59bff}
};
// This optimization can omit *only distant decoration*, never a floor, a
// bridge, the playable ground, a crusher, guardian damage or a real doorway.
// The previous PUBLIC snapshot must prove the actual on-deck boss defeat,
// and the new authoritative source must already be standing on the next
// floor. This never predicts a source milestone or touches fixed-step state.
export function observedEarnedFloorArrival(previous, next) {
  if (!previous || !next || previous.lifecycle !== 'running' ||
      next.lifecycle !== 'running' ||
      typeof previous.runToken !== 'string' || !previous.runToken ||
      previous.runToken !== next.runToken ||
      !Number.isSafeInteger(previous.tick) ||
      !Number.isSafeInteger(next.tick) || next.tick <= previous.tick ||
      !Number.isSafeInteger(previous.floor) ||
      next.floor !== previous.floor + 1 ||
      !Array.isArray(previous.platforms) ||
      !Array.isArray(previous.enemies)) return false;
  const cap = previous.platforms.find(p =>
    p?.id === 'f' + previous.floor + ':cap' &&
    [p.x, p.y, p.width, p.height].every(Number.isFinite) &&
    p.width > 0 && p.height > 0);
  if (!cap || !Number.isSafeInteger(previous.guardianExitX) ||
      previous.guardianExitX !== cap.x + Math.floor(cap.width * .76))
    return false;
  const defeated = previous.enemies.some(e => e.kind === 'guardian' &&
    e.active === false && Number.isFinite(e.health) && e.health <= 0 &&
    (!Number.isSafeInteger(e.floor) || e.floor === previous.floor));
  return defeated && previous.player?.health > 0 &&
    previous.player?.grounded === true &&
    previous.player?.groundedPlatformId === cap.id &&
    next.player?.health > 0 && next.player?.grounded === true &&
    next.player?.groundedPlatformId === 'f' + next.floor + ':ground';
}

// The giant decorative rotors can sit BETWEEN two true combat/traversal
// subjects on a narrow phone without touching either center ray. Protect the
// *visible* physical action corridor, not merely isolated actor projections.
// This is a pure image-composition decision; never a hazard, collider or AI cue.
export function observedStageCorridorOpacity({
  aspect, gear, radius, gearDepth, from, to, fromDepth, toDepth, guardian = false,
}) {
  if (![aspect, radius, gearDepth, fromDepth, toDepth].every(Number.isFinite) ||
      aspect <= 0 || aspect > 3 || radius < .075 || radius > 3 ||
      ![gear, from, to].every(point => point &&
        [point.x, point.y, point.z].every(Number.isFinite)) ||
      gear.z < -1 || gear.z > 1 ||
      [from, to].some(point => Math.abs(point.x) > .98 ||
        Math.abs(point.y) > .94 || point.z < -1 || point.z > 1) ||
      gearDepth <= 0 || gearDepth + .35 >= Math.min(fromDepth, toDepth)) return 1;
  const ax = from.x * aspect, ay = from.y;
  const dx = (to.x - from.x) * aspect, dy = to.y - from.y;
  const squared = dx * dx + dy * dy;
  if (squared < .025) return 1;
  const t = ((gear.x * aspect - ax) * dx + (gear.y - ay) * dy) / squared;
  // Only interstitial scenery. Endpoint protection remains handled by
  // authentic world-space ray tests and conservative silhouette proximity.
  if (t <= .12 || t >= .88) return 1;
  const gap = Math.hypot(gear.x * aspect - ax - t * dx, gear.y - ay - t * dy);
  if (gap > radius + Math.min(.14, radius * .35 + .055)) return 1;
  return guardian ? .42 : .58;
}

// Native portrait guardian film showed a large CLOCKWORK wheel holding the
// center of the screen while the playable climber became a speck. Exact body
// rays are necessary but insufficient: a near-camera wheel can dominate the
// entire action composition without intersecting the body's thin center ray.
// Fade only a source-irrelevant decorative foreground wheel that covers the
// central phone image and lies IN FRONT of the current observed actor. Never
// fade gameplay machinery, a far/background wheel or anything on desktop.
// Returned value is the allowed decorative alloy/clock-case opacity, not a
// gameplay event, visibility verdict or reviewer score.
export function observedPortraitGearDominance({
  aspect, gear, radius, gearDepth, actor, actorDepth,
}) {
  if (![aspect,radius,gearDepth,actorDepth].every(Number.isFinite) ||
      aspect <= 0 || aspect >= .85 || radius < .48 || radius > 12 ||
      gearDepth <= 0 || gearDepth + .35 >= actorDepth ||
      ![gear,actor].every(point => point &&
        [point.x,point.y,point.z].every(Number.isFinite)) ||
      gear.z < -1 || gear.z > 1 || actor.z < -1 || actor.z > 1 ||
      Math.abs(actor.x) > .88 || Math.abs(actor.y) > .86) return 1;
  // Same aspect-compensated metric as the real actor/guardian corridor test.
  // radius is the wheel's genuine current projected perspective footprint.
  const center = Math.hypot(gear.x * aspect, gear.y);
  const separation = Math.hypot((gear.x - actor.x) * aspect, gear.y - actor.y);
  if (center > radius + .15 || separation > radius + .25) return 1;
  return Math.max(.18, 1 - .82 * Math.min(1, (radius - .48) / .62));
}

// A full 3D decorative case can fill a portrait frame even when the gear's
// projected CENTER is offscreen. Project the real post-batch, camera-relative
// world bounds instead. The foreground test must be nearer than the present
// source-owned actor; no artificial subject position or source game changes.
export function observedPortraitDecorativeEnvelope({
  aspect, minX, maxX, minY, maxY, nearestDepth, actorDepth,
}) {
  if (![aspect,minX,maxX,minY,maxY,nearestDepth,actorDepth].every(Number.isFinite) ||
      aspect<=0 || aspect>=.85 || minX>maxX || minY>maxY ||
      nearestDepth<0 || actorDepth<=0 || nearestDepth+.25>=actorDepth) return 1;
  // Viewport coordinates in NDC, not a fixed global tower azimuth. This tests
  // whether the ACTUAL foreground envelope occupies the important phone shot.
  const x=Math.max(0,Math.min(maxX,.78)-Math.max(minX,-.78));
  const y=Math.max(0,Math.min(maxY,.76)-Math.max(minY,-.72));
  if(x<.25 || y<.24)return 1;
  return x>.56&&y>.58 ? .14 : .36;
}

// Native 390x844 danger footage (42610816382, candidate) still spends
// several seconds with a source-independent clock face occupying the action.
// The older *foreground-only* safety veto reported full opacity for the
// same clock when its nearest bound was behind the actor. That is physically
// correct for occlusion but still visually buries the actor/guardian/gateway
// composition in a tall phone crop. This separate stage-presence policy
// de-emphasizes ONLY decorative non-colliding scenery whose observed
// projected screen envelope competes with TWO genuine source endpoints.
// It never alters moving decks, combat, hazards, traversal or the camera.
// No fake actors, predicted routes or unearned gateway triggers are created.
export function observedPortraitActionBackdropOpacity({
  aspect, bounds, actor, partners, partnerCount, coverage,
}) {
  if (![aspect,coverage,bounds?.minX,bounds?.maxX,bounds?.minY,bounds?.maxY,
    actor?.x,actor?.y,actor?.z].every(Number.isFinite) ||
    aspect<=.35 || aspect>=.85 || coverage<.22 || coverage>1 ||
    !Array.isArray(partners) || !Number.isSafeInteger(partnerCount) ||
    partnerCount<1 || partnerCount>4 ||
    bounds.minX>bounds.maxX || bounds.minY>bounds.maxY ||
    actor.z< -1 || actor.z>1 || Math.abs(actor.x)>.94 ||
    Math.abs(actor.y)>.9) return 1;
  const left=Math.max(-.82,bounds.minX),right=Math.min(.82,bounds.maxX);
  const bottom=Math.max(-.78,bounds.minY),top=Math.min(.78,bounds.maxY);
  if(right-left<.5 || top-bottom<.48)return 1;
  for(let i=0;i<partnerCount;i++){
    const target=partners[i];
    if(!target || ![target.x,target.y,target.z].every(Number.isFinite) ||
       target.z< -1 || target.z>1 || Math.abs(target.x)>.95 ||
       Math.abs(target.y)>.92)continue;
    const centerX=(actor.x+target.x)*.5;
    const centerY=(actor.y+target.y)*.5;
    const actorCovered=actor.x>=left-.08 && actor.x<=right+.08 &&
      actor.y>=bottom-.08 && actor.y<=top+.08;
    const storyCovered=centerX>=left-.08 && centerX<=right+.08 &&
      centerY>=bottom-.08 && centerY<=top+.08;
    if(actorCovered || storyCovered)return coverage>=.33?.30:.46;
  }
  return 1;
}

// A decorative clock face is a STACK of overlapping wheel, spindle, dial,
// plate and bezel surfaces. Giving every surface 42% alpha can still leave a
// nearly opaque curtain across the tiny live actor. Bound the combined opacity
// of the entire decorative stack; use the measured mesh stack size from the
// post-batch scene, never from an imagined or future gameplay event.
export function observedLayeredSceneryOpacity(composite, layers) {
  if (!Number.isFinite(composite) || composite < 0 || composite > 1 ||
      !Number.isSafeInteger(layers) || layers < 1 || layers > 12) return 1;
  return 1 - Math.pow(1 - composite, 1 / layers);
}

// Four genuine decorative clock/rack assemblies may stack over the SAME
// skinned silhouette. A separate opacity allowance for every assembly
// recreates an opaque curtain even when each wheel individually fades.
export function observedScreenEnvelopeOverlap(a,b) {
  if (![a?.minX,a?.maxX,a?.minY,a?.maxY,
    b?.minX,b?.maxX,b?.minY,b?.maxY].every(Number.isFinite)) return false;
  if (a.minX>a.maxX || a.minY>a.maxY ||
      b.minX>b.maxX || b.minY>b.maxY) return false;
  const width=Math.min(1,a.maxX,b.maxX)-Math.max(-1,a.minX,b.minX);
  const height=Math.min(1,a.maxY,b.maxY)-Math.max(-1,a.minY,b.minY);
  return width>=.16 && height>=.18;
}

export function observedStackedDecorativeOpacity(composite, ownLayers, companions=0) {
  if (!Number.isFinite(composite) || composite<0 || composite>1 ||
      !Number.isSafeInteger(ownLayers) || ownLayers<1 || ownLayers>8 ||
      !Number.isSafeInteger(companions) || companions<0 || companions>3) return 1;
  // One budget for all ACTUALLY overlapping non-gameplay metal surfaces.
  // There are no new actors, hazard cues, camera cuts or physics changes.
  return 1-Math.pow(1-composite,1/(ownLayers*(companions+1)));
}

// Explicit structural openings in the giant non-colliding face are more
// trustworthy than making an opaque wheel disappear after the camera moves.
// Both concentric load-bearing rings use the SAME angular gaps. This pure
// design contract can be checked before any WebGL runner is available.
export function observedClockworkRimApertures() {
  const quadrants=4,window=.62,step=Math.PI*2/quadrants;
  return Array.from({length:quadrants},(_,index)=>({
    start:index*step+window*.5,
    arc:step-window,
  }));
}

// A physical clock face can cover the same narrow PHONE corridor as the
// guardian even after its rotating gear teeth fade. Its rigid dial, posts and
// backing are decorative only: they have no authored collider or gameplay
// authority. Give these existing draw surfaces private precompiled alpha
// materials so the actual source-observed hero/guardian/landing sightline can
// clear the WHOLE silhouette, not merely the spokes of a translucent wheel.
// Keep the meshes, outlines and world-space art: no x-ray actors or fake HUD.
export function linkClockFaceScenery(entry, parent, ownedMaterials) {
  if (!entry || !parent?.children?.includes(entry.root) || !ownedMaterials) return 0;
  const cloned = new Map();
  const sceneryMeshes = [];
  for (const child of parent.children) {
    if (child === entry.root) continue; // moving gear already has its own alloy
    child.traverse(object => {
      if (!object.isMesh || !object.material || Array.isArray(object.material)) return;
      let material = cloned.get(object.material);
      if (!material) {
        material = object.material.clone();
        material.name = 'SightlineResponsiveClockFace';
        material.transparent = true; material.opacity = 1; material.depthWrite = true;
        cloned.set(object.material, material); ownedMaterials.add(material);
      }
      object.material = material;
      sceneryMeshes.push(object);
      object.userData.ambientDetail = true;
      object.castShadow = false; object.receiveShadow = false;
    });
  }
  entry.sceneryMaterials = [...cloned.values()];
  // Keep the physical sibling surfaces, not only the rotating teeth, in the
  // present camera sightline query. These meshes have no gameplay collider.
  entry.sceneryMeshes = sceneryMeshes;
  entry.sceneryParent = parent;
  return entry.sceneryMaterials.length;
}

// Reuse the already measured actor/guardian/corridor opacity. The static clock
// surround must never stay fully opaque when the gear becomes transparent.
// This does not change source ticks, physics, AI, source platforms or hazards.
// A source-sized physical silhouette, not the render camera or an imagined
// threat, supplies only two additional bounded sightline samples (head/feet).
export function observedSilhouetteSpan(halfHeight) {
  return Number.isFinite(halfHeight) && halfHeight > 0
    ? Math.min(3.2, halfHeight * .82) : 0;
}

export function syncClockFaceSightline(entry) {
  const faces = entry?.sceneryMaterials;
  if (!faces?.length) return false;
  const opacity = entry.alloy.opacity;
  const solid = opacity >= .985;
  for (const material of faces) {
    material.opacity = opacity;
    material.depthWrite = solid;
  }
  return !solid;
}

const TAU = Math.PI*2;
const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
function noise(i){const x=Math.sin(i*127.13+78.9)*43758.5453;return x-Math.floor(x);}

// A physically tapered stone wedge, rather than a rotated rectangular block.
// The same original mesh is instanced eleven times around the Ruins portal:
// open mortar joints, curved intrados, a genuine keystone and depth behind
// the front face. The primitive is independent of gameplay/collision geometry.
export function createCarvedVoussoirGeometry(THREE) {
  const stones = 11, inner = 1.87, outer = 2.52;
  const half = Math.PI / (stones * 2), joint = .012;
  const shape = new THREE.Shape();
  const start = -half + joint, end = half - joint;
  for (let i = 0; i <= 5; i++) {
    const angle = start + (end - start) * i / 5;
    const x = Math.cos(angle) * outer, y = Math.sin(angle) * outer;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let i = 5; i >= 0; i--) {
    const angle = start + (end - start) * i / 5;
    shape.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .78, steps: 1, bevelEnabled: true, bevelSegments: 2,
    bevelSize: .025, bevelThickness: .035, curveSegments: 5,
  });
  geometry.translate(0, 0, -.39);
  return geometry;
}

// Two solid, asymmetrically mirrored bronze leaves follow the true curved
// intrados of the masonry rather than filling the arch with a flat black card.
// Their crest is inset from the stone; the closed gate is a background prop,
// not a new collider, route, or interactable gameplay door.
export function createRuinsGateLeafGeometry(THREE, side) {
  if (side !== -1 && side !== 1) throw new RangeError('Ruins gate leaf side must be -1 or 1');
  const outer = 1.69, inner = .065, bottom = .16;
  const crest = x => 3.72 + Math.sqrt(Math.max(0, 1.8 * 1.8 - x * x)) - .22;
  const shape = new THREE.Shape();
  shape.moveTo(side * outer, bottom);
  shape.lineTo(side * inner, bottom);
  shape.lineTo(side * inner, crest(inner));
  for (let i = 1; i <= 16; i++) {
    const x = inner + (outer - inner) * i / 16;
    shape.lineTo(side * x, crest(x));
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .24, steps: 1, bevelEnabled: true,
    bevelSegments: 2, bevelThickness: .025, bevelSize: .022,
  });
  geometry.translate(0, 0, -.12);
  return geometry;
}

// One original machined silhouette serves both counter-rotating, source-driven
// carriage gears. Four open windows leave a real central hub and spoke web;
// twelve raised teeth make actual observed rotation legible without overlays.
// The same immutable geometry is shared by both gear instances, not allocated
// on source ticks or claimed to have any gameplay collider.
export function createObservedMovingDeckGearGeometry(THREE) {
  const shape = new THREE.Shape(), teeth = 12, divisions = teeth * 4;
  for (let i = 0; i < divisions; i++) {
    const a = i * Math.PI * 2 / divisions;
    const r = i % 4 === 1 || i % 4 === 2 ? .76 : .65;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const center = (quadrant + .5) * Math.PI / 2, half = .30;
    const hole = new THREE.Path();
    for (let step = 0; step <= 5; step++) {
      const a = center - half + 2 * half * step / 5;
      const x = Math.cos(a) * .52, y = Math.sin(a) * .52;
      if (step === 0) hole.moveTo(x, y); else hole.lineTo(x, y);
    }
    for (let step = 5; step >= 0; step--) {
      const a = center - half + 2 * half * step / 5;
      hole.lineTo(Math.cos(a) * .22, Math.sin(a) * .22);
    }
    hole.closePath();shape.holes.push(hole);
  }
  const gear = new THREE.ExtrudeGeometry(shape, {
    depth: .19, steps: 1, bevelEnabled: true, bevelSegments: 1,
    bevelSize: .014, bevelThickness: .025, curveSegments: 4,
  });
  gear.translate(0, 0, -.095);
  return gear;
}

// Original geologic panorama: large fragmented cliffs at three actual depths,
// not a screen-space card or cloned scenery from a commercial game. The full
// ring survives orbit/floor cameras; every point stays beyond the widest
// overview camera so the distant art cannot hide the simulated route.
export const VISTA_PALETTES = Object.freeze({
  foundry: [0x674b51, 0x8f6764, 0xae8577],
  ruins: [0x516f68, 0x77968b, 0xa0b5a4],
  storm: [0x344d67, 0x56778c, 0x859cb0],
  clockwork: [0x545d63, 0x788380, 0xa7a594],
  void: [0x383454, 0x59547d, 0x847caa],
});
export function createVistaLayerGeometry(THREE, biome, layer, height) {
  if (!VISTA_PALETTES[biome] || !Number.isInteger(layer) || layer < 0 || layer > 2
      || !Number.isFinite(height) || height <= 0) throw new RangeError('Invalid tower vista layer');
  const counts = [15, 20, 25], radii = [242, 340, 455], widths = [27, 31, 35];
  const count = counts[layer], radius = radii[layer], width = widths[layer];
  const palette = new THREE.Color(VISTA_PALETTES[biome][layer]);
  const positions = [], colors = [];
  const seed = Object.keys(VISTA_PALETTES).indexOf(biome) * 71;
  const scalarNoise = value => {
    const raw = Math.sin(value * 127.13 + 78.9) * 43758.5453;
    return raw - Math.floor(raw);
  };
  // Horizontal bands are genuine eroded courses. Irregular individual crowns
  // avoid a repeated silhouette; all geometry is generated once per floor.
  const courses = [0, .17, .29, .33, .48, .54, .58, .76, .89, 1];
  const taper = [1.22, 1.15, 1.08, 1.04, .97, .91, .84, .73, .43, .04];
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 2 * (i + .15 + scalarNoise(i * 3 + layer * 31 + seed) * .65) / count;
    const centerRadius = radius + (scalarNoise(i * 11 + layer * 9 + seed) - .5) * 13;
    const halfWidth = width * (.69 + scalarNoise(i * 7 + 13 + seed) * .47);
    const halfDepth = (12 + layer * 3) * (.75 + scalarNoise(i * 19 + seed) * .6);
    const crown = 24 + layer * 21 + height * .40 + scalarNoise(i * 17 + layer * 5 + seed) * (50 + layer * 11);
    const bottom = -130 - layer * 22;
    const bend = (scalarNoise(i * 23 + seed) - .5) * 16;
    const tangentX = Math.cos(angle), tangentZ = -Math.sin(angle);
    const radialX = Math.sin(angle), radialZ = Math.cos(angle);
    function point(j, side) {
      const phi = Math.PI * 2 * side / 8;
      const size = taper[j] * (1 + (scalarNoise(i * 41 + side * 3 + j * 13 + seed) - .5) * .14);
      const tangential = Math.cos(phi) * halfWidth * size + bend * courses[j];
      const radial = centerRadius + Math.sin(phi) * halfDepth * size;
      const y = bottom + (crown - bottom) * courses[j]
        + (j > 6 ? (scalarNoise(i * 37 + side * 13 + seed) - .5) * 2.5 * (j - 6) : 0);
      return [radialX * radial + tangentX * tangential, y,
        radialZ * radial + tangentZ * tangential];
    }
    for (let j = 0; j < courses.length - 1; j++) for (let side = 0; side < 8; side++) {
      const next = (side + 1) % 8;
      const a = point(j, side), b = point(j, next), c = point(j + 1, next), d = point(j + 1, side);
      const sunlit = .68 + Math.max(0, Math.cos(Math.PI * 2 * side / 8 - .65)) * .25;
      const sediment = j === 2 || j === 5 ? 1.22 : j === 3 || j === 6 ? .74 : 1;
      const tone = palette.clone().multiplyScalar((.74 + courses[j] * .34) * sunlit * sediment
        * (.92 + scalarNoise(i * 11 + seed) * .16));
      for (const p of [a,b,c,a,c,d]) {
        positions.push(...p);
        colors.push(tone.r, tone.g, tone.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.name = `original-${biome}-canyon-layer-${layer}`;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

// Flagship Ruins set piece: an actual hollow stone cloister, NOT a painted
// portal decal or a collider. A cloister opening stays open in depth; the
// broken outer silhouette and fluted reveals make the robot feel smaller.
// Used at three unequal scales / heights around the existing authored tower.
export function createRuinsSanctuaryArchGeometry(THREE) {
  const wall = new THREE.Shape();
  wall.moveTo(-4.05, -.12);
  wall.lineTo(4.05, -.12);
  wall.lineTo(4.25, 3.1);
  wall.lineTo(4.14, 9.2);
  wall.lineTo(3.95, 12.1);
  wall.lineTo(2.95, 13.05);
  wall.lineTo(1.15, 13.35);
  wall.lineTo(-1.72, 13.16);
  wall.lineTo(-3.82, 12.28);
  wall.lineTo(-4.18, 8.6);
  wall.closePath();
  const opening = new THREE.Path();
  opening.moveTo(-2.52, .58);
  opening.lineTo(2.52, .58);
  opening.lineTo(2.52, 7.55);
  // Tapered medieval arch with a steep summit, rather than a round doorway.
  for (let step = 1; step <= 12; step++) {
    const f = step / 12, a = Math.PI * f;
    opening.lineTo(2.52 * Math.cos(a), 7.55 + 3.52 * Math.sin(a));
  }
  opening.closePath();
  wall.holes.push(opening);
  const geometry = new THREE.ExtrudeGeometry(wall, {
    depth: 1.02, steps: 1, bevelEnabled: true,
    bevelSegments: 2, bevelSize: .11, bevelThickness: .12, curveSegments: 12,
  });
  geometry.translate(0, 0, -.51);
  return geometry;
}

/** A bounded, floor-owned Three.js environment. The host owns lights, fog and camera. */
// Original clockwork load-bearing open gallery: pure deterministic geometry
// inputs, no modification to authority, hitboxes, route or other four biomes.
export function clockworkOpenPressureRibs(height) {
  if(!Number.isFinite(height)||height<=30)return [];
  const bottom=9,top=height+10,ribs=[];
  for(let index=0;index<8;index++){
    const angle=(index+.5)*Math.PI/4;
    const near=Math.cos(angle-.30)>Math.cos(1.07);
    const end=near?Math.min(12.2,top):top;
    ribs.push({p:[Math.sin(angle)*10.7,(bottom+end)/2,
      Math.cos(angle)*10.7],s:[near?.42:.38,end-bottom,near?.42:.38],
      near,upperEnd:end});
  }
  return ribs;
}
export function clockworkOpenGeologicalTies(height,width,depth,localY) {
  if(![height,width,depth,localY].every(Number.isFinite)||
     height<=30||width<=0||depth<=0)return [];
  const lower=-17,frontTop=10.7,rearTop=height+15,stays=[];
  for(const side of [-1,1]){
    // Rear structure reaches BOTH stone masses; near structure stops below
    // the actual guardian altitude instead of bisecting the hero in portrait.
    stays.push({p:[side*width*.34,(lower+rearTop)/2-localY,-depth*.31],
      s:[.43,rearTop-lower,.43],near:false,upperEnd:rearTop});
    stays.push({p:[side*width*.34,(lower+frontTop)/2-localY,depth*.24],
      s:[.48,frontTop-lower,.48],near:true,upperEnd:frontTop});
  }
  return stays;
}

// Real 390x844 source guardian film/rays identified non-colliding bronze
// pylons behind both actors (ticks 305-317) as dominant screen clutter.
// Move the COMPLETE clockwork load paths, not just their centers, behind
// the genuine cap battle arc. The exterior platform/colliders are untouched.
// Every relocated pillar remains grounded and connected to the crown.
export function clockworkCapActionClearSpan(theme,height) {
  const opened=theme==='clockwork' && Number.isFinite(height) && height>30;
  const pylons=[
    {a:opened?-2.10:-.66,r:16.8,R:4.9,bottom:-31,top:height+16},
    {a:opened?2.10:.67,r:16.65,R:5.25,bottom:-35,top:height+6},
    {a:opened?Math.PI:-.18,r:8.6,R:5.5,bottom:-27,top:height+31},
  ];
  const geology=opened
    ? [[-2.20,-7,5.8,height+28,6.4,1],
       [2.22,-11,6.4,height+25,6.1,2],
       [Math.PI,2,13,height+43,10,0]]
    : [[-1.12,-7,5.8,height+28,6.4,1],
       [1.18,-11,6.4,height+25,6.1,2],
       [2.5,2,13,height+43,10,0]];
  // These raised load ties terminate in the existing physical crown, well
  // above the source-owned hero/guardian/arch/route action elevation.
  const overheadLinks=opened?pylons.map(p=>({
    from:[Math.sin(p.a)*p.r,Math.min(height+11,p.top-1.1),Math.cos(p.a)*p.r],
    to:[Math.sin(p.a)*9.2,height+18,Math.cos(p.a)*9.2],
    radius:.23,
  })):[];
  return {pylons,geology,overheadLinks};
}

export function createTowerWorld(){
  const group=new THREE.Group();group.name='InfiniteTowerWorld';
  const stoneSurface=createStoneSurfaceAsset(THREE);
  let floorGroup=null,key='',theme='foundry',disposed=false,lastSnapshot=null;
  let materials={}, floorGeometries=new Set(),floorMaterials=new Set();
  // Actual source-floor static GPU attribute/index payload, not driver memory.
  let rigidUploadBytes=0, rigidExpandedBytes=0, rigidIndexedBatches=0, rigidBatchCount=0, rigidPackedVertexBuffers=0, rigidPriorSeparateVertexBuffers=0;
  const primitives=new Map(),platforms=new Map(),hazards=new Map(),rotors=[],floaters=[],foregroundGears=[];
  const foregroundRacks=[],decorativeSightlines=[];
  // Passive, bounded current-camera forensic samples; NEVER a video quality verdict.
  const decorativeOcclusionEvidence=[];
  // Source-observed semantic emphasis; decorative scenery yields to the actors.
  let sceneFocus=0, sceneFocusKind='ascent';
  let particles=null,vistaGroup=null,quality='normal',occludedGuardianCaps=0,occludedForegroundGears=0,occludedForegroundScreenGears=0,occludedForegroundCorridorGears=0,occludedForegroundClockFaces=0,ruinsPortalVoussoirs=0,ruinsGateLeaves=0;
  let ruinsSanctuaryArches=0,ruinsSanctuaryPlants=0,ruinsSanctuaryCascadePanels=0;
  const canopyRay = new THREE.Raycaster(), canopyDirection = new THREE.Vector3();
  // The foreground protection can sample at most nine actual body/guardian/landing
  // hazard/gateway rays per decorative assembly per presented frame.
  // Retain the hit array and reject rays missing the full WORLD AABB before
  // invoking Three.js recursive mesh/triangle intersection. Empty bounds
  // fail open to the old exact path; alpha and all source truth stay unchanged.
  const canopyHits = [];
  // Reuse all projection scratch on the render path.
  const screenGearWorld = new THREE.Vector3(), screenGearCenter = new THREE.Vector3();
  const screenGearRight = new THREE.Vector3(), screenGearTop = new THREE.Vector3();
  const decoratedBounds = new THREE.Box3(), decoratedCorner=new THREE.Vector3();
  const screenFocus = new THREE.Vector3();
  const silhouettePoint = new THREE.Vector3();
  const corridorFrom = new THREE.Vector3();
  const corridorTo = [new THREE.Vector3(), new THREE.Vector3(),
    new THREE.Vector3(), new THREE.Vector3()];
  const corridorDepths = [0, 0, 0, 0], corridorGuardians = [false, false, false, false];
  function geometry(name,build){if(!primitives.has(name))primitives.set(name,build());return primitives.get(name);}
  const box=()=>geometry('box',()=>new THREE.BoxGeometry(1,1,1));
  const sphere=()=>geometry('sphere',()=>new THREE.SphereGeometry(1,10,7));
  const cone=()=>geometry('cone',()=>new THREE.ConeGeometry(1,1,6));
  const cylinder=()=>geometry('cylinder',()=>new THREE.CylinderGeometry(1,1,1,12));
  const leaf=()=>geometry('leaf',()=>{
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,0,-.5,0,.5,0,0,0,.5,0,0,0,.18,0,0,-.06],3));
    g.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,1,0,5,2,1,5,3,2,5,0,3,5]);g.computeVertexNormals();return g;
  });
  const bevel=()=>geometry('bevel',()=>{
    const s=new THREE.Shape();s.moveTo(-.44,-.5);s.lineTo(.44,-.5);s.lineTo(.5,-.44);s.lineTo(.5,.44);s.lineTo(.44,.5);s.lineTo(-.44,.5);s.lineTo(-.5,.44);s.lineTo(-.5,-.44);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.9,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.05,bevelThickness:.05});g.translate(0,0,-.45);return g;
  });
  const rounded=()=>geometry('rounded-casting',()=>{
    const s=new THREE.Shape(),r=.17;
    s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);
    s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);s.lineTo(-.5+r,.5);
    s.quadraticCurveTo(-.5,.5,-.5,.5-r);s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
    const g=new THREE.ExtrudeGeometry(s,{depth:.76,bevelEnabled:true,bevelSize:.08,bevelThickness:.12,bevelSegments:3,steps:1,curveSegments:4});g.translate(0,0,-.38);return g;
  });
  const corbel=()=>geometry('open-cantilever',()=>{
    // A cast, open web supporting the rear of a route deck. The opening is real.
    const s=new THREE.Shape();s.moveTo(-2.15,.48);s.lineTo(1.8,.48);s.lineTo(1.8,.04);
    s.quadraticCurveTo(.45,-.1,-.2,-1.75);s.quadraticCurveTo(-.55,-2.8,-1.65,-3.05);s.lineTo(-2.15,-3.05);s.closePath();
    const h=new THREE.Path();h.moveTo(-1.65,-.18);h.lineTo(.45,-.18);h.quadraticCurveTo(-.5,-.6,-.75,-1.8);h.quadraticCurveTo(-.95,-2.2,-1.65,-2.35);h.closePath();s.holes.push(h);
    const g=new THREE.ExtrudeGeometry(s,{depth:.34,bevelEnabled:true,bevelSegments:2,bevelSize:.08,bevelThickness:.08,steps:1,curveSegments:8});g.translate(0,0,-.17);g.rotateY(-Math.PI/2);return g;
  });
  function chipped(variant=0){return geometry(`chipped:${variant}`,()=>{
    const s=new THREE.Shape(),points=[[-.5,-.39],[-.39,-.5],[.12,-.47],[.23,-.43],[.48,-.46],[.47,-.11],[.42,.03],[.5,.33],[.31,.5],[-.16,.47],[-.45,.5],[-.49,.17],[-.45,-.05]];
    points.forEach(([x,y],i)=>{x+=(noise(i+variant*17)-.5)*.065;y+=(noise(i+variant*23)-.5)*.055;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);});s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.8,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.065,bevelThickness:.1});g.translate(0,0,-.4);return g;
  });}
  function fracturedMass(variant=0){return geometry(`fractured-mass:${variant}`,()=>{
    // An irregular volume with changing cross section, not a displaced wall tile.
    const outline=[[-.5,-.28],[-.32,-.5],[.29,-.49],[.5,-.19],[.46,.28],[.17,.5],[-.31,.45],[-.49,.16]],positions=[],indices=[];
    const levels=[-.5,-.14,.2,.5],widths=[1,.96,.83,.64];
    for(let row=0;row<4;row++)for(let j=0;j<8;j++){
      const [x,z]=outline[j],offset=(noise(row*17+variant*31)-.5)*.11;
      positions.push(x*widths[row]+offset,levels[row]+(noise(j+variant*41)-.5)*.07,z*(1-row*.065)+(noise(j+row+variant)-.5)*.045);
    }
    for(let row=0;row<3;row++)for(let j=0;j<8;j++){const a=row*8+j,b=row*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,c,b,a,d,c);}
    for(let j=1;j<7;j++){indices.push(0,j,j+1,24,24+j+1,24+j);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
    const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
  });}
  function own(g){floorGeometries.add(g);return g;}
  function mat(color,metalness=0,roughness=.8,extra={}){const m=new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});floorMaterials.add(m);return m;}
  function weather(m){return applyStoneSurface(m,stoneSurface);}
  function mesh(parent,g,m,pos=[0,0,0],scale=[1,1,1],rotation=null){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);if(rotation)o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function block(parent,m,pos,scale,rotation=null){return mesh(parent,bevel(),m,pos,scale,rotation);}
  function casting(parent,m,pos,scale,rotation=null){return mesh(parent,rounded(),m,pos,scale,rotation);}
  function lathe(parent,profile,m,pos=[0,0,0],rotation=null,segments=40){
    return mesh(parent,own(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments)),m,pos,[1,1,1],rotation);
  }
  function pipe(parent,points,r,m){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    return mesh(parent,own(new THREE.TubeGeometry(curve,Math.max(12,points.length*7),r,8,false)),m);
  }
  function radial(o,a,r,y){o.position.set(Math.sin(a)*r,y,Math.cos(a)*r);o.rotation.y=a;return o;}
  function beam(parent,a,b,r,m){tempA.set(...a);tempB.set(...b);const d=tempB.clone().sub(tempA);const o=mesh(parent,cylinder(),m,tempA.clone().add(tempB).multiplyScalar(.5).toArray(),[r,d.length(),r]);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
  // A curved, solid annular ledge. Exact angular edges preserve the simulation's x extents.
  function sector(inner,outer,angle,height){
    const steps=Math.max(3,Math.ceil(angle*20)),vertices=[],indices=[];
    for(let i=0;i<=steps;i++){const a=-angle/2+angle*i/steps;for(const y of [0,height])for(const r of [inner,outer])vertices.push(Math.sin(a)*r,y,Math.cos(a)*r);}
    for(let i=0;i<steps;i++){const a=i*4,b=(i+1)*4;for(const [p,q,r,s]of [[a+2,a+3,b+3,b+2],[a,b,b+1,a+1],[a+1,b+1,b+3,a+3],[a,a+2,b+2,b]])indices.push(p,q,r,p,r,s);}
    const end=steps*4;indices.push(0,1,3,0,3,2,end,end+2,end+3,end,end+3,end+1);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return own(g);
  }
  function ring(parent,r,tube,m,y,arc=TAU){const g=own(new THREE.TorusGeometry(r,tube,6,Math.max(20,Math.ceil(arc*16)),arc));const o=mesh(parent,g,m,[0,y,0]);o.rotation.x=Math.PI/2;return o;}
  function instanced(parent,g,m,items){const o=new THREE.InstancedMesh(g,m,items.length);items.forEach((s,i)=>{dummy.position.set(...s.p);dummy.rotation.set(...(s.r||[0,0,0]));dummy.scale.set(...(s.s||[1,1,1]));dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);if(s.c!==undefined)o.setColorAt(i,tint.set(s.c));});o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function at(a,r,y,s,c){return{p:[Math.sin(a)*r,y,Math.cos(a)*r],r:[0,a,0],s,c};}
  function batchRigid(root,excluded=new Set()){
    // Flatten only rigid descendants. Animated roots, snapshot roots and stateful
    // indicators are explicit boundaries. Large existing instances stay instanced.
    root.updateWorldMatrix(true,true);
    const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),batches=new Map(),retired=[];
    const local=new THREE.Matrix4(),instance=new THREE.Matrix4();
    function collect(o){
      if(o!==root&&excluded.has(o))return;
      if(o.isMesh&&!Array.isArray(o.material)&&(!o.isInstancedMesh||(o.count<=100&&!o.instanceColor))){
        const id=`${o.material.uuid}:${o.castShadow}:${o.receiveShadow}`;
        if(!batches.has(id))batches.set(id,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,parts:[]});
        const b=batches.get(id);local.multiplyMatrices(inverse,o.matrixWorld);
        // Rigid batching previously erased the authoring mesh name. The
        // original portrait film revealed an opaque ring in floor:8's generic
        // buffer batch, making physical ownership impossible to diagnose.
        // Retain compact face RANGES, not one identifier per triangle.
        const authoringPath=originalMeshPath(o,root);
        if(o.isInstancedMesh){
          for(let i=0;i<o.count;i++){
            o.getMatrixAt(i,instance);
            b.parts.push({g:o.geometry,m:new THREE.Matrix4().multiplyMatrices(local,instance),
              authoringPath,authoringGeometry:o.geometry.type||'BufferGeometry',authoringInstance:i});
          }
        }else b.parts.push({g:o.geometry,m:local.clone(),
          authoringPath,authoringGeometry:o.geometry.type||'BufferGeometry',authoringInstance:null});
        retired.push(o);
      }
      for(const child of o.children)collect(child);
    }
    collect(root);
    for(const b of batches.values()){
      // Each original rigid part may be indexed (boxes, lathed supports,
      // sectors) or already expanded (extrusions). Preserve part triangle
      // order, so Three.Raycaster.faceIndex still resolves the ORIGINAL
      // source authoring range, regardless of the GPU buffer representation.
      let expandedCount=0,uniqueCount=0;
      for(const p of b.parts){
        expandedCount+=p.g.index?p.g.index.count:p.g.attributes.position.count;
        uniqueCount+=p.g.attributes.position.count;
      }
      // Profiling of original Floor9 WebGL returns found ~459-712ms inside
      // renderer.render, versus ~124-142ms world CPU rebuild. A rigid batch
      // must not upload 3 copies of every shared vertex just to remove draw
      // calls. The original payload is 8 float32s per expanded vertex.
      // Choose indexed geometry ONLY when actual attribute+index bytes shrink;
      // unindexed sculptural parts avoid the extra index GPU overhead.
      const indexBytes=uniqueCount<=65535?2:4;
      const useIndexed=uniqueCount*32+expandedCount*indexBytes<expandedCount*32;
      const vertexCount=useIndexed?uniqueCount:expandedCount;
      // A single packed vertex stream shares one WebGL array buffer across
      // source position, normal and UV attributes. Preserve the exact face
      // index/authoring order and avoid three cold per-floor buffer uploads.
      const packed=new Float32Array(vertexCount*8);
      const indices=useIndexed
        ? (indexBytes===2?new Uint16Array(expandedCount):new Uint32Array(expandedCount))
        : null;
      const v=new THREE.Vector3(),n=new THREE.Vector3(),
        normalMatrix=new THREE.Matrix3();
      let vertexAt=0,faceAt=0;
      const originalTriangleOwners=[];
      for(const p of b.parts){
        const a=p.g.attributes,index=p.g.index,
          sourceVertexCount=a.position.count,
          triangleIndices=index?index.count:sourceVertexCount;
        normalMatrix.getNormalMatrix(p.m);
        originalTriangleOwners.push({
          startFace:faceAt/3,endFace:(faceAt+triangleIndices)/3,
          authoringPath:p.authoringPath,
          authoringGeometry:p.authoringGeometry,
          authoringInstance:p.authoringInstance,
        });
        if(useIndexed){
          // Transform each SOURCE vertex once. The contiguous local index
          // segment still emits precisely the same triangle ordering.
          for(let i=0;i<sourceVertexCount;i++){
            v.fromBufferAttribute(a.position,i).applyMatrix4(p.m);
            const offset=(vertexAt+i)*8;
            packed[offset]=v.x;packed[offset+1]=v.y;packed[offset+2]=v.z;
            if(a.normal)n.fromBufferAttribute(a.normal,i)
              .applyNormalMatrix(normalMatrix);
            else n.set(0,1,0);
            packed[offset+3]=n.x;packed[offset+4]=n.y;packed[offset+5]=n.z;
            if(a.uv){
              packed[offset+6]=a.uv.getX(i);
              packed[offset+7]=a.uv.getY(i);
            }
          }
          for(let i=0;i<triangleIndices;i++)
            indices[faceAt+i]=vertexAt+(index?index.getX(i):i);
          vertexAt+=sourceVertexCount;
        }else{
          // Non-indexed fallback for parts where an index buffer would cost
          // MORE real upload memory. Preserve the previous exact face order.
          for(let i=0;i<triangleIndices;i++){
            const j=index?index.getX(i):i;
            v.fromBufferAttribute(a.position,j).applyMatrix4(p.m);
            const offset=(vertexAt+i)*8;
            packed[offset]=v.x;packed[offset+1]=v.y;packed[offset+2]=v.z;
            if(a.normal)n.fromBufferAttribute(a.normal,j)
              .applyNormalMatrix(normalMatrix);
            else n.set(0,1,0);
            packed[offset+3]=n.x;packed[offset+4]=n.y;packed[offset+5]=n.z;
            if(a.uv){
              packed[offset+6]=a.uv.getX(j);
              packed[offset+7]=a.uv.getY(j);
            }
          }
          vertexAt+=triangleIndices;
        }
        faceAt+=triangleIndices;
      }
      const g=own(new THREE.BufferGeometry());
      const vertexBuffer=new THREE.InterleavedBuffer(packed,8);
      g.setAttribute('position',new THREE.InterleavedBufferAttribute(vertexBuffer,3,0));
      g.setAttribute('normal',new THREE.InterleavedBufferAttribute(vertexBuffer,3,3));
      g.setAttribute('uv',new THREE.InterleavedBufferAttribute(vertexBuffer,2,6));
      if(indices)g.setIndex(new THREE.BufferAttribute(indices,1));
      rigidBatchCount++;
      rigidPackedVertexBuffers++;
      rigidPriorSeparateVertexBuffers+=3;
      if(indices)rigidIndexedBatches++;
      rigidExpandedBytes+=expandedCount*32;
      rigidUploadBytes+=packed.byteLength+(indices?.byteLength||0);
      // The source triangle owner is NOT a vertex index: faceIndex is the
      // ordinal of the indexed or non-indexed triangle in both representations.
      g.userData.originalTriangleOwners=originalTriangleOwners;
      g.computeBoundingSphere();
      const o=mesh(root,g,b.material);
      o.name='rigid-material-batch';
      o.castShadow=b.cast;o.receiveShadow=b.receive;
    }
    for(const o of retired){o.removeFromParent();if(o.isInstancedMesh)o.dispose();}
  }
  // batchRigid removes the ORIGINAL clock-case meshes and replaces them with
  // merged rigid-material meshes. A clock face registered before batching
  // otherwise raycasts DETACHED objects while the actual opaque dial still
  // renders across the guardian. Rebind to the rendered, post-batch geometry
  // by its private, clock-owned materials. No collider, new draw or shader.
  function bindRenderedClockFaceRayMeshes(){
    if(!floorGroup)return 0;
    floorGroup.updateWorldMatrix(true,true);
    const faces=new Map();
    for(const entry of foregroundGears){
      if(!entry.sceneryMaterials?.length)continue;
      entry.sceneryMeshes=[];
      for(const material of entry.sceneryMaterials)faces.set(material,entry);
    }
    floorGroup.traverse(object=>{
      if(!object.isMesh||Array.isArray(object.material))return;
      const entry=faces.get(object.material);
      if(entry)entry.sceneryMeshes.push(object);
    });
    return [...foregroundGears].reduce((count,entry)=>
      count+(entry.sceneryMeshes?.length||0),0);
  }
  function finishBatches(){
    const boundaries=new Set([particles,vistaGroup,...platforms.values()].map(e=>e?.root||e).filter(Boolean));
    // Animated guardian gates are floor-owned siblings of the traversable
    // cap, not part of its exact collision-aligned top geometry. Preserve
    // their skinned/hinged scene nodes across the static floor merge.
    for(const p of platforms.values())if(p.guardianGate)boundaries.add(p.guardianGate.frame);
    for(const e of hazards.values())boundaries.add(e.root);
    for(const r of rotors){boundaries.add(r.o);batchRigid(r.o);}
    // Do not merge this non-colliding rack into the generic floor batch: it
    // needs its OWN camera-responsive materials and real attached ray meshes.
    for(const entry of foregroundRacks){batchRigid(entry.root);boundaries.add(entry.root);}
    for(const f of floaters)boundaries.add(f.o);
    for(const p of platforms.values()){
      // The source-driven gear pair and piston are dynamic INSTANCE batches;
      // never bake their observed motion into the static platform mesh.
      if(p.traveler)batchRigid(p.traveler);
      if(p.countergear)batchRigid(p.countergear);
      if(p.actuator)batchRigid(p.actuator);
      batchRigid(p.root,new Set([p.traveler,p.countergear,p.actuator,p.gearVisual].filter(Boolean)));
    }
    for(const e of hazards.values()){
      batchRigid(e.live,new Set(e.spin?[e.spin]:[]));
      batchRigid(e.root,new Set([e.live,e.indicator]));
    }
    batchRigid(floorGroup,boundaries);
    // Original unique source buffers are no longer needed after rigid merging.
    const used=new Set();floorGroup.traverse(o=>{if(o.geometry)used.add(o.geometry);});
    for(const g of floorGeometries)if(!used.has(g)){g.dispose();floorGeometries.delete(g);}
  }
  function conformDanger(live,width,height,spin){
    // Tangent-plane boxes grow in angular width at their rear edge. Bake the
    // active pieces into the exact authoritative arc and vertical interval.
    // Stationary plinths and frame hardware remain outside the lethal volume.
    batchRigid(live,new Set(spin?[spin]:[]));
    for(const o of live.children){
      if(!o.isMesh||o===spin)continue;
      const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
      for(let i=0;i<p.count;i++){
        const x=Math.max(-width*.5,Math.min(width*.5,p.getX(i))),y=Math.max(0,Math.min(height,p.getY(i))),r=25+p.getZ(i),a=x/25,c=Math.cos(a),s=Math.sin(a);
        const nx=n.getX(i)*25/r,ny=n.getY(i),nz=n.getZ(i);
        tempA.set(c*nx+s*nz,ny,-s*nx+c*nz).normalize();n.setXYZ(i,tempA.x,tempA.y,tempA.z);
        p.setXYZ(i,s*r,y,c*r-25);
      }
      p.needsUpdate=true;n.needsUpdate=true;o.geometry.computeBoundingSphere();
    }
  }
  function gear(parent,r,thickness,m){
    // This is DECORATIVE clockwork, not the source-owned moving-deck drive.
    // A private floor-owned alloy lets ONLY a physically blocking foreground
    // rotor soften instead of making the entire tower translucent or hiding
    // meaningful combat geometry. No extra geometry, lights or shader passes.
    const alloy=m.clone();
    // Even the small hub must fade with its teeth, otherwise a bright opaque
    // axle still cuts through the skinned climber after the silhouette clears.
    const trim=materials.edge.clone();
    trim.name='SightlineResponsiveDecorativeTrim';
    trim.transparent=true; trim.opacity=1; trim.depthWrite=true;
    floorMaterials.add(trim);
    alloy.name='SightlineResponsiveDecorativeAlloy';
    alloy.transparent=true;
    alloy.opacity=1;
    alloy.depthWrite=true;
    floorMaterials.add(alloy);
    const shape=new THREE.Shape(),teeth=14;for(let i=0;i<teeth*4;i++){const a=i/teeth/4*TAU,rad=r*(i%4===0||i%4===3?.84:1);const x=Math.sin(a)*rad,y=Math.cos(a)*rad;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
    // An opaque annular plate in each real rotor could still fill the guardian
    // shot even after the outer giant rim was given actual daylight gaps.
    // The toothed ring is mounted at its perimeter, not across the hub:
    // the complete centre stays physically open for guardian action sightlines.
    // All three original decorative machines keep their genuine rotation.
    const hole=new THREE.Path();hole.absarc(0,0,r*.72,0,TAU,true);shape.holes.push(hole);
    const g=own(new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.06,bevelThickness:.04,bevelSegments:1,steps:1,curveSegments:18}));
    const root=new THREE.Group();root.name='CameraResponsiveDecorativeGear';parent.add(root);
    mesh(root,g,alloy,[0,0,-thickness/2]);
    // The previous four diameter-spanning crossbars ran through the hollow
    // centre of every rotor. A real portrait camera could still find an
    // opaque bar across the climber even though the extruded ring had a hole.
    // Make this a supported ANNULAR drive instead: eight short alloy shoes
    // transfer torque at the load ring, with four perimeter bearing rollers.
    // No rotating material enters the central .72r daylight aperture.
    // All parts retain their original 3D animation and owned sightline alpha.
    for(let i=0;i<8;i++){
      const angle=i*TAU/8;
      block(root,alloy,
        [Math.cos(angle)*r*.87,Math.sin(angle)*r*.87,0],
        [r*.24,r*.105,thickness],[0,0,angle]);
    }
    for(let i=0;i<4;i++){
      const angle=(i+.5)*TAU/4;
      mesh(root,cylinder(),trim,
        [Math.cos(angle)*r*.90,Math.sin(angle)*r*.90,0],
        [r*.095,thickness*1.6,r*.095],[Math.PI/2,0,0]);
    }
    const entry={root,alloy,trim,radius:r*1.55,
      sceneryMaterials:[],sceneryMeshes:[],sceneryParent:null};
    foregroundGears.push(entry);decorativeSightlines.push(entry);
    return root;
  }
  function arch(parent,a,y,size=1){const root=new THREE.Group();radial(root,a,22.65,y);parent.add(root);
    root.name = 'ruins-carved-portal';
    // True curved aperture. The darkness follows the intrados instead of
    // leaving a rectangular void behind a row of large rounded cubes.
    const opening=new THREE.Shape();
    opening.moveTo(-1.80,.06); opening.lineTo(1.80,.06); opening.lineTo(1.80,3.72);
    for(let i=0;i<=24;i++){
      const angle=Math.PI*i/24;
      opening.lineTo(Math.cos(angle)*1.80,3.72+Math.sin(angle)*1.80);
    }
    opening.closePath();
    const recess=own(new THREE.ExtrudeGeometry(opening,{depth:.22,bevelEnabled:false,steps:1,curveSegments:24}));
    mesh(root,recess,materials.dark,[0,0,-.28],[size,size,1]);

    // Eleven identical, actual tapered stone wedges. A narrow radial joint
    // separates neighboring stones; no box corners cut into the opening.
    // The existing rigid batching folds them into the floor's material batch.
    const wedges=[];
    for(let i=0;i<11;i++) wedges.push({
      p:[0,3.72*size,.12],r:[0,0,(i+.5)*Math.PI/11],s:[size,size,size],
    });
    instanced(root,geometry('ruins-carved-voussoir',()=>createCarvedVoussoirGeometry(THREE)),materials.portalStone,wedges);
    ruinsPortalVoussoirs=wedges.length;

    // Irregular eroded pier stones keep the spring lines load-bearing while
    // sharing the same quiet, weathered limestone as the arch, not Lego caps.
    const jamb=[];
    for(const side of [-1,1])for(let i=0;i<5;i++)jamb.push({
      p:[side*2.13*size,(.39+i*.74)*size,.12],
      r:[0,0,side*(i%3-1)*.008],s:[.73*size,.69*size,.78*size],
    });
    instanced(root,chipped(2),materials.portalStone,jamb);

    // Inset patinated bronze leaves replace the featureless void and floating
    // luminous line. All detailing is shallow, non-emissive and floor-batched:
    // no fake route marker competes with the real landing beacon.
    const studs=[];
    for (const side of [-1,1]) {
      mesh(root,own(createRuinsGateLeafGeometry(THREE,side)),materials.gate,[0,0,.08],[size,size,1]);
      ruinsGateLeaves++;
      block(root,materials.gateTrim,[side*.26*size,2.68*size,.27],[.075*size,4.5*size,.09]);
      block(root,materials.gateTrim,[side*1.43*size,2.17*size,.27],[.07*size,3.55*size,.09]);
      for(const y of [1.40,3.10])
        block(root,materials.gateTrim,[side*.85*size,y*size,.27],[1.37*size,.075*size,.09]);
      const crown=[];
      for(let i=0;i<=12;i++){
        const x=.14+1.43*i/12;
        crown.push(new THREE.Vector3(side*x*size,(3.72+Math.sqrt(1.8*1.8-x*x)-.42)*size,.27));
      }
      mesh(root,own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crown),18,.029*size,5,false)),materials.gateTrim);
      mesh(root,own(new THREE.TorusGeometry(.16*size,.027*size,6,20)),materials.gateTrim,
        [side*.55*size,2.45*size,.33]);
      for(const y of [1.18,2.5,3.68])studs.push({p:[side*1.43*size,y*size,.35],s:[.055*size,.055*size,.055*size]});
    }
    instanced(root,sphere(),materials.gateTrim,studs);
    return root;
  }
  function buildTower(height,openClockworkPylons=false){
    const root=floorGroup;
    // Separate load-bearing vessels leave the central climbing corridor quiet;
    // each biome's machinery belongs to the surrounding architecture.
    if(openClockworkPylons && height>30) {
      // Actual source-pinned 390x844 danger film (42873903171, 14-23s)
      // still places a massive black CENTRAL pressure-well drum behind the
      // climber and guardian, even after the three peripheral pylon bays opened.
      // The authoritative running arc is outside radius 23.4: this entire
      // pressure well is non-colliding world art, not a new route, shortcut or
      // removed hazard. Keep a true heavy foundation and crown, but connect
      // them with exposed steelwork and continuous load paths rather than an
      // opaque full-height stone cylinder through the 8->9 fighting lane.
      const lower=lathe(root,[[0,-34],[10.8,-34],[12.4,-24],
        [12.4,7.7],[10.6,9],[0,9]],materials.dark,[0,0,-3]);
      lower.name='ClockworkPressureWellRootDrum';lower.userData.structural=true;
      const upper=lathe(root,[[0,height+10],[10.6,height+10],
        [12.4,height+13],[10.2,height+25],[0,height+25]],materials.dark,[0,0,-3]);
      upper.name='ClockworkPressureWellCrownDrum';upper.userData.structural=true;
      const well=new THREE.Group();
      well.name='ClockworkOpenCentralPressureWell';
      well.position.z=-3;root.add(well);
      
      const openingBottom=9,openingTop=height+10;
      // Native source ray-witnesses identify this wall of eight high ribs as an
      // actual screen-space obstruction during the floor-eight guardian.
      // Keep five tall rear stays connected to the crown; replace the three
      // near-side complete columns with short grounded service stanchions.
      const ribs=clockworkOpenPressureRibs(height);
      const uprights=instanced(well,bevel(),materials.metal,ribs);
      uprights.name='ClockworkPressureWellEightLoadRibs';
      uprights.userData.structural=true;
      for(const y of [openingBottom+.35,openingTop-.35]){
        const collar=mesh(well,own(new THREE.TorusGeometry(10.7,.29,6,48)),
          materials.copper,[0,y,0],[1,1,1],[Math.PI/2,0,0]);
        collar.name='ClockworkPressureWellPerimeterCollar';
        collar.userData.structural=true;
      }
    } else {
      lathe(root,[[0,-34],[10.8,-34],[12.4,-24],[12.4,height+13],
        [10.2,height+25],[0,height+25]],materials.dark,[0,0,-3]).userData.structural=true;
    }
    const capStructure=clockworkCapActionClearSpan(theme,height);
    const pylons=capStructure.pylons;
    for(const [i,p]of pylons.entries()){
      const body=new THREE.Group();radial(body,p.a,p.r,0);root.add(body);body.name='tapered-structural-pylon';
      const shoulder=p.top-8;
      if(openClockworkPylons) {
        // Original 390x844 native footage at a0146896 still shows a real
        // 'tapered-structural-pylon' cutting through the living guardian.
        // Moving the SOLID shaft sideways did not create a window. Give this
        // source-owned clockwork biome a genuinely load-bearing OPEN frame.
        // The 3D model, not an opacity shader or UI overlay, owns the void.
        // All clockwork floors share the same architecture and draw budget;
        // the other four biome styles retain their original solid shafts.
        const openBase=-18, crown=shoulder+3;
        const corner=p.R*.70, height=crown-openBase;
        const plinth=lathe(body,[[0,p.bottom],[p.R*.72,p.bottom],
          [p.R*.94,p.bottom+2.5],[p.R*.93,-20.5],
          [p.R*.72,openBase],[0,openBase]],materials.stone);
        plinth.name='ClockworkOpenButtressFoundation';
        plinth.userData.structural=true;
        // The exact original portrait film at immutable 7d982af1 still
        // has giant foreground uprights over the live climber/guardian.
        // A four-post full-height cage is not an open buttress: the near
        // columns occlude both source bodies even though the centre ray is
        // clear. Keep TWO full rear load-bearing posts and TWO short near
        // plinths. The real 18-40m duel band is genuinely open towards the
        // exterior camera, without alpha tricks, fake actors or collision.
        const nearPostTop=Math.min(11,crown-8);
        const uprights=[];
        for(const sideX of [-1,1])for(const sideZ of [-1,1]){
          const top=sideZ>0?nearPostTop:crown;
          // Full rear load-bearing piers survive, but their narrow metal
          // upper profile no longer forms large repetitive foreground slabs.
          const section=sideZ>0?.52:.34;
          uprights.push({p:[sideX*corner,(openBase+top)/2,sideZ*corner],
            s:[section,top-openBase,section]});
        }
      const posts=instanced(body,bevel(),materials.stone,uprights);
        posts.name='ClockworkOpenButtressFourCornerPosts';
        posts.userData.structural=true;
        // A cantilevered crown is carried by the two rear stone piers and
        // two upper steel diagonal tension struts, not by hovering lintels.
        // Both upper braces stay near the roof, above the live action.
        for(const sideX of [-1,1]){
          beam(body,[sideX*corner,crown-2.4,-corner],
            [sideX*corner,crown-.2,corner],.18,materials.edge);
        }
        // Low diagonal knee braces read as credible weight-bearing steelwork
        // yet stay below the observed guardian action height (y ~ 20-38).
        for(const sideX of [-1,1])for(const sideZ of [-1,1]){
          const x=sideX*corner,z=sideZ*corner;
          const brace=beam(body,[x,openBase+.4,z],
            [x*.63,openBase+8.4,z],.17,materials.copper);
          brace.name='ClockworkOpenButtressKneeBrace';
          brace.userData.structural=true;
        }
        // Perimeter lintels connect the four columns. No central face,
        // opaque upper-cap slab, full-height lathed drum or cross-frame hides
        // the real actor/guardian/earned physical threshold.
        const span=corner*2+.65;
        for(const edge of [-1,1]){
          block(body,materials.metal,[0,crown,edge*corner],
            [span,.37,.43]).userData.structural=true;
          block(body,materials.metal,[edge*corner,crown,0],
            [.43,.37,span]).userData.structural=true;
        }
        // A compact high mast gives the skyline a terminated load path
        // without restoring the opaque central shaft through combat.
        const crownPiece=lathe(body,[[p.R*.43,p.top-.6],
          [p.R*.51,p.top-.45],[p.R*.51,p.top+.35],
          [p.R*.43,p.top+.5]],materials.copper);
        crownPiece.name='ClockworkOpenButtressCrown';
        crownPiece.userData.structural=true;
      } else {
      lathe(body,[[0,p.bottom],[p.R*.75,p.bottom],[p.R*.96,p.bottom+2],[p.R,p.bottom+7],[p.R,shoulder],[p.R*.96,shoulder+2],[p.R*.82,shoulder+4.5],[p.R*.58,shoulder+6],[p.R*.56,shoulder+8],[0,shoulder+8]],materials.stone).userData.structural=true;
      // Each cladding bay has a curved face, inset joint and a single broad seam.
      // Three groups of bays give an architectural scale above that of the robot.
      for(const y of [-18,3,24]){
        if(y+17>shoulder)continue;
        for(let col=0;col<5;col++){
          const a=(col-2)*.39;
          mesh(body,sector(p.R+.015,p.R+.10,.35,17.6),i===2?materials.stone:materials.ceramic,[0,y,0],[1,1,1],[0,a,0]);
        }
        lathe(body,[[p.R+.03,y-.5],[p.R+.19,y-.35],[p.R+.19,y+.08],[p.R+.03,y+.23]],materials.metal);
      }
      // A rolled shoulder and narrowed neck replace the flat transverse cap.
      lathe(body,[[p.R*.92,shoulder+1.6],[p.R*.99,shoulder+2],[p.R*.96,shoulder+2.6],[p.R*.86,shoulder+3.8]],materials.metal);
      lathe(body,[[p.R*.55,p.top-.9],[p.R*.65,p.top-.75],[p.R*.65,p.top-.3],[p.R*.55,p.top]],materials.copper);
      const channels=[];
      for(const side of [-1,1]){
        const a=side*1.09;
        channels.push(at(a,p.R+.12,(p.bottom+shoulder)*.5,[.24,shoulder-p.bottom-2,.24]));
      }
      instanced(body,bevel(),materials.metal,channels);
      if(i<2){
        const seal=new THREE.Group();radial(seal,i===0?.34:-.36,p.R+.16,shoulder-4);body.add(seal);
        casting(seal,materials.dark,[0,0,0],[1.8,3.4,.16]);
        for(const y of [-.9,0,.9])casting(seal,materials.copper,[0,y,.12],[1.12,.22,.12]);
      }
      }
    }
    // Far-shoulder crowns share three original above-action load ties.
    for(const link of capStructure.overheadLinks){
      const tie=beam(root,link.from,link.to,link.radius,materials.metal);
      tie.name='ClockworkCapFarShoulderOverheadTie';
      tie.userData.structural=true;
    }
    // Unequal mineral footings retain the expedition setting, but stay behind
    // the fabricated shells instead of competing with them as giant flat slabs.
    for(const [a,y,w,h,d,v]of capStructure.geology){
      const rock=new THREE.Group();radial(rock,a,16.1,y);root.add(rock);
      if(openClockworkPylons && height>30){
        // Three old floor-eight full-height geological slabs also filled
        // the portrait combat viewport. Retain mined footings and rooftop
        // stone masses, physically supported by two narrow steel ties each;
        // leave the middle action elevation genuinely open to daylight.
        // No collider or authoritative platform is represented by this art.
        const rootMass=mesh(rock,fracturedMass(v),materials.stone,
          [0,-17-y,0],[w,17,d]);
        rootMass.name='ClockworkOpenGeologyFooting';
        rootMass.userData.structural=true;
        const headMass=mesh(rock,fracturedMass(v),materials.stone,
          [0,height+15-y,0],[w*.8,6,d*.78]);
        headMass.name='ClockworkOpenGeologyRoofMass';
        headMass.userData.structural=true;
        // Replace two tall near-camera geological rails with two real rear
        // crown-bearing stays plus two short foreground base stanchions.
        // All four retain foundations; the center combat-height gap is
        // physically open without transparency or artificial victory.
        const shoulderTies=instanced(rock,bevel(),materials.metal,
          clockworkOpenGeologicalTies(height,w,d,y));
      shoulderTies.name='ClockworkOpenGeologicalSupportTies';
        shoulderTies.userData.structural=true;
      } else {
        mesh(rock,fracturedMass(v),materials.stone,[0,0,0],[w,h,d])
          .userData.structural=true;
      }
    }
    // The overhead manifold leads the eye up through a real junction between
    // the shoulders. There is no large empty lintel hanging above the route.
    pipe(root,[[-10.4,height+5,13.4],[-10.4,height+10,13.4],[-6.5,height+13,12.7],[3.5,height+13,12.7],[8.6,height+8,13.8]],.77,materials.metal).userData.structural=true;
    for(const x of [-6,0,5.1]){
      const c=mesh(root,cylinder(),materials.copper,[x,height+12.9,12.8],[1.04,.42,1.04],[0,0,Math.PI/2]);
      c.userData.ambientDetail=true;
    }
    // A recessed annular foundation visually roots the separate vertical forms.
    mesh(root,sector(14,22.3,2.75,2.1),materials.dark,[0,-26,0]).userData.structural=true;
    mesh(root,sector(20.7,22.42,2.75,.25),materials.metal,[0,-23.9,0]);
    if(theme==='foundry')buildFoundry(height);
    if(theme==='ruins')buildRuins(height);
    if(theme==='storm')buildStorm(height);
    if(theme==='clockwork')buildClockwork(height);
    if(theme==='void')buildVoid(height);
  }
  function buildFoundry(height){
    // A complete pressure furnace sits on the right shoulder. Its smaller,
    // offset silhouette preserves the Foundry identity without occupying the
    // hero-to-landing corridor or becoming the subject of the follow camera.
    const furnace=new THREE.Group();radial(furnace,.51,22,height*.62);furnace.scale.setScalar(.6);floorGroup.add(furnace);furnace.name='foundry-pressure-furnace';
    lathe(furnace,[[0,-3.5],[5.9,-3.5],[7.0,-2.9],[7.35,-2.0],[7.35,-.4],[6.94,.34],[6.35,.56],[5.83,.28],[5.64,-.28],[5.64,-1.2],[0,-1.2]],materials.dark,[0,0,0],[Math.PI/2,0,0],56).userData.structural=true;
    lathe(furnace,[[6.28,.52],[6.42,.9],[6.83,.85],[7.08,.55],[7.22,.15],[7.04,.05]],materials.ceramic,[0,0,0],[Math.PI/2,0,0],56);
    lathe(furnace,[[5.56,-.56],[5.69,-.18],[5.88,.14],[6.09,.18],[6.13,-.13],[5.87,-.58]],materials.copper,[0,0,0],[Math.PI/2,0,0],56);
    mesh(furnace,own(new THREE.TorusGeometry(5.52,.085,7,56)),materials.glow,[0,0,-.66]);
    mesh(furnace,cylinder(),materials.furnaceCore,[0,0,-1.03],[5.35,.12,5.35],[Math.PI/2,0,0]);
    // Ten curved shutters form one engineered iris. The long shapes and the
    // recessed glowing chamber establish scale without a field of tiny greebles.
    const bladeShape=new THREE.Shape();bladeShape.moveTo(1.6,-.55);bladeShape.quadraticCurveTo(3.2,-2.1,5.27,-1.5);bladeShape.absarc(0,0,5.48,-.277,.40,false);bladeShape.quadraticCurveTo(3.2,1.50,1.85,.65);bladeShape.closePath();
    const bladeGeometry=own(new THREE.ExtrudeGeometry(bladeShape,{depth:.27,bevelEnabled:true,bevelThickness:.045,bevelSize:.045,bevelSegments:2,steps:1,curveSegments:10}));
    const iris=new THREE.Group();iris.position.z=-.58;furnace.add(iris);
    for(let i=0;i<10;i++)mesh(iris,bladeGeometry,materials.metal,[0,0,i*.018],[1,1,1],[0,0,i/10*TAU]);
    rotors.push({o:iris,speed:.018});
    lathe(furnace,[[1.65,-.48],[1.85,-.26],[1.94,-.08],[1.94,.10],[1.65,.13]],materials.copper,[0,0,0],[Math.PI/2,0,0],40);
    mesh(furnace,sphere(),materials.furnaceCore,[0,0,-.73],[1.57,1.57,.28]);
    for(const y of [-.65,0,.65])casting(furnace,materials.dark,[0,y,-.32],[y===0?3.0:2.55,.13,.15]);
    const clips=[];for(let i=0;i<8;i++){
      const a=(i+.5)/8*TAU;
      clips.push({p:[Math.sin(a)*6.75,Math.cos(a)*6.75,.46],r:[0,0,-a],s:[.74,1.65,.68]});
    }
    instanced(furnace,rounded(),materials.metal,clips);
    // One asymmetrical bonnet above the iris and two graceful cast feet make
    // the mechanism a connected place, rather than a symbol on a wall.
    casting(furnace,materials.ceramic,[-1.0,8.05,-1.8],[9.2,2.8,3.8]);
    casting(furnace,materials.dark,[-1.0,8.1,.12],[7.2,1.1,.25]);
    const slots=[];for(let i=0;i<9;i++)slots.push({p:[-4.1+i*.77,8.12,.3],s:[.33,.67,.12]});instanced(furnace,rounded(),materials.copper,slots);
    for(const x of [-4.65,4.65]){
      pipe(furnace,[[x,-5.2,-.8],[x*1.25,-8.5,-1.3],[x*1.5,-10.1,-2.1],[x*1.5,-14,-2.1]],.72,materials.metal).userData.structural=true;
      lathe(furnace,[[.77,-.3],[1.02,-.2],[1.02,.3],[.77,.42]],materials.copper,[x*1.5,-10.8,-2.1]);
    }
    // Circuit pipes move with their actual connection points on the furnace.
    pipe(furnace,[[-6.975,-10.8,-2.1],[-10,-10.8,-3.4],[-11,-15,-5.2],[-11,-40,-5.2]],.7,materials.copper);
    pipe(furnace,[[6.2,4,-1.4],[9,7,-3],[10,12,-4],[10,38,-4]],.8,materials.metal);
    // The tall offset chimney gives the sector an upward destination.
    const stack=new THREE.Group();radial(stack,-.61,16.8,height+10);floorGroup.add(stack);
    lathe(stack,[[0,0],[1.6,0],[1.7,2],[1.27,4],[1.27,13],[1.0,14],[0,14]],materials.dark);
    lathe(stack,[[1.25,10.8],[1.5,11],[1.5,12.2],[1.25,12.5]],materials.copper);
    for(let i=0;i<5;i++){const a=i/5*TAU;mesh(stack,sector(1.42,1.6,.37,3.1),materials.ceramic,[0,11.8,0],[1,1,1],[0,a,0]);}
    // A quiet recessed service bay makes scale legible below the great machine.
    const service=new THREE.Group();radial(service,.03,18.8,-4.5);floorGroup.add(service);
    casting(service,materials.metal,[0,0,0],[6.8,4.8,1.1]);casting(service,materials.dark,[0,.1,.56],[5.6,3.5,.14]);
    for(const x of [-1.8,0,1.8])casting(service,materials.ceramic,[x,.05,.68],[1.35,2.7,.14]);
    casting(service,materials.copper,[0,-1.75,.68],[5.4,.18,.16]);
  }
  // A cohesive hero environment rather than incremental portal decoration:
  // three monumental, hollow chambers at distinct elevations, carved veins,
  // hanging terraces and a cool cascade. All are presentation-only, behind the
  // authoritative 22.4..27.18 platform corridor. The real route stays legible.
  function buildRuinsSanctuary(height) {
    const stone = geometry('ruins-cloister-open-sanctuary', () => createRuinsSanctuaryArchGeometry(THREE));
    const arcade = [
      { angle: -.58, radius: 20.42, y: 4.6, scale: 1.08 },
      { angle: -.29, radius: 20.25, y: 25.0, scale: .90 },
      { angle: .52, radius: 20.20, y: -3.5, scale: .97 },
    ];
    const roots=[],leaves=[];
    function plantWorld(bay,x,y,z){
      const c=Math.cos(bay.angle),s=Math.sin(bay.angle);
      return [s*(bay.radius+z)+c*x, bay.y+y, c*(bay.radius+z)-s*x];
    }
    for (const [index, bay] of arcade.entries()) {
      const root = new THREE.Group();
      radial(root, bay.angle, bay.radius, bay.y);
      root.name = 'ruins-grand-sanctuary-bay';
      floorGroup.add(root);
      const s = bay.scale;
      const facade = mesh(root, stone, materials.sanctuaryStone, [0,0,0], [s,s,1]);
      facade.userData.ambientDetail=true;
      // Two deep recessed intrados bands follow the same arch curve. These
      // create true directional depth when seen at 3/4 camera angles.
      const ribs=[];
      for(let step=0;step<=18;step++) {
        const a=Math.PI*step/18;
        ribs.push(new THREE.Vector3(Math.cos(a)*2.55*s,(7.55+Math.sin(a)*3.58)*s,.72));
      }
      const frame=mesh(root,own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribs),32,.09*s,6,false)),materials.gateTrim);
      frame.userData.ambientDetail=true;
      // Recessed, non-emissive relief remains subordinate to the real landing
      // indicator. The apertures themselves are truly open in the main mesh.
      for(const x of [-3.42,3.42]) {
        const pier=mesh(root,rounded(),materials.sanctuaryStone,[x*s,2.25*s,.65],[.38*s,4.6*s,.4]);
        pier.userData.ambientDetail=true;
        for(const level of [.45,1.3,2.15,3.0]) {
          const groove=mesh(root,bevel(),materials.gateTrim,[x*s,level*s,.89],[.26*s,.035*s,.065]);
          groove.userData.ambientDetail=true;
        }
      }
      const keystone=mesh(root,chipped(index),materials.sanctuaryStone,[0,11.28*s,.66],[1.35*s,1.25*s,.46]);
      keystone.userData.ambientDetail=true;
      // Broken suspended capstones and actual weight-bearing corbels establish
      // scale without adding fictional traversable floors.
      for(const x of [-3.6,3.6]) {
        const crown=mesh(root,fracturedMass(index%3),materials.sanctuaryStone,
          [x*s,12.62*s,-.05],[1.2*s,1.9*s,1.2]);
        crown.userData.ambientDetail=true;
        const bracket=mesh(root,corbel(),materials.sanctuaryStone,
          [x*s,9.68*s,.09],[.7*s,.8*s,.75]);
        bracket.userData.ambientDetail=true;
      }
      // Every garden is tied to a ledge or a cracked crown, not floating
      // evenly distributed particles. Instance counts/draws are bounded.
      for(let strand=0;strand<7;strand++) {
        const x=(-3.45+strand*1.12)*s;
        const top=(11.85+noise(index*19+strand)*1.0)*s;
        for(let step=0;step<9;step++) {
          const y=top-step*.73*s;
          const drift=Math.sin(step*.8+strand*2+index)*.2*s;
          roots.push({p:plantWorld(bay,x+drift,y,.74),r:[0,bay.angle,0],s:[.056*s,.85*s,.07]});
          for(const side of [-1,1]) {
            const leaf={p:plantWorld(bay,x+drift+side*.30*s,y+.11*s,.8),s:[.49*s,.19*s,.32*s],
              r:[0,bay.angle,side*(.4+noise(step+strand*4)*.2)]};
            leaves.push(leaf);
          }
        }
      }
      ruinsSanctuaryArches++;
    }
    ruinsSanctuaryPlants=leaves.length;
    // The cliff is wet and inhabitable: two subdued, sculpted streams emerge
    // from the broken aqueduct shoulder. No new colliders, shadows, or lights.
    // Not a glowing path cue: the cascade is physically behind the gameplay.
    for (const [i,a] of [-.86,-.74].entries()) {
      const root=new THREE.Group();radial(root,a,20.36,11-i*4);floorGroup.add(root);
      root.name='ruins-sanctuary-cascade';
      const width=i===0?1.7:.92, tall=i===0?20:15;
      const water=own(new THREE.PlaneGeometry(width,tall,6,38));
      const coords=water.attributes.position;
      for(let k=0;k<coords.count;k++){
        const x=coords.getX(k), y=coords.getY(k);
        coords.setZ(k,.14*Math.sin(y*.7+i*2)+.09*Math.sin(y*1.9+x*2+i));
      }
      coords.needsUpdate=true;water.computeVertexNormals();
      const sheet=mesh(root,water,materials.sanctuaryWater,[0,-tall*.48,.75]);
      sheet.userData.ambientDetail=true;
      ruinsSanctuaryCascadePanels++;
    }
    // An asymmetrical aqueduct terminates at the cascade rather than being a
    // decorative floating wall. Heavy stones are deep behind the route.
    const bridge=new THREE.Group();radial(bridge,-.80,19.15,21.7);floorGroup.add(bridge);
    bridge.name='ruins-sanctuary-broken-aqueduct';
    for(const [x,w] of [[-3.1,3.2],[1.25,2.3]]){
      const part=mesh(bridge,fracturedMass(Math.round(x+7)%3),materials.sanctuaryStone,
        [x,0,-.1],[w,1.25,2.2]);part.userData.ambientDetail=true;
    }
    return {roots,leaves};
  }

  function buildRuins(height){
    const sanctuary=buildRuinsSanctuary(height);
    const portal=arch(floorGroup,.02,7,1.9);portal.position.z-=2.3;
    // The broken aqueduct shoulder and hanging gardens occupy the two sides;
    // the dark portal remains a quiet, readable background to the moving hero.
    const broken=new THREE.Group();radial(broken,.85,20.2,22);floorGroup.add(broken);
    block(broken,materials.stone,[0,0,-.9],[8.8,2.6,4.5]).userData.structural=true;
    for(const x of [-3.5,2.7])block(broken,materials.edge,[x,-4.2,-.9],[1.9,9,3.8]);
    mesh(broken,fracturedMass(1),materials.stone,[2.9,3,-1.1],[3.6,6,4]);
    const roots=[...sanctuary.roots],leaves=[...sanctuary.leaves];
    for(let v=0;v<10;v++){
      const a=v<6?-.95+v*.075:.63+(v-6)*.08,top=v<6?height+7:28;
      for(let i=0;i<25;i++){
        const y=top-i*1.04,aa=a+Math.sin(i*.55+v)*.018,r=22.05+(v%2)*.3;
        roots.push(at(aa,r,y,[.11,1.2,.12]));
        for(const side of [-1,1]){const item=at(aa+side*.014,r+.18,y,[.75,.31,.36]);item.r[2]=side*.5;leaves.push(item);}
      }
    }
    instanced(floorGroup,geometry('vine-stem',()=>new THREE.CylinderGeometry(1,1,1,5)),materials.bark,roots);instanced(floorGroup,leaf(),materials.foliage,leaves);
    for(const [a,y]of [[-.83,9],[.82,30]]){
      const planter=new THREE.Group();radial(planter,a,21.6,y);floorGroup.add(planter);
      mesh(planter,fracturedMass(2),materials.stone,[0,-1,-.5],[5.2,3,3.4]);
      const crowns=[];for(let i=0;i<9;i++)crowns.push({p:[(noise(i)-.5)*4.2,.15+noise(i+20)*.65,noise(i+30)*1.6-1],s:[1.8,.6,1.2]});instanced(planter,sphere(),materials.foliage,crowns);
    }
    // The closed gate is an architectural feature; the true landing remains
    // the only high-contrast traversal marker in this scene.
  }
  function buildStorm(height){
    const engine=new THREE.Group();radial(engine,.08,18.7,21);floorGroup.add(engine);
    block(engine,materials.dark,[0,0,-.7],[12.5,14,3]).userData.structural=true;
    mesh(engine,own(new THREE.TorusGeometry(5.1,.55,8,40)),materials.metal,[0,0,1.1]);
    mesh(engine,own(new THREE.TorusGeometry(4.55,.1,5,40)),materials.glow,[0,0,1.15]);
    const blades=new THREE.Group();blades.position.z=1.2;engine.add(blades);
    mesh(blades,cylinder(),materials.dark,[0,0,0],[4.45,.3,4.45],[Math.PI/2,0,0]);
    for(let i=0;i<7;i++){const a=i/7*TAU;block(blades,materials.edge,[Math.cos(a)*2.5,Math.sin(a)*2.5,.22],[3.4,.9,.2],[0,0,a+.4]);}
    mesh(blades,sphere(),materials.metal,[0,0,.48],[1.1,1.1,.45]);rotors.push({o:blades,speed:.23});
    for(const x of [-5.7,5.7]){
      block(engine,materials.metal,[x,1,.2],[1,16,1.2]);
      for(const y of [-5,0,5])mesh(engine,cylinder(),materials.edge,[x,y,.8],[.8,.32,.8]);
    }
    const mast=new THREE.Group();radial(mast,-.8,20.4,height+5);floorGroup.add(mast);
    mesh(mast,cylinder(),materials.metal,[0,0,0],[.35,20,.35]);
    beam(mast,[-5,5,0],[5,5,0],.2,materials.copper);
    const vanes=[];for(let i=0;i<5;i++)vanes.push({p:[-4+i*2,3.8,.1],s:[.35,2.8,1.6],r:[0,0,.1]});instanced(mast,bevel(),materials.edge,vanes);
    mesh(mast,cone(),materials.glow,[0,11,0],[.2,2,.2]);
  }
  // Authored clockwork clock CASES are now open portal frames rather than
  // world-sized opaque plates. Actual 390x844 source-pinned guardian footage
  // at 100b67fd, native 17-19s, showed the upper satellite's steel rim and
  // solid brown backing burying the skinned climber, despite gear-alpha rays.
  // These supports are purely decorative and carry no physics/colliders.
  // Keep rotating gears, the complete monumental silhouettes, and their
  // post-batch camera-sightline-owned materials, but restore empty space so
  // real combat can be read BETWEEN the physical ribs.
  // The source-pinned portrait guardian film showed a near-camera steel
  // wheel/case covering the real climber. Transparency alone cannot make a
  // continuous metal circumference into a reliable action sightline. Retain
  // the monumental silhouette but use four real radial daylight apertures,
  // shared by BOTH concentric structural rings. No collider, hazard or
  // source-authoritative geometry is changed by these decorative surfaces.
  function openClockRim(parent,radius,tube,material,depth) {
    for(const section of observedClockworkRimApertures()){
      const fragment=mesh(parent,
        own(new THREE.TorusGeometry(radius,tube,7,20,section.arc)),
        material,[0,0,depth],[1,1,1],[0,0,section.start]);
      fragment.name='clockwork-open-rim-fragment';
      fragment.userData.ambientDetail=true;
      fragment.castShadow=false;
    }
  }
  function openClockCase(parent,width,height) {
    const postWidth=width*.11,railHeight=height*.095;
    for(const side of [-1,1]){
      // The side columns physically frame an OPEN view of the same rotating
      // mechanism; braces stop short of the live central action aperture.
      block(parent,materials.dark,[side*(width-postWidth)*.5,0,-.7],
        [postWidth,height,1.1]);
      for(const level of [-1,1]){
        block(parent,materials.dark,
          [side*width*.32,level*(height-railHeight)*.5,-.7],
          [width*.36,railHeight,1.1]);
      }
      block(parent,materials.edge,[side*(width*.46),0,-.06],
        [.10,height*.72,.12]);
    }
  }
  function buildClockwork(height){
    // P0 camera-occlusion correction from original 390x844 guardian footage:
    // three *decorative*, non-colliding clocks were still silhouetted against
    // the skinned hero and live guardian despite screen-opacity recovery.
    // Stage their large steel rims and the independent 42-unit power rack on
    // the FAR shoulders of the same continuous cylindrical tower. Each
    // silhouette's angular half-width now sits outside the ±1.1 radian
    // source-authoritative climbing/upper-cap action corridor. This is real
    // world geometry (not camera HUD, x-ray, teleport, or hidden hazard).
    // Keep the original rotor mechanics, parallax, materials, draw budget and
    // all unchanged physical routes, guardian, gate and gameplay snapshots.
    // Source-pinned 390x844 guardian footage at 994541e4 still shows this
    // massive non-colliding wheel swallowing the real hero/guardian shot at
    // ~14–18s. Rebuild its physical hierarchy BELOW the real cap approach,
    // rather than adding another conditional transparency rule. The original
    // rim, animated rotor, daylight openings and materials remain in 3D.
    // Native 390x844 guardian video at 62e18f7e still has the monumental
    // decorative rotor occupying the live fight around seconds 14-18 while
    // the climber and guardian appear tiny. Its position is non-colliding
    // scenery: lower the drive behind the approach and reduce its REAL 3D
    // silhouette instead of waiting for a translucent material policy.
    // Keep the original moving teeth and support shafts, but allow generous
    // architectural daylight around the authoritative upper-cap encounter.
    // Exact source 8448e2c, run 42695480406, retains a large ring dominating
    // the genuine 390x844 guardian film at second 15 despite y=-8.5 staging.
    // Move the whole NON-COLLIDING mechanical drive to the structural base,
    // not another camera-fade trick. Preserve its animated original parts and
    // the separate high-right vertical landmark; do not change game rules.
    const clock=new THREE.Group();radial(clock,-2.49,19.2,-39);
    // Move the whole rotating non-colliding lower transmission physically
    // BELOW the first visible combat decks. The full bronze rim and open
    // gear remain in the world, but cannot dominate the lived cap duel.
    clock.scale.set(.35,.35,.35);
    clock.name='clockwork-monumental-left-shoulder';
    floorGroup.add(clock);
    openClockCase(clock,14,16);
    // Interrupted load-bearing rings share genuine gaps; do not re-cover the
    // climber by offsetting one continuous ring across another's openings.
    openClockRim(clock,6.4,.45,materials.copper,.9);
    openClockRim(clock,5.8,.11,materials.edge,1);
    const markers=[];for(let i=0;i<12;i++){const a=i/12*TAU;markers.push({p:[Math.sin(a)*5.45,Math.cos(a)*5.45,1],s:[.2,.65,.16],r:[0,0,-a]});}instanced(clock,bevel(),materials.edge,markers);
    const main=gear(clock,4.8,.45,materials.copper);main.position.z=1.2;rotors.push({o:main,speed:.045});
    // Stage the three real decorative machines as a low left mechanism,
    // reduced central monument and high right landmark. Their angular and
    // height separation leaves real negative space at the cap encounter.
    // Source-pinned 590f4dc6 candidate portrait danger WebM at native ~15s
    // still showed a giant steel hoop and case across live floor-eight
    // guardian combat. Earlier passes lowered the main drive and rack, but
    // left the HIGH satellite centred at y=35.5: directly in the genuine
    // upper-cap fighting band. Keep the third rotating mechanism and its
    // distinct right-shoulder landmark while lifting the entire authored
    // gear/case hierarchy above the cap, and reduce its solid projected mass.
    // This is real non-colliding architecture, never a visibility override of
    // the source guardian, crusher, platform, gateway, or walkable threshold.
    // The lower and main drive retain the foreground mechanical hierarchy.
    // The separate low clutch remains below the middle drive, and both
    // stay below source-owned climbing and upper-cap combat lanes. The high
    // right rotor still marks the tower's vertical scale.
    for(const [a,y,size,speed,scale]of [[-2.20,-48,3.6,-.11,.74],[2.34,height+19,3.1,.15,.54]]){
      const root=new THREE.Group();radial(root,a,21.3,y);
      root.scale.setScalar(scale);floorGroup.add(root);
      root.name=y>height*.6?'clockwork-upper-right-shoulder':'clockwork-lower-left-shoulder';
      const g=gear(root,size,.42,materials.copper);rotors.push({o:g,speed});
      openClockCase(root,size*1.9,size*2.1);
      linkClockFaceScenery(foregroundGears.find(entry => entry.root===g),root,floorMaterials);
    }
    // Keep the original open, 42-unit authoring-space toothed rack, but
    // stage its rendered mass below and aside from the actual guardian arc.
    // No gameplay-driven mechanical deck or collider is affected.
    // Bury the long, open non-colliding rack's upper teeth below the cap
    // approach, while preserving its full 42-unit pitched mechanical drive.
    // The full 42-unit non-colliding rack is grounded with the lower drive,
    // outside the cap's real walking and fighting lane.
    const rack=new THREE.Group();radial(rack,-1.91,20.4,-46);
    rack.scale.set(.68,.55,.80);
    rack.name='clockwork-far-shoulder-power-rack';floorGroup.add(rack);
    // The actual forty-two-unit solid decorative rack was outside the gear
    // registry, so an orbiting camera could still see a complete opaque wall.
    // Own its two materials separately from ALL structural and lethal meshes.
    const rackFace=materials.dark.clone(),rackTeeth=materials.copper.clone();
    for(const m of [rackFace,rackTeeth]){
      m.name='SightlineResponsivePowerRack';m.transparent=true;
      m.opacity=1;m.depthWrite=true;floorMaterials.add(m);
    }
    // Retain a continuous forty-two-unit high toothed mechanism without a
    // solid central steel slab covering the playable portrait corridor.
    // Two braced side rails, one INSTANCED material/draw and the existing
    // real-pitch teeth leave genuine gaps when the camera orbits this tower.
    instanced(rack,box(),rackFace,[
      {p:[-.69,0,-.2],s:[.22,42,.78]},
      {p:[ .69,0,-.2],s:[.22,42,.78]},
    ]);
    const teeth=[];for(let y=-20;y<22;y+=.85)teeth.push({p:[0,y,.5],s:[1.65,.3,.45]});instanced(rack,box(),rackTeeth,teeth);
    rack.traverse(o=>{if(o.isMesh){o.userData.ambientDetail=true;o.castShadow=false;}});
    const rackEntry={root:rack,alloy:rackFace,trim:rackTeeth,radius:22,
      sceneryMaterials:[],sceneryMeshes:[],sceneryParent:null};
    foregroundRacks.push(rackEntry);decorativeSightlines.push(rackEntry);
    for(const x of [-6.7,6.7]){mesh(clock,cylinder(),materials.metal,[x,-7,.2],[.35,20,.35]);mesh(clock,cylinder(),materials.copper,[x,-13,.2],[.75,5,.75]);}
    // Decorative dial, rim and pillars are NOT gameplay-obstacle surfaces.
    // In portrait combat their opaque backing used to defeat the existing
    // gear-only sightline protection even after the rotating teeth cleared.
    linkClockFaceScenery(foregroundGears.find(entry => entry.root===main),clock,floorMaterials);
  }
  function buildVoid(height){
    const vault=new THREE.Group();radial(vault,.03,18.4,20);floorGroup.add(vault);
    const halo=new THREE.Group();vault.add(halo);
    mesh(halo,own(new THREE.TorusGeometry(5.7,.2,6,40)),materials.crystal);
    mesh(halo,own(new THREE.TorusGeometry(6.3,.07,5,40)),materials.glow,[0,0,-.2]);
    halo.rotation.z=.32;rotors.push({o:halo,speed:.04});
    for(let i=0;i<5;i++){
      const a=i/5*TAU,crystal=mesh(vault,geometry('vault-crystal',()=>new THREE.OctahedronGeometry(1,0)),materials.crystal,[Math.sin(a)*5.8,Math.cos(a)*5.8,.3],[.65,1.4,.65],[0,0,-a]);
      floaters.push({o:crystal,y:crystal.position.y,phase:i*1.8,speed:.18});
    }
    for(const [a,y]of [[-.73,4],[.89,30]]){
      const root=new THREE.Group();radial(root,a,20.8,y);floorGroup.add(root);
      mesh(root,fracturedMass(2),materials.dark,[0,0,0],[3.9,12,3.2]);block(root,materials.glow,[0,0,1.65],[.1,9,.1]);
      for(const sign of [-1,1])mesh(root,geometry('vault-crystal',()=>new THREE.OctahedronGeometry(1,0)),materials.crystal,[sign*1.3,sign*2,1.7],[.4,1.4,.45],[0,0,sign*.25]);
    }
  }
  function buildVista(height) {
    // Three atmosphere-separated silhouettes, each already batched into one
    // shadow-free mesh. Full-wrap terrain adds scale without route occlusion,
    // 2D HUD interference, texture fetches or per-tick animation/draw growth.
    vistaGroup=new THREE.Group();vistaGroup.name='tower-canyon-vista';
    floorGroup.add(vistaGroup);
    const strata=[0,1,2].map(layer=>createVistaLayerGeometry(THREE,theme,layer,height));
    const merged=own(new THREE.BufferGeometry());
    for(const key of ['position','color']){
      const arrays=strata.map(geometry=>geometry.attributes[key].array);
      const values=new Float32Array(arrays.reduce((sum,array)=>sum+array.length,0));
      let offset=0;
      for(const array of arrays){values.set(array,offset);offset+=array.length;}
      merged.setAttribute(key,new THREE.BufferAttribute(values,3));
    }
    strata.forEach(geometry=>geometry.dispose());
    merged.computeBoundingSphere();
    const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true});
    material.name='tower-vista-atmosphere';
    floorMaterials.add(material);
    const cliffs=new THREE.Mesh(merged,material);
    cliffs.name='tower-vista-cliffs';
    cliffs.castShadow=false;cliffs.receiveShadow=false;
    vistaGroup.add(cliffs);
  }
  // Low tier still needs an expansive, unmistakably three-dimensional skyline.
  // Preserve the seven stepped towers and their supported skybridges, but replace
  // hundreds of fully lit and translucent far-field pieces with one fogged,
  // shadow-free original silhouette batch. The near playable architecture,
  // dynamic hazards, routes and three-layer canyon keep their complete geometry.
  function buildLeanDistantWorld(height){
    const color=new THREE.Color(THEMES[theme].sky).lerp(new THREE.Color(THEMES[theme].fog),.23).multiplyScalar(.5);
    const silhouette=new THREE.MeshBasicMaterial({color,fog:true});
    silhouette.name='distant-atmosphere';floorMaterials.add(silhouette);
    const tower=geometry('lean-citadel-column',()=>new THREE.CylinderGeometry(.75,1,1,7));
    const crown=geometry('lean-citadel-crown',()=>new THREE.ConeGeometry(1,1,7));
    for(let i=0;i<7;i++){
      const side=i%2?-1:1,x=side*(65+noise(i)*91),z=-96-noise(i+20)*110;
      const h=50+noise(i+30)*74;
      const root=new THREE.Group();root.name='distant-citadel-silhouette';
      root.position.set(x,-64,z);floorGroup.add(root);
      mesh(root,tower,silhouette,[0,h*.40,0],[9.5,h*.80,9.5]);
      mesh(root,tower,silhouette,[.7,h*.85,0],[7,h*.22,7]);
      mesh(root,crown,silhouette,[.7,h*.99,0],[5.6,h*.16,5.6]);
      const companionX=-side*24,companionHeight=h*.64;
      mesh(root,tower,silhouette,[companionX,companionHeight*.50,4],[6,companionHeight,6]);
      // A continuous deck with two grounded supports keeps the same skyline
      // story as high tier: the bridge does not hang in an empty sky.
      mesh(root,box(),silhouette,[companionX*.5,h*.43,2],[Math.abs(companionX),1.5,4]);
      for(const ratio of [.33,.67])mesh(root,box(),silhouette,
        [companionX*ratio,h*.215,2],[1.4,h*.43,2.3]);
    }
  }
  function buildDistantWorld(height){
    if(quality==='low'){
      buildLeanDistantWorld(height);
      // The fogged three-depth canyon already creates atmospheric separation;
      // 48 translucent overlapping spherical clouds were a large low-tier
      // fragment/overdraw expense and added no actionable route information.
      particles=null;
      return;
    }
    // Distant citadels have stepped shoulders, broken crowns and grounded companion
    // towers. Every skywalk terminates in architecture and has supports below it.
    for(let i=0;i<7;i++){
      const side=i%2?-1:1,x=side*(65+noise(i)*91),z=-96-noise(i+20)*110,h=50+noise(i+30)*74;
      const root=new THREE.Group();root.position.set(x,-64,z);floorGroup.add(root);
      for(let tier=0;tier<3;tier++){
        const base=h*tier*.29,r=9.5-tier*2.4;
        mesh(root,own(new THREE.CylinderGeometry(r-1,r,h*.34,8)),materials.distant,[tier*.7,base+h*.17,0],[1,1,.88],[0,.2+tier*.17,0]);
        for(let q=0;q<4;q++){const a=q/4*TAU+.3;mesh(root,chipped(q%3),materials.distant,[Math.sin(a)*(r-.9),base+h*.14,Math.cos(a)*(r-.9)],[1.3,h*.39,2],[0,a,.045]);}
      }
      const fins=[];for(let q=0;q<7;q++){const a=q/7*TAU;fins.push(at(a,3.6,h*.91,[.85,3+noise(q+i)*5,1.4]));}instanced(root,chipped(i%3),materials.distant,fins);
      const companionX=-side*24,companionHeight=h*.64;
      mesh(root,own(new THREE.CylinderGeometry(4.6,7.5,companionHeight,7)),materials.distant,[companionX,companionHeight*.5,4]);
      for(let q=0;q<3;q++)mesh(root,chipped(q),materials.distant,[companionX-3+q*3,companionHeight,4],[1.1,5+q,4]);
      const deckY=h*.43;
      block(root,materials.distant,[companionX*.5,deckY,2],[Math.abs(companionX),1.5,4]);
      for(const ratio of [.33,.67]){
        block(root,materials.distant,[companionX*ratio,deckY*.5,2],[1.5,deckY,3]);
        beam(root,[companionX*ratio,deckY-1,2],[companionX*(ratio+.2),deckY-7,2],.45,materials.distant);
      }
      for(const ratio of [.2,.5,.8])block(root,materials.distant,[companionX*ratio,deckY+1.1,2],[.7,1,4.6]);
    }
    const clouds=[];for(let bank=0;bank<12;bank++)for(let puff=0;puff<4;puff++){
      const side=bank%2?-1:1;
      clouds.push({p:[side*(60+noise(bank)*100)+puff*7,-27+noise(bank+21)*16+noise(puff)*2,-85-noise(bank+10)*95+puff*3],s:[10+noise(puff+bank)*8,3+noise(puff+1)*2,7+noise(puff+5)*5]});
    }
    const cloudMesh=instanced(floorGroup,sphere(),materials.cloud,clouds);cloudMesh.castShadow=false;cloudMesh.receiveShadow=false;
    const items=[];for(let i=0;i<48;i++){const a=-1.8+noise(i)*3.6,r=30+noise(i+3)*22;items.push({p:[Math.sin(a)*r,-5+noise(i+9)*(height+23),Math.cos(a)*r],s:[.035+noise(i)*.045,.035+noise(i)*.045,.035+noise(i)*.045]});}
    particles=instanced(floorGroup,sphere(),materials.particle,items);particles.userData.items=items;particles.castShadow=false;particles.receiveShadow=false;
  }
  function buildPlatform(p,width,guardianCap=false){
    const root=new THREE.Group();root.name=`platform:${p.id}`;floorGroup.add(root);
    const angle=p.width/width*ARC,h=p.height/SCALE;
    const bodyMaterial=theme==='ruins'?materials.stone:theme==='void'?materials.crystal:theme==='clockwork'?materials.copper:materials.metal;
    // REAL successor ground uses its EXISTING collision-aligned roof. While
    // the identical old bronze cap and HP-opened gate share this physical
    // threshold, gradually acclimatize only its landing material. No extra
    // platform, overlay, collider, route, vertices or gameplay clock.
    const sharedPhysicalRoof=p.id==='f9:ground' && theme==='void' &&
      retainedEarnedCap?.floor===9 &&
      retainedEarnedCap.runToken===lastSnapshot?.runToken &&
      retainedEarnedCap.originalDeckSurface?.color;
    const arrivalSurface=sharedPhysicalRoof?materials.landing.clone():null;
    if(arrivalSurface){
      arrivalSurface.name='SourceEarnedSharedPhysicalArrivalRoof';
      arrivalSurface.color.copy(retainedEarnedCap.originalDeckSurface.color);
      floorMaterials.add(arrivalSurface);
    }
    // The route is an engineered deck, not another monumental shelf. A slim
    // curved box beam, rolled edge and open rear webs leave the undercroft open.
    mesh(root,sector(22.45,27.05,angle,.48),bodyMaterial,[0,h-.64,0]).userData.structural=true;
    mesh(root,sector(22.5,26.97,angle,.10),materials.dark,[0,h-.74,0]);
    mesh(root,sector(22.4,27.18,angle,.16),arrivalSurface||materials.landing,[0,h-.16,0]);
    mesh(root,sector(27.02,27.22,angle,.095),p.kind==='moving'?materials.mint:materials.copper,[0,h-.27,0]);
    mesh(root,sector(26.99,27.13,angle,.07),bodyMaterial,[0,h-.66,0]);
    const ribs=[],treads=[],count=Math.max(2,Math.round(angle*25/2.6));
    for(let i=0;i<count;i++){
      const a=-angle/2+(i+.5)*angle/count;
      ribs.push(at(a,27.01,h-.45,[.14,.33,.27]));
      treads.push(at(a,24.9,h-.0015,[.035,.003,4.0]));
    }
    instanced(root,rounded(),bodyMaterial,ribs);instanced(root,box(),materials.tread,treads);
    const mount=new THREE.Group();mount.name='recessed-platform-mount';root.add(mount);
    const supports=angle>1.1?4:2;
    for(let i=0;i<supports;i++){
      const a=-angle*.4+(i+.5)*angle*.8/supports,brace=new THREE.Group();radial(brace,a,20.75,h-.7);mount.add(brace);
      if(p.kind==='moving'){
        casting(brace,materials.dark,[0,-.75,.25],[1.55,1.8,2.5]);
        mesh(brace,cylinder(),bodyMaterial,[0,-1.0,1.1],[.47,.24,.47],[Math.PI/2,0,0]);
        mesh(brace,cone(),materials.mint,[0,-1.9,.45],[.22,.7,.22],[0,0,Math.PI]);
      }else if(theme==='ruins'){
        mesh(brace,corbel(),materials.stone,[0,0,0],[1.35,1.05,1]).userData.structural=true;
        casting(brace,bodyMaterial,[0,-2.4,-1.4],[1.3,1,.7]);
      }else{
        mesh(brace,corbel(),bodyMaterial).userData.structural=true;
        casting(brace,materials.dark,[0,-1.05,-1.9],[.66,2.9,.42]);
      }
    }
    // Two broad ceramic corners identify a usable landing; all upper vertices
    // terminate at exactly p.y + p.height and never invent a raised collider.
    const landingMarks=[];for(const a of [-angle*.35,angle*.35])landingMarks.push(at(a,26.45,h-.009,[.16,.018,.55]));
    instanced(root,box(),p.kind==='moving'?materials.mint:materials.copper,landingMarks);
    const faceCount=Math.max(2,Math.round(angle*25/3.4));
    if(theme==='ruins'){
      const rock=[],moss=[];
      for(let i=0;i<faceCount;i++){
        const a=-angle*.45+(i+.5)*angle*.90/faceCount;
        rock.push(at(a,26.9,h-.43,[1.65,.43,.4]));
        if(i%2===0)moss.push(at(a,26.85,h-.14,[1.1,.13,.4]));
      }
      instanced(root,chipped(1),materials.stone,rock);instanced(root,sphere(),materials.foliage,moss);
    }else if(theme==='foundry'){
      // One large stamped face per bay, restrained warm seams at the rear.
      const plates=[];for(let i=0;i<faceCount;i++)plates.push(at(-angle*.43+(i+.5)*angle*.86/faceCount,27.04,h-.45,[1.6,.31,.17]));
      instanced(root,rounded(),materials.copper,plates);
    }else if(theme==='storm'){
      mesh(root,sector(27.045,27.17,angle,.045),materials.glow,[0,h-.38,0]);
    }else if(theme==='clockwork'){
      const sockets=[];for(let i=0;i<faceCount;i++)sockets.push(at(-angle*.44+(i+.5)*angle*.88/faceCount,27.08,h-.46,[.65,.26,.12]));
      instanced(root,rounded(),materials.dark,sockets);
    }else{
      const shards=[];for(let i=0;i<faceCount;i++){
        const item=at(-angle*.43+(i+.5)*angle*.86/faceCount,22.6,h-1.2,[.26,.6+noise(i)*.4,.36]);item.r[2]=.22;shards.push(item);
      }
      instanced(root,geometry('void-undercroft',()=>new THREE.OctahedronGeometry(1,0)),materials.crystal,shards);
      mesh(root,sector(27.04,27.17,angle,.05),materials.glow,[0,h-.37,0]);
    }
    // An original, physically modeled guardian seal makes the boss gate's
    // authoritative lock/unlock legible even without HUD text or sound.
    // The old seal at radius 21.8 was hidden INSIDE the solid radius-23.5
    // core from normal exterior camera sightlines. Its new cap-side mounting
    // stays behind the radius-25 skinned climber, OUTSIDE the occluding core,
    // and INSIDE the actual 22.4..27.18 walkable cap. It remains non-colliding
    // and never moves an autonomous actor or opens a source-locked floor.
    // Animated leaves are excluded from static floor batching and shadow
    // multiplication. Ordinary floors have no added portal/draw overhead.
    let guardianGate = null;
    if(guardianCap && p.id.endsWith(':cap')){
      const frame=new THREE.Group();frame.name='AuthoritativeGuardianGate';
      // Separate the decorative gate from the cap's exact collision mesh:
      // traversable platform tests, camera clearance and collision bounds
      // must see only the real walkable deck, never the towering gate facade.
      floorGroup.add(frame);
      const doorway=new THREE.Group();
      doorway.name='GuardianGateInset';
      doorway.position.z=GUARDIAN_CAP_CORRIDOR.visibleSealRadius;frame.add(doorway);
      // Real original portrait danger capture 9924ca01 showed the outer gate's
      // counterweights and centre pulley covering the skinned climber at 20s
      // after the secondary earned doorway had already been suppressed.
      // Build an open 3D central lock silhouette: the source barrier is still
      // the full-height electric X-frame and physical exit remains sealed in
      // authority. These lightweight piers support a high transmission bridge,
      // rather than a foreground mechanical wall across the fighting lane.
      for(const side of [-1,1]){
        block(doorway,materials.dark,[side*3.38,2.37,-.24],[.28,4.78,.46]);
        block(doorway,materials.edge,[side*3.38,4.82,-.20],[.40,.16,.54]);
      }
      block(doorway,materials.dark,[0,4.86,-.26],[7.05,.20,.46]);
      const wings=[];
      for(const side of [-1,1]){
        const wing=new THREE.Group();
        wing.name=side<0?'GuardianSealWingLeft':'GuardianSealWingRight';
        // The source-visible bronze grille stays locked and perforated,
        // but sits behind the actor plane rather than projecting forward
        // over both combatant silhouettes.
        wing.position.z=-.18;doorway.add(wing);
        // Source-locked guardian doors previously were opaque 3.09 x 4.14
        // bronze slabs. Real 390x844 guardian footage shows the cap approach
        // disappearing behind them. Replace each slab with one original 3D
        // instanced structural grille: 2x2 daylight openings reveal the live
        // guardian and walking deck, while crossbars, crest and source-driven
        // energy lattice still read unmistakably LOCKED until earned defeat.
        // No display-only wall or authoritative obstacle is removed.
        const lattice=[];
        for(const [x,width] of [[.19,.16],[1.54,.105],[2.9,.16]])
          lattice.push({p:[side*x,2.13,0],s:[width,4.12,.28]});
        for(const [y,thickness] of [[.17,.14],[2.13,.11],[4.09,.14]])
          lattice.push({p:[side*1.56,y,0],s:[3.08,thickness,.28]});
        const grille=instanced(wing,bevel(),materials.copper,lattice);
        grille.name=side<0?'GuardianSealBronzeLatticeLeft':'GuardianSealBronzeLatticeRight';
        grille.userData.ambientDetail=true;
        block(wing,materials.edge,[side*2.82,2.13,.19],[.13,3.6,.075]);
        wings.push({side,wing});
      }
      // A large faceted lock is a shape cue, not color-only state feedback.
      const crest=mesh(doorway,geometry('guardian-gate-keystone',()=>new THREE.OctahedronGeometry(.52,0)),
        materials.warning,[0,4.72,.54],[1,.78,.36]);
      crest.name='ObservedGuardianLockCrest';
      // One physically attached luminous conduit travels from the lock to
      // the cap's walking lane as genuine guardian HP drops. The player can
      // read the combat-to-gate relationship even when the doors are behind
      // the guardian: one reusable bevelled mesh, no light, shadow, collider
      // or extra HUD. At full HP this is only a short inset socket.
      const conduit=block(doorway,materials.mint,[0,.07,.34],[.18,.06,.18]);
      conduit.name='GuardianEncounterConduit';
      // Paired counterweights drop as the actual guardian takes damage:
      // original, non-colliding architectural silhouettes beyond the cap.
      // No shadow multiplication, animation timers or fabricated door events.
      // The source-locked cap entrance is just 4.8m high. Authentic portrait
      // source rays in 43015360203 hit counterweight rails and cables amid
      // living guardian combat (ticks 228-429). The real winch gallery must
      // live ABOVE, not beside, the climber and guardian. Both weighted drums
      // remain genuinely coupled to source HP through the original tension
      // and capstan, while the bronze grille/door remains source-authoritative.
      const counterweights=[];
      for(const side of [-1,1]){
        // Original ca1b423c portrait film showed near-camera bronze winch over the living climber.
        // Move these entirely non-colliding counterweight galleries farther outboard,
        // rearward and higher, keeping genuine locked leaves and the source seal intact.
        // Two mechanical bays are OUTBOARD of the 6.8-wide walk-through
        // opening and behind its face, leaving clear combat air in the middle.
        block(doorway,materials.dark,[side*GUARDIAN_TRANSMISSION_LAYOUT.counterweightX,GUARDIAN_TRANSMISSION_LAYOUT.railCenterY,GUARDIAN_TRANSMISSION_LAYOUT.rearDepth],[.28,GUARDIAN_TRANSMISSION_LAYOUT.railHeight,.36]).name='GuardianSealCounterweightRail';
        const carriage=new THREE.Group();
        carriage.name=side<0?'GuardianCounterweightLeft':'GuardianCounterweightRight';
        doorway.add(carriage);
        block(carriage,materials.copper,[side*GUARDIAN_TRANSMISSION_LAYOUT.counterweightX,GUARDIAN_TRANSMISSION_LAYOUT.weightCenterY,GUARDIAN_TRANSMISSION_LAYOUT.rearDepth],[.68,1.40,.54]).name='GuardianSealCounterweight';
        const cableSocket=block(carriage,materials.edge,
          [side*GUARDIAN_TRANSMISSION_LAYOUT.counterweightX,GUARDIAN_TRANSMISSION_LAYOUT.socketY,GUARDIAN_TRANSMISSION_LAYOUT.rearDepth],[.78,.14,.6]);
        cableSocket.name='GuardianSealCableSocket';
        counterweights.push({side,carriage,socket:cableSocket});
      }
      // A physically coupled capstan and paired tension lines explain WHY
      // the gate doors and heavy counterweights move as the guardian loses
      // actual health. This is original 3D world geometry, not a HUD meter
      // or a second gameplay authority. Rigid spoke art batches to two
      // materials; the two live cable lengths share one GPU instance draw.
      // One high spanning beam couples the left/right counterweights to
      // a crown-mounted original capstan. Its centre stays ABOVE the actual
      // 0..5m hero/guardian combat, instead of hovering across the duel.
      const overhead=new THREE.Group();overhead.name='GuardianOverheadTransmission';
      overhead.position.set(0,GUARDIAN_TRANSMISSION_LAYOUT.overheadY,GUARDIAN_TRANSMISSION_LAYOUT.rearDepth);doorway.add(overhead);
      const driveBeam=block(overhead,materials.edge,[0,0,0],[GUARDIAN_TRANSMISSION_LAYOUT.beamWidth,.17,.22]);
      driveBeam.name='GuardianOverheadDriveBeam';
      driveBeam.castShadow=false;driveBeam.receiveShadow=false;
      const capstan=new THREE.Group();capstan.name='GuardianGateCapstan';
      capstan.position.set(0,GUARDIAN_TRANSMISSION_LAYOUT.capstanY,GUARDIAN_TRANSMISSION_LAYOUT.rearDepth);doorway.add(capstan);
      mesh(capstan,geometry('guardian-gate-capstan-rim',
        ()=>new THREE.TorusGeometry(.56,.09,6,22)),materials.copper);
      mesh(capstan,cylinder(),materials.edge,[0,0,0],[.16,.14,.16],[Math.PI/2,0,0]);
      for(const angle of [0,Math.PI/2])
        block(capstan,materials.edge,[0,0,-.06],[1.12,.1,.13],[0,0,angle]);
      batchRigid(capstan);
      const tension=new THREE.InstancedMesh(cylinder(),materials.edge,2);
      tension.name='GuardianCounterweightTension';
      tension.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      tension.castShadow=false;tension.receiveShadow=false;tension.frustumCulled=false;
      doorway.add(tension);
      const tensionPose=new THREE.Object3D();
      // Two actual overhead bronze drive spools turn only as genuine
      // guardian HP moves the counterweights. One batched original 3D draw,
      // not two decorative fake timers or a HUD overlay.
      const spools=new THREE.InstancedMesh(
        geometry('guardian-source-counterweight-spool',
          ()=>new THREE.TorusGeometry(.34,.07,6,20)),materials.copper,2);
      spools.name='GuardianCounterweightSpoolPulleys';
      spools.castShadow=false;spools.receiveShadow=false;
      spools.frustumCulled=false;
      spools.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      overhead.add(spools);
      const spoolPose=new THREE.Object3D();
      // The rigid gate piers, lintel and rails do not need one GPU draw
      // each. Batch ONLY this immovable architecture into shared-material
      // meshes; the source-driven doors, weights, crest and conduit stay
      // separate animated nodes with the exact same visible silhouette.
      // The entire frame remains a floor-owned decorative sibling, never
      // part of the walkable deck or authoritative hitbox.
      batchRigid(frame,new Set([crest,conduit,capstan,tension,overhead,
        ...wings.map(entry=>entry.wing),
        ...counterweights.map(entry=>entry.carriage)]));
      // Rigid batching creates fresh material-sharing meshes. Mark the final
      // meshes after batching, or the floor's subsequent generic shadow pass
      // would wrongly turn the dark masonry into new shadow casters.
      frame.traverse(object=>{if(object.isMesh){
        object.userData.ambientDetail=true;object.castShadow=false;object.receiveShadow=false;
      }});
      guardianGate={frame,wings,crest,counterweights,conduit,capstan,
        overhead,tension,tensionPose,spools,spoolPose,progress:null,unlocked:false};
    }
    let capMaterials = [], capLandingMaterial = null;
    if(p.id.endsWith(':cap')){
      // The last route gap is shorter than the guardian's body. A thick
      // decorative box beam buries its face inside a one-way platform. Keep
      // the exact usable top and angular edges, with a thin front plate and
      // the existing supports recessed behind the character corridor.
      for(const child of root.children)if(child!==mount&&child!==guardianGate?.frame){
        child.position.y=h+(child.position.y-h)*.12;child.scale.y*=.12;
      }
      // A cap may cross the line of sight to its own guardian. Give only its
      // traversable face and trim floor-owned alpha materials; keep rear supports
      // and every collision-aligned vertex untouched. Precompile transparency
      // once so visibility transitions cannot cause per-frame shader churn.
      const owned = new Map();
      for(const child of root.children)if(child!==mount&&child!==guardianGate?.frame)child.traverse(object=>{
        if(!object.isMesh)return;
        const original=object.material;
        if(!owned.has(original)){
          const material=original.clone();
          material.transparent=true;material.opacity=1;material.depthWrite=true;
          material.name='guardian-sightline-cap';
          owned.set(original,material);floorMaterials.add(material);
        }
        object.material=owned.get(original);
      });
      capMaterials=[...owned.values()];
      // The cap's sightline shader owns a CLONE of the original landing
      // material. Retain that actual mesh/shader identity for the Floor8->9
      // old-deck transition; matching the generic materials.landing later
      // is wrong, and silently finds zero original cap roof polygons.
      capLandingMaterial=owned.get(materials.landing) || null;
    }
    root.traverse(o=>{
      if(!o.isMesh)return;
      if(o.material===bodyMaterial)o.userData.structural=true;
      // The solid source-aligned walking sector already casts the deck's
      // authoritative spatial shadow. Recessed dark service trim and the
      // under-carriage must not each submit a redundant shadow-map draw.
      // Preserve geometry/material depth in the color pass, and leave true
      // structural surfaces, hero, hazards and guardian signals untouched.
      if(o.material===materials.dark&&!o.userData.structural)
        o.userData.ambientDetail=true;
    });
    // Give a genuinely moving autonomous landing a mechanical, world-space
    // cue. Position belongs to the source platform; the crank never drives it.
    let traveler=null,countergear=null,actuator=null,gearVisual=null;
    if(p.kind==='moving'){
      traveler=new THREE.Group();traveler.name='SourceObservedMovingDeckCrank';
      traveler.position.set(0,h-1.4,27.46);
      countergear=new THREE.Group();
      countergear.name='SourceObservedMovingDeckCountergear';
      countergear.position.set(1.52,h-1.4,27.46);
      // Two independent physical gears, but ONE bounded submitted material
      // draw: the same original toothed/spoked mesh is instanced twice.
      // Rotation comes solely from observed p.x deltas below.
      gearVisual=new THREE.InstancedMesh(
        geometry('observed-moving-toothed-gear',()=>createObservedMovingDeckGearGeometry(THREE)),
        materials.copper,2);
      gearVisual.name='SourceObservedMovingDeckGearPair';
      gearVisual.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      gearVisual.setColorAt(0,new THREE.Color(0xffffff));
      gearVisual.setColorAt(1,new THREE.Color(0xb1d6e0));
      gearVisual.frustumCulled=false;
      gearVisual.userData.ambientDetail=true;
      gearVisual.castShadow=false;gearVisual.receiveShadow=false;
      actuator=new THREE.Group();
      actuator.name='SourceObservedMovingDeckLoadPiston';
      actuator.position.set(-1.95,h-1.6,27.54);
      actuator.userData.restY=actuator.position.y;
      // The fixed sleeve and exposed rod share a second instanced draw,
      // retaining a source-contact accent without two separate draw calls.
      const sleeve=new THREE.InstancedMesh(rounded(),materials.copper,2);
      sleeve.name='SourceObservedMovingDeckPistonParts';
      sleeve.setColorAt(0,new THREE.Color(0xffffff));
      sleeve.setColorAt(1,new THREE.Color(0xa3e8ca));
      for(const [i,part] of [
        {p:[0,-.24,0],s:[.35,.88,.42]},
        {p:[0,.26,.075],s:[.16,.42,.2]},
      ].entries()){
        dummy.position.set(...part.p);dummy.rotation.set(0,0,0);
        dummy.scale.set(...part.s);dummy.updateMatrix();
        sleeve.setMatrixAt(i,dummy.matrix);
      }
      sleeve.castShadow=false;sleeve.receiveShadow=false;
      sleeve.userData.ambientDetail=true;
      actuator.add(sleeve);
      root.add(traveler,countergear,actuator,gearVisual);
    }
    platforms.set(p.id,{root,angle,width:p.width,height:p.height,
      capMaterials,capLandingMaterial,arrivalSurface,guardianGate,traveler,countergear,actuator,gearVisual,
      motionSourceTick:null,sourceX:null,sourceTick:null});return root;
  }
  function buildHazard(h,width){
    const root=new THREE.Group();root.name=`hazard:${h.id}`;floorGroup.add(root);
    const w=h.width/width*ARC*25,height=h.height/SCALE;
    const live=new THREE.Group();root.add(live);
    // The warning plinth sits below the lethal collider; only active geometry occupies its exact height.
    block(root,materials.dark,[0,-.22,0],[w,.42,2.9]);
    for(const sign of [-1,1])block(root,materials.warning,[sign*(w*.5-.1),-.1,.3],[.2,.2,3]);
    // Reuse the existing indicator DRAW for eight extruded pressure teeth.
    // The low inactive comb is a safety-colored trim; actual source
    // activation raises its 3D silhouette with ZERO new draw submissions,
    // geometry allocations per tick, collision surfaces or screen HUD.
    const profile=new THREE.Shape(),step=w*.70/8,left=-w*.35;
    profile.moveTo(left,0);
    for(let index=0;index<8;index++){
      const x=left+index*step;
      profile.lineTo(x,.075);
      profile.lineTo(x+step*.24,.075);
      profile.lineTo(x+step*.39,.92);
      profile.lineTo(x+step*.61,.92);
      profile.lineTo(x+step*.79,.075);
      profile.lineTo(x+step,.075);
    }
    profile.lineTo(left+w*.70,0);
    profile.closePath();
    const indicator=mesh(root,own(new THREE.ExtrudeGeometry(profile,
      {depth:.12,bevelEnabled:false,steps:1})),materials.mint,[0,-.12,1.54]);
    indicator.name='SourceObservedHazardPressureComb';
    indicator.scale.y=.10;
    indicator.castShadow=false;indicator.receiveShadow=false;
    let spin=null;
    if(h.kind==='spikes'){
      const teeth=[];for(let i=0;i<Math.max(3,Math.round(w/.48));i++)for(const z of [-.65,.55])teeth.push({p:[-w*.5+.25+i*w/Math.max(3,Math.round(w/.48)),height*.5,z],s:[.25,height,.25]});instanced(live,cone(),materials.edge,teeth);
    }else if(h.kind==='heat'){
      for(let i=0;i<4;i++){
        const x=-w*.37+i*w*.245;mesh(root,cylinder(),materials.copper,[x,-.07,0],[.27,.18,.27]);
        mesh(live,cone(),materials.fire,[x,height*.5,0],[.32,height,.32]);mesh(live,sphere(),materials.hot,[x,height*.17,0],[.25,height*.31,.25]);
      }
      const grille=[];for(let i=0;i<7;i++)grille.push({p:[-w*.44+i*w*.145,-.02,0],s:[.09,.12,2.5]});instanced(root,box(),materials.metal,grille);
    }else if(h.kind==='crusher'){
      for(const sign of [-1,1]){block(root,materials.metal,[sign*w*.43,height*.5,-.95],[.18,height+1.1,.22]);mesh(root,cylinder(),materials.copper,[sign*w*.32,.35,-.5],[.12,1.1,.12]);}
      block(live,materials.edge,[0,height*.62,0],[w*.94,height*.75,2.45]);
      for(let i=0;i<5;i++)block(live,materials.warning,[-w*.37+i*w*.18,height*.55,1.25],[w*.11,height*.6,.07],[0,0,-.35]);
      block(live,materials.metal,[0,.08,0],[w*.94,.16,2.5]);
    }else if(h.kind==='lightning'){
      for(const sign of [-1,1]){mesh(root,cylinder(),materials.metal,[sign*w*.45,.1,0],[.18,.6,.18]);mesh(root,sphere(),materials.edge,[sign*w*.45,.42,0],[.28,.18,.28]);}
      const pts=[];for(let i=0;i<10;i++)pts.push([-w*.45+i*w*.1,height*(.2+(i%2)*.62),0]);
      for(let i=1;i<pts.length;i++)beam(live,pts[i-1],pts[i],.065,materials.electric);
      for(let i=0;i<3;i++)block(root,materials.glow,[-w*.25+i*w*.25,-.12,1.56],[.15,.12,.06]);
    }else{
      const portal=mesh(live,own(new THREE.TorusGeometry(Math.min(w*.38,height*.37),Math.min(.07,height*.08,w*.08),6,24)),materials.crystal,[0,height*.5,.2]);spin=portal;
      mesh(live,own(new THREE.OctahedronGeometry(.42,0)),materials.glow,[0,height*.5,0],[1,height,.8]);
      for(let i=0;i<4;i++){const a=i/4*TAU;block(root,materials.edge,[Math.cos(a)*w*.37,-.01,Math.sin(a)],[.35,.3,.35],[0,a,.4]);}
    }
    conformDanger(live,w,height,spin);
    // Active source hazard now physically raises the existing single
    // indicator mesh. The comb has eight real extruded prongs, not an
    // additional draw or a decorative collision surface.
    hazards.set(h.id,{root,live,indicator,spin,kind:h.kind,active:false,height});
  }
  // Bounded, noninteractive far-scenery job for an AUTHENTIC earned floor
  // transfer. A completed actual Three.js render is its only activation.
  // Rebuild/dispose/restart cancels the one pending job. No timers or workers.

  // The authored old cap surface and new Floor9 ground occupy the EXACT SAME
  // authoritative roof. A successful source gate/mesh retention can still
  // look like a violet scene cut when the newly rebuilt opaque platform
  // depth-writes over the physically coincident bronze slab. Use only the
  // original old landing mesh, never a stand-in platform, with a restrained
  // copied material and display-submission-timed chromatic handoff.
  // No additional floor, collider, vertex, source tick or shadow pass.
  // Invalid timestamps/failed renderer submissions cannot fake a completed
  // on-screen transfer.
  // The actual Floor 8 cap scene used to disappear when Floor 9 rebuilt its
  // world, even though the authentic climber was still at the SAME threshold.
  // Previous original 1x film at c2ce9fcb still hard-cuts the 8->9 crossing.
  // Its real guardian portal is a SIBLING of platform:f8:cap, therefore
  // retaining only the deck deleted the actual open bronze doorway at rebuild.
  // Preserve the TWO original already-rendered subtrees as one historical
  // transform, not the entire old floor or any old physics. No source wins,
  // support, collision, replay or synthetic portal may be created here.
  let pendingEarnedCap = null, retainedEarnedCap = null;
  const RETAINED_CAP_SECONDS = 1.65;
  function retireEarnedCap() {
    if (!retainedEarnedCap) return;
    const held = retainedEarnedCap;
    // A verified passage may end early (death, new run, changed location).
    // Restore the real F9 ground's canonical void material in that same
    // frame; never leave a historical bronze tint on an unrelated route.
    const arrival=platforms.get('f9:ground')?.arrivalSurface;
    if(arrival && materials.landing)arrival.color.copy(materials.landing.color);
    held.root.removeFromParent();
    held.root.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
    });
    for (const geometry of held.ownedGeometries) geometry.dispose();
    for (const material of held.ownedMaterials) material.dispose();
    retainedEarnedCap = null;
  }
  // Called by scene.mjs ONLY after its existing grounded guardian source
  // validator and opened-arch begin() have succeeded. The cached real
  // platform must match the independent, source-issued previous cap exactly.
  function stageGroundedCapContinuation(previous, next) {
    pendingEarnedCap = null;
    const old = lastSnapshot, sourceEntry = platforms.get('f8:cap');
    const root = sourceEntry?.root, realGate = sourceEntry?.guardianGate?.frame;
    // Real old-door geometry exists independently from its platform and must
    // belong to the SAME authenticated source-earned crossing.
    const defeatedProof = previous?.enemies?.some(enemy =>
      enemy?.kind === 'guardian' && enemy.active === false &&
      Number.isFinite(enemy.health) && enemy.health <= 0);
    const authored = previous?.platforms?.find(p => p?.id === 'f8:cap');
    const cached = old?.platforms?.find(p => p?.id === 'f8:cap');
    const ground = next?.platforms?.find(p => p?.id === 'f9:ground');
    if (!root || !realGate?.isGroup || !defeatedProof ||
        !authored || !cached || !ground ||
        old?.floor !== 8 || next?.floor !== 9 ||
        old.runToken !== next.runToken || previous.runToken !== next.runToken ||
        next.lifecycle !== 'running' || next.tick <= old.tick ||
        !Number.isSafeInteger(next.tick) ||
        !Number.isSafeInteger(old.chunkBaseY) ||
        !Number.isSafeInteger(next.chunkBaseY) ||
        !Number.isSafeInteger(next.worldWidth) ||
        next.worldWidth !== old.worldWidth ||
        ![authored.x,authored.y,authored.width,authored.height,
          cached.x,cached.y,cached.width,cached.height,
          ground.y,ground.height].every(Number.isSafeInteger) ||
        authored.width <= 0 || authored.height <= 0 ||
        [ 'x','y','width','height' ].some(key => authored[key] !== cached[key]) ||
        authored.y + authored.height !== ground.y + ground.height ||
        !(next.player?.health > 0) ||
        !((next.player.grounded === true &&
           next.player.groundedPlatformId === 'f9:ground') ||
          observedSourceEarnedAirborneHandoff(previous,next) ||
          observedSourceEarnedDoorstepHandoff(previous,next))) return false;
    pendingEarnedCap = {
      runToken:next.runToken, floor:next.floor, tick:next.tick,
      previousBaseY:old.chunkBaseY, nextBaseY:next.chunkBaseY,
      thresholdX:guardianGateAnchorX(previous,authored),
      oldRoofY:ground.y+ground.height,
      oldCapId:authored.id,oldCapX:authored.x,oldCapWidth:authored.width,
      worldWidth:next.worldWidth,
      crossingTick:Number.isSafeInteger(next.lastGuardianCrossing?.sourceTick)
        ? next.lastGuardianCrossing.sourceTick : null
    };
    return true;
  }
  function beginRetainedCapRebuild(next) {
    retireEarnedCap();
    const requested = pendingEarnedCap;
    pendingEarnedCap = null;
    if (!requested || requested.runToken !== next.runToken ||
        requested.floor !== next.floor ||
        !(requested.tick === next.tick ||
          observedQueuedOriginalCapAtFirstRender(next,requested))) return;
    const sourceEntry = platforms.get('f8:cap');
    const root = sourceEntry?.root;
    const realGate = sourceEntry?.guardianGate?.frame;
    if (!root || !realGate?.isGroup) return;
    // The browser may have observed the living locked guardian immediately
    // before a cold GPU frame skipped all later old-floor source snapshots.
    // The separately validated *previous* source proves zero-HP defeat, so
    // rehydrate the existing ORIGINAL grille/counterweights already opened.
    // These are real visual parts, not a forged action or an authoritative
    // collision change. Missing source proof never stages this work.
    const gate = sourceEntry.guardianGate;
    gate.progress = 1;
    gate.unlocked = true;
    for (const {side,wing} of gate.wings) wing.position.x = side * 2.8;
    for (const {carriage} of gate.counterweights) carriage.position.y = -2.35;
    gate.capstan.rotation.z = 0;
    // Both subtrees had the same old floor parent (the gate is not a child
    // of its collision-aligned source deck). One shared transform keeps them
    // aligned across the old and new chunk origins without duplicating
    // gameplay platforms or introducing new geometry/material allocations.
    // The real clockwork cap top and the new void ground share a roof
    // footprint. Without independent material depth ownership, old solid
    // geometry can survive yet be hidden by the new floor's purple top
    // surface (as observed in both exact native 1x WebMs).
    // Copy only the existing bronze deck's material; leave the original
    // rendered polygons, platform transforms and authoritative ground alone.
    // The cap keeps its own per-mesh sightline material clone. The generic
    // landing pointer never matches these ACTUALLY drawn cap polygons.
    const oldLanding = sourceEntry.capLandingMaterial;
    const originalDeckMeshes = [];
    root.traverse(object => {
      if (object.isMesh && object.material === oldLanding)
        originalDeckMeshes.push(object);
    });
    const bronzeSurface = originalDeckMeshes.length ? oldLanding.clone() : null;
    if (bronzeSurface) {
      bronzeSurface.name = 'SourceEarnedOriginalClockworkDeck';
      bronzeSurface.transparent = true;
      bronzeSurface.opacity = observedRetainedOriginalBronzeCover(0, 0);
      bronzeSurface.depthTest = true;
      bronzeSurface.depthWrite = false;
      bronzeSurface.polygonOffset = true;
      bronzeSurface.polygonOffsetFactor = -2;
      bronzeSurface.polygonOffsetUnits = -2;
      for (const existingMesh of originalDeckMeshes) {
        existingMesh.material = bronzeSurface;
        // The old bronze slab is *coplanar* with actual Floor9 ground.
        // Render its actual surface in the transparent pass above that
        // depth, never above the skinned hero or real intervening objects.
        existingMesh.renderOrder = 2;
      }
    }
    const continuity = new THREE.Group();
    continuity.name = 'ObservedGroundedCapGatewayContinuity';
    continuity.add(root,realGate);
    continuity.position.y = (requested.previousBaseY - requested.nextBaseY) / SCALE;
    const allGeometries = new Set(), allMaterials = new Set();
    continuity.traverse(object => {
      if (!object.isMesh) return;
      if (object.geometry) allGeometries.add(object.geometry);
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of mats) if (material) allMaterials.add(material);
      // The old deck is historical presentation, never a new shadow-casting
      // collision structure or a source-controlled active guardian hazard.
      object.castShadow = false;
      object.receiveShadow = false;
    });
    // Only resources owned by this floor may be retired. Shared primitives
    // belong to the world owner and MUST NOT be prematurely disposed.
    const ownedGeometries = new Set([...floorGeometries].filter(g=>allGeometries.has(g)));
    const ownedMaterials = new Set([...floorMaterials].filter(m=>allMaterials.has(m)));
    if (bronzeSurface) ownedMaterials.add(bronzeSurface);
    group.add(continuity);
    retainedEarnedCap = {root:continuity,guardianGateRetained:true,
      originalDeckSurface:bronzeSurface,
      originalBronzeDeckMeshes:originalDeckMeshes.length,
      ownedGeometries,ownedMaterials,
      // Distinct clocks: immutable HP-zero crossing, first browser-accepted
      // successor, and first actually rebuilt WebGL successor. Previously
      // sourceTick was overwritten with the last one, so BOTH authentic
      // crossing and original passage validators rejected retained geometry.
      runToken:next.runToken,floor:next.floor,sourceTick:requested.tick,
      crossingTick:requested.crossingTick,
      thresholdX:requested.thresholdX,oldRoofY:requested.oldRoofY,
      oldCapId:requested.oldCapId,oldCapX:requested.oldCapX,
      oldCapWidth:requested.oldCapWidth,
      submittedFrames:0,visibleSeconds:0,
      firstObservedTick:requested.tick,firstWorldRenderTick:next.tick};
  }
  function updateRetainedCap(snapshot,dt,options,passageWitness) {
    const held = retainedEarnedCap;
    if (!held) return;
    // The actual next-floor route may take the hero airborne before two
    // cold WebGL frames have submitted. Do not erase the *original* earned
    // doorway merely on first takeoff. Bound its retention to the physical
    // source threshold, same run, genuine next-floor flight and display age.
    const p=snapshot.player;
    const sole=p?.y-p?.halfHeight;
    const nearDoor=Number.isSafeInteger(p?.x) &&
      Number.isSafeInteger(p?.y) && Number.isSafeInteger(p?.halfHeight) &&
      p.halfHeight>0 && Number.isSafeInteger(held.thresholdX) &&
      Number.isSafeInteger(held.oldRoofY) &&
      Math.abs(p.x-held.thresholdX)<=90000 &&
      Number.isSafeInteger(sole) &&
      sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+55000;
    // The cold browser may first display a genuine grounded Floor9 snapshot
    // MORE THAN 12 ticks after the recorded crossing. Its standing support
    // can still be the original f8:cap on the EXACT same roof. The previous
    // 12-tick doorstep witness rightly expires, but it must not immediately
    // erase the actual original GPU arch while the boots still occupy it.
    const onOriginalCapRoof=observedRetainedOriginalCapRoofContact(snapshot,held);
    const onNewRoof=(p?.grounded===true &&
      p.groundedPlatformId==='f9:ground') ||
      !!observedRecordedGuardianDoorstepHandoff(snapshot) ||
      onOriginalCapRoof;
    // After the real source-earned crossing, the old GPU cap/arch physically
    // remains behind a jumping hero. Under slow WebGL it must survive the same
    // actual passage window as the camera and horizon, rather than retire on
    // an independent support rule while the source arch is still visible.
    const samePassage=passageWitness?.sourceBound===true &&
      passageWitness.active===true &&
      passageWitness.stage==='handoff' &&
      passageWitness.continuousGroundedHandoff===true &&
      passageWitness.innerDoorAssemblyVisible===true &&
      passageWitness.exteriorMemoryFrameVisible===false &&
      passageWitness.runToken===held.runToken &&
      passageWitness.floor===held.floor &&
      passageWitness.sourceTick===held.sourceTick &&
      Number.isSafeInteger(passageWitness.handoffSubmittedFrames) &&
      passageWitness.handoffSubmittedFrames>=0 &&
      Number.isFinite(passageWitness.handoffDisplaySeconds) &&
      Number.isFinite(passageWitness.handoffVisibleWindowSeconds) &&
      passageWitness.handoffVisibleWindowSeconds>0 &&
      passageWitness.handoffVisibleWindowSeconds<=3 &&
      passageWitness.handoffDisplaySeconds>=0 &&
      passageWitness.handoffDisplaySeconds<passageWitness.handoffVisibleWindowSeconds;
    const sourceFlight=p?.grounded===false &&
      p.state==='airborne' && Number.isFinite(p.vy);
    // In genuine 1x films, native pixels were >1s behind an already-returned
    // Three.js render: the old door vanished before a single shared old/new
    // physical world became visible. Hold the ORIGINAL uncollidable cap and
    // gate for a handful of real submissions while the player is still on
    // an authentic nearby Floor9 deck or real airborne route. No fake pose.
    // The recorded old cap survives a cold software-renderer gap even after
    // the separate 3D passage cue has expired. Only the immutable same-run
    // HP-zero 8->9 crossing, original roof and real nearby airborne body
    // permit these first GPU-submitted frames to keep the historical world.
    const sourceColdFrame=observedSourceEarnedColdFrameContinuation(snapshot,held);
    const retainedBackdrop = (observedClockworkRoofContinuity(
      snapshot,passageWitness,held) || sourceColdFrame) &&
      held.submittedFrames < 9 && held.visibleSeconds < 1.25;
    const justLaunched=sourceFlight &&
      snapshot.tick-held.sourceTick<=24 && nearDoor;
    // Historical architecture only: no collider, contact or extra event.
    // Limit to 48 source ticks, 90m horizontally, 160m above the original
    // source roof and no more than the first two real renderer submissions.
    const onCameraHandoffFlight=samePassage && sourceFlight &&
      held.submittedFrames<=2 && snapshot.tick-held.sourceTick<=48 &&
      Number.isSafeInteger(p.x) && Number.isSafeInteger(sole) &&
      Math.abs(p.x-held.thresholdX)<=90000 &&
      sole>=held.oldRoofY-2500 && sole<=held.oldRoofY+160000;
    held.sourceAlignedPassage=samePassage || sourceColdFrame;
    if (options.stale || snapshot.runToken !== held.runToken ||
        snapshot.floor !== held.floor || snapshot.lifecycle !== 'running' ||
        !Number.isSafeInteger(snapshot.tick) ||
        snapshot.tick<held.sourceTick || snapshot.tick-held.sourceTick>60 ||
        !(p?.health>0) ||
        (!nearDoor && !onCameraHandoffFlight && !retainedBackdrop) ||
        (!onNewRoof && !justLaunched && !onCameraHandoffFlight &&
          !retainedBackdrop)) {
      retireEarnedCap();
      return;
    }
    if (held.submittedFrames > 0 && Number.isFinite(dt))
      held.visibleSeconds += Math.min(.1,Math.max(0,dt));
    if (held.originalDeckSurface)
      held.originalDeckSurface.opacity = observedRetainedOriginalBronzeCover(
        held.submittedFrames, held.visibleSeconds);
    // The authentic F9 roof must not change from bronze to violet all at
    // once behind an otherwise still-present old gateway. Its original
    // gameplay geometry is unchanged; interpolate only its existing
    // dedicated source-owned landing shader toward the actual void palette.
    const arrival=platforms.get('f9:ground')?.arrivalSurface;
    if(arrival && held.originalDeckSurface && materials.landing)
      arrival.color.copy(materials.landing.color).lerp(
        held.originalDeckSurface.color,held.originalDeckSurface.opacity);
    if (held.submittedFrames >= 5 && held.visibleSeconds >= RETAINED_CAP_SECONDS)
      retireEarnedCap();
  }

  let deferredDistantArrival = null;
  // Exact original source-frame CPU-only world construction witness. A cheap
  // getter avoids the expensive complete scene traverse in the hot render path.
  let lastRebuildWitness = null;
  function clearFloor(){
    deferredDistantArrival = null;
    lastRebuildWitness = null;
    rigidUploadBytes=0;rigidExpandedBytes=0;rigidIndexedBatches=0;rigidBatchCount=0;rigidPackedVertexBuffers=0;rigidPriorSeparateVertexBuffers=0;
    if(floorGroup){group.remove(floorGroup);floorGroup.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
    // The one source-earned former cap keeps its already-rendered resources.
    for(const g of floorGeometries)if(!retainedEarnedCap?.ownedGeometries.has(g))g.dispose();
    for(const m of floorMaterials)if(!retainedEarnedCap?.ownedMaterials.has(m))m.dispose();
    floorGeometries.clear();floorMaterials.clear();platforms.clear();hazards.clear();rotors.length=0;floaters.length=0;foregroundGears.length=0;foregroundRacks.length=0;decorativeSightlines.length=0;decorativeOcclusionEvidence.length=0;particles=null;vistaGroup=null;floorGroup=null;occludedGuardianCaps=0;occludedForegroundGears=0;occludedForegroundScreenGears=0;occludedForegroundCorridorGears=0;occludedForegroundClockFaces=0;ruinsPortalVoussoirs=0;ruinsGateLeaves=0;
    ruinsSanctuaryArches=0;ruinsSanctuaryPlants=0;ruinsSanctuaryCascadePanels=0;
    sceneFocus=0;sceneFocusKind='ascent';
  }
  function rebuild(snapshot, requestedQuality='normal'){
    // The live browser can still be showing an OLD living-guardian packet when
    // immutable 20Hz source has already defeated that guardian and crossed
    // the actual threshold. In the 1x guardian films, Floor9 first reached
    // Three.js nine ticks after the real grounded crossing. Looking only at
    // lastSnapshot therefore silently disabled the existing first-frame
    // vista/citadel deferral and forced the entire distant world to upload
    // during the same cold GPU frame as the genuine new ground/hero/door.
    // stageGroundedCapContinuation already validated source guardian HP0,
    // old platform, same run, original GPU gate, exact roof and live support.
    // Match that proof to THIS immutable rebuild; never borrow a stale gate.
    const earnedSourceUploadWitness = pendingEarnedCap &&
      pendingEarnedCap.runToken===snapshot.runToken &&
      pendingEarnedCap.floor===snapshot.floor &&
      (pendingEarnedCap.tick===snapshot.tick ||
        observedQueuedOriginalCapAtFirstRender(snapshot,pendingEarnedCap)) &&
      snapshot.lifecycle==='running';
    const adjacentBrowserProof = observedEarnedFloorArrival(lastSnapshot,snapshot);
    const deferDistant = requestedQuality==='low' &&
      (adjacentBrowserProof || earnedSourceUploadWitness);
    // Only a VERIFIED old-cap physical crossing can temporarily postpone
    // new-floor NON-COLLIDING monumental architecture. The original Floor9
    // roof, every moving platform, hazard, hero and earned bronze doorway
    // stay in the first render. Mere adjacent browser floor change cannot
    // hide its shaft or borrow another run's winning passage.
    const deferStructuralShell = deferDistant && earnedSourceUploadWitness && snapshot.floor===9 && snapshot.theme==='void';
    const rebuildStartedAt = performance.now();
    beginRetainedCapRebuild(snapshot);
    clearFloor();quality=requestedQuality;theme=THEMES[snapshot.theme]?snapshot.theme:'foundry';const p=PALETTES[theme];
    materials={stone:weather(mat(p.stone,.04,.86)),dark:mat(p.dark,.28,.58),metal:mat(p.metal,.48,.39),copper:mat(theme==='foundry'?0xc88c57:p.metal,.55,.32),edge:mat(p.edge,.12,.68),
      portalStone:theme==='ruins'?applyStoneSurface(mat(p.edge,.035,.90),stoneSurface,{scale:.11,strength:.56,relief:.013}):mat(p.edge,.12,.68),
      gate:theme==='ruins'?mat(0x43534b,.38,.73):null,gateTrim:theme==='ruins'?mat(0x87846a,.48,.64):null,
      ceramic:applyStoneSurface(mat(theme==='foundry'?0xb6b5a0:p.stone,.08,.4),stoneSurface,{scale:.085,strength:.36,relief:.01}),furnaceCore:mat(0x7d301b,.1,.72,{emissive:0xf25a13,emissiveIntensity:.72}),
      glow:mat(p.glow,.1,.4,{emissive:p.glow,emissiveIntensity:.85}),mint:mat(0xb6ffdc,.1,.35,{emissive:0x63e4ad,emissiveIntensity:.7}),warning:mat(0xf2ad4e,.3,.62),
      fire:mat(0xffa835,0,.5,{emissive:0xff7021,emissiveIntensity:1.5}),hot:mat(0xffe7a3,0,.5,{emissive:0xffb83c,emissiveIntensity:1}),electric:mat(0xc6f8ff,0,.3,{emissive:0x83dfff,emissiveIntensity:1.2}),
      bark:mat(0x5b6b4b,0,1),foliage:mat(0x698e58,0,.94),crystal:mat(0xb5a0ec,.45,.23,{emissive:0x7758ae,emissiveIntensity:.35}),
      sanctuaryStone:theme==='ruins'?applyStoneSurface(mat(0xb5a890,.025,.86),stoneSurface,{scale:.1,strength:.54,relief:.014}):null,
      sanctuaryWater:theme==='ruins'?mat(0x79b9ac,.04,.33,{transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}):null,
      distant:null,cloud:mat(THEMES[theme].fog,0,1,{transparent:true,opacity:.075,depthWrite:false}),particle:mat(p.glow,0,1,{emissive:p.glow,emissiveIntensity:1})};
    // The remote buildings retain directional form through the haze instead
    // of becoming a single flat silhouette cutout at every depth.
    materials.distant=mat(new THREE.Color(THEMES[theme].sky).lerp(new THREE.Color(THEMES[theme].fog),.23).multiplyScalar(.5),.03,.95);
    if(theme==='ruins'){materials.gate.name='ruins-gate-leaves';materials.gateTrim.name='ruins-gate-relief';}
    if(theme==='ruins')materials.sanctuaryStone.name='ruins-sanctuary-stone';
    materials.distant.name='distant-atmosphere';
    materials.cloud.name='ambient-clouds';materials.particle.name='ambient-particles';
    materials.cloud.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= pow(max(0.0, dot(normal, normalize(vViewPosition))), 1.4);\n#include <opaque_fragment>');};
    materials.cloud.customProgramCacheKey=()=> 'soft-atmosphere-shell-v1';
    materials.landing=mat(p.landing,theme==='ruins'?.03:.35,theme==='ruins'?.88:.62);
    if(theme==='ruins')weather(materials.landing);
    materials.tread=mat(p.dark,.4,.8,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    floorGroup=new THREE.Group();floorGroup.name=`floor:${snapshot.floor}:${theme}`;group.add(floorGroup);
    const height=snapshot.chunkHeight/SCALE;
    // Commit a truthful Floor 9+ body/route/guardian world immediately. Cold
    // distant citadels (and their shader compilation) are non-playable and
    // never belong on the critical first post-gateway renderer submission.
    // The canyon, source decks, physics-anchored hazards and action silhouettes
    // remain complete in the very first frame; no false gateway is inserted.
    if (!deferStructuralShell) buildTower(height,theme==='clockwork');
    // Critical scene geometry is authoritative: ground, platforms, hazards,
    // canyon shaft and gateway all remain on the first submitted new-floor
    // frame. Only the noninteractive 8,640-triangle distance panorama and
    // seven far citadels can be staggered after genuine renderer submissions.
    if(!deferDistant){buildDistantWorld(height);buildVista(height);}
    // All 3D cap clearance machinery must share the opt-in source exit,
    // not merely the presence of some guardian on a historic floor.
    // No published, exact real exit means no fabricated bronze victory gate.
    for(const p of snapshot.platforms||[]){
      const sourceGateCap=p.id===`f${snapshot.floor}:cap` &&
        Number.isFinite(p.x) && Number.isFinite(p.width) && p.width>0 &&
        Number.isSafeInteger(snapshot.guardianExitX) &&
        snapshot.guardianExitX===p.x+Math.floor(p.width*.76) &&
        (snapshot.enemies||[]).some(e=>e.kind==='guardian' &&
          (!Number.isSafeInteger(e.floor)||e.floor===snapshot.floor) &&
          typeof e.id==='string' && !!e.id && Number.isFinite(e.health));
      buildPlatform(p,snapshot.worldWidth,sourceGateCap);
    }
    for(const h of snapshot.hazards||[])buildHazard(h,snapshot.worldWidth);
    for(const r of rotors)r.o.traverse(o=>{if(o.isMesh)o.userData.ambientDetail=true;});
    // The large structural masses cast the route shadows. Tiny bolts, foliage,
    // motes, glow strips and remote buildings keep their geometry and receive
    // lighting without multiplying shadow-map draws.
    floorGroup.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.ambientDetail&&(!!o.userData.structural||o.material===materials.stone||o.material===materials.dark);if(o.material===materials.distant)o.receiveShadow=false;}});
    for(const h of hazards.values())h.root.traverse(o=>{
      if(o.isMesh && o!==h.indicator)o.castShadow=true;
    });
    finishBatches();
    bindRenderedClockFaceRayMeshes();
    key=`${snapshot.runToken}:${snapshot.floor}:${snapshot.theme}:${quality}`;
    lastRebuildWitness = { runToken: snapshot.runToken, floor: snapshot.floor,
      sourceTick: snapshot.tick, key,
      cpuBuildMs: +(performance.now() - rebuildStartedAt).toFixed(2),
      measurement: 'CPU synchronous real-world rebuild, not WebGL return, GPU or native video' };
    if (deferDistant) deferredDistantArrival = {
      key, runToken:snapshot.runToken, floor:snapshot.floor,
      height, sourceTick:snapshot.tick, state:'awaiting-actual-first-render',
      structureDeferred:deferStructuralShell, structureBuildMs:null,
      structureBuiltAtSubmitted:null, vistaBuiltAtSubmitted:null,
      firstRenderSubmitted:false, submittedFrames:0,
      proof:earnedSourceUploadWitness?'recorded-source-gateway':'adjacent-browser-guardian',
      material:null, fade:0, vistaMaterial:null, vistaFade:0,
      initialRebuildMs:+(performance.now()-rebuildStartedAt).toFixed(2),
      vistaBuildMs:null, deferredBuildMs:null,
    };
  }
  function noteFrameSubmitted(snapshot, options={}) {
    // A browser fetch, a failed renderer, stale source, another episode or
    // quality rebuild cannot unlock deferred GPU work. The caller invokes
    // this only AFTER the real renderer.render() has returned successfully.
    if(retainedEarnedCap && !options.stale && snapshot &&
        snapshot.runToken === retainedEarnedCap.runToken &&
        snapshot.floor === retainedEarnedCap.floor &&
        snapshot.tick >= retainedEarnedCap.sourceTick)
      retainedEarnedCap.submittedFrames = Math.min(10,retainedEarnedCap.submittedFrames+1);
    const job=deferredDistantArrival;
    if (!job || !['awaiting-actual-first-render','awaiting-structural-submission','awaiting-vista-submission'].includes(job.state) ||
        options.stale || !snapshot || snapshot.runToken!==job.runToken ||
        snapshot.floor!==job.floor ||
        key!==job.key || snapshot.tick<job.sourceTick) return false;
    // Exactly one GPU upload tranche per returned Three.js frame. HTTP
    // acceptance and JS animation never advance this queue. On context loss
    // or source/run switch, clearFloor() cancels the entire pending tranche.
    job.submittedFrames=Math.min(12,job.submittedFrames+1);
    job.firstRenderSubmitted=true;
    return true;
  }
  function update(snapshot,dt=0,time=0,options={},passageWitness=null){
    if(disposed||!snapshot)return;
    updateRetainedCap(snapshot,dt,options,passageWitness);
    const requestedQuality=options.quality==='low'?'low':options.quality==='high'?'high':'normal';
    if(key!==`${snapshot.runToken}:${snapshot.floor}:${snapshot.theme}:${requestedQuality}`)rebuild(snapshot,requestedQuality);
    lastSnapshot=snapshot;
    const arrival=deferredDistantArrival;
    function appendDeferredVista(arrival) {
      const began=performance.now();
      // The original three-layer, 8,640-triangle panorama uploads only
      // after a real scene frame has returned. Its actual source ground and
      // lethal geometry are never deferred or touched.
      buildVista(arrival.height);
      const vista=vistaGroup?.getObjectByName('tower-vista-cliffs');
      if(vista?.material){
        vista.material.transparent=true;
        vista.material.opacity=0;
        vista.material.depthWrite=false;
        arrival.vistaMaterial=vista.material;
      }
      arrival.vistaBuildMs=+(performance.now()-began).toFixed(2);
      arrival.vistaBuiltAtSubmitted=arrival.submittedFrames;
      arrival.state='awaiting-vista-submission';
    }
    if (arrival && arrival.key===key &&
        arrival.state==='awaiting-actual-first-render' &&
        arrival.submittedFrames>=1 && !options.stale &&
        !holdIncomingStructuralShell(snapshot,passageWitness,
          retainedEarnedCap,arrival)) {
      if (arrival.structureDeferred) {
        // Genuine 1x immutable source film 43300014722: the old bronze cap
        // survives as a real GPU mesh, yet a cold, fully rebuilt violet
        // monumental shaft appears over it while Three still takes ~1s to
        // submit the first F9 frame. Keep the ACTUAL F9 platforms and danger
        // in that first frame; upload its NON-INTERACTIVE shaft/citadel stage
        // only after it really returned. Reuse all ORIGINAL geometry, never
        // a proxy sky, collider, new floor, actor, fake threshold or cut.
        const began=performance.now(), before=floorGroup.children.length;
        const rotorCount=rotors.length, floaterCount=floaters.length;
        buildTower(arrival.height,false);
        const structuralRoot=new THREE.Group();
        structuralRoot.name='deferred-original-floor-nine-architecture';
        const added=floorGroup.children.slice(before);
        for(const child of added)structuralRoot.add(child);
        floorGroup.add(structuralRoot);
        // The authentic Void crystal halo and orbiting crystals must keep
        // moving at source tick, not become static rigid batches. The new
        // structure follows the SAME batching policy as the original floor:
        // animated roots are independent, everything else stays bounded.
        const deferredShellRotors=rotors.slice(rotorCount);
        const deferredShellFloaters=floaters.slice(floaterCount);
        const animatedStructuralRoots=new Set([
          ...deferredShellRotors.map(rotor=>rotor.o),
          ...deferredShellFloaters.map(floater=>floater.o)]);
        for(const rotor of deferredShellRotors) batchRigid(rotor.o);
        structuralRoot.traverse(object=>{
          if(!object.isMesh)return;
          object.castShadow=!object.userData.ambientDetail &&
            (!!object.userData.structural || object.material===materials.stone ||
              object.material===materials.dark);
          object.receiveShadow=!object.userData.ambientDetail;
        });
        batchRigid(structuralRoot,animatedStructuralRoots);
        const used=new Set();
        floorGroup.traverse(object=>{if(object.geometry)used.add(object.geometry);});
        for(const geometry of floorGeometries)if(!used.has(geometry)){
          geometry.dispose();floorGeometries.delete(geometry);
        }
        arrival.structureBuildMs=+(performance.now()-began).toFixed(2);
        arrival.structureBuiltAtSubmitted=arrival.submittedFrames;
        arrival.state='awaiting-structural-submission';
      } else appendDeferredVista(arrival);
    }
    if (arrival && arrival.key===key &&
        arrival.state==='awaiting-structural-submission' &&
        Number.isSafeInteger(arrival.structureBuiltAtSubmitted) &&
        arrival.submittedFrames>arrival.structureBuiltAtSubmitted &&
        !options.stale)
      appendDeferredVista(arrival);
    if (arrival && arrival.key===key &&
        arrival.state==='awaiting-vista-submission' &&
        Number.isSafeInteger(arrival.vistaBuiltAtSubmitted) &&
        arrival.submittedFrames>arrival.vistaBuiltAtSubmitted &&
        !options.stale) {
      const began=performance.now();
      // The seven authentic distant citadels form the SECOND deferred upload,
      // only after the real canyon has itself been submitted by Three.js.
      // Never defer ground, traps, navigation, source HP or the real gateway.
      const startChildCount=floorGroup.children.length;
      buildDistantWorld(arrival.height);
      // The normal low-tier rebuild rigid-batches seven supported citadels
      // into ONE real draw. Running them later must preserve that same GPU
      // and memory contract; otherwise the first-frame saving would become
      // a permanent 49-draw regression on real phones. Batch only the new
      // noninteractive rigid roots, never rebatch gameplay, moving decks,
      // guardian signals, or physics-aligned geometry.
      const farRoot=new THREE.Group();
      farRoot.name='deferred-authentic-distant-citadels';
      const additions=floorGroup.children.slice(startChildCount);
      for(const child of additions){
        if(child.name==='distant-citadel-silhouette')farRoot.add(child);
      }
      floorGroup.add(farRoot);
      farRoot.traverse(object=>{
        if(object.isMesh){
          object.castShadow=false;object.receiveShadow=false;
        }
      });
      batchRigid(farRoot);
      const far=quality==='low'
        ? [...floorMaterials].find(m=>m.name==='distant-atmosphere' &&
            m.type==='MeshBasicMaterial')
        : materials.distant;
      if(far){
        // Distant silhouettes appear through the existing fog rather than
        // popping in front of a newly reached floor. One owned material,
        // no new render passes, timers, shader swaps or blending after fade.
        far.transparent=true;far.depthWrite=false;far.opacity=0;
      }
      arrival.material=far||null;
      arrival.state='fading-remote-arrival';
      arrival.deferredBuildMs=+(performance.now()-began).toFixed(2);
      arrival.fade=0;
    }
    if(arrival?.vistaMaterial && !options.stale &&
        ['awaiting-vista-submission','fading-remote-arrival'].includes(arrival.state)){
      arrival.vistaFade=options.reducedMotion?1:
        Math.min(1,arrival.vistaFade+Math.min(.08,Math.max(0,dt))/0.55);
      arrival.vistaMaterial.opacity=arrival.vistaFade;
    }
    if (arrival && arrival.state==='fading-remote-arrival' &&
        !options.stale) {
      arrival.fade=options.reducedMotion?1:
        Math.min(1,arrival.fade+Math.min(.08,Math.max(0,dt))/0.55);
      if(arrival.material)arrival.material.opacity=arrival.fade;
      if(arrival.fade>=1 && arrival.vistaFade>=1){
        arrival.state='complete';
        // Retire transient transparency so the full original geological
        // panorama does not incur permanent alpha sorting or overdraw cost.
        if(arrival.vistaMaterial){
          arrival.vistaMaterial.transparent=false;
          arrival.vistaMaterial.depthWrite=true;
          arrival.vistaMaterial.needsUpdate=true;
        }
      }
    }
    // QUIET -> CRISIS -> RELEASE across all five actual 3D tower biomes.
    // On verified guardian combat or a near dangerous shutter, decorative
    // machinery, furnace glare, motes and distant clouds yield to the
    // source-owned climber/route/guardian. Real hazard teeth, warning lights,
    // moving-deck mechanism and guardian gate are NEVER dimmed or slowed.
    // Threat priority is immediate, release is damped to avoid eye-catching
    // brightness pumping during frequent source snapshots.
    if(!options.stale){
      const priority=observedSceneHierarchy(snapshot);
      sceneFocusKind=priority.kind;
      if(priority.focus>=sceneFocus||options.reducedMotion)sceneFocus=priority.focus;
      else{
        const seconds=Math.min(.10,Math.max(0,Number.isFinite(dt)?dt:0));
        sceneFocus+=(priority.focus-sceneFocus)*(1-Math.exp(-seconds*2.4));
      }
    }
    materials.furnaceCore.emissiveIntensity=.72*(1-.66*sceneFocus);
    materials.particle.emissiveIntensity=1-.78*sceneFocus;
    materials.particle.color.set(PALETTES[theme].glow).multiplyScalar(1-.48*sceneFocus);
    materials.cloud.opacity=.075*(1-.42*sceneFocus);
    for(const p of snapshot.platforms||[]){const entry=platforms.get(p.id);if(!entry)continue;entry.root.rotation.y=angleFor(p.x+p.width*.5,snapshot.worldWidth);entry.root.position.y=(p.y-snapshot.chunkBaseY)/SCALE;entry.root.userData.authority={x:p.x,y:p.y,width:p.width,height:p.height};
      if(entry.traveler){
        // Only consecutive authoritative source observations can turn the
        // wheel. No wall clock, projected position or simulated velocity.
        if(Number.isSafeInteger(snapshot.tick) && Number.isSafeInteger(entry.sourceTick)
          && snapshot.tick<entry.sourceTick){
          entry.traveler.rotation.z=0;
          entry.countergear.rotation.z=0;
          entry.actuator.rotation.z=0;
          entry.actuator.position.y=entry.actuator.userData.restY;
          entry.motionSourceTick=null;
          entry.sourceX=null;entry.sourceTick=null;
        }
        if(!options.stale && !options.reducedMotion &&
          Number.isSafeInteger(snapshot.tick) && Number.isSafeInteger(entry.sourceTick)
          && snapshot.tick>entry.sourceTick && snapshot.tick-entry.sourceTick<=8
          && Number.isFinite(entry.sourceX) && Number.isFinite(p.x)){
          const turn=(p.x-entry.sourceX)/SCALE/.72;
          if(Number.isFinite(turn) && Math.abs(turn)<=4){
            // A genuine displacement turns opposing gears and compresses a
            // carriage piston. At a duplicate tick, stale source or reduced
            // motion preference these mechanics cannot advance independently.
            entry.traveler.rotation.z+=turn;
            entry.countergear.rotation.z-=turn*.72/.66;
            entry.actuator.rotation.z=THREE.MathUtils.clamp(turn*.065,-.22,.22);
            entry.actuator.position.y=entry.actuator.userData.restY-
              Math.min(.32,Math.abs(turn)*.105);
            entry.motionSourceTick=snapshot.tick;
          }
        }
        // A real climber can load the SOURCE deck beneath the same moving
        // carriage. Check the actual feet/top and horizontal collision
        // overlap, not its selected future route. The piston remains a visual
        // follower; it never feeds back into platform physics or AI.
        const rider=snapshot.player;
        const feet=rider?.y-rider?.halfHeight;
        const physicallyLoaded=!options.stale && rider?.health>0 &&
          rider?.state==='standing' &&
          Number.isFinite(feet) && Number.isFinite(rider?.x) &&
          Number.isFinite(rider?.halfWidth) && rider.halfWidth>0 &&
          Math.abs(feet-(p.y+p.height))<=2500 &&
          rider.x+rider.halfWidth>=p.x &&
          rider.x-rider.halfWidth<=p.x+p.width;
        // A grounded contact changes the piston only on a fresh source tick.
        // The 0.22-unit stroke is subtle enough for stillness on a phone,
        // with a tangible compressed end state even if motion is reduced.
        if(!options.stale && Number.isSafeInteger(snapshot.tick) && snapshot.tick>=0
          && (entry.sourceTick===null || snapshot.tick>entry.sourceTick)){
          const freshDrive=!options.reducedMotion &&
            entry.motionSourceTick===snapshot.tick;
          // Reduced-motion changes cannot create an unobserved new stroke;
          // hold an already witnessed displacement, except an authentic
          // rider dismount must still release the weighted carriage.
          const unloaded=entry.actuator.userData.loaded===true && !physicallyLoaded;
          const travel=freshDrive || (options.reducedMotion && !unloaded)
            ? Math.max(0,entry.actuator.userData.restY-entry.actuator.position.y):0;
          const contact=physicallyLoaded ? .22 : 0;
          // A previous tick's suspension stroke cannot remain as a ghost
          // load once the real deck stops or the climber leaves it.
          entry.actuator.position.y=entry.actuator.userData.restY-
            Math.min(.42,Math.max(contact,travel));
          entry.actuator.userData.loaded=physicallyLoaded;
          entry.sourceTick=snapshot.tick;entry.sourceX=p.x;
        }
        // One shared instanced draw follows both actual source-bound gear
        // proxy angles. No extra clock/physics, speculative destination or
        // per-tick geometry allocation; keep conservative culling disabled.
        if(entry.gearVisual){
          const carriedWeight=entry.actuator.userData.loaded===true;
          if(entry.gearVisual.userData.loaded!==carriedWeight){
            // The same authentic deck contact that compresses the piston
            // lights its real metal teeth; never imply an anticipated ride.
            entry.gearVisual.setColorAt(0,tint.set(carriedWeight?0xffe8c8:0xffffff));
            entry.gearVisual.setColorAt(1,tint.set(carriedWeight?0xacf9da:0xb1d6e0));
            entry.gearVisual.instanceColor.needsUpdate=true;
            entry.gearVisual.userData.loaded=carriedWeight;
          }
          for(const [index,gear] of [entry.traveler,entry.countergear].entries()){
            dummy.position.copy(gear.position);
            dummy.rotation.set(0,0,gear.rotation.z);
            const size=index===0?1:.88;
            dummy.scale.set(size,size,size);dummy.updateMatrix();
            entry.gearVisual.setMatrixAt(index,dummy.matrix);
          }
          entry.gearVisual.instanceMatrix.needsUpdate=true;
        }
      }
      if(entry.guardianGate){
        // A cap can move or appear at a different height in a replay. Anchor
        // its independent decorative doorway to the exact live cap transform.
        // The doorway's child inset remains safely inside the walking radius.
        const anchorX=guardianGateAnchorX(snapshot,p);
        entry.guardianGate.anchorX=anchorX;
        entry.guardianGate.frame.rotation.y=angleFor(anchorX,snapshot.worldWidth);
        entry.guardianGate.frame.position.set(0,entry.root.position.y+p.height/SCALE,0);
        // Only the genuine, present guardian's authoritative active state can
        // release the gate. A missing snapshot or transport outage never
        // fabricates a victory. On a mid-run renderer rebuild, it rehydrates
        // directly to the current observed state without replaying a cue.
        const guardian=(snapshot.enemies||[]).find(enemy=>enemy.kind==='guardian');
        if(guardian){
          // Inactive does not automatically mean beaten: only a genuine
          // source-observed zero-HP guardian can fully open the crest and
          // leaves. This matches the authoritative gate and earned passage.
          const unlocked=guardian.active===false &&
            Number.isFinite(guardian.health) && guardian.health<=0;
          const gate=entry.guardianGate;
          // Real guardian health is the encounter's visible progression
          // currency. The source often moves straight from final hit to the
          // next floor, so a door that reacts ONLY to inactive guardians
          // would never be seen opening in actual autonomous play.
          // Incrementally separate the original physical bronze wings as
          // real hit points fall, reserving full passage for a real defeat.
          const healthRatio=Number.isFinite(guardian.health)&&
            Number.isFinite(guardian.maxHealth)&&guardian.maxHealth>0
            ? THREE.MathUtils.clamp(guardian.health/guardian.maxHealth,0,1):1;
          const target=unlocked?1:(1-healthRatio)*.72;
          // A living, physically walking climber can arrive at the
          // AUTHENTICALLY defeated gate faster than presentation easing.
          // Clear the source-open leaves by physical arrival, while keeping
          // the ordinary slow HP-driven counterweights for distant viewers.
          // Never anticipate defeat or bypass the real collider/rules.
          const arrivalOpen=unlocked&&Number.isFinite(snapshot.player?.x)&&
            Number.isFinite(p.width)&&p.width>0
            ? THREE.MathUtils.clamp((p.width*.36-
              Math.abs(snapshot.player.x-anchorX))/(p.width*.24),0,1):0;
          if(gate.progress===null || options.reducedMotion)gate.progress=target;
          else if(!options.stale){
            // Calibrated to real displayed dt: a slow render still catches
            // up visibly, whereas a fast renderer opens smoothly. No timer
            // changes tower ticks or asserts a hit before the source does.
            const step=Math.min(Math.max(dt,0),.25)*1.8;
            gate.progress+=Math.sign(target-gate.progress)*Math.min(Math.abs(target-gate.progress),step);
          }
          if(unlocked&&!options.stale)gate.progress=Math.max(gate.progress,arrivalOpen);
          gate.unlocked=unlocked;
          for(const {side,wing} of gate.wings)wing.position.x=gate.progress===0?0:side*gate.progress*2.8;
          for(const {side,carriage} of gate.counterweights){
            // Slide each mass within its actual vertical steel guide. The old
            // side-dependent rotation revolved it around the distant gate
            // origin, lifting its bounding box by ~0.75m and visibly
            // detaching its cable from the bronze socket.
            carriage.position.y=-gate.progress*2.35;
            carriage.rotation.z=0;
          }
          // No invented impulse: the wheel turns and the cables spool only
          // as the true source-driven weights descend. Reduced motion retains
          // the new cable length but not the extra winding rotation.
          gate.capstan.rotation.z=options.reducedMotion?0:gate.progress*Math.PI*1.45;
          // Drive each actual tension line from the positioned overhead
          // structural support to its OWN physically moving weight socket.
          // Before this coupling, the outboard rebuild left cable length
          // animated from a SECOND duplicated formula; the old regression
          // detected a mismatch when the transmission was raised. There is
          // now exactly one observable carriage state: guardian HP -> weight
          // translation -> exact cable endpoint. No future source tick,
          // physics authority or decorative clock supplies displacement.
          const anchorY=gate.overhead.position.y;
          for(const [index,{side,carriage,socket}] of gate.counterweights.entries()){
            const socketY=carriage.position.y+socket.position.y;
            const cableLength=anchorY-socketY;
            gate.tensionPose.position.set(socket.position.x,
              (anchorY+socketY)*.5,
              (gate.overhead.position.z+socket.position.z)*.5);
            gate.tensionPose.rotation.set(0,0,0);
            gate.tensionPose.scale.set(.047,cableLength,.047);
            gate.tensionPose.updateMatrix();
            gate.tension.setMatrixAt(index,gate.tensionPose.matrix);
            // Real bearing at the same overhead cable anchor, rotating
            // with the identical HP-driven source progress. Reduced motion
            // keeps the downward mechanical state but suppresses rotation.
            gate.spoolPose.position.set(
              side*GUARDIAN_TRANSMISSION_LAYOUT.counterweightX,0,.04);
            gate.spoolPose.rotation.set(0,0,
              options.reducedMotion?0:-side*gate.progress*Math.PI*1.1);
            gate.spoolPose.scale.set(1,1,1);
            gate.spoolPose.updateMatrix();
            gate.spools.setMatrixAt(index,gate.spoolPose.matrix);
          }
          gate.tension.instanceMatrix.needsUpdate=true;
          gate.spools.instanceMatrix.needsUpdate=true;
          gate.crest.scale.x=1+gate.progress*.2;
          // The path advances with the HP-driven lock, never invented clearance.
          // It ends inside the real deck's outer rim and has no collider.
          // The core-visible frame starts radially farther out than the
          // historical inset. Keep its HP-fed conduit entirely over the cap,
          // not dangling beyond the support ring after a true defeat.
          gate.conduit.scale.z=.18+gate.progress*GUARDIAN_CAP_CORRIDOR.conduitReach;
          gate.conduit.scale.x=.18+gate.progress*.12;
          gate.conduit.position.z=.25+gate.conduit.scale.z*.5;
          gate.crest.material=unlocked?materials.mint:materials.warning;
          gate.crest.rotation.z=gate.progress*Math.PI*.5;
        }
      }
    }
    for(const h of snapshot.hazards||[]){
      const e=hazards.get(h.id);if(!e)continue;
      const p=pointFor(h.x+h.width*.5,h.y,snapshot.chunkBaseY,snapshot.worldWidth,25);
      e.root.position.set(p.x,p.y,p.z);e.root.rotation.y=p.angle;
      e.live.visible=!!h.active;e.active=!!h.active;
      e.indicator.material=h.active?materials.warning:materials.mint;
      if(e.spin&&!options.reducedMotion&&!options.stale)e.spin.rotation.z=time*.35;
      const active=!!h.active && !options.stale &&
        snapshot.lifecycle!=='result' && snapshot.lifecycle!=='intermission';
      e.indicator.scale.y=active ? Math.max(.55,Math.min(3,h.height/SCALE)) : .10;
      e.indicator.userData.activePressureTeeth=active?8:0;
    }
    if(!options.reducedMotion&&!options.stale){
      // Only ambient clockwork and decorative floating crystals are retimed.
      // Moving-platform drivetrain and source-owned traps above remain true.
      const decorativeRate=1-.72*sceneFocus;
      for(const r of rotors)r.o.rotation[r.axis||'z']+=Math.min(dt,.05)*r.speed*decorativeRate;
      for(const f of floaters)f.o.position.y=f.y+
        Math.sin(time*f.speed+f.phase)*.23*decorativeRate;
    }
    if(particles){particles.visible=quality!=='low';if(!options.reducedMotion&&quality!=='low'){
      const items=particles.userData.items;for(let i=0;i<items.length;i++){const s=items[i];dummy.position.set(s.p[0]+Math.sin(time*.13+i)*.2,s.p[1]+Math.sin(time*.19+i*.5)*.7,s.p[2]);dummy.rotation.set(0,0,0);dummy.scale.set(...s.s);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}particles.instanceMatrix.needsUpdate=true;
    }}
  }
  // The actual phone footage at source 5b589470 shows enormous clockwork
  // foreground teeth occupying the climber/guardian picture in real motion.
  // Protect the player's PRESENT skinned head, current living guardian and
  // committed airborne landing with camera-to-world geometry rays. Only the
  // THREE DECORATIVE gears may soften. Combatants, real route platforms,
  // hazard warnings, structural supports and source-driven machinery remain
  // solid. This is render-only; it cannot predict a safe path or modify AI.
  // A camera-facing silhouette can monopolize the narrow phone picture even
  // if no exact center-ray hits the climber. Treat only NON-GAMEPLAY decorative
  // gear teeth as progressively translucent near an authentic subject; actual
  // platforms, guardian, hazards and moving-deck machinery remain opaque.
  function protectRouteSightlines(camera, actor=null, guardian=null, landing=null, dt=0, options={},
      actorHalfHeight=0, guardianHalfHeight=0, hazard=null, gateway=null) {
    if(disposed)return {total:0,softened:0};
    decorativeOcclusionEvidence.length=0;
    if(!decorativeSightlines.length){
      occludedForegroundGears=0;occludedForegroundScreenGears=0;occludedForegroundCorridorGears=0;occludedForegroundClockFaces=0;
      return {total:0,softened:0};
    }
    const enabled=!!camera&&!!actor&&!options.stale&&
      Number.isFinite(camera.position?.x)&&Number.isFinite(camera.position?.y)&&
      Number.isFinite(camera.position?.z);
    let softened=0, screenSoftened=0, corridorSoftened=0, clockFacesSoftened=0;
    const pendingDecorativeOpacity=[];
    const targets=enabled?[actor,guardian,landing,hazard,gateway]:[];
    let corridorCount=0, actorDepth=0;
    if(enabled){
      camera.updateMatrixWorld(true);
      corridorFrom.copy(actor).project(camera);
      actorDepth=camera.position.distanceTo(actor);
      // The real guardian, source-selected landing, observed trap and earned
      // gateway are four independent source endpoints with retained buffers.
      for(let index=0;index<4;index++){
        const partner=index===0?guardian:index===1?landing:index===2?hazard:gateway;
        if(!partner||![partner.x,partner.y,partner.z].every(Number.isFinite))continue;
        corridorTo[corridorCount].copy(partner).project(camera);
        corridorDepths[corridorCount]=camera.position.distanceTo(partner);
        corridorGuardians[corridorCount]=index===0 || index===2;
        corridorCount++;
      }
    }
    for(const entry of decorativeSightlines){
      let requiredOpacity=1, softByProjection=false, softByCorridor=false,
        softByBackdrop=false;
      let projectedScreenCoverage=0, sceneFrontDepth=null, rayContactCount=0,
        rayBoundsRejects=0, rayNarrowphaseChecks=0,
        projectedNearPlane=false, projectedActorFront=false, screenBounds=null;
      if(enabled){
        // Sibling clock backings share the gear's sightline, but not its
        // scene subtree. Refresh their matrices before authentic ray queries.
        if (entry.sceneryParent) entry.sceneryParent.updateWorldMatrix(true,true);
        else entry.root.updateWorldMatrix(true,true);
        entry.root.getWorldPosition(screenGearWorld);
        screenGearCenter.copy(screenGearWorld).project(camera);
        // Project the wheel's REAL local horizontal and vertical rim. The
        // old camera-right approximation could undercount an oblique giant
        // wheel's screen footprint (especially while orbiting on portrait).
        screenGearRight.set(entry.radius,0,0)
          .applyMatrix4(entry.root.matrixWorld).project(camera);
        screenGearTop.set(0,entry.radius,0)
          .applyMatrix4(entry.root.matrixWorld).project(camera);
        const radius=Math.max(
          Math.hypot((screenGearRight.x-screenGearCenter.x)*camera.aspect,
            screenGearRight.y-screenGearCenter.y),
          Math.hypot((screenGearTop.x-screenGearCenter.x)*camera.aspect,
            screenGearTop.y-screenGearCenter.y));
        const gearDepth=camera.position.distanceTo(screenGearWorld);
        // The original clock-face rigid batches live OUTSIDE their gear
        // groups. Include post-batch meshes; otherwise a huge rim/case can
        // fill the image while its tiny gear centre is offscreen. Three.js
        // bounds use retained local geometry boxes, not per-vertex traversal.
        decoratedBounds.makeEmpty();
        decoratedBounds.expandByObject(entry.root);
        for(const mesh of entry.sceneryMeshes)decoratedBounds.expandByObject(mesh);
        let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
        let frontCorners=0,nearClipped=false;
        for(let corner=0;corner<8;corner++){
          decoratedCorner.set(corner&1?decoratedBounds.max.x:decoratedBounds.min.x,
            corner&2?decoratedBounds.max.y:decoratedBounds.min.y,
            corner&4?decoratedBounds.max.z:decoratedBounds.min.z);
          decoratedCorner.applyMatrix4(camera.matrixWorldInverse);
          if(decoratedCorner.z>=-camera.near){nearClipped=true;continue;}
          decoratedCorner.applyMatrix4(camera.projectionMatrix);
          if(!Number.isFinite(decoratedCorner.x)||!Number.isFinite(decoratedCorner.y))continue;
          frontCorners++;
          left=Math.min(left,decoratedCorner.x);right=Math.max(right,decoratedCorner.x);
          bottom=Math.min(bottom,decoratedCorner.y);top=Math.max(top,decoratedCorner.y);
        }
        if(frontCorners>0){
          // A box crossing the near plane occupies the visible foreground,
          // even when its centre is behind or outside the screen frustum.
          if(nearClipped){left=Math.min(left,-1);right=Math.max(right,1);
            bottom=Math.min(bottom,-1);top=Math.max(top,1);}
          projectedNearPlane=nearClipped;
          screenBounds={minX:left,maxX:right,minY:bottom,maxY:top};
          projectedScreenCoverage=Math.max(0,Math.min(1,right)-Math.max(-1,left))*
            Math.max(0,Math.min(1,top)-Math.max(-1,bottom))*.25;
          sceneFrontDepth=decoratedBounds.distanceToPoint(camera.position);
          projectedActorFront=sceneFrontDepth+.25<actorDepth;
          const envelope=observedPortraitDecorativeEnvelope({
            aspect:camera.aspect,minX:left,maxX:right,minY:bottom,maxY:top,
            nearestDepth:sceneFrontDepth,actorDepth,
          });
          if(envelope<requiredOpacity){requiredOpacity=envelope;softByProjection=true;}
        }
        // This is a genuine projected scenic footprint, not a synthetic
        // actor marker. Prevent a giant FRONT wheel from monopolizing portrait
        // gameplay before the player crosses the authentic guardian doorway.
        // Existing full-body rays and camera/core safety remain independent.
        const dominance=observedPortraitGearDominance({
          aspect:camera.aspect,gear:screenGearCenter,radius,gearDepth,
          actor:corridorFrom,actorDepth,
        });
        if (dominance < requiredOpacity) {
          requiredOpacity=dominance;
          softByProjection=true;
        }
        for(let index=0;index<corridorCount;index++){
          const corridorOpacity=observedStageCorridorOpacity({
            aspect:camera.aspect,gear:screenGearCenter,radius,gearDepth,
            from:corridorFrom,to:corridorTo[index],
            fromDepth:actorDepth,toDepth:corridorDepths[index],
            guardian:corridorGuardians[index],
          });
          if(corridorOpacity<1){
            requiredOpacity=Math.min(requiredOpacity,corridorOpacity);
            softByProjection=true;softByCorridor=true;
          }
        }
        for(let index=0;index<targets.length;index++){
          const point=targets[index];
          if(!point||![point.x,point.y,point.z].every(Number.isFinite))continue;
          // The existing center ray missed genuine hero/guardian legs behind
          // clock cases in portrait. Protect their real full-body silhouettes,
          // sampled from source half-height; landings and genuine hazard warning
          // positions each remain a single, non-predicted world point.
          const span=observedSilhouetteSpan(index===0?actorHalfHeight:
            index===1?guardianHalfHeight:0);
          for(let sample=0;sample<(span>0?3:1);sample++){
            const subject=sample===0?point:silhouettePoint.copy(point);
            if(sample>0)subject.y+=(sample===1?-span:span);
            canopyDirection.copy(subject).sub(camera.position);
            const length=canopyDirection.length();
            if(!Number.isFinite(length)||length<=.25)continue;
            canopyRay.set(camera.position,canopyDirection.multiplyScalar(1/length));
            canopyRay.near=0;canopyRay.far=length-.20;
            // Conservative BROADPHASE over the already projected, post-batch
            // world-space bounds of BOTH moving rotor and rendered clock case.
            // A ray that misses this union cannot hit any owned triangle.
            // Do not shorten the box test by raycaster.far: an infinite ray
            // can produce false positives, never a false negative.
            let gearHit=false,caseHit=false;
            if(decoratedBounds.isEmpty() ||
                canopyRay.ray.intersectsBox(decoratedBounds)){
              rayNarrowphaseChecks++;
              canopyHits.length=0;
              gearHit=canopyRay.intersectObject(entry.root,true,canopyHits).length>0;
              canopyHits.length=0;
              if(!gearHit&&entry.sceneryMeshes?.length>0)
                caseHit=canopyRay.intersectObjects(
                  entry.sceneryMeshes,false,canopyHits).length>0;
              canopyHits.length=0;
            }else rayBoundsRejects++;
            if(gearHit||caseHit){
              rayContactCount++;
              requiredOpacity=Math.min(requiredOpacity,index===2?.48:.24);
            }else if(gearDepth+.4<length&&radius>0&&Number.isFinite(radius)&&
              screenGearCenter.z>=-1&&screenGearCenter.z<=1){
              // Only the present physical silhouette, not a speculative route.
              screenFocus.copy(subject).project(camera);
              const gap=Math.hypot(
                (screenGearCenter.x-screenFocus.x)*camera.aspect,
                screenGearCenter.y-screenFocus.y);
              if(screenFocus.z>=-1&&screenFocus.z<=1&&
                gap<Math.min(2.2,radius)+(index===2?.14:.22)){
                requiredOpacity=Math.min(requiredOpacity,index===2?.70:.52);
                softByProjection=true;
              }
            }
            // Exact occlusion of the most important physical actor already
            // requests the maximum softness; avoid redundant rays on mobile.
            if(requiredOpacity<=.24)break;
          }
        }
      }
      // A true action has at least two source-selected endpoints. A giant
      // backdrop may monopolize the phone shot even when its nearest world
      // bound sits behind the actor, so exact front-only ray tests cannot
      // address this distinct visual-readability failure.
      if(enabled && screenBounds && !projectedActorFront &&
          rayContactCount===0) {
        const backdrop=observedPortraitActionBackdropOpacity({
          aspect:camera.aspect,bounds:screenBounds,actor:corridorFrom,
          partners:corridorTo,partnerCount:corridorCount,
          coverage:projectedScreenCoverage,
        });
        if(backdrop<requiredOpacity){
          requiredOpacity=backdrop;softByProjection=true;
          softByBackdrop=true;
        }
      }
      // Keep the decision until ALL current foreground assemblies have been
      // projected. Old one-by-one alpha could never bound multi-wheel stacking.
      pendingDecorativeOpacity.push({
        entry,rawOpacity:requiredOpacity,screenBounds,projectedActorFront,
        softByProjection,softByCorridor,softByBackdrop,projectedScreenCoverage,
        sceneFrontDepth,projectedNearPlane,rayContactCount,actorDepth,
        rayBoundsRejects,rayNarrowphaseChecks,
      });
    }
    // One camera-frame composite budget across source-independent decorative
    // wheels and rack. At most 4 decisions / 12 other-pair comparisons.
    // Real player, guardian, collidable decks, pressure traps and exit unchanged.
    for(const decision of pendingDecorativeOpacity){
      const {entry,screenBounds,projectedActorFront,softByProjection,
        softByCorridor,softByBackdrop,projectedScreenCoverage,sceneFrontDepth,
        projectedNearPlane,rayContactCount,actorDepth,
        rayBoundsRejects,rayNarrowphaseChecks}=decision;
      let companions=0;
      if(decision.rawOpacity<1 && screenBounds &&
          (projectedActorFront || rayContactCount>0 || softByBackdrop)){
        for(const other of pendingDecorativeOpacity){
          if(other===decision || other.rawOpacity>=1 ||
             !other.screenBounds ||
             !(other.projectedActorFront || other.rayContactCount>0 ||
                other.softByBackdrop))continue;
          if(observedScreenEnvelopeOverlap(screenBounds,other.screenBounds))
            companions++;
        }
      }
      const requiredOpacity=decision.rawOpacity<1
        ? observedStackedDecorativeOpacity(decision.rawOpacity,
            Math.min(8,2+entry.sceneryMeshes.length),Math.min(3,companions))
        : 1;
      const strength=options.reducedMotion||!enabled?1:
        Math.max(0,Math.min(1,(Number.isFinite(dt)?dt:0)*10));
      entry.alloy.opacity+=(requiredOpacity-entry.alloy.opacity)*strength;
      if(Math.abs(requiredOpacity-entry.alloy.opacity)<.002)
        entry.alloy.opacity=requiredOpacity;
      const solid=entry.alloy.opacity>=.985;
      entry.alloy.depthWrite=solid;
      entry.trim.opacity=entry.alloy.opacity;
      entry.trim.depthWrite=solid;
      const protectedClockFace=syncClockFaceSightline(entry);
      if(enabled){
        decorativeOcclusionEvidence.push({
          name:entry.sceneryParent?.name||entry.root.parent?.name||entry.root.name,
          kind:foregroundRacks.includes(entry)?'decorative-rack':'decorative-clock',
          sourceTick:Number.isSafeInteger(lastSnapshot?.tick)?lastSnapshot.tick:null,
          screenCoverage:Number(projectedScreenCoverage.toFixed(4)),
          nearestWorldDepth:sceneFrontDepth===null?null:Number(sceneFrontDepth.toFixed(2)),
          sourceActorDepth:Number(actorDepth.toFixed(2)),
          inFrontOfActor:projectedActorFront,
          nearPlaneCrossing:projectedNearPlane,
          rayContactCount,
          rayBoundsRejects,
          rayNarrowphaseChecks,
          raySamples:rayBoundsRejects+rayNarrowphaseChecks,
          cameraProjectionSoftened:softByProjection,
          actionCorridorSoftened:softByCorridor,
          decorativeBackdropSoftened:softByBackdrop,
          sourceActionEndpoints:corridorCount,
          sourceHazardObserved:!!hazard,
          stackedForegroundCompanions:companions,
          rawAssemblyAlpha:Number(decision.rawOpacity.toFixed(4)),
          intendedAlpha:Number(requiredOpacity.toFixed(4)),
          renderedAlpha:Number(entry.alloy.opacity.toFixed(4)),
          clockCaseMeshes:entry.sceneryMeshes.length,
        });
      }
      if(protectedClockFace)clockFacesSoftened++;
      if(!solid)softened++;
      if(softByProjection)screenSoftened++;
      if(softByCorridor)corridorSoftened++;
    }
    occludedForegroundGears=softened;
    occludedForegroundScreenGears=screenSoftened;
    occludedForegroundCorridorGears=corridorSoftened;
    occludedForegroundClockFaces=clockFacesSoftened;
    return {total:decorativeSightlines.length,softened};
  }
  function revealGuardianSightlines(camera, crestPoints=[]) {
    if(disposed||!camera)return;
    let faded=0;
    for(const entry of platforms.values()){
      if(!entry.capMaterials.length)continue;
      entry.root.updateWorldMatrix(true,true);
      let blocked=false;
      for(const crest of crestPoints){
        canopyDirection.copy(crest).sub(camera.position);
        const distance=canopyDirection.length();
        if(!Number.isFinite(distance)||distance<=.1)continue;
        canopyRay.set(camera.position,canopyDirection.multiplyScalar(1/distance));
        canopyRay.near=0;canopyRay.far=distance-.05;
        if(canopyRay.intersectObject(entry.root,true).length){blocked=true;break;}
      }
      // The guarded enemy remains behind the physical cap. Only the cap's
      // camera-obstructing pixels soften, preserving the drawn deck/rim as a
      // translucent climbable surface, depth-tested against other obstacles.
      // No overlays, x-ray characters, authoring edits or renderer allocations.
      for(const material of entry.capMaterials){
        material.opacity=blocked?.32:1;
        material.depthWrite=!blocked;
      }
      if(blocked)faded++;
    }
    occludedGuardianCaps=faded;
  }
  // Safe source-proven transition handle: avoid diagnostics()'s whole-scene
  // traversal in the camera/light hot path; never expose writable GPU roots.
  function retainedFilmHandoff(snapshot) {
    const held=retainedEarnedCap;
    return observedSourceEarnedColdFrameContinuation(snapshot,held)
      ? {runToken:held.runToken,floor:held.floor,sourceTick:held.sourceTick,
        crossingTick:held.crossingTick,
        thresholdX:held.thresholdX,oldRoofY:held.oldRoofY,
        oldCapId:held.oldCapId,oldCapX:held.oldCapX,
        oldCapWidth:held.oldCapWidth,submittedFrames:held.submittedFrames,
        visibleSeconds:held.visibleSeconds} : null;
  }
  function lastRebuild() { return lastRebuildWitness ? { ...lastRebuildWitness } : null; }
  function diagnostics(){let objects=0,meshes=0,instances=0,shadowCasterMeshes=0,triangles=0;group.traverse(o=>{objects++;if(o.isMesh){meshes++;if(o.castShadow)shadowCasterMeshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}if(o.isInstancedMesh)instances+=o.count;});return{objects,meshes,instances,shadowCasterMeshes,triangles,
    retainedSourceCap:retainedEarnedCap?{
      visible:retainedEarnedCap.root.visible,
      guardianGateRetained:retainedEarnedCap.guardianGateRetained === true,
      sourceAlignedPassage:retainedEarnedCap.sourceAlignedPassage===true,
      originalBronzeDeckMeshes:retainedEarnedCap.originalBronzeDeckMeshes,
      actualOldCapSupport:observedRetainedOriginalCapRoofContact(lastSnapshot,retainedEarnedCap),
      originalCapId:retainedEarnedCap.oldCapId,
      originalBronzeDeckOpacity:retainedEarnedCap.originalDeckSurface
        ? Number(retainedEarnedCap.originalDeckSurface.opacity.toFixed(4)) : null,
      originalBronzeDeckDepthTested:retainedEarnedCap.originalDeckSurface?.depthTest===true,
      sharedPhysicalRoofColor:platforms.get('f9:ground')?.arrivalSurface?.color.getHexString()??null,
      runToken:retainedEarnedCap.runToken,floor:retainedEarnedCap.floor,
      sourceTick:retainedEarnedCap.sourceTick,
      crossingTick:retainedEarnedCap.crossingTick,
      firstObservedTick:retainedEarnedCap.firstObservedTick,
      firstWorldRenderTick:retainedEarnedCap.firstWorldRenderTick,
      pendingSourceTickGap:retainedEarnedCap.firstWorldRenderTick-
        retainedEarnedCap.firstObservedTick,
      submittedFrames:retainedEarnedCap.submittedFrames,
      visibleSeconds:Number(retainedEarnedCap.visibleSeconds.toFixed(3)),
      geometryCount:retainedEarnedCap.ownedGeometries.size,
      materialCount:retainedEarnedCap.ownedMaterials.size,
      purpose:'Original GPU-resident cap AND HP-opened separate real guardian doorway retained under one source-grounded transform; no new physics, GPU-pixel or blind-review claim'
    }:null,
    rigidBatchUploadBudget:{actualAttributeAndIndexBytes:rigidUploadBytes,
      previousExpandedAttributeBytes:rigidExpandedBytes,
      indexedBatches:rigidIndexedBatches,batches:rigidBatchCount,
      interleavedVertexBuffers:rigidPackedVertexBuffers,
      formerSeparateVertexAttributeBuffers:rigidPriorSeparateVertexBuffers,
      caveat:'CPU-side Three BufferGeometry payload, not GPU allocated memory or measured FPS'},
    geometries:floorGeometries.size+primitives.size,materials:floorMaterials.size,platforms:platforms.size,hazards:hazards.size,activeHazardPressureFins:[...hazards.values()].reduce((n,h)=>n+(h.indicator.userData.activePressureTeeth||0),0),observedMovingDeckCranks:[...platforms.values()].filter(p=>p.traveler).length,observedMovingDeckDriveStages:[...platforms.values()].filter(p=>p.countergear&&p.actuator).length,observedMovingDeckGearBatches:[...platforms.values()].filter(p=>p.gearVisual?.count===2).length,observedMovingDeckDriveLastTick:[...platforms.values()].reduce((latest,p)=>Math.max(latest,p.motionSourceTick??-1),-1),ambientParticles:particles?.visible?48:0,sceneHierarchy:{sourceBound:true,kind:sceneFocusKind,decorativeFocus:Number(sceneFocus.toFixed(4)),addsDraws:0,physicsUnchanged:true},floor:lastSnapshot?.floor??null,theme,quality,disposed,guardianGates:[...platforms.entries()].filter(([,p])=>p.guardianGate).map(([id,p])=>({id,unlocked:p.guardianGate.unlocked,opening:p.guardianGate.progress,conduitReach:p.guardianGate.conduit.scale.z,anchorX:p.guardianGate.anchorX})),occludedGuardianCaps,occludedForegroundGears,occludedForegroundScreenGears,occludedForegroundCorridorGears,occludedForegroundClockFaces,
    decorativeOcclusionEvidence:decorativeOcclusionEvidence.map(item=>({...item})),
    decorativeSightlineGears:foregroundGears.length,decorativeSightlineRacks:foregroundRacks.length,clockFaceRayMeshes:foregroundGears.reduce((n,gear)=>n+gear.sceneryMeshes.length,0),ruinsPortalVoussoirs,ruinsGateLeaves,ruinsSanctuaryArches,ruinsSanctuaryPlants,ruinsSanctuaryCascadePanels,deferredDistantArrival:deferredDistantArrival?{
      floor:deferredDistantArrival.floor,
      sourceTick:deferredDistantArrival.sourceTick,
      state:deferredDistantArrival.state,
      firstRenderSubmitted:deferredDistantArrival.firstRenderSubmitted,
      submittedFrames:deferredDistantArrival.submittedFrames,
      proof:deferredDistantArrival.proof,
      structureDeferred:deferredDistantArrival.structureDeferred === true,
      structureBuildMs:deferredDistantArrival.structureBuildMs,
      fade:+deferredDistantArrival.fade.toFixed(3),
      vistaFade:+deferredDistantArrival.vistaFade.toFixed(3),
      initialRebuildMs:deferredDistantArrival.initialRebuildMs,
      vistaBuildMs:deferredDistantArrival.vistaBuildMs,
      deferredBuildMs:deferredDistantArrival.deferredBuildMs,
    }:null,vistaLayers:vistaGroup?3:0,vistaTriangles:vistaGroup?.children.reduce((sum,mesh)=>sum+mesh.geometry.attributes.position.count/3,0)??0,surfaceTexture:stoneSurface.diagnostics(),platformTransforms:[...platforms.entries()].map(([id,e])=>({id,...e.root.userData.authority,angle:e.root.rotation.y,yWorld:e.root.position.y}))};}
  function dispose(){if(disposed)return;retireEarnedCap();pendingEarnedCap=null;clearFloor();for(const g of primitives.values())g.dispose();primitives.clear();stoneSurface.dispose();group.clear();lastSnapshot=null;disposed=true;}
  return{group,update,stageGroundedCapContinuation,retainedFilmHandoff,noteFrameSubmitted,protectRouteSightlines,revealGuardianSightlines,dispose,diagnostics,lastRebuild};
}
