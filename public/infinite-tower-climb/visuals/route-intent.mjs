import { pointFor } from './coordinates.mjs';

// An autonomous route is a choice, not a predicted jump trajectory. These
// twelve small, depth-tested, world-space direction stones show the real
// CURRENT platform intention. They cannot promise a landing or change
// collisions, decision policy, replay or a spectator's controls.
const MAX_MARKERS = 12;
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
  const group = new THREE.Group();
  group.name = 'TowerRouteDecisionStones';
  group.visible = false;
  group.add(markers);
  const pose = new THREE.Object3D();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3(...UP);
  let runToken = null, targetPlatformId = null, sourceTick = -1;
  let reduced = false, disposed = false;

  function clear() {
    group.visible = false;
    runToken = null;
    targetPlatformId = null;
    sourceTick = -1;
  }

  function update(snapshot, platform, options = {}) {
    if (disposed) return;
    const player = snapshot?.player;
    const mode = snapshot?.intent?.mode?.replace(/^oracle-/, '');
    const valid = snapshot?.lifecycle === 'running' && !options.stale &&
      Number.isSafeInteger(snapshot.tick) && typeof snapshot.runToken === 'string' &&
      snapshot.runToken.length > 0 && player?.health > 0 && !player.attacking &&
      ['aligning', 'jumping', 'air-control'].includes(mode) &&
      platform && typeof platform.id === 'string' && platform.width > 0 &&
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
    runToken = snapshot.runToken;
    targetPlatformId = platform.id;
    sourceTick = snapshot.tick;
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
    group.visible = true;
  }

  function diagnostics() {
    return { sourceBound: true, visible: group.visible, runToken,
      targetPlatformId, tick: sourceTick,
      markers: group.visible ? markers.count : 0, maximumMarkers: MAX_MARKERS,
      opaqueTowerOccludes: material.depthTest, extraDraws: group.visible ? 1 : 0,
      simulatedFlight: false, disposed };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    group.clear();
    geometry.dispose();
    material.dispose();
  }
  return { group, update, diagnostics, dispose };
}
