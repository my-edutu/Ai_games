'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('Pip turns its connected torso toward a genuinely witnessed guardian while keeping autonomous boots and route',async()=>{
  const {createExplorer}=await production;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const pip=createExplorer({balanced});
    const body=pip.group.getObjectByName('breathing torso');
    const head=pip.group.getObjectByName('curious head');
    const lamp=pip.group.getObjectByName('lantern cage');
    const hip=pip.group.getObjectByName('hip 1');
    assert.ok(body&&head&&lamp&&hip,'connected existing actor and equipment stay present');
    const resources=new Set();
    pip.group.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);});
    const cue={heading:0,attentionHeading:1.3,attentionStrength:.8,
      danger:.8,moving:false,time:1,delta:0,reducedMotion};
    const pose=()=>({root:pip.group.rotation.y,torso:body.rotation.y,head:head.rotation.y,
      hip:hip.rotation.y,lanternParent:lamp.parent});
    pip.update({...cue,guardianEncounterBeat:0});
    const recognition=pose();
    pip.update({...cue,guardianEncounterBeat:.5});
    const brace=pose();
    pip.update({...cue,guardianEncounterBeat:1});
    const release=pose();
    assert.ok(brace.torso>recognition.torso+.55,
      'actual early warning earns a legible torso turn by the physical brace');
    assert.ok(release.torso<brace.torso-.08 && release.torso>recognition.torso+.45,
      'connected torso recovers modestly on the actual public shell release');
    assert.ok(Math.abs((brace.torso+brace.head)-cue.attentionHeading)
      <Math.abs((recognition.torso+recognition.head)-cue.attentionHeading),
      'head counter-turn must keep eyes closer to the real threat bearing, not overtwist');
    assert.deepEqual([recognition.root,brace.root,release.root],[0,0,0],
      'presentation must never change the autonomous root heading');
    assert.deepEqual([recognition.hip,brace.hip,release.hip],[0,0,0],
      'physical leg route bearings must remain authoritative');
    assert.equal(recognition.lanternParent,brace.lanternParent,
      'original lantern must stay joined to the existing articulated body');
    pip.update({...cue,guardianEncounterBeat:1});
    assert.deepEqual(pose(),release,'same public pose replays exactly');
    pip.update({...cue,attentionStrength:0,attentionHeading:undefined,guardianEncounterBeat:1});
    assert.equal(body.rotation.y,0,'lost public witness resets torso to route');
    pip.update({...cue,result:'capture',guardianEncounterBeat:.5});
    assert.equal(body.rotation.y,0,'terminal outcome forbids ghost danger turn');
    pip.update({...cue,guardianEncounterBeat:undefined});
    assert.ok(Math.abs(body.rotation.y)<.11,
      'no public guardian clock preserves restrained ordinary attention behavior');
    const after=new Set();
    pip.group.traverse(o=>{if(o.geometry)after.add(o.geometry);if(o.material)after.add(o.material);});
    assert.deepEqual(after,resources,'event must not allocate a geometry or material');
    pip.dispose();
    assert.equal(pip.group.children.length,0);
  }
});
