import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, applyViewerInfluence, makeRenderSnapshot } from '../dist/index.js';

test('same seed produces deterministic authoritative state', () => {
  let a = createGame({ seed: 4242 });
  let b = createGame({ seed: 4242 });
  for (let i = 0; i < 240; i++) { a = stepGame(a, 1 / 30); b = stepGame(b, 1 / 30); }
  assert.deepEqual(a, b);
});

test('survivor intent is expressed as a physical action state', () => {
  let game = createGame({ seed: 7 });
  for (let i = 0; i < 120; i++) game = stepGame(game, 1 / 30);
  const actions = new Set(game.survivors.map((s) => s.action));
  assert.ok([...actions].some((action) => ['move','scavenge','aim','attack','repair','retreat','heal','rescue'].includes(action)));
});

test('zombie spawn positions are spatially separated', () => {
  const game = createGame({ seed: 11, zombieCount: 80 });
  for (let i = 0; i < game.zombies.length; i++) {
    for (let j = i + 1; j < game.zombies.length; j++) {
      const a = game.zombies[i]; const b = game.zombies[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      assert.ok(d > 0.08, `zombies ${a.id}/${b.id} overlapped at ${d}`);
    }
  }
});

test('zombies damage barricades while survivors can repair them', () => {
  let game = createGame({ seed: 21, zombieCount: 120 });
  const initial = game.barricades.reduce((n, b) => n + b.hp, 0);
  for (let i = 0; i < 1800; i++) game = stepGame(game, 1 / 30);
  const final = game.barricades.reduce((n, b) => n + b.hp, 0);
  assert.notEqual(final, initial);
  assert.ok(game.events.some((e) => e.type === 'barricade-hit' || e.type === 'barricade-repair'));
});

test('day night cycle changes phase', () => {
  let game = createGame({ seed: 31 });
  const start = game.time.phase;
  for (let i = 0; i < 30 * 150; i++) game = stepGame(game, 1 / 30);
  assert.notEqual(game.time.phase, start);
});

test('viewer influence is bounded and never guarantees an outcome', () => {
  const game = createGame({ seed: 51 });
  const influenced = applyViewerInfluence(game, { type: 'supply-drop', magnitude: 999, id: 'evt-1' });
  assert.ok(influenced.resources.food - game.resources.food <= 12);
  assert.equal(influenced.status, 'running');
  assert.ok(influenced.audit.some((a) => a.externalId === 'evt-1'));
});

test('render snapshot is detached from authoritative state', () => {
  const game = createGame({ seed: 61 });
  const snapshot = makeRenderSnapshot(game);
  assert.notEqual(snapshot, game);
  assert.notEqual(snapshot.survivors, game.survivors);
  const original = game.survivors[0].x;
  snapshot.survivors[0].x += 10;
  assert.equal(game.survivors[0].x, original);
});

test('close zombie attacks increase infection while causing injury', () => {
  let game=createGame({seed:91,zombieCount:1,survivorCount:1});
  game.zombies[0].x=game.survivors[0].x+0.2; game.zombies[0].y=game.survivors[0].y;
  const before=game.survivors[0].infection;
  for(let i=0;i<30;i++) game=stepGame(game,1/30);
  assert.ok(game.survivors[0].infection>before);
  assert.ok(game.survivors[0].health<100);
});

test('long running session spawns deterministic replacement hordes', () => {
  let game=createGame({seed:101,zombieCount:0,survivorCount:6});
  for(let i=0;i<30*46;i++) game=stepGame(game,1/30);
  assert.ok(game.zombies.length>=18);
  assert.ok(game.events.some(e=>e.type==='horde'));
});

test('authoritative tick ignores presentation frame delta', () => {
  let a=createGame({seed:111,zombieCount:40});
  let b=createGame({seed:111,zombieCount:40});
  for(let i=0;i<120;i++){a=stepGame(a,1/15);b=stepGame(b,1/60);}
  assert.deepEqual(a,b);
});
