'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

test('combat VFX track new authoritative event sequences and expire instead of leaving permanent beams',()=>{
  assert.match(src,/function ingestVisualEvents\(/);
  assert.match(src,/function activeVisualEvents\(/);
  assert.match(src,/function combatEffects\(/);
  assert.match(src,/visualEffects/);
  assert.match(src,/observedSequences\.has\(event\.sequence\)/);
  assert.match(src,/performance\.now\(\)/);
  assert.match(src,/Math\.min\(1,Math\.max\(0,/);
  assert.match(src,/visualEffects\.length/);
  assert.doesNotMatch(src,/Math\.random\(/);
});

test('new 3D VFX remain cosmetic and do not write battle state or network data',()=>{
  assert.doesNotMatch(src,/\.step\(|fetch\(|WebSocket\(|localStorage\.|sessionStorage\./);
  assert.match(src,/reducedMotion/);
  assert.match(src,/reducedFlash/);
  assert.match(src,/function drawScene\(/);
});
