import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, selectCameraEvent } from '../dist/index.js';

test('camera director prioritizes a critical surrounded survivor', () => {
  const game = createGame({ seed: 71 });
  const survivor = game.survivors[0];
  survivor.health = 8;
  survivor.threat = 0.98;
  const event = selectCameraEvent(game);
  assert.equal(event.mode, 'near-death');
  assert.equal(event.targetId, survivor.id);
});

test('camera director can frame an incoming horde', () => {
  const game = createGame({ seed: 81, zombieCount: 250 });
  for (const zombie of game.zombies) zombie.distanceToSafeHouse = 5;
  const event = selectCameraEvent(game);
  assert.ok(['horde-overview','defense','near-death'].includes(event.mode));
});

test('camera director hysteresis avoids low-value rapid cuts',()=>{const game=createGame({seed:82});const previous={mode:'defense',targetId:game.barricades[0].id,score:.7};assert.equal(selectCameraEvent(game,previous).mode,'defense');});
