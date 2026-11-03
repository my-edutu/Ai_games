import { pointFor } from './coordinates.mjs';

// Real guardian projectile windup, readable on the OUTSIDE of the tower.
// The existing fired-shot ribbon and authoritative combat remain untouched.
// This is a *warning of a source-facing firing lane*, never a predicted hit.
const MAX_MARKERS = 12;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function observedGuardianShotCorridor(snapshot) {
  const player = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || !player || player.health <= 0 ||
    !Number.isSafeInteger(snapshot.tick) || !Number.isSafeInteger(snapshot.floor) ||
    typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
    !Number.isFinite(snapshot.chunkBaseY) ||
    !Number.isFinite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
    !Array.isArray(snapshot.enemies) ||
    ![player.x, player.y, player.halfHeight].every(Number.isFinite) ||
    player.halfHeight <= 0) return null;
  let closest = null, distance = Infinity;
  for (const guardian of snapshot.enemies) {
    if (guardian?.kind !== 'guardian' || guardian.active !== true ||
      guardian.telegraph !== true || !Number.isFinite(guardian.x) ||
      !Number.isFinite(guardian.y) || !Number.isFinite(guardian.health) ||
      guardian.health <= 0 || !Number.isFinite(guardian.maxHealth) ||
      guardian.maxHealth <= 0 || !Number.isFinite(guardian.facing) ||
      ![-1, 1].includes(guardian.facing) ||
      typeof guardian.id !== 'string' || !guardian.id) continue;
    const dx = player.x - guardian.x;
    // The authoritative combat tick turns the guardian toward a player within
    // 220000 source units. The genuine projectile travels horizontally from
    // enemy.y with a 3500-unit half-height. A lane outside that collision
    // band would be an invented threat, not an accessible warning.
    if (dx * guardian.facing <= 11000 || Math.abs(dx) >= 220000 ||
      Math.abs(player.y - guardian.y) >= player.halfHeight + 3500 ||
      Math.abs(dx) >= distance) continue;
    closest = guardian;
    distance = Math.abs(dx);
  }
  if (!closest) return null;
  const remaining = Number.isFinite(closest.telegraphTicksRemaining)
    ? clamp(Math.floor(closest.telegraphTicksRemaining), 1, 8) : 8;
  return {
    runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
    guardianId: closest.id, x: closest.x, y: closest.y,
    facing: closest.facing, playerX: player.x,
    remainingChargeTicks: remaining, charge: (8 - remaining) / 7,
    worldWidth: snapshot.worldWidth, baseY: snapshot.chunkBaseY,
    // Stop just short of the actual player. This is neither a fictitious
    // bullet, collision shape, nor a promise that the guardian will hit.
    length: Math.min(140000, Math.max(0, distance - 17500)),
  };
}

export function createTowerGuardianShotStage(THREE) {
  const group = new THREE.Group();
  group.name = 'RealGuardianShotWarningStage';
  const geometry = new THREE.ConeGeometry(.26, .72, 3, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd099, transparent: true, opacity: .73,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const arrows = new THREE.InstancedMesh(geometry, material, MAX_MARKERS);
  arrows.name = 'ActualGuardianProjectileFacing';
  arrows.count = 0;
  arrows.castShadow = false;
  arrows.receiveShadow = false;
  arrows.frustumCulled = false;
  arrows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const pose = new THREE.Object3D();
  const direction = new THREE.Vector3();
  const along = new THREE.Vector3(0, 1, 0);
  const warm = new THREE.Color(0xffbc78);
  const urgent = new THREE.Color(0xff7657);
  const color = new THREE.Color();
  group.add(arrows);
  group.visible = false;
  let source = null, lastKey = '', disposed = false;
  function clear() {
    source = null;
    lastKey = '';
    arrows.count = 0;
    group.visible = false;
  }
  function update(snapshot, options = {}) {
    if (disposed) return;
    const next = options.stale ? null : observedGuardianShotCorridor(snapshot);
    if (!next) { clear(); return; }
    const reduced = options.reducedMotion === true;
    const count = options.quality === 'low' ? 8 : MAX_MARKERS;
    const key = [next.runToken, next.floor, next.tick, next.guardianId,
      next.x, next.y, next.playerX, next.remainingChargeTicks,
      next.facing, count, reduced].join(':');
    if (key === lastKey) return;
    source = next;
    lastKey = key;
    arrows.count = count;
    const heat = next.charge;
    for (let index = 0; index < count; index++) {
      const t = (index + .6) / count;
      const x = clamp(next.x + next.facing * (10500 + next.length * t),
        0, next.worldWidth);
      const xNext = clamp(x + next.facing * 1500, 0, next.worldWidth);
      // Outboard 27.75 radius: the source launch line stays readable from
      // portrait without hiding the guardian's true armor or the safe deck.
      const site = pointFor(x, next.y, next.baseY, next.worldWidth, 27.75);
      const ahead = pointFor(xNext, next.y, next.baseY, next.worldWidth, 27.75);
      pose.position.set(site.x, site.y, site.z);
      direction.set(ahead.x - site.x, 0, ahead.z - site.z);
      if (direction.lengthSq() > 1e-8) pose.quaternion.setFromUnitVectors(along, direction.normalize());
      else pose.quaternion.identity();
      // The incoming eight true authority ticks thicken the physical
      // charge glyphs; reduced motion removes all temporal oscillation.
      const pulse = reduced ? 1 : 1 + .035 * Math.sin(next.tick * .55 - index * .75);
      pose.scale.setScalar((.78 + heat * .5) * pulse);
      pose.updateMatrix();
      arrows.setMatrixAt(index, pose.matrix);
      color.copy(warm).lerp(urgent, heat);
      arrows.setColorAt(index, color);
    }
    arrows.instanceMatrix.needsUpdate = true;
    if (arrows.instanceColor) arrows.instanceColor.needsUpdate = true;
    group.visible = true;
  }
  function diagnostics() {
    return {
      sourceBound: true, visible: group.visible,
      runToken: source?.runToken ?? null, floor: source?.floor ?? null,
      tick: source?.tick ?? null, guardianId: source?.guardianId ?? null,
      remainingChargeTicks: source?.remainingChargeTicks ?? null,
      facing: source?.facing ?? null, markerCount: group.visible ? arrows.count : 0,
      maximumMarkers: MAX_MARKERS, extraDraws: group.visible ? 1 : 0,
      predictedHits: false, shadowCastingMeshes: 0, disposed,
    };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    group.clear();
    geometry.dispose();
    material.dispose();
  }
  return { group, update, clear, diagnostics, dispose };
}
