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

test('authentic lantern counter reads as two joined large physical Thornback foreclaws',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await production;
  for(const balanced of [false,true]){
    const creature=createWarden({balanced});
    const roots=[-1,1].map(side=>creature.group.getObjectByName(
      'guardian broad opposing foreclaw '+side));
    assert.ok(roots.every((p,i)=>p?.parent?.name==='foreleg pincer '+[-1,1][i]),
      'the new large claws must be actual physically connected feet, not UI effects');
    assert.ok(roots.every(p=>p.children.some(child=>child.isMesh)),
      'each connected pivot has source-owned Three meshes');
    const resources=rigPrimitiveResourceStats();
    const base={time:1,delta:0,moving:false,heading:0,attentionHeading:0,
      attentionStrength:.90,encounterBeat:.45,lanternParried:true,danger:1,
      reducedMotion:false};
    const read=(extra={})=>{
      creature.update({...base,...extra});
      return roots.map(p=>[p.rotation.x,p.rotation.y,p.rotation.z]);
    };
    try{
      const load=read({counterPhase:.20});
      const release=read({counterPhase:.60});
      const collapse=read({counterPhase:.83});
      const neutral=read({counterPhase:1});
      assert.ok(Math.abs(load[0][1]-release[0][1])>.85
        &&Math.abs(load[1][1]-release[1][1])>.85,
        'source-earned counter must OPEN the full joined claw silhouette on BOTH sides');
      assert.ok(Math.abs(collapse[0][2]-load[0][2])>.2,
        'real retreat visibly folds the planted original foreclaw');
      assert.deepEqual(read({counterPhase:1}),neutral,
        'the end of the true clock is deterministic');
      assert.deepEqual(read({lanternParried:false,counterPhase:.60}),
        read({lanternParried:false,counterPhase:1}),
        'unearned event never produces a simulated successful impact');
      assert.deepEqual(read({reducedMotion:true,counterPhase:.20}),
        read({reducedMotion:true,counterPhase:.60}),
        'reduced-motion remains a steady truthful actor silhouette');
      assert.deepEqual(read({result:'capture',counterPhase:.60}),
        read({result:'capture',counterPhase:.20}),
        'terminal scene suppresses the staged counter');
      for(let i=0;i<6;i++){
        read({counterPhase:.83,time:i});
        creature.reset();
        for(const pivot of roots)
          assert.deepEqual([pivot.rotation.x,pivot.rotation.y,pivot.rotation.z],[0,0,0],
            'six resets do not retain a phantom defender pose');
      }
      assert.deepEqual(rigPrimitiveResourceStats(),resources,
        'no geometry/material identity is created during performances');
    }finally{creature.dispose()}
  }
});
