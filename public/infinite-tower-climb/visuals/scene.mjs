import * as THREE from '/tower/vendor/three.module.js';
import { createTowerWorld, THEMES } from './world.mjs';
import { createClimber, createEnemy } from './characters.mjs';
import { SCALE, pointFor, angleFor } from './coordinates.mjs';
import { snapshotVelocity } from './motion.mjs';
import { createRenderProgress } from './render-progress.mjs';
// Position-only correction runs inside the real scene module. The scene's
// CPU/VM fixtures intentionally remove ESM imports to test WebGL boundaries;
// keeping this pure helper local also makes those fixtures exercise actual code.
function followClimberContact(position, target, blend, state) {
  position.lerp(target, blend);
  if (state === 'standing') position.y = target.y;
  return position;
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

// An armored guardian can stand under the final one-way cap with less vertical
// space than its full visible crest. Let only the presentation rig tuck its head;
// the cap, hitboxes, authored height, replay and public state remain unchanged.
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
  function consider(x, y, halfWidth, halfHeight, priority = 1, guardian = false) {
    const dx = Math.abs(x - player.x), dy = Math.abs(y - player.y);
    if (dx > 90000 || dy > 60000) return;
    const score = (dx + dy * 1.4) / priority;
    if (score >= nearest) return;
    nearest = score;
    threat = { ...pointFor(x, y, snapshot.chunkBaseY, snapshot.worldWidth),
      halfWidth: halfWidth / SCALE, halfHeight: halfHeight / SCALE, guardian };
  }
  if (player.health > 0) {
    for (const enemy of snapshot.enemies || []) if (enemy.active) consider(enemy.x, enemy.y, enemy.halfWidth, enemy.halfHeight, enemy.telegraph ? 1.5 : 1, enemy.kind === 'guardian');
    for (const hazard of snapshot.hazards || []) if (hazard.active) consider(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, hazard.width / 2, hazard.height / 2, 1.2);
    // A fired bolt already moving farther from the climber is no longer an
    // immediate tactical threat; do not let it crop the contact source.
    for (const bolt of snapshot.projectiles || []) if (bolt.owner === 'enemy'
      && (bolt.x - player.x) * bolt.vx <= 0) consider(bolt.x, bolt.y, 3000, 3000, 1.7);
  }
  const center = { ...body };
  if (landing) {
    center.x = lerp(center.x, landing.x, .38);
    center.y = lerp(center.y, landing.y, .38);
    center.z = lerp(center.z, landing.z, .38);
  }
  if (threat) {
    const weight = landing ? .18 : .5;
    center.x = lerp(center.x, threat.x, weight);
    center.y = lerp(center.y, threat.y, weight);
    center.z = lerp(center.z, threat.z, weight);
  }
  center.y += height * (landing ? .12 : .08);
  const tangent = Math.tan(42 * Math.PI / 360);
  const horizontalSafe = aspect < .85 ? (landing ? .85 : .9) : .84;
  const relative = point => ({ x: point.x - center.x, y: point.y - center.y, z: point.z - center.z });
  const dot = (point, axis) => point.x * axis.x + point.y * axis.y + point.z * axis.z;
  const points = [], sightlines = [body];
  function includeBody(point, halfWidth, halfHeight, bearing) {
    for (const side of [-1, 1]) for (const vertical of [-1, 1]) points.push({
      x: point.x + Math.cos(bearing) * halfWidth * side,
      y: point.y + halfHeight * vertical,
      z: point.z - Math.sin(bearing) * halfWidth * side,
    });
  }
  includeBody(body, (player.halfWidth || 9000) / SCALE, height * .52, heroAngle);
  if (landing) {
    // Include the real usable width, rather than only a guessed touch point.
    // The outer walking band is outside the architectural core at radius 23.4.
    for (const x of [target.x, target.x + target.width]) {
      const edge = pointFor(x, target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 26.7);
      points.push(edge, { ...edge, y: edge.y + .4 }); sightlines.push(edge);
    }
    points.push(pointFor(target.x + target.width / 2, target.y + target.height, snapshot.chunkBaseY, snapshot.worldWidth, 24.4));
  }
  if (threat) { includeBody(threat, threat.halfWidth, threat.halfHeight, threat.angle); sightlines.push(threat); }
  const subject = landing || threat, direction = subject ? Math.sign(body.x - subject.x) : 1;
  function solve(lean) {
    const angle = Math.atan2(center.x, center.z) + direction * .08 + orbit + lean;
    // Active traversal gets a modest overlook so the destination presents a
    // usable top. Grounded encounters keep the established near-eye framing.
    const sin = Math.sin(angle), cos = Math.cos(angle), pitch = landing ? .18 : .055, level = Math.sqrt(1 - pitch * pitch);
    const out = { x: sin * level, y: pitch, z: cos * level };
    const right = { x: cos, y: 0, z: -sin }, up = { x: -sin * pitch, y: level, z: -cos * pitch };
    const bodyDepth = dot(relative(body), out);
    let distance = bodyDepth + height * level / (2 * tangent * .18);
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
    return { focus: center, position, distance, landing, targetId: target?.id || null, lean, clear,
      heroFraction: height * level / (2 * tangent * (distance - bodyDepth)) };
  }
  let best = solve(0);
  const preferredFraction = .165 / zoom;
  if (subject && best.heroFraction < preferredFraction) {
    // View along a broad crossing: the real destination recedes into depth,
    // instead of shrinking the entire encounter to fit a narrow screen.
    for (const amount of (aspect < .85 ? [.45, .75, .95, 1.1] : [.25, .5, .75])) {
      const candidate = solve(direction * amount);
      if (candidate.clear && candidate.heroFraction > best.heroFraction) best = candidate;
      if (best.heroFraction >= preferredFraction) break;
    }
  }
  // A narrow phone needs extra clearance for the guardian's shield and
  // swinging maul beyond its physics hitbox. A bounded oblique look keeps the
  // live source and attacker together without shrinking them or moving either.
  // Do not apply the orbit to traversal, non-guardian fights or incoming bolts.
  if (aspect < .85 && threat?.guardian && snapshot.intent?.mode === 'engaging-enemy') {
    const contactView = solve(direction * .75);
    if (contactView.clear && contactView.heroFraction >= .15) best = contactView;
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

  let world = createTowerWorld();
  scene.add(world.group);
  let climber = createClimber();
  climber.group.name = 'ExpeditionClimber';
  scene.add(climber.group);
  const enemies = new Map(), pickups = new Map(), projectiles = new Map();
  const sharedGeometry = new Set(), sharedMaterials = new Set();
  const ownGeometry = geometry => { sharedGeometry.add(geometry); return geometry; };
  const ownMaterial = material => { sharedMaterials.add(material); return material; };
  const gemGeometry = ownGeometry(new THREE.OctahedronGeometry(.42));
  const ringGeometry = ownGeometry(new THREE.TorusGeometry(.65, .035, 6, 24));
  const boltGeometry = ownGeometry(new THREE.SphereGeometry(.21, 10, 7));
  const trailGeometry = ownGeometry(new THREE.ConeGeometry(.16, 1.2, 8));
  const collectibleMaterials = {};
  for (const [kind, color] of Object.entries({ health: 0x69ffd5, stamina: 0x75c8ff, shard: 0xffda7b })) {
    collectibleMaterials[kind] = ownMaterial(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .7, metalness: .45, roughness: .22 }));
  }
  const boltMaterials = {
    player: ownMaterial(new THREE.MeshBasicMaterial({ color: 0x7eeeff })),
    enemy: ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff805e })),
  };
  const healthBarGeometry = ownGeometry(new THREE.PlaneGeometry(1, 1));
  const healthBarDark = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x172329, transparent: true, opacity: .88, depthTest: false, depthWrite: false }));
  const healthBarRed = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff9867, transparent: true, opacity: 1, depthTest: false, depthWrite: false }));
  const warningMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffcb75, transparent: true, opacity: .65, depthWrite: false }));
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
  const attackArc = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(1.55, .055, 6, 24, Math.PI * .9)), ownMaterial(new THREE.MeshBasicMaterial({ color: 0xabf5ff, transparent: true, opacity: .7, depthWrite: false })));
  attackArc.visible = false;
  scene.add(attackArc);

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
  let baseY = 0, themeKey = '', cameraAngle = .15, lastRevision = '', orbit = 0, zoom = 1;
  const renderProgress = createRenderProgress();
  const actorTarget = new THREE.Vector3();
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
    scene.remove(entry.model.group, entry.bar, entry.warning, entry.impact);
    entry.model.dispose();
  }
  function clearActors() {
    for (const entry of enemies.values()) removeEnemy(entry);
    enemies.clear();
    for (const group of pickups.values()) scene.remove(group);
    pickups.clear();
    for (const group of projectiles.values()) scene.remove(group);
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
    scene.remove(world.group, climber.group);
    world.dispose(); climber.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    sun.shadow.dispose(); sun.shadow.map = null; sun.shadow.mapPass = null;
    world = createTowerWorld(); climber = createClimber();
    climber.group.name = 'ExpeditionClimber';
    scene.add(world.group, climber.group);
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
    scene.add(model.group, bar, warning, impact);
    const entry = { model, bar, fill, back, warning, impact, initialized: false, x: entity.x, direction: entity.facing || -1, state: entity, deadUntil: 0, fireUntil: 0, impactUntil: 0, impactFramesRemaining: 0 };
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
    for (const [id, group] of projectiles) if (!projectileIds.has(id)) { scene.remove(group); projectiles.delete(id); }
    for (const projectile of next.projectiles) if (!projectiles.has(projectile.id)) {
      const group = new THREE.Group(), mat = boltMaterials[projectile.owner] || boltMaterials.enemy;
      const dot = new THREE.Mesh(boltGeometry, mat), trail = new THREE.Mesh(trailGeometry, mat);
      trail.rotation.z = Math.PI / 2; trail.position.x = -.6;
      group.add(dot, trail); projectiles.set(projectile.id, group); scene.add(group);
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
    if (newRun) { clearActors(); initialized = false; previous = null; }
    if (snapshot && baseY !== next.chunkBaseY) {
      const shift = (baseY - next.chunkBaseY) / SCALE;
      climber.group.position.y += shift; camera.position.y += shift; lookAt.y += shift;
      for (const entry of enemies.values()) entry.model.group.position.y += shift;
      for (let i = 0; i < MAX_PARTICLES; i++) particlePositions[i * 3 + 1] += shift;
    }
    previous = newRun ? null : snapshot;
    snapshot = next; baseY = next.chunkBaseY;
    updateEntities(next);
    if (previous && next.player.health < previous.player.health) burst(climber.group.position, 0xff855f, 16);
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
    const mapped = pointFor(p.x, p.y - p.halfHeight, snapshot.chunkBaseY, snapshot.worldWidth);
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
    climber.animate({ ...p,
      targetDx: targetPlatform ? targetPlatform.x + targetPlatform.width / 2 - p.x : 0,
      targetDy: targetPlatform ? targetPlatform.y + targetPlatform.height - p.y : 0,
    }, dt, elapsed, options);
    attackArc.visible = !!p.attacking && p.health > 0;
    attackArc.position.copy(climber.group.position);
    attackArc.position.y += 1.45;
    attackArc.position.x += Math.sin(actorYaw) * 1.6;
    attackArc.position.z += Math.cos(actorYaw) * 1.6;
    attackArc.quaternion.copy(camera.quaternion);
    attackArc.rotateZ(p.facing > 0 ? -.8 : Math.PI - .8);
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
      entry.warning.visible = e.active && e.telegraph;
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
    for (const pick of snapshot.pickups) {
      const group = pickups.get(pick.id);
      const mapped = pointFor(pick.x, pick.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.2);
      group.position.set(mapped.x, mapped.y + (options.reducedMotion ? 0 : Math.sin(elapsed * 2 + pick.x) * .16), mapped.z);
      group.rotation.y = options.reducedMotion ? .3 : elapsed * .7;
    }
    for (const p of snapshot.projectiles) {
      const group = projectiles.get(p.id), mapped = pointFor(p.x, p.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.8);
      group.position.set(mapped.x, mapped.y, mapped.z);
      group.rotation.y = mapped.angle + (p.vx < 0 ? Math.PI : 0);
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
    const cameraBlend = options.reducedMotion ? 1 : 1 - Math.exp(-dt * 3.5);
    if (!initialized) { camera.position.copy(destination); lookAt.copy(focus); initialized = true; }
    else { camera.position.lerp(destination, cameraBlend); lookAt.lerp(focus, cameraBlend); }
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
      landingBeacon: { visible: landingBeacon.visible, targetId: landingBeacon.userData.targetPlatformId || null,
        position: landingBeacon.position.toArray(), triangles: landingBeacon.geometry.index.count / 3, depthTest: landingBeacon.material.depthTest },
      activeParticles: particleLife.filter(life => life > 0).length,
      observedEnemyImpacts: [...enemies.values()].filter(entry => entry.impact.visible).length, frameMs,
      lighting: { environmentReady: !!reflectionTarget, environmentState: disposed ? 'disposed' : reflectionDirty ? 'pending' : reflectionTarget ? 'ready' : 'direct', environmentBuilds: reflectionBuilds,
        environmentFailures: reflectionFailures, environmentLastError: reflectionLastError,
        environmentSize: reflectionTarget ? [reflectionTarget.width, reflectionTarget.height] : [0, 0], shadowLights: 1, shadowMapSize: sun.shadow.mapSize.x },
      world: world.diagnostics(), cameraPosition: camera.position.toArray(), climberPosition: climber.group.position.toArray() };
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
    clearActors(); climber.dispose(); world.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    renderer.dispose(); scene.clear();
  }
  return { accept, setCamera, setMotion, setStale, setQuality, diagnostics, dispose };
}
