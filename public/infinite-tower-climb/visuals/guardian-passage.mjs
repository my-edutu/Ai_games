// A source-witnessed piece of the guardian encounter, not an invented exit.
// The fixed-step tower can advance its floor on the SAME tick as the final hit:
// this short, floor-local 3D passage lets viewers SEE that authentic outcome.
// No collisions, authority state, prediction, UI prompts or copied assets.
export function observedGuardianPassage(previous, next) {
  if (!previous || !next || previous.runToken !== next.runToken ||
    previous.lifecycle !== 'running' || next.lifecycle !== 'running' ||
    !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(next.tick) ||
    next.tick <= previous.tick || next.floor !== previous.floor + 1) return false;
  return Array.isArray(previous.enemies) &&
    previous.enemies.some(enemy => enemy.kind === 'guardian' && enemy.active === true);
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
  const openingGeometry = new THREE.TorusGeometry(2.15, .07, 6, 36, Math.PI * 1.75);
  const groundGeometry = new THREE.TorusGeometry(2.8, .045, 4, 36);
  const ownedGeometry = [box, crownGeometry, openingGeometry, groundGeometry];
  const ownedMaterials = [stone, bronze, glow];
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

  let runToken = null, floor = null, sourceTick = -1;
  let age = 0, disposed = false;
  const duration = 2.9;
  const clamp = v => Math.max(0, Math.min(1, v));
  function clear() {
    group.visible = false;
    runToken = null;
    floor = null;
    sourceTick = -1;
    age = 0;
  }
  function begin(source, anchor) {
    if (disposed || !source || !anchor || source.lifecycle !== 'running' ||
      !Number.isSafeInteger(source.tick) || !Number.isSafeInteger(source.floor) ||
      typeof source.runToken !== 'string' || !source.runToken ||
      ![anchor.x, anchor.y, anchor.z, anchor.angle].every(Number.isFinite)) return false;
    group.position.set(anchor.x, anchor.y, anchor.z);
    group.rotation.y = anchor.angle;
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    age = 0;
    return true;
  }
  function update(dt = 0, options = {}) {
    if (disposed || !group.visible) return;
    if (!options.stale) age += Math.min(.5, Math.max(0, Number.isFinite(dt) ? dt : 0));
    if (age >= duration) { clear(); return; }
    const still = options.reducedMotion === true;
    const opened = still ? 1 : 1 - Math.pow(1 - clamp(age / .95), 3);
    const fade = 1 - .9 * clamp((age - 1.75) / (duration - 1.75));
    for (const { side, wing } of wings) {
      // The actual bronze gate is no longer in this floor's world; these
      // separated leaves are a short, non-colliding passage memory.
      wing.position.x = side * (1.46 + opened * 2.05);
      wing.position.z = -.08 * opened;
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
    return group.visible ? clamp(1 - age / 1.35) : 0;
  }
  function diagnostics() {
    return { sourceBound: true, active: group.visible, runToken,
      floor, sourceTick, ageSeconds: age, durationSeconds: duration,
      meshes: 12, geometries: ownedGeometry.length, shadows: 0, disposed };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    group.clear();
    for (const geometry of ownedGeometry) geometry.dispose();
    for (const material of ownedMaterials) material.dispose();
  }
  return { group, begin, update, clear, cameraWeight, diagnostics, dispose };
}
