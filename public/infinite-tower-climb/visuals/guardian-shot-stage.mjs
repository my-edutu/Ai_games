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
  // A tight duel used to stack eight large warning arrows at the SAME
  // point: the old fixed 10,500-unit launch gap could consume almost the
  // entire real guardian/player separation. Keep the warning strictly
  // inside their present facing corridor, without implying a future hit.
  const startGap = Math.min(10500, Math.max(2200, distance * .22));
  const warningLength = Math.min(140000, Math.max(0,
    distance - startGap - 4200));
  const remaining = Number.isFinite(closest.telegraphTicksRemaining)
    ? clamp(Math.floor(closest.telegraphTicksRemaining), 1, 8) : 8;
  return {
    runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
    guardianId: closest.id, x: closest.x, y: closest.y,
    facing: closest.facing, playerX: player.x,
    remainingChargeTicks: remaining, charge: (8 - remaining) / 7,
    worldWidth: snapshot.worldWidth, baseY: snapshot.chunkBaseY,
    // The exterior 3D warning is a present-facing corridor only. It stops
    // before the player's actual current body and never predicts collision.
    startGap, length: warningLength,
  };
}

export function createTowerGuardianShotStage(THREE) {
  const group = new THREE.Group();
  group.name = 'RealGuardianShotWarningStage';
  // Replace floating tiny emissive triangles with readable four-faced
  // forged danger vanes. One draw and bounded instances, physically lit by
  // the current biome rather than bleaching out in a bright phone capture.
  const geometry = new THREE.ConeGeometry(.43, 1.55, 4, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .46, roughness: .36,
    emissive: 0x5b2413, emissiveIntensity: .18,
    transparent: true, opacity: .88,
    depthTest: true, depthWrite: false, toneMapped: true,
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
    // At close quarters there is not enough physical lane to space eight
    // large vanes: show one substantial warning instead of a flickering
    // stack. Wider real lanes gain density, never exceeding 8 phone/12 HD.
    const budget = options.quality === 'low' ? 8 : MAX_MARKERS;
    const count = Math.min(budget, Math.max(1,
      Math.floor(next.length / 11500)));
    const key = [next.runToken, next.floor, next.tick, next.guardianId,
      next.x, next.y, next.playerX, next.remainingChargeTicks,
      next.facing, next.startGap, next.length, count, reduced].join(':');
    if (key === lastKey) return;
    source = next;
    lastKey = key;
    arrows.count = count;
    const heat = next.charge;
    for (let index = 0; index < count; index++) {
      const t = (index + .5) / count;
      const x = clamp(next.x + next.facing * (next.startGap + next.length * t),
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
      // Taper toward the live climber: the attacker-side warning reads
      // boldly while the dangerous last meters do not cover the hero.
      pose.scale.setScalar((.95 + heat * .46) * (1 - t * .23) * pulse);
      pose.updateMatrix();
      arrows.setMatrixAt(index, pose.matrix);
      color.copy(warm).lerp(urgent, heat);
      arrows.setColorAt(index, color);
    }
    arrows.instanceMatrix.needsUpdate = true;
    if (arrows.instanceColor) arrows.instanceColor.needsUpdate = true;
    group.visible = true;
  }
  // The actual combat camera may prefer this SAME source-bound physical
  // lane, but only after it has kept the complete climber and guardian safe.
  // Source mutations, authority movement and camera cuts are forbidden.
  function focusPoint() {
    if (!group.visible || !source) return null;
    const x = clamp(source.x + source.facing *
      (source.startGap + source.length * .45), 0, source.worldWidth);
    return pointFor(x, source.y, source.baseY, source.worldWidth, 27.75);
  }
  function diagnostics() {
    return {
      sourceBound: true, visible: group.visible,
      runToken: source?.runToken ?? null, floor: source?.floor ?? null,
      tick: source?.tick ?? null, guardianId: source?.guardianId ?? null,
      remainingChargeTicks: source?.remainingChargeTicks ?? null,
      facing: source?.facing ?? null, markerCount: group.visible ? arrows.count : 0,
      presentLaneLength: source?.length ?? null, startGap: source?.startGap ?? null,
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
  return { group, update, clear, focusPoint, diagnostics, dispose };
}
