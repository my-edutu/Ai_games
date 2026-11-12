import { pointFor, SCALE, GUARDIAN_CAP_CORRIDOR } from './coordinates.mjs';

// The original bronze guardian lock is an OUTSIDE mechanism at radius 27.78,
// while the skinned grounded climber walks at radius 25 on the actual cap deck
// (22.4..27.18). A doorway only at the former is never physically crossed.
// Keep the original exterior lock, but connect it to a second, properly
// grounded interior threshold. Both remain presentation-only.
export const GUARDIAN_PASSAGE_RADII = Object.freeze({
  lock: 27.78, deck: GUARDIAN_CAP_CORRIDOR.climberPathRadius,
  deckMin: GUARDIAN_CAP_CORRIDOR.deckMin, deckMax: GUARDIAN_CAP_CORRIDOR.deckMax,
});
export function observedWalkablePassageFocus(anchor) {
  if (!anchor || ![anchor.x, anchor.y, anchor.z, anchor.angle]
    .every(Number.isFinite) ||
    Math.abs(Math.hypot(anchor.x, anchor.z) - GUARDIAN_PASSAGE_RADII.lock) > .025)
    return null;
  const inset = GUARDIAN_PASSAGE_RADII.lock - GUARDIAN_PASSAGE_RADII.deck;
  return { x: anchor.x - inset * Math.sin(anchor.angle),
    y: anchor.y - 2 + 2.6,
    z: anchor.z - inset * Math.cos(anchor.angle) };
}

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
      (!Number.isSafeInteger(enemy.floor) || enemy.floor === previous.floor) &&
      (enemy.active === true ||
        (enemy.active === false && Number.isFinite(enemy.health) && enemy.health <= 0)));
}

// An authentic Floor8 cap crossing must keep its same *walkable* visual arch
// after the renderer loads Floor9. The historic exterior memorial is 2.78m
// farther out than the skinned boots and is NOT a substitute for the threshold.
// Both bodies must stay on their authoritative, fully supporting platforms,
// with precisely preserved source coordinates and earned whole-body clearance.
// This only chooses non-colliding 3D geometry; it never changes a floor,
// moves a climber, guesses an unobserved crossing or claims a video PASS.
export function observedGroundedGuardianHandoff(previous, next) {
  if (!observedGuardianPassage(previous, next) ||
      !Array.isArray(previous.platforms) || !Array.isArray(next.platforms) ||
      !Array.isArray(previous.enemies) ||
      !previous.player || !next.player ||
      ![previous.player.x, previous.player.y, previous.player.halfWidth,
        previous.player.halfHeight, next.player.x, next.player.y,
        next.player.halfWidth, next.player.halfHeight].every(Number.isSafeInteger))
    return false;
  const cap = previous.platforms.find(p => p?.id === 'f' + previous.floor + ':cap');
  const ground = next.platforms.find(p => p?.id === 'f' + next.floor + ':ground');
  if (!cap || !ground || ![cap.x, cap.y, cap.width, cap.height,
      ground.x, ground.y, ground.width, ground.height].every(Number.isSafeInteger) ||
      cap.width <= 0 || cap.height <= 0 ||
      ground.width <= 0 || ground.height <= 0 ||
      previous.player.halfWidth <= 0 || previous.player.halfHeight <= 0 ||
      previous.player.health <= 0 || next.player.health <= 0 ||
      previous.player.grounded !== true || next.player.grounded !== true ||
      previous.player.groundedPlatformId !== cap.id ||
      next.player.groundedPlatformId !== ground.id ||
      previous.guardianExitX !== cap.x + Math.floor(cap.width * .76) ||
      !Number.isSafeInteger(previous.guardianExitX) ||
      !previous.enemies.some(e => e?.kind === 'guardian' &&
        (!Number.isSafeInteger(e.floor) || e.floor === previous.floor) &&
        e.active === false && Number.isFinite(e.health) && e.health <= 0) ||
      previous.player.x !== next.player.x ||
      previous.player.y !== next.player.y ||
      previous.player.halfWidth !== next.player.halfWidth ||
      previous.player.halfHeight !== next.player.halfHeight)
    return false;
  const p = previous.player, after = next.player;
  return p.x >= previous.guardianExitX + p.halfWidth + 4000 &&
    p.x - p.halfWidth >= cap.x &&
    p.x + p.halfWidth <= cap.x + cap.width &&
    p.y - p.halfHeight === cap.y + cap.height &&
    after.x - after.halfWidth >= ground.x &&
    after.x + after.halfWidth <= ground.x + ground.width &&
    after.y - after.halfHeight === ground.y + ground.height;
}

// The real Floor8 cap must lead into the equally grounded Floor9 runway,
// rather than disappearing into a wholly unrelated biome at the precise
// authored source threshold. This authorizes ONLY a short, non-colliding
// continuation of the existing 12 bronze inlays, laid on the actual Floor9
// ground. It is not predicted traversal, a bridge collider or a floor unlock.
export function observedFloorNineRunway(previous, next) {
  if (previous?.floor !== 8 || next?.floor !== 9 ||
      !observedGroundedGuardianHandoff(previous, next) ||
      !Number.isSafeInteger(next.chunkBaseY) ||
      !Number.isSafeInteger(next.worldWidth) || next.worldWidth <= 0)
    return null;
  const deck = next.platforms.find(p => p.id === 'f9:ground');
  const fromX = previous.guardianExitX;
  const toX = Math.min(deck.x + deck.width - next.player.halfWidth,
    Math.max(fromX + 35000, next.player.x + 65000));
  if (!Number.isSafeInteger(fromX) || !Number.isSafeInteger(toX) ||
      toX - fromX < 15000 || toX > next.worldWidth) return null;
  return { fromX, toX, top: deck.y + deck.height,
    floor: next.floor, runToken: next.runToken, sourceTick: next.tick };
}

// The defeated guardian and the current source cap authorize the unlocked
// doorway BEFORE floor advance. An inactive zero-HP enemy is not evidence
// of a completed run, only of an earned physical exit still to traverse.
// Only the opt-in PUBLIC source guardian can energize the actual cap lock.
 // Historical floors never publish guardianExitX. A missing enemy, stale
 // floor, dead body or renderer clock cannot create a blocking barrier.
export function observedLockedGuardianCap(snapshot) {
  if (!snapshot || snapshot.lifecycle !== 'running' ||
      !Number.isSafeInteger(snapshot.tick) ||
      !Number.isSafeInteger(snapshot.floor) ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !Number.isFinite(snapshot.chunkBaseY) ||
      !Number.isFinite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
      !snapshot.player || !Number.isFinite(snapshot.player.health) ||
      snapshot.player.health <= 0) return null;
  const cap = snapshot.platforms?.find(platform =>
    platform.id === 'f' + snapshot.floor + ':cap' &&
    [platform.x,platform.y,platform.width,platform.height].every(Number.isFinite) &&
    platform.width > 0 && platform.height > 0);
  if (!cap || snapshot.guardianExitX !==
      cap.x + Math.floor(cap.width * .76)) return null;
  const guardian = snapshot.enemies?.find(enemy =>
    enemy.kind === 'guardian' && enemy.active === true &&
    (!Number.isSafeInteger(enemy.floor) || enemy.floor === snapshot.floor) &&
    typeof enemy.id === 'string' && !!enemy.id &&
    Number.isFinite(enemy.health) && enemy.health > 0);
  return guardian ? {runToken:snapshot.runToken, floor:snapshot.floor,
    tick:snapshot.tick, cap, guardian} : null;
}

// An explicit live source telegraph, never the renderer clock or inferred
// damage, is the only reason for the tall guardian field to surge. The passive
// lock stays visibly closed via its real lower bronze lattice and edge pylons.
export function observedGuardianSealExcitation(guardian) {
  return guardian?.kind === 'guardian' && guardian.active === true &&
    Number.isFinite(guardian.health) && guardian.health > 0 &&
    guardian.telegraph === true &&
    Number.isFinite(guardian.telegraphTicksRemaining) &&
    guardian.telegraphTicksRemaining > 0;
}

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
  // A zero-HP body is not, by itself, evidence of a playable clearance.
  // Historic floors can publish defeated guardians WITHOUT a source exit.
  // The walkable arch, camera escort and fallen armor must require the same
  // exact authoritative cap opt-in as the living guardian lock.
  if (!cap || !Number.isSafeInteger(snapshot.guardianExitX) ||
      snapshot.guardianExitX !== cap.x + Math.floor(cap.width * .76)) return null;
  const guardian = snapshot.enemies?.find(enemy =>
    enemy.kind === 'guardian' && enemy.active === false &&
    (!Number.isSafeInteger(enemy.floor) || enemy.floor === snapshot.floor) &&
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
  const physicalExit = cap.x + Math.floor(cap.width * .76);
  // Never light a historic, mismatched or still-locked source cap as though
  // an earned walkable threshold existed. A mere cap-shaped deck is not proof.
  if (!Number.isSafeInteger(source.guardianExitX) ||
      source.guardianExitX !== physicalExit ||
      !observedUnlockedGuardianCap(source)) return 0;
  const exitX = source.guardianExitX;
  const gap = Math.abs(source.player.x - exitX);
  return Math.max(0, Math.min(1,
    (cap.width * .36 - gap) / (cap.width * .24)));
}

// A source-earned gateway should not become a full-screen bronze slab when
// the climber physically crosses it. Original machined depth-through windows
// keep the actor/next floor legible without hiding collision or making a HUD.
export function createMachinedGuardianLeafGeometry(THREE) {
  const shape = new THREE.Shape();
  shape.moveTo(-.5, -.5);
  shape.lineTo(.5, -.5);
  shape.lineTo(.5, .5);
  shape.lineTo(-.5, .5);
  shape.closePath();
  for (const [left, bottom, right, top] of [
    [-.385, -.365, -.075, .27],
    [.075, -.365, .385, .27],
    [-.135, .335, .135, .43],
  ]) {
    const slot = new THREE.Path();
    slot.moveTo(left, bottom);
    slot.lineTo(right, bottom);
    slot.lineTo(right, top);
    slot.lineTo(left, top);
    slot.closePath();
    shape.holes.push(slot);
  }
  const metal = new THREE.ExtrudeGeometry(shape, {
    depth: .72, steps: 1, bevelEnabled: false, curveSegments: 2,
  });
  metal.translate(0, 0, -.36);
  metal.name = 'OriginalMachinedGuardianOpenLeaf';
  return metal;
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
  const machinedLeaf = createMachinedGuardianLeafGeometry(THREE);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0xb98450, metalness: .78, roughness: .38,
    transparent: true, opacity: .86, depthTest: true,
    depthWrite: false, side: THREE.DoubleSide,
  });
  leafMaterial.name = 'GuardianSourceEarnedOpenLeaf';
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
  const ownedGeometry = [box, crownGeometry, openingGeometry, groundGeometry, shardGeometry, fallenGeometry, machinedLeaf];
  const ownedMaterials = [stone, bronze, glow, fallenMaterial, leafMaterial];
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
  // The former exterior release arch is a physical MEMORY of a completed
  // threshold. It previously rendered on TOP of the separate, live exterior
  // GuardianGate and the grounded source-locked inner threshold while the
  // guardian was alive, creating three overlapping full-size bronze gateways.
  // Original source-pinned 390x844 film c8464f2b at native seconds 14-17
  // and camera ray owners at source ticks 274-313 show this redundant arch's
  // ClearedPassageBronzeLeaf / crown / piers obscuring the real fight.
  // Keep all authored geometry/resources for a genuine next-floor handoff,
  // but only PRESENT the memory after a source-confirmed 8->9 transition.
  // While locked/earned-open, the existing source-controlled inner threshold
  // and original exterior gate carry the visuals. Nothing changes collision,
  // the source lock, guardian HP, authority, or actual gameplay progression.
  const memoryFrame = new THREE.Group();
  memoryFrame.name = 'EarnedGuardianPassageMemory';
  memoryFrame.visible = false;
  group.add(memoryFrame);
  for (const side of [-1, 1]) {
    add('ClearedPassagePier', box, stone, [side * 3.22, 2.35, 0], [.46, 4.7, .55], memoryFrame);
    add('ClearedPassageCrownSeat', box, bronze, [side * 3.22, 4.73, .03], [.7, .22, .67], memoryFrame);
  }
  add('ClearedPassageLintel', box, stone, [0, 4.72, 0], [6.8, .46, .55], memoryFrame);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.name = side < 0 ? 'ClearedPassageLeftLeaf' : 'ClearedPassageRightLeaf';
    memoryFrame.add(wing);
    add('ClearedPassageBronzeLeaf', machinedLeaf, leafMaterial, [0, 2.12, .15], [2.87, 4.13, .22], wing);
    add('ClearedPassageRib', box, stone, [side * 1.19, 2.1, .32], [.11, 3.66, .07], wing);
    wings.push({ side, wing });
  }
  // The exterior capstan is a visible LOCK, not the walkable doorway.
  // Build an original inset stone/bronze arch at the skinned climber's real
  // standing radius, with two tensile overhead braces linking both frames.
  // The raised exterior lock sits 2 world units above the cap. Lower the
  // inner arch onto the deck itself: there is no fake bridge/collision here.
  // Reuse the original box/materials: 2 unshadowed instanced draw submissions
  // and zero new geometry, textures, emissive lights or postprocessing.
  const threshold = new THREE.Group();
  threshold.name = 'ObservedWalkableGuardianThreshold';
  threshold.position.set(0, -2, GUARDIAN_PASSAGE_RADII.deck - GUARDIAN_PASSAGE_RADII.lock);
  const thresholdStones = new THREE.InstancedMesh(box, stone, 6);
  thresholdStones.name = 'WalkableSourceCapArchAndBraces';
  thresholdStones.castShadow = false;
  thresholdStones.receiveShadow = false;
  thresholdStones.frustumCulled = false;
  const thresholdPose = new THREE.Object3D();
  const braceAngle = Math.atan2(GUARDIAN_PASSAGE_RADII.lock - GUARDIAN_PASSAGE_RADII.deck, 2);
  const thresholdShapes = [
    [-3.22, 2.35, 0, .46, 4.7, .55, 0],
    [3.22, 2.35, 0, .46, 4.7, .55, 0],
    [0, 4.72, 0, 6.8, .46, .55, 0],
    [0, .075, .1, 6.0, .15, .42, 0],
    [-3.22, 5.72, 1.39, .28, 3.45, .3, braceAngle],
    [3.22, 5.72, 1.39, .28, 3.45, .3, braceAngle],
  ];
  thresholdShapes.forEach(([x,y,z,sx,sy,sz,rx], index) => {
    thresholdPose.position.set(x,y,z);
    thresholdPose.rotation.set(rx,0,0);
    thresholdPose.scale.set(sx,sy,sz);
    thresholdPose.updateMatrix();
    thresholdStones.setMatrixAt(index,thresholdPose.matrix);
  });
  thresholdStones.instanceMatrix.needsUpdate = true;
  const thresholdLeaves = new THREE.InstancedMesh(machinedLeaf, leafMaterial, 2);
  thresholdLeaves.name = 'WalkableSourceCapRetractingBronzeLeaves';
  thresholdLeaves.castShadow = false;
  thresholdLeaves.receiveShadow = false;
  thresholdLeaves.frustumCulled = false;
  thresholdLeaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Original 390x844/960x600 source-pinned WebM 42757152698 finally
  // exposed why the 14m grid redesign was still visually catastrophic:
  // the *entire* 14m tall ladder of cyan crossbars sits directly across the
  // airborne climber and living guardian at ~14-24s. This is a physical
  // composition problem, not a color/filter problem. The real source seal
  // still reaches 14m and blocks even two-jump bypass attempts, but a
  // full-height prison fence is neither necessary nor readable.
  //
  // Rebuild the same source-locked frame as one coherent OPEN-AIR electrical
  // exclusion assembly: continuous full-height side conductors, a short
  // tightly barred physical bronze-door energy barrier at pedestrian
  // level, two slender side-channel high-voltage stays spanning the *whole*
  // source height, and a high crossbeam. Their outboard energized profile
  // communicates unsafe airborne bypass without crossing the live duel centre.
  // All geometry stays presentation-only: no physics, authority, victory or
  // guardian changes. The existing source-driven bronze doors remain shut.
  // One existing reusable box geometry, one instanced draw, bounded 14/18
  // live instances. No new textures, lights, shadows or postprocessing.
  const sealMaterial = new THREE.MeshBasicMaterial({
    color: 0x79ded4, transparent: true, opacity: .64, depthWrite: false,
    depthTest: true, side: THREE.DoubleSide, toneMapped: false,
  });
  ownedMaterials.push(sealMaterial);
  const MAX_SOURCE_SEAL_BARS = 18;
  const sealedLattice = new THREE.InstancedMesh(box, sealMaterial, MAX_SOURCE_SEAL_BARS);
  sealedLattice.name = 'SourceLockedGuardianVerticalEnergyLattice';
  sealedLattice.visible = false;
  sealedLattice.castShadow = false;
  sealedLattice.receiveShadow = false;
  sealedLattice.frustumCulled = false;
  // The actual bronze HP lock in world.mjs is installed at the SHARED
  // visibleSealRadius 24.25. The previous 27.78-25 offset put this entire
  // 14m cyan source seal BACK at radius 27.78, 3.53m CLOSER to the camera
  // than the bronze lock and in FRONT of the source actors at radius ~25.
  // Genuine 390x844/960x600 source-pinned films (42998763864) showed these
  // as two huge competing live prison faces. Anchor both real presentations
  // to the SAME rear physical gate plane, behind the playable actor corridor.
  // The earned inner threshold remains on the true cap radius 25 and only
  // appears after a genuine source zero-HP guardian. No source hitbox, clock,
  // combat, guardian victory, or gateway authority changes.
  sealedLattice.position.set(0, 2,
    GUARDIAN_CAP_CORRIDOR.visibleSealRadius - GUARDIAN_PASSAGE_RADII.deck);
  sealedLattice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // The physical low-doorway field has five exclusion rails. Only three
  // carry the readable full glow; the two inset conductors stay deliberately
  // low-energy so a phone screen does not rebuild the bright prison grate.
  // Per-instance tint is retained on the SAME instanced draw and source lock.
  const sourceSealTint = new THREE.Color();
  let displayedSealHeight = 0, displayedSealExcitation = null;
  function poseSourceSealHeight(sourceHeight, excited=false) {
    const nextHeight = Number.isSafeInteger(sourceHeight) && sourceHeight >= 140000
      ? sourceHeight : 140000;
    if (nextHeight === displayedSealHeight &&
        excited === displayedSealExcitation) return;
    displayedSealHeight = nextHeight;
    displayedSealExcitation = excited;
    // A genuine warning surges through the SAME source-locked device.
    // Muted standby stops a decorative 14m cyan X from stealing every
    // climber/guardian frame, without visually pretending the door opened.
    sealMaterial.opacity = excited ? .76 : .37;
    sealMaterial.color.setHex(excited ? 0xb8ffff : 0x77c6c4);
    const h = displayedSealHeight / SCALE;
    const doorH = 4.64;
    const upperEnd = h - .22;
    const upperRun = upperEnd - doorH;
    // Original full-width X hit the real actor/guardian in source-pinned
    // portrait film. Two tensioned conductors now track the OUTER 2m
    // channels; their entire rotated silhouettes leave a central duel bay.
    const sideDrift = 1.90;
    const diagonalAngle = Math.atan2(sideDrift, upperRun);
    const diagonalLength = Math.hypot(sideDrift, upperRun);
    // Each instance is [x, y, z, width, height, depth, rotationZ].
    const latticeShapes = [
      [-3.05, h/2, 0, .115, h, .13, 0],
      [3.05, h/2, 0, .115, h, .13, 0],
      [-1.5, doorH/2, 0, .07, doorH, .1, 0],
      [0, doorH/2, 0, .07, doorH, .1, 0],
      [1.5, doorH/2, 0, .07, doorH, .1, 0],
    ];
    // The original-source doorway really is impassable while the guardian
    // is alive. Three rungs previously left two visually passable adult-body
    // openings in the lower 4.64m even though the authoritative gate was
    // locked. Five evenly spaced, slender grounded rails close those gaps,
    // while the centre of the airborne guardian duel stays entirely OPEN
    // above doorway height (source height can be 14m or more). Do not put
    // horizontal prison-grid bars back into the combat silhouettes.
    // This uses 17 of 18 preallocated instances, without an extra draw.
    for (const y of [.24, 1.16, 2.08, 3.00, 3.92])
      latticeShapes.push([0,y,0,6.22,.075,.10,0]);
    // Connected side-only couplers communicate the armed live lock while
    // preserving a genuinely clear centre and the full-height side pylon.
    for (const side of [-1,1]) for (const y of [1.05,3.52])
      latticeShapes.push([side*2.92,y,0,.25,.24,.16,0]);
    // These two full-height energized structural stays terminate on the
    // source-height SIDE pylons rather than crossing the guardian's body.
    // The continuous upper rails, capped high lintel and physically barred
    // lower gate still convey lethal vertical exclusion. No fake bypass,
    // no hidden authoring collider and no extra GPU draws.
    latticeShapes.push([-2.30,(doorH+upperEnd)/2,0,.075,
      diagonalLength,.10,-diagonalAngle]);
    latticeShapes.push([2.30,(doorH+upperEnd)/2,0,.075,
      diagonalLength,.10,diagonalAngle]);
    latticeShapes.push([0,h-.055,0,6.22,.11,.12,0]);
    sealedLattice.count = latticeShapes.length;
    latticeShapes.forEach(([x,y,z,sx,sy,sz,rz],index) => {
      thresholdPose.position.set(x,y,z);
      thresholdPose.rotation.set(0,0,rz);
      thresholdPose.scale.set(sx,sy,sz);
      thresholdPose.updateMatrix();
      sealedLattice.setMatrixAt(index,thresholdPose.matrix);
      // Indices 5..9 are the five low cross rails. Keep the three widely
      // spaced strokes as readable signal; bars 6 and 8 are real narrow
      // grounded conductors but visually recessed, even during a telegraph.
      const recessed = index === 6 || index === 8;
      sourceSealTint.setRGB(recessed ? .24 : 1,
        recessed ? .24 : 1, recessed ? .24 : 1);
      sealedLattice.setColorAt(index,sourceSealTint);
    });
    sealedLattice.instanceMatrix.needsUpdate = true;
    sealedLattice.instanceColor.needsUpdate = true;
  }
  poseSourceSealHeight(140000);
  // The original portrait+desktop film has TWO separate stone/bronze doors
  // sitting over the live duel: the authoritative EXTERIOR lock and this
  // decorative inner walk-through threshold. Actual source-linked portrait
  // ray probes near ticks 292-346 hit both WalkableSourceCap* meshes repeatedly.
  // During combat the exterior gate + live 14m source-driven lattice own the
  // locked silhouette; the inner solid frame is not yet physically earned.
  // After real guardian HP0 it rises at the climber's true cap deck radius.
  // On the genuine floor handoff, retire the inner arch so the old-floor
  // memory doesn't duplicate it. No source collision or run state changes.
  const innerDoorAssembly = new THREE.Group();
  innerDoorAssembly.name = 'EarnedWalkableInnerGateAssembly';
  innerDoorAssembly.visible = false;
  innerDoorAssembly.add(thresholdStones, thresholdLeaves);
  threshold.add(innerDoorAssembly, sealedLattice);
  group.add(threshold);
  const thresholdLeafPose = new THREE.Object3D();
  let lastWalkableOpening = -1;
  function poseWalkableLeaves(opened) {
    if (Math.abs(opened-lastWalkableOpening) < .0001) return;
    for (let index=0;index<2;index++) {
      const side = index === 0 ? -1 : 1;
      thresholdLeafPose.position.set(side * (1.46 + opened * 2.05), 2.12, .15);
      thresholdLeafPose.rotation.set(0, -side * opened * .27,
        side * opened * .025);
      thresholdLeafPose.scale.set(2.87, 4.13, .22);
      thresholdLeafPose.updateMatrix();
      thresholdLeaves.setMatrixAt(index,thresholdLeafPose.matrix);
    }
    thresholdLeaves.instanceMatrix.needsUpdate = true;
    lastWalkableOpening = opened;
  }
  poseWalkableLeaves(0);
  const emblem = add('ClearedPassageObservedLock', crownGeometry, glow,
    [0, 4.75, .48], [1, .72, .65], memoryFrame);
  const arc = add('ClearedPassageAscendingLight', openingGeometry, glow,
    [0, 2.25, -.12], [1, 1.18, 1], memoryFrame);
  const ring = add('ClearedPassageGroundWake', groundGeometry, glow,
    [0, .16, .15], [1, 1, 1], memoryFrame);
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
  // Real cap-floor wayfinding, not a fictitious collision bridge. Twelve
  // shallow metal inlays follow the existing curved, walkable cap from the
  // defeated guardian's platform toward the source-authorized bronze exit.
  // The hero's actual observed X lights them in sequence. One instanced draw,
  // no new geometry, no texture, no dynamic light or additional render pass.
  const inlayMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .72, roughness: .28,
    emissive: 0x123329, emissiveIntensity: .19, depthTest: true,
  });
  ownedMaterials.push(inlayMaterial);
  const capInlay = new THREE.InstancedMesh(box, inlayMaterial, 12);
  capInlay.name = 'WitnessedGuardianCapWalkwayInlay';
  capInlay.count = 0;
  capInlay.visible = false;
  capInlay.castShadow = false;
  capInlay.receiveShadow = false;
  capInlay.frustumCulled = false;
  capInlay.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(capInlay);
  const inlayPose = new THREE.Object3D();
  const inlayUnlit = new THREE.Color(0x8e694b);
  const inlayLit = new THREE.Color(0xb9f2d1);
  const inlayTint = new THREE.Color();
  let inlayProgress = 0, inlaySourceTick = -1;
  let inlayFromX = 0, inlayToX = 0, inlayMode = 'none';
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
  // The actual defeated source body emits one short, ground-level release wave.
  // It shares the existing torus geometry; its owned fading material avoids
  // dimming the simultaneously open bronze gate. Zero collider/light passes.
  const defeatWakeMaterial = glow.clone();
  defeatWakeMaterial.opacity = .48;
  ownedMaterials.push(defeatWakeMaterial);
  const defeatWake = add('WitnessedGuardianDefeatShockwave',
    groundGeometry, defeatWakeMaterial, [0, .13, 0], [.55, .55, .55]);
  defeatWake.rotation.x = Math.PI / 2;
  defeatWake.visible = false;
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
  function poseDefeatWake(seconds, still) {
    defeatWake.visible = witnessedGuardian && !still && seconds < 1.25;
    if (!defeatWake.visible) return;
    const t = unit(seconds / 1.25);
    // The impulse expands FROM the real defeated body and then dissipates,
    // rather than showing a future gate unlock or predicting a combat hit.
    defeatWake.scale.setScalar(.55 + 3.2 * (1 - Math.pow(1 - t, 2)));
    defeatWakeMaterial.opacity = .48 * (1 - t) * (1 - t);
  }
  function posePowerBreak(seconds, still) {
    powerBreak.visible = witnessedGuardian && !still &&
      Number.isFinite(powerLength) && powerLength>.4 && seconds<1.4;
    powerBreak.count = powerBreak.visible ? 8 : 0;
    if (!powerBreak.visible) return;
    const retreat = unit(seconds/1.3);
    for(let i=0;i<8;i++){
      const u=(i+.5)/8, intact=unit((u-retreat)*12);
      // Each segment reels physically toward the earned bronze gate as the
      // live power conduit disconnects from the fallen guardian. Even its
      // last surviving section moves rather than popping out on a timer.
      const reel = retreat * retreat * (3 - 2 * retreat);
      const advancedU = u + (1 - u) * reel * .38;
      const thickness = intact * (1 - reel * .36);
      powerPose.position.copy(powerStart).addScaledVector(powerDirection,advancedU);
      powerPose.quaternion.copy(powerOrientation);
      powerPose.scale.set(.115*thickness,
        Math.max(.001,powerLength*.084*thickness),.115*thickness);
      powerPose.updateMatrix();
      powerBreak.setMatrixAt(i,powerPose.matrix);
    }
    powerBreak.instanceMatrix.needsUpdate = true;
  }
  const shardTransform = new THREE.Object3D();
  const focusPosition = new THREE.Vector3();
  const defeatFocus = new THREE.Vector3();
  const clampUnit = v => Math.max(0, Math.min(1, v));
  function updateInlaySourceProgress(source, earned) {
    if (!capInlay.visible || source.tick <= inlaySourceTick ||
      !Number.isFinite(source.player?.x)) return;
    inlayProgress = clampUnit((source.player.x-inlayFromX)/
      Math.max(1,inlayToX-inlayFromX));
    // The lit portion follows real source walking; the pale edge ahead of
    // the climber is a quiet visual wayfinder, not a made-up future action.
    for (let i=0; i<capInlay.count; i++) {
      const fraction=(i+.5)/capInlay.count;
      const walked=fraction <= inlayProgress ? .86 : 0;
      const leading=Math.max(0,1-Math.abs(fraction-inlayProgress)*11);
      inlayTint.copy(inlayUnlit).lerp(inlayLit,Math.max(walked,.28*leading));
      capInlay.setColorAt(i,inlayTint);
    }
    if (capInlay.instanceColor) capInlay.instanceColor.needsUpdate = true;
    inlaySourceTick = source.tick;
  }
  function placeEarnedCapInlay(source, earned, anchor) {
    const cap=earned.cap;
    const fromX=cap.x+cap.width*.38;
    const exitX=cap.x+Math.floor(cap.width*.76);
    const cs=Math.cos(anchor.angle), sn=Math.sin(anchor.angle);
    capInlay.count=12;
    capInlay.visible=true;
    inlayFromX=fromX; inlayToX=exitX; inlayMode='earned-cap';
    inlayProgress=0;
    inlaySourceTick=-1;
    for(let i=0;i<capInlay.count;i++) {
      const x=fromX+(exitX-fromX)*(i+.5)/capInlay.count;
      // Every bar is laid onto the EXISTING authoritative cap's top, at
      // the exterior render depth of its visible bronze threshold.
      // The cap's actual render deck spans radius 22.4..27.18. The 27.78
      // exterior lock surface is OUTSIDE that walking sector, so a rail laid
      // there would visibly float beside the climber. Recess the metal into
      // the real deck, preserving the separate outer gate anchor.
      const p=pointFor(x,cap.y+cap.height+500,source.chunkBaseY,
        source.worldWidth,26.35);
      const dx=p.x-anchor.x,dz=p.z-anchor.z;
      inlayPose.position.set(cs*dx-sn*dz,p.y-anchor.y,sn*dx+cs*dz);
      inlayPose.rotation.set(0,p.angle-anchor.angle,0);
      inlayPose.scale.set(.68,.07,.47);
      inlayPose.updateMatrix();
      capInlay.setMatrixAt(i,inlayPose.matrix);
      capInlay.setColorAt(i,inlayUnlit);
    }
    capInlay.instanceMatrix.needsUpdate=true;
    if (capInlay.instanceColor) capInlay.instanceColor.needsUpdate=true;
    updateInlaySourceProgress(source,earned);
  }

  // Same 12 owned instanced metal treads, but REBUILT on Floor9's genuine
  // supported ground from its own source geometry. Never carry the old cap
  // deck's obsolete matrices or draw a bridge over empty space. Source-tick
  // walking progressively illuminates these treads after the handoff.
  function placeSuccessorRunway(previous, next, anchor) {
    const route = observedFloorNineRunway(previous, next);
    if (!route) return false;
    const cs = Math.cos(anchor.angle), sn = Math.sin(anchor.angle);
    capInlay.count = 12;
    capInlay.visible = true;
    inlayFromX=route.fromX; inlayToX=route.toX;
    inlayMode='successor-ground';
    inlayProgress=0; inlaySourceTick=-1;
    for (let i=0; i<capInlay.count; i++) {
      const x=route.fromX+(route.toX-route.fromX)*(i+.5)/capInlay.count;
      const p=pointFor(x,route.top+500,next.chunkBaseY,next.worldWidth,26.35);
      const dx=p.x-anchor.x,dz=p.z-anchor.z;
      inlayPose.position.set(cs*dx-sn*dz,p.y-anchor.y,sn*dx+cs*dz);
      inlayPose.rotation.set(0,p.angle-anchor.angle,0);
      inlayPose.scale.set(.68,.07,.47);
      inlayPose.updateMatrix();
      capInlay.setMatrixAt(i,inlayPose.matrix);
      capInlay.setColorAt(i,inlayUnlit);
    }
    capInlay.instanceMatrix.needsUpdate=true;
    if(capInlay.instanceColor)capInlay.instanceColor.needsUpdate=true;
    updateInlaySourceProgress(next);
    return true;
  }
  // Follow ONLY the supported source floor-nine ground. Leave old progress
  // untouched during stale reads, but retire the route instantly when the
  // real body leaves the ground, run or floor. No guessed future footsteps.
  function trackSuccessor(source, stale=false) {
    if(disposed || stale || !group.visible ||
      stage!=='handoff' || !continuousGroundedHandoff ||
      inlayMode!=='successor-ground') return false;
    const p=source?.player;
    if(source.runToken!==runToken || source.floor!==floor ||
      source.lifecycle!=='running' || !(p?.health>0) ||
      p.grounded!==true || p.groundedPlatformId!==`f${floor}:ground`) {
      capInlay.visible=false; capInlay.count=0; inlayMode='retired';
      return false;
    }
    if(Number.isSafeInteger(source.tick) && source.tick>inlaySourceTick &&
       Number.isFinite(p.x)) updateInlaySourceProgress(source);
    return true;
  }
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
  let continuousGroundedHandoff = false;
  // A received Floor 9 snapshot is not a visible arch. Cold WebGL can consume
  // multiple seconds before the FIRST successful scene submission. Only an
  // exact run/floor/tick renderer return may begin the bounded handoff beat.
  let handoffSubmittedFrames = 0, handoffDisplaySeconds = 0;
  let handoffUnsubmittedSeconds = 0, handoffStartAge = 0;
  const handoffVisibleWindowSeconds = 1.65;
  // Fail-safe for permanent WebGL failure without a false indefinite gate.
  const handoffNeverSubmittedTimeoutSeconds = 6;
  const duration = 2.9;
  const clamp = v => Math.max(0, Math.min(1, v));
  function clear() {
    group.visible = false;
    memoryFrame.visible = false;
    innerDoorAssembly.visible = false;
    innerDoorAssembly.position.y = 0;
    fragments.visible = false;
    fallenArmor.visible = false; fallenArmor.count = 0;
    powerBreak.visible = false; powerBreak.count = 0;
    capInlay.visible = false; capInlay.count = 0;
    inlayProgress = 0; inlaySourceTick = -1;
    inlayFromX=0; inlayToX=0; inlayMode='none';
    defeatWake.visible = false; defeatWake.scale.setScalar(.55);
    defeatWakeMaterial.opacity = .48;
    powerLength = 0; powerStart.set(0,0,0);
    witnessedGuardian = false; guardianWorld.set(0, 0, 0);
    lastWalkableOpening = -1;
    runToken = null;
    floor = null;
    sourceTick = -1;
    age = 0;
    defeatAge = 0;
    approachOpen = 0;
    continuousGroundedHandoff = false;
    handoffSubmittedFrames = 0; handoffDisplaySeconds = 0;
    handoffUnsubmittedSeconds = 0; handoffStartAge = 0;
    sealedLattice.visible = false;
    displayedSealHeight = 0;
    displayedSealExcitation = null;
    arc.visible = true;
    ring.visible = true;
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
      defeatWake.visible = false;
      return;
    }
    guardianWorld.set(guardianAnchor.x, guardianAnchor.y, guardianAnchor.z);
    const dx = guardianAnchor.x - anchor.x, dz = guardianAnchor.z - anchor.z;
    const cs = Math.cos(anchor.angle), sn = Math.sin(anchor.angle);
    fallenArmor.position.set(cs * dx - sn * dz,
      guardianAnchor.y - anchor.y, sn * dx + cs * dz);
    defeatWake.position.copy(fallenArmor.position);
    defeatWake.position.y += .13;
    poseDefeatWake(0, false);
    powerStart.copy(fallenArmor.position);
    powerStart.y += 2.85;
    powerDirection.copy(powerEnd).sub(powerStart);
    powerLength = powerDirection.length();
    if(powerLength>.4) powerOrientation.setFromUnitVectors(powerAxis,
      powerDirection.clone().normalize());
    poseFallenArmor(0,false);
    posePowerBreak(0,false);
  }
  function lock(source, anchor) {
    const observed = observedLockedGuardianCap(source);
    if (!observed || disposed || !anchor ||
        ![anchor.x,anchor.y,anchor.z,anchor.angle].every(Number.isFinite))
      return false;
    const thresholdFocus = observedWalkablePassageFocus(anchor);
    if (!thresholdFocus) return false;
    if (stage === 'guardian-locked' && group.visible &&
        runToken === source.runToken && floor === source.floor) {
      if (source.tick > sourceTick) {
        poseSourceSealHeight(source.guardianSealHeight,
          observedGuardianSealExcitation(observed.guardian));
        sourceTick = source.tick;
      }
      return true;
    }
    // Real source-only living guardian, not a new scripted encounter. The
    // identical arch will retract after zero HP; none of these meshes collides.
    clear();
    group.position.set(anchor.x, anchor.y, anchor.z);
    group.rotation.y = anchor.angle;
    focusPosition.set(thresholdFocus.x,thresholdFocus.y,thresholdFocus.z);
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'guardian-locked';
    group.visible = true;
    memoryFrame.visible = false;
    innerDoorAssembly.visible = false;
    innerDoorAssembly.position.y = 0;
    poseSourceSealHeight(source.guardianSealHeight,
      observedGuardianSealExcitation(observed.guardian));
    sealedLattice.visible = true;
    arc.visible = false;
    ring.visible = false;
    poseWalkableLeaves(0);
    return true;
  }
  function unlock(source, anchor) {
    const earned = observedUnlockedGuardianCap(source);
    if (!earned || disposed || !anchor ||
      ![anchor.x, anchor.y, anchor.z, anchor.angle].every(Number.isFinite))
      return false;
    const thresholdFocus = observedWalkablePassageFocus(anchor);
    if (!thresholdFocus) return false;
    if (stage === 'earned-open' && group.visible &&
      runToken === source.runToken && floor === source.floor) {
      // Repeated frames must not replay the mechanical release or recreate
      // a victory. A stale/out-of-order sample does not rewind source time.
      if (source.tick >= sourceTick) {
        approachOpen = Math.max(approachOpen, observedPassageApproach(source, earned));
        updateInlaySourceProgress(source, earned);
        sourceTick = source.tick;
      }
      return true;
    }
    group.position.set(anchor.x, anchor.y, anchor.z);
    focusPosition.set(thresholdFocus.x, thresholdFocus.y, thresholdFocus.z);
    group.rotation.y = anchor.angle;
    // The real zero-HP body remains observable during physical gate
    // traversal. Honor that source position now, at the decisive combat beat;
    // do not defer its visible consequence until an unrelated new floor.
    const body = earned.guardian;
    placeDefeatedArmor(anchor, pointFor(body.x,
      body.y - body.halfHeight + 9000, source.chunkBaseY,
      source.worldWidth, 27.65));
    placeEarnedCapInlay(source, earned, anchor);
    fragments.visible = false;
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'earned-open';
    continuousGroundedHandoff = false;
    handoffSubmittedFrames = 0; handoffDisplaySeconds = 0;
    handoffUnsubmittedSeconds = 0; handoffStartAge = 0;
    // The real, freshly unlocked deck is already shown by the INNER cap
    // doorway plus the original exterior guardian gate. A second outer
    // memorial facade would bury the climber during the short grounded walk.
    memoryFrame.visible = false;
    sealedLattice.visible = false;
    innerDoorAssembly.visible = true;
    innerDoorAssembly.position.y = -1.4;
    arc.visible = true;
    ring.visible = true;
    lastWalkableOpening = -1;
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
    const thresholdFocus = observedWalkablePassageFocus(anchor);
    if (!thresholdFocus) return false;
    const carryOpen = stage === 'earned-open' && group.visible &&
      runToken === previous.runToken && floor === previous.floor;
    const carryRealThreshold = carryOpen &&
      observedGroundedGuardianHandoff(previous, source);
    const carriedAge = age;
    const carriedDefeatAge = defeatAge;
    group.position.set(anchor.x, anchor.y, anchor.z);
    focusPosition.set(thresholdFocus.x, thresholdFocus.y, thresholdFocus.z);
    group.rotation.y = anchor.angle;
    placeDefeatedArmor(anchor, guardianAnchor);
    // Once the same run advances, old cap bars must not be carried onto
    // the new floor as a false platform or a second path to follow.
    capInlay.visible = false;
    capInlay.count = 0;
    inlayProgress = 0;
    inlaySourceTick = -1;
    inlayMode='none';
    group.visible = true;
    runToken = source.runToken;
    floor = source.floor;
    sourceTick = source.tick;
    stage = 'handoff';
    continuousGroundedHandoff = carryRealThreshold;
    if(carryRealThreshold) placeSuccessorRunway(previous,source,anchor);
    // A genuinely defeated, grounded, whole-body cap crossing keeps the
    // physical same-lane inner arch visible across the scene rebuild. Do NOT
    // replace that arch with the outboard raised memorial in the exact frame
    // when the actor enters Floor9. Legacy/incomplete source observations
    // retain their original exterior memorial, never inventing a clearance.
    memoryFrame.visible = !carryRealThreshold;
    sealedLattice.visible = false;
    innerDoorAssembly.visible = carryRealThreshold;
    innerDoorAssembly.position.y = 0;
    arc.visible = true;
    ring.visible = true;
    lastWalkableOpening = -1;
    approachOpen = carryOpen ? 1 : 0;
    // The real door already opened during the hero's grounded walk. Do
    // not visibly slam it shut and re-open upon the authoritative floor
    // switch. Historical immediate clearances still use the old cue.
    age = carryOpen ? Math.max(1.05, Math.min(1.65, carriedAge)) : 0;
    handoffStartAge = age;
    handoffSubmittedFrames = 0; handoffDisplaySeconds = 0;
    handoffUnsubmittedSeconds = 0;
    // The real guardian's armor keeps falling continuously across the
    // old/new-floor boundary; replay/slow passage staging cannot rewind it.
    defeatAge = carryOpen ? carriedDefeatAge : 0;
    return true;
  }
  function update(dt = 0, options = {}) {
    if (disposed || !group.visible) return;
    if (!options.stale) {
      const advance = Math.min(.5, Math.max(0, Number.isFinite(dt) ? dt : 0));
      if (stage === 'handoff' && continuousGroundedHandoff) {
        if (handoffSubmittedFrames === 0) {
          // A camera/geometry frame which never leaves renderer.render()
          // cannot spend the viewer's physical doorway-crossing interval.
          handoffUnsubmittedSeconds += advance;
          if (handoffUnsubmittedSeconds >= handoffNeverSubmittedTimeoutSeconds) {
            clear(); return;
          }
        } else {
          handoffDisplaySeconds += advance;
          age = handoffStartAge + (duration - handoffStartAge) *
            Math.min(1, handoffDisplaySeconds / handoffVisibleWindowSeconds);
        }
      } else age += advance;
      defeatAge += advance;
    }
    if (stage === 'handoff' && (
      (continuousGroundedHandoff &&
        handoffDisplaySeconds >= handoffVisibleWindowSeconds) ||
      (!continuousGroundedHandoff && age >= duration)
    )) { clear(); return; }
    const still = options.reducedMotion === true;
    poseFragments(age, still);
    poseFallenArmor(defeatAge, still);
    poseDefeatWake(defeatAge, still);
    posePowerBreak(defeatAge, still);
    const locked = stage === 'guardian-locked';
    const opened = locked ? 0 : still ? 1 : Math.max(approachOpen,
      1 - Math.pow(1 - clamp(age / .95), 3));
    poseWalkableLeaves(opened);
    // A visible source-earned crossing must emerge as one continuous
    // mechanism, not suddenly replace the living guardian with solid slabs.
    // The real path is already unlocked by authority; this is animation only.
    if (stage === 'earned-open') {
      innerDoorAssembly.visible = true;
      const t = still ? 1 : clamp(age / .38);
      const arrive = t * t * (3 - 2 * t);
      innerDoorAssembly.position.y = arrive >= 1 ? 0 : -1.4 * (1 - arrive);
    } else {
      innerDoorAssembly.visible = stage === 'handoff' &&
        continuousGroundedHandoff;
      innerDoorAssembly.position.y = 0;
    }
    const fade = stage === 'earned-open' || locked ? 1 :
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
    // Retain the ACTUAL opened passage after the source-verified floor change
    // without re-covering the skinned actor in overlapping solid plates. The
    // source-locked vertical energy lattice remains fully independent.
    leafMaterial.opacity = locked ? .88 :
      stage === 'handoff' ? .26 * fade : .74 * fade;
    glow.opacity = .65 * fade;
  }
  function cameraWeight() {
    if (!group.visible || stage === 'guardian-locked') return 0;
    if (stage === 'earned-open')
      return Math.max(.55 * clamp(1 - age / 2.4), .32 * approachOpen);
    if (stage === 'handoff' && continuousGroundedHandoff)
      return .58 * clamp(1 - handoffDisplaySeconds / handoffVisibleWindowSeconds);
    return clamp(1 - age / 1.35);
  }
  function noteFrameSubmitted(source, options = {}) {
    // Called ONLY after successful real Three.js submission, never when the
    // HTTP payload is accepted. This is not a display, GPU-present or video
    // proof. Stale/restarted/wrong-floor frames never authorize a handoff.
    if (disposed || !group.visible || stage !== 'handoff' ||
        !continuousGroundedHandoff || options.stale || !source ||
        source.lifecycle !== 'running' || source.runToken !== runToken ||
        source.floor !== floor || !Number.isSafeInteger(source.tick) ||
        source.tick < sourceTick || !(source.player?.health > 0)) return false;
    handoffSubmittedFrames = Math.min(2, handoffSubmittedFrames + 1);
    return true;
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
      handoffSubmittedFrames,
      handoffDisplaySeconds: Number(handoffDisplaySeconds.toFixed(4)),
      handoffUnsubmittedSeconds: Number(handoffUnsubmittedSeconds.toFixed(4)),
      handoffVisibleWindowSeconds,
      exteriorMemoryFrameVisible: group.visible && memoryFrame.visible,
      continuousGroundedHandoff: group.visible && stage === 'handoff' &&
        continuousGroundedHandoff,
      innerDoorAssemblyVisible: group.visible && innerDoorAssembly.visible,
      innerDoorAssemblyLift: Number(innerDoorAssembly.position.y.toFixed(4)),
      durationSeconds: duration,
      sourceMeasuredApproachOpen: approachOpen,
      sourceLockedSealExcited: stage === 'guardian-locked' &&
        displayedSealExcitation === true,
      sourceLockedSealDrawnBars: sealedLattice.visible ? sealedLattice.count : 0,
      sourceMeasuredDefeatFocusWeight: Number(defeatFocusWeight().toFixed(4)),
      // Public world-space source-pinned anchor for inspecting actual full
      // motion; no fabricated win, private event or gameplay mutation.
      anchorPosition: group.visible ? group.position.toArray() : null,
      focusPosition: group.visible ? focusPosition.toArray() : null,
      meshes: 17, fragmentInstances: 8, fragmentsVisible: fragments.visible,
      physicallyWalkableThreshold: group.visible ? {
        sourceAnchored: true, innerRadius: GUARDIAN_PASSAGE_RADII.deck,
        capDeckRadialBand: [GUARDIAN_PASSAGE_RADII.deckMin, GUARDIAN_PASSAGE_RADII.deckMax],
        originalExteriorLockRadius: GUARDIAN_PASSAGE_RADII.lock,
        gateOpen: Number(Math.max(0,lastWalkableOpening).toFixed(4)),
        originalThroughCutLeafWindows: machinedLeaf.parameters.shapes.holes.length,
        gatewayLeafAlpha: Number(leafMaterial.opacity.toFixed(4)),
        archInstances: thresholdStones.count, retractingLeaves: thresholdLeaves.count,
        innerAssemblyVisible: innerDoorAssembly.visible,
        // In the live fight only the actual source-height electrical lock
        // is drawn here, not two additional solid threshold submissions.
        extraDraws: stage === 'guardian-locked' ? 1 :
          stage === 'earned-open' ||
          (stage === 'handoff' && continuousGroundedHandoff) ? 2 : 0,
        collider: false, sourceSimulationSealActive: stage === 'guardian-locked',
        redundantExteriorMemorySuppressed: !memoryFrame.visible,
        verticalLatticeVisible: sealedLattice.visible,
        sourceLatticeHeight: displayedSealHeight,
        // Explicit geometry provenance: these are authored source-facing
        // 3D positions, NOT a GPU-pixel visibility or video quality score.
        authoredLiveSealWorldRadius: Number(
          (GUARDIAN_PASSAGE_RADII.deck + sealedLattice.position.z).toFixed(3)),
        authoredBronzeGateWorldRadius: GUARDIAN_CAP_CORRIDOR.visibleSealRadius,
        authoredGroundedActorRadius: GUARDIAN_PASSAGE_RADII.deck,
        focusPosition: focusPosition.toArray(),
        proof: 'World-space inner deck doorway mirrors actual source-earned exterior unlock; raster/collision quality NOT verified',
      } : null,
      inlayPieces: capInlay.count,
      inlayMode, inlayFromX, inlayToX,
      inlayProgress: Number(inlayProgress.toFixed(4)),
      inlaySourceTick,
      guardianDefeatPieces: fallenArmor.count,
      // Source-anchored original-world visual samples for current full-motion
      // evidence; source+render agreement never proves raster legibility.
      guardianDefeatShockwave: group.visible && witnessedGuardian ? {
        visible: defeatWake.visible,
        radius: Number(defeatWake.scale.x.toFixed(4)),
        opacity: Number(defeatWakeMaterial.opacity.toFixed(4)),
        sourceTick, floor
      } : null,
      guardianPowerReelProgress: group.visible && witnessedGuardian
        ? Number(Math.min(1, defeatAge / 1.3).toFixed(4)) : null,
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
  return { group, lock, unlock, begin, trackSuccessor, update, noteFrameSubmitted, clear, cameraWeight, focusPoint, diagnostics, dispose };
}
