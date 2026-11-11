'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

test('cinematic-first viewers can immediately take manual follow control without a false overview jump', async () => {
  const { nextManualSpectatorCamera } = await import('../../public/snake-stream/cinematic-director.mjs');
  assert.equal(nextManualSpectatorCamera('cinematic'), 'follow', 'first explicit camera press must follow the serpent');
  assert.equal(nextManualSpectatorCamera('overview'), 'follow', 'legacy overview action must still follow');
  assert.equal(nextManualSpectatorCamera('follow'), 'detail', 'second press must show detail');
  assert.equal(nextManualSpectatorCamera('detail'), 'overview', 'third press returns entire legitimate board');
  assert.equal(nextManualSpectatorCamera('unexpected'), 'overview', 'bad modes fail closed');
  let current = 'cinematic';
  const route = [];
  for (let i=0; i<4; i++) { current = nextManualSpectatorCamera(current); route.push(current); }
  assert.deepEqual(route,['follow','detail','overview','follow']);
});

test('live camera control delegates to the public manual director rather than silently treating cinematic as detail', () => {
  const source = fs.readFileSync(path.join(root, 'public/snake-stream/app.js'),'utf8');
  assert.match(source,/import\s*\{\s*nextManualSpectatorCamera\s*\}\s*from\s*['"]\.\/cinematic-director\.mjs['"]/);
  assert.match(source,/case 'camera': cameraMode = nextManualSpectatorCamera\(cameraMode\); break;/);
  assert.match(source,/const active = control === 'reduced-motion'/);
  assert.match(source,/cameraMode = selectInitialSpectatorCamera\(params, reducedMotion\)/);
  assert.match(source,/const activeShot = resolveSpectatorShot\(cameraMode, frame\.snapshot, reducedMotion\)/);
});
