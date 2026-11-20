'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(
  source.replace("'./vendor/three.module.js'",JSON.stringify(three))
).toString('base64'));
const baseline={heading:0,attentionHeading:Math.PI/2,attentionStrength:1,
  encounterBeat:1,lanternParried:true,danger:1,moving:false,time:2,delta:.033,
  reducedMotion:false};
test('Pass519 earned true-public counter exposes the connected 3D mask and fans cheek armor without moving patrol root or creating objects',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const ownership=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const w=createWarden({balanced}),rootPos=w.group.position.clone();
    const mask=w.group.getObjectByName('warden mask');
    const shields=[-1,1].map(side=>({
      side,hinge:w.group.getObjectByName('articulated guardian facial shell '+side),
      fronds:w.group.getObjectByName('unfurled sea-glass wing fronds '+side)
    }));
    assert.ok(mask&&shields.every(x=>x.hinge&&x.fronds));
    const geometries=new Set();w.group.traverse(n=>{if(n.geometry)geometries.add(n.geometry)});
    w.update({...baseline,counterPhase:null});
    const idle={y:mask.position.y,z:mask.position.z,angle:mask.rotation.x};
    w.update({...baseline,counterPhase:.6});
    assert.ok(mask.position.y>idle.y+.30,'bronze face must rise above the crowded real shell');
    assert.ok(mask.position.z>idle.z+.32,'jaws/eyes must project forward instead of remaining concealed');
    assert.ok(mask.rotation.x<idle.angle-.28,'connected mask must visibly recoil upward');
    for(const x of shields){
      assert.ok(x.side*x.hinge.rotation.y>.5,'cheek shields must fan outside both actual eye apertures');
      assert.ok(x.side*x.hinge.rotation.z>.25,'the paired cheek armor should articulate, not resemble flat bars');
      assert.ok(x.fronds.rotation.x< -1.3,'linked botanical screen must hinge back substantially');
      assert.ok(x.fronds.visible,'do not simply hide character anatomy');
    }
    assert.deepEqual(w.group.position.toArray(),rootPos.toArray());
    w.update({...baseline,counterPhase:1});
    const expired={y:mask.position.y,z:mask.position.z,angle:mask.rotation.x,
      shell:shields.map(x=>[x.hinge.rotation.y,x.hinge.rotation.z,x.fronds.rotation.x])};
    w.update({...baseline,counterPhase:null});
    assert.deepEqual({y:mask.position.y,z:mask.position.z,angle:mask.rotation.x,
      shell:shields.map(x=>[x.hinge.rotation.y,x.hinge.rotation.z,x.fronds.rotation.x])},expired,
      'end of witnessed event restores genuine steady source pose');
    w.update({...baseline,counterPhase:.6,reducedMotion:true});
    const reduced={y:mask.position.y,z:mask.position.z,angle:mask.rotation.x};
    w.update({...baseline,counterPhase:null,reducedMotion:true});
    assert.deepEqual({y:mask.position.y,z:mask.position.z,angle:mask.rotation.x},reduced,
      'reduced-motion mode must not inherit violent recoil');
    w.update({...baseline,counterPhase:.6,attentionStrength:0});
    const unseen={y:mask.position.y,z:mask.position.z};
    w.update({...baseline,counterPhase:null,attentionStrength:0});
    assert.deepEqual({y:mask.position.y,z:mask.position.z},unseen,'hidden guardian cannot animate parry');
    w.update({...baseline,counterPhase:.6,result:'escape'});
    for(const x of shields)assert.equal(x.fronds.visible,false);
    const after=new Set();w.group.traverse(n=>{if(n.geometry)after.add(n.geometry)});
    assert.deepEqual(after,geometries,'reuse rig geometry over the performance');
    w.dispose();
  }
  assert.deepEqual(rigPrimitiveResourceStats(),ownership);
});

test('Pass520 real publicly earned recoil exposes larger face/optics toward actual camera, with truthful neutral and no new geometry',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const initial=rigPrimitiveResourceStats();
  for (const balanced of [true,false]) {
    const w=createWarden({balanced}),face=w.group.getObjectByName('warden mask');
    assert.ok(face,'original articulated face remains physically connected');
    const geometryBefore=new Set();w.group.traverse(n=>{if(n.geometry)geometryBefore.add(n.geometry)});
    const still={...baseline,delta:0};
    w.update({...still,counterPhase:.6});
    const noCameraYaw=face.rotation.y;
    assert.ok(face.scale.x>1.24&&face.scale.x<1.31,
      'the earned reaction visibly widens the entire genuine face');
    w.update({...still,counterPhase:.6,
      viewerPosition:{x:w.group.position.x+10,z:w.group.position.z+10}});
    assert.ok(face.rotation.y>noCameraYaw+.12,
      'current scene camera earns a restrained face-quarter instead of the dorsal view');
    assert.ok(face.rotation.y-noCameraYaw<=.64+1e-8,
      'the connected face cannot unrealistically swivel beyond the cap');
    w.update({...still,counterPhase:null,
      viewerPosition:{x:10,z:10}});
    assert.equal(face.scale.x,1,'expired event cannot keep an enlarged mask');
    w.update({...still,counterPhase:.6,reducedMotion:true,
      viewerPosition:{x:10,z:10}});
    assert.equal(face.scale.x,1,'reduced motion keeps truthful, stable anatomy');
    w.update({...still,counterPhase:.6,attentionStrength:0,
      viewerPosition:{x:10,z:10}});
    assert.equal(face.scale.x,1,'unknown enemy cannot perform earned cinematic');
    w.update({...still,counterPhase:.6,result:'escape',
      viewerPosition:{x:10,z:10}});
    assert.equal(face.scale.x,1,'terminal run never retains a parry pose');
    const after=new Set();w.group.traverse(n=>{if(n.geometry)after.add(n.geometry)});
    assert.deepEqual(after,geometryBefore,'no new render geometry in a frame');
    w.dispose();
  }
  assert.deepEqual(rigPrimitiveResourceStats(),initial);
});

test('Pass521 real lantern impact reveals the complete source-earned face during the HUD hit, not half a second later',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const before=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const w=createWarden({balanced});
    try {
      const head=w.group.getObjectByName('warden mask');
      const fronds=w.group.getObjectByName('unfurled sea-glass wing fronds -1');
      const cheek=w.group.getObjectByName('articulated guardian facial shell -1');
      assert.ok(head&&fronds&&cheek);
      const originalShapes=new Set();
      w.group.traverse(n=>{if(n.geometry)originalShapes.add(n.geometry)});
      const base={...baseline,delta:0,viewerPosition:{x:10,z:10}};
      const pose=(phase,extra={})=>{
        w.update({...base,counterPhase:phase,...extra});
        return {scale:head.scale.x,y:head.position.y,z:head.position.z,
          pitch:head.rotation.x,yaw:head.rotation.y,
          cheek:Math.abs(cheek.rotation.y),frond:fronds.rotation.x};
      };
      const resting=pose(null),first=pose(.09),release=pose(.60);
      assert.ok(first.scale>1.26 && first.scale<=1.30,
        'actual counter-hit caption must coincide with a physically legible full mask');
      assert.ok(first.y>resting.y+.30 && first.z>resting.z+.30,
        'at the true hit the connected eye and jaw must already clear the existing shell');
      assert.ok(first.pitch<resting.pitch-.28,
        'face must look up on the actual impact, not after the player has moved');
      assert.ok(first.cheek>resting.cheek+.55 && first.frond< -1.12,
        'the original connected cheek/sea-glass armor must reveal real eyes immediately');
      assert.ok(first.yaw>resting.yaw+.12,
        'newly hit guardian must react toward the real scene camera on the impact');
      assert.ok(Math.abs(first.scale-release.scale)<.01,
        'early hit reaction must carry through the later genuine body recoil');
      const ended=pose(1);
      assert.deepEqual(ended,resting,'expired actual counter cannot keep a false facial performance');
      for(const override of [
        {lanternParried:false},{attentionStrength:0},
        {reducedMotion:true},{result:'escape'},{result:'capture'}
      ])assert.equal(pose(.09,override).scale,1,
        'unearned, unseen, reduced or ended encounters cannot enlarge the model');
      for(let run=0;run<6;run++){
        pose(.09);w.reset();
        assert.equal(head.scale.x,1,'fresh run must reset the exact actor face');
      }
      const finalShapes=new Set();
      w.group.traverse(n=>{if(n.geometry)finalShapes.add(n.geometry)});
      assert.deepEqual(finalShapes,originalShapes,'early 3D acting reuses original geometry');
    }finally{w.dispose()}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),before,
    'no leaked primitive buffers across the two rig qualities');
});
