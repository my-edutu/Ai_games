'use strict';
// T4: the original 1920 desktop test keeps its immutable 17-genuine-render gate.
// This proves a retained HIGHER resolution, camera-identical static cache may
// survive a measured ratio drop without rebuilding all scenery three times.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(process.env.RENDERER_SOURCE || path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');

async function importedHelpers(){
  // Test pure code as shipped (not a test-only reimplementation); imports are
  // stripped because this offline host has no pinned Three.js browser module.
  const isolated=source.replace(/^import\s+.*?;\s*$/gm,'');
  return import('data:text/javascript;base64,'+Buffer.from(isolated).toString('base64'));
}

test('correctly reuses higher-resolution complete 3D color+depth without upsampling or new textures',async()=>{
  const {canReuseStaticWorldCache}=await importedHelpers();
  assert.equal(canReuseStaticWorldCache({sourceWidth:1178,sourceHeight:651,presentWidth:751,presentHeight:415,matchingView:true,sameCssLayout:true}),true);
  assert.equal(canReuseStaticWorldCache({sourceWidth:1178,sourceHeight:651,presentWidth:1178,presentHeight:651,matchingView:true,sameCssLayout:true}),true);
  assert.equal(canReuseStaticWorldCache({sourceWidth:751,sourceHeight:415,presentWidth:1178,presentHeight:651,matchingView:true,sameCssLayout:true}),false);
});

test('rejects changed camera, invalid snapshot, changed layout and distorted aspect',async()=>{
  const {canReuseStaticWorldCache}=await importedHelpers();
  const a={sourceWidth:1178,sourceHeight:651,presentWidth:751,presentHeight:415,matchingView:true,sameCssLayout:true};
  assert.equal(canReuseStaticWorldCache({...a,matchingView:false}),false);
  assert.equal(canReuseStaticWorldCache({...a,sameCssLayout:false}),false);
  assert.equal(canReuseStaticWorldCache({...a,presentWidth:751,presentHeight:500}),false);
  assert.equal(canReuseStaticWorldCache({...a,sourceWidth:0}),false);
  assert.equal(canReuseStaticWorldCache({...a,presentWidth:NaN}),false);
});

test('production code preserves exact cached static view when only quality and pixel ratio change',()=>{
  assert.match(source,/canReuseStaticWorldCache\(\{[\s\S]*?staticTarget\?\.width/);
  assert.match(source,/const cacheHit\s*=\s*canReuseStaticWorldCache\(/);
  assert.match(source,/if\s*\(!cacheHit\s*&&\s*\(!staticTarget/);
  assert.match(source,/const\s+key\s*=\s*\[dimensions,\s*world\.propRevision/);
  assert.doesNotMatch(source,/const\s+key\s*=\s*\[dimensions,\s*quality,/);
  assert.match(source,/if\s*\(key\s*!==\s*staticKey\s*\|\|\s*\(!cacheHit\s*&&\s*renderer\.shadowMap\.needsUpdate\)\)/);
  assert.match(source,/function invalidateStaticCache\(\{\s*preserveView\s*=\s*false\s*\}/);
  assert.match(source,/if\s*\(!sameCssLayout\)\s*invalidateStaticCache\(\)/);
  assert.match(source,/invalidateStaticCache\(\{\s*preserveView:\s*true\s*\}\)/);
  assert.match(source,/retainedHigherRasterCompositions\+\+/);
  assert.match(source,/staticCache:\s*\{[\s\S]*?retainedHigherRasterCompositions/);
});

test('unchanged actual frame-count submission and original strict threshold',()=>{
  assert.match(source,/frameGate\.submitted\(\)/);
  assert.match(source,/if\s*\(!frameGate\.canDraw\(\)\)\s*return false/);
  assert.match(source,/const\s+frameGate\s*=\s*createGpuFrameGate\(gl\)/);
  assert.match(source,/world\.update\(snapshot,/);
  assert.match(source,/serpent\.update\(motion\.paths,/);
});

test('original two-fence real GPU backpressure remains unchanged and nonblocking',async()=>{
  const {createGpuFrameGate}=await importedHelpers();
  let next=0,ready=false,clock=0,flushes=0;
  const gl={fenceSync:()=>({id:++next}),clientWaitSync:()=>ready?1:2,
    deleteSync:()=>{},flush:()=>{flushes++;},isContextLost:()=>false,
    ALREADY_SIGNALED:1,CONDITION_SATISFIED:3,TIMEOUT_EXPIRED:2,SYNC_GPU_COMMANDS_COMPLETE:7};
  const gate=createGpuFrameGate(gl,{now:()=>clock});
  assert.equal(gate.canDraw(),true);gate.submitted();
  assert.equal(gate.canDraw(),true);gate.submitted();
  assert.equal(gate.canDraw(),false);
  assert.deepEqual([gate.stats().maxFrames,gate.stats().submitted,gate.stats().skipped,flushes],[2,2,1,2]);
  ready=true;clock=20;
  assert.equal(gate.canDraw(),true);
  assert.equal(gate.stats().completed,2);
  gate.dispose();
});
