import { pointFor } from './coordinates.mjs';

// An autonomous route is a choice, not a predicted jump trajectory. These
// twelve small, depth-tested, world-space direction stones show the real
// CURRENT platform intention. They cannot promise a landing or change
// collisions, decision policy, replay or a spectator's controls.
const MAX_MARKERS = 12;
const MAX_OBSERVED_DECK_ECHOES = 6;
const UP = Object.freeze([0, 1, 0]);
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
    observedDeckPositions.length = 0;
    deckEchoes.count = 0;
  }

  function update(snapshot, platform, options = {}) {
    if (disposed) return;
    const player = snapshot?.player;
    const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
    const valid = snapshot?.lifecycle === 'running' && !options.stale &&
      Number.isSafeInteger(snapshot.tick) && typeof snapshot.runToken === 'string' &&
      snapshot.runToken.length > 0 && player?.health > 0 && !player.attacking &&
      ['aligning', 'jumping', 'air-control'].includes(mode) &&
      platform && typeof platform.id === 'string' &&
      platform.id === snapshot.intent?.targetPlatformId && platform.width > 0 &&
      Number.isFinite(snapshot.worldWidth) && snapshot.worldWidth > 0 &&
      Number.isFinite(snapshot.chunkBaseY) &&
      [player.x, player.y, platform.x, platform.y, platform.height, platform.width]
        .every(Number.isFinite) &&
      !snapshot.enemies?.some(enemy => enemy.active && enemy.telegraph);
    if (!valid) { clear(); return; }
    const center = platform.x + platform.width * .5;
    const elevation = platform.y + platform.height;
    const deltaX = center - player.x;
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
          Math.sin(Math.PI * fraction) * 12000;
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
