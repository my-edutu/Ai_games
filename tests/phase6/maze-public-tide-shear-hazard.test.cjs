'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Exercise the REAL installed production Three.js world, not mocked props,
// screenshots or a cosmetic marker that could pass without an animated scene.
async function actualWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-tide-shear-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for (const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for (const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const source=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,source,world:source.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch (error) {fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const cell=(trap=true)=>({cell:4,neighbors:[],blocked:false,trap,checkpoint:false,clue:false});
const published=(overrides={})=>({
  runToken:'public-tide-shear-hazard',tick:1,width:3,height:3,currentCell:4,
  cells:[cell()],visibleCells:[4],keys:[],doors:[],inventory:[],
  threats:[],exitCell:null,result:null,...overrides
});
const jaws=world=>[-1,1].map(side=>world.group.getObjectByName(
  'Disclosed tide-shear hinged jaw 4 '+side));

test('published trap owns TWO connected sculpted 3D jaws that respond to actual public Pip proximity',async()=>{
  const {THREE,source,world,cleanup}=await actualWorld();
  try {
    const state=published(),original=JSON.stringify(state);
    world.update(state);
    const parts=jaws(world),parent=world.group.getObjectByName('Disclosed tide-shear pressure hazard 4');
    assert.ok(parent,'the hazard must be in the real world stage');
    assert.ok(parts.every(Boolean),'both side hinges physically exist');
    assert.equal(world.stats().responsiveTrapJaws,2);
    for (const [i,jaw] of parts.entries()) {
      assert.equal(jaw.parent,parent,'real joints belong to the disclosed hazard cell');
      assert.ok(jaw.children.filter(x=>x.isMesh).length>=5,
        'each visible jaw has an authored carved plate, contrasting inner face, rim and tooth');
      assert.ok(Math.abs(jaw.position.x)> .6 && Math.abs(jaw.position.x)< .8,
        'hinges stay on actual cell margins, not across the central playable route');
      assert.equal(jaw.position.z,0);
    }
    const pos=source.cellPosition(4,3,3),ground=source.cellHeight(4,3,3);
    const hero=new THREE.Vector3(pos.x,ground,pos.z);
    const resources=world.stats();
    world.animate(0,{gateTime:0,reducedMotion:false,explorerPosition:hero});
    assert.ok(parts[0].rotation.z>.60 && parts[1].rotation.z<-.60,
      'visible danger opens both connected physical jaw silhouettes OUTWARD when actual Pip arrives');
    world.animate(0,{gateTime:0,reducedMotion:false,explorerPosition:hero});
    assert.equal(parts[0].rotation.z,-parts[1].rotation.z,
      'same public pose yields symmetrical deterministic positions');
    world.animate(0,{gateTime:0,reducedMotion:false,
      explorerPosition:new THREE.Vector3(pos.x+40,ground,pos.z+40)});
    assert.ok(parts.every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.06)<1e-9),
      'withdrawal returns to a small closed/resting gesture without imagined pursuit');
    world.animate(0,{gateTime:0,reducedMotion:true,explorerPosition:hero});
    assert.ok(parts.every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.24)<1e-9),
      'reduced motion uses stable recognizable physical pose with zero oscillation');
    assert.equal(world.stats().geometryCount,resources.geometryCount,
      'no geometry allocations in proximity animation');
    assert.equal(world.stats().materialCount,resources.materialCount,
      'no material allocations during animations');
    assert.ok(resources.geometryCount<=16 && resources.materialCount<=26
      && resources.textureCount<=3,'existing balanced Three resource budget stays intact');
    assert.equal(JSON.stringify(state),original,'visual mechanism never writes to sanitized public engine state');
  } finally {world.dispose();cleanup();}
});

test('no private trap, remembered-only cue or previous run may animate a hidden hazard',async()=>{
  const {THREE,source,world,cleanup}=await actualWorld();
  try {
    const pos=source.cellPosition(4,3,3),hero=new THREE.Vector3(pos.x,0,pos.z);
    world.update(published({visibleCells:[]}));
    assert.ok(jaws(world).every(Boolean),'known remembered hazard remains legitimate stage art');
    world.animate(1,{explorerPosition:hero});
    assert.ok(jaws(world).every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.06)<1e-9),
      'remembered but currently invisible hazard cannot stage a fresh event');
    world.update(published({visibleCells:[4]}));
    world.animate(1,{explorerPosition:hero});
    assert.ok(jaws(world).every(jaw=>Math.abs(jaw.rotation.z)>.60),
      'only current true public visibility can animate discovered hazard');
    world.update(published({cells:[cell(false)],privateTrapCells:[4],
      hiddenDanger:{cell:4},privateRoute:[4,5,8]}));
    assert.ok(jaws(world).every(jaw=>!jaw),
      'unknown private fields must never create a trap or hazard action');
    assert.equal(world.stats().responsiveTrapJaws,0);
    world.update(published());
    assert.equal(world.stats().responsiveTrapJaws,2);
    world.update(published({runToken:'new-run',cells:[],visibleCells:[],
      privateTrapCells:[4]}));
    assert.equal(world.stats().responsiveTrapJaws,0,'new run clears prior disclosed hazard objects');
    assert.ok(jaws(world).every(jaw=>!jaw),'no stale public presentation meshes remain');
  } finally {world.dispose();cleanup();}
});
