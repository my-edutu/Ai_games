'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CueScheduler } = require('../../dist/games/autonomous-snake/src/presentation/cues.js');
const { AudioDirector } = require('../../dist/games/autonomous-snake/src/presentation/audio.js');
const { ReplayBuffer } = require('../../dist/games/autonomous-snake/src/presentation/replay.js');
const { CameraDirector } = require('../../dist/games/autonomous-snake/src/presentation/camera.js');

test('VFX scheduler enforces semantic priority, dedupe, expiry and reduced modes', () => {
  const scheduler = new CueScheduler({ maxActive: 3, reducedMotion: true, reducedFlash: true });
  scheduler.push({ id: 'ambient', kind: 'ambient', priority: 1, tick: 10, durationTicks: 20 });
  scheduler.push({ id: 'food', kind: 'collect', priority: 40, tick: 10, durationTicks: 8 });
  scheduler.push({ id: 'danger', kind: 'danger', priority: 90, tick: 10, durationTicks: 10 });
  scheduler.push({ id: 'result', kind: 'result', priority: 100, tick: 10, durationTicks: 24 });
  scheduler.push({ id: 'result', kind: 'result', priority: 100, tick: 10, durationTicks: 24 });

  const active = scheduler.active(10);
  assert.deepEqual(active.map(cue => cue.id), ['result', 'danger', 'food']);
  assert.equal(active.every(cue => cue.motionScale <= 0.35), true);
  assert.equal(active.every(cue => cue.flashScale <= 0.25), true);
  assert.equal(scheduler.active(35).length, 0);
});

test('audio director steals low-priority voices and retains captions when muted', () => {
  const director = new AudioDirector({ maxVoices: 2, muted: true, musicMinimumDwellTicks: 12 });
  director.submit({ id: 'move', kind: 'movement', priority: 10, caption: '' , tick: 1, cooldownTicks: 2 });
  director.submit({ id: 'danger', kind: 'danger', priority: 90, caption: 'Danger', tick: 1, cooldownTicks: 4 });
  director.submit({ id: 'result', kind: 'result', priority: 100, caption: 'Run ended', tick: 1, cooldownTicks: 20 });
  director.submit({ id: 'result', kind: 'result', priority: 100, caption: 'Run ended', tick: 1, cooldownTicks: 20 });

  const frame = director.frame(1);
  assert.deepEqual(frame.voices, []);
  assert.deepEqual(frame.captions, ['Run ended', 'Danger']);
  assert.equal(frame.droppedVoices, 1);

  assert.equal(director.requestMusicState('tension', 2), false);
  assert.equal(director.requestMusicState('tension', 12), true);
  assert.equal(director.requestMusicState('calm', 18), false);
  assert.equal(director.requestMusicState('calm', 24), true);
});

test('audio cue cooldown prevents repeated event storms', () => {
  const director = new AudioDirector({ maxVoices: 4, muted: false, musicMinimumDwellTicks: 1 });
  director.submit({ id: 'collect:1', group: 'collect', kind: 'collect', priority: 40, caption: 'Food collected', tick: 10, cooldownTicks: 5 });
  director.submit({ id: 'collect:2', group: 'collect', kind: 'collect', priority: 40, caption: 'Food collected', tick: 11, cooldownTicks: 5 });
  assert.deepEqual(director.frame(11).voices.map(v => v.id), ['collect:1']);
  director.submit({ id: 'collect:3', group: 'collect', kind: 'collect', priority: 40, caption: 'Food collected', tick: 15, cooldownTicks: 5 });
  assert.deepEqual(director.frame(15).voices.map(v => v.id), ['collect:3']);
});

test('replay buffer remains bounded and returns defensive copies', () => {
  const replay = new ReplayBuffer(3);
  for (let tick = 1; tick <= 5; tick++) replay.push({ tick, scene: 'normal', checksum: String(tick), payload: { value: tick } });

  assert.equal(replay.size(), 3);
  const window = replay.windowAround(5, 2);
  assert.deepEqual(window.map(frame => frame.tick), [4, 5]);
  window[0].payload.value = 999;
  assert.equal(replay.windowAround(5, 2)[0].payload.value, 4);
});

test('camera director stays inside board bounds and honors reduced motion', () => {
  const camera = new CameraDirector({ reducedMotion: true, maxZoom: 1.25, minZoom: 0.65 });
  const frame = camera.frame({
    boardWidth: 32,
    boardHeight: 18,
    viewportWidth: 1280,
    viewportHeight: 720,
    headCell: 575,
    scene: 'danger',
    tick: 20,
  });

  assert.equal(frame.zoom >= 0.65 && frame.zoom <= 1.25, true);
  assert.equal(frame.x >= 0 && frame.x <= 32, true);
  assert.equal(frame.y >= 0 && frame.y <= 18, true);
  assert.equal(frame.impulse <= 0.15, true);

  const result = camera.frame({ ...frame.input, scene: 'result', tick: 21 });
  assert.equal(result.mode, 'result-focus');
  assert.equal(result.impulse <= 0.15, true);
});
