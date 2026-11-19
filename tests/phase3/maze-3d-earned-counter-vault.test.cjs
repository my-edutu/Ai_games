'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const sceneSource=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('Pass507 earned live counter visibly springs the original connected full-body guardian above the reef, then lands',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await production;
  for(const balanced of [false,true]){
    const initial=rigPrimitiveResourceStats();
    const warden=createWarden({balanced});
    const body=warden.group.getObjectByName('armored body');
    const leftLeg=warden.group.getObjectByName('leg -1 0');
    const rightLeg=warden.group.getObjectByName('leg 1 0');
    assert.ok(body?.parent===warden.group && leftLeg?.parent===body && rightLeg?.parent===body,
      'the real complete 3D body, not a floating fake guardian or separate effect, lifts');
    const geometries=new Set(),materials=new Set();
    warden.group.traverse(node=>{if(node.geometry)geometries.add(node.geometry);
      if(node.material)materials.add(node.material)});
    const base={time:0,delta:0,moving:false,heading:0,attentionHeading:0,
      attentionStrength:.9,encounterBeat:0,lanternParried:true,danger:1,reducedMotion:false};
    const pose=(counterPhase,override={})=>{
      warden.update({...base,counterPhase,...override});
      return body.position.y;
    };
    try{
      const planted=pose(.20),launched=pose(.53),fallen=pose(.83),settled=pose(1);
      assert.ok(launched>planted+.70,
        'one earned lantern rebound must carry the FULL original guardian body clear of foreground reef');
      assert.ok(launched>fallen+.70,
        'Thornback lands and stumbles instead of floating permanently');
      assert.equal(pose(undefined),settled,
        'no first-seen or expired event can retain the leap');
      assert.equal(pose(.53,{lanternParried:false}),pose(null,{lanternParried:false}),
        'a false counter cannot trigger an in-world spring');
      assert.equal(pose(.53,{attentionStrength:0}),pose(null,{attentionStrength:0}),
        'an unseen/disengaged opponent cannot trigger this pose');
      assert.equal(pose(.53,{reducedMotion:true}),pose(.83,{reducedMotion:true}),
        'reduced motion keeps a stable existing body position');
      assert.equal(pose(.53,{result:'capture'}),pose(.83,{result:'capture'}),
        'a terminal failure may never show a counterfeit counter');
      assert.equal(pose(.53,{result:'escape'}),pose(.83,{result:'escape'}),
        'the finale may never replay an old counter');
      assert.ok(sceneSource.includes('counterPhase=lanternParried && entry.counterSince!==null'),
        'the 3D rig is fed only the already-proven current public counter clock');
      const nextGeo=new Set(),nextMats=new Set();
      warden.group.traverse(node=>{if(node.geometry)nextGeo.add(node.geometry);
        if(node.material)nextMats.add(node.material)});
      assert.deepEqual(nextGeo,geometries,'no geometry added during frame choreography');
      assert.deepEqual(nextMats,materials,'no GPU material added during frame choreography');
      assert.deepEqual(rigPrimitiveResourceStats(),initial,
        'animation does not allocate new rig primitives');
      warden.reset();
      assert.equal(body.position.y,pose(null,{lanternParried:false,attentionStrength:0,reducedMotion:true}),
        'reset returns the original grounded actor');
    }finally{warden.dispose()}
  }
});
