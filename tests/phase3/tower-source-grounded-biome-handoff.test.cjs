'use strict';
// P0: A source-earned Floor 8→9 gateway must not instantly replace the
// entire lighting horizon before the first actual successful Three submission.
// Engineering contract only; actual normal-speed full-motion video is required.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const loaded=import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/biome-threshold.mjs')).href);
function input(){
  return {
    frame:{lifecycle:'running',runToken:'earned-floor-nine',floor:9,
      tick:452,theme:'void',player:{health:4}},
    stage:{sourceBound:true,active:true,stage:'handoff',
      continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
      exteriorMemoryFrameVisible:false,
      runToken:'earned-floor-nine',floor:9,sourceTick:451,
      handoffSubmittedFrames:1,handoffDisplaySeconds:0,
      handoffVisibleWindowSeconds:1.65},
  };
}
test('source-earned opened arch keeps old horizon through first real cold renderer submission',async()=>{
  const {observedGroundedBiomeThreshold}=await loaded;
  const {frame,stage}=input();
  const before=JSON.stringify({frame,stage});
  assert.equal(observedGroundedBiomeThreshold(frame,stage)?.oldWeight,1);
  assert.equal(observedGroundedBiomeThreshold(frame,{...stage,handoffSubmittedFrames:0,
    handoffDisplaySeconds:0})?.oldWeight,1,
    'an HTTP receipt may not consume the unsubmitted skyline');
  assert.equal(observedGroundedBiomeThreshold(frame,
    {...stage,handoffDisplaySeconds:.825})?.oldWeight,.5);
  assert.ok(observedGroundedBiomeThreshold(frame,
    {...stage,handoffDisplaySeconds:1.6}).oldWeight<.01);
  assert.equal(JSON.stringify({frame,stage}),before,
    'presentation cannot mutate source or passage diagnostics');
});
test('no ground, defeated guardian, authentic renderer or source identity means no invented biome transition',async()=>{
  const {observedGroundedBiomeThreshold}=await loaded;
  const {frame,stage}=input();
  const rejected=[
    [frame,{...stage,sourceBound:false}],
    [frame,{...stage,active:false}],
    [frame,{...stage,stage:'earned-open'}],
    [frame,{...stage,continuousGroundedHandoff:false}],
    [frame,{...stage,innerDoorAssemblyVisible:false}],
    [frame,{...stage,exteriorMemoryFrameVisible:true}],
    [frame,{...stage,runToken:'another'}],
    [frame,{...stage,floor:8}],
    [frame,{...stage,sourceTick:454}],
    [frame,{...stage,sourceTick:390}],
    [frame,{...stage,handoffSubmittedFrames:0,handoffDisplaySeconds:.5}],
    [frame,{...stage,handoffDisplaySeconds:2}],
    [{...frame,runToken:'new-run'},stage],
    [{...frame,floor:10},stage],
    [{...frame,theme:'clockwork'},stage],
    [{...frame,lifecycle:'result'},stage],
    [{...frame,player:{health:0}},stage],
  ];
  for(const [f,s] of rejected)
    assert.equal(observedGroundedBiomeThreshold(f,s),null,
      'unverified source must not receive a clockwork sky');
  assert.equal(observedGroundedBiomeThreshold(frame,stage,
    {reducedMotion:true}),null);
  assert.equal(observedGroundedBiomeThreshold(frame,stage,
    {stale:true}),null);
});
test('actual renderer blends old and new environmental lighting together, after source action direction and before the WebGL submission',()=>{
  const scene=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/import \{ observedGroundedBiomeThreshold \} from '\.\/biome-threshold\.mjs'/);
  assert.match(scene,/observedGroundedBiomeThreshold\(snapshot,passage\.diagnostics\(\),options,/);
  for(const channel of ['scene.fog.color','skyMaterial.uniforms.top.value',
    'skyMaterial.uniforms.horizon.value','skyMaterial.uniforms.bottom.value',
    'hemi.color','hemi.groundColor','sun.color','rim.color','bounce.color',
    'renderer.toneMappingExposure'])
    assert.ok(scene.includes(channel),'lighting layer missing '+channel);
  assert.ok(scene.indexOf('observedGroundedBiomeThreshold(snapshot,passage.diagnostics(),options,')>
    scene.indexOf('bounce.target.position.copy(actionLightTarget)'),
    'handoff must coordinate final effective action lighting, not be overwritten by ordinary lights');
  assert.ok(scene.indexOf('observedGroundedBiomeThreshold(snapshot,passage.diagnostics(),options,')<
    scene.indexOf('renderer.render(scene, camera);'),
    'floor-nine horizon must be committed for the actual native frame');
});
