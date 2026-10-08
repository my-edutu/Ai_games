'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('3D storm wall follows the public shrinking-zone circle with an accessible low-GPU treatment',()=>{
  assert.match(src,/function stormWall\(/);
  assert.match(src,/s\.zone\.radius/);
  assert.match(src,/s\.zone\.centerCell/);
  assert.match(src,/quality==='low'/);
  assert.match(src,/reducedFlash/);
  assert.match(src,/reducedMotion/);
  assert.doesNotMatch(src,/runtime\.step\(|Math\.random\(/);
});
