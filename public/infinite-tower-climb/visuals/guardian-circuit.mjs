import { pointFor, guardianGateAnchorX } from './coordinates.mjs';

// A physically anchored, visually readable connection between the REAL active
// guardian and the HP-operated lock at the real cap. This owns presentation
// only: the simulation decides enemy damage, the gate and floor progression.
const RAIL_STEPS = 22;
const clamp01 = value => Math.min(1, Math.max(0, value));

export function observedGuardianCircuit(snapshot) {
  if (snapshot?.lifecycle !== 'running' || !snapshot.player ||
      snapshot.player.health <= 0 || !Number.isSafeInteger(snapshot.tick) ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !Number.isSafeInteger(snapshot.floor) ||
      !Number.isFinite(snapshot.worldWidth) || snapshot.worldWidth <= 0 ||
      !Number.isFinite(snapshot.chunkBaseY)) return null;
  const guardian = snapshot.enemies?.find(enemy =>
    enemy.kind === 'guardian' && enemy.active === true &&
    typeof enemy.id === 'string' && enemy.id &&
    [enemy.x, enemy.y, enemy.halfHeight, enemy.health, enemy.maxHealth]
      .every(Number.isFinite) && enemy.halfHeight > 0 &&
    enemy.maxHealth > 0 && enemy.health > 0 && enemy.health <= enemy.maxHealth);
  const cap = snapshot.platforms?.find(platform =>
    platform.id === 'f' + snapshot.floor + ':cap' &&
    [platform.x, platform.y, platform.width, platform.height]
      .every(Number.isFinite) && platform.width > 0 && platform.height > 0);
  if (!guardian || !cap) return null;
  const anchorX = guardianGateAnchorX(snapshot, cap);
  if (![anchorX, guardian.x, guardian.y, cap.y].every(Number.isFinite)) return null;
  return {
    runToken: snapshot.runToken, floor: snapshot.floor, tick: snapshot.tick,
    guardianId: guardian.id, health: guardian.health,
    maxHealth: guardian.maxHealth, openedFraction: clamp01(1 - guardian.health / guardian.maxHealth),
    telegraph: guardian.telegraph === true,
    remainingChargeTicks: Number.isFinite(guardian.telegraphTicksRemaining)
      ? Math.min(8, Math.max(1, guardian.telegraphTicksRemaining)) : 8,
    fromX: guardian.x, fromY: guardian.y - guardian.halfHeight + 9000,
    toX: anchorX, toY: cap.y + cap.height + 20000,
    width: snapshot.worldWidth, baseY: snapshot.chunkBaseY,
  };
}

// The camera and decorative lock MUST inspect the SAME exterior source geometry.
// Older camera composition aimed at the recessed inner gate (radius 21.8),
// while the actual HP-driven bronze teeth occupy radius 27.78. On a phone
// those are distinct silhouettes; framing the wrong one hid the payoff.
// This is a pure observed-state projection; no goal, hit, or route is created.
export function observedGuardianLockStage(source) {
  if (!source || !Number.isFinite(source.openedFraction) ||
      ![source.toX, source.toY, source.baseY, source.width].every(Number.isFinite) ||
      source.width <= 0) return null;
  const release = clamp01(source.openedFraction);
  const bolts = [];
  for (let index = 0; index < 8; index++) {
    const side = index % 2 === 0 ? -1 : 1;
    const tier = Math.floor(index / 2);
    const span = 10000 + release * (18500 + tier * 1400);
    const x = Math.max(0, Math.min(source.width, source.toX + side * span));
    bolts.push(pointFor(x, source.toY + (tier - 1.5) * 7600,
      source.baseY, source.width, 27.78));
  }
  return {
    sourceTick: source.tick, guardianId: source.guardianId,
    releaseFraction: release,
    center: pointFor(source.toX, source.toY, source.baseY, source.width, 27.78),
    bolts,
  };
}

export function createTowerGuardianCircuit(THREE) {
  const group = new THREE.Group();
  group.name = 'SourceObservedGuardianLockCircuit';
  group.visible = false;
  // Two independent heavy bronze lines are deliberately distinguished by
  // silhouette. As the real guardian loses HP, the mechanical rails spread
  // apart and the light conductor exposes more of the unlocked mechanism.
  const railGeometry = new THREE.BoxGeometry(.17, 1, .21);
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a7859, metalness: .73, roughness: .43, depthTest: true,
  });
  const rails = new THREE.InstancedMesh(railGeometry, railMaterial, RAIL_STEPS * 2);
  rails.name = 'GuardianLockTwinBronzeRails';
  rails.castShadow = false;
  rails.receiveShadow = false;
  rails.frustumCulled = false;
  rails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Eight original, source-HP-driven locking teeth make the cap's release
  // legible as architecture rather than an abstract health bar. One instanced
  // draw, actual source cap anchor, no extra shadow/collision/AI state.
  const boltGeometry = new THREE.BoxGeometry(.38, .88, .52);
  const lockBolts = new THREE.InstancedMesh(boltGeometry, railMaterial, 8);
  lockBolts.name = 'GuardianCapSourceLockBolts';
  lockBolts.castShadow = false;
  lockBolts.receiveShadow = false;
  lockBolts.frustumCulled = false;
  lockBolts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const conductorGeometry = new THREE.OctahedronGeometry(.13, 0);
  const conductorMaterial = new THREE.MeshBasicMaterial({
    color: 0xffbd75, transparent: true, opacity: .26,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const conductors = new THREE.InstancedMesh(
    conductorGeometry, conductorMaterial, RAIL_STEPS + 1);
  conductors.name = 'GuardianLockHealthConductor';
  conductors.castShadow = false;
  conductors.frustumCulled = false;
  conductors.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // The bronze lock has a visible physical answer to an OBSERVED health loss.
  // Two small exterior clouds, anchored to the guardian and gate, illuminate
  // the existing mechanism without claiming an unseen hit, route or victory.
  // There is no independent particle clock: age comes from fixed-step ticks.
  const fractureGeometry = new THREE.TetrahedronGeometry(.24, 0);
  const fractureMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8b986, emissive: 0x4f2309, emissiveIntensity: .27,
    metalness: .46, roughness: .58, transparent: true, opacity: .82,
    depthTest: true, depthWrite: false,
  });
  const fractures = new THREE.InstancedMesh(fractureGeometry, fractureMaterial, 12);
  fractures.name = 'GuardianObservedHealthLossFragments';
  fractures.count = 0;
  fractures.castShadow = false;
  fractures.receiveShadow = false;
  fractures.frustumCulled = false;
  fractures.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const terminalGeometry = new THREE.TorusGeometry(.82, .09, 6, 24);
  const terminalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb18e65, metalness: .76, roughness: .38,
  });
  const atGuardian = new THREE.Mesh(terminalGeometry, terminalMaterial);
  const atGate = new THREE.Mesh(terminalGeometry, terminalMaterial);
  atGuardian.name = 'GuardianLockGuardianAnchor';
  atGate.name = 'GuardianLockCapAnchor';
  atGuardian.castShadow = atGate.castShadow = false;
  group.add(rails, conductors, atGuardian, atGate, lockBolts, fractures);
  const pose = new THREE.Object3D();
  const start = new THREE.Vector3(), finish = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const dark = new THREE.Color(0xffbd75), released = new THREE.Color(0x8ef1d2);
  let source = null, disposed = false;
  let lastKey = '';
  let previousSource = null, observedDamageTick = -1;
  let observedDamage = 0, damagedGuardian = '', damagedRun = '', damagedFloor = -1;
  function clear() {
    group.visible = false;
    source = null;
    lastKey = '';
    rails.count = 0;
    conductors.count = 0;
    lockBolts.count = 0;
    fractures.count = 0;
    previousSource = null;
    observedDamageTick = -1;
    observedDamage = 0;
    damagedGuardian = ''; damagedRun = ''; damagedFloor = -1;
  }
  function mapped(item, t, offset = 0) {
    const x = item.fromX + (item.toX - item.fromX) * t;
    // An elevated outward gantry carries the real HP-operated connection
    // ABOVE and OUTSIDE the opaque tower, instead of diving through its core
    // or hiding below a nearby deck. Curvature is presentation-only and fixed
    // to the live guardian and source cap, not a predicted player path.
    const y = item.fromY + (item.toY - item.fromY) * t +
      Math.sin(Math.PI * t) * 6200 + offset;
    // Begin INSIDE the guardian's silhouette at ankle height, then lift the
    // conduit outward over the wall: the glowing rail must not draw across
    // the enemy's face or hide its real maul telegraph on a phone.
    const radius = 26.2 + 1.48 * Math.min(1, t / .18) - .03 * t +
      2.55 * Math.sin(Math.PI * t);
    return pointFor(x, y, item.baseY, item.width, radius);
  }
  function update(snapshot, options = {}) {
    if (disposed) return;
    const next = !options.stale ? observedGuardianCircuit(snapshot) : null;
    if (!next) { clear(); return; }
    // Only a NEW fixed-step source observation within the same active run
    // can create a damage impulse. Repeated packets, scene startup, floor
    // transitions, stream staleness and restart cannot invent impact.
    if (previousSource &&
        previousSource.runToken === next.runToken &&
        previousSource.floor === next.floor &&
        previousSource.guardianId === next.guardianId &&
        next.tick > previousSource.tick &&
        next.tick - previousSource.tick <= 12 &&
        next.health < previousSource.health) {
      observedDamageTick = next.tick;
      observedDamage = Math.min(4, previousSource.health - next.health);
      damagedRun = next.runToken;
      damagedGuardian = next.guardianId;
      damagedFloor = next.floor;
    }
    previousSource = next;
    const key = [next.runToken, next.floor, next.tick, next.guardianId,
      next.fromX, next.fromY, next.toX, next.toY, next.health,
      next.telegraph, next.remainingChargeTicks, !!options.reducedMotion].join(':');
    if (key === lastKey) return;
    lastKey = key;
    source = next;
    const opening = next.openedFraction;
    const lockStage = observedGuardianLockStage(next);
    // Source HP drives a persistent widening, never a made-up kill. Genuine
    // windup briefly tightens the at-guardian fastening; no fake hit pulse.
    const windup = next.telegraph && !options.reducedMotion
      ? (8 - next.remainingChargeTicks) / 8 : 0;
    for (const side of [-1, 1]) {
      for (let index = 0; index < RAIL_STEPS; index++) {
        const first = mapped(next, index / RAIL_STEPS,
          side * (1900 + opening * 4200 + windup * 1300));
        const second = mapped(next, (index + 1) / RAIL_STEPS,
          side * (1900 + opening * 4200 + windup * 1300));
        start.set(first.x, first.y, first.z);
        finish.set(second.x, second.y, second.z);
        tangent.copy(finish).sub(start);
        const segmentLength = Math.max(.01, tangent.length());
        pose.position.copy(start).add(finish).multiplyScalar(.5);
        pose.quaternion.setFromUnitVectors(up, tangent.multiplyScalar(1 / segmentLength));
        pose.scale.set(1 + opening * .55, segmentLength * .98, 1);
        pose.updateMatrix();
        const slot = (side < 0 ? 0 : RAIL_STEPS) + index;
        rails.setMatrixAt(slot, pose.matrix);
      }
    }
    rails.count = RAIL_STEPS * 2;
    rails.instanceMatrix.needsUpdate = true;
    conductorMaterial.color.copy(dark).lerp(released, opening);
    conductorMaterial.opacity = .18 + opening * .25;
    for (let index = 0; index <= RAIL_STEPS; index++) {
      const t = index / RAIL_STEPS, point = mapped(next, t);
      pose.position.set(point.x, point.y, point.z);
      pose.quaternion.identity();
      const scale = .42 + opening * .72 +
        (!options.reducedMotion && next.telegraph ? .08 * (1 - t) : 0);
      pose.scale.setScalar(scale);
      pose.updateMatrix();
      conductors.setMatrixAt(index, pose.matrix);
    }
    conductors.count = RAIL_STEPS + 1;
    conductors.instanceMatrix.needsUpdate = true;
    const a = mapped(next, 0), b = mapped(next, 1);
    atGuardian.position.set(a.x, a.y, a.z);
    atGuardian.rotation.set(0, a.angle, 0);
    atGuardian.scale.setScalar(next.telegraph ? 1.14 : 1);
    atGate.position.set(b.x, b.y, b.z);
    atGate.rotation.set(0, b.angle, 0);
    atGate.scale.setScalar(1 + opening * .35);
    // Four paired mechanical clamps visibly withdraw from the cap's central
    // seam as the actual guardian loses HP. Every tooth remains at the real
    // decorative gate anchor; it never asserts that a collision door opened.
    for (let index = 0; index < 8; index++) {
      const site = lockStage.bolts[index];
      pose.position.set(site.x, site.y, site.z);
      pose.quaternion.identity();
      pose.rotation.set(0, site.angle, 0);
      pose.scale.set(1.13 - opening * .1, 1, .82);
      pose.updateMatrix();
      lockBolts.setMatrixAt(index, pose.matrix);
    }
    lockBolts.count = 8;
    lockBolts.instanceMatrix.needsUpdate = true;
    // A short real-hit echo renders in WORLD space. No wall-clock flash or
    // random numbers; reduced motion leaves the physical lock itself intact.
    const age = next.tick - observedDamageTick;
    const actualDamage = !options.reducedMotion &&
      damagedRun === next.runToken && damagedFloor === next.floor &&
      damagedGuardian === next.guardianId && observedDamage > 0 &&
      age >= 0 && age <= 6;
    fractures.count = actualDamage ? 12 : 0;
    if (actualDamage) {
      const guardianSite = pointFor(next.fromX, next.fromY + 6500,
        next.baseY, next.width, 27.65);
      const gateSite = lockStage.center;
      for (let index = 0; index < fractures.count; index++) {
        const origin = index < 6 ? guardianSite : gateSite;
        const bearing = (index % 6) * 2.399963229728653;
        const distance = .28 + age * .21 + observedDamage * .06;
        pose.position.set(
          origin.x + Math.cos(bearing) * distance,
          origin.y + Math.sin(bearing * 1.7) * distance * .65 + age * .075,
          origin.z + Math.sin(bearing) * distance);
        pose.quaternion.setFromAxisAngle(up, bearing + age * .12);
        pose.scale.setScalar(Math.max(.06, (1 - age / 7) *
          (.68 + .13 * (index % 3))));
        pose.updateMatrix();
        fractures.setMatrixAt(index, pose.matrix);
      }
      fractures.instanceMatrix.needsUpdate = true;
    }
    group.visible = true;
  }
  function diagnostics() {
    return {
      sourceBound: true, visible: group.visible, runToken: source?.runToken ?? null,
      floor: source?.floor ?? null, sourceTick: source?.tick ?? null,
      guardianId: source?.guardianId ?? null, guardianHealth: source?.health ?? null,
      guardianMaxHealth: source?.maxHealth ?? null,
      lockReleaseFraction: source?.openedFraction ?? null,
      actualTelegraph: source?.telegraph ?? false,
      realCapX: source?.toX ?? null,
      railSegments: group.visible ? rails.count : 0,
      conductorNodes: group.visible ? conductors.count : 0,
      lockBolts: group.visible ? lockBolts.count : 0,
      observedHealthLossTick: observedDamageTick >= 0 ? observedDamageTick : null,
      healthLossFragments: group.visible ? fractures.count : 0,
      maxExtraDraws: 6, shadowCastingMeshes: 0,
      metric: 'Decorative linked hardware from real live guardian HP and actual cap anchor; not a new collider or verified raster visibility',
      disposed,
    };
  }
  function dispose() {
    if (disposed) return;
    clear();
    disposed = true;
    group.clear();
    railGeometry.dispose();
    boltGeometry.dispose();
    railMaterial.dispose();
    conductorGeometry.dispose();
    conductorMaterial.dispose();
    terminalGeometry.dispose();
    terminalMaterial.dispose();
    fractureGeometry.dispose();
    fractureMaterial.dispose();
  }
  return { group, update, clear, diagnostics, dispose };
}
