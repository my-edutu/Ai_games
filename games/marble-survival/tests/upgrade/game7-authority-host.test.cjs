'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadGame7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

function loadServer() {
  const serverPath = path.resolve(__dirname, '../../scripts/serve-complete-runtime.cjs');
  const source = fs.readFileSync(serverPath, 'utf8');
  assert.doesNotMatch(source, /complete\/game7\.cjs/, 'broadcast host still depends on the absent legacy complete/game7.cjs bundle');
  return require(serverPath);
}

test('public presentation snapshot API is exported by the authoritative Game 7 package', () => {
  const game = loadGame7();
  assert.equal(typeof game.createMarblePublicSnapshot, 'function');
});

test('broadcast host advances MarbleRuntime instead of a parallel campaign clock', () => {
  const { createRuntime } = loadServer();
  const host = createRuntime({ seed: 'authority-host', nowMs: 0 });
  assert.ok(host.authority, 'host must expose its authoritative MarbleRuntime');
  assert.equal(host.authority.state.tick, 0);
  host.advanceDue(1000 / 60);
  assert.equal(host.authority.state.tick, 1);
  assert.equal('campaign' in host, false);
});

test('30 Hz and 60 Hz presentation polling produce the same authoritative state', () => {
  const { createRuntime } = loadServer();
  const a = createRuntime({ seed: 'render-independent', nowMs: 0 });
  const b = createRuntime({ seed: 'render-independent', nowMs: 0 });
  for (let frame = 1; frame <= 600; frame++) a.advanceDue(frame * (1000 / 60));
  for (let frame = 1; frame <= 300; frame++) b.advanceDue(frame * (1000 / 30));
  assert.equal(a.authority.state.tick, b.authority.state.tick);
  assert.equal(a.checksum(), b.checksum());
});
