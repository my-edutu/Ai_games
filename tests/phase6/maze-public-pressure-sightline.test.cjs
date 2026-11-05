'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Load the real installed Three.js scene, not a mocked visual heuristic.
async function loadWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-sightline-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for (const filename of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',filename),path.join(temp,filename));
    for (const filename of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',filename),path.join(temp,'vendor',filename));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const game=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,world:game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const cells=[38,39,40,41,42,50];
function published({pressure=false,privateOnly=false}={}) {
  return {
    runToken:'public-pressure-breathing-room',tick:1,width:9,height:9,
    currentCell:39,visibleCells:[...cells],
    cells:cells.map(cell=>({cell,neighbors:[],blocked:false,
      trap:pressure&&cell===40,checkpoint:false,clue:false})),
    keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
    ...(privateOnly?{privateTrapCells:[40],privateMap:{40:'secret-hazard'}}:{})
  };
}

test('genuine disclosed pressure stage keeps flanking scenic organs out of its physical sightline',async()=>{
  const {THREE,world,cleanup}=await loadWorld();
  try {
    const ordinary=published();
    const unmodified=JSON.stringify(ordinary);
    world.update(ordinary);
    for(const cell of [38,39,41,50])
      assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),
        'baseline known wall '+cell+' still owns its rooted physical fossil');
    const plainCount=world.stats().tideFossilAlcoves;
    assert.equal(JSON.stringify(ordinary),unmodified,'scene may not mutate public snapshot');

    const pressure=published({pressure:true}),frozen=JSON.stringify(pressure);
    world.update(pressure);
    assert.ok(world.group.getObjectByName('Published tide-shear pressure mast 40'),
      'the real disclosed mechanical hazard and jaws are retained');
    assert.equal(world.stats().responsiveTrapSignals,1);
    for(const cell of [39,41])
      assert.equal(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),undefined,
        'adjacent known tile '+cell+' must not hide Pip or the public trap behind repeat tall scenery');
    for(const cell of [38,50])
      assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),
        'ordinary distant public ruins must retain their own physical sculpture');
    assert.ok(world.stats().tideFossilAlcoves<plainCount,
      'this is a genuine reduction of foreground stage clutter, not merely a changed color');

    const before=world.stats();
    world.animate(5,{explorerPosition:new THREE.Vector3(0,0,0),reducedMotion:false});
    const after=world.stats();
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(after[key],before[key],'no GPU class may be allocated by an animation frame');
    assert.equal(JSON.stringify(pressure),frozen,
      'staging must not change navigation, private state, hazard rules or public state');
  }finally{world.dispose();cleanup();}
});

test('private-only trap data cannot change the disclosed 3D sightline',async()=>{
  const {world,cleanup}=await loadWorld();
  try{
    const state=published({privateOnly:true}),frozen=JSON.stringify(state);
    world.update(state);
    for(const cell of [39,41])
      assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),
        'a secret-only hazard cannot remove scenery or reveal its footprint');
    assert.equal(world.stats().responsiveTrapSignals,0);
    assert.equal(JSON.stringify(state),frozen);
  }finally{world.dispose();cleanup();}
});
