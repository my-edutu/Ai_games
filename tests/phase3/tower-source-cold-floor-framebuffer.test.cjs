'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const policyPromise=import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/cold-floor-resolution.mjs')).href);
const source={runToken:'true-tower-run',floor:9,tick:452,lifecycle:'running',
  player:{health:4,grounded:true,groundedPlatformId:'f9:ground'}};
const earned={stage:'handoff',continuousGroundedHandoff:true,
  runToken:source.runToken,floor:9,sourceTick:451};
const follow={stale:false,camera:'follow',quality:'low',reducedMotion:false};

test('source-earned Floor8 to Floor9 cold GPU scene has bounded low-tier clarity, then resolves only on submitted frames',async()=>{
  const {createTowerColdFloorResolution}=await policyPromise;
  const policy=createTowerColdFloorResolution();
  assert.equal(policy.observe(source,earned,follow),.78);
  // HTTP acceptance, source ticks and incomplete WebGL calls cannot consume the initial sharpness budget.
  for(let tick=453;tick<=459;tick++)
    assert.equal(policy.observe({...source,tick},earned,follow),.78);
  assert.equal(policy.submitted({...source,tick:452}),true);
  assert.equal(policy.observe(source,earned,follow),.86);
  assert.equal(policy.submitted(source),true);
  assert.equal(policy.observe(source,earned,follow),.93);
  assert.equal(policy.submitted(source),true);
  assert.equal(policy.observe(source,earned,follow),1);
  assert.equal(policy.submitted(source),false,'bounded resolution rescue has finished');
  assert.equal(policy.observe(source,earned,follow),1,'same episode cannot restart cold downscaling');
});
test('only matching supported live gateway may alter the genuine renderer pixel budget',async()=>{
  const {createTowerColdFloorResolution}=await policyPromise;
  for(const [s,p,o] of [
    [source,{...earned,continuousGroundedHandoff:false},follow],
    [{...source,floor:10},earned,follow],
    [{...source,runToken:'other'},earned,follow],
    [{...source,lifecycle:'result'},earned,follow],
    [{...source,player:{...source.player,health:0}},earned,follow],
    [{...source,tick:450},earned,follow],
    [source,{...earned,runToken:'other'},follow],
    [source,earned,{...follow,stale:true}],
    [source,earned,{...follow,camera:'overview'}],
    [source,earned,{...follow,reducedMotion:true}]
  ]) {
    const policy=createTowerColdFloorResolution();
    assert.equal(policy.observe(s,p,o),1,'unverified source/view remains full resolution');
    assert.equal(policy.submitted(s),false);
  }
  const policy=createTowerColdFloorResolution();
  assert.equal(policy.observe(source,earned,follow),.78);
  assert.equal(policy.submitted({...source,runToken:'other'}),false);
  assert.equal(policy.observe(source,earned,follow),.78);
  policy.reset();
  assert.equal(policy.observe(source,{...earned,stage:'none'},follow),1);
});
test('real 3D scene budgets the framebuffer before its first WebGL return, not when a source payload arrives',()=>{
  const scene=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/createTowerColdFloorResolution/);
  assert.match(scene,/basePixelRatio \* Math\.min\(resolutionPolicy\.scale, coldFloorScale\)/);
  const update=scene.indexOf('update(motionDt);');
  const policy=scene.indexOf('coldFloorPolicy.observe(snapshot,passage.diagnostics()');
  const render=scene.indexOf('renderer.render(scene, camera);');
  const submitted=scene.indexOf('coldFloorPolicy.submitted(snapshot);');
  assert.ok(update>=0 && policy>update && policy<render && submitted>render);
  assert.match(scene,/coldFloorPolicy\.reset\(\)/);
});
