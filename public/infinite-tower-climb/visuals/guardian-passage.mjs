import { pointFor } from './coordinates.mjs';

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

// Source-measured distance to the real earned cap exit, not a cosmetic clock.
// A fast physical approach must never run through visually closed bronze
// leaves while the authoritative, already-unlocked exit is traversable.
// The familiar cap-width ratios are presentation-only. No future path,
// hidden combat state, collision or additional draw call is consulted.
export function observedPassageApproach(source, earned) {
  if (!source || !earned || source.runToken !== earned.runToken ||
    source.floor !== earned.floor || !Number.isFinite(source.player?.x) ||
    !Number.isFinite(earned.cap?.x) ||
    !Number.isFinite(earned.cap?.width) || earned.cap.width <= 0) return 0;
  const cap = earned.cap;
  const exitX = cap.x + Math.floor(cap.width * .76);
  const gap = Math.abs(source.player.x - exitX);
  return Math.max(0, Math.min(1,
    (cap.width * .36 - gap) / (cap.width * .24)));
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
  // Original rigid-plate silhouette with a helmet, crest, chest, waist,
  // shoulders, gauntlets, thighs and boots. These remain solely cosmetic:
  // their 12 metal plates share one bounded instanced mesh and source anchor.
  const armorSilhouette = [
    [0,3.64,.13,1.12,.78,.86,-.14,.20,-.83], // helmet
    [0,4.12,.06,.50,.47,.58,.20,.54,.77], // crest
    [0,2.81,.02,1.82,1.38,.86,-.16,.24,-.39], // chest
    [0,1.96,.10,1.22,.75,.80,.24,.32,.33], // waist
    [-1.25,3.07,.05,.95,.90,.76,-.82,.39,-.78], // shoulder L
    [1.25,3.07,.05,.95,.90,.76,.88,.36,.84], // shoulder R
    [-1.43,2.04,.19,.64,1.24,.62,-1.12,.55,-.95], // arm L
    [1.43,2.04,.19,.64,1.24,.62,1.02,.57,1.01], // arm R
    [-.49,1.20,.08,.70,1.14,.70,-.55,.64,-.56], // thigh L
    [.49,1.20,.08,.70,1.14,.70,.62,.65,.58], // thigh R
    [-.50,.37,.28,.65,.70,.85,-.67,.75,-1.11], // boot L
    [.50,.37,.28,.65,.70,.85,.67,.70,1.12], // boot R
  ];
  // The source-defeated machine's visible power connection retracts into
  // the earned real bronze gateway. Eight luminous segments reuse the owned
  // box/glow resources: one instanced draw, zero new geometry or lights.
  const powerBreak = new THREE.InstancedMesh(box, glow, 8);
  powerBreak.name = 'WitnessedGuardianPowerBreak';
  powerBreak.frustumCulled = false;
  powerBreak.castShadow = false;
  powerBreak.receiveShadow = false;
  powerBreak.visible = false;
  powerBreak.count = 0;
  powerBreak.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(powerBreak);
  const powerPose = new THREE.Object3D();
  const powerStart = new THREE.Vector3();
  const powerEnd = new THREE.Vector3(0,4.45,.48);
  const powerDirection = new THREE.Vector3();
  const powerAxis = new THREE.Vector3(0,1,0);
  const powerOrientation = new THREE.Quaternion();
  let powerLength = 0;
  let witnessedGuardian = false;
  const unit = value => Math.max(0,Math.min(1,value));
  function poseFallenArmor(seconds, still) {
    if (!witnessedGuardian) return;
    const t = still ? 1 : unit(seconds / 1.35);
    for (let i = 0; i < armorSilhouette.length; i++) {
      const [x,y,z,sx,sy,sz,driftX,driftZ,spin] = armorSilhouette[i];
      const fall = unit((t-(i===1?.06:i>=10?.10:0))/.90);
      const settle = 1-Math.pow(1-fall,3);
      fallenPose.position.set(x+driftX*settle,
        y*(1-settle)+(.2+i%4*.12)*settle,z+driftZ*settle);
      fallenPose.rotation.set(settle*(i%2?-.29:.31),
        settle*spin*.47,settle*spin);
      fallenPose.scale.set(sx,sy*(1-settle*.13),sz);
      fallenPose.updateMatrix();
      fallenArmor.setMatrixAt(i,fallenPose.matrix);
    }
    fallenArmor.instanceMatrix.needsUpdate = true;
  }
  function posePowerBreak(seconds, still) {
    powerBreak.visible = witnessedGuardian && !still &&
      Number.isFinite(powerLength) && powerLength>.4 && seconds<1.4;
    powerBreak.count = powerBreak.visible ? 8 : 0;
    if (!powerBreak.visible) return;
    const retreat = unit(seconds/1.3);
    for(let i=0;i<8;i++){
      const u=(i+.5)/8, intact=unit((u-retreat)*12);
      powerPose.position.copy(powerStart).addScaledVector(powerDirection,u);
      powerPose.quaternion.copy(powerOrientation);
      powerPose.scale.set(.115*intact,
        Math.max(.001,powerLength*.084*intact),.115*intact);
      powerPose.updateMatrix();
      powerBreak.setMatrixAt(i,powerPose.matrix);
    }
    powerBreak.instanceMatrix.needsUpdate = true;
  }
  const shardTransform = new THREE.Object3D();
  const focusPosition = new THREE.Vector3();
  const defeatFocus = new THREE.Vector3();
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
  let age = 0, defeatAge = 0, disposed = false, stage = 'none', approachOpen = 0;
  const duration = 2.9;
  const clamp = v => Math.max(0, Math.min(1, v));
  function clear() {
    group.visible = false;
    fragments.visible = false;
    fallenArmor.visible = false; fallenArmor.count = 0;
    powerBreak.visible = false; powerBreak.count = 0;
    powerLength = 0; powerStart.set(0,0,0);
    witnessedGuardian = false; guardianWorld.set(0, 0, 0);
    runToken = null;
    floor = null;
    sourceTick = -1;
    age = 0;
    defeatAge = 0;
    approachOpen = 0;
    stage = 'none';
  }
  // Make the defeated guardian physically crumble WHILE the player walks
  // toward its actually unlocked source gate, not just after changing floors.
  // Only the inactive zero-HP source body or an observed floor-transition
  // guardian anchor may place these non-colliding original metal fragments.
  function placeDefeatedArmor(anchor, guardianAnchor) {
    witnessedGuardian = !!guardianAnchor &&
      [guardianAnchor.x, guardianAnchor.y, guardianAnchor.z].every(Number.isFinite);
    fallenArmor.visible = witnessedGuardian;
    fallenArmor.count = witnessedGuardian ? 12 : 0;
    if (!witnessedGuardian) {
      guardianWorld.set(0,0,0);
      powerBreak.visible = false; powerBreak.count = 0; powerLength = 0;
      return;
    }
    guardianWorld.set(guardianAnchor.x, guardianAnchor.y, guardianAnchor.z);
    const dx = guardianAnchor.x - anchor.x, dz = guardianAnchor.z - anchor.z;
    const cs = Math.cos(anchor.angle), sn = Math.sin(anchor.angle);
    fallenArmor.position.set(cs * dx - sn * dz,
      guardianAnchor.y - anchor.y, sn * dx + cs * dz);
    powerStart.copy(fallenArmor.position);
    powerStart.y += 2.85;
    powerDirection.copy(powerEnd).sub(powerStart);
    powerLength = powerDirection.length();
    if(powerLength>.4) powerOrientation.setFromUnitVectors(powerAxis,
      powerDirection.clone().normalize());
    poseFallenArmor(0,false);
    posePowerBreak(0,false);
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
      if (source.tick >= sourceTick) {
        approachOpen = Math.max(approachOpen, observedPassageApproach(source, earned));
        sourceTick = source.tick;
      }
      return true;
    }
    group.position.set(anchor.x, anchor.y, anchor.z);
    focusPosition.set(anchor.x, anchor.y + 2.6, anchor.z);
    group.rotation.y = anchor.angle;
    // The real zero-HP body remains observable during physical gate
    // traversal. Honor that source position now, at the decisive combat beat;
    // do not defer its visible consequence until an unrelated new floor.
    const body = earned.guardian;
    placeDefeatedArmor(anchor, pointFor(body.x,
      body.y - body.halfHeight + 9000, source.chunkBaseY,
      source.worldWidth, 27.65));
    fragments.visible = false;
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'earned-open';
    approachOpen = observedPassageApproach(source, earned);
    age = 0;
    defeatAge = 0;
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
    const carriedDefeatAge = defeatAge;
    group.position.set(anchor.x, anchor.y, anchor.z);
    focusPosition.set(anchor.x, anchor.y + 2.6, anchor.z);
    group.rotation.y = anchor.angle;
    placeDefeatedArmor(anchor, guardianAnchor);
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'handoff';
    approachOpen = carryOpen ? 1 : 0;
    // The real door already opened during the hero's grounded walk. Do
    // not visibly slam it shut and re-open upon the authoritative floor
    // switch. Historical immediate clearances still use the old cue.
    age = carryOpen ? Math.max(1.05, Math.min(1.65, carriedAge)) : 0;
    // The real guardian's armor keeps falling continuously across the
    // old/new-floor boundary; replay/slow passage staging cannot rewind it.
    defeatAge = carryOpen ? carriedDefeatAge : 0;
    return true;
  }
  function update(dt = 0, options = {}) {
    if (disposed || !group.visible) return;
    if (!options.stale) {
      const advance = Math.min(.5, Math.max(0, Number.isFinite(dt) ? dt : 0));
      age += advance;
      defeatAge += advance;
    }
    if (stage === 'handoff' && age >= duration) { clear(); return; }
    const still = options.reducedMotion === true;
    poseFragments(age, still);
    poseFallenArmor(defeatAge, still);
    posePowerBreak(defeatAge, still);
    const opened = still ? 1 : Math.max(approachOpen,
      1 - Math.pow(1 - clamp(age / .95), 3));
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
      ? Math.max(.55 * clamp(1 - age / 2.4), .32 * approachOpen)
      : clamp(1 - age / 1.35);
  }
  // The first authentic post-defeat camera beat acknowledges the actual
  // fallen enemy BEFORE turning fully toward the unlocked summit door. The
  // old exterior camera still protects the actor's safe frame; this bounded
  // shared target never commands a cut, zoom, future path or simulation tick.
  function defeatFocusWeight() {
    return group.visible && stage === 'earned-open' && witnessedGuardian
      ? .52 * clamp(1 - defeatAge / 1.45) * (1 - approachOpen) : 0;
  }
  function focusPoint() {
    if (!group.visible) return null;
    const weight = defeatFocusWeight();
    if (!weight) return focusPosition;
    return defeatFocus.copy(focusPosition).lerp(guardianWorld, weight);
  }
  function diagnostics() {
    return { sourceBound: true, active: group.visible, stage, runToken,
      floor, sourceTick, ageSeconds: age, defeatAgeSeconds: defeatAge,
      durationSeconds: duration,
      sourceMeasuredApproachOpen: approachOpen,
      sourceMeasuredDefeatFocusWeight: Number(defeatFocusWeight().toFixed(4)),
      // Public world-space source-pinned anchor for inspecting actual full
      // motion; no fabricated win, private event or gameplay mutation.
      anchorPosition: group.visible ? group.position.toArray() : null,
      focusPosition: group.visible ? focusPosition.toArray() : null,
      meshes: 15, fragmentInstances: 8, fragmentsVisible: fragments.visible,
      guardianDefeatPieces: fallenArmor.count,
      guardianPowerSegments: powerBreak.count,
      guardianPowerBreakVisible: powerBreak.visible,
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
