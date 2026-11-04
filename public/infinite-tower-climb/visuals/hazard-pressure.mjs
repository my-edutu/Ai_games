import { pointFor, SCALE } from './coordinates.mjs';

// An original, physical pre-activation mechanism for SOURCE-SCHEDULED hazards.
// The fixed-step server publishes the 1–12 tick countdown; this stage cannot
// forecast a trap itself, invent a hit, change collision, or render HUD warnings.
// A single bounded draw across all nearby hazards makes the closing jaws legible
// in the real 3D stage, including the narrow portrait camera.
const PIECES_PER_HAZARD = 16;
const MAX_HAZARDS = 6;
const CHARGE_WINDOW_TICKS = 12;
const valid = n => Number.isFinite(n);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Two simultaneously observed physical threats should be staged as ONE
// source-authentic escape dilemma on a narrow phone screen, never as a
// prediction, fabricated safe route or gameplay action.
export function observedConcurrentHazardCluster(snapshot) {
  const player = snapshot?.player;
  const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
  if (snapshot?.stale || snapshot?.lifecycle !== 'running' ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
      mode !== 'evading-hazard' || player?.state !== 'standing' ||
      ![player.x, player.y, player.health].every(valid) ||
      player.health <= 0 || !Array.isArray(snapshot.hazards)) return null;
  const observed = [];
  for (const hazard of snapshot.hazards) {
    if (!hazard || ![hazard.x, hazard.y, hazard.width, hazard.height].every(valid) ||
        hazard.width <= 0 || hazard.height <= 0 ||
        !(hazard.active || (Number.isSafeInteger(hazard.chargeTicksRemaining) &&
          hazard.chargeTicksRemaining >= 1 && hazard.chargeTicksRemaining <= CHARGE_WINDOW_TICKS))) continue;
    const x = hazard.x + hazard.width*.5, y = hazard.y + hazard.height*.5;
    if (Math.abs(x-player.x)>90000 || Math.abs(y-player.y)>60000) continue;
    observed.push({ ...hazard, centerY:y,
      distance:Math.abs(x-player.x)+Math.abs(y-player.y)*.65 });
  }
  if (observed.length < 2) return null;
  observed.sort((a,b)=>a.distance-b.distance ||
    String(a.id??'').localeCompare(String(b.id??'')));
  const a=observed[0], b=observed[1];
  const left=Math.min(a.x,b.x), right=Math.max(a.x+a.width,b.x+b.width);
  const bottom=Math.min(a.y,b.y), top=Math.max(a.y+a.height,b.y+b.height);
  if(Math.abs(a.centerY-b.centerY)>30000 || right-left>140000 ||
     top-bottom>50000) return null;
  return { x:(left+right)*.5, y:(bottom+top)*.5,
    halfWidth:(right-left)*.5, halfHeight:(top-bottom)*.5, count:2 };
}

export function createTowerHazardPressure(THREE) {
  const group = new THREE.Group();
  group.name = 'SourceBoundHazardPressureStage';
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    // Per-instance alloy colors distinguish warning, real collision and
    // source-confirmed release. Geometry, not color alone, carries the phase.
    color: 0xffffff, metalness: .76, roughness: .36,
    emissive: 0x27140c, emissiveIntensity: .18,
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
  const bronze = new THREE.Color(0xd8a367);
  const darkSteel = new THREE.Color(0x836c60);
  const counterweight = new THREE.Color(0xf3c18b);
  const strikingJaw = new THREE.Color(0xf27147);
  const strikingRail = new THREE.Color(0xad4938);
  const strikingWeight = new THREE.Color(0xffba82);
  const releasedSteel = new THREE.Color(0x87999a);
  const RELEASE_TICKS = 6;
  // Last-observed real activation can own a short, purely mechanical unload
  // AFTER source deactivation. Neither wall time nor render frames invent a
  // collision, release event, forecast, or change the authoritative hazard.
  const previousActive = new Set();
  const releaseTickById = new Map();
  let lastRun = null, lastFloor = null, lastTick = null;
  let chargingHazards = 0, activeHazards = 0, releasingHazards = 0;
  let sourceTick = null, observedFloor = null, disposed = false;

  function clear() {
    shutters.count = 0;
    shutters.visible = false;
    chargingHazards = 0;
    activeHazards = 0;
    releasingHazards = 0;
    sourceTick = null;
    observedFloor = null;
    lastRun = null; lastFloor = null; lastTick = null;
    previousActive.clear();
    releaseTickById.clear();
  }

  function update(snapshot, options = {}) {
    if (disposed) return;
    const player = snapshot?.player;
    if (options.stale || snapshot?.stale || snapshot?.lifecycle !== 'running' ||
      !Number.isSafeInteger(snapshot?.tick) || snapshot.tick < 0 ||
      !Number.isSafeInteger(snapshot.floor) ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !valid(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
      !valid(snapshot.chunkBaseY) ||
      !player || ![player.x, player.y, player.health].every(valid) ||
      player.health <= 0 || !Array.isArray(snapshot.hazards)) {
      clear();
      return;
    }

    const sameRun = snapshot.runToken === lastRun && snapshot.floor === lastFloor;
    const advancing = sameRun && lastTick !== null &&
      snapshot.tick > lastTick && snapshot.tick - lastTick <= 8;
    if (!sameRun || (lastTick !== null &&
      (snapshot.tick < lastTick || snapshot.tick - lastTick > 8))) {
      previousActive.clear();
      releaseTickById.clear();
    }
    if (advancing) {
      // Only an adjacent, genuinely ACTIVE -> INACTIVE source observation
      // permits this purely visual unloading. A first idle frame, backwards
      // replay, absent trap or feed gap cannot create an aftermath.
      for (const hazard of snapshot.hazards) {
        if (hazard && typeof hazard.id === 'string' && !hazard.active &&
          previousActive.has(hazard.id) &&
          !releaseTickById.has(hazard.id)) {
          releaseTickById.set(hazard.id, snapshot.tick);
        }
      }
    }
    previousActive.clear();
    for (const [id, start] of releaseTickById) {
      if (snapshot.tick < start || snapshot.tick - start >= RELEASE_TICKS ||
        !snapshot.hazards.some(h => h?.id === id && !h.active))
        releaseTickById.delete(id);
    }

    const guardianWindup = snapshot.enemies?.some(
      enemy => enemy.active && enemy.telegraph) || false;
    const maximum = options.quality === 'low' ? 3 : MAX_HAZARDS;
    let count = 0, charging = 0, active = 0, releasing = 0;
    // Source-active collision has absolute priority, including when another
    // real guardian winds up. Then anticipate new warnings; finally spend
    // any remaining low-tier budget on already-safe mechanical unloading.
    // Iterate unchanged source order within each phase, never mutate it.
    for (const phase of ['active', 'charging', 'release']) {
      if (guardianWindup && phase !== 'active') continue;
      for (const hazard of snapshot.hazards) {
        if (count >= maximum * PIECES_PER_HAZARD) break;
        if (!hazard ||
          ![hazard.x, hazard.y, hazard.width, hazard.height].every(valid) ||
          hazard.width <= 0 || hazard.height <= 0 ||
          Math.abs(hazard.x + hazard.width * .5 - player.x) > 170000 ||
          Math.abs(hazard.y + hazard.height * .5 - player.y) > 130000) continue;
        const isActive = hazard.active === true;
        const isCharging = !isActive &&
          Number.isSafeInteger(hazard.chargeTicksRemaining) &&
          hazard.chargeTicksRemaining >= 1 &&
          hazard.chargeTicksRemaining <= CHARGE_WINDOW_TICKS;
        const releaseStarted = releaseTickById.get(hazard.id);
        const isReleasing = !isActive && !isCharging &&
          Number.isSafeInteger(releaseStarted) &&
          snapshot.tick >= releaseStarted &&
          snapshot.tick - releaseStarted < RELEASE_TICKS;
        if ((phase === 'active' && !isActive) ||
          (phase === 'charging' && !isCharging) ||
          (phase === 'release' && !isReleasing)) continue;
        const progress = isActive ? 1 : isCharging
          ? (options.reducedMotion ? 1 :
            clamp((CHARGE_WINDOW_TICKS + 1 - hazard.chargeTicksRemaining) /
              CHARGE_WINDOW_TICKS, 0, 1))
          : (options.reducedMotion ? 0 :
            clamp(1 - (snapshot.tick - releaseStarted) / RELEASE_TICKS, 0, 1));
        const width = clamp(hazard.width / SCALE / 6.4, .34, 1.9);
        const lift = .14 + .72 * progress;
        for (let n = 0; n < PIECES_PER_HAZARD; n++) {
          if (n < 8) {
            const fraction = .15 + (n % 4) * .235;
            const point = pointFor(hazard.x + hazard.width * fraction,
              hazard.y, snapshot.chunkBaseY, snapshot.worldWidth,
              n >= 4 ? 26.08 : 24.82);
            pose.position.set(point.x, point.y + lift, point.z);
            pose.rotation.set(0, point.angle,
              (n >= 4 ? -1 : 1) * (.12 + .24 * progress));
            pose.scale.set(width, .19 + .62 * progress, .25);
          } else if (n < 12) {
            const point = pointFor(hazard.x + hazard.width * (.11 + (n-8) * .26),
              hazard.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.45);
            pose.position.set(point.x, point.y + .08 + progress * .12, point.z);
            pose.rotation.set(0, point.angle, 0);
            pose.scale.set(width * 1.15, .09, .56 + .12 * progress);
          } else {
            const slot = n-12, fraction = slot < 2 ? .08 : .92;
            const point = pointFor(hazard.x + hazard.width * fraction,
              hazard.y, snapshot.chunkBaseY, snapshot.worldWidth,
              slot % 2 === 0 ? 24.72 : 26.18);
            pose.position.set(point.x, point.y + .38 + progress * .32, point.z);
            pose.rotation.set(0, point.angle, slot % 2 === 0 ? -.12 : .12);
            pose.scale.set(width * .39, .26 + progress * .6, .30);
          }
          pose.updateMatrix();
          shutters.setMatrixAt(count, pose.matrix);
          // Continuous chamber closure at the exact source activation:
          // shape stays fixed at the hit; a warm strike tint replaces amber.
          // Post-collision metal cools and physically reopens, no flash.
          const tint = isReleasing ? releasedSteel : isActive
            ? (n < 8 ? strikingJaw : n < 12 ? strikingRail : strikingWeight)
            : (n < 8 ? bronze : n < 12 ? darkSteel : counterweight);
          shutters.setColorAt(count, tint);
          count++;
        }
        if (isActive) {
          active++;
          if (typeof hazard.id === 'string') {
            previousActive.add(hazard.id);
            releaseTickById.delete(hazard.id);
          }
        } else if (isCharging) charging++;
        else releasing++;
      }
    }
    shutters.count = count;
    shutters.visible = count > 0;
    if (count) {
      shutters.instanceMatrix.needsUpdate = true;
      shutters.instanceColor?.setUsage(THREE.DynamicDrawUsage);
      if (shutters.instanceColor) shutters.instanceColor.needsUpdate = true;
    }
    chargingHazards = charging;
    activeHazards = active;
    releasingHazards = releasing;
    sourceTick = count ? snapshot.tick : null;
    observedFloor = count ? snapshot.floor : null;
    lastRun = snapshot.runToken;
    lastFloor = snapshot.floor;
    lastTick = snapshot.tick;
  }

  function diagnostics() {
    return {
      sourceTick, observedFloor, chargingHazards, activeHazards,
      releasingHazards,
      phase: activeHazards ? 'active' :
        chargingHazards ? 'charging' : releasingHazards ? 'release' : 'idle',
      instances: shutters.count, extraDraws: shutters.visible ? 1 : 0,
      sourceBound: true, maximumInstances: MAX_HAZARDS * PIECES_PER_HAZARD,
      reducedMotion: 'Static charge and neutral unload, live attack remains visibly closed',
      evidence: 'Published fixed-step warning -> actual active attack -> adjacent observed safe mechanical unload; one 3D draw, no forecast or gameplay/collision authority',
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    group.remove(shutters);
    shutters.dispose();
    geometry.dispose();
    material.dispose();
  }

  return { group, update, clear, diagnostics, dispose };
}
