'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

test('Gauntlet motion uses visual-only interpolation between public snapshots',()=>{
  assert.match(source,/requestAnimationFrame/);
  assert.match(source,/performance\.now\(\)/);
  assert.match(source,/previousSnapshot/);
  assert.match(source,/runToken/);
  assert.match(source,/reducedMotion/);
  assert.match(source,/Math\.min\(1,Math\.max\(0,/);
  assert.doesNotMatch(source,/\.step\(|Math\.random\(|WebSocket/);
});
