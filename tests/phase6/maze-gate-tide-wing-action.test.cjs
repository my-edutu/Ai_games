'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

async function productionWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-gate-tide-wings-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for (const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for (const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    return {THREE,world:(await import(pathToFileURL(path.join(temp,'world.js')).href)).createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error) {fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
function shot(extra={}) {
  const cells=[4,5].map(cell=>({cell,neighbors:cell===4?[5]:[4],blocked:false,
    trap:false,checkpoint:false,clue:false}));
  return {runToken:'verified-physical-gate',tick:1,currentCell:4,width:3,height:3,
    cells,visibleCells:[4,5],keys:[],inventory:[],doors:[{a:4,b:5,open:false}],
    threats:[],exitCell:null,result:null,...extra};
}
function wings(world) {
  return [-1,1].map(side=>world.group.getObjectByName('Disclosed gate folding tide-wing '+side));
}

test('true same-run public gate opening physically unfolds two large carved wings without game authority',async()=>{
  const {world,cleanup}=await productionWorld();
  const before=shot(),after=shot({tick:2,doors:[{a:4,b:5,open:true}]});
  const beforeJSON=JSON.stringify(before),afterJSON=JSON.stringify(after);
  try {
    world.update(before);world.animate(0,{gateTime:0,reducedMotion:false});
    assert.ok(wings(world).every(Boolean),'each real disclosed gate requires two connected 3D wings');
    for (const wing of wings(world)) {
      assert.ok(wing.children.filter(n=>n.isMesh).length>=7,
        'a wing is a substantial sculpted object, not a single cosmetic sprite');
      assert.ok(Math.abs(wing.position.x)>1,'hinges stay beyond the clear route');
      assert.equal(wing.rotation.z,0,'no opening before authoritative public state change');
    }
    world.update(after);world.animate(0,{gateTime:0,reducedMotion:false});
    assert.ok(wings(world).every(w=>w.rotation.z===0),'the authentic beat begins folded');
    world.animate(.55,{gateTime:.55,reducedMotion:false});
    const mid=wings(world);
    assert.ok(mid[0].rotation.z>.1&&mid[0].rotation.z<.82,'left shield must unfurl with grille');
    assert.ok(mid[1].rotation.z<-.1&&mid[1].rotation.z>-.82,'right shield mirrors without crossing passage');
    world.animate(1.5,{gateTime:1.5,reducedMotion:false});
    assert.ok(wings(world).every((wing,i)=>Math.abs(wing.rotation.z-(i?-.82:.82))<1e-9),
      'after real opening, open sculpture remains physically settled');
    const resources=world.stats();
    assert.ok(resources.geometryCount<=16&&resources.materialCount<=26&&resources.textureCount<=3,
      'keep the CPU-balanced scene resource budget unchanged');
    assert.equal(JSON.stringify(before),beforeJSON);
    assert.equal(JSON.stringify(after),afterJSON);
    world.update(shot({runToken:'new-undisclosed-run',cells:[],visibleCells:[],doors:[]}));
    assert.ok(wings(world).every(w=>!w),'an undisclosed run cannot retain prior gate art');
  } finally {world.dispose();cleanup();}
});
test('an initially observed OPEN gate is settled, not a fabricated opening cinematic',async()=>{
  const {world,cleanup}=await productionWorld();
  try {
    world.update(shot({doors:[{a:4,b:5,open:true}]}));
    world.animate(0,{gateTime:0,reducedMotion:false});
    assert.ok(wings(world).every((w,i)=>Math.abs(w.rotation.z-(i?-.82:.82))<1e-9));
    world.animate(1,{gateTime:1,reducedMotion:false});
    assert.ok(wings(world).every((w,i)=>Math.abs(w.rotation.z-(i?-.82:.82))<1e-9));
    const privateData=shot({doors:[{a:4,b:5,open:true}],
      hiddenRoute:[3,6,8],unpublishedDanger:{cell:7},privateGoalCell:8});
    world.update(privateData);
    assert.ok(wings(world).every(Boolean),'private fields cannot remove disclosed geometry');
    assert.equal(world.stats().renderedCells.length,2);
  } finally {world.dispose();cleanup();}
});


test('public pressure court opens genuine silhouette space beside a still-sealed gate',async()=>{
  const {THREE,world,cleanup}=await productionWorld();
  const trapCell={cell:7,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false};
  const ordinaryCell={...trapCell,trap:false};
  const state=cell=>shot({cells:[...shot().cells,cell],visibleCells:[4,5,7]});
  const base=state(ordinaryCell),disclosed=state(trapCell);
  const baseJSON=JSON.stringify(base),pressureJSON=JSON.stringify(disclosed);
  const height=wing=>new THREE.Box3().setFromObject(wing)
    .getSize(new THREE.Vector3()).y;
  try {
    world.update(base);
    const full=wings(world);
    assert.ok(full.every(Boolean));
    const oldHeight=height(full[0]);
    assert.ok(oldHeight>1,'the original uncut wing is a substantial 3D object');
    assert.ok(full.every(w=>w.scale.x===1&&w.scale.y===1&&w.scale.z===1));

    world.update(disclosed);
    const trimmed=wings(world);
    assert.ok(trimmed.every(Boolean));
    assert.ok(trimmed.every(w=>Math.abs(w.position.x)>1),
      'physical hinge pivots must remain outside the real walkable lane');
    assert.ok(trimmed.every(w=>w.scale.x===.62&&w.scale.y===.68&&w.scale.z===.85),
      'published two-cell pressure court must reduce both actual ornament envelopes');
    assert.ok(height(trimmed[0])<oldHeight*.8,
      'this is a substantial full-body geometric reduction, not a color adjustment');
    assert.ok(world.group.getObjectByName('Withdrawable gate bars')?.visible);
    assert.ok(world.group.getObjectByName('Closed crossed barrier'),
      'a closed gate must still look visibly barred rather than falsely open');
    assert.ok(world.group.getObjectByName('Physical recessed keyhole'),
      'a public pressure encounter may not erase the real lock');
    assert.ok(world.group.getObjectByName('Disclosed tide-shear pressure hazard 7'),
      'the consequential physical jaws retain their original location');
    const before=world.stats();
    world.animate(.8,{gateTime:.8,reducedMotion:false});
    const after=world.stats();
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(after[key],before[key],'no resource classes can grow per visual frame');
    world.update(shot({...disclosed,tick:2,doors:[{a:4,b:5,open:true}]}));
    const open=wings(world);
    assert.ok(open.every(w=>w.scale.y===.68),
      'the cutaway cannot pop back to full size when the actual gate opens');
    // Opening starts at the real .8s presentation instant; allow the full
    // gate-retraction interval to complete before checking settled wings.
    world.animate(2.5,{gateTime:2.5,reducedMotion:false});
    assert.ok(open.every((w,i)=>Math.abs(w.rotation.z-(i?-.82:.82))<1e-9),
      'confirmed opening still drives both compact wings from the actual grille');
    world.update(base);
    assert.ok(wings(world).every(w=>w.scale.y===1),
      'removing disclosed pressure restores normal public gate silhouette');
    assert.equal(JSON.stringify(base),baseJSON);
    assert.equal(JSON.stringify(disclosed),pressureJSON);
  } finally {world.dispose();cleanup();}
});

test('private or undisclosed traps never carve the gate silhouette',async()=>{
  const {world,cleanup}=await productionWorld();
  const known={cell:7,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false};
  const ordinary=shot({cells:[...shot().cells,known],visibleCells:[4,5,7],
    privateTrapCells:[7],privateMap:{7:{trap:true}}});
  const hiddenTrap=shot({cells:[...shot().cells],
    visibleCells:[4,5],privateTrapCells:[7]});
  try {
    for(const state of [ordinary,hiddenTrap]){
      const frozen=JSON.stringify(state);
      world.update(state);
      assert.ok(wings(world).every(w=>w.scale.x===1&&w.scale.y===1),
        'no private-only or unknown hazard may affect visible gate art');
      assert.equal(JSON.stringify(state),frozen);
    }
    world.update(shot({runToken:'later-run',cells:[],visibleCells:[],doors:[]}));
    assert.ok(wings(world).every(w=>!w),
      'the previous run cannot keep its disclosed gate after reset');
  }finally{world.dispose();cleanup();}
});
