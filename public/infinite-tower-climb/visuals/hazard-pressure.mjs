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
    const maximum = options.quality === 'low' ? 3 : MAX_HAZARDS;
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
        if (n < 8) {
          const fraction = .15 + (n % 4) * .235;
          const point = pointFor(hazard.x + hazard.width*fraction,
            hazard.y, snapshot.chunkBaseY, snapshot.worldWidth,
            n >= 4 ? 26.08 : 24.82);
          pose.position.set(point.x,point.y+lift,point.z);
          pose.rotation.set(0,point.angle,
            (n>=4 ? -1 : 1)*(.12+.24*progress));
          pose.scale.set(width,.19+.62*progress,.25);
        } else if (n < 12) {
          // Four heavy, low-lying pressure rails give the source-timed
          // shutters an actual chamber. They are NOT projected safe lanes.
          const point = pointFor(hazard.x+hazard.width*(.11+(n-8)*.26),
            hazard.y,snapshot.chunkBaseY,snapshot.worldWidth,25.45);
          pose.position.set(point.x,point.y+.08+progress*.12,point.z);
          pose.rotation.set(0,point.angle,0);
          pose.scale.set(width*1.15,.09,.56+.12*progress);
        } else {
          // Counterweight pylons physically rise during the SAME authoritative
          // charge; reduced motion holds an unanimated clear posture.
          const slot=n-12, fraction=slot<2?.08:.92;
          const point=pointFor(hazard.x+hazard.width*fraction,hazard.y,
            snapshot.chunkBaseY,snapshot.worldWidth,
            slot%2===0?24.72:26.18);
          pose.position.set(point.x,point.y+.38+progress*.32,point.z);
          pose.rotation.set(0,point.angle,slot%2===0?-.12:.12);
          pose.scale.set(width*.39,.26+progress*.6,.30);
        }
        pose.updateMatrix();
        shutters.setMatrixAt(count++,pose.matrix);
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
      evidence: 'Only source-published fixed-step hazard warning; physical jaws, rails and counterweights; shared threat camera never invents safe lanes or quality votes',
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
