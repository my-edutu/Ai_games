'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');

test('real source-gated doorway evidence is sampled only AFTER returned WebGL and BEFORE GPU-gate fading', () => {
  const rendered = source.indexOf('renderer.render(scene, camera);');
  const returned = source.indexOf('const rendererReturnedAt = performance.now();',rendered);
  const sampled = source.indexOf('physicalDoorwaySubmissionAudit.push({',returned);
  const aged = source.indexOf('world.noteFrameSubmitted?.(snapshot,options,dt);',returned);
  assert.ok(rendered > 0 && rendered < returned && returned < sampled && sampled < aged);
  assert.match(source,/crossing\?\.runToken === snapshot\.runToken/);
  assert.match(source,/crossing\.fromFloor === 8 && crossing\.toFloor === 9/);
  assert.match(source,/crossing\.guardian\.health <= 0/);
  assert.match(source,/physicalDoorwaySubmissionAudit\.length < 56/);
  assert.match(source,/physicalDoorwaySubmissionAudit\.at\(-1\)\?\.sourceTick !== snapshot\.tick/);
});
test('exact submitted camera diagnostics distinguish original GPU gate ownership from projected pixels', () => {
  assert.match(source,/retainedOriginalGpu: !!retained/);
  assert.match(source,/sourceOwnedColdLens: !!coldLens/);
  assert.match(source,/originalGateNdc, heroCoreClear, originalGateCoreClear/);
  assert.match(source,/bothInProjectedSafeFrame: safePoint\(heroNdc\)/);
  assert.match(source,/physicalDoorwaySubmissionAudit: \{/);
  assert.match(source,/not native pixels, qualitative acceptance or actual-device FPS/);
});
