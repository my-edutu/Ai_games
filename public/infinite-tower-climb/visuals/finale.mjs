// Original terminal memorial sculpture for an ACTUAL ended autonomous run.
// An ending is not a win: the visual color, collapsing crown and stones express
// the source result reason. No physics, replay state or collision is invented.
export function createTowerFinale(THREE) {
  const group = new THREE.Group();
  group.name = 'ObservedExpeditionFinale';
  group.visible = false;
  // Original normal-speed native outcome video (41511922895) revealed a
  // floating thicket of luminous pink linework around a real health-depleted
  // climber. Give the same source-earned physical memorial a material identity:
  // weathered ceramic/metal receiving actual biome illumination, not unlit
  // emissive debug glyphs that overpower the actual skinned ending. No GPU
  // pass, light, geometry allocation per frame or collision is introduced.
  const makeMaterial = (opacity, metalness, roughness) => new THREE.MeshStandardMaterial({
    color: 0x9b6657, metalness, roughness, transparent: true, opacity,
    emissive: 0x231716, emissiveIntensity: .1,
    blending: THREE.NormalBlending, side: THREE.DoubleSide,
    depthTest: true, depthWrite: false, toneMapped: true,
  });
  const ringMaterial = makeMaterial(.64, .34, .56);
  const crownMaterial = makeMaterial(.52, .36, .60);
  const shardMaterial = makeMaterial(.86, .20, .68);
  const stoneMaterial = makeMaterial(.88, .08, .84);
  // A quiet architectural scorecard for actually CLEARED source floors. Eight
  // bronze/ceramic rungs cap the draw budget; short dormant stubs never suggest
  // that a future floor was beaten. This is not a reward, prize or extra HUD.
  const rungMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: .52, roughness: .4,
    depthTest: true, depthWrite: true,
  });
  const earnedRung = new THREE.Color(0xa2ddca);
  const dormantRung = new THREE.Color(0x44505a);
  const ringGeometry = new THREE.TorusGeometry(2.65, .087, 6, 52);
  const crownGeometry = new THREE.TorusGeometry(1.72, .067, 6, 44, Math.PI * 1.64);
  const fragmentGeometry = new THREE.TetrahedronGeometry(.19, 0);
  // Compact broken capstones, not tall bright sticks masking the corpse and
  // real hazard. Reuse this geometry for the eight authoritative earned rungs.
  const stoneGeometry = new THREE.CylinderGeometry(.25, .42, .86, 6, 1);
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
  const rungs = new THREE.InstancedMesh(stoneGeometry, rungMaterial, 8);
  rungs.name = 'ObservedClearedFloorRungs';
  rungs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rungs.frustumCulled = false;
  rungs.castShadow = false;
  rungs.receiveShadow = false;
  group.add(ground, crown, fragments, stones, rungs);
  const transform = new THREE.Object3D();
  let run = null, phase = 'running', sourceTick = -1, startedAt = 0;
  let progressedFloors = -1;
  let kind = null, reason = null, disposed = false;
  const tau = 2 * Math.PI;
  const clamp = value => Math.max(0, Math.min(1, value));
  function colorFor(result) {
    if (result.kind === 'technical') return 0x658f8d;
    if (result.kind === 'operator') return 0x897f9b;
    if (result.reason === 'timer-expired') return 0xb89b69;
    if (result.reason === 'stagnation') return 0x808b96;
    if (result.reason === 'health-depleted') return 0xaf655c;
    return 0xb47b65;
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
      kind = null; reason = null; progressedFloors = 0;
      return;
    }
    if (run !== snapshot.runToken) { run = snapshot.runToken; startedAt = elapsed; }
    phase = snapshot.lifecycle;
    sourceTick = snapshot.tick;
    kind = snapshot.result.kind;
    reason = snapshot.result.reason;
    group.visible = true;
    const floorCount = Number.isSafeInteger(snapshot.progress?.floorsCleared)
      ? Math.max(0, Math.min(rungs.count, snapshot.progress.floorsCleared)) : 0;
    if (floorCount !== progressedFloors) {
      // Source-driven once per observed milestone. All instance transforms
      // stay LOCAL to the real terminal actor position through scene shifts.
      for (let i = 0; i < rungs.count; i++) {
        const achieved = i < floorCount;
        const scaleY = achieved ? 1.2 + i * .11 : .15;
        // Two exterior tiers, four rungs across. A full radial ring put the
        // far markers INSIDE the opaque stone core when the dying actor stood
        // on the tower's outer deck; the outcome must remain physically visible.
        const column = i % 4, tier = Math.floor(i / 4);
        transform.position.set((column - 1.5) * 2.45,
          .12 + scaleY * .95, 1.5 + tier * 1.4);
        transform.rotation.set(0, 0, 0);
        transform.scale.set(.82, scaleY, .82);
        transform.updateMatrix();
        rungs.setMatrixAt(i, transform.matrix);
        rungs.setColorAt(i, achieved ? earnedRung : dormantRung);
      }
      rungs.instanceMatrix.needsUpdate = true;
      if (rungs.instanceColor) rungs.instanceColor.needsUpdate = true;
      progressedFloors = floorCount;
    }
    // A real fall may end below a walkway. Remain at that exact actor position,
    // rather than projecting an unearned landing or teleporting to a safe deck.
    group.position.copy(hero);
    // +Z is radial OUT when the group is turned toward the real tower angle.
    // Both milestone rows live outside the collision-aligned core, rather
    // than burying some of the actual cleared-floor evidence inside masonry.
    group.rotation.y = Math.atan2(hero.x, hero.z);
    const age = Math.max(0, Math.min(6, elapsed - startedAt));
    const stopped = options.reducedMotion || options.stale;
    const motion = stopped ? 0 : age;
    const arrive = stopped ? 1 : clamp(age / .7);
    const decline = stopped ? .55 : clamp((age - .35) / 2.6);
    const resultColor = colorFor(snapshot.result);
    for (const material of [ringMaterial, crownMaterial, shardMaterial, stoneMaterial]) {
      material.color.setHex(resultColor);
      // A very low emission floor preserves outcome colors in dark biomes
      // without flattening their roughness or bypassing tone mapping.
      material.emissive.setHex(resultColor).multiplyScalar(.13);
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
      transform.scale.set(.88, .56 + (i % 3) * .16, .88);
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
      transform.scale.setScalar(.45 + .13 * (i % 4));
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
      meshes: 5, fragments: fragments.count, stones: stones.count,
      progressMarkers: rungs.count, progressedFloors: Math.max(0, progressedFloors),
      geometryOwned: 4, disposed };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    group.clear();
    for (const geometry of [ringGeometry, crownGeometry, fragmentGeometry, stoneGeometry]) geometry.dispose();
    for (const material of [ringMaterial, crownMaterial, shardMaterial, stoneMaterial, rungMaterial]) material.dispose();
  }
  return { group, update, diagnostics, dispose };
}
