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
