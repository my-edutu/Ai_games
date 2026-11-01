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
