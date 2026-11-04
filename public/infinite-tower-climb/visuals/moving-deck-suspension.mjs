import { pointFor } from './coordinates.mjs';

// An original visible undercarriage for ONE REAL moving deck: either the
// platform currently supporting the climber, or the one the autonomous pilot
// explicitly selected. It does not add handholds, colliders or a route.
// The twelve struts are a single depth-tested instanced draw behind the deck.
const COUNT = 16;
const EDGES = Object.freeze([
  [0, 2], [2, 4], [1, 3], [3, 5], [0, 3], [1, 2],
  [2, 3], [4, 5], [0, 1], [6, 7], [2, 7], [3, 7],
  [6, 4], [6, 5], [7, 4], [7, 5],
]);
const valid = Number.isFinite;
const validTick = n => Number.isSafeInteger(n) && n >= 0;

export function observedMovingDeckSuspension(snapshot, options = {}) {
  if (!snapshot || options.stale || snapshot.stale ||
    snapshot.lifecycle !== 'running' || !validTick(snapshot.tick) ||
    !validTick(snapshot.floor) || typeof snapshot.runToken !== 'string' ||
    !snapshot.runToken || !valid(snapshot.worldWidth) ||
    snapshot.worldWidth <= 0 || !valid(snapshot.chunkBaseY) ||
    !Array.isArray(snapshot.platforms)) return null;
  const player = snapshot.player;
  if (!player || player.health <= 0 ||
    ![player.x, player.y, player.halfWidth, player.halfHeight].every(valid) ||
    player.halfWidth <= 0 || player.halfHeight <= 0) return null;
  const eligible = platform => platform?.kind === 'moving' &&
    typeof platform.id === 'string' && !!platform.id &&
    [platform.x, platform.y, platform.width, platform.height].every(valid) &&
    platform.width > 0 && platform.height > 0;
  // Occupied carriage outranks a FUTURE route marker. Only the exact source
  // footing geometry and real standing state can establish occupied contact.
  const occupied = snapshot.platforms.find(p => eligible(p) &&
    player.state === 'standing' &&
    Math.abs(player.y - player.halfHeight - (p.y + p.height)) <= 2500 &&
    player.x + player.halfWidth >= p.x &&
    player.x - player.halfWidth <= p.x + p.width);
  const route = occupied ? null : snapshot.platforms.find(p => eligible(p) &&
    p.id === snapshot.intent?.targetPlatformId &&
    ['aligning', 'settling-launch', 'jumping', 'air-control',
      'settling-landing'].includes(
        String(snapshot.intent?.mode || '').replace(/^oracle-/, '')));
  const selected = occupied || route;
  if (!selected || snapshot.enemies?.some(e => e?.active && e.telegraph))
    return null;
  return {
    runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
    platformId: selected.id, x: selected.x, width: selected.width,
    top: selected.y + selected.height,
    worldWidth: snapshot.worldWidth, chunkBaseY: snapshot.chunkBaseY,
    loaded: !!occupied, playerState: player.state,
    // Read-only authoritative vertical motion helps the sculpture react only
    // after actual contact. It never feeds a force or landing prediction back.
    verticalVelocity: valid(player.vy) ? player.vy : 0,
    observedOnly: true,
  };
}

export function createTowerMovingDeckSuspension(THREE) {
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 7, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .74, roughness: .42,
    emissive: 0x1b4343, emissiveIntensity: .12,
    depthTest: true, depthWrite: true,
  });
  const rods = new THREE.InstancedMesh(geometry, material, COUNT);
  rods.name = 'AuthenticMovingDeckUndercarriageTruss';
  rods.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rods.frustumCulled = false;
  rods.castShadow = false;
  rods.receiveShadow = false;
  rods.count = 0;
  const group = new THREE.Group();
  group.name = 'SourceObservedMovingPlatformSuspension';
  group.visible = false;
  group.add(rods);
  const nodes = Array.from({ length: 8 }, () => new THREE.Vector3());
  const vector = new THREE.Vector3();
  const center = new THREE.Vector3();
  const pose = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  let last = null, disposed = false, tintKey = null;
  let impactTick = -1, impactStrength = 0, compression = 0;
  let travelLean = 0, trueHorizontalDisplacement = 0;
  function clear() {
    group.visible = false;
    rods.count = 0;
    last = null; impactTick = -1; impactStrength = 0;
    compression = 0; travelLean = 0; trueHorizontalDisplacement = 0;
  }
  function update(snapshot, options = {}) {
    if (disposed) return;
    const current = observedMovingDeckSuspension(snapshot, options);
    if (!current) { clear(); return; }
    const identical = last && last.runToken === current.runToken &&
      last.floor === current.floor && last.tick === current.tick &&
      last.platformId === current.platformId &&
      last.x === current.x && last.top === current.top &&
      last.width === current.width && last.loaded === current.loaded;
    if (identical) return;
    // The load stroke is earned by TWO consecutive real source observations:
    // airborne approach followed by actual standing foot contact on this
    // exact moving deck. No timer, renderer frame or guessed collision can
    // trigger a pump. Duplicate ticks, run changes and feed gaps cannot replay it.
    const steps = last ? current.tick - last.tick : 0;
    const continuous = last && last.runToken === current.runToken &&
      last.floor === current.floor && last.platformId === current.platformId &&
      steps > 0 && steps <= 8;
    if (!continuous) { impactTick = -1; impactStrength = 0; }
    if (continuous && !last.loaded && current.loaded &&
      last.playerState === 'airborne' && current.playerState === 'standing') {
      impactTick = current.tick;
      impactStrength = Math.min(1, Math.max(.28,
        Math.max(0, -last.verticalVelocity) / 22000));
    }
    if (!current.loaded) impactTick = -1;
    const age = impactTick >= 0 ? current.tick - impactTick : Infinity;
    const release = age >= 0 && age < 12 ? Math.pow(1 - age / 12, 2) : 0;
    compression = current.loaded ? .10 + impactStrength * release * .82 : 0;
    trueHorizontalDisplacement = continuous ? current.x - last.x : 0;
    travelLean = continuous ? Math.max(-1, Math.min(1,
      trueHorizontalDisplacement / (7000 * steps))) : 0;
    const left = current.x + current.width * .23;
    const right = current.x + current.width * .77;
    const middle = current.x + current.width * .5;
    // Pair of under-floor tension spines rocks against witnessed deck travel;
    // the near-deck struts compress in response to a genuine loaded stroke.
    // All parts stay beneath the authoritative deck (never become a collider).
    const massShift = travelLean * 3500;
    const stroke = compression * 6300;
    const positions = [
      [left, -29000, 21.45], [right, -29000, 21.45],
      [left, -19000 + stroke * .35, 23.35],
      [right, -19000 + stroke * .35, 23.35],
      [left, -7800 - stroke, 25.65], [right, -7800 - stroke, 25.65],
      [middle - massShift, -27000, 21.70],
      [middle + massShift, -11000 - stroke * .45, 24.55],
    ];
    for (let i = 0; i < positions.length; i++) {
      const [x, offset, radius] = positions[i];
      const p = pointFor(x, current.top + offset,
        current.chunkBaseY, current.worldWidth, radius);
      nodes[i].set(p.x, p.y, p.z);
    }
    for (let i = 0; i < EDGES.length; i++) {
      const [start, end] = EDGES[i];
      vector.subVectors(nodes[end], nodes[start]);
      const span = vector.length();
      center.copy(nodes[start]).addScaledVector(vector, .5);
      pose.position.copy(center);
      pose.quaternion.setFromUnitVectors(up, vector.multiplyScalar(1 / Math.max(span, .001)));
      const thickness = i < 4 ? .16 : i < 6 ? .12 : i < 9 ? .105 : i < 12 ? .145 : .095;
      pose.scale.set(thickness, span, thickness);
      pose.updateMatrix();
      rods.setMatrixAt(i, pose.matrix);
    }
    const nextTint = current.loaded ? 'loaded' : 'approach';
    if (tintKey !== nextTint) {
      for (let i = 0; i < COUNT; i++) {
        const structural = i < 4 || i === 9;
        rods.setColorAt(i, color.set(structural
          ? (current.loaded ? 0xe6ecdb : 0x9eb6b4)
          : (current.loaded ? 0x94e8d4 : 0x5f8b91)));
      }
      rods.instanceColor.needsUpdate = true;
      tintKey = nextTint;
    }
    rods.count = COUNT;
    rods.instanceMatrix.needsUpdate = true;
    group.visible = true;
    last = current;
  }
  function diagnostics() {
    return last && group.visible ? {
      visible: true, platformId: last.platformId, sourceTick: last.tick,
      runToken: last.runToken, loadedByRealFootContact: last.loaded,
      pieces: rods.count, drawCalls: 1, extraShadowPasses: 0,
      authenticContactTick: impactTick >= 0 ? impactTick : null,
      sourceContactCompression: Number(compression.toFixed(4)),
      signedSourceDisplacement: trueHorizontalDisplacement,
      sourceTravelLean: Number(travelLean.toFixed(4)),
      observedOnly: true, collisionAndAIChanges: false,
    } : { visible: false, pieces: 0, drawCalls: 0, observedOnly: true };
  }
  function dispose() {
    if (disposed) return;
    clear(); disposed = true; geometry.dispose(); material.dispose(); group.clear();
  }
  return { group, update, clear, diagnostics, dispose };
}
