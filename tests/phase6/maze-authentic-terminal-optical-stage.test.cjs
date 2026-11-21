'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const scene=fs.readFileSync(require('node:path').resolve(__dirname,
  '../../public/ai-maze-escape/scene.js'),'utf8');
test('only a witnessed true public exit avoids the generic ocean-widening lens',()=>{
  assert.match(scene,/const publicVictoryScene = cameraMode === 'follow' && result === 'escape'/);
  assert.match(scene,/s\.currentCell === s\.exitCell/);
  assert.match(scene,/s\.visibleCells\.includes\(s\.exitCell\)/);
  assert.match(scene,/targetHeight = publicVictoryScene \? \(aspect < \.9 \? 5\.10 : 4\.35\)/);
  assert.match(scene,/targetHeight = publicVictoryScene \? targetHeight\s*: publicFullBleedFollowHalfHeight\(aspect, targetHeight\)/);
  assert.match(scene,/cameraOffset\.lerp\(publicVictoryScene \? escapeCameraOffset/);
});
test('native full physical gate for closer terminal remains strictly intact',()=>{
  assert.match(scene,/const terminalPortalBounds=terminalPortal\s*\?physicalSilhouette\(terminalPortal\)/);
  assert.match(scene,/const explorerSilhouette=physicalSilhouette\(explorer\.group\)/);
  // The entire actual full-body and portal-frame acceptance stays in
  // original Playwright. Do not replace it with a mocked scene result.
  const browser=fs.readFileSync(require('node:path').resolve(__dirname,
    '../browser/maze-review.spec.cjs'),'utf8');
  assert.match(browser,/terminalPortalBounds\?\.fullyInFrame/);
  assert.match(browser,/explorerModelFullyInFrame/);
  assert.match(browser,/real finale must be visually closer/);
  assert.match(browser,/width<500\?5\.3:4\.6/);
});
