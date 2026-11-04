import { pointFor, SCALE } from './coordinates.mjs';

// An original, physical pre-activation mechanism for SOURCE-SCHEDULED hazards.
// The fixed-step server publishes the 1–12 tick countdown; this stage cannot
// forecast a trap itself, invent a hit, change collision, or render HUD warnings.
// A single bounded draw across all nearby hazards makes the closing jaws legible
// in the real 3D stage, including the narrow portrait camera.
const PIECES_PER_HAZARD = 8;
const MAX_HAZARDS = 8;
const CHARGE_WINDOW_TICKS = 12;
const valid = n => Number.isFinite(n);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function createTowerHazardPressure(THREE) {
  const group = new THREE.Group();
  group.name = 'SourceBoundHazardPressureStage';
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd8a367, metalness: .76, roughness: .36,
    emissive: 0x6e3214, emissiveIntensity: .24,
    depthTest: true, depthWrite: true,
  });
  const shutters = new THREE.InstancedMesh(
    geometry, material, MAX_HAZARDS * PIECES_PER_HAZARD);
  shutters.name = 'SourceTimedHazardChargingShutters';
  shutters.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shutters.frustumCulled = false;
  shutters.castShadow = false;
  shutters.receiveShadow = false;
  shutters.visible = false;
  shutters.count = 0;
  group.add(shutters);
  const pose = new THREE.Object3D();
  let chargingHazards = 0, sourceTick = null, observedFloor = null;

  function clear() {
    shutters.count = 0;
    shutters.visible = false;
    chargingHazards = 0;
    sourceTick = null;
    observedFloor = null;
  }

  function update(snapshot, options = {}) {
    // Presentation cannot survive transport loss, restart, death or a REAL
    // opponent windup that demands all of the viewer's available attention.
    const player = snapshot?.player;
    if (options.stale || snapshot?.lifecycle !== 'running' ||
      !Number.isSafeInteger(snapshot?.tick) || snapshot.tick < 0 ||
      !Number.isSafeInteger(snapshot.floor) || !snapshot.runToken ||
      !valid(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
      !valid(snapshot.chunkBaseY) ||
      !player || ![player.x, player.y, player.health].every(valid) ||
      player.health <= 0 || !Array.isArray(snapshot.hazards) ||
      snapshot.enemies?.some(enemy => enemy.active && enemy.telegraph)) {
      clear();
      return;
    }
    let count = 0, hazards = 0;
    const maximum = options.quality === 'low' ? 4 : MAX_HAZARDS;
    // Iteration order is the server's stable id order. Never mutate, sort or
    // deduce the source activation schedule from the presentation clock.
    for (const hazard of snapshot.hazards) {
      if (hazards >= maximum) break;
      if (!hazard || hazard.active ||
        !Number.isSafeInteger(hazard.chargeTicksRemaining) ||
        hazard.chargeTicksRemaining < 1 ||
        hazard.chargeTicksRemaining > CHARGE_WINDOW_TICKS ||
        ![hazard.x, hazard.y, hazard.width, hazard.height].every(valid) ||
        hazard.width <= 0 || hazard.height <= 0 ||
        Math.abs(hazard.x + hazard.width * .5 - player.x) > 170000 ||
        Math.abs(hazard.y + hazard.height * .5 - player.y) > 130000) continue;
      const progress = options.reducedMotion ? 1 :
        clamp((CHARGE_WINDOW_TICKS + 1 - hazard.chargeTicksRemaining) /
          CHARGE_WINDOW_TICKS, 0, 1);
      const width = clamp(hazard.width / SCALE / 6.4, .34, 1.9);
      const lift = .14 + .72 * progress;
      for (let n = 0; n < PIECES_PER_HAZARD; n++) {
        const fraction = .15 + (n % 4) * .235;
        const x = hazard.x + hazard.width * fraction;
        const front = n >= 4;
        const point = pointFor(x, hazard.y, snapshot.chunkBaseY,
          snapshot.worldWidth, front ? 26.08 : 24.82);
        pose.position.set(point.x, point.y + lift, point.z);
        // Two opposed rows of real metal jaws; an earned countdown lifts and
        // cants them toward the danger volume. Reduced motion holds their
        // fully readable warned posture instead of oscillating or flashing.
        pose.rotation.set(0, point.angle,
          (front ? -1 : 1) * (.12 + .24 * progress));
        pose.scale.set(width, .19 + .62 * progress, .25);
        pose.updateMatrix();
        shutters.setMatrixAt(count++, pose.matrix);
      }
      hazards++;
    }
    shutters.count = count;
    shutters.visible = count > 0;
    if (count) shutters.instanceMatrix.needsUpdate = true;
    chargingHazards = hazards;
    sourceTick = hazards ? snapshot.tick : null;
    observedFloor = hazards ? snapshot.floor : null;
  }

  function diagnostics() {
    return {
      sourceTick, observedFloor, chargingHazards,
      instances: shutters.count, extraDraws: shutters.visible ? 1 : 0,
      evidence: 'Only server-published 1–12 fixed-step hazard charge ticks; physical render-only jaws, not predicted danger or a blind quality vote',
    };
  }

  function dispose() {
    clear();
    group.remove(shutters);
    geometry.dispose();
    material.dispose();
  }

  return { group, update, clear, diagnostics, dispose };
}
