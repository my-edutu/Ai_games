import * as THREE from '/vendor/three.module.min.js';

const shell = document.querySelector('.broadcast-shell');
const canvas = document.getElementById('arena-webgl');
const arenaElement = document.getElementById('arena');
const qualitySelect = document.getElementById('quality-select');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const WORLD_SCALE = 0.00078;
const MARBLE_RADIUS = 0.23;
const SNAPSHOT_INTERVAL_MS = 100;

const PALETTE = Object.freeze({
  aurora: 0x62d6aa,
  coral: 0xf07561,
  cyan: 0x62c5dc,
  gold: 0xf0bd55,
  lime: 0xaecb55,
  magenta: 0xce6ca8,
  orchid: 0xa986d8,
  ruby: 0xcf5260,
  sky: 0x68aee8,
  violet: 0x8178d7,
  amber: 0xda8b45,
  mint: 0x69caa3,
});

const THEMES = Object.freeze({
  'seeding-sprint': Object.freeze({
    name: 'Neon Circuit',
    background: 0x07101a,
    fog: 0x07101a,
    track: 0x152535,
    trackAccent: 0x31586f,
    rail: 0x57c8ef,
    hazard: 0xff4e62,
    machine: 0x8799a6,
    machineDark: 0x26343e,
    glow: 0x5bd8ff,
  }),
  'gate-gauntlet': Object.freeze({
    name: 'Industrial Factory',
    background: 0x11100e,
    fog: 0x17130f,
    track: 0x393734,
    trackAccent: 0x6b6253,
    rail: 0xe19c47,
    hazard: 0xd94f3d,
    machine: 0xa6a19a,
    machineDark: 0x32302d,
    glow: 0xffbd68,
  }),
  'hazard-circuit': Object.freeze({
    name: 'Ice Lab',
    background: 0x07151d,
    fog: 0x0b1d26,
    track: 0xacc8cf,
    trackAccent: 0xe7f4f5,
    rail: 0x79d7f0,
    hazard: 0x5f91ff,
    machine: 0xdbe8e9,
    machineDark: 0x4e6971,
    glow: 0x9cecff,
  }),
  'final-four': Object.freeze({
    name: 'Sky Temple',
    background: 0x151927,
    fog: 0x202942,
    track: 0x8f8775,
    trackAccent: 0xd6caa8,
    rail: 0xf4d889,
    hazard: 0xa84d69,
    machine: 0xc4bca7,
    machineDark: 0x554f45,
    glow: 0xffdd86,
  }),
  championship: Object.freeze({
    name: 'Volcanic Forge',
    background: 0x120807,
    fog: 0x1e0b08,
    track: 0x302b2a,
    trackAccent: 0x67514a,
    rail: 0xff9e46,
    hazard: 0xff3f1f,
    machine: 0x8c8078,
    machineDark: 0x281e1b,
    glow: 0xff6a2d,
  }),
});

const QUALITY = Object.freeze({
  low: Object.freeze({ dpr: 1, shadows: false, trackSegments: 16, fx: 28, sphereSegments: 18 }),
  balanced: Object.freeze({ dpr: 1.35, shadows: true, trackSegments: 24, fx: 48, sphereSegments: 24 }),
  high: Object.freeze({ dpr: 1.75, shadows: true, trackSegments: 32, fx: 68, sphereSegments: 32 }),
  ultra: Object.freeze({ dpr: 2, shadows: true, trackSegments: 40, fx: 88, sphereSegments: 40 }),
});

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const lerp = (a, b, t) => a + (b - a) * t;

let renderer;
let scene;
let camera;
let keyLight;
let fillLight;
let accentLight;
let arenaRoot;
let marbleRoot;
let fxRoot;
let snapshot = null;
let previousSnapshot = null;
let snapshotReceivedAt = performance.now();
let currentArenaId = null;
let currentTheme = THEMES['seeding-sprint'];
let lastEventSeq = -1;
let lastFrameAt = performance.now();
let cameraImpulse = 0;
let qualityName = QUALITY[qualitySelect?.value] ? qualitySelect.value : 'balanced';
let rebuildRequested = true;

const marbleMeshes = new Map();
const sweeperMeshes = new Map();
const effectPool = [];
const currentCameraTarget = new THREE.Vector3();
const desiredCameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const tempAxis = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempVector = new THREE.Vector3();

const shared = {
  fxGeometry: new THREE.SphereGeometry(0.035, 8, 6),
  fxMaterials: {
    impact: new THREE.MeshBasicMaterial({ color: 0xf0d3a1, transparent: true }),
    danger: new THREE.MeshBasicMaterial({ color: 0xff5c42, transparent: true }),
    success: new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true }),
    shield: new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true }),
    champion: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }),
  },
};

function themeFor(archetype) {
  return THEMES[archetype] || THEMES['seeding-sprint'];
}

function qualityPreset() {
  return QUALITY[qualityName] || QUALITY.balanced;
}

function worldX(arena, x) {
  return (x - arena.width / 2) * WORLD_SCALE;
}

function worldZ(arena, y) {
  return (arena.height / 2 - y) * WORLD_SCALE;
}

function normalizedY(arena, y) {
  return clamp(y / Math.max(1, arena.height), 0, 1);
}

function trackHeight(arena, y, x = arena.width / 2) {
  const t = normalizedY(arena, y);
  const lane = clamp((x / Math.max(1, arena.width)) * 2 - 1, -1, 1);
  switch (arena.archetype) {
    case 'seeding-sprint':
      return 0.05 + Math.sin(t * Math.PI * 2) * 0.045;
    case 'gate-gauntlet':
      return 0.05 + Math.floor(t * 5) * 0.035 + Math.sin(t * Math.PI * 4) * 0.025;
    case 'hazard-circuit':
      return 0.08 + Math.sin(t * Math.PI * 5) * 0.075 + Math.cos(lane * Math.PI) * 0.018;
    case 'final-four':
      return 0.08 + Math.sin(t * Math.PI) * 0.32 + Math.sin(t * Math.PI * 6) * 0.025;
    case 'championship':
      return 0.06 + Math.sin(t * Math.PI * 3) * 0.095 + t * 0.11;
    default:
      return 0.06;
  }
}

function worldPosition(arena, x, y, lift = MARBLE_RADIUS) {
  return new THREE.Vector3(worldX(arena, x), trackHeight(arena, y, x) + lift, worldZ(arena, y));
}

function triangleWave(tick, periodTicks, amplitude, phaseTicks) {
  const period = Math.max(2, periodTicks);
  const half = Math.floor(period / 2);
  const phase = ((tick + phaseTicks) % period + period) % period;
  const distance = phase <= half ? phase : period - phase;
  return -amplitude + (distance * amplitude * 2) / Math.max(1, half);
}

function disposeObject(object) {
  object.traverse((node) => {
    if (node.geometry && node.geometry !== shared.fxGeometry) node.geometry.dispose?.();
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (!Object.values(shared.fxMaterials).includes(material)) material.dispose?.();
      }
    }
  });
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    disposeObject(child);
  }
}

function makePhysicalMaterial(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: options.metalness ?? 0.25,
    roughness: options.roughness ?? 0.48,
    clearcoat: options.clearcoat ?? 0.1,
    clearcoatRoughness: options.clearcoatRoughness ?? 0.25,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function box(width, height, depth, material, x, y, z, cast = true, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function buildTrack(arena, theme) {
  const preset = qualityPreset();
  const width = arena.width * WORLD_SCALE;
  const totalDepth = arena.height * WORLD_SCALE;
  const segmentDepth = totalDepth / preset.trackSegments + 0.012;
  const trackMaterial = makePhysicalMaterial(theme.track, { metalness: arena.archetype === 'seeding-sprint' ? 0.46 : 0.18, roughness: 0.54 });
  const accentMaterial = makePhysicalMaterial(theme.trackAccent, { metalness: 0.28, roughness: 0.4 });
  const railMaterial = makePhysicalMaterial(theme.rail, { metalness: 0.62, roughness: 0.28, emissive: theme.rail, emissiveIntensity: 0.12 });

  for (let index = 0; index < preset.trackSegments; index += 1) {
    const yWorld = arena.height * ((index + 0.5) / preset.trackSegments);
    const top = trackHeight(arena, yWorld);
    const z = worldZ(arena, yWorld);
    const slab = box(width, 0.28, segmentDepth, trackMaterial, 0, top - 0.14, z, false, true);
    arenaRoot.add(slab);

    if (index % 4 === 0) {
      const seam = box(width * 0.94, 0.016, 0.025, accentMaterial, 0, top + 0.01, z - segmentDepth * 0.38, false, true);
      arenaRoot.add(seam);
    }

    const railY = top + 0.22;
    const leftRail = box(0.08, 0.32, segmentDepth, railMaterial, -width / 2 - 0.025, railY, z, true, true);
    const rightRail = box(0.08, 0.32, segmentDepth, railMaterial, width / 2 + 0.025, railY, z, true, true);
    arenaRoot.add(leftRail, rightRail);
  }

  const underMaterial = makePhysicalMaterial(theme.machineDark, { metalness: 0.5, roughness: 0.66 });
  const supportHeight = 1.8;
  const xPositions = [-width * 0.42, width * 0.42];
  const zPositions = [-totalDepth * 0.42, -totalDepth * 0.12, totalDepth * 0.18, totalDepth * 0.42];
  for (const x of xPositions) {
    for (const z of zPositions) arenaRoot.add(box(0.16, supportHeight, 0.16, underMaterial, x, -supportHeight / 2 - 0.12, z, false, true));
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 2.8, totalDepth * 2.2),
    new THREE.MeshStandardMaterial({ color: theme.background, roughness: 1, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.15;
  floor.receiveShadow = true;
  arenaRoot.add(floor);
}

function buildFinishLine(arena, theme) {
  const cells = 24;
  const width = arena.width * WORLD_SCALE;
  const z = worldZ(arena, arena.finishY);
  const y = trackHeight(arena, arena.finishY) + 0.025;
  const cellWidth = width / cells;
  for (let index = 0; index < cells; index += 1) {
    const material = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0xf6f1e4 : 0x11141a, roughness: 0.55 });
    const tile = box(cellWidth + 0.004, 0.022, 0.18, material, -width / 2 + cellWidth * (index + 0.5), y, z, false, true);
    arenaRoot.add(tile);
  }

  const archMaterial = makePhysicalMaterial(theme.rail, { metalness: 0.58, roughness: 0.25, emissive: theme.glow, emissiveIntensity: 0.18 });
  const archHeight = 2.0;
  arenaRoot.add(
    box(0.14, archHeight, 0.14, archMaterial, -width / 2 + 0.12, y + archHeight / 2, z, true, true),
    box(0.14, archHeight, 0.14, archMaterial, width / 2 - 0.12, y + archHeight / 2, z, true, true),
    box(width - 0.22, 0.14, 0.14, archMaterial, 0, y + archHeight, z, true, true),
  );
}

function buildHazards(arena, theme) {
  const frameMaterial = makePhysicalMaterial(theme.machineDark, { metalness: 0.58, roughness: 0.45 });
  const hazardMaterial = new THREE.MeshStandardMaterial({
    color: theme.hazard,
    emissive: theme.hazard,
    emissiveIntensity: 0.72,
    roughness: 0.6,
    metalness: 0.08,
  });
  for (const hazard of arena.hazards || []) {
    const centerX = hazard.x + hazard.width / 2;
    const centerY = hazard.y + hazard.height / 2;
    const width = hazard.width * WORLD_SCALE;
    const depth = hazard.height * WORLD_SCALE;
    const top = trackHeight(arena, centerY, centerX);
    const pit = box(width, 0.045, depth, hazardMaterial, worldX(arena, centerX), top + 0.026, worldZ(arena, centerY), false, false);
    arenaRoot.add(pit);

    const rim = 0.045;
    arenaRoot.add(
      box(width + rim * 2, 0.08, rim, frameMaterial, worldX(arena, centerX), top + 0.08, worldZ(arena, hazard.y) + depth / 2, true, true),
      box(width + rim * 2, 0.08, rim, frameMaterial, worldX(arena, centerX), top + 0.08, worldZ(arena, hazard.y + hazard.height) - depth / 2, true, true),
      box(rim, 0.08, depth, frameMaterial, worldX(arena, hazard.x), top + 0.08, worldZ(arena, centerY), true, true),
      box(rim, 0.08, depth, frameMaterial, worldX(arena, hazard.x + hazard.width), top + 0.08, worldZ(arena, centerY), true, true),
    );
  }
}

function buildObstacles(arena, theme) {
  const machineMaterial = makePhysicalMaterial(theme.machine, { metalness: 0.6, roughness: 0.34 });
  const capMaterial = makePhysicalMaterial(theme.rail, { metalness: 0.42, roughness: 0.32, emissive: theme.glow, emissiveIntensity: 0.08 });
  for (const obstacle of arena.obstacles || []) {
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    const top = trackHeight(arena, centerY, centerX);
    const width = Math.max(0.08, obstacle.width * WORLD_SCALE);
    const depth = Math.max(0.08, obstacle.height * WORLD_SCALE);
    const height = 0.52;
    arenaRoot.add(box(width, height, depth, machineMaterial, worldX(arena, centerX), top + height / 2, worldZ(arena, centerY), true, true));
    arenaRoot.add(box(width * 0.84, 0.055, depth * 0.84, capMaterial, worldX(arena, centerX), top + height + 0.025, worldZ(arena, centerY), true, true));
  }
}

function buildBumpers(arena, theme) {
  const baseMaterial = makePhysicalMaterial(theme.machineDark, { metalness: 0.64, roughness: 0.3 });
  const bumperMaterial = makePhysicalMaterial(theme.rail, { metalness: 0.36, roughness: 0.28, clearcoat: 0.55, emissive: theme.glow, emissiveIntensity: 0.16 });
  for (const bumper of arena.bumpers || []) {
    const radius = Math.max(0.12, bumper.radius * WORLD_SCALE);
    const top = trackHeight(arena, bumper.y, bumper.x);
    const group = new THREE.Group();
    group.position.set(worldX(arena, bumper.x), top, worldZ(arena, bumper.y));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.15, radius * 1.24, 0.16, 24), baseMaterial);
    base.position.y = 0.08;
    base.castShadow = true;
    base.receiveShadow = true;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, 0.42, 28), bumperMaterial);
    head.position.y = 0.31;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(base, head);
    arenaRoot.add(group);
  }
}

function buildSweepers(arena, theme) {
  sweeperMeshes.clear();
  const armMaterial = makePhysicalMaterial(theme.rail, { metalness: 0.52, roughness: 0.3, emissive: theme.glow, emissiveIntensity: 0.16 });
  const hubMaterial = makePhysicalMaterial(theme.machineDark, { metalness: 0.72, roughness: 0.26 });
  for (const sweeper of arena.sweepers || []) {
    const group = new THREE.Group();
    const width = Math.max(0.1, sweeper.width * WORLD_SCALE);
    const depth = Math.max(0.1, sweeper.height * WORLD_SCALE);
    const arm = box(width, 0.23, depth, armMaterial, width / 2, 0.22, -depth / 2, true, true);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.48, 24), hubMaterial);
    hub.position.set(0, 0.24, 0);
    hub.castShadow = true;
    hub.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 28), armMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.48;
    group.add(arm, hub, ring);
    group.userData.sweeper = sweeper;
    group.userData.ring = ring;
    sweeperMeshes.set(sweeper.id, group);
    arenaRoot.add(group);
  }
}

function buildThemeDressing(arena, theme) {
  const width = arena.width * WORLD_SCALE;
  const depth = arena.height * WORLD_SCALE;
  const pylonMaterial = makePhysicalMaterial(theme.machineDark, { metalness: 0.5, roughness: 0.5 });
  const lightMaterial = makePhysicalMaterial(theme.glow, { metalness: 0.2, roughness: 0.25, emissive: theme.glow, emissiveIntensity: 0.85 });
  const zBands = [-0.42, -0.14, 0.14, 0.42];
  for (const band of zBands) {
    for (const side of [-1, 1]) {
      const x = side * (width / 2 + 0.72);
      const z = band * depth;
      const post = box(0.16, 1.7, 0.16, pylonMaterial, x, 0.62, z, true, true);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), lightMaterial);
      lamp.position.set(x, 1.5, z);
      arenaRoot.add(post, lamp);
    }
  }

  if (arena.archetype === 'final-four') {
    const templeMaterial = makePhysicalMaterial(theme.trackAccent, { metalness: 0.05, roughness: 0.78 });
    for (const side of [-1, 1]) {
      for (const band of [-0.32, 0, 0.32]) {
        arenaRoot.add(box(0.28, 2.7, 0.28, templeMaterial, side * (width / 2 + 1.22), 0.25, band * depth, true, true));
      }
    }
  }

  if (arena.archetype === 'championship') {
    const emberMaterial = new THREE.MeshBasicMaterial({ color: theme.glow, transparent: true, opacity: 0.72 });
    for (let index = 0; index < 22; index += 1) {
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (index % 3) * 0.012, 8, 6), emberMaterial);
      const phase = index * 2.399;
      ember.position.set(Math.sin(phase) * (width * 0.7), -0.65 + (index % 5) * 0.12, Math.cos(phase * 1.3) * (depth * 0.44));
      ember.userData.ambientEmber = true;
      ember.userData.phase = phase;
      arenaRoot.add(ember);
    }
  }
}

function rebuildArena(nextSnapshot) {
  clearGroup(arenaRoot);
  clearGroup(marbleRoot);
  marbleMeshes.clear();
  sweeperMeshes.clear();
  currentTheme = themeFor(nextSnapshot.arena.archetype);
  scene.background = new THREE.Color(currentTheme.background);
  scene.fog = new THREE.Fog(currentTheme.fog, 9, 28);
  keyLight.color.set(currentTheme.trackAccent);
  accentLight.color.set(currentTheme.glow);
  accentLight.intensity = nextSnapshot.arena.archetype === 'championship' ? 19 : 12;

  buildTrack(nextSnapshot.arena, currentTheme);
  buildHazards(nextSnapshot.arena, currentTheme);
  buildObstacles(nextSnapshot.arena, currentTheme);
  buildBumpers(nextSnapshot.arena, currentTheme);
  buildSweepers(nextSnapshot.arena, currentTheme);
  buildFinishLine(nextSnapshot.arena, currentTheme);
  buildThemeDressing(nextSnapshot.arena, currentTheme);
  currentArenaId = nextSnapshot.arena.id;
  rebuildRequested = false;
}

function competitorColor(marble) {
  return PALETTE[marble.palette] || 0x7ab3d9;
}

function createPattern(pattern, radius, material) {
  const group = new THREE.Group();
  if (pattern === 'ring') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.005, radius * 0.075, 7, 36), material);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  } else if (pattern === 'split') {
    for (const rotation of [0, Math.PI / 2]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.003, radius * 0.052, 7, 32), material);
      ring.rotation.y = rotation;
      group.add(ring);
    }
  } else if (pattern === 'chevron') {
    for (const angle of [-0.52, 0.52]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.005, radius * 0.04, 7, 30, Math.PI * 1.15), material);
      band.rotation.set(Math.PI / 2, angle, angle);
      group.add(band);
    }
  } else {
    for (let index = 0; index < 6; index += 1) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.105, 8, 6), material);
      const angle = (index / 6) * Math.PI * 2;
      dot.position.set(Math.cos(angle) * radius * 0.92, Math.sin(angle * 2) * radius * 0.38, Math.sin(angle) * radius * 0.92);
      group.add(dot);
    }
  }
  return group;
}

function createMarbleMesh(marble) {
  const preset = qualityPreset();
  const group = new THREE.Group();
  const rolling = new THREE.Group();
  const baseColor = competitorColor(marble);
  const material = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    metalness: 0.18,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    reflectivity: 0.82,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(MARBLE_RADIUS, preset.sphereSegments, Math.max(14, Math.round(preset.sphereSegments * 0.72))), material);
  sphere.castShadow = true;
  sphere.receiveShadow = true;

  const patternMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f0df, metalness: 0.12, roughness: 0.4 });
  const pattern = createPattern(marble.pattern, MARBLE_RADIUS, patternMaterial);
  rolling.add(sphere, pattern);
  group.add(rolling);

  const haloMaterial = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.42, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(MARBLE_RADIUS * 1.22, 0.017, 6, 32), haloMaterial);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -MARBLE_RADIUS + 0.02;
  group.add(halo);

  const identityFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.13, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xf5f0df }),
  );
  identityFin.position.set(0, MARBLE_RADIUS * 0.96, 0);
  rolling.add(identityFin);

  group.userData.rolling = rolling;
  group.userData.sphereMaterial = material;
  group.userData.haloMaterial = haloMaterial;
  group.userData.lastWorldPosition = null;
  group.userData.status = marble.status;
  marbleRoot.add(group);
  marbleMeshes.set(marble.id, group);
  return group;
}

function interpolatedMarble(marble, now) {
  if (!previousSnapshot || previousSnapshot.arena.id !== snapshot.arena.id) return marble;
  const previous = previousSnapshot.marbles.find((candidate) => candidate.id === marble.id);
  if (!previous) return marble;
  const alpha = clamp((now - snapshotReceivedAt) / SNAPSHOT_INTERVAL_MS, 0, 1);
  return {
    ...marble,
    x: lerp(previous.x, marble.x, alpha),
    y: lerp(previous.y, marble.y, alpha),
    velocityX: lerp(previous.velocityX, marble.velocityX, alpha),
    velocityY: lerp(previous.velocityY, marble.velocityY, alpha),
  };
}

function updateMarbles(now, deltaSeconds) {
  if (!snapshot) return;
  const seen = new Set();
  for (const source of snapshot.marbles) {
    const marble = interpolatedMarble(source, now);
    seen.add(marble.id);
    const group = marbleMeshes.get(marble.id) || createMarbleMesh(marble);
    const target = worldPosition(snapshot.arena, marble.x, marble.y, MARBLE_RADIUS + 0.035);
    const old = group.position.clone();
    const smoothing = reducedMotion.matches ? 1 : 1 - Math.exp(-deltaSeconds * 18);
    group.position.lerp(target, smoothing);

    const displacement = tempVector.copy(group.position).sub(old);
    displacement.y = 0;
    const distance = displacement.length();
    if (distance > 0.00001) {
      tempAxis.set(displacement.z, 0, -displacement.x).normalize();
      tempQuaternion.setFromAxisAngle(tempAxis, distance / MARBLE_RADIUS);
      group.userData.rolling.quaternion.premultiply(tempQuaternion);
    }

    group.visible = marble.status !== 'eliminated';
    const material = group.userData.sphereMaterial;
    const haloMaterial = group.userData.haloMaterial;
    material.emissive.setHex(competitorColor(marble));
    material.emissiveIntensity = marble.status === 'champion' ? 0.32 : marble.status === 'recovering' ? 0.16 : marble.status === 'threatened' ? 0.1 : 0.025;
    haloMaterial.opacity = marble.status === 'champion' ? 0.86 : marble.status === 'threatened' ? 0.72 : marble.status === 'recovering' ? 0.68 : 0.34;
    const pulse = 1 + Math.sin(now * 0.007 + marble.id) * (marble.status === 'champion' ? 0.12 : 0.025);
    group.scale.setScalar(pulse);
    group.userData.status = marble.status;
  }

  for (const [id, group] of marbleMeshes) {
    if (!seen.has(id)) {
      marbleRoot.remove(group);
      disposeObject(group);
      marbleMeshes.delete(id);
    }
  }
}

function updateSweepers(now) {
  if (!snapshot) return;
  for (const group of sweeperMeshes.values()) {
    const sweeper = group.userData.sweeper;
    const offset = triangleWave(snapshot.tick, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
    const x = sweeper.baseX + (sweeper.axis === 'x' ? offset : 0);
    const y = sweeper.baseY + (sweeper.axis === 'y' ? offset : 0);
    const top = trackHeight(snapshot.arena, y, x);
    group.position.set(worldX(snapshot.arena, x), top, worldZ(snapshot.arena, y));
    group.userData.ring.rotation.z = now * 0.002;
  }
}

function updateAmbient(now) {
  arenaRoot.traverse((node) => {
    if (!node.userData.ambientEmber) return;
    const phase = node.userData.phase;
    node.position.y = -0.55 + ((now * 0.00011 + phase) % 1.5);
    node.position.x += Math.sin(now * 0.001 + phase) * 0.0006;
  });
}

function focusWorldPosition() {
  if (!snapshot) return new THREE.Vector3();
  const directive = snapshot.camera.directive || { mode: 'overview', focusIds: [] };
  const focusIds = directive.focusIds || [];
  const focused = focusIds.map((id) => marbleMeshes.get(id)).filter(Boolean).filter((mesh) => mesh.visible);
  if (focused.length === 0) {
    if (directive.mode === 'finish' || directive.mode === 'victory') {
      return worldPosition(snapshot.arena, snapshot.arena.width / 2, snapshot.arena.finishY, 0.2);
    }
    return new THREE.Vector3(0, 0.25, 0);
  }
  const result = new THREE.Vector3();
  for (const mesh of focused) result.add(mesh.position);
  return result.multiplyScalar(1 / focused.length);
}

function updateCamera(deltaSeconds, now) {
  if (!snapshot) return;
  const directive = snapshot.camera.directive || { mode: 'overview', focusIds: [] };
  const target = focusWorldPosition();
  desiredCameraTarget.copy(target);
  const width = snapshot.arena.width * WORLD_SCALE;
  const depth = snapshot.arena.height * WORLD_SCALE;
  const mode = directive.mode;

  if (mode === 'victory') {
    desiredCameraPosition.set(target.x + 2.4, target.y + 1.65, target.z + 2.9);
  } else if (mode === 'finish') {
    desiredCameraPosition.set(target.x + 0.4, target.y + 3.0, target.z + 5.2);
  } else if (mode === 'danger') {
    desiredCameraPosition.set(target.x + 3.7, target.y + 3.2, target.z + 4.6);
  } else if (mode === 'cut-line') {
    desiredCameraPosition.set(target.x + 2.7, target.y + 4.1, target.z + 5.7);
  } else {
    desiredCameraTarget.set(0, 0.15, 0);
    desiredCameraPosition.set(0, Math.max(7.6, depth * 0.72), Math.max(8.4, depth * 0.52));
  }

  if (mode === 'overview' && width > depth * 0.9) desiredCameraPosition.x = width * 0.12;
  const smoothing = reducedMotion.matches ? 1 : 1 - Math.exp(-deltaSeconds * 2.9);
  camera.position.lerp(desiredCameraPosition, smoothing);
  currentCameraTarget.lerp(desiredCameraTarget, smoothing);

  if (!reducedMotion.matches && cameraImpulse > 0.001) {
    const impulse = cameraImpulse * Math.sin(now * 0.037);
    camera.position.x += impulse * 0.11;
    camera.position.y += Math.abs(impulse) * 0.035;
    cameraImpulse *= Math.pow(0.1, deltaSeconds);
  }
  camera.lookAt(currentCameraTarget);
}

function initEffectPool() {
  for (const item of effectPool) fxRoot.remove(item.mesh);
  effectPool.length = 0;
  const count = qualityPreset().fx;
  for (let index = 0; index < count; index += 1) {
    const mesh = new THREE.Mesh(shared.fxGeometry, shared.fxMaterials.impact);
    mesh.visible = false;
    mesh.frustumCulled = false;
    fxRoot.add(mesh);
    effectPool.push({ mesh, active: false, age: 0, life: 0, velocity: new THREE.Vector3() });
  }
}

function nextEffectSlot() {
  return effectPool.find((item) => !item.active) || effectPool.reduce((oldest, item) => item.age > oldest.age ? item : oldest, effectPool[0]);
}

function spawnBurst(position, kind, count, intensity = 1) {
  if (reducedMotion.matches && kind === 'impact') count = Math.min(count, 2);
  for (let index = 0; index < count; index += 1) {
    const slot = nextEffectSlot();
    if (!slot) return;
    const phase = (index + 1) * 2.399 + lastEventSeq * 0.173;
    const speed = (0.6 + (index % 5) * 0.12) * intensity;
    slot.active = true;
    slot.age = 0;
    slot.life = 0.48 + (index % 4) * 0.09;
    slot.mesh.material = shared.fxMaterials[kind] || shared.fxMaterials.impact;
    slot.mesh.material.opacity = 0.92;
    slot.mesh.position.copy(position);
    slot.mesh.scale.setScalar(kind === 'champion' ? 1.8 : 1);
    slot.mesh.visible = true;
    slot.velocity.set(Math.cos(phase) * speed, 0.4 + Math.abs(Math.sin(phase * 1.7)) * speed, Math.sin(phase) * speed);
  }
}

function updateEffects(deltaSeconds) {
  for (const item of effectPool) {
    if (!item.active) continue;
    item.age += deltaSeconds;
    if (item.age >= item.life) {
      item.active = false;
      item.mesh.visible = false;
      continue;
    }
    item.velocity.y -= deltaSeconds * 1.4;
    item.mesh.position.addScaledVector(item.velocity, deltaSeconds);
    item.mesh.material.opacity = clamp(1 - item.age / item.life, 0, 1);
  }
}

function eventMarblePosition(event) {
  const id = Number(event.data?.marbleId);
  if (!Number.isInteger(id)) return null;
  return marbleMeshes.get(id)?.position?.clone() || null;
}

function processEvents(events) {
  for (const event of events || []) {
    if (!Number.isInteger(event.seq) || event.seq <= lastEventSeq) continue;
    lastEventSeq = event.seq;
    const position = eventMarblePosition(event);
    if (event.type === 'physics-contact' && position) {
      const impulse = Math.max(0, Number(event.data?.impulse) || 0);
      const normalized = clamp(Math.log10(impulse + 1) / 4, 0.18, 1);
      if (normalized > 0.24) spawnBurst(position, 'impact', 2 + Math.round(normalized * 5), 0.55 + normalized * 0.55);
      cameraImpulse = Math.max(cameraImpulse, normalized * 0.18);
    } else if (event.type === 'marble-eliminated' && position) {
      spawnBurst(position, 'danger', 14, 1.1);
      cameraImpulse = Math.max(cameraImpulse, 0.24);
    } else if (event.type === 'marble-qualified' && position) {
      spawnBurst(position, 'success', 10, 0.82);
    } else if (event.type === 'shield-recovery' && position) {
      spawnBurst(position, 'shield', 12, 0.92);
    } else if (event.type === 'tournament-champion') {
      const championId = Number(event.data?.championId);
      const champion = marbleMeshes.get(championId);
      if (champion) spawnBurst(champion.position.clone(), 'champion', 28, 1.35);
    }
  }
}

function updateRendererQuality() {
  const preset = qualityPreset();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.dpr));
  renderer.shadowMap.enabled = preset.shadows;
  keyLight.castShadow = preset.shadows;
  rebuildRequested = true;
  initEffectPool();
}

function resizeRenderer() {
  const rect = arenaElement.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

async function refreshSnapshot() {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const next = await response.json();
    if (!next || next.version !== 1 || !next.arena || !Array.isArray(next.marbles)) throw new Error('invalid snapshot');
    const reset = snapshot && (next.tick < snapshot.tick || next.arena.id !== snapshot.arena.id);
    previousSnapshot = reset ? null : snapshot;
    snapshot = next;
    snapshotReceivedAt = performance.now();
    if (reset) lastEventSeq = -1;
    if (rebuildRequested || currentArenaId !== next.arena.id) rebuildArena(next);
    processEvents(next.events);
  } catch (error) {
    shell.dataset.threeState = 'snapshot-error';
    console.warn('[marble-3d] snapshot unavailable', error);
  }
}

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: qualityName !== 'low', alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07101a);
  scene.fog = new THREE.Fog(0x07101a, 9, 28);
  camera = new THREE.PerspectiveCamera(43, 16 / 9, 0.05, 80);
  camera.position.set(0, 9, 10);

  arenaRoot = new THREE.Group();
  marbleRoot = new THREE.Group();
  fxRoot = new THREE.Group();
  scene.add(arenaRoot, marbleRoot, fxRoot);

  fillLight = new THREE.HemisphereLight(0xc9e6ff, 0x10131a, 2.25);
  scene.add(fillLight);

  keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
  keyLight.position.set(-5.5, 11, 7.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(qualityName === 'ultra' ? 2048 : 1024, qualityName === 'ultra' ? 2048 : 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;
  keyLight.shadow.bias = -0.00035;
  scene.add(keyLight);

  accentLight = new THREE.PointLight(0x5bd8ff, 12, 22, 2);
  accentLight.position.set(0, 4.8, -2.2);
  scene.add(accentLight);

  initEffectPool();
  updateRendererQuality();
  resizeRenderer();
}

function animate(now) {
  const deltaSeconds = clamp((now - lastFrameAt) / 1000, 0, 0.05);
  lastFrameAt = now;
  if (snapshot) {
    if (rebuildRequested || currentArenaId !== snapshot.arena.id) rebuildArena(snapshot);
    updateMarbles(now, deltaSeconds);
    updateSweepers(now);
    updateAmbient(now);
    updateEffects(deltaSeconds);
    updateCamera(deltaSeconds, now);
  }
  renderer.render(scene, camera);
  if (snapshot && !shell.classList.contains('three-ready')) {
    shell.classList.add('three-ready');
    shell.dataset.threeState = 'ready';
  }
  requestAnimationFrame(animate);
}

function start() {
  try {
    initScene();
    qualitySelect?.addEventListener('change', () => {
      qualityName = QUALITY[qualitySelect.value] ? qualitySelect.value : 'balanced';
      updateRendererQuality();
      resizeRenderer();
    });
    window.addEventListener('resize', resizeRenderer, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(resizeRenderer).observe(arenaElement);
    refreshSnapshot();
    setInterval(refreshSnapshot, SNAPSHOT_INTERVAL_MS);
    requestAnimationFrame(animate);
  } catch (error) {
    shell.dataset.threeState = 'failed';
    console.error('[marble-3d] WebGL initialization failed; retaining authoritative 2D fallback.', error);
  }
}

start();
