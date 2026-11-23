'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

test('T1 full garden ES module is served explicitly and included in stream asset readiness', () => {
  const server = fs.readFileSync(path.join(root, 'scripts/serve-snake-stream.cjs'), 'utf8');
  const renderer = fs.readFileSync(path.join(root, 'public/snake-stream/renderer.mjs'), 'utf8');
  const moduleFile = path.join(root, 'public/snake-stream/living-garden.mjs');
  assert.ok(fs.statSync(moduleFile).size > 128, 'the authored 3D world module exists');
  assert.match(renderer, /import \{ createLivingGarden \} from '\.\/living-garden\.mjs';/,
    'the actual live 3D renderer imports the T1 scene');
  const assetList = server.slice(server.indexOf('function assetPaths()'), server.indexOf('function isSnapshotPrivacySafe('));
  assert.match(assetList, /'living-garden\.mjs'/,
    'the host self-test validates this new production dependency');
  assert.match(server, /'\/living-garden\.mjs':\s*'living-garden\.mjs'/,
    'the authorized same-origin module path must exist or all real browser renders fall back');
  assert.match(server, /if \(!fileName\) \{/,
    'route access remains explicit; do not replace with arbitrary filesystem paths');
  assert.match(server, /'content-security-policy':/,
    'the existing restrictive resource policy remains intact');
});

test('T1 real on-court ecology is served by the restricted host and represented by the GPU-free timing harness', () => {
  const server = fs.readFileSync(path.join(root, 'scripts/serve-snake-stream.cjs'), 'utf8');
  const renderer = fs.readFileSync(path.join(root, 'public/snake-stream/renderer.mjs'), 'utf8');
  const timing = fs.readFileSync(path.join(root, 'tests/phase3/snake-render-timing.test.cjs'), 'utf8');
  const modulePath = path.join(root, 'public/snake-stream/courtyard-ecology.mjs');
  assert.ok(fs.statSync(modulePath).size > 128, 'authored runtime module exists');
  assert.match(renderer, /import \{ createCourtyardEcology \} from '\.\/courtyard-ecology\.mjs';/,
    'the production Three.js renderer depends on this local module');
  const assets = server.slice(server.indexOf('function assetPaths()'), server.indexOf('function isSnapshotPrivacySafe('));
  assert.match(assets, /'courtyard-ecology\.mjs'/,
    'the actual host self-test includes the required new module');
  assert.match(server, /'\/courtyard-ecology\.mjs':\s*'courtyard-ecology\.mjs'/,
    'real-browser ES-module imports cannot be blocked by an unregistered route');
  assert.match(timing, /createCourtyardEcology:\s*factory/,
    'no-GPU VM timing probes inject a scene stub without altering original timing thresholds');
  assert.match(server, /if \(!fileName\) \{/,
    'unknown paths remain denied rather than exposing an arbitrary static file server');
  assert.match(server, /'content-security-policy':/,
    'same-origin restrictive policy remains active');
});
