'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const characterFile=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const sceneFile=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(characterFile.replace("'./vendor/three.module.js'",JSON.stringify(three)))
    .toString('base64'));

// Test physically connected production THREE pivots, not an interpolated UI
// caption, isolated helper or the number of passed source checks.
test('Pass426 one publicly earned lantern counter plants, rebounds and recovers the real complete guardian rig',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await production;
  const warden=createWarden({balanced:true});
  const body=warden.group.getObjectByName('armored body');
  const foreleg=warden.group.getObjectByName('leg -1 0');
  const wing=warden.group.getObjectByName('flared elytron -1');
  assert.ok(body?.parent&&foreleg?.parent&&wing?.parent,
    'three independent anatomical pivots belong to one actual model');
  const original=rigPrimitiveResourceStats();
  const base={time:0,delta:0,moving:false,heading:0,attentionHeading:0,
    attentionStrength:.9,encounterBeat:0,lanternParried:true,danger:1,
    reducedMotion:false};
  const capture=(options)=>{warden.update({...base,...options});return {
    torso:body.position.y,torsoPitch:body.rotation.x,
    foreleg:foreleg.rotation.x,wing:wing.rotation.z
  }};
  try{
    const idle=capture({counterPhase:null});
    const load=capture({counterPhase:.20});
    const release=capture({counterPhase:.60});
    const recovery=capture({counterPhase:1});
    assert.ok(load.torso<release.torso-.15,
      'actual shell mass compresses into grounded forelegs then rebounds');
    assert.ok(load.foreleg<release.foreleg-.30,
      'the existing forward leg plants, then releases');
    assert.ok(Math.abs(release.wing)>Math.abs(load.wing)+.20,
      'connected carapace spreads on actual source-earned rebound');
    assert.ok(Math.abs(load.torsoPitch-release.torsoPitch)>.25,
      'complete body acts with the same earned lantern event');
    for(const key of Object.keys(idle))
      assert.ok(Math.abs(recovery[key]-idle[key])<1e-9,
        key+' returns to its trusted neutral parried pose after recovery');

    const notEarned=capture({lanternParried:false,counterPhase:.20});
    const noCounter=capture({lanternParried:false,counterPhase:null});
    assert.deepEqual(notEarned,noCounter,'a fake local counter cannot animate Thornback');
    const reducedLoad=capture({reducedMotion:true,counterPhase:.20});
    const reducedRelease=capture({reducedMotion:true,counterPhase:.60});
    assert.deepEqual(reducedLoad,reducedRelease,
      'reduced-motion keeps a stable truly observed guardian pose');
    const terminalLoad=capture({result:'escape',counterPhase:.20});
    const terminalRelease=capture({result:'escape',counterPhase:.60});
    assert.deepEqual(terminalLoad,terminalRelease,
      'terminal state must not celebrate or retain an obsolete parry');

    const after=rigPrimitiveResourceStats();
    assert.deepEqual(after,original,
      'the physical reaction reuses the real rig; zero new GPU resource class');
    warden.reset();
    assert.ok(Math.abs(body.rotation.x)<1e-9,
      'the neutral original guardian survives a full public encounter reset');
  }finally{
    warden.dispose();
  }
});

test('Pass426 scene clock demands a tracked same-run public false-to-true witness',()=>{
  assert.ok(sceneFile.includes('previousWardenSnapshot?.runToken === snapshot.runToken'),
    'a stale prior run may never earn a new counter');
  assert.ok(sceneFile.includes('previouslyTracked && entry.lanternParried!==true'),
    'a first-discovered already-parried guardian cannot invent a new impact');
  assert.ok(sceneFile.includes('previousWardenSnapshot.visibleCells?.includes(earlier.cell)'),
    'an earlier hidden enemy never generates a counter beat');
  assert.ok(sceneFile.includes('snapshot.visibleCells?.includes(threat.cell)'),
    'an enemy no longer publicly visible cannot animate the scene');
  assert.ok(sceneFile.includes('counterPhase=lanternParried && entry.counterSince!==null'),
    'only an actual current publicly parried guardian receives the clock');
});


test('Pass449 genuine public lantern counter makes the whole connected Thornback stagger and recover', async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await production;
  for(const balanced of [false,true]) {
    const initial=rigPrimitiveResourceStats();
    const warden=createWarden({balanced});
    const torso=warden.group.getObjectByName('armored body');
    const mask=warden.group.getObjectByName('warden mask');
    const left=warden.group.getObjectByName('leg -1 0');
    const right=warden.group.getObjectByName('leg 1 0');
    assert.ok(torso?.parent&&mask?.parent===torso&&left?.parent&&right?.parent,
      'every recoil beat belongs to the original complete physical guardian');
    const originalShapes=new Set(),originalMaterials=new Set();
    warden.group.traverse(n=>{if(n.geometry)originalShapes.add(n.geometry);if(n.material)originalMaterials.add(n.material)});
    const source={heading:0,attentionHeading:0,attentionStrength:.9,encounterBeat:0,
      lanternParried:true,danger:1,moving:false,delta:0,time:0,reducedMotion:false};
    const pose=(extra)=>{
      warden.update({...source,...extra});
      return {roll:torso.rotation.z,shift:torso.position.x,face:mask.rotation.z,
        left:left.rotation.z,right:right.rotation.z};
    };
    try{
      const loaded=pose({counterPhase:.20}),rebounded=pose({counterPhase:.60});
      const collapsed=pose({counterPhase:.83}),neutral=pose({counterPhase:1});
      assert.ok(loaded.roll>.16 && rebounded.roll<-.32,
        'the full connected shell visibly winds and recoils in opposite directions');
      assert.ok(collapsed.roll>rebounded.roll+.70,
        'a genuine landed counter must visibly topple the original armored body');
      assert.ok(collapsed.shift>rebounded.shift+.5,
        'the carapace performs an actual stagger over its planted existing legs');
      assert.ok(Math.abs(collapsed.face+collapsed.roll*.55)<1e-9,
        'the real mask counter-rolls toward Pip while the connected shell falls');
      assert.ok(Math.abs(collapsed.right)>Math.abs(collapsed.left)+.30,
        'one existing foreleg bears the stagger while the opposite foreleg withdraws');
      assert.deepEqual(neutral,{roll:0,shift:0,face:0,left:0,right:0},
        'all physical stagger axes return to zero when source counter ends');
      assert.deepEqual(pose({counterPhase:1}),neutral,
        'same public clock produces the same physical neutral state');
      const firstSeen=pose({counterPhase:undefined});
      assert.deepEqual(firstSeen,neutral,
        'first-seen already-parried warden cannot fake a newly earned impact');
      const fake=pose({lanternParried:false,counterPhase:.83});
      const noImpact=pose({lanternParried:false,counterPhase:undefined});
      assert.deepEqual(fake,noImpact,
        'an unearned counter clock does not influence physical acting');
      const reduced=pose({reducedMotion:true,counterPhase:.83});
      assert.deepEqual(reduced,pose({reducedMotion:true,counterPhase:.20}),
        'reduced motion does not topple an already-observed living opponent');
      assert.deepEqual(pose({result:'escape',counterPhase:.83}),
        pose({result:'escape',counterPhase:.20}),
        'terminal result suppresses any stale win presentation');
      for(let run=0;run<6;run++){
        pose({counterPhase:.83,time:run});
        warden.reset();
        assert.equal(torso.rotation.z,0);
        assert.equal(torso.position.x,0);
        assert.equal(mask.rotation.z,0);
      }
      const shapes=new Set(),materials=new Set();
      warden.group.traverse(n=>{if(n.geometry)shapes.add(n.geometry);if(n.material)materials.add(n.material)});
      assert.deepEqual(shapes,originalShapes,'six real body performances reuse every 3D geometry');
      assert.deepEqual(materials,originalMaterials,'no new material for an earned counter');
    }finally{
      warden.dispose();
    }
    assert.deepEqual(rigPrimitiveResourceStats(),initial,
      'all authored GPU/CPU primitive owners release after the six-run sequence');
  }
});
