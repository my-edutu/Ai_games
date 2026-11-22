'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const code=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(code.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('earned OPEN public bend changes Pip connected torso/lantern orientation, never root/route or resources',async()=>{
  const {createExplorer}=await production;
  for(const balanced of [false,true]){
    const pip=createExplorer({balanced});
    try {
      const body=pip.group.getObjectByName('breathing torso');
      const head=pip.group.getObjectByName('curious head');
      const lamp=pip.group.getObjectByName('lantern cage');
      assert.ok(body&&head&&lamp);
      const meshResources=()=>{const res=new Set();pip.group.traverse(o=>{
        if(o.geometry)res.add(o.geometry);if(o.material)res.add(o.material);
      });return res;};
      const original=meshResources();
      const common={time:1,delta:0,heading:0,moving:false,attentionHeading:Math.PI/2,
        attentionStrength:.86,guardianEncounterBeat:undefined,
        lanternParried:true,earnedCounterPhase:.20,reducedMotion:false};
      const pose=extra=>{pip.update({...common,...extra});return {
        torso:body.rotation.y,head:head.rotation.y,root:pip.group.rotation.y,
        lampParent:lamp.parent};};
      const ordinary=pose({counterLanternTarget:undefined});
      const staged=pose({counterLanternTarget:{x:4.8,y:1.2,z:0}});
      assert.ok(staged.torso>ordinary.torso+.50,
        'Pip turns its connected torso toward real witnessed corridor instead of only wrist glow');
      assert.ok(Math.abs(staged.head+staged.torso-(Math.PI/2))
        <Math.abs(ordinary.head+ordinary.torso-(Math.PI/2)),
        'attached face and chest approach the same public target');
      const armRelease=pose({counterLanternTarget:{x:4.8,y:1.2,z:0},earnedCounterPhase:.42});
      const releaseNeutral=pose({counterLanternTarget:undefined,earnedCounterPhase:.42});
      assert.equal(armRelease.torso,releaseNeutral.torso,
        'after the witnessed initial chest counter Pip releases into the original independently aimed shoulder');
      assert.equal(staged.root,ordinary.root,'autonomous route heading stays exact');
      assert.equal(staged.lampParent,ordinary.lampParent,'original lantern remains joined');
      assert.deepEqual(pose({counterLanternTarget:{x:4.8,y:1.2,z:0}}),staged,
        'same frame can be rendered deterministically');
      assert.deepEqual(pose({counterLanternTarget:{x:4.8,y:1.2,z:0},reducedMotion:true}),
        pose({reducedMotion:true,counterLanternTarget:undefined}),
        'reduced-motion suppresses extra cinematic turn');
      assert.deepEqual(pose({counterLanternTarget:{x:4.8,y:1.2,z:0},result:'capture'}),
        pose({counterLanternTarget:undefined,result:'capture'}),
        'terminal state cannot keep a ghost gesture');
      assert.deepEqual(pose({counterLanternTarget:{x:4.8,y:1.2,z:0},earnedCounterPhase:1}),
        pose({counterLanternTarget:undefined,earnedCounterPhase:1}),
        'expired counter returns to existing locomotion frame');
      assert.deepEqual(meshResources(),original,'no new geometry or materials');
    }finally{pip.dispose();}
  }
});
