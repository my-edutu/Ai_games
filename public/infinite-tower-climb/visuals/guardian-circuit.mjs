import { pointFor, guardianGateAnchorX } from './coordinates.mjs';

// A physically anchored, visually readable connection between the REAL active
// guardian and the HP-operated lock at the real cap. This owns presentation
// only: the simulation decides enemy damage, the gate and floor progression.
const RAIL_STEPS = 22;
const RELAY_TEETH = 8;
// Three large paired gantry clutches physically disengage in observed HP
// stages. They bridge the near-guardian relay and the actual cap lock, so a
// distant gate is not the only progress cue in a narrow phone composition.
const POWER_SHUNT_STAGES = [0.23, 0.53, 0.82];
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
    chargeTotalTicks: guardian.telegraphTotalTicks===6?6:8,
    remainingChargeTicks: Number.isFinite(guardian.telegraphTicksRemaining)
      ? Math.min(guardian.telegraphTotalTicks===6?6:8,
        Math.max(1, guardian.telegraphTicksRemaining))
      : (guardian.telegraphTotalTicks===6?6:8),
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

// A source-observed mechanical clutch runs ALONG the same real guardian-to-
// cap gantry. A phone can see how much of the physical gate is still engaged
// without forcing a camera cut to a distant gate or fabricating UI or damage.
// Both the scene director and renderer use exactly the same exterior point.
export function guardianLinkSite(source, t, offset = 0) {
  const x = source.fromX + (source.toX - source.fromX) * t;
  const y = source.fromY + (source.toY - source.fromY) * t +
    Math.sin(Math.PI * t) * 6200 + offset;
  const radius = 26.2 + 1.48 * Math.min(1, t / .18) - .03 * t +
    2.55 * Math.sin(Math.PI * t);
  return pointFor(x, y, source.baseY, source.width, radius);
}

export function observedGuardianRelayStage(source) {
  if (!source || ![source.fromX, source.toX, source.fromY, source.toY,
    source.baseY, source.width, source.health, source.maxHealth]
    .every(Number.isFinite) || source.width <= 0 || source.maxHealth <= 0 ||
    source.health <= 0 || source.health > source.maxHealth) return null;
  return { center: guardianLinkSite(source, .12),
    remainingFraction: clamp01(source.health / source.maxHealth),
    releasedFraction: clamp01(1 - source.health / source.maxHealth),
    sourceTick: source.tick, guardianId: source.guardianId };
}

// This camera-readable source anchor is exactly the nearest PHYSICAL pair
// of the power-spine shutters. A lens may prefer it when the far gate will
// not fit with the two actors, but it never changes their hard safety bounds.
export function observedGuardianPowerSpineStage(source) {
  if (!observedGuardianRelayStage(source)) return null;
  return {
    center: guardianLinkSite(source, POWER_SHUNT_STAGES[0]),
    releasedFraction: clamp01(source.openedFraction * POWER_SHUNT_STAGES.length),
    sourceTick: source.tick,
    guardianId: source.guardianId,
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
  // The visible local clutch is attached to the gantry beside the guardian.
  // Eight bronze teeth retract in direct proportion to the genuine source HP
  // and expose pale alloy; it is physical scenery, never a health-bar HUD.
  // One small instanced draw, bounded even on phone/low-quality settings.
  const relayGeometry = new THREE.BoxGeometry(.31, .42, .19);
  const relayMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .69, roughness: .36,
    emissive: 0x2a170b, emissiveIntensity: .16, depthTest: true,
  });
  const relayTeeth = new THREE.InstancedMesh(relayGeometry, relayMaterial, RELAY_TEETH);
  relayTeeth.name = 'GuardianSourceHPMechanicalRelay';
  relayTeeth.castShadow = false;
  relayTeeth.receiveShadow = false;
  relayTeeth.frustumCulled = false;
  relayTeeth.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const relayLocked = new THREE.Color(0xe6af72);
  const relayReleased = new THREE.Color(0x83ada9);
  // Original mechanical power-spine shutters: one reusable draw, six metal
  // leaves at source-derived sites, each pair released by actual guardian HP.
  // No prediction, RNG, colliders, emitted light or additional camera pass.
  const shuntGeometry = new THREE.BoxGeometry(.42, 1.12, .68);
  const shuntMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .81, roughness: .34, depthTest: true,
  });
  const shunts = new THREE.InstancedMesh(shuntGeometry, shuntMaterial,
    POWER_SHUNT_STAGES.length * 2);
  shunts.name = 'GuardianSourcePowerSpineClutches';
  shunts.castShadow = false;
  shunts.receiveShadow = false;
  shunts.frustumCulled = false;
  shunts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const shuntTint = new THREE.Color();
  const shuntDark = new THREE.Color(0x78624c);
  const shuntOpen = new THREE.Color(0xb9dcd3);
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
  group.add(rails, conductors, atGuardian, atGate, lockBolts, fractures, relayTeeth, shunts);
  const pose = new THREE.Object3D();
  const start = new THREE.Vector3(), finish = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const dark = new THREE.Color(0xffbd75), released = new THREE.Color(0x8ef1d2);
  // One source-authoritative HP stage drives both the physical clamp pose
  // and a readable exposed metal finish. All eight teeth share the EXISTING
  // instanced draw and no material instance is allocated per frame.
  const clampLocked = new THREE.Color(0x927158);
  const clampReleased = new THREE.Color(0xb6e2d2);
  const clampWindup = new THREE.Color(0xe9a06f);
  const clampTint = new THREE.Color();
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
    relayTeeth.count = 0;
    shunts.count = 0;
    fractures.count = 0;
    previousSource = null;
    observedDamageTick = -1;
    observedDamage = 0;
    damagedGuardian = ''; damagedRun = ''; damagedFloor = -1;
  }
  const mapped = guardianLinkSite;
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
    const relayStage = observedGuardianRelayStage(next);
    // Source HP drives a persistent widening, never a made-up kill. Genuine
    // windup briefly tightens the at-guardian fastening; no fake hit pulse.
    const windup = next.telegraph && !options.reducedMotion
      ? (next.chargeTotalTicks-next.remainingChargeTicks)/next.chargeTotalTicks : 0;
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
    // The same gantry physically carries the close-range release clutch.
    // Preserve the original end anchor on the real opponent via the rails;
    // the enlarged ring sits on the first exposed exterior rail segment.
    const relayCenter = relayStage.center;
    atGuardian.position.set(relayCenter.x, relayCenter.y, relayCenter.z);
    atGuardian.rotation.set(0, relayCenter.angle, 0);
    atGuardian.scale.setScalar(1.66);
    for (let index = 0; index < RELAY_TEETH; index++) {
      const theta = 2 * Math.PI * index / RELAY_TEETH;
      const engaged = (index + .5) / RELAY_TEETH <= relayStage.remainingFraction;
      const radius = engaged ? 1.39 : 1.61;
      const tangent = Math.cos(theta) * radius;
      pose.position.set(
        relayCenter.x + Math.cos(relayCenter.angle) * tangent,
        relayCenter.y + Math.sin(theta) * radius,
        relayCenter.z - Math.sin(relayCenter.angle) * tangent);
      pose.rotation.set(0, relayCenter.angle, theta);
      pose.scale.set(engaged ? 1 : .58, engaged ? 1 : .48, 1);
      pose.updateMatrix();
      relayTeeth.setMatrixAt(index, pose.matrix);
      relayTeeth.setColorAt(index, engaged ? relayLocked : relayReleased);
    }
    relayTeeth.count = RELAY_TEETH;
    relayTeeth.instanceMatrix.needsUpdate = true;
    if (relayTeeth.instanceColor) relayTeeth.instanceColor.needsUpdate = true;
    // The broad power-spine pairs move progressively along the real arched
    // rail. Each opened pair is an earned share of the present HP loss, not
    // a speculative animation that assumes the guardian is defeated.
    for (let stage = 0; stage < POWER_SHUNT_STAGES.length; stage++) {
      const site = mapped(next, POWER_SHUNT_STAGES[stage]);
      const release = clamp01(opening * POWER_SHUNT_STAGES.length - stage);
      const spread = .35 + release * 1.46;
      for (const side of [-1, 1]) {
        const index = stage * 2 + (side < 0 ? 0 : 1);
        pose.position.set(
          site.x + Math.cos(site.angle) * side * spread,
          site.y + release * .23,
          site.z - Math.sin(site.angle) * side * spread);
        pose.rotation.set(0, site.angle, -side * release * .32);
        pose.scale.set(1 + release * .14, 1 - release * .28, 1);
        pose.updateMatrix();
        shunts.setMatrixAt(index, pose.matrix);
        shuntTint.copy(shuntDark).lerp(shuntOpen, release);
        shunts.setColorAt(index, shuntTint);
      }
    }
    shunts.count = POWER_SHUNT_STAGES.length * 2;
    shunts.instanceMatrix.needsUpdate = true;
    if (shunts.instanceColor) shunts.instanceColor.needsUpdate = true;
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
      // Four paired retaining brackets reveal genuinely removed guardian HP
      // in order. Before the first observed hit all are aged bronze; as HP
      // drops the mechanically withdrawn pairs reveal pale inner alloy.
      // A true telegraph warms ONLY the currently active lock, without an
      // invented hit or extra GPU light. Reduced motion leaves HP legible.
      const exposed = clamp01(opening * 4 - Math.floor(index / 2));
      clampTint.copy(clampLocked).lerp(clampReleased, exposed);
      if (next.telegraph && !options.reducedMotion)
        clampTint.lerp(clampWindup, .12);
      lockBolts.setColorAt(index, clampTint);
    }
    lockBolts.count = 8;
    lockBolts.instanceMatrix.needsUpdate = true;
    if (lockBolts.instanceColor) lockBolts.instanceColor.needsUpdate = true;
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
      nearbyRelayTeeth: group.visible ? relayTeeth.count : 0,
      gantryClutchPairs: POWER_SHUNT_STAGES.length,
      powerSpineLeaves: group.visible ? shunts.count : 0,
      relaySourceHP: source?.health ?? null,
      relaySourceTick: source?.tick ?? null,
      observedHealthLossTick: observedDamageTick >= 0 ? observedDamageTick : null,
      healthLossFragments: group.visible ? fractures.count : 0,
      maxExtraDraws: 8, shadowCastingMeshes: 0,
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
    relayGeometry.dispose();
    relayMaterial.dispose();
    shuntGeometry.dispose();
    shuntMaterial.dispose();
  }
  return { group, update, clear, diagnostics, dispose };
}
