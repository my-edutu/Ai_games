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
test('nearby PUBLIC guardian makes only the real lamp glow; no straight path implied',async()=>{
  const {publicLanternWarning:warning,publicLanternEncounter:beam}=await loaded;
  // This real public geometry matches the original 320px guardian screenshot:
  // sqrt(5) cells separates Pip and Thornback, not a legal straight beam.
  const diagonal=publicFrame({
    cells:[cell(10,[]),cell(19,[])],
    visibleCells:[10,19],threats:[{id:'warden-a',cell:19}],
    doors:[{a:10,b:11,open:false}]
  });
  const unmodified=JSON.stringify(diagonal);
  assert.equal(warning(diagonal,19),true);
  assert.equal(beam(diagonal,19),false,'no invented reciprocal, direct light path');
  assert.equal(JSON.stringify(diagonal),unmodified,'public simulation stays immutable');
  for(const changed of [
    {visibleCells:[10]},{visibleCells:[19]},{threats:[]},
    {cells:[cell(10,[])]},{cells:[cell(10,[]),{...cell(19,[]),blocked:true}]},
    {lifecycle:'result'},{result:{reason:'capture'}},
    {currentCell:10,width:0},{height:0},{currentCell:49},
  ]) assert.equal(warning({...diagonal,...changed},19),false,JSON.stringify(changed));
  assert.equal(warning(diagonal,26),false,'far or undisclosed actor cannot shine');
  const far=publicFrame({
    cells:[cell(10,[]),cell(26,[])],visibleCells:[10,26],
    threats:[{id:'warden-a',cell:26}]
  });
  assert.equal(warning(far,26),false,'2.83 cells is too far');
  const secret={...diagonal,privateThreatCell:37,hiddenRoute:[10,19,37]};
  assert.equal(warning(secret,19),warning(diagonal,19));
  assert.equal(warning({...diagonal,visibleCells:[10],privateThreatCell:19},19),false);
});
test('actual production scene builds one reusable Three light volume with disposal and public-only gate',()=>{
  const scene=fs.readFileSync(scenePath,'utf8');
  const server=fs.readFileSync(path.join(root,'scripts/serve-maze-stream.cjs'),'utf8');
  assert.match(server,/['"]public-lantern-encounter\.mjs['"]/,
    'production HTTP asset allowlist must serve the real imported helper');
  assert.match(scene,/import \{ publicLanternEncounter, publicLanternWarning, publicGuardianOpenSightline, publicGuardianEncounterBeat(?:, publicPressureSurveySightline)? \} from '\.\/public-lantern-encounter\.mjs'/,
    'the actual public-only cone and warning helpers stay wired alongside the staged guardian acting');
  assert.match(scene,/publicGuardianOpenSightline\(s,entry\.cell\)/,
    'paired guardian acting must require a real public open reciprocal corridor');
  assert.match(scene,/attentionStrength=witnessedLocally/,
    'nearby caution alone cannot authorize paired acting');
  assert.match(scene,/publicGuardianEncounterBeat\(gateVisualTime-entry\.encounterStart,settings\.reducedMotion\)/,
    'the newly imported effect must be attached to the existing public-only visual clock');
  assert.match(scene,/new THREE\.CylinderGeometry\(\.055, \.47, 1, 16, 1, true\)/);
  assert.match(scene,/publicLanternEncounter\(\s*s\s*,\s*closestThreat\.cell\s*\)/);
  assert.match(scene,/explorer\.group\.getObjectByName\('lantern cage'\)/);
  assert.match(scene,/explorerLantern\.getWorldPosition\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternLight\.position\.copy\(lanternFocusOrigin\)/,
    'Pip must cast warm 3D light from the modeled animated lantern cage');
  assert.match(scene,/lanternPhysicalLightDistanceWorld: explorerLantern/,
    'native WebGL screenshots must record physical emitter/light alignment');
  assert.doesNotMatch(scene,/lanternLight\.position\.set\(pose\.x \+ \.25, ground \+ 1\.1, pose\.z \+ \.2\)/,
    'do not reintroduce a floating light attached to an invented actor offset');
  assert.match(scene,/lanternBeamDirection\.copy\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternBeam\.position\.copy\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternBeam\.quaternion\.setFromUnitVectors\(lanternBeamAxis,\s*lanternBeamDirection\)/,
    'physical guardian beam must still orient from the verified live lantern and target');
  assert.match(scene,/lanternBeamGeometry\.dispose\(\); lanternBeamMaterial\.dispose\(\)/);
  assert.match(scene,/witnessedLanternConeVisible: lanternBeam\.visible/);
  assert.match(scene,/publicLanternWarning\(s,\s*entry\.cell\)/,
    'each guardian caution cue must be gated to its own currently disclosed public cell');
  assert.match(scene,/lanternWarning\.visible = Boolean\(!result && explorerLantern/,
    'the caution glow must remain a local Pip lantern effect, not a remote projected beam');
  assert.match(scene,/closestWarning\?\.strength > \.35/,
    'only an actually witnessed nearby public guardian can light the caution lantern');
  assert.match(scene,/explorerLantern\?\.add\(lanternWarning\)/);
  assert.match(scene,/lanternWarningGeometry\.dispose\(\); lanternWarningMaterial\.dispose\(\)/);
  assert.match(scene,/witnessedLanternWarningVisible: lanternWarning\.visible/);
  assert.doesNotMatch(scene,/privateThreatCell|hiddenRoute|hiddenExitCell/);
});
