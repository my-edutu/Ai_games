// Original terminal memorial sculpture for an ACTUAL ended autonomous run.
// An ending is not a win: the visual color, collapsing crown and stones express
// the source result reason. No physics, replay state or collision is invented.
export function createTowerFinale(THREE) {
  const group = new THREE.Group();
  group.name = 'ObservedExpeditionFinale';
  group.visible = false;
  const makeMaterial = (opacity) => new THREE.MeshBasicMaterial({
    color: 0xe88779, transparent: true, opacity,
    blending: THREE.NormalBlending, side: THREE.DoubleSide,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const ringMaterial = makeMaterial(.64), crownMaterial = makeMaterial(.42);
  const shardMaterial = makeMaterial(.88), stoneMaterial = makeMaterial(.48);
  const ringGeometry = new THREE.TorusGeometry(2.65, .087, 6, 52);
  const crownGeometry = new THREE.TorusGeometry(1.72, .067, 6, 44, Math.PI * 1.64);
  const fragmentGeometry = new THREE.TetrahedronGeometry(.19, 0);
  const stoneGeometry = new THREE.CylinderGeometry(.11, .28, 1.9, 5, 1);
  const ground = new THREE.Mesh(ringGeometry, ringMaterial);
  ground.name = 'ObservedTerminalGroundWave';
  ground.rotation.x = Math.PI / 2;
  ground.position.y = .12;
  const crown = new THREE.Mesh(crownGeometry, crownMaterial);
  crown.name = 'ObservedFallenExpeditionCrown';
  crown.position.y = 2.9;
  crown.rotation.set(.28, .22, -.55);
  const fragments = new THREE.InstancedMesh(fragmentGeometry, shardMaterial, 28);
  fragments.name = 'ObservedShatteredRoute';
  const stones = new THREE.InstancedMesh(stoneGeometry, stoneMaterial, 12);
  stones.name = 'ObservedInterruptedAscent';
  for (const instances of [fragments, stones]) {
    instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instances.frustumCulled = false;
    instances.castShadow = false;
    instances.receiveShadow = false;
  }
  group.add(ground, crown, fragments, stones);
  const transform = new THREE.Object3D();
  let run = null, phase = 'running', sourceTick = -1, startedAt = 0;
  let kind = null, reason = null, disposed = false;
  const tau = 2 * Math.PI;
  const clamp = value => Math.max(0, Math.min(1, value));
  function colorFor(result) {
    if (result.kind === 'technical') return 0x77d8d2;
    if (result.kind === 'operator') return 0xb0a6e8;
    if (result.reason === 'timer-expired') return 0xffc27a;
    if (result.reason === 'stagnation') return 0x9eacc1;
    if (result.reason === 'health-depleted') return 0xf17c97;
    return 0xf48670;
  }
  function update(snapshot, hero, elapsed, options = {}) {
    if (disposed) return;
    const valid = snapshot && snapshot.result
      && (snapshot.lifecycle === 'result' || snapshot.lifecycle === 'intermission')
      && typeof snapshot.runToken === 'string' && snapshot.runToken.length > 0
      && Number.isSafeInteger(snapshot.tick)
      && ['game', 'technical', 'operator'].includes(snapshot.result.kind);
    if (!valid) {
      group.visible = false; run = null; phase = 'running'; sourceTick = -1;
      kind = null; reason = null;
      return;
    }
    if (run !== snapshot.runToken) { run = snapshot.runToken; startedAt = elapsed; }
    phase = snapshot.lifecycle;
    sourceTick = snapshot.tick;
    kind = snapshot.result.kind;
    reason = snapshot.result.reason;
    group.visible = true;
    // A real fall may end below a walkway. Remain at that exact actor position,
    // rather than projecting an unearned landing or teleporting to a safe deck.
    group.position.copy(hero);
    const age = Math.max(0, Math.min(6, elapsed - startedAt));
    const stopped = options.reducedMotion || options.stale;
    const motion = stopped ? 0 : age;
    const arrive = stopped ? 1 : clamp(age / .7);
    const decline = stopped ? .55 : clamp((age - .35) / 2.6);
    const resultColor = colorFor(snapshot.result);
    for (const material of [ringMaterial, crownMaterial, shardMaterial, stoneMaterial]) {
      material.color.setHex(resultColor);
    }
    // The ring expands like a shock wave, never a victory pedestal.
    ground.scale.setScalar(.82 + arrive * .22 + (stopped ? 0 : .16 * clamp(age / 3)));
    ground.material.opacity = .62 * (1 - .28 * decline);
    crown.scale.setScalar(1.08 - .22 * decline);
    crown.position.y = 2.9 - decline * 1.4;
    crown.rotation.set(.28 + decline * .55, .22 + motion * .14, -.55 - decline * .9);
    crown.material.opacity = .56 * (1 - .4 * decline);
    for (let i = 0; i < stones.count; i++) {
      const angle = tau * i / stones.count + .15;
      const radius = 3.4 + .42 * (i % 3);
      const height = .9 + (i % 4) * .26;
      const collapse = decline * (i % 2 === 0 ? .38 : -.27);
      transform.position.set(Math.cos(angle) * radius, height - decline * .35,
        Math.sin(angle) * radius);
      transform.rotation.set(.1 + Math.sin(angle) * collapse, angle, Math.cos(angle) * collapse);
      transform.scale.set(.78, .75 + (i % 3) * .2, .78);
      transform.updateMatrix();
      stones.setMatrixAt(i, transform.matrix);
    }
    for (let i = 0; i < fragments.count; i++) {
      const angle = i * 2.399963229728653;
      const radius = 1.2 + (i % 5) * .32 + motion * .13;
      const rise = (i % 11) * .34;
      const descent = decline * (1.25 + .17 * (i % 5));
      transform.position.set(Math.cos(angle + motion * .13) * radius,
        .64 + rise + (stopped ? 0 : Math.sin(Math.min(age, 2) * 1.3 + i * .7) * .22) - descent,
        Math.sin(angle + motion * .13) * radius);
      transform.rotation.set(i * .15 + motion * .2, angle, i * .12 + motion * .24);
      transform.scale.setScalar(.55 + .18 * (i % 4));
      transform.updateMatrix();
      fragments.setMatrixAt(i, transform.matrix);
    }
    stones.instanceMatrix.needsUpdate = true;
    fragments.instanceMatrix.needsUpdate = true;
  }
  function diagnostics() {
    return { sourceBound: true, active: group.visible, lifecycle: phase,
      runToken: group.visible ? run : null, tick: sourceTick,
      resultKind: group.visible ? kind : null,
      resultReason: group.visible ? reason : null,
      meshes: 4, fragments: fragments.count, stones: stones.count,
      geometryOwned: 4, disposed };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    group.clear();
    for (const geometry of [ringGeometry, crownGeometry, fragmentGeometry, stoneGeometry]) geometry.dispose();
    for (const material of [ringMaterial, crownMaterial, shardMaterial, stoneMaterial]) material.dispose();
  }
  return { group, update, diagnostics, dispose };
}
