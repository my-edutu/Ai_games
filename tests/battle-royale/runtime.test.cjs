const test = require('node:test');
const assert = require('node:assert/strict');
const { BattleRoyaleRuntime } = require('../../dist/games/ai-battle-royale/src/runtime.js');

test('authority exists and validates finite bounded configuration', () => {
  assert.equal(typeof BattleRoyaleRuntime, 'function');
  for (const options of [{ agentCount: 0 }, { agentCount: null }, { agentCount: 13 }, { matchTicks: NaN }, { matchTicks: Infinity }, { intermissionTicks: -1 }]) {
    assert.throws(() => new BattleRoyaleRuntime('bounds', options));
  }
  assert.throws(() => new BattleRoyaleRuntime(''));
});
test('identical seed, immutable independent snapshots, exact checkpoint continuation', () => {
  const a = new BattleRoyaleRuntime('replay');
  const b = new BattleRoyaleRuntime('replay');
  for (let i = 0; i < 1200; i++) { a.step(); b.step(); }
  assert.deepEqual(a.checkpoint(), b.checkpoint());
  const view = a.snapshot();
  assert.ok(Object.isFrozen(view) && Object.isFrozen(view.agents[0]));
  const saved = a.checkpoint();
  assert.ok(Object.isFrozen(saved));
  const restored = BattleRoyaleRuntime.restore(JSON.parse(JSON.stringify(saved)));
  for (let i = 0; i < 1500; i++) { a.step(); restored.step(); }
  assert.deepEqual(a.checkpoint(), restored.checkpoint());
  assert.equal(view.tick, saved.state.tick);
  assert.notEqual(a.snapshot(), a.snapshot());
  const corrupt = JSON.parse(JSON.stringify(saved)); corrupt.state.agents[0].hp = 900;
  assert.throws(() => BattleRoyaleRuntime.restore(corrupt));
  const version = JSON.parse(JSON.stringify(saved)); version.version = 99;
  assert.throws(() => BattleRoyaleRuntime.restore(version));
});
test('collision, real action, truthful results, bounded events and automatic rollover across seeds', () => {
  for (let seed = 0; seed < 6; seed++) {
    const runtime = new BattleRoyaleRuntime('campaign-' + seed, { matchTicks: 2400, intermissionTicks: 20 });
    let results = 0, firing = false, previousPhase = '', match = 1;
    for (let i = 0; i < 5400; i++) {
      runtime.step();
      if (i % 20) continue;
      const s = runtime.snapshot();
      firing ||= s.agents.some(a => a.fireTick > 0);
      assert.ok(s.events.length <= 80);
      assert.equal(s.remaining, s.agents.filter(a => a.alive).length);
      for (const a of s.agents) {
        assert.ok(Number.isFinite(a.x) && Number.isFinite(a.z));
        for (const o of [...s.map.buildings, ...s.map.covers]) {
          assert.ok(Math.abs(a.x-o.x) >= o.w/2 + .44 || Math.abs(a.z-o.z) >= o.d/2 + .44, `${seed}: ${a.id} penetrates ${o.id}`);
        }
      }
      if (s.phase === 'intermission' && previousPhase !== 'intermission') {
        results++;
        assert.ok(s.remaining <= 1);
        assert.equal(s.winner, s.agents.find(a => a.alive)?.id ?? null);
      }
      previousPhase = s.phase;
      match = Math.max(match, s.matchId);
    }
    assert.ok(firing, 'actual weapons fire');
    assert.ok(results >= 2 && match >= 3, 'multiple matches resolve and restart');
  }
});

test('swept collision and weapon LOS share rectangular solids; paths route around uplink', () => {
  const { clearSegment, route, moveAlong, walkable } = require('../../dist/games/ai-battle-royale/src/world.js');
  assert.equal(clearSegment({ x: -8, z: 0 }, { x: 8, z: 0 }), false);
  assert.equal(clearSegment({ x: -8, z: 8 }, { x: 8, z: 8 }), true);
  const p = { x: -8, z: 0 }, path = route(p, { x: 8, z: 0 });
  assert.ok(path.length > 1);
  for (let i = 0; i < 300 && path.length; i++) { moveAlong(p, path, .28); assert.ok(walkable(p)); }
  assert.ok(Math.hypot(p.x - 8, p.z) < .02);
});
test('rehashing corrupt checkpoints cannot bypass invariant validation', () => {
  const { checksum } = require('../../dist/packages/replay/src/index.js');
  const r = new BattleRoyaleRuntime('adversarial');
  for (let i = 0; i < 500; i++) r.step();
  for (const mutate of [
    c => { c.state.agents[0].hp = 900; },
    c => { c.state.agents[0].x = 0; c.state.agents[0].z = 0; },
    c => { c.state.agents[0].path = Array(200).fill({ x: 5, z: 5 }); },
    c => { c.state.phase = 'intermission'; },
    c => { c.rng.streams.combat = 0; },
    c => { c.state.agents[0].weapon = '__proto__'; },
  ]) {
    const c = JSON.parse(JSON.stringify(r.checkpoint())); mutate(c);
    const { checksum: ignored, ...payload } = c; c.checksum = checksum(payload);
    assert.throws(() => BattleRoyaleRuntime.restore(c));
  }
});

test('fully closed storm yields a truthful draw even for overlapping center survivors', () => {
  const { checksum } = require('../../dist/packages/replay/src/index.js');
  const r = new BattleRoyaleRuntime('zero-radius', { agentCount: 2, matchTicks: 200, intermissionTicks: 20 });
  for (let i = 0; i < 259; i++) r.step();
  const c = JSON.parse(JSON.stringify(r.checkpoint()));
  // Legal, recomputed fixture puts both surviving actors exactly at the final safe center.
  c.state.tick = 259; c.state.phaseTicks = 0; c.state.phase = 'running'; c.state.winner = null;
  for (const a of c.state.agents) {
    a.x = 7; a.z = 7; a.hp = 100; a.shield = 75; a.alive = true;
    a.path = []; a.goal = { x: 7, z: 7 }; a.action = 'healing'; a.busyUntil = 300;
  }
  const { checksum: ignored, ...payload } = c; c.checksum = checksum(payload);
  const restored = BattleRoyaleRuntime.restore(c); restored.step();
  const s = restored.snapshot();
  assert.equal(s.phase, 'intermission'); assert.equal(s.remaining, 0); assert.equal(s.winner, null);
});

test('initial yaw is normalized and every boundary spawn restores', () => {
  for (let i = 0; i < 12; i++) {
    const r = new BattleRoyaleRuntime('boundary-' + i);
    assert.deepEqual(BattleRoyaleRuntime.restore(r.checkpoint()).checkpoint(), r.checkpoint());
    assert.ok(r.snapshot().agents.every(a => Math.abs(a.yaw) <= Math.PI));
  }
});
test('restore rejects healing without medkits or a live action timer', () => {
  const { checksum } = require('../../dist/packages/replay/src/index.js');
  const r = new BattleRoyaleRuntime('heal-corruption');
  for (let i = 0; i < 100; i++) r.step();
  for (const change of [a => { a.medkits = 0; }, a => { a.busyUntil = 0; }]) {
    const c = JSON.parse(JSON.stringify(r.checkpoint()));
    const a = c.state.agents.find(a => a.alive);
    a.action = 'healing'; a.busyUntil = c.state.tick + 1; a.nextDecision = c.state.tick + 8;
    change(a);
    const { checksum: ignored, ...payload } = c; c.checksum = checksum(payload);
    assert.throws(() => BattleRoyaleRuntime.restore(c));
  }
});

function rehashedMutation(checkpoint, mutate) {
  const { checksum } = require('../../dist/packages/replay/src/index.js');
  const c = JSON.parse(JSON.stringify(checkpoint)); mutate(c);
  const { checksum: ignored, ...payload } = c; c.checksum = checksum(payload);
  return c;
}

test('strict restore rejects unknown fields and oversized strings throughout nested schemas', () => {
  const r = new BattleRoyaleRuntime('strict-schema'); const checkpoint = r.checkpoint();
  for (const mutate of [
    c => { c.state.agents[0].unexpected = 'x'.repeat(1_000_000); },
    c => { c.state.loot[0].id = 'x'.repeat(1_000_000); },
    c => { c.unexpected = 1; }, c => { c.state.unexpected = 1; },
    c => { c.config.unexpected = 1; }, c => { c.rng.unexpected = 1; },
    c => { c.state.zone.unexpected = 1; }, c => { c.state.loot[0].unexpected = 1; },
    c => { c.state.events[0].unexpected = 1; }, c => { c.state.agents[0].goal.unexpected = 1; },
    c => { c.state.events[0].kind = 'invented'; },
    c => { c.rng.streams['x'.repeat(200)] = 123; },
    c => { c.state.loot[0].id = 'invented'; },
    c => { c.state.agents[0].weapon = ['Pulse Rifle']; },
  ]) assert.throws(() => BattleRoyaleRuntime.restore(rehashedMutation(checkpoint, mutate)));
});

test('strict restore cross-checks living, dead, countdown, firing, timer and zone lifecycle fields', () => {
  const r = new BattleRoyaleRuntime('strict-lifecycle', { matchTicks: 200, intermissionTicks: 20 });
  const initial = r.checkpoint();
  for (const mutate of [
    c => { c.state.agents[0].action = 'eliminated'; },
    c => { c.state.agents[0].action = 'firing'; },
    c => { c.state.phaseTicks = 1; },
    c => { c.state.zone.radius = 1; },
  ]) assert.throws(() => BattleRoyaleRuntime.restore(rehashedMutation(initial, mutate)));
  for (let i = 0; i < 100; i++) r.step();
  const running = r.checkpoint();
  for (const mutate of [
    c => { c.state.agents[0].action = 'eliminated'; },
    c => { c.state.phaseTicks = 1; },
    c => { c.state.tick = 260; },
    c => { c.state.zone.radius = 1; },
    c => { c.state.zone.x = 8; },
    c => { c.state.agents[0].action = 'firing'; c.state.agents[0].fireTick = -100; },
  ]) assert.throws(() => BattleRoyaleRuntime.restore(rehashedMutation(running, mutate)));
  while (r.snapshot().phase !== 'intermission') r.step();
  const ended = r.checkpoint();
  for (const action of ['healing', 'firing', 'idle']) {
    assert.throws(() => BattleRoyaleRuntime.restore(rehashedMutation(ended, c => {
      const a = c.state.agents.find(a => !a.alive); a.action = action; a.medkits = 0; a.busyUntil = 0;
    })));
  }
});

test('strict restore preserves genuine checkpoints across countdown, combat and three match boundaries', () => {
  const r = new BattleRoyaleRuntime('strict-valid', { matchTicks: 200, intermissionTicks: 20 });
  let restoredCount = 0;
  for (let i = 0; i < 850; i++) {
    if (i % 3 === 0) {
      const checkpoint = r.checkpoint();
      assert.deepEqual(BattleRoyaleRuntime.restore(checkpoint).checkpoint(), checkpoint); restoredCount++;
    }
    r.step();
  }
  assert.ok(restoredCount > 280); assert.ok(r.snapshot().matchId >= 4);
  const publicKeys = ['id','name','archetype','color','x','z','yaw','hp','shield','kills','alive','weapon','ammo','intent','action','hitTick','fireTick','targetId'];
  assert.deepEqual(Object.keys(r.snapshot().agents[0]).sort(), publicKeys.sort());
});
