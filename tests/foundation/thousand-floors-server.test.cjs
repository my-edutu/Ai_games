'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../scripts/serve-thousand-floors.cjs');
const resolveAsset = fs.existsSync(file) ? require(file).resolveAsset : () => null;

test('Game 4 has distinct game and live progress routes', () => {
  assert.equal(path.basename(resolveAsset('/floors/') || ''), 'index.html');
  assert.equal(path.basename(resolveAsset('/floors/progress') || ''), 'progress.html');
});
test('runtime and pinned rendering modules are served locally', () => {
  assert.match(resolveAsset('/floors/runtime/games/ai-vs-1000-floors/src/index.js') || '', /dist-browser/);
  assert.match(resolveAsset('/floors/vendor/three.module.js') || '', /node_modules.*three.*build/);
});
test('static routes reject traversal, private files and arbitrary vendor paths', () => {
  for (const url of ['/floors/../../AGENTS.md', '/floors/%2e%2e/%2e%2e/package.json', '/floors/runtime/../../../package.json', '/floors/vendor/../../../package.json', '/floors/.env', '/floors/%00app.js', '/floors/%not-valid']) {
    assert.equal(resolveAsset(url), null, url);
  }
});
