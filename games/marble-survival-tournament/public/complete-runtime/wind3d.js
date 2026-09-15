import * as THREE from '/vendor/three.module.min.js';

const shell = document.querySelector('.broadcast-shell');
const WORLD_SCALE = 0.00078;
const SNAPSHOT_INTERVAL_MS = 250;
const originalRender = THREE.WebGLRenderer.prototype.render;

let snapshot = null;
let windRoot = null;
let installedScene = null;
let currentArenaId = null;
let pollTimer = null;
let lastPulseAt = performance.now();

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

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

function disposeGroup(group) {
  group.traverse((node) => {
    node.geometry?.dispose?.();
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) material.dispose?.();
    }
  });
}

function clearWindRoot() {
  if (!windRoot) return;
  while (windRoot.children.length > 0) {
    const child = windRoot.children.pop();
    disposeGroup(child);
  }
}

function zoneDirection(zone) {
  const direction = new THREE.Vector3(zone.forceX, 0, -zone.forceY);
  return direction.lengthSq() > 0 ? direction.normalize() : new THREE.Vector3(0, 0, -1);
}

function makeArrow(direction, origin, length, color) {
  const headLength = Math.min(0.22, Math.max(0.09, length * 0.28));
  const headWidth = Math.min(0.14, Math.max(0.055, length * 0.16));
  const arrow = new THREE.ArrowHelper(direction, origin, length, color, headLength, headWidth);
  arrow.line.material.transparent = true;
  arrow.line.material.opacity = 0.72;
  arrow.cone.material.transparent = true;
  arrow.cone.material.opacity = 0.88;
  arrow.userData.windArrow = true;
  return arrow;
}

function buildWindZones(arena) {
  clearWindRoot();
  const zones = arena.windZones || [];
  shell.dataset.windZones = String(zones.length);
  if (zones.length === 0) return;

  for (const zone of zones) {
    const group = new THREE.Group();
    group.userData.windZone = zone.id;
    const centerX = zone.x + zone.width / 2;
    const centerY = zone.y + zone.height / 2;
    const width = Math.max(0.18, zone.width * WORLD_SCALE);
    const depth = Math.max(0.18, zone.height * WORLD_SCALE);
    const top = trackHeight(arena, centerY, centerX) + 0.045;
    group.position.set(worldX(arena, centerX), top, worldZ(arena, centerY));

    const fieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x77e8ff,
      transparent: true,
      opacity: 0.105,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.userData.windField = true;
    group.add(field);

    const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xbff6ff, transparent: true, opacity: 0.52, depthWrite: false });
    const edgeThickness = 0.022;
    const edgeHeight = 0.016;
    for (const [x, z, edgeWidth, edgeDepth] of [
      [0, -depth / 2, width, edgeThickness],
      [0, depth / 2, width, edgeThickness],
      [-width / 2, 0, edgeThickness, depth],
      [width / 2, 0, edgeThickness, depth],
    ]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, edgeDepth), edgeMaterial);
      edge.position.set(x, 0.018, z);
      group.add(edge);
    }

    const direction = zoneDirection(zone);
    const forceMagnitude = Math.max(1, Math.hypot(zone.forceX, zone.forceY));
    const arrowLength = clamp(0.42 + forceMagnitude * 0.018, 0.46, 0.78);
    const columns = width > 4 ? 4 : width > 2.2 ? 3 : 2;
    const rows = depth > 2.2 ? 3 : 2;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = -width * 0.36 + (columns === 1 ? 0 : (width * 0.72 * column) / (columns - 1));
        const z = -depth * 0.32 + (rows === 1 ? 0 : (depth * 0.64 * row) / (rows - 1));
        const arrow = makeArrow(direction, new THREE.Vector3(x, 0.10, z), arrowLength, 0xcaf8ff);
        arrow.userData.phase = row * columns + column;
        group.add(arrow);
      }
    }

    windRoot.add(group);
  }
}

function ensureInstalled(scene) {
  if (installedScene === scene && windRoot) return;
  if (windRoot && installedScene) installedScene.remove(windRoot);
  windRoot = new THREE.Group();
  windRoot.name = 'authoritative-wind-telegraphs';
  windRoot.renderOrder = 3;
  installedScene = scene;
  scene.add(windRoot);
  currentArenaId = null;
}

function updatePulse(now) {
  if (!windRoot || shell.dataset.reducedMotion === 'true') return;
  const elapsed = Math.min(50, Math.max(0, now - lastPulseAt));
  lastPulseAt = now;
  windRoot.traverse((node) => {
    if (!node.userData.windArrow) return;
    const phase = node.userData.phase || 0;
    const pulse = 0.78 + Math.sin(now * 0.004 + phase * 0.9) * 0.12;
    node.line.material.opacity = pulse;
    node.cone.material.opacity = Math.min(1, pulse + 0.12);
  });
  void elapsed;
}

async function refreshWindSnapshot() {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const next = await response.json();
    if (!next?.arena || !Array.isArray(next.arena.windZones)) return;
    snapshot = next;
    if (windRoot && currentArenaId !== next.arena.id) {
      buildWindZones(next.arena);
      currentArenaId = next.arena.id;
    }
  } catch {
    // Wind telegraph failure must never affect authoritative play or the base renderer.
  }
}

THREE.WebGLRenderer.prototype.render = function renderWithWindTelegraphs(scene, camera) {
  ensureInstalled(scene);
  if (snapshot && currentArenaId !== snapshot.arena.id) {
    buildWindZones(snapshot.arena);
    currentArenaId = snapshot.arena.id;
  }
  updatePulse(performance.now());
  return originalRender.call(this, scene, camera);
};

shell.dataset.windZones = '0';
refreshWindSnapshot();
pollTimer = window.setInterval(refreshWindSnapshot, SNAPSHOT_INTERVAL_MS);
window.addEventListener('pagehide', () => {
  if (pollTimer !== null) window.clearInterval(pollTimer);
  if (windRoot && installedScene) installedScene.remove(windRoot);
  clearWindRoot();
}, { once: true });
