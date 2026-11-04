'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'public/ai-maze-escape/public-lantern-encounter.mjs');
const scenePath=path.join(root,'public/ai-maze-escape/scene.js');
const loaded=import(pathToFileURL(modulePath).href);
const cell=(id,neighbors)=>({cell:id,neighbors,blocked:false});
const publicFrame=(extra={})=>({
  runToken:'true-public-encounter',lifecycle:'running',width:7,height:7,
  currentCell:10,cells:[cell(10,[11]),cell(11,[10])],
  visibleCells:[10,11],threats:[{id:'warden-a',cell:11}],doors:[],result:null,
  ...extra
});
test('physical lantern focus is restricted to already visible reciprocal adjacent public guardian',async()=>{
  const {publicLanternEncounter:cue}=await loaded;
  const original=publicFrame(),frozen=JSON.stringify(original);
  assert.equal(cue(original,11),true);
  assert.equal(JSON.stringify(original),frozen,'no modification of public game authority');
  for(const changed of [
    {lifecycle:'result'},{result:{reason:'capture'}},
    {visibleCells:[10]},{visibleCells:[11]},{visibleCells:[]},
    {threats:[]},{threats:[{id:'hidden',cell:25}]},
    {cells:[cell(10,[11]),cell(11,[])]},
    {cells:[cell(10,[]),cell(11,[10])]},
    {cells:[cell(10,[11]),{...cell(11,[10]),blocked:true}]},
    {doors:[{a:10,b:11,open:false}]},
    {doors:[{a:11,b:10,open:false}]},
    {currentCell:9},{currentCell:17},{width:0},{width:NaN}
  ]) assert.equal(cue(publicFrame(changed),11),false,JSON.stringify(changed));
  assert.equal(cue(null,11),false);
  assert.equal(cue(original,10),false,'no zero-length invented beam');
  assert.equal(cue(original,24),false,'unknown threat cannot light up');
  assert.equal(cue(publicFrame({doors:[{a:11,b:10,open:true}]}),11),true);
});
test('private future information cannot create an encounter and wrap-around cells cannot connect',async()=>{
  const {publicLanternEncounter:cue}=await loaded;
  const publicOnly=publicFrame();
  const withSecrets={...publicOnly,privateThreatCell:34,hiddenRoute:[10,23,34],
    hiddenExitCell:11,privateMazeCells:[11,12,34]};
  assert.equal(cue(withSecrets,11),cue(publicOnly,11));
  const unobserved={...publicOnly,visibleCells:[10],privateThreatCell:11,
    privateMazeCells:[11],hiddenThreat:{cell:11}};
  assert.equal(cue(unobserved,11),false);
  // 6 -> 7 crosses a row boundary, so numeric difference one is NOT adjacency.
  const wrapped=publicFrame({currentCell:6,cells:[cell(6,[7]),cell(7,[6])],
    visibleCells:[6,7],threats:[{id:'warden',cell:7}]});
  assert.equal(cue(wrapped,7),false);
});
test('actual production scene builds one reusable Three light volume with disposal and public-only gate',()=>{
  const scene=fs.readFileSync(scenePath,'utf8');
  const server=fs.readFileSync(path.join(root,'scripts/serve-maze-stream.cjs'),'utf8');
  assert.match(server,/['"]public-lantern-encounter\.mjs['"]/,
    'production HTTP asset allowlist must serve the real imported helper');
  assert.match(scene,/import \{ publicLanternEncounter \} from '\.\/public-lantern-encounter\.mjs'/);
  assert.match(scene,/new THREE\.CylinderGeometry\(\.055, \.47, 1, 16, 1, true\)/);
  assert.match(scene,/publicLanternEncounter\(s, closestThreat\.cell\)/);
  assert.match(scene,/explorer\.group\.getObjectByName\('lantern cage'\)/);
  assert.match(scene,/explorerLantern\.getWorldPosition\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternBeamDirection\.copy\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternBeam\.position\.copy\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternBeam\.quaternion\.setFromUnitVectors\(lanternBeamAxis, lanternBeamDirection\)/);
  assert.match(scene,/lanternBeamGeometry\.dispose\(\); lanternBeamMaterial\.dispose\(\)/);
  assert.match(scene,/witnessedLanternConeVisible: lanternBeam\.visible/);
  assert.doesNotMatch(scene,/privateThreatCell|hiddenRoute|hiddenExitCell/);
});
