'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const browserSource = path.resolve(__dirname, '../../public/ai-maze-escape');

// This was not caught by the TypeScript/Node gameplay suite: a stray ')'
// in scene.js left every real browser on the 2D fallback for 30–480 seconds.
// Parse the actual untransformed browser modules as ESM, without executing a
// GPU context, mocking a canvas or weakening the native-render requirements.
test('actual WebGL stage and its direct presentation modules parse as browser ESM', () => {
  for (const name of [
    'app.js', 'scene.js', 'world.js', 'characters.js',
    'map-view.mjs', 'public-lantern-encounter.mjs',
    'gate-moment.mjs', 'pickup-story-camera.mjs',
  ]) {
    const source = readFileSync(path.join(browserSource, name), 'utf8');
    const result = spawnSync(process.execPath, ['--check', '--input-type=module'], {
      input: source, encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.status, 0,
      'Native browser module '+name+' must parse before real WebGL capture:\n'
      +(result.stderr || result.error?.message || 'unknown syntax error'));
  }
});
