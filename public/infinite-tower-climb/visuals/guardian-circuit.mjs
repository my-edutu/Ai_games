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
    fromX: guardian.x, fromY: guardian.y - guardian.halfHeight + 19500,
    toX: anchorX, toY: cap.y + cap.height + 20000,
    width: snapshot.worldWidth, baseY: snapshot.chunkBaseY,
  };
}

export function createTowerGuardianCircuit(THREE) {
  const group = new THREE.Group();
  group.name = 'SourceObservedGuardianLockCircuit';
  group.visible = false;
  // Two independent heavy bronze lines are deliberately distinguished by
  // silhouette. As the real guardian loses HP, the mechanical rails spread
  // apart and the light conductor exposes more of the unlocked mechanism.
  const railGeometry = new THREE.BoxGeometry(.12, 1, .16);
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a7859, metalness: .73, roughness: .43, depthTest: true,
  });
  const rails = new THREE.InstancedMesh(railGeometry, railMaterial, RAIL_STEPS * 2);
  rails.name = 'GuardianLockTwinBronzeRails';
  rails.castShadow = false;
  rails.receiveShadow = false;
  rails.frustumCulled = false;
  rails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const conductorGeometry = new THREE.OctahedronGeometry(.22, 0);
  const conductorMaterial = new THREE.MeshBasicMaterial({
    color: 0xffbd75, transparent: true, opacity: .42,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const conductors = new THREE.InstancedMesh(
    conductorGeometry, conductorMaterial, RAIL_STEPS + 1);
  conductors.name = 'GuardianLockHealthConductor';
  conductors.castShadow = false;
  conductors.frustumCulled = false;
  conductors.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const terminalGeometry = new THREE.TorusGeometry(.82, .09, 6, 24);
  const terminalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb18e65, metalness: .76, roughness: .38,
  });
  const atGuardian = new THREE.Mesh(terminalGeometry, terminalMaterial);
  const atGate = new THREE.Mesh(terminalGeometry, terminalMaterial);
  atGuardian.name = 'GuardianLockGuardianAnchor';
  atGate.name = 'GuardianLockCapAnchor';
  atGuardian.castShadow = atGate.castShadow = false;
  group.add(rails, conductors, atGuardian, atGate);
  const pose = new THREE.Object3D();
  const start = new THREE.Vector3(), finish = new THREE.Vector3();
  const middle = new THREE.Vector3(), tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const dark = new THREE.Color(0xffbd75), released = new THREE.Color(0x8ef1d2);
  let source = null, disposed = false;
  let lastKey = '';
  function clear() {
    group.visible = false;
    source = null;
    lastKey = '';
    rails.count = 0;
    conductors.count = 0;
  }
  function mapped(item, t, offset = 0) {
    const x = item.fromX + (item.toX - item.fromX) * t;
    // This restrained physical sag makes a real spanning mechanism. It
    // doesn't predict a jump, beam attack or imaginary gate animation.
    const y = item.fromY + (item.toY - item.fromY) * t -
      Math.sin(Math.PI * t) * 9000 + offset;
    const radius = 27.75 - 1.35 * t;
    return pointFor(x, y, item.baseY, item.width, radius);
  }
  function update(snapshot, options = {}) {
    if (disposed) return;
    const next = !options.stale ? observedGuardianCircuit(snapshot) : null;
    if (!next) { clear(); return; }
    const key = [next.runToken, next.floor, next.tick, next.guardianId,
      next.fromX, next.fromY, next.toX, next.toY, next.health,
      next.telegraph, next.remainingChargeTicks, !!options.reducedMotion].join(':');
    if (key === lastKey) return;
    lastKey = key;
    source = next;
    const opening = next.openedFraction;
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
        pose.position.copy(start).add(finish).multiplyScalar(.5);
        pose.quaternion.setFromUnitVectors(up, tangent.clone().normalize());
        pose.scale.set(1 + opening * .55, Math.max(.01, tangent.length() * .98), 1);
        pose.updateMatrix();
        const slot = (side < 0 ? 0 : RAIL_STEPS) + index;
        rails.setMatrixAt(slot, pose.matrix);
      }
    }
    rails.count = RAIL_STEPS * 2;
    rails.instanceMatrix.needsUpdate = true;
    conductorMaterial.color.copy(dark).lerp(released, opening);
    conductorMaterial.opacity = .25 + opening * .43;
    for (let index = 0; index <= RAIL_STEPS; index++) {
      const t = index / RAIL_STEPS, point = mapped(next, t);
      pose.position.set(point.x, point.y, point.z);
      pose.quaternion.identity();
      const scale = .6 + opening * 1.22 +
        (!options.reducedMotion && next.telegraph ? .16 * (1 - t) : 0);
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
      maxExtraDraws: 4, shadowCastingMeshes: 0,
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
    railMaterial.dispose();
    conductorGeometry.dispose();
    conductorMaterial.dispose();
    terminalGeometry.dispose();
    terminalMaterial.dispose();
  }
  return { group, update, clear, diagnostics, dispose };
}
