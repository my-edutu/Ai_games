import test from 'node:test';
import assert from 'node:assert/strict';
import { survivorPose, zombiePose, districtPalette, createGame, stepGame } from '../dist/index.js';

test('survivor presentation maps authoritative action to readable pose', () => {
  assert.equal(survivorPose({ action:'attack', health:100, stamina:80 }).stance, 'weapon-forward');
  assert.equal(survivorPose({ action:'repair', health:100, stamina:80 }).stance, 'working');
  assert.equal(survivorPose({ action:'move', health:14, stamina:80 }).stance, 'limp');
});

test('zombie presentation varies by action and variant', () => {
  assert.equal(zombiePose({ action:'pursue', variant:3 }).stance, 'lunge');
  assert.notEqual(zombiePose({ action:'wander', variant:1 }).cadence, zombiePose({ action:'wander', variant:5 }).cadence);
});

test('districts have distinct grounded palettes', () => {
  assert.notDeepEqual(districtPalette('medical'), districtPalette('industrial'));
  assert.notDeepEqual(districtPalette('residential'), districtPalette('civic'));
});

test('250-zombie stress scenario remains finite through sustained simulation', () => {
  let game = createGame({seed:2026,zombieCount:250});
  for (let i=0;i<900;i++) game=stepGame(game,1/30);
  for (const z of game.zombies) {
    assert.ok(Number.isFinite(z.x) && Number.isFinite(z.y));
  }
  assert.ok(game.events.length <= 160);
});
