'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

async function loadWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-diaphragm-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const filename of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',filename),path.join(temp,filename));
    for(const filename of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',filename),path.join(temp,'vendor',filename));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const game=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,game,world:game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const published=(overrides={})=>({
  runToken:'visible-pressure-mast',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
  ...overrides
});

test('real 3D tide diaphragm telescopes and opens both rooted shields on publicly witnessed pressure',async()=>{
  const {THREE,game,world,cleanup}=await loadWorld();
  try {
    const state=published(),frozen=JSON.stringify(state);
    world.update(state);
    const mast=world.group.getObjectByName('Published tide-shear pressure mast 4');
    const carriage=mast?.getObjectByName('Published tide-shear rising carriage');
    assert.ok(mast?.isGroup && carriage?.isGroup && carriage.parent===mast,
      'the disclosed hazard owns an actual rooted Three.js moving piston');
    const shields=[-1,1].map(side=>carriage.getObjectByName('Published tide-shear diaphragm '+side));
    assert.ok(shields.every(leaf=>leaf?.isGroup && leaf.parent===carriage),
      'both real connected shields follow the lifting piston');
    assert.ok(shields.every(leaf=>leaf.children.filter(x=>x.isMesh).length>=3),
      'both shields have contrasting physical ceramic, mineral red and gold parts');
    assert.equal(world.stats().responsiveTrapSignals,1);
    const budget=world.stats();
    const pos=game.cellPosition(4,3,3);
    const hero=new THREE.Vector3(pos.x,0,pos.z);
    const far=new THREE.Vector3(pos.x+50,0,pos.z+50);
    world.animate(0,{explorerPosition:far,reducedMotion:false});
    assert.equal(carriage.position.y,.16);
    assert.ok(shields.every(leaf=>Math.abs(Math.abs(leaf.rotation.z)-.08)<1e-9));
    world.animate(0,{explorerPosition:hero,reducedMotion:false});
    assert.equal(carriage.position.y,.16,'first contact warns without prematurely lifting piston');
    assert.ok(shields.every(leaf=>Math.abs(Math.abs(leaf.rotation.z)-.08)<1e-9));
    world.animate(.30,{explorerPosition:hero,reducedMotion:false});
    assert.equal(carriage.position.y,.16,'ceramic opening beat must precede piston rise');
    world.animate(.95,{explorerPosition:hero,reducedMotion:false});
    assert.ok(carriage.position.y>.38 && carriage.position.y<.41,
      'third physically witnessed beat raises the rooted piston after shutter action');
    world.animate(1.35,{explorerPosition:hero,reducedMotion:false});
    assert.ok(Math.abs(carriage.position.y-.44)<1e-9,'complete sustained public pressure lifts piston fully');
    assert.ok(shields.every(leaf=>Math.abs(Math.abs(leaf.rotation.z)-.78)<1e-9));
    assert.equal(shields[0].rotation.z,-shields[1].rotation.z,
      'matching publicly observed positions yield symmetrical linked diaphragms');
    world.animate(1.35,{explorerPosition:new THREE.Vector3(pos.x+game.CELL_SIZE,0,pos.z),reducedMotion:false});
    assert.ok(carriage.position.y>.42 && carriage.position.y<.44,
      'sustained one-cell encounter keeps the consequential piston action readable');
    world.animate(1.35,{explorerPosition:new THREE.Vector3(pos.x+game.CELL_SIZE,0,pos.z+game.CELL_SIZE),reducedMotion:false});
    assert.equal(carriage.position.y,.16,
      'diagonal observation may warn, but cannot fabricate a full pressure contact');
    world.animate(0,{explorerPosition:far,reducedMotion:false});
    assert.equal(carriage.position.y,.16,'withdrawal restores the physical resting silhouette');
    world.animate(42,{explorerPosition:hero,reducedMotion:true});
    assert.equal(carriage.position.y,.29);
    assert.ok(shields.every(leaf=>Math.abs(Math.abs(leaf.rotation.z)-.34)<1e-9));
    assert.equal(world.stats().geometryCount,budget.geometryCount);
    assert.equal(world.stats().materialCount,budget.materialCount);
    assert.equal(world.stats().textureCount,budget.textureCount);
    assert.equal(JSON.stringify(state),frozen,
      'no simulated trap state, map or autonomous AI decision is changed');
  }finally{world.dispose();cleanup();}
});

test('a remembered, hidden, fabricated or previous-run trap cannot perform a fresh diaphragm event',async()=>{
  const {THREE,game,world,cleanup}=await loadWorld();
  try{
    const pos=game.cellPosition(4,3,3),hero=new THREE.Vector3(pos.x,0,pos.z);
    world.update(published({visibleCells:[]}));
    const piston=world.group.getObjectByName('Published tide-shear rising carriage');
    assert.ok(piston);
    world.animate(0,{explorerPosition:hero,reducedMotion:false});
    assert.equal(piston.position.y,.16,'remembered-only hazard stays still');
    world.animate(0,{explorerPosition:hero,reducedMotion:true});
    assert.equal(piston.position.y,.16,
      'reduced-motion static pose must not visually disclose a remembered-only hazard');
    for (const side of [-1,1]) {
      const leaf=piston.getObjectByName('Published tide-shear diaphragm '+side);
      assert.ok(Math.abs(Math.abs(leaf.rotation.z)-.08)<1e-9,
        'hidden-only ceramic shields remain at rest even in reduced motion');
    }
    world.update(published({visibleCells:[4]}));
    world.animate(0,{explorerPosition:hero,reducedMotion:false});
    assert.equal(piston.position.y,.16,'newly seen hazard cannot skip the warning and shutter beats');
    world.animate(1.35,{explorerPosition:hero,reducedMotion:false});
    assert.ok(Math.abs(piston.position.y-.44)<1e-9,'continued current public sight completes real physical piston action');
    world.update(published({cells:[],visibleCells:[],privateTrapCells:[4],privateMap:{4:'danger'}}));
    assert.equal(world.group.getObjectByName('Published tide-shear pressure mast 4'),undefined);
    assert.equal(world.stats().responsiveTrapSignals,0,
      'private-only hazard never manufactures new meshes');
    world.update(published());
    assert.equal(world.stats().responsiveTrapSignals,1);
    world.update(published({runToken:'next-run',cells:[],visibleCells:[]}));
    assert.equal(world.stats().responsiveTrapSignals,0);
    assert.equal(world.group.getObjectByName('Published tide-shear pressure mast 4'),undefined);
  }finally{world.dispose();cleanup();}
});
