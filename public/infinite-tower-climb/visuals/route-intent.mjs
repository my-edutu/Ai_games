import { pointFor } from './coordinates.mjs';

// An autonomous route is a choice, not a predicted jump trajectory. These
// twelve small, depth-tested, world-space direction stones show the real
// CURRENT platform intention. They cannot promise a landing or change
// collisions, decision policy, replay or a spectator's controls.
const MAX_MARKERS = 12;
const MAX_OBSERVED_DECK_ECHOES = 6;
const UP = Object.freeze([0, 1, 0]);

// The physical source AI now chooses a clear portion of a currently observed
// landing deck rather than its decorative midpoint. Show that real choice only
// when the SOURCE intent explicitly declares a clear-lane or committed-boost
// decision. Historical-v1 and unrelated intent still aim at the source deck
// center; presentation cannot invent a route. Same finite current hazard/body
// clearance contract as the tactical pilot, no future positions/phases.
function witnessedLandingX(snapshot, deck) {
  const center = deck.x + deck.width * .5;
  const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
  const summary = snapshot?.intent?.summary;
  const sourceAirLane = (mode === 'air-control' &&
    (summary === 'Steering for a clear landing lane' ||
      summary === 'Boosting toward a distant safe landing' ||
      summary === 'Using earned air recovery to reach observed landing')) ||
    (mode === 'settling-landing' && summary === 'Braking into a clear landing lane');
  const player = snapshot?.player;
  if (!sourceAirLane || !Number.isFinite(player?.halfWidth) ||
      !Number.isFinite(player?.x) || !Number.isFinite(player?.y) ||
      !Array.isArray(snapshot?.hazards)) return { x: center, sourceAirLane: false };
  const halfWidth = player.halfWidth;
  const margin = Math.max(halfWidth + 4000,
    Math.min(18000, Math.floor(deck.width / 8)));
  const left = deck.x + margin, right = deck.x + deck.width - margin;
  if (left >= right) return { x: center, sourceAirLane: false };
  const top = deck.y + deck.height;
  let lanes = [{ left, right }];
  for (const hazard of snapshot.hazards) {
    if (!hazard.active || ![hazard.x, hazard.y, hazard.width, hazard.height].every(Number.isFinite) ||
        hazard.y >= top + 2 * (player.halfHeight || 0) ||
        hazard.y + hazard.height <= top) continue;
    const blockedLeft = hazard.x - halfWidth - 2500;
    const blockedRight = hazard.x + hazard.width + halfWidth + 2500;
    const next = [];
    for (const lane of lanes) {
      if (blockedRight <= lane.left || blockedLeft >= lane.right) {
        next.push(lane); continue;
      }
      const l = Math.min(lane.right, blockedLeft);
      const r = Math.max(lane.left, blockedRight);
      if (l - lane.left >= 10000) next.push({ left: lane.left, right: l });
      if (lane.right - r >= 10000) next.push({ left: r, right: lane.right });
    }
    lanes = next;
    if (!lanes.length) break;
  }
  // Current enemy bodies can occupy the same real landing deck as spikes.
  // Use observed positions only: this is a tactical choice, never a prediction
  // of where a patrolling enemy will stand after our flight.
  let enemyAvoided = false;
  if (lanes.length) for (const enemy of snapshot.enemies || []) {
    if (!enemy.active ||
      ![enemy.x, enemy.y, enemy.halfWidth, enemy.halfHeight].every(Number.isFinite) ||
      enemy.y - enemy.halfHeight >= top + 2 * (player.halfHeight || 0) ||
      enemy.y + enemy.halfHeight <= top) continue;
    const blockedLeft = enemy.x - enemy.halfWidth - halfWidth - 2500;
    const blockedRight = enemy.x + enemy.halfWidth + halfWidth + 2500;
    const next = [];
    for (const lane of lanes) {
      if (blockedRight <= lane.left || blockedLeft >= lane.right) {
        next.push(lane); continue;
      }
      enemyAvoided = true;
      const l = Math.min(lane.right, blockedLeft);
      const r = Math.max(lane.left, blockedRight);
      if (l - lane.left >= 10000) next.push({ left: lane.left, right: l });
      if (lane.right - r >= 10000) next.push({ left: r, right: lane.right });
    }
    lanes = next;
    if (!lanes.length) break;
  }
  if (!lanes.length) return { x: center, sourceAirLane: false, sourceEnemyClearance: false };
  let best = lanes[0], bestX = Math.max(best.left, Math.min(best.right, player.x));
  for (const lane of lanes.slice(1)) {
    const x = Math.max(lane.left, Math.min(lane.right, player.x));
    const distance = Math.abs(x - player.x);
    const priorDistance = Math.abs(bestX - player.x);
    if (distance < priorDistance ||
        (distance === priorDistance && lane.right - lane.left > best.right - best.left)) {
      best = lane; bestX = x;
    }
  }
  return { x: bestX, sourceAirLane: true,
    sourceEnemyClearance: enemyAvoided && bestX !== Math.max(left, Math.min(right, player.x)) };
}
// Recovery is a real autonomous choice, not a second jump or promised heal.
// Reuse the existing bounded 3D stones for the CURRENT supporting deck and
// a CURRENT collectible. Never point spectators toward an old/blocked pickup.
export function witnessedHealthPickup(snapshot, support) {
  const p = snapshot?.player, intent = snapshot?.intent;
  if (!support || !p || intent?.mode?.replace(/^oracle-/, '') !== 'collecting-resource' ||
    intent.targetPlatformId !== support.id ||
    !['Retreating along clear footing for an observed health pickup',
      'Securing nearby health before the next climb'].includes(intent.summary) ||
    !Number.isFinite(p.maxHealth) || p.health >= p.maxHealth ||
    ![p.x, p.y, p.halfWidth, p.halfHeight, support.x, support.y,
      support.width, support.height].every(Number.isFinite) ||
    p.halfWidth <= 0 || p.halfHeight <= 0 || support.width <= 0 ||
    Math.abs(p.y - p.halfHeight - support.y - support.height) > 3000 ||
    !Array.isArray(snapshot.pickups)) return null;
  const margin = p.halfWidth + 4000;
  const low = support.x + margin, high = support.x + support.width - margin;
  if(low >= high) return null;
  const options = snapshot.pickups.filter(item =>
    item?.kind === 'health' && typeof item.id === 'string' &&
    [item.x, item.y].every(Number.isFinite) &&
    item.x >= low && item.x <= high &&
    Math.abs(item.y - p.y) <= p.halfHeight + 8000 &&
    Math.abs(item.x - p.x) > p.halfWidth + 8000)
    .sort((a,b) => Math.abs(a.x-p.x)-Math.abs(b.x-p.x) ||
      a.id.localeCompare(b.id));
  // The public intent does not expose a pickup ID. When multiple eligible
  // health items exist, we cannot prove WHICH one authority chose: show no
  // route instead of depicting a fabricated detour to the wrong item.
  if(options.length !== 1) return null;
  const item = options[0];
  const lowX = Math.min(p.x,item.x)-p.halfWidth;
  const highX = Math.max(p.x,item.x)+p.halfWidth;
  const lowY = p.y-p.halfHeight, highY = p.y+p.halfHeight;
  const hazard = snapshot.hazards?.some(h=>h?.active &&
    h.x < highX && h.x+h.width > lowX &&
    h.y < highY && h.y+h.height > lowY);
  const enemy = snapshot.enemies?.some(e=>e?.active &&
    Math.abs(e.y-p.y) < p.halfHeight+e.halfHeight+10000 &&
    e.x+e.halfWidth+4000 > lowX && e.x-e.halfWidth-4000 < highX);
  return hazard || enemy ? null : item;
}
export function createTowerRouteIntent(THREE) {
  const geometry = new THREE.ConeGeometry(.28, .74, 4, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0x9cefe5, transparent: true, opacity: .61, depthTest: true,
    depthWrite: false, toneMapped: false,
  });
  const markers = new THREE.InstancedMesh(geometry, material, MAX_MARKERS);
  markers.name = 'ObservedAutonomousLandingIntent';
  markers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  markers.castShadow = false;
  markers.receiveShadow = false;
  markers.frustumCulled = false;
  // A moving deck is difficult to read on a narrow phone crop. Show only its
  // already OBSERVED positions as restrained amber stone echoes. Never extrapolate
  // where it will move, predict collisions, or move the authoritative deck.
  // All echoes share one instanced draw and disappear for reduced motion.
  const echoGeometry = new THREE.OctahedronGeometry(.3, 0);
  const echoMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4bd80, transparent: true, opacity: .48,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const deckEchoes = new THREE.InstancedMesh(
    echoGeometry, echoMaterial, MAX_OBSERVED_DECK_ECHOES);
  deckEchoes.name = 'SourceObservedMovingDeckEchoes';
  deckEchoes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  deckEchoes.castShadow = false;
  deckEchoes.receiveShadow = false;
  deckEchoes.frustumCulled = false;
  deckEchoes.count = 0;
  const group = new THREE.Group();
  group.name = 'TowerRouteDecisionStones';
  group.visible = false;
  group.add(markers, deckEchoes);
  const pose = new THREE.Object3D();
  const echoPose = new THREE.Object3D();
  const observedDeckPositions = [];
  let observedDeckX = null, observedDeckY = null;
  let observedMovement = 0, observedDeckKind = null;
  let observedLandingX = null, sourceClearLane = false, sourceEnemyClearance = false;
  let sourceHealthPickupId = null;
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3(...UP);
  let runToken = null, targetPlatformId = null, sourceTick = -1;
  let reduced = false, disposed = false;

  function clear() {
    group.visible = false;
    runToken = null;
    targetPlatformId = null;
    sourceTick = -1;
    observedDeckX = null;
    observedDeckY = null;
    observedMovement = 0;
    observedDeckKind = null;
    observedLandingX = null;
    sourceClearLane = false;
    sourceEnemyClearance = false;
    sourceHealthPickupId = null;
    observedDeckPositions.length = 0;
    deckEchoes.count = 0;
  }

  function update(snapshot, platform, options = {}) {
    if (disposed) return;
    const player = snapshot?.player;
    const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
    const recoveryPickup = witnessedHealthPickup(snapshot, platform);
    const valid = snapshot?.lifecycle === 'running' && !options.stale &&
      Number.isSafeInteger(snapshot.tick) && typeof snapshot.runToken === 'string' &&
      snapshot.runToken.length > 0 && player?.health > 0 && !player.attacking &&
      (['aligning', 'settling-launch', 'jumping', 'air-control', 'settling-landing'].includes(mode) ||
        (mode === 'collecting-resource' && !!recoveryPickup)) &&
      platform && typeof platform.id === 'string' &&
      platform.id === snapshot.intent?.targetPlatformId && platform.width > 0 &&
      Number.isFinite(snapshot.worldWidth) && snapshot.worldWidth > 0 &&
      Number.isFinite(snapshot.chunkBaseY) &&
      [player.x, player.y, platform.x, platform.y, platform.height, platform.width]
        .every(Number.isFinite) &&
      !snapshot.enemies?.some(enemy => enemy.active && enemy.telegraph);
    if (!valid) { clear(); return; }
    const landed = recoveryPickup
      ? { x: recoveryPickup.x, sourceAirLane: false } : witnessedLandingX(snapshot, platform);
    const elevation = recoveryPickup ? recoveryPickup.y : platform.y + platform.height;
    const deltaX = landed.x - player.x;
    if (Math.abs(deltaX) < 12000 && Math.abs(elevation - player.y) < 12000) {
      clear();
      return;
    }
    const stationary = !!options.reducedMotion;
    if (runToken === snapshot.runToken && targetPlatformId === platform.id &&
        sourceTick === snapshot.tick && reduced === stationary) return;
    const sameDestination = runToken === snapshot.runToken &&
      targetPlatformId === platform.id && observedDeckKind === platform.kind;
    const advancing = sameDestination && snapshot.tick > sourceTick &&
      snapshot.tick - sourceTick <= 8;
    if (!advancing) observedDeckPositions.length = 0;
    observedMovement = advancing && observedDeckX !== null
      ? platform.x - observedDeckX : 0;
    if (advancing && platform.kind === 'moving' &&
      Number.isFinite(observedDeckX) && Number.isFinite(observedDeckY) &&
      Math.abs(observedMovement) >= 650) {
      // The sample is the PREVIOUS real location, not a predicted landing.
      observedDeckPositions.push({
        tick: sourceTick, x: observedDeckX, y: observedDeckY,
      });
      while (observedDeckPositions.length > MAX_OBSERVED_DECK_ECHOES)
        observedDeckPositions.shift();
    }
    runToken = snapshot.runToken;
    targetPlatformId = platform.id;
    sourceTick = snapshot.tick;
    observedDeckX = platform.x;
    observedDeckY = platform.y;
    observedDeckKind = platform.kind;
    observedLandingX = landed.x;
    sourceClearLane = landed.sourceAirLane;
    sourceEnemyClearance = !!landed.sourceEnemyClearance;
    sourceHealthPickupId = recoveryPickup?.id || null;
    // Reuse the existing world-space stones. Warm alloy means a PRESENT
    // enemy-occupied landing was avoided; green remains real health recovery.
    material.color.setHex(recoveryPickup ? 0xa7df9b :
      sourceEnemyClearance ? 0xffd7a2 : 0x9cefe5);
    reduced = stationary;

    // Map authoritative x/y onto the OUTSIDE of the cylinder. The rising
    // dotted line denotes a selected destination, NEVER a calculated flight.
    // Depth testing lets the tower and actual hazard geometry occlude it.
    const distance = Math.abs(deltaX);
    const count = Math.max(5, Math.min(MAX_MARKERS,
      Math.ceil(distance / 17000) + 2));
    markers.count = count;
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      const nextT = Math.min(1, t + .01);
      function site(fraction) {
        const x = player.x + deltaX * fraction;
        const y = player.y + (elevation - player.y) * fraction +
          Math.sin(Math.PI * fraction) * (recoveryPickup ? 1700 : 12000);
        return pointFor(x, y, snapshot.chunkBaseY, snapshot.worldWidth, 27.55);
      }
      const here = site(t), there = site(nextT);
      pose.position.set(here.x, here.y + .3, here.z);
      forward.set(there.x - here.x, there.y - here.y, there.z - here.z);
      if (forward.lengthSq() < 1e-8) forward.copy(up);
      else forward.normalize();
      pose.quaternion.setFromUnitVectors(up, forward);
      const pulse = stationary ? 1 :
        1 + .055 * Math.sin(snapshot.tick * .18 - i * .55);
      pose.scale.setScalar((.57 + .35 * Math.sin(Math.PI * t)) * pulse);
      pose.updateMatrix();
      markers.setMatrixAt(i, pose.matrix);
    }
    markers.instanceMatrix.needsUpdate = true;
    // The same immutable platform timeline owns all ghost positions. An
    // interrupted feed, target change, expired sample or disabled motion
    // cannot leave apparently moving platforms in a new run.
    deckEchoes.count = 0;
    if (!stationary && platform.kind === 'moving') {
      for (const item of observedDeckPositions) {
        if (snapshot.tick - item.tick > 14) continue;
        const at = pointFor(item.x + platform.width * .5,
          item.y + platform.height, snapshot.chunkBaseY,
          snapshot.worldWidth, 27.12);
        echoPose.position.set(at.x, at.y + .18, at.z);
        echoPose.rotation.set(0, at.angle, 0);
        echoPose.scale.setScalar(.68);
        echoPose.updateMatrix();
        deckEchoes.setMatrixAt(deckEchoes.count++, echoPose.matrix);
      }
      // Discard stale history even when its visual instance count reaches 0.
      while (observedDeckPositions.length &&
        snapshot.tick - observedDeckPositions[0].tick > 14)
        observedDeckPositions.shift();
      if (deckEchoes.count) deckEchoes.instanceMatrix.needsUpdate = true;
    } else observedDeckPositions.length = 0;
    group.visible = true;
  }

  function diagnostics() {
    return { sourceBound: true, visible: group.visible, runToken,
      targetPlatformId, tick: sourceTick,
      markers: group.visible ? markers.count : 0, maximumMarkers: MAX_MARKERS,
      observedMovingDeckEchoes: group.visible ? deckEchoes.count : 0,
      observedDeckDeltaX: group.visible ? observedMovement : 0,
      observedLandingX: group.visible ? observedLandingX : null,
      sourceClearLane: group.visible && sourceClearLane,
      sourceEnemyClearance: group.visible && sourceEnemyClearance,
      sourceHealthPickupId: group.visible ? sourceHealthPickupId : null,
      echoedSourcePositionsOnly: true, movingDeckKind: observedDeckKind,
      opaqueTowerOccludes: material.depthTest,
      extraDraws: group.visible ? 1 + (deckEchoes.count ? 1 : 0) : 0,
      simulatedFlight: false, disposed };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    group.clear();
    geometry.dispose();
    material.dispose();
    echoGeometry.dispose();
    echoMaterial.dispose();
  }
  return { group, update, diagnostics, dispose };
}
