'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const cueModule=import(pathToFileURL(path.join(root,'public/ai-maze-escape/public-lantern-encounter.mjs')).href);
const threeURL=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const characterModule=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(threeURL))).toString('base64'));
const linkedScene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

const witness=()=>({lifecycle:'running',result:null,visibleCells:[90,91,74],
  threats:[{id:'threat-1',cell:74,lanternParried:true}]});
test('only a current visible, authoritative PUBLIC lantern recoil earns Pip a physical acting cue',async()=>{
  const {publicEarnedGuardianActing:acting}=await cueModule;
  const saved={cell:74,x:2.4,z:-4.8};
  const cue=acting(witness(),saved,null);
  assert.equal(cue.lanternParried,true);
  assert.equal(cue.strength,.86);
  assert.deepEqual([cue.x,cue.z],[2.4,-4.8]);
  for(const change of [
    s=>{s.visibleCells=[90,91]},
    s=>{s.threats[0].lanternParried=false},
    s=>{s.threats=[]},
    s=>{s.lifecycle='intermission'},
    s=>{s.result={reason:'capture'}},
  ]){
    const s=witness();change(s);
    assert.equal(acting(s,saved,null),null,'no ghost reaction across public witness loss');
  }
  assert.equal(acting(witness(),{...saved,x:NaN},null),null);
  assert.equal(acting(witness(),{...saved,cell:undefined},null),null);
  const other={x:1,z:2,cell:91,strength:.9,lanternParried:false};
  assert.equal(acting(witness(),saved,other),other,
    'do not misattribute a stronger distinct current warning to the parried enemy');
  const same=acting(witness(),saved,{...saved,strength:.62,lanternParried:true,encounterBeat:.45});
  assert.equal(same.strength,.86);
  assert.equal(same.encounterBeat,.45);
  assert.match(linkedScene,/publicEarnedGuardianActing\(s,earnedCounterActor,originalThreat\)/,
    'the native renderer must actually consume the PUBLIC helper');
  assert.match(linkedScene,/attentionHeading:closestThreat\?/);
  assert.match(linkedScene,/lanternParried:closestThreat\?\.lanternParried===true/);
});

test('actual Pip rig plants toward the earned moving counter without changing its autonomous route or allocating geometry',async()=>{
  const {publicEarnedGuardianActing:acting}=await cueModule;
  const {createExplorer}=await characterModule;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const pip=createExplorer({balanced});
    const torso=pip.group.getObjectByName('breathing torso');
    const lantern=pip.group.getObjectByName('lantern cage');
    assert.ok(torso && lantern);
    const resources=new Set();
    pip.group.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material)});
    const cue=acting(witness(),{cell:74,x:2.4,z:-4.8},null);
    const ordinary={heading:0,attentionHeading:1.3,attentionStrength:cue.strength,
      moving:false,time:1,delta:0,reducedMotion};
    pip.update({...ordinary,lanternParried:false});
    const neutral=torso.rotation.y;
    const lanternParent=lantern.parent;
    pip.update({...ordinary,lanternParried:cue.lanternParried});
    assert.ok(Math.abs(torso.rotation.y)>Math.abs(neutral)+.36,
      'earned recoil makes a visibly larger connected torso/lantern-facing action');
    assert.equal(pip.group.rotation.y,0,'no authoritative route yaw changed');
    assert.equal(lantern.parent,lanternParent,'lantern remains mechanically attached');
    pip.update({...ordinary,attentionHeading:undefined,attentionStrength:0,lanternParried:false});
    assert.equal(torso.rotation.y,0,'lost public witness resets facing immediately');
    const after=new Set();
    pip.group.traverse(o=>{if(o.geometry)after.add(o.geometry);if(o.material)after.add(o.material)});
    assert.deepEqual(after,resources,'no geometry/material allocation in live actor posing');
    pip.dispose();
  }
});
