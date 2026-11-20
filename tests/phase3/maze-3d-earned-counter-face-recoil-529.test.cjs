'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const load=()=>import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('Pass529 real published lantern counter reveals complete beetle face and collapses guarding silhouette, no invented hit',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const baseline=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const w=createWarden({balanced});
    try{
      const body=w.group.getObjectByName('armored body');
      const head=w.group.getObjectByName('warden mask');
      const guards=[-1,1].map(s=>w.group.getObjectByName('articulated guardian shoulder guard '+s));
      const fronds=[-1,1].map(s=>w.group.getObjectByName('unfurled sea-glass wing fronds '+s));
      const pupils=[-1,1].map(s=>w.group.getObjectByName('rooted guardian readable pupil '+s));
      const lens=head.children.find(n=>n.isMesh
        &&n.material?.color?.getHexString()==='ff8650');
      assert.ok(body&&head?.parent===body&&guards.every(g=>g?.parent===body));
      assert.ok(fronds.every(g=>g?.parent)
        &&pupils.every((p,i)=>p?.parent?.parent===head
          &&p.parent.name===`rooted guardian pupil root ${i===0?-1:1}`)
        &&lens,'both real optics and pupil geometry survive rigid-mesh batching');
      const shapes=new Set(),materials=new Set();
      w.group.traverse(n=>{if(n.geometry)shapes.add(n.geometry);if(n.material)materials.add(n.material);});
      const base={heading:0,attentionHeading:0,attentionStrength:1,encounterBeat:0,
        lanternParried:true,danger:1,moving:false,time:1,delta:0,reducedMotion:false};
      const camera={x:0,z:-10};
      const pose=opt=>{w.update({...base,...opt});return {
        bodyYaw:body.rotation.y,faceYaw:head.rotation.y,
        guard:guards[0].rotation.x,fin:fronds[0].rotation.z,
        eyes:lens.material.emissiveIntensity}};
      const hit=pose({counterPhase:.20,viewerPosition:camera});
      assert.ok(hit.bodyYaw>1.3&&hit.bodyYaw<1.7,
        'actual source-earned parry turns the full connected shell toward the view');
      assert.ok(Math.abs(Math.PI-hit.bodyYaw-hit.faceYaw)<.6,
        'connected upper mask faces camera, not hidden dorsal shell');
      assert.ok(Math.abs(hit.guard)<.20,
        'impact drops the formerly blocking armor shields from its face');
      assert.ok(hit.fin<-.65,'both physically attached sea-glass screens sweep aside');
      assert.ok(hit.eyes>2.3,'visible optical expression answers the earned hit');
      assert.deepEqual(w.group.position.toArray(),[0,0,0],
        'cosmetic presentation cannot move the authoritative patrol root');
      const expired=pose({counterPhase:1,viewerPosition:camera});
      assert.deepEqual(pose({counterPhase:null,viewerPosition:camera}),expired,
        'spent and first-seen parries never re-enact the counter');
      const unearned=pose({lanternParried:false,counterPhase:.20,viewerPosition:camera});
      assert.deepEqual(unearned,pose({lanternParried:false,counterPhase:null,viewerPosition:camera}));
      for(const flags of [{reducedMotion:true},{attentionStrength:0},
        {result:'escape'},{result:'capture'}]){
        const active=pose({...flags,counterPhase:.20,viewerPosition:camera});
        assert.deepEqual(active,pose({...flags,counterPhase:null,viewerPosition:camera}),
          'privacy, reduced motion and terminal source reality suppress staging');
      }
      for(let i=0;i<6;i++){pose({counterPhase:.20,viewerPosition:camera});w.reset();assert.equal(body.rotation.y,0);}
      const laterShapes=new Set(),laterMaterials=new Set();
      w.group.traverse(n=>{if(n.geometry)laterShapes.add(n.geometry);if(n.material)laterMaterials.add(n.material);});
      assert.deepEqual(laterShapes,shapes,'no per-frame GPU geometry allocation');
      assert.deepEqual(laterMaterials,materials,'no per-frame GPU material allocation');
    }finally{w.dispose();}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),baseline,
    'all original primitive owners clean up after six resets');
});
