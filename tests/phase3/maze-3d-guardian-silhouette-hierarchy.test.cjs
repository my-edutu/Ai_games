'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const text=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const source=import('data:text/javascript;base64,'+
  Buffer.from(text.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('Pass377 Thornback rebalances one real connected large-face/armor silhouette at phone scale',async()=>{
  const {createWarden}=await source;
  for(const balanced of [false,true]){
    const warden=createWarden({balanced});
    const head=warden.group.getObjectByName('warden mask');
    const body=warden.group.getObjectByName('armored body');
    assert.equal(head.parent,body,'same real articulated root, not a floating screen marker');
    assert.ok(head.position.y>=.42 && head.position.z>=.87,
      'whole mask clears the old overhead dorsal shield in physical world space');
    assert.ok(head.scale.x>=1.2 && head.scale.y>=1.16,
      'paired optics, jaw and hinged cheeks share coherent enlarged anatomy');
    // The real rig merges same-material direct sibling meshes into one GPU
    // buffer at r.finish(). The two individually authored orange eyes are
    // thus one batched face surface, not two named Object3D nodes at runtime.
    // Verify the actual connected, emissive shape span instead of asserting
    // names that the existing production batching intentionally removes.
    const opticalMeshes=[];
    head.traverse(node=>{
      if(node.isMesh && node.material?.color?.getHexString()==='ff8650')
        opticalMeshes.push(node);
    });
    assert.ok(opticalMeshes.length>=1 && opticalMeshes.every(mesh=>mesh.material.emissiveIntensity>0),
      'the real grouped skull retains its physical emissive orange eye geometry');
    const {Box3}=await import(three);
    const opticalBounds=new Box3();
    for(const mesh of opticalMeshes){
      mesh.geometry.computeBoundingBox();
      mesh.updateWorldMatrix(true,false);
      opticalBounds.union(new Box3().copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
    }
    assert.ok(!opticalBounds.isEmpty() && opticalBounds.max.x-opticalBounds.min.x>.45,
      'both originally modeled lenses combine into one substantial world-space optical pair');
    const cheeks=[-1,1].map(side=>warden.group.getObjectByName('articulated guardian facial shell '+side));
    assert.ok(cheeks.every(cheek=>cheek?.parent===head),
      'both genuinely hinged cheek housings stay rooted in the enlarged skull');
    const blades=[-1,1].map(side=>warden.group.getObjectByName('fixed sculpted warden tideblade '+side));
    assert.ok(blades.every(blade=>blade?.parent?.name.startsWith('flared elytron')),
      'rooted dorsal blades still articulate in the original real encounter');
    const shapes=new Set(),materials=new Set();
    warden.group.traverse(node=>{if(node.geometry)shapes.add(node.geometry);if(node.material)materials.add(node.material)});
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,danger:1,
      moving:false,time:1,delta:0,reducedMotion:true};
    for(const beat of [0,.5,1]){
      warden.update({...cue,encounterBeat:beat});
      assert.equal(head.parent,body);
      assert.ok(opticalMeshes.every(mesh=>mesh.visible),'actual batched optical surfaces remain physical across notice, brace and release');
    }
    warden.update({...cue,attentionStrength:0,attentionHeading:undefined,encounterBeat:1});
    assert.equal(warden.group.getObjectByName('activated warden spines').visible,false,
      'the enlarged physical mask never reveals an unseen opponent');
    const afterShapes=new Set(),afterMaterials=new Set();
    warden.group.traverse(node=>{if(node.geometry)afterShapes.add(node.geometry);if(node.material)afterMaterials.add(node.material)});
    assert.deepEqual(afterShapes,shapes);
    assert.deepEqual(afterMaterials,materials,'no render-loop geometry/material allocation');
    warden.dispose();
    assert.equal(warden.group.children.length,0);
  }
});
