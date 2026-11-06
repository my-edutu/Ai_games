'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {pathToFileURL} = require('node:url');

// Installed Three.js models, never a mocked or invented screenshot.
async function build() {
  const root = path.resolve(__dirname,'../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-relay-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const THREE = await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const game = await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE, game, world:game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error) {fs.rmSync(temp,{recursive:true,force:true});throw error}
}
const publicState = (overrides={}) => ({
  runToken:'visible-real-pressure-relay',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,...overrides
});
const near=(value,expected,label)=>assert.ok(Math.abs(value-expected)<1e-8,
  label+': '+value+' vs '+expected);

test('public pressure mast has real ordered warning, shutter and piston on render time',async()=>{
  const {THREE,game,world,cleanup}=await build();
  try {
    const state=publicState(),frozen=JSON.stringify(state);
    world.update(state);
    const mast=world.group.getObjectByName('Published tide-shear pressure mast 4');
    const relays=[-1,1].map(side=>world.group.getObjectByName('Published tide-shear staged relay 4 '+side));
    const shutter=world.group.getObjectByName('Published tide-shear floor shutter -1');
    const carriage=world.group.getObjectByName('Published tide-shear rising carriage');
    assert.ok(mast?.isGroup && relays.every(r=>r?.isGroup && r.parent===mast));
    assert.ok(shutter?.isGroup && carriage?.isGroup);
    assert.ok(relays.every(r=>r.children.filter(p=>p.isMesh).length===3));
    const budget=world.stats(),pos=game.cellPosition(4,3,3);
    const far=new THREE.Vector3(pos.x+40,0,pos.z+40);
    const diagonal=new THREE.Vector3(pos.x+game.CELL_SIZE,0,pos.z+game.CELL_SIZE);
    const center=new THREE.Vector3(pos.x,0,pos.z);
    world.animate(0,{explorerPosition:far,reducedMotion:false});
    near(relays[0].rotation.z,.05,'resting bronze relay');
    near(carriage.position.y,.16,'resting piston');
    world.animate(0,{explorerPosition:diagonal,reducedMotion:false});
    assert.ok(relays[0].rotation.z>.15 && relays[0].rotation.z<.40,
      'real observed diagonal approach warns through relay alone');
    near(carriage.position.y,.16,'diagonal approach does not raise piston');
    near(Math.abs(shutter.rotation.z),.03,'diagonal approach leaves ivory shutter closed');
    world.animate(.05,{explorerPosition:center,reducedMotion:false});
    near(relays[0].rotation.z,.70,'near-contact bronze warning becomes fully readable');
    near(carriage.position.y,.16,'first witnessed contact still precedes piston lift');
    near(Math.abs(shutter.rotation.z),.03,'first witnessed contact still precedes shutter lift');
    world.animate(.30,{explorerPosition:center,reducedMotion:false});
    assert.ok(Math.abs(shutter.rotation.z)>.08 && Math.abs(shutter.rotation.z)<.60,
      'shutter now physically opens after the relay but before the piston');
    near(carriage.position.y,.16,'shutter phase cannot prematurely raise piston');
    world.animate(.65,{explorerPosition:center,reducedMotion:false});
    assert.ok(Math.abs(shutter.rotation.z)>.95,'ceramic leaves open strongly by middle beat');
    near(carriage.position.y,.16,'piston waits for genuinely separate third phase');
    world.animate(.95,{explorerPosition:center,reducedMotion:false});
    assert.ok(carriage.position.y>.20 && carriage.position.y<.44,
      'third phase raises the physically linked carriage after shutter action');
    world.animate(1.35,{explorerPosition:center,reducedMotion:false});
    near(relays[0].rotation.z,.70,'full left public lever');
    near(relays[1].rotation.z,-.70,'full mirrored public lever');
    near(relays[0].position.y,.43,'full connected relay piston');
    near(carriage.position.y,.44,'full piston elevation');
    near(Math.abs(shutter.rotation.z),1.11,'fully opened public shutter');
    world.animate(7,{explorerPosition:far,reducedMotion:false});
    near(relays[0].rotation.z,.05,'retreat returns to rest immediately');
    near(relays[0].position.y,.28,'retreat lowers linkage');
    near(carriage.position.y,.16,'retreat lowers piston immediately');
    near(Math.abs(shutter.rotation.z),.03,'retreat closes shutters immediately');
    world.animate(8,{explorerPosition:center,reducedMotion:true});
    near(relays[0].rotation.z,.40,'reduced motion holds calm visible pose');
    near(relays[0].position.y,.32,'reduced motion holds without ticking');
    for(const key of ['geometryCount','materialCount','textureCount','instances'])
      assert.equal(world.stats()[key],budget[key],'motion must allocate no GPU resources');
    assert.equal(JSON.stringify(state),frozen,'public knowledge and engine authority unchanged');
  } finally {world.dispose();cleanup()}
});

test('remembered-only, hidden and reset pressure hazards never animate or leave relays',async()=>{
  const {THREE,game,world,cleanup}=await build();
  try {
    const pos=game.cellPosition(4,3,3),center=new THREE.Vector3(pos.x,0,pos.z);
    world.update(publicState({visibleCells:[]}));
    const relay=world.group.getObjectByName('Published tide-shear staged relay 4 -1');
    assert.ok(relay,'remembered public geometry can remain, but must not act');
    world.animate(5,{explorerPosition:center,reducedMotion:false});
    near(relay.rotation.z,.05,'remembered relay is at rest');
    near(relay.position.y,.28,'remembered relay remains down');
    world.animate(8,{explorerPosition:center,reducedMotion:true});
    near(relay.rotation.z,.05,'reduced motion cannot leak remembered hazard action');
    world.update(publicState({visibleCells:[4]}));
    world.animate(8,{explorerPosition:center,reducedMotion:false});
    assert.ok(relay.rotation.z>.40 && relay.rotation.z<.70,
      'revealed close hazard begins at observable warning, not instant full lift');
    world.animate(9.4,{explorerPosition:center,reducedMotion:false});
    near(relay.rotation.z,.70,'visible pressure actuates after staged presentation time');
    world.update(publicState({runToken:'next-run',cells:[],visibleCells:[],privateTrapCells:[4]}));
    assert.equal(world.group.getObjectByName('Published tide-shear staged relay 4 -1'),undefined);
    assert.equal(world.stats().responsiveTrapSignals,0,'new run releases all old trap props');
  } finally {world.dispose();cleanup()}
});
