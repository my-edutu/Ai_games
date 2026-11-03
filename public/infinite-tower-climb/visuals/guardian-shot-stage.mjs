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

// Only a physically present source-owned projectile flying toward a living
// guardian can earn a hero pulse plume. No simulated future hit or shot.
export function observedGuardianPulseFlight(snapshot) {
  const player = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || !player || player.health <= 0 ||
    !['standing', 'airborne'].includes(player.state) || !Number.isSafeInteger(snapshot.tick) ||
    !Number.isSafeInteger(snapshot.floor) || !snapshot.runToken ||
    !Number.isFinite(snapshot.chunkBaseY) ||
    !Number.isFinite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
    !Number.isFinite(player.x) || !Array.isArray(snapshot.projectiles) ||
    !Array.isArray(snapshot.enemies)) return null;
  let best = null, bestDistance = Infinity;
  for (const shot of snapshot.projectiles) {
    if (shot?.owner !== 'player' || typeof shot.id !== 'string' || !shot.id ||
      ![shot.x, shot.y, shot.vx].every(Number.isFinite) || shot.vx === 0 ||
      Math.abs(shot.x - player.x) > 210000) continue;
    const direction = Math.sign(shot.vx);
    for (const guardian of snapshot.enemies) {
      if (guardian?.kind !== 'guardian' || guardian.active !== true ||
        typeof guardian.id !== 'string' || !guardian.id ||
        ![guardian.x, guardian.y, guardian.halfHeight, guardian.health].every(Number.isFinite) ||
        guardian.health <= 0 || guardian.halfHeight <= 0) continue;
      const distance = (guardian.x - shot.x) * direction;
      if (distance < 0 || distance > 210000 || distance >= bestDistance ||
        (guardian.x - player.x) * direction <= 0 ||
        Math.abs(guardian.x - player.x) > 210000 ||
        Math.abs(guardian.y - shot.y) >= guardian.halfHeight + 3500) continue;
      bestDistance = distance;
      best = {
        runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
        projectileId: shot.id, guardianId: guardian.id,
        airborne: player.state === 'airborne',
        x: shot.x, y: shot.y, vx: shot.vx,
        worldWidth: snapshot.worldWidth, baseY: snapshot.chunkBaseY,
      };
    }
  }
  return best;
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
  // A second instanced forged alloy plume renders one REAL step of the
  // player projectile. It never stretches ahead into a fabricated impact.
  const pulseGeometry = new THREE.OctahedronGeometry(.38, 0);
  const pulseMaterial = new THREE.MeshStandardMaterial({
    color: 0xa8eee3, metalness: .28, roughness: .36,
    emissive: 0x29766e, emissiveIntensity: .42,
    transparent: true, opacity: .82, depthTest: true, depthWrite: false,
  });
  const pulses = new THREE.InstancedMesh(pulseGeometry, pulseMaterial, 6);
  pulses.name = 'RealPlayerPulseGuardianFlight';
  pulses.count = 0;
  pulses.castShadow = false;
  pulses.receiveShadow = false;
  pulses.frustumCulled = false;
  pulses.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(arrows, pulses);
  group.visible = false;
  let source = null, pulseSource = null, lastKey = '', disposed = false;
  function clear() {
    source = null;
    pulseSource = null;
    lastKey = '';
    arrows.count = 0;
    pulses.count = 0;
    group.visible = false;
  }
  function update(snapshot, options = {}) {
    if (disposed) return;
    const next = options.stale ? null : observedGuardianShotCorridor(snapshot);
    const flight = options.stale ? null : observedGuardianPulseFlight(snapshot);
    if (!next && !flight) { clear(); return; }
    const reduced = options.reducedMotion === true;
    // At close quarters there is not enough physical lane to space eight
    // large vanes: show one substantial warning instead of a flickering
    // stack. Wider real lanes gain density, never exceeding 8 phone/12 HD.
    const budget = options.quality === 'low' ? 8 : MAX_MARKERS;
    const count = next ? Math.min(budget, Math.max(1,
      Math.floor(next.length / 11500))) : 0;
    const pulseCount = flight ? (options.quality === 'low' ? 4 : 6) : 0;
    const key = [next?.runToken, next?.floor, next?.tick, next?.guardianId,
      next?.x, next?.y, next?.playerX, next?.remainingChargeTicks,
      next?.facing, next?.startGap, next?.length, count, reduced,
      flight?.runToken, flight?.floor, flight?.tick, flight?.projectileId,
      flight?.guardianId, flight?.x, flight?.y, flight?.vx, pulseCount].join(':');
    if (key === lastKey) return;
    source = next;
    pulseSource = flight;
    lastKey = key;
    arrows.count = count;
    const heat = next?.charge ?? 0;
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
    if (count) {
      arrows.instanceMatrix.needsUpdate = true;
      if (arrows.instanceColor) arrows.instanceColor.needsUpdate = true;
    }
    pulses.count = pulseCount;
    if (flight) {
      // Every shard occupies the bolt's already traversed single-tick segment.
      // Tick and velocity are SOURCE observations, not an animation prediction.
      const travelled = Math.min(16000, Math.abs(flight.vx));
      const sign = Math.sign(flight.vx);
      for (let index = 0; index < pulseCount; index++) {
        const t = (index + .5) / pulseCount;
        const x = clamp(flight.x - sign * travelled * t, 0, flight.worldWidth);
        const site = pointFor(x, flight.y, flight.baseY, flight.worldWidth, 27.82);
        pose.position.set(site.x, site.y + .10, site.z);
        pose.rotation.set(0, site.angle, 0);
        pose.scale.setScalar(.95 - t * .46);
        pose.updateMatrix();
        pulses.setMatrixAt(index, pose.matrix);
      }
      pulses.instanceMatrix.needsUpdate = true;
    }
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
  function pulseFocusPoint() {
    if (!group.visible || !pulseSource) return null;
    return pointFor(pulseSource.x, pulseSource.y, pulseSource.baseY,
      pulseSource.worldWidth, 27.82);
  }
  function diagnostics() {
    return {
      sourceBound: true, visible: group.visible,
      runToken: source?.runToken ?? null, floor: source?.floor ?? null,
      tick: source?.tick ?? null, guardianId: source?.guardianId ?? null,
      remainingChargeTicks: source?.remainingChargeTicks ?? null,
      facing: source?.facing ?? null, markerCount: group.visible ? arrows.count : 0,
      presentLaneLength: source?.length ?? null, startGap: source?.startGap ?? null,
      pulseGuardianId: pulseSource?.guardianId ?? null,
      witnessedPlayerProjectileId: pulseSource?.projectileId ?? null,
      pulseMarkerCount: group.visible ? pulses.count : 0,
      maximumMarkers: MAX_MARKERS, maximumPulseMarkers: 6,
      extraDraws: (arrows.count > 0 ? 1 : 0) + (pulses.count > 0 ? 1 : 0),
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
    pulseGeometry.dispose();
    pulseMaterial.dispose();
  }
  return { group, update, clear, focusPoint, pulseFocusPoint, diagnostics, dispose };
}
