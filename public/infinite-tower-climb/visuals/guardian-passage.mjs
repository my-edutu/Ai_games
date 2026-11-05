// A source-witnessed piece of the guardian encounter, not an invented exit.
// The fixed-step tower can advance its floor on the SAME tick as the final hit:
// this short, floor-local 3D passage lets viewers SEE that authentic outcome.
// No collisions, authority state, prediction, UI prompts or copied assets.
export function observedGuardianPassage(previous, next) {
  if (!previous || !next || previous.runToken !== next.runToken ||
    previous.lifecycle !== 'running' || next.lifecycle !== 'running' ||
    !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(next.tick) ||
    next.tick <= previous.tick || next.floor !== previous.floor + 1) return false;
  // Immediate old-style transitions observe a living guardian in the
  // preceding snapshot. The new physical exit requires a few real traversal
  // ticks AFTER the source defeated that guardian, so the prior snapshot
  // instead contains its inactive, zero-HP body. Both are genuine floor
  // advancements; an absent/unknown foe never fabricates this victory.
  return Array.isArray(previous.enemies) &&
    previous.enemies.some(enemy => enemy.kind === 'guardian' &&
      (enemy.active === true ||
        (enemy.active === false && Number.isFinite(enemy.health) && enemy.health <= 0)));
}

// The defeated guardian and the current source cap authorize the unlocked
// doorway BEFORE floor advance. An inactive zero-HP enemy is not evidence
// of a completed run, only of an earned physical exit still to traverse.
export function observedUnlockedGuardianCap(snapshot) {
  if (!snapshot || snapshot.lifecycle !== 'running' ||
    !Number.isSafeInteger(snapshot.tick) ||
    !Number.isSafeInteger(snapshot.floor) ||
    !Number.isFinite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
    !Number.isFinite(snapshot.chunkBaseY) ||
    typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
    !snapshot.player || !Number.isFinite(snapshot.player.health) ||
    snapshot.player.health <= 0) return null;
  const cap = snapshot.platforms?.find(platform =>
    platform.id === 'f' + snapshot.floor + ':cap' &&
    [platform.x, platform.y, platform.width, platform.height]
      .every(Number.isFinite) && platform.width > 0 && platform.height > 0);
  const guardian = snapshot.enemies?.find(enemy =>
    enemy.kind === 'guardian' && enemy.active === false &&
    typeof enemy.id === 'string' && !!enemy.id &&
    [enemy.x, enemy.y, enemy.halfHeight, enemy.health].every(Number.isFinite) &&
    enemy.health <= 0 && enemy.halfHeight > 0);
  return cap && guardian ? {
    runToken: snapshot.runToken, floor: snapshot.floor,
    tick: snapshot.tick, guardianId: guardian.id, cap, guardian,
  } : null;
}

export function createTowerGuardianPassage(THREE) {
  const group = new THREE.Group();
  group.name = 'ObservedGuardianPassage';
  group.visible = false;
  const stone = new THREE.MeshStandardMaterial({
    color: 0x435257, metalness: .48, roughness: .68, transparent: true,
    opacity: .83, depthTest: true, depthWrite: false,
  });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0xc38c57, metalness: .74, roughness: .31, transparent: true,
    opacity: .88, depthTest: true, depthWrite: false,
  });
  const glow = new THREE.MeshBasicMaterial({
    color: 0x9ff6d1, transparent: true, opacity: .63, depthWrite: false,
    depthTest: true, side: THREE.DoubleSide, toneMapped: false,
  });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const crownGeometry = new THREE.OctahedronGeometry(.48, 0);
  // On a witnessed decisive guardian hit, a tiny instanced lock fractures.
  // Decorative fragments never create a collider or change the fixed-step run.
  const shardGeometry = new THREE.TetrahedronGeometry(.27, 0);
  const openingGeometry = new THREE.TorusGeometry(2.15, .07, 6, 36, Math.PI * 1.75);
  const groundGeometry = new THREE.TorusGeometry(2.8, .045, 4, 36);
  // The real guardian disappears from the new floor on the decisive tick.
  // A short non-colliding armor silhouette recalls only its LAST old-floor
  // position; never recreate an active enemy or an invented victory.
  const fallenGeometry = new THREE.BoxGeometry(.68, .64, .37);
  const fallenMaterial = new THREE.MeshStandardMaterial({
    color: 0xb58d6b, metalness: .66, roughness: .48,
    transparent: true, opacity: .88, depthTest: true, depthWrite: false,
  });
  const ownedGeometry = [box, crownGeometry, openingGeometry, groundGeometry, shardGeometry, fallenGeometry];
  const ownedMaterials = [stone, bronze, glow, fallenMaterial];
  const add = (name, geometry, material, position, scale, parent = group) => {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.set(...position);
    object.scale.set(...scale);
    object.castShadow = false;
    object.receiveShadow = false;
    parent.add(object);
    return object;
  };
  for (const side of [-1, 1]) {
    add('ClearedPassagePier', box, stone, [side * 3.22, 2.35, 0], [.46, 4.7, .55]);
    add('ClearedPassageCrownSeat', box, bronze, [side * 3.22, 4.73, .03], [.7, .22, .67]);
  }
  add('ClearedPassageLintel', box, stone, [0, 4.72, 0], [6.8, .46, .55]);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.name = side < 0 ? 'ClearedPassageLeftLeaf' : 'ClearedPassageRightLeaf';
    group.add(wing);
    add('ClearedPassageBronzeLeaf', box, bronze, [0, 2.12, .15], [2.87, 4.13, .22], wing);
    add('ClearedPassageRib', box, stone, [side * 1.19, 2.1, .32], [.11, 3.66, .07], wing);
    wings.push({ side, wing });
  }
  const emblem = add('ClearedPassageObservedLock', crownGeometry, glow,
    [0, 4.75, .48], [1, .72, .65]);
  const arc = add('ClearedPassageAscendingLight', openingGeometry, glow,
    [0, 2.25, -.12], [1, 1.18, 1]);
  const ring = add('ClearedPassageGroundWake', groundGeometry, glow,
    [0, .16, .15], [1, 1, 1]);
  ring.rotation.x = Math.PI / 2;
  const fragments = new THREE.InstancedMesh(shardGeometry, bronze, 8);
  fragments.name = 'WitnessedLockSplinters';
  fragments.castShadow = false;
  fragments.receiveShadow = false;
  fragments.frustumCulled = false;
  fragments.visible = false;
  fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(fragments);
  const fallenArmor = new THREE.InstancedMesh(fallenGeometry, fallenMaterial, 12);
  fallenArmor.name = 'WitnessedGuardianDefeatArmor';
  fallenArmor.count = 0;
  fallenArmor.visible = false;
  fallenArmor.castShadow = false;
  fallenArmor.receiveShadow = false;
  fallenArmor.frustumCulled = false;
  fallenArmor.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(fallenArmor);
  const fallenPose = new THREE.Object3D();
  const guardianWorld = new THREE.Vector3();
  let witnessedGuardian = false;
  function poseFallenArmor(seconds, still) {
    if (!witnessedGuardian) return;
    const t = still ? 1 : Math.min(1, Math.max(0, seconds / 1.25));
    const drop = 1 - Math.pow(1 - t, 3);
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1, tier = Math.floor(i / 2);
      fallenPose.position.set(side * (.46 + drop * (.18 + tier * .13)),
        Math.max(.26, .44 + tier * .45 - drop * (.24 + tier * .28)),
        .08 + drop * (.14 + tier * .075));
      fallenPose.rotation.set(side * drop * .22,
        -side * drop * .42, side * drop * (.24 + tier * .09));
      fallenPose.scale.set(1 + tier * .045, 1 - drop * .20, 1);
      fallenPose.updateMatrix();
      fallenArmor.setMatrixAt(i, fallenPose.matrix);
    }
    fallenArmor.instanceMatrix.needsUpdate = true;
  }
  const shardTransform = new THREE.Object3D();
  const focusPosition = new THREE.Vector3();
  const clampUnit = v => Math.max(0, Math.min(1, v));
  function poseFragments(seconds, still) {
    fragments.visible = !still && seconds < 1.7;
    if (!fragments.visible) return;
    const lift = clampUnit(seconds / 1.15), fade = clampUnit((1.7 - seconds) / .65);
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, tier = Math.floor(i / 2);
      shardTransform.position.set(side * (.22 + tier * .12 + lift * (.9 + tier * .25)),
        4.65 + .1 * (tier % 2) + lift * (.45 + tier * .16) - lift * lift * .65,
        .48 + Math.sin(tier * 2.1) * .12 + lift * .2);
      shardTransform.rotation.set(lift * (.55 + tier * .2),
        lift * side * (1.3 + tier * .3), lift * side * 1.9);
      shardTransform.scale.setScalar(Math.max(.001, .7 * fade * (.8 + tier * .1)));
      shardTransform.updateMatrix();
      fragments.setMatrixAt(i, shardTransform.matrix);
    }
    fragments.instanceMatrix.needsUpdate = true;
  }

  let runToken = null, floor = null, sourceTick = -1;
  let age = 0, disposed = false, stage = 'none';
  const duration = 2.9;
  const clamp = v => Math.max(0, Math.min(1, v));
  function clear() {
    group.visible = false;
    fragments.visible = false;
    fallenArmor.visible = false; fallenArmor.count = 0;
    witnessedGuardian = false; guardianWorld.set(0, 0, 0);
    runToken = null;
    floor = null;
    sourceTick = -1;
    age = 0;
    stage = 'none';
  }
  function unlock(source, anchor) {
    const earned = observedUnlockedGuardianCap(source);
    if (!earned || disposed || !anchor ||
      ![anchor.x, anchor.y, anchor.z, anchor.angle].every(Number.isFinite))
      return false;
    if (stage === 'earned-open' && group.visible &&
      runToken === source.runToken && floor === source.floor) {
      // Repeated frames must not replay the mechanical release or recreate
      // a victory. A stale/out-of-order sample does not rewind source time.
      sourceTick = Math.max(sourceTick, source.tick);
      return true;
    }
    group.position.set(anchor.x, anchor.y, anchor.z);
    focusPosition.set(anchor.x, anchor.y + 2.6, anchor.z);
    group.rotation.y = anchor.angle;
    // The genuine defeated character still exists in this floor's scene.
    // Reserve decorative fallen-armor memory for the next floor only.
    witnessedGuardian = false;
    fallenArmor.visible = false;
    fallenArmor.count = 0;
    fragments.visible = false;
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'earned-open';
    age = 0;
    return true;
  }
  function begin(previous, source, anchor, guardianAnchor = null) {
    if (!observedGuardianPassage(previous, source)) return false;
    if (disposed || !source || !anchor || source.lifecycle !== 'running' ||
      !Number.isSafeInteger(source.tick) || !Number.isSafeInteger(source.floor) ||
      typeof source.runToken !== 'string' || !source.runToken ||
      ![anchor.x, anchor.y, anchor.z, anchor.angle].every(Number.isFinite)) return false;
    const carryOpen = stage === 'earned-open' && group.visible &&
      runToken === previous.runToken && floor === previous.floor;
    const carriedAge = age;
    group.position.set(anchor.x, anchor.y, anchor.z);
    focusPosition.set(anchor.x, anchor.y + 2.6, anchor.z);
    group.rotation.y = anchor.angle;
    witnessedGuardian = !!guardianAnchor &&
      [guardianAnchor.x, guardianAnchor.y, guardianAnchor.z].every(Number.isFinite);
    fallenArmor.visible = witnessedGuardian;
    fallenArmor.count = witnessedGuardian ? 12 : 0;
    if (witnessedGuardian) {
      guardianWorld.set(guardianAnchor.x, guardianAnchor.y, guardianAnchor.z);
      const dx = guardianAnchor.x - anchor.x, dz = guardianAnchor.z - anchor.z;
      const cs = Math.cos(anchor.angle), sn = Math.sin(anchor.angle);
      fallenArmor.position.set(cs * dx - sn * dz,
        guardianAnchor.y - anchor.y, sn * dx + cs * dz);
      poseFallenArmor(0, false);
    }
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'handoff';
    // The real door already opened during the hero's grounded walk. Do
    // not visibly slam it shut and re-open upon the authoritative floor
    // switch. Historical immediate clearances still use the old cue.
    age = carryOpen ? Math.max(1.05, Math.min(1.65, carriedAge)) : 0;
    return true;
  }
  function update(dt = 0, options = {}) {
    if (disposed || !group.visible) return;
    if (!options.stale) age += Math.min(.5, Math.max(0, Number.isFinite(dt) ? dt : 0));
    if (stage === 'handoff' && age >= duration) { clear(); return; }
    const still = options.reducedMotion === true;
    poseFragments(age, still);
    poseFallenArmor(age, still);
    const opened = still ? 1 : 1 - Math.pow(1 - clamp(age / .95), 3);
    const fade = stage === 'earned-open' ? 1 :
      1 - .9 * clamp((age - 1.75) / (duration - 1.75));
    for (const { side, wing } of wings) {
      // The actual bronze gate is no longer in this floor's world; these
      // separated leaves are a short, non-colliding passage memory.
      wing.position.x = side * (1.46 + opened * 2.05);
      wing.position.z = -.08 * opened;
      // The two original bronze leaves turn outward as the real cleared
      // lock withdraws. Reduced motion displays the fully open still shape;
      // the authoritative platform/collision geometry never changes.
      wing.rotation.y = -side * opened * .27;
      wing.rotation.z = side * opened * .025;
    }
    emblem.rotation.z = still ? 0 : opened * Math.PI * .55;
    emblem.position.y = 4.75 + (still ? 0 : opened * .26);
    arc.scale.setScalar(still ? 1 : .85 + opened * .15);
    arc.rotation.z = still ? 0 : (1 - opened) * -.55;
    ring.scale.setScalar(still ? 1 : .65 + opened * .55);
    stone.opacity = .82 * fade;
    bronze.opacity = .9 * fade;
    glow.opacity = .65 * fade;
  }
  function cameraWeight() {
    return !group.visible ? 0 : stage === 'earned-open'
      ? .55 * clamp(1 - age / 2.4) : clamp(1 - age / 1.35);
  }
  function focusPoint() {
    return group.visible ? focusPosition : null;
  }
  function diagnostics() {
    return { sourceBound: true, active: group.visible, stage, runToken,
      floor, sourceTick, ageSeconds: age, durationSeconds: duration,
      // Public world-space source-pinned anchor for inspecting actual full
      // motion; no fabricated win, private event or gameplay mutation.
      anchorPosition: group.visible ? group.position.toArray() : null,
      focusPosition: group.visible ? focusPosition.toArray() : null,
      meshes: 14, fragmentInstances: 8, fragmentsVisible: fragments.visible,
      guardianDefeatPieces: fallenArmor.count,
      guardianDefeatSourcePosition: group.visible && witnessedGuardian ? guardianWorld.toArray() : null,
      guardianDefeatPresentationOnly: true,
      geometries: ownedGeometry.length, shadows: 0, disposed };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    group.clear();
    for (const geometry of ownedGeometry) geometry.dispose();
    for (const material of ownedMaterials) material.dispose();
  }
  return { group, unlock, begin, update, clear, cameraWeight, focusPoint, diagnostics, dispose };
}
