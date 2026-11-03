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
    return {world:(await import(pathToFileURL(path.join(temp,'world.js')).href)).createMazeWorld({balanced:true}),
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
