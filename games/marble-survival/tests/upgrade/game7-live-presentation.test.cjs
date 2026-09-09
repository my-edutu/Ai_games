'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadServer() {
  const serverPath = path.resolve(__dirname, '../../scripts/serve-complete-runtime.cjs');
  delete require.cache[require.resolve(serverPath)];
  return require(serverPath);
}

function browserSource() {
  return fs.readFileSync(path.resolve(__dirname, '../../public/complete-runtime/app.js'), 'utf8');
}

test('live host publishes a camera directive and stores bounded replay snapshots', () => {
  const { createRuntime } = loadServer();
  const host = createRuntime({ seed: 'live-presentation', nowMs: 0, replayCapacity: 4 });
  for (let frame = 1; frame <= 8; frame++) host.advanceDue(frame * (1000 / 60));

  const snapshot = host.currentSnapshot();
  assert.ok(snapshot.camera, 'public live snapshot must include a presentation camera directive');
  assert.ok(['overview', 'pack', 'danger', 'finish', 'replay', 'victory'].includes(snapshot.camera.mode));
  assert.equal(typeof host.replayFrames, 'function');
  const frames = host.replayFrames(99);
  assert.equal(frames.length, 4, 'replay storage must obey configured capacity');

  const authorityX = host.authority.state.marbles[0].position.x;
  frames[0].snapshot.marbles[0].x = -999999;
  assert.notEqual(host.replayFrames(99)[0].snapshot.marbles[0].x, -999999, 'replay callers must receive copies');
  assert.notEqual(host.authority.state.marbles[0].position.x, -999999, 'replay mutation must not affect authority');
  assert.ok(Number.isFinite(authorityX));
});

test('victory camera is derived from confirmed authoritative champion state', () => {
  const { createRuntime } = loadServer();
  const host = createRuntime({ seed: 'live-victory', nowMs: 0 });
  const champion = host.authority.state.marbles[1];
  host.authority.state.roundIndex = 4;
  host.authority.state.roundNumber = 5;
  host.authority.state.currentQuota = 1;
  host.authority.state.activeIds = [];
  host.authority.state.qualifiedIds = [champion.id];
  champion.status = 'champion';
  champion.roundStatus = 'finished';
  host.authority.state.lifecycle = 'tournament-result';
  host.authority.state.result = {
    kind: 'champion',
    championId: champion.id,
    tournamentTicks: host.authority.state.tournamentTick,
    recordCategory: 'standard',
  };

  const snapshot = host.currentSnapshot();
  assert.equal(snapshot.camera.mode, 'victory');
  assert.deepEqual(snapshot.camera.targetIds, [champion.id]);
});

test('browser renderer consumes authoritative camera data and replay API', () => {
  const app = browserSource();
  assert.match(app, /snapshot\.camera|next\.camera/, 'browser must consume server camera directive');
  assert.match(app, /\/api\/replay/, 'browser must retrieve presentation-only replay frames');
  assert.match(app, /Replay/i, 'browser must label replay presentation');
});
