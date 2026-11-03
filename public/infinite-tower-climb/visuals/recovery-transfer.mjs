// Viewer-facing completion of a real low-health AI rescue, not a predicted pickup.
// The same current-support health target already guides the autonomous route.
// Only an observed, same-run/floor health gain AND disappearance of one nearby
// actual health item may earn this original physical transfer. No game writes.
const LIMIT = 9;
const finite = Number.isFinite;
export function observedHealthRecovery(previous, next) {
  if (!previous || !next || previous.lifecycle !== 'running' ||
    next.lifecycle !== 'running' || typeof next.runToken !== 'string' ||
    !next.runToken || previous.runToken !== next.runToken ||
    !Number.isSafeInteger(previous.floor) || previous.floor !== next.floor ||
    !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(next.tick) ||
    next.tick <= previous.tick || next.tick - previous.tick > 8 ||
    !Array.isArray(previous.pickups) || !Array.isArray(next.pickups)) return null;
  const before = previous.player, after = next.player;
  if (!before || !after ||
    ![before.health, before.maxHealth, after.health, after.maxHealth,
      after.x, after.y, after.halfWidth, after.halfHeight].every(finite) ||
    before.maxHealth <= 0 || after.maxHealth !== before.maxHealth ||
    before.health <= 0 || before.health >= before.maxHealth ||
    after.health <= before.health || after.health > after.maxHealth ||
    after.halfWidth <= 0 || after.halfHeight <= 0 ||
    !finite(next.chunkBaseY) || !finite(next.worldWidth) || next.worldWidth <= 0) return null;
  const remaining = new Set(next.pickups.map(item => item?.id));
  const collected = previous.pickups.filter(item =>
    item?.kind === 'health' && typeof item.id === 'string' && item.id.length &&
    !remaining.has(item.id) && [item.x, item.y].every(finite) &&
    Math.abs(item.x - after.x) <= after.halfWidth + 14000 &&
    Math.abs(item.y - after.y) <= after.halfHeight + 10000);
  // If two items vanished in one frame, an animation cannot claim which one
  // actually gave the observed HP. Suppress rather than fabricate causality.
  if (collected.length !== 1) return null;
  const item = collected[0];
  return { runToken: next.runToken, floor: next.floor, tick: next.tick,
    pickupId: item.id, x: item.x, y: item.y,
    fromHealth: before.health, toHealth: after.health };
}

export function createTowerRecoveryTransfer(THREE) {
  const group = new THREE.Group();
  group.name = 'SourceEarnedHealthRecovery';
  const geometry = new THREE.OctahedronGeometry(.25, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x91d9b1, metalness: .30, roughness: .38,
    emissive: 0x27654d, emissiveIntensity: .38, transparent: true,
    opacity: .82, depthTest: true, depthWrite: false,
  });
  const relics = new THREE.InstancedMesh(geometry, material, LIMIT);
  relics.name = 'ObservedPickupToArmorTransfer';
  relics.frustumCulled = false;
  relics.castShadow = false;
  relics.receiveShadow = false;
  relics.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  relics.count = 0;
  relics.visible = false;
  group.add(relics);
  const origin = new THREE.Vector3();
  const goal = new THREE.Vector3();
  const pose = new THREE.Object3D();
  let observed = null, born = 0, disposed = false;
  function clear() {
    observed = null; relics.count = 0; relics.visible = false;
  }
  function begin(event, from, now) {
    if (disposed || !event || !from || ![from.x, from.y, from.z, now].every(finite)) return false;
    observed = { runToken: event.runToken, floor: event.floor, tick: event.tick,
      pickupId: event.pickupId, hpGain: event.toHealth - event.fromHealth };
    origin.copy(from); born = now; relics.count = 0; relics.visible = false;
    return true;
  }
  function update(snapshot, hero, now, options = {}) {
    if (!observed || disposed || options.stale || !snapshot || !hero ||
      snapshot.lifecycle !== 'running' || snapshot.player?.health <= 0 ||
      snapshot.runToken !== observed.runToken || snapshot.floor !== observed.floor ||
      !Number.isSafeInteger(snapshot.tick) || snapshot.tick < observed.tick ||
      snapshot.tick - observed.tick > 40 || ![hero.x, hero.y, hero.z, now].every(finite)) {
      clear(); return;
    }
    const age = now - born;
    if (age < 0 || age >= 1.4) { clear(); return; }
    // Real low-tier/mobile gameplay receives the SAME authored geometry.
    // Reduced-motion retains three quiet, static earned armor glints.
    const calm = options.reducedMotion === true;
    const count = calm ? 3 : LIMIT;
    goal.copy(hero); goal.y += 1.45;
    for (let i = 0; i < count; i++) {
      const phase = (i * 2.399963229728653);
      const progress = calm ? 1 : Math.max(0, Math.min(1, (age - i * .038) / .87));
      const curve = progress * progress * (3 - 2 * progress);
      pose.position.lerpVectors(origin, goal, curve);
      pose.position.x += Math.cos(phase) * (calm ? .42 : (.25 + .48 * Math.sin(Math.PI * progress)));
      pose.position.z += Math.sin(phase) * (calm ? .42 : (.25 + .48 * Math.sin(Math.PI * progress)));
      pose.position.y += calm ? (i - 1) * .3 : Math.sin(Math.PI * progress) * .85;
      const fade = calm ? .72 : Math.sin(Math.PI * Math.min(1, age / 1.4)) *
        (.24 + .76 * Math.sin(Math.PI * progress));
      const scale = Math.max(.03, (calm ? .40 : .30 + .35 * (1 - progress)) * fade);
      pose.scale.setScalar(scale);
      pose.rotation.set(0, phase + (calm ? 0 : progress * 2), calm ? 0 : progress * 1.4);
      pose.updateMatrix();
      relics.setMatrixAt(i, pose.matrix);
    }
    relics.count = count;
    relics.visible = true;
    relics.instanceMatrix.needsUpdate = true;
  }
  function diagnostics() {
    return { visible: relics.visible, instances: relics.count, evidence: observed ?
      { ...observed, source: 'real consumed health pickup + same-floor authoritative HP gain' } : null,
      extraDraws: relics.visible ? 1 : 0, hardwareQualityVerdict: 'NOT EVALUATED' };
  }
  function dispose() {
    if (disposed) return;
    clear(); disposed = true; geometry.dispose(); material.dispose(); group.clear();
  }
  return { group, begin, update, clear, diagnostics, dispose };
}
