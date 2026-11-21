'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const characters=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(
  characters.replace("'./vendor/three.module.js'",JSON.stringify(three))
).toString('base64'));

test('a witnessed earned lantern counter physically folds Thornback own connected botanical screen, restoring the full original live and neutral character',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const before=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const warden=createWarden({balanced});
    const anatomy=[-1,1].map(side=>({
      side,wing:warden.group.getObjectByName('flared elytron '+side),
      fronds:warden.group.getObjectByName('unfurled sea-glass wing fronds '+side),
      tideblade:warden.group.getObjectByName('fixed sculpted warden tideblade '+side)
    }));
    const body=warden.group.getObjectByName('armored body');
    const head=warden.group.getObjectByName('warden mask');
    assert.ok(body&&head&&anatomy.every(a=>a.fronds?.parent===a.wing&&a.tideblade?.parent===a.wing));
    // Pass554: meaningful source-anatomy reconstruction, not a CSS/camera
    // masking trick. The permanently FULL-SIZED scutes and the two live
    // fore-guards must now be rooted behind the physical bronze mask,
    // opening the face while preserving their genuine hinged reactions.
    assert.ok(head.position.z>.7,'the complete root-connected mask stays forward');
    for(const a of anatomy) {
      assert.ok(a.tideblade.position.z<=-.28 && a.tideblade.position.y<=.20,
        'the original entire large sculpted shoulder armor sits on the rear shell');
      const blade=a.tideblade.children.find(part=>part.isMesh
        &&part.material?.color?.getHexString()==='e1c997');
      assert.ok(blade && blade.rotation.x<=-1.20
        && Math.abs(blade.rotation.z)>=.90,
        'the complete unshrunk ivory scute sweeps posteriorly away from both eyes');
      assert.ok(blade.geometry,'full 3D relief is still physical');
    }
    for(const side of [-1,1]) {
      const guard=warden.group.getObjectByName('articulated guardian shoulder guard '+side);
      assert.ok(guard?.parent===body && guard.position.z<=.05 && Math.abs(guard.position.x)>=.4,
        'each real moving guard roots laterally behind the two live eye sockets');
    }
    const resources=new Set();warden.group.traverse(n=>{if(n.geometry)resources.add(n.geometry);});
    const state={heading:0,attentionHeading:Math.PI/2,attentionStrength:1,
      encounterBeat:1,lanternParried:false,danger:1,moving:false,time:2,delta:.033,
      reducedMotion:false};
    warden.update(state);
    for(const a of anatomy){
      assert.equal(a.fronds.rotation.x,0,'warning/release keeps the original upright botanical armour');
      assert.ok(a.fronds.scale.y>1,'real full armour shell remains expressive before Pip earns the counter');
    }
    const floor=[...warden.group.position.toArray()];
    // Pass553b: the FIRST authenticated contact is already a visible
    // counter, before delayed recoil reaches .11. Both original full-size
    // rooted crests must actually fold at phase 0; neutral/false/reduced
    // callbacks below still retain their previous strict reset contracts.
    warden.update({...state,lanternParried:true,counterPhase:0});
    for (const a of anatomy) {
      assert.ok(a.fronds.rotation.x<-1,
        'source-earned first frame must retract actual tall botanical armor');
      assert.ok(a.fronds.scale.y<.60,
        'initial lantern contact must show beetle anatomy, not extended mint blades');
      assert.ok(a.tideblade.rotation.x<-.60,
        'original full-size ivory shoulder crest must yield to genuine first contact');
      assert.ok(a.tideblade.position.y<=.20,
        'large permanent ivory crest must remain physically nested on carapace');
      const pale=a.tideblade.children.find(part=>part.isMesh
        &&part.material?.color?.getHexString()==='e1c997');
      assert.ok(pale&&pale.rotation.x<-.60,
        'full-size connected sculpted ivory blade must lean back, never obscure the face');
    }
    warden.update({...state,lanternParried:true,counterPhase:.5});
    for(const a of anatomy){
      assert.ok(a.fronds.rotation.x<-.95,'both existing physical fronds hinge backward, not through the camera');
      assert.ok(a.fronds.scale.y<.65,'earned counter exposes the true full beetle body rather than a second mint screen');
      assert.ok(a.tideblade.rotation.x<-.75,'both rooted ivory crest plates participate in the impact');
      assert.equal(a.fronds.visible,true,'do not fake visibility by hiding the actual connected body');
    }
    assert.deepEqual(warden.group.position.toArray(),floor,'presentation cannot move authoritative patrol cell');
    assert.equal(head.parent,body,'original complete mask must stay with its articulated body');
    warden.update({...state,lanternParried:true,counterPhase:1});
    for(const a of anatomy){
      assert.equal(a.fronds.rotation.x,0,'actual counter expiration restores exact positive-zero hinges');
      assert.equal(a.tideblade.rotation.x,0);
      assert.equal(a.fronds.scale.y,1,'a spent counter must not pop a giant frond back into the scene');
    }
    warden.update({...state,lanternParried:true,counterPhase:.5,reducedMotion:true});
    for(const a of anatomy){
      assert.equal(a.fronds.rotation.x,0,'reduced motion avoids an abrupt impact fold');
      assert.equal(a.tideblade.rotation.x,0);
    }
    warden.update({...state,attentionStrength:0,lanternParried:false,counterPhase:null});
    for(const a of anatomy){
      assert.equal(a.fronds.rotation.x,0);
      assert.equal(a.fronds.visible,false,'unseen guardian cannot persist as a secret threat');
    }
    warden.update({...state,result:'escape',lanternParried:true,counterPhase:.5});
    for(const a of anatomy)assert.equal(a.fronds.visible,false,'terminal reality outranks old parry');
    for(let i=0;i<80;i++)warden.update({...state,lanternParried:true,counterPhase:i/80,time:i/60});
    const after=new Set();warden.group.traverse(n=>{if(n.geometry)after.add(n.geometry);});
    assert.deepEqual(after,resources,'the new action reuses physical source meshes without per-frame geometry');
    warden.dispose();warden.dispose();
  }
  assert.deepEqual(rigPrimitiveResourceStats(),before,'shared GPU geometry ownership returns to baseline');
});
