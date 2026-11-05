import { pointFor } from './coordinates.mjs';
import { observedLandingHazardPressure } from './landing-pressure.mjs';
import { observedTraversalKinetics } from './traversal-kinetics.mjs';

// A source-bound architectural threshold at the ACTUAL currently selected deck.
// It is an observation of the autonomous pilot's intent, never a safe-landing
// promise, force field, extra collider, scripted recovery or new HUD element.
// All seven original metal pieces share one draw; no extra dynamic lights.
const ROUTE_MODES = new Set(['aligning', 'settling-launch', 'jumping', 'air-control', 'settling-landing']);
const PIECES = 12;
const finite = Number.isFinite;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function observedLandingApproach(snapshot, deck, selectedX) {
  const player = snapshot?.player;
  const intent = snapshot?.intent;
  const mode = typeof intent?.mode === 'string' ? intent.mode.replace(/^oracle-/, '') : '';
  if (snapshot?.lifecycle !== 'running' || !ROUTE_MODES.has(mode) ||
    typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
    !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
    snapshot?.stale || !player || player.health <= 0 || player.attacking ||
    !deck || typeof deck.id !== 'string' || intent?.targetPlatformId !== deck.id ||
    !finite(selectedX) || !finite(snapshot.chunkBaseY) ||
    !finite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
    ![deck.x, deck.y, deck.width, deck.height, player.x, player.y,
      player.halfWidth, player.halfHeight].every(finite) ||
    deck.width <= 0 || deck.height <= 0 || player.halfWidth <= 0 ||
    player.halfHeight <= 0 || !Array.isArray(snapshot.platforms) ||
    !snapshot.platforms.some(item => item.id === deck.id) ||
    snapshot.enemies?.some(enemy => enemy?.active && enemy.telegraph)) return null;
  const margin = player.halfWidth + 2500;
  const low = deck.x + margin, high = deck.x + deck.width - margin;
  if (high - low < 20000) return null;
  const x = clamp(selectedX, low, high);
  const half = Math.min(16000, (high - low) * .32);
  const left = clamp(x - half, low, high);
  const right = clamp(x + half, low, high);
  if (right - left < 14000) return null;
  const top = deck.y + deck.height;
  // Do not stage a glowing false destination after the real climber has
  // already stood on and reached that part of the selected deck.
  const feet = player.y - player.halfHeight;
  if (player.state === 'standing' &&
    Math.abs(feet - top) < 3000 &&
    player.x + player.halfWidth >= deck.x &&
    player.x - player.halfWidth <= deck.x + deck.width) return null;
  const overlap = (a, b) => a < right + player.halfWidth && b > left - player.halfWidth;
  const danger = snapshot.hazards?.some(h =>
    observedLandingHazardPressure(snapshot, h, top) &&
    overlap(h.x, h.x + h.width)) || snapshot.enemies?.some(e => e?.active &&
    [e.x, e.y, e.halfWidth, e.halfHeight].every(finite) &&
    overlap(e.x - e.halfWidth, e.x + e.halfWidth) &&
    e.y - e.halfHeight < top + player.halfHeight * 2 &&
    e.y + e.halfHeight > top);
  return {
    runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
    targetId: deck.id, x, left, right, top, pressured: !!danger,
    landingReadiness: danger ? 0 : observedTraversalKinetics(snapshot).landingReadiness,
    chunkBaseY: snapshot.chunkBaseY, worldWidth: snapshot.worldWidth,
    // Current danger can move/change before touchdown. This is not a forecast.
    observedOnly: true,
  };
}

export function createTowerLandingApproach(THREE) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .38, roughness: .36,
    emissive: 0x4d9d92, emissiveIntensity: .40,
    depthTest: true, depthWrite: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, PIECES);
  mesh.name = 'ObservedNextDeckLandingThreshold';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.count = 0;
  const group = new THREE.Group();
  group.name = 'SourceDrivenLandingArchitecture';
  group.visible = false;
  group.add(mesh);
  const pose = new THREE.Object3D();
  const tint = new THREE.Color();
  let active = null, disposed = false;
  function clear() {
    group.visible = false;
    mesh.count = 0;
    active = null;
  }
  function update(snapshot, deck, selectedX, options = {}) {
    if (disposed) return;
    if (options.stale || snapshot?.lifecycle !== 'running') { clear(); return; }
    const candidate = observedLandingApproach(snapshot, deck, selectedX);
    if (!candidate) { clear(); return; }
    if (active && active.runToken === candidate.runToken &&
      active.floor === candidate.floor && active.tick === candidate.tick &&
      active.targetId === candidate.targetId && active.x === candidate.x &&
      active.left === candidate.left && active.right === candidate.right &&
      active.top === candidate.top && active.pressured === candidate.pressured &&
      active.landingReadiness === candidate.landingReadiness) return;
    active = candidate;
    // Source-driven dock, not a predicted safe destination or collider.
    // Its existing braces become distinctly open, raised WARNING vanes only
    // while the observed landing footprint overlaps a genuinely active or
    // last-six-tick descending shutter. This is physical shape, not color alone;
    // all twelve metal pieces still share one instanced draw.
    const distance = Math.hypot(
      (snapshot.player.x - candidate.x) / 10000,
      (snapshot.player.y - snapshot.player.halfHeight - candidate.top) / 10000);
    const litSteps = Math.floor(clamp(1 - distance / 16, 0, 1) * 5 + .00001);
    const pressured = candidate.pressured;
    const arrival = pressured ? 0 : candidate.landingReadiness;
    for (let i = 0; i < PIECES; i++) {
      // Two piers, two capstones, five step stones, two shoulder braces,
      // one connecting lintel: all 12 use ONE instanced mesh/material.
      const post = i < 2, cap = i >= 2 && i < 4;
      const step = i >= 4 && i < 9;
      const brace = i >= 9 && i < 11, lintel = i === 11;
      const leftSide = i === 0 || i === 2 || i === 10;
      const x = step
        ? candidate.left + (candidate.right - candidate.left) * (i - 4) / 4
        : lintel ? (candidate.left + candidate.right) * .5
        : leftSide ? candidate.left : candidate.right;
      const world = pointFor(x, candidate.top, candidate.chunkBaseY,
        candidate.worldWidth, step ? 26.91 : 26.53);
      pose.position.set(world.x, world.y +
        (post ? 1.10 : cap ? 2.24 : brace ? (pressured ? 1.94 : 1.80) :
          lintel ? (pressured ? 2.46 : 2.29 + arrival * .24) : .035), world.z);
      pose.rotation.set(0, world.angle, brace ?
        (leftSide ? -1 : 1) * (pressured ? .82 : .50 + arrival * .30) : 0);
      const span = (candidate.right - candidate.left) /
        candidate.worldWidth * 2.2 * 26.53;
      pose.scale.set(
        post ? .24 : cap ? .50 : brace ? .23 : lintel
          ? Math.min(3.5, Math.max(.60, span)) : .32,
        post ? 2.20 : cap ? .19 : brace ? (pressured ? .98 : .74) : lintel ? .16 : .07,
        post ? .25 : cap ? .32 : brace ? .24 : lintel ? .23 : .30);
      pose.updateMatrix();
      mesh.setMatrixAt(i, pose.matrix);
      const hex = post ? (pressured ? 0xb78161 : 0x668b8b)
        : cap || lintel ? (pressured ? 0xffd49b : 0xc9fff0)
        : brace ? (pressured ? 0xca8c61 : 0x8fbbb0)
        : (i - 4) < Math.max(litSteps, Math.floor(arrival * 5))
          ? (pressured ? 0xfff0c4 : 0xf2fff8)
          : (pressured ? 0xb8764e : 0x61998c);
      mesh.setColorAt(i, tint.set(hex));
    }
    mesh.instanceColor.needsUpdate = true;
    mesh.count = PIECES;
    mesh.instanceMatrix.needsUpdate = true;
    group.visible = true;
  }
  function diagnostics() {
    return active ? {
      visible: group.visible, sourceTick: active.tick,
      targetId: active.targetId, selectedX: active.x,
      pressureObservedNow: active.pressured,
      landingReadiness: active.landingReadiness, pieces: mesh.count,
      drawCalls: 1, observedOnly: true, depthTest: material.depthTest,
    } : { visible: false, pieces: 0, drawCalls: 0, observedOnly: true };
  }
  function dispose() {
    if (disposed) return;
    clear(); disposed = true;
    geometry.dispose(); material.dispose(); group.clear();
  }
  return { group, update, clear, dispose, diagnostics };
}
