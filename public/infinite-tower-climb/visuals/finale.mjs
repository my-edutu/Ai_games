// Original in-world result tableau for the real autonomous expedition.
// Never decides an outcome: only a terminal/intermission source snapshot with
// an authoritative result may activate it. No collision geometry or HUD copy.
export function createTowerFinale(THREE) {
  const group = new THREE.Group();
  group.name = 'ObservedExpeditionFinale';
  group.visible = false;
  const material = new THREE.MeshBasicMaterial({
    color: 0xf1d5a0, transparent: true, opacity: .65,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const traceMaterial = material.clone();
  traceMaterial.opacity = .42;
  const fragmentMaterial = material.clone();
  fragmentMaterial.opacity = .8;
  const groundGeometry = new THREE.TorusGeometry(2.15, .052, 5, 48);
  const crownGeometry = new THREE.TorusGeometry(1.65, .038, 5, 48);
  const fragmentGeometry = new THREE.TetrahedronGeometry(.17, 0);
  const ground = new THREE.Mesh(groundGeometry, material);
  ground.name = 'RealResultGroundEcho';
  ground.rotation.x = Math.PI / 2;
  ground.position.y = .16;
  const crown = new THREE.Mesh(crownGeometry, traceMaterial);
  crown.name = 'RealResultVerticalHalo';
  crown.position.y = 2.08;
  crown.rotation.y = .26;
  const fragments = new THREE.InstancedMesh(fragmentGeometry, fragmentMaterial, 28);
  fragments.name = 'RealResultAscentFragments';
  fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fragments.frustumCulled = false;
  fragments.castShadow = false;
  fragments.receiveShadow = false;
  group.add(ground, crown, fragments);
  const transform = new THREE.Object3D();
  let run = null, phase = 'running', sourceTick = -1, startedAt = 0, disposed = false;
  const tau = Math.PI * 2;
  const clamp = value => Math.max(0, Math.min(1, value));
  function update(snapshot, hero, elapsed, options = {}) {
    if (disposed) return;
    const valid = snapshot && snapshot.result
      && (snapshot.lifecycle === 'result' || snapshot.lifecycle === 'intermission')
      && typeof snapshot.runToken === 'string' && snapshot.runToken.length > 0
      && Number.isSafeInteger(snapshot.tick);
    if (!valid) {
      group.visible = false; run = null; phase = 'running'; sourceTick = -1;
      return;
    }
    if (run !== snapshot.runToken) { run = snapshot.runToken; startedAt = elapsed; }
    phase = snapshot.lifecycle;
    sourceTick = snapshot.tick;
    group.visible = true;
    // Place the visual exactly at the source actor, including an airborne
    // terminal position; do not invent a landing, floor or successful climb.
    group.position.copy(hero);
    const age = Math.max(0, Math.min(5, elapsed - startedAt));
    const motion = options.reducedMotion || options.stale ? 0 : age;
    const arrival = options.reducedMotion ? 1 : clamp(age * 1.7);
    const tint = snapshot.result.kind === 'technical' ? 0x86d8d1 : 0xf1d5a0;
    material.color.setHex(tint);
    traceMaterial.color.setHex(tint);
    fragmentMaterial.color.setHex(tint);
    ground.scale.setScalar(.82 + arrival * .22);
    ground.material.opacity = .60;
    crown.scale.setScalar(.92 + arrival * .15);
    crown.rotation.y = .26 + motion * .28;
    crown.material.opacity = .35 + .12 * Math.sin(motion * 1.8);
    for (let i = 0; i < fragments.count; i++) {
      // Golden-angle placement gives a deliberate, repeatable 3D column rather
      // than random particles; instance transforms are bounded and reused.
      const angle = i * 2.399963229728653;
      const r = 1.13 + (i % 5) * .23;
      const rise = (i % 11) * .39 + (motion ? (motion * (.24 + (i % 3) * .05)) % 2.2 : 0);
      transform.position.set(Math.cos(angle + motion * .10) * r, .5 + rise,
        Math.sin(angle + motion * .10) * r);
      transform.rotation.set(.15 * i, angle, .12 * i + motion * .28);
      transform.scale.setScalar(.55 + .28 * (i % 4));
      transform.updateMatrix();
      fragments.setMatrixAt(i, transform.matrix);
    }
    fragments.instanceMatrix.needsUpdate = true;
  }
  function diagnostics() {
    return { sourceBound: true, active: group.visible, lifecycle: phase,
      runToken: group.visible ? run : null, tick: sourceTick,
      meshes: 3, fragments: fragments.count, geometryOwned: 3, disposed };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    group.clear();
    for (const g of [groundGeometry, crownGeometry, fragmentGeometry]) g.dispose();
    for (const m of [material, traceMaterial, fragmentMaterial]) m.dispose();
  }
  return { group, update, diagnostics, dispose };
}
