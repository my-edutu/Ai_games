'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const camera=()=>import(pathToFileURL(path.join(root,
  'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const scene=fs.readFileSync(path.join(root,
  'public/ai-maze-escape/scene.js'),'utf8');

test('Pass415 the real body/fossil screen intersection selects only substantial connected silhouettes',async()=>{
  const {publicEarnedGuardianScenicStageOverlap:overlap}=await camera();
  const pip={left:-.35,right:.40,bottom:-.43,top:.30,nearestZ:.02};
  const fossil={left:-.25,right:.25,bottom:-.20,top:.51,nearestZ:.08};
  assert.equal(overlap(pip,fossil,true),true,
    'the foreground theatre must respond even when Pip has a protruding lantern tip');
  assert.equal(overlap(pip,fossil,false),false,
    'an unwitnessed parry cannot lower ornamental scenery');
  assert.equal(overlap(pip,{...fossil,left:.8,right:1},true),false,
    'off-screen unrelated sculptures do not receive a global cutaway');
  assert.equal(overlap(pip,{...fossil,left:.39,right:.64},true),false,
    'a one-pixel tangency is not a whole-scene recession');
  for(const bad of [null,undefined,{...fossil,left:NaN},
    {...fossil,nearestZ:Infinity},{...fossil,nearestZ:1.1},
    {...fossil,bottom:.8,top:.2}])
    assert.equal(overlap(pip,bad,true),false);
});

test('Pass415 production stages actual published fossil roots with linked physical recession; no fake event or hidden maze',()=>{
  assert.match(scene,/earnedScenicStage=cameraMode==='follow'/);
  assert.match(scene,/earnedGuardianFrame && verifiedGuardianModel\?\.parent/);
  assert.match(scene,/s\?\.lifecycle==='running'/);
  assert.match(scene,/visible\.has\(cell\)/);
  assert.match(scene,/Math\.min\(distance\(cell,s\.currentCell\),/);
  assert.match(scene,/distance\(cell,earnedCounterActor\.cell\)\)>3/);
  assert.match(scene,/stageCells\.add\(cell\)/);
  assert.match(scene,/stageCells\.has\(cell\)\|\|scenic\.userData\.parrySightlineHidden===true/);
  assert.match(scene,/scenic\.position\.y=scenic\.userData\.parryRecessBaseY-2\.65\*amount/);
  assert.match(scene,/scenic\.visible=true/);
  assert.doesNotMatch(scene,/scenic\.visible=false/,
    'physical connected tidewall recession replaces cosmetic disappearance');
  assert.doesNotMatch(scene,/privateMaze|secretRoute|hiddenMap.*parryRecess/,
    'selection does not consult engine-private navigation data');
});
