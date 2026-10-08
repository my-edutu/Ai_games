'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');

test('cinematic hero viewpoint must be a physical pinhole camera with depth perspective and clipping',()=>{
  for(const token of ['uEye','uForward','uRight','uUp','uLens','uPhysicalCamera'])
    assert.match(src,new RegExp(token));
  assert.match(src,/function physicalCamera\(/);
  assert.match(src,/gl\.uniform3f\(uniform\[9\]/);
  assert.match(src,/gl\.uniform1f\(uniform\[14\],heroPhysical\?1:0\)/);
  assert.match(src,/depthPhysical/);
  assert.match(src,/clipZ/);
  assert.doesNotMatch(src,/Math\.random\(|\.step\(/);
});

test('the tactical inset explicitly disables physical cinematic projection',()=>{
  assert.match(src,/function spectatorCloseup\(/);
  assert.match(src,/gl\.uniform1f\(uniform\[14\],0\)/);
  assert.match(src,/function updateNameplates\(/);
  assert.match(src,/physical\?\.eye/);
});
