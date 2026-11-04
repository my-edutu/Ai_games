import { pointFor } from './coordinates.mjs';

// A source-bound architectural threshold at the ACTUAL currently selected deck.
// It is an observation of the autonomous pilot's intent, never a safe-landing
// promise, force field, extra collider, scripted recovery or new HUD element.
// All seven original metal pieces share one draw; no extra dynamic lights.
const ROUTE_MODES = new Set(['aligning', 'settling-launch', 'jumping', 'air-control', 'settling-landing']);
const PIECES = 7;
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
  const danger = snapshot.hazards?.some(h => h?.active &&
    [h.x, h.y, h.width, h.height].every(finite) &&
    overlap(h.x, h.x + h.width) &&
    h.y < top + player.halfHeight * 2 &&
    h.y + h.height > top) || snapshot.enemies?.some(e => e?.active &&
    [e.x, e.y, e.halfWidth, e.halfHeight].every(finite) &&
    overlap(e.x - e.halfWidth, e.x + e.halfWidth) &&
    e.y - e.halfHeight < top + player.halfHeight * 2 &&
    e.y + e.halfHeight > top);
  return {
    runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
    targetId: deck.id, x, left, right, top, pressured: !!danger,
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
  let active = null, paintedPressure = null, disposed = false;
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
      active.top === candidate.top && active.pressured === candidate.pressured) return;
    active = candidate;
    const paint = candidate.pressured;
    if (paintedPressure !== paint) {
      const metal = tint.set(paint ? 0xffae71 : 0x91f5db);
      const bright = tint.clone().set(paint ? 0xffdb9d : 0xdbfff3);
      for (let i = 0; i < PIECES; i++) mesh.setColorAt(i, i < 2 ? bright : metal);
      mesh.instanceColor.needsUpdate = true;
      paintedPressure = paint;
    }
    for (let i = 0; i < PIECES; i++) {
      const post = i < 2;
      const x = post ? (i === 0 ? candidate.left : candidate.right)
        : candidate.left + (candidate.right - candidate.left) * (i - 1) / 6;
      const world = pointFor(x, candidate.top, candidate.chunkBaseY,
        candidate.worldWidth, post ? 26.76 : 26.91);
      pose.position.set(world.x, world.y + (post ? .48 : .035), world.z);
      pose.rotation.set(0, world.angle, 0);
      // Two squat uprights + five inset illuminated threshold stones. These
      // shape cues work in monochrome and reduced motion, and never obstruct
      // the climber's real feet or the enemy's collision shape.
      pose.scale.set(post ? .20 : .32, post ? .96 : .07, post ? .21 : .30);
      pose.updateMatrix();
      mesh.setMatrixAt(i, pose.matrix);
    }
    mesh.count = PIECES;
    mesh.instanceMatrix.needsUpdate = true;
    group.visible = true;
  }
  function diagnostics() {
    return active ? {
      visible: group.visible, sourceTick: active.tick,
      targetId: active.targetId, selectedX: active.x,
      pressureObservedNow: active.pressured, pieces: mesh.count,
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
