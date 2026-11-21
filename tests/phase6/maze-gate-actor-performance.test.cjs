'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Test the ACTUAL production character rig with the installed real Three.js,
// not a duplicated pose function or a dummy mesh. This is separate from the
// browser's genuine public event/camera/screenshot and engine authority tests.
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));
const joints=pip=>{
  const part=name=>{const o=pip.group.getObjectByName(name);assert.ok(o,'missing modeled '+name);return o};
  const body=part('breathing torso'),head=part('curious head'),right=part('shoulder 1'),
    left=part('shoulder -1'),cage=part('lantern cage'),
    tail=part('scarf tail'),knee=part('knee 1'),key=part('presented matching key');
  const lampMaterial=new Set();
  pip.group.traverse(o=>{
    if(o.material && o.material.color?.getHexString()==='ffdf83')lampMaterial.add(o.material);
  });
  assert.equal(lampMaterial.size,1,'the existing single emissive lantern material is reused');
  return {body,head,right,left,cage,tail,knee,key,glow:[...lampMaterial][0]};
};
test('authentic public gate action connects shoulders, knees, lantern and torso in modeled Three rig',async()=>{
  const {createExplorer}=await production;
  for(const balanced of [false,true]){
    const pip=createExplorer({balanced});
    const j=joints(pip);
    const resources=()=>{const set=new Set();pip.group.traverse(o=>{if(o.geometry)set.add(o.geometry);if(o.material)set.add(o.material)});return set};
    const before=resources();
    const cue={heading:0,gateHeading:Math.PI/2,gateStrength:1,
      time:2.5,delta:.05,reducedMotion:true, moving:false,danger:0};
    pip.update(cue);
    assert.ok(j.body.position.y>1,'the 3D performer rises, not only the HUD or a face texture');
    assert.ok(j.head.rotation.x<-.22,'helmet physically looks up at the public gate');
    assert.ok(j.right.rotation.x< -1.8,'right lantern arm has an unmistakably raised silhouette');
    assert.ok(j.left.rotation.x< -1.05,'opposite glove joins rather than hanging at rest');
    assert.ok(j.knee.rotation.x>.18,'connected knee physically braces for the authored rise');
    assert.ok(j.cage.scale.x>1.16,'existing physically modeled lantern is legible');
    assert.ok(j.glow.emissiveIntensity>2.3,'existing original 3D lantern brightens during public opening');
    assert.ok(j.tail.rotation.x>.40,'attached scarf responds to connected physical acting');
    assert.equal(j.key.visible,false,'real gate opening must not invent another collected key');
    assert.deepEqual(pip.group.position.toArray(),[0,0,0],
      'actual autonomous engine owns Pip world position and route');
    const staticPose=[j.body.position.y,j.right.rotation.x,j.left.rotation.x,
      j.cage.scale.x,j.glow.emissiveIntensity,j.knee.rotation.x,j.tail.rotation.x];
    pip.update({...cue,time:100});
    assert.deepEqual([j.body.position.y,j.right.rotation.x,j.left.rotation.x,
      j.cage.scale.x,j.glow.emissiveIntensity,j.knee.rotation.x,j.tail.rotation.x],staticPose,
      'reduced-motion pose is fully readable and does not pulse or jitter');
    // Empty/invalid proof has no physical effect, including light/lantern.
    pip.update({...cue,gateHeading:NaN});
    assert.equal(j.body.position.y,.78);
    assert.equal(j.cage.scale.x,1);
    assert.equal(j.glow.emissiveIntensity,1.45);
    assert.equal(j.knee.rotation.x,0);
    pip.update({...cue,gateStrength:0});
    assert.equal(j.cage.scale.x,1);
    assert.equal(j.tail.rotation.x,0);
    // A real nearby warden always wins even if a gate recently opened.
    pip.update({...cue,attentionHeading:-Math.PI/2,attentionStrength:1,danger:1});
    const threat=[j.body.position.y,j.head.rotation.x,j.right.rotation.x,j.cage.scale.x,j.glow.emissiveIntensity];
    pip.update({...cue,attentionHeading:-Math.PI/2,attentionStrength:1,danger:1,gateStrength:0});
    assert.deepEqual([j.body.position.y,j.head.rotation.x,j.right.rotation.x,j.cage.scale.x,j.glow.emissiveIntensity],threat,
      'disclosed threat overrides gate performance');
    pip.update({...cue,result:'capture'});
    assert.equal(j.cage.scale.x,1,'terminal physical pose suppresses celebration');
    assert.equal(j.head.rotation.x,.28);
    // Live cosmetic values must not grow Three meshes/materials over frames.
    for(let i=0;i<45;i++)pip.update({...cue,gateStrength:i/45,
      reducedMotion:false,time:i/24});
    assert.deepEqual(resources(),before,'no rendering-frame GPU resource creation');
    pip.dispose();
  }
});
