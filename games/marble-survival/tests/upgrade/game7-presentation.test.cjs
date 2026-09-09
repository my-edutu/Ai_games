'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function game7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

function browserSource(name) {
  return fs.readFileSync(path.resolve(__dirname, '../../public/complete-runtime', name), 'utf8');
}

test('public snapshot remains an allowlist with no authority secrets', () => {
  const { MarbleRuntime, createMarblePublicSnapshot } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'privacy-snapshot');
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const serialized = JSON.stringify(snapshot);
  for (const forbidden of ['rootSeed', 'tournamentSeed', 'rng', 'operatorToken', 'config']) {
    assert.equal(serialized.includes(forbidden), false, `public snapshot leaked ${forbidden}`);
  }
});

test('camera gives decisive finish priority over noisy contact events', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, selectMarbleCamera } = game7();
  assert.equal(typeof selectMarbleCamera, 'function');
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'camera-finish');
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const directive = selectMarbleCamera(snapshot, [
    { tick: 4, type: 'physics-contact', data: { marbleId: 0, impulse: 120 } },
    { tick: 4, type: 'marble-qualified', data: { marbleId: 1, finishRank: 1 } },
    { tick: 4, type: 'physics-contact', data: { marbleId: 0, impulse: 140 } },
  ]);
  assert.equal(directive.mode, 'finish');
  assert.deepEqual(directive.targetIds, [1]);
});

test('camera ignores prior-round finish events once a new round has started', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, selectMarbleCamera } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 4, roundQuotas: [2, 1, 1, 1, 1], roundIntroTicks: 0 }, 'camera-round-boundary');
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const directive = selectMarbleCamera(snapshot, [
    { tick: 40, type: 'round-resolved', data: { roundIndex: 0, qualifierIds: [0, 1] } },
    { tick: 40, type: 'round-started', data: { roundIndex: 1, activeIds: [0, 1], quota: 1 } },
  ]);
  assert.notEqual(directive.mode, 'finish');
  assert.equal(directive.mode, 'overview');
});

test('camera selects victory only from a confirmed champion result', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, selectMarbleCamera } = game7();
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'camera-victory');
  runtime.state.roundIndex = 4;
  runtime.state.roundNumber = 5;
  runtime.state.currentQuota = 1;
  runtime.state.marbles[1].status = 'champion';
  runtime.state.marbles[1].roundStatus = 'finished';
  runtime.state.activeIds = [];
  runtime.state.qualifiedIds = [1];
  runtime.state.lifecycle = 'tournament-result';
  runtime.state.result = { kind: 'champion', championId: 1, tournamentTicks: 300, recordCategory: 'standard' };
  const snapshot = createMarblePublicSnapshot(runtime.state);
  const directive = selectMarbleCamera(snapshot, [{ tick: 300, type: 'tournament-champion', data: { championId: 1 } }]);
  assert.equal(directive.mode, 'victory');
  assert.deepEqual(directive.targetIds, [1]);
});

test('replay buffer is bounded and isolated from authority and caller mutation', () => {
  const { MarbleRuntime, createMarblePublicSnapshot, MarbleReplayBuffer } = game7();
  assert.equal(typeof MarbleReplayBuffer, 'function');
  const runtime = MarbleRuntime.create({ rosterSize: 2, roundQuotas: [1, 1, 1, 1, 1], roundIntroTicks: 0 }, 'replay-isolation');
  const authorityX = runtime.state.marbles[0].position.x;
  const replay = new MarbleReplayBuffer(2);
  const first = createMarblePublicSnapshot(runtime.state);
  replay.push(first, [{ tick: 0, type: 'round-started', data: { roundIndex: 0 } }]);
  runtime.step();
  replay.push(createMarblePublicSnapshot(runtime.state), []);
  runtime.step();
  replay.push(createMarblePublicSnapshot(runtime.state), []);
  const frames = replay.frames();
  assert.equal(frames.length, 2);
  frames[0].snapshot.marbles[0].x = -999999;
  assert.notEqual(replay.frames()[0].snapshot.marbles[0].x, -999999);
  assert.equal(runtime.state.marbles[0].position.x === authorityX || runtime.state.marbles[0].position.x !== -999999, true);
});

test('public HUD is spectator-first rather than an operator diagnostics dashboard', () => {
  const html = browserSource('index.html');
  assert.doesNotMatch(html, /<dt>Tick<\/dt>/);
  assert.doesNotMatch(html, /<dt>Camera<\/dt>/);
  assert.doesNotMatch(html, /<dt>Feed<\/dt>/);
  assert.doesNotMatch(html, /id="checksum"/);
  assert.match(html, /id="survivor-value"/);
  assert.match(html, /id="quota-value"/);
  assert.match(html, /id="cutoff-label"/);
});

test('browser renderer consumes real arena geometry and never invents rotating sweeper physics', () => {
  const app = browserSource('app.js');
  assert.match(app, /arena\.obstacles/);
  assert.match(app, /arena\.sweepers/);
  assert.match(app, /arena\.hazards/);
  assert.doesNotMatch(app, /next\.camera\.phase/);
  assert.doesNotMatch(app, /entry\.score/);
  assert.doesNotMatch(app, /context\.rotate\(\(snapshot\?\.tick/);
  assert.doesNotMatch(app, /for \(let x = 0; x <= arena\.width; x \+= 60\)/);
});

test('browser renderer gives the physical arena explicit boundary rails and obstacle hardware', () => {
  const app = browserSource('app.js');
  assert.match(app, /function drawPerimeterRails\(/);
  assert.match(app, /function drawObstacleHardware\(/);
  assert.match(app, /drawPerimeterRails\(view\.arena, transform\)/);
  assert.match(app, /drawObstacleHardware\(rect, transform\)/);
});

test('quality presets are presentation-only and cover low through ultra', () => {
  const app = browserSource('app.js');
  assert.match(app, /QUALITY_PRESETS/);
  for (const preset of ['low', 'balanced', 'high', 'ultra']) assert.match(app, new RegExp(`${preset}\\s*:`));
  assert.doesNotMatch(app, /quality[^\n]{0,80}\/api\/snapshot|\/api\/snapshot[^\n]{0,80}quality/i);
});

test('reduced motion remains an explicit browser presentation mode', () => {
  const css = `${browserSource('styles.css')}\n${browserSource('ux-v2.css')}`;
  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/);
});