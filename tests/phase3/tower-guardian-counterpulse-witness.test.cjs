'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const loaded = import(pathToFileURL(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/airborne-pulse.mjs')).href);
function frame(tick, mode = 'bracing-telegraph') {
  return { runToken: 'source-run', floor: 8, tick, lifecycle: 'running',
    player: { state: 'standing', x: 170000, y: 320000, health: 4, facing: -1 },
    intent: { mode }, projectiles: [],
    enemies: [{ id: 'guardian-8', kind: 'guardian', active: true,
      telegraph: true, telegraphTicksRemaining: 6, health: 8,
      x: 110000, y: 320000, halfHeight: 18000 }],
  };
}
const shot = (id = 'hero:projectile:21:0') =>
  ({ id, owner: 'player', x: 155000, y: 320000, vx: -14000 });

test('only a real new source projectile within live guardian charge earns planted recoil', async () => {
  const { witnessedGuardianCounterPulse: witness } = await loaded;
  const previous = frame(20), next = frame(21); next.projectiles = [shot()];
  const unchanged = JSON.stringify({ previous, next });
  assert.deepEqual(witness(previous, next), {
    runToken: next.runToken, floor: 8, tick: 21,
    projectileId: shot().id, guardianId: 'guardian-8', facing: -1,
  });
  assert.equal(JSON.stringify({ previous, next }), unchanged);
  previous.projectiles = [shot()];
  assert.equal(witness(previous, next), null, 'repeated shot must never animate as new');
});

test('a charge, unlocked ability or intent without a real fired shot is not a counter', async () => {
  const { witnessedGuardianCounterPulse: witness } = await loaded;
  const previous = frame(20), next = frame(21);
  assert.equal(witness(previous, next), null, 'intent alone is not a fired bolt');
  next.projectiles = [shot()];
  const noIntent = frame(21, 'aligning'); noIntent.projectiles = [shot()];
  assert.equal(witness(previous, noIntent), null);
  next.enemies[0].telegraph = false;
  assert.equal(witness(previous, next), null);
  next.enemies[0].telegraph = true;
  next.enemies[0].telegraphTicksRemaining = 2;
  assert.equal(witness(previous, next), null);
  next.enemies[0].telegraphTicksRemaining = 6;
  next.enemies[0].y += 95000;
  assert.equal(witness(previous, next), null);
});

test('stale, changed-run, wrong-owner, reversed, midair or impossible shots cannot replay pose', async () => {
  const { witnessedGuardianCounterPulse: witness } = await loaded;
  const previous = frame(20), next = frame(21); next.projectiles = [shot()];
  const bad = (edit) => { const altered = structuredClone(next); edit(altered); assert.equal(witness(previous, altered), null); };
  bad(s => { s.runToken = 'another'; });
  bad(s => { s.floor++; });
  bad(s => { s.tick = 40; });
  bad(s => { s.projectiles[0].owner = 'enemy'; });
  bad(s => { s.projectiles[0].vx = 14000; });
  bad(s => { s.projectiles[0].y = 340000; });
  bad(s => { s.player.state = 'airborne'; });
  bad(s => { s.enemies[0].kind = 'shooter'; });
  bad(s => { s.enemies[0].x = 250000; });
  bad(s => { s.lifecycle = 'result'; });
  assert.equal(witness(null, next), null);
});
