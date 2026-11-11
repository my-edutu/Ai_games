'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

async function loadWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-court-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for (const filename of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',filename),path.join(temp,filename));
    for (const filename of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',filename),path.join(temp,'vendor',filename));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const {createMazeWorld,cellPosition,cellHeight}=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,createMazeWorld,cellPosition,cellHeight,
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error) {fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const published=(override={})=>({
  runToken:'pressure-court',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
  ...override
});
function pressureCourtInstances(world, THREE, cellPosition, cellHeight) {
  const center=cellPosition(4,3,3),y=cellHeight(4,3,3);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),
    quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();
  const found=[];
  world.group.traverse(mesh=>{
    if (!mesh.isInstancedMesh || mesh.material?.color?.getHexString()!=='28574f') return;
    for (let i=0;i<mesh.count;i++) {
      mesh.getMatrixAt(i,matrix);
      matrix.decompose(position,quaternion,scale);
      if (Math.abs(position.x-center.x)<1e-5 &&
        Math.abs(position.z-center.z)<1e-5 &&
        Math.abs(position.y-(y+.009))<1e-5 &&
        Math.abs(scale.x-1.94)<1e-5 &&
        Math.abs(scale.y-.012)<1e-5 &&
        Math.abs(scale.z-1.94)<1e-5) found.push(i);
    }
  });
  return found;
}

test('known pressure cell has an actual 1.94m dark-jade floor below its real articulated jaws',async()=>{
  const {THREE,createMazeWorld,cellPosition,cellHeight,cleanup}=await loadWorld();
  const world=createMazeWorld({balanced:true});
  try {
    const publicState=published(),frozen=JSON.stringify(publicState);
    world.update(publicState);
    assert.equal(pressureCourtInstances(world,THREE,cellPosition,cellHeight).length,1,
      'installed Three world has one full 1.94m dark-jade floor under the true moving hazard');
    assert.ok(world.group.getObjectByName('Disclosed tide-shear pressure hazard 4'),
      'all original physical jaws and moving mast still exist');
    const before=world.stats();
    const hero=cellPosition(4,3,3);
    world.animate(0,{explorerPosition:new THREE.Vector3(hero.x,0,hero.z),reducedMotion:false});
    world.animate(12,{explorerPosition:new THREE.Vector3(50,0,50),reducedMotion:true});
    const after=world.stats();
    assert.equal(after.geometryCount,before.geometryCount);
    assert.equal(after.materialCount,before.materialCount);
    assert.equal(after.textureCount,before.textureCount);
    assert.equal(after.instances,before.instances,
      'the floor is batched at build time, never rebuilt every animation frame');
    assert.equal(JSON.stringify(publicState),frozen,
      'neither physical court nor pressure response modifies authoritative public state');
  } finally {world.dispose();cleanup();}
});

test('private-only or withdrawn-public pressure knowledge cannot create a false floor',async()=>{
  const {THREE,createMazeWorld,cellPosition,cellHeight,cleanup}=await loadWorld();
  const world=createMazeWorld({balanced:true});
  try {
    world.update(published({cells:[],visibleCells:[],privateTrapCells:[4],
      privateMap:{4:{trap:true}}}));
    assert.equal(pressureCourtInstances(world,THREE,cellPosition,cellHeight).length,0);
    assert.equal(world.stats().renderedCells.length,0);
    world.update(published());
    assert.equal(pressureCourtInstances(world,THREE,cellPosition,cellHeight).length,1);
    world.update(published({runToken:'next-run',cells:[],visibleCells:[]}));
    assert.equal(pressureCourtInstances(world,THREE,cellPosition,cellHeight).length,0,
      'new run destroys previously disclosed court rather than leaking the old location');
  } finally {world.dispose();cleanup();}
});

test('real disclosed pressure-gate court moves ornament behind the sealed gate without changing AI or hidden privacy',async()=>{
  const {THREE,createMazeWorld,cleanup}=await loadWorld();
  const world=createMazeWorld({balanced:true});
  const cells=[
    {cell:4,neighbors:[5],blocked:false,trap:true,checkpoint:false,clue:false},
    {cell:5,neighbors:[4],blocked:false,trap:false,checkpoint:false,clue:false}
  ];
  const door={a:4,b:5,open:false,requiredKeyId:'known-key'};
  const state=published({cells,visibleCells:[4,5],doors:[door],inventory:['known-key']});
  const exactState=JSON.stringify(state);
  try{
    world.update(state);
    const gate=world.group.getObjectByName('Withdrawable gate bars');
    const crossed=world.group.getObjectByName('Closed crossed barrier');
    const lock=world.group.getObjectByName('Physical recessed keyhole');
    const emblem=world.group.getObjectByName('Disclosed matching key emblem');
    const wheel=world.group.getObjectByName('Right gate drive wheel');
    const weight=world.group.getObjectByName('Right hanging gate weight');
    const wing=world.group.getObjectByName('Disclosed gate folding tide-wing 1');
    assert.ok(gate?.visible && crossed && lock && emblem && wheel && weight && wing,
      'genuine sealed grille, keyed lock and both functional + decorative mechanisms remain');
    assert.equal(emblem.parent,gate,'public key emblem stays attached to real blocked grille');
    assert.equal(emblem.position.x,.58,'compact emblem is over the actual right lock');
    assert.equal(emblem.position.y,1.87);
    assert.equal(emblem.scale.x,.68);
    assert.equal(wheel.position.z,-.21,'counterweight wheel is behind the pressure sightline');
    assert.equal(weight.position.z,-.17,'hanging weight is behind the pressure sightline');
    assert.equal(wing.position.z,-.05,'nonfunctional tide-wing is no longer in the near foreground');
    assert.ok(gate.children.filter(child=>child.isMesh).length>=7,
      'five real closed bars and crosspieces must never be removed');
    const before=world.stats();
    world.animate(0,{explorerPosition:new THREE.Vector3(0,0,0),reducedMotion:true});
    const after=world.stats();
    for(const k of ['geometryCount','materialCount','textureCount','instances'])
      assert.equal(after[k],before[k],'pressure gate cannot allocate graphics per frame');
    assert.equal(JSON.stringify(state),exactState,'no mutation of authoritative snapshot');

    // An invisible/private danger cannot drive decorative gate cutaways.
    const plainCells=cells.map(c=>({...c,trap:false}));
    world.update(published({runToken:'next-private-run',cells:plainCells,
      visibleCells:[4,5],doors:[door],inventory:['known-key'],
      privateTrapCells:[4],privateMap:{4:{trap:true}}}));
    const normalEmblem=world.group.getObjectByName('Disclosed matching key emblem');
    const normalWheel=world.group.getObjectByName('Right gate drive wheel');
    const normalWing=world.group.getObjectByName('Disclosed gate folding tide-wing 1');
    assert.equal(normalEmblem.position.x,0,'private trap cannot compact known key emblem');
    assert.equal(normalEmblem.position.y,2.12);
    assert.equal(normalEmblem.scale.x,1);
    assert.equal(normalWheel.position.z,.48);
    assert.equal(normalWing.position.z,.38);
  }finally{world.dispose();cleanup();}
});
