'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSession, advance, createTowerStreamServer } = require('../../scripts/serve-tower-stream.cjs');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerRenderSnapshot } = require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const { TowerPresentationController } = require('../../dist/games/infinite-tower-climb/src/presentation/controller.js');
const shortRun = { maxTicks: 100, noProgressTicks: 99, intermissionTicks: 3 };

test('result, intermission and restarted run reach spectators in order', () => {
  const session = createSession('stream-lifecycle-regression', shortRun, 'idle-test');
  const token = session.controller.frame().snapshot.runToken;
  while (session.runtime.state.lifecycle === 'running') assert.equal(advance(session).accepted, true);
  const result = session.controller.frame();
  assert.equal(result.scene, 'result');
  assert.equal(advance(session).accepted, true, 'intermission is a newer public state');
  const intermission = session.controller.frame();
  assert.equal(intermission.scene, 'intermission');
  assert.ok(intermission.snapshot.revision > result.snapshot.revision);
  while (session.runtime.state.lifecycle === 'intermission') assert.equal(advance(session).accepted, true);
  const restarted = session.controller.frame();
  assert.notEqual(restarted.snapshot.runToken, token);
  assert.equal(restarted.tick, 0);
  assert.equal(restarted.scene, 'normal');
  assert.equal(restarted.audio.captions.some(c => c.text === 'Run ended'), false);
});

test('stream consumption bounds private event history across repeated runs', () => {
  const session = createSession('stream-event-bounds', shortRun, 'idle-test');
  for (let step = 0; step < 1000; step++) advance(session);
  assert.ok(session.runtime.state.stats.restarts > 5);
  assert.ok(session.runtime.events.length <= 64, `retained ${session.runtime.events.length} consumed events`);
  assert.ok(session.controller.replayWindow(10000).length <= 360);
  assert.ok(session.runtime.getNextEventSequence() > 1000, 'draining preserves the event sequence');
});

test('captions and audio start fresh at a lower-tick new-run boundary', () => {
  const first = TowerRuntime.create({}, 'old-audio-run');
  const controller = new TowerPresentationController();
  controller.accept(createTowerRenderSnapshot(first.state), []);
  first.state.tick = 1000;
  controller.accept(createTowerRenderSnapshot(first.state), [{ seq: 1, tick: 1000, type: 'game-terminal' }]);
  assert.equal(controller.frame().audio.captions[0].text, 'Run ended');
  const second = TowerRuntime.create({}, 'new-audio-run');
  controller.accept(createTowerRenderSnapshot(second.state), [{ seq: 2, tick: 0, type: 'restart' }]);
  assert.deepEqual(controller.frame().audio.captions, []);
  second.state.tick = 10;
  controller.accept(createTowerRenderSnapshot(second.state), [{ seq: 3, tick: 10, type: 'player-damage' }]);
  assert.equal(controller.frame().audio.captions[0].text, 'Climber hit');
  assert.equal(controller.frame().audio.voices[0].cue, 'impact');
});

test('the starting floor points to the first real guardian floor', () => {
  const runtime = TowerRuntime.create({ guardianInterval: 8 }, 'guardian-label');
  assert.equal(createTowerRenderSnapshot(runtime.state).progress.nextGuardianFloor, 8);
});

function controlledHost() {
  let tick;
  const original = global.setInterval;
  global.setInterval = callback => { tick = callback; return { unref() {} }; };
  try { return { ...createTowerStreamServer({ seed: 'controlled-host' }), tick: () => tick() }; }
  finally { global.setInterval = original; }
}

test('a successful tick restores the public scene after a transient step fault', () => {
  const host = controlledHost();
  const step = host.session.runtime.step.bind(host.session.runtime);
  host.session.runtime.step = () => { throw new Error('synthetic simulation failure'); };
  host.tick();
  assert.equal(host.session.controller.frame().scene, 'recovery');
  host.session.runtime.step = step;
  host.tick();
  assert.notEqual(host.session.controller.frame().scene, 'recovery');
  host.server.emit('close');
});

test('malformed request targets receive a client error without crashing the stream', () => {
  const host = controlledHost();
  let status;
  const response = { writeHead(code) { status = code; }, end() {} };
  assert.doesNotThrow(() => host.server.emit('request', { method: 'GET', url: '//%' }, response));
  assert.equal(status, 400);
  host.server.emit('close');
});
