'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(
  source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));
const base={heading:0,attentionHeading:Math.PI/2,attentionStrength:1,
  encounterBeat:1,lanternParried:true,danger:1,moving:false,
  time:2,delta:0,reducedMotion:false};
test('genuine earned lantern counter rotates and lifts connected Thornback torso toward current viewer, not its patrol root',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const originalRefs=rigPrimitiveResourceStats();
  for(const balanced of [true,false]){
    const actor=createWarden({balanced});
    try{
      const torso=actor.group.getObjectByName('armored body');
      const mask=actor.group.getObjectByName('warden mask');
      const leg=actor.group.getObjectByName('warden leg -1 0');
      assert.ok(torso&&mask,'original full attached upper body and mask');
      const resources=new Set();actor.group.traverse(n=>{
        if(n.geometry)resources.add(n.geometry);
      });
      const rootPosition=actor.group.position.toArray();
      const withoutViewer=()=>actor.update({...base,counterPhase:.09});
      const withViewer=()=>actor.update({...base,counterPhase:.09,
        viewerPosition:{x:actor.group.position.x+10,z:actor.group.position.z+10}});
      withoutViewer();
      const neutral={yaw:torso.rotation.y,y:torso.position.y,faceYaw:mask.rotation.y};
      withViewer();
      assert.ok(torso.rotation.y>neutral.yaw+.35,
        'actual public contact must turn the large connected shell toward the camera');
      assert.ok(mask.rotation.y>neutral.faceYaw+.12,
        'real connected face still looks toward the viewer despite torso turn');
      assert.ok(mask.rotation.y-neutral.faceYaw<.45,
        'mask counter-rotation must avoid unnatural overtwist');
      assert.deepEqual(actor.group.position.toArray(),rootPosition,
        'presentation must never move the authoritative guardian root');
      assert.equal(actor.group.rotation.y,0,
        'patrol route heading stays authoritative');
      const hitY=torso.position.y;
      actor.update({...base,counterPhase:.09,viewerPosition:null});
      assert.ok(Math.abs(torso.position.y-hitY)<1e-9,
        'the physically earned recoil lift is not conditional on viewer location');
      actor.update({...base,counterPhase:null,viewerPosition:{x:10,z:10}});
      assert.ok(Math.abs(torso.rotation.y-neutral.yaw)<1e-9,
        'expired counter cannot preserve a theatrical turn');
      assert.ok(torso.position.y<hitY-.19,
        'actual landed counter visibly raises the connected shell above its steady parried pose');
      for(const override of [
        {lanternParried:false},{attentionStrength:0},{reducedMotion:true},
        {result:'escape'},{result:'capture'}
      ]){
        actor.update({...base,counterPhase:.09,viewerPosition:{x:10,z:10},...override});
        const guardedYaw=torso.rotation.y;
        actor.update({...base,counterPhase:null,viewerPosition:{x:10,z:10},...override});
        assert.equal(torso.rotation.y,guardedYaw,
          'hidden, unearned, reduced-motion and terminal states cannot turn the guardian');
      }
      for(let i=0;i<6;i++){
        withViewer();actor.reset();
        assert.equal(torso.rotation.y,0,'new run clears earned torso rotation');
      }
      const after=new Set();actor.group.traverse(n=>{if(n.geometry)after.add(n.geometry)});
      assert.deepEqual(after,resources,'event reuses geometry; no new WebGL resources');
    }finally{actor.dispose();}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),originalRefs);
});
