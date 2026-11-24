'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Installed-production Three actor + installed-world geometry, no mocks,
// hidden seed reads, screenshot stand-ins or lowered actor/camera acceptance.
const root=path.resolve(__dirname,'../..');
const maze=path.join(root,'public/ai-maze-escape');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const mazeModule=name=>pathToFileURL(path.join(maze,name)).href;
const gameModule=(name,imports=[])=>{
  let source=fs.readFileSync(path.join(maze,name),'utf8')
    .replace("'./vendor/three.module.js'",JSON.stringify(three));
  for(const other of imports) source=source.replace("'./"+other+"'",JSON.stringify(mazeModule(other)));
  return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
};
const worldLoaded=gameModule('world.js',['gate-moment.mjs','map-view.mjs']);
const charactersLoaded=gameModule('characters.js');
const tile=(cell,props={})=>({cell,neighbors:[11],blocked:false,trap:false,
  checkpoint:false,clue:false,...props});
const state=(cells=[tile(10)],extras={})=>({
  runToken:'public-fossil-pip',width:7,height:7,tick:1,currentCell:10,
  cells,visibleCells:cells.map(c=>c.cell),doors:[],keys:[],inventory:[],
  threats:[],exitCell:null,result:null,...extras
});
const pose=(pip,glow)=>({
  bodyY:pip.group.getObjectByName('breathing torso').position.y,
  headY:pip.group.getObjectByName('curious head').rotation.y,
  armX:pip.group.getObjectByName('shoulder 1').rotation.x,
  lampScale:pip.group.getObjectByName('lantern cage').scale.x,
  glow:glow.emissiveIntensity
});
function lampMaterial(pip){
  const found=new Set();
  pip.group.traverse(node=>{
    if(node.material?.color?.getHexString()==='ffdf83')found.add(node.material);
  });
  assert.equal(found.size,1,'one physically existing lantern material is reused');
  return [...found][0];
}

test('only currently disclosed physical organ can attract Pip without route, hidden state, or a fake target',async()=>{
  const [{createMazeWorld,cellPosition,cellHeight},{createExplorer}]=await Promise.all([worldLoaded,charactersLoaded]);
  const world=createMazeWorld({balanced:true}),pip=createExplorer({balanced:true});
  try{
    const original=state(),frozen=JSON.stringify(original);
    world.update(original);
    const center=cellPosition(10,7,7);
    const position={x:center.x,y:cellHeight(10,7,7),z:center.z};
    const cue=world.publicFossilAttention(position);
    assert.ok(cue && cue.strength>.45 && cue.strength<=1);
    assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ 10')?.isGroup,
      'attention target is a real modeled Three object on a published wall');
    assert.equal(world.publicFossilAttention({x:100,z:100}),null);
    assert.equal(world.publicFossilAttention({x:NaN,z:0}),null);
    assert.equal(world.publicFossilAttention(null),null);
    const unrelated=state([tile(10)],{
      privateRoute:[10,3,5],hiddenExitCell:10,secretThreatCell:10,privateMazeCells:[10,11,12]
    });
    world.update(unrelated);
    assert.deepEqual(world.publicFossilAttention(position),cue,
      'private source facts cannot alter character acting or reveal unknown map');
    pip.group.position.set(position.x,position.y,position.z);
    const lamp=lampMaterial(pip),resources=new Set();
    pip.group.traverse(node=>{if(node.geometry)resources.add(node.geometry);if(node.material)resources.add(node.material)});
    const focus={time:1,delta:.05,moving:false,heading:0,reducedMotion:true,
      danger:0,fossilHeading:Math.atan2(cue.x-position.x,cue.z-position.z),
      fossilStrength:cue.strength};
    pip.update({...focus,fossilStrength:0});
    const neutral=pose(pip,lamp);
    pip.update(focus);
    const attentive=pose(pip,lamp);
    assert.ok(attentive.bodyY>neutral.bodyY+.04,'torso physically rises toward visible sculpture');
    assert.ok(Math.abs(attentive.headY-neutral.headY)>.2,'modeled head tracks the public organ');
    assert.ok(attentive.armX<neutral.armX-.35,'existing lantern arm physically lifts');
    assert.ok(attentive.lampScale>neutral.lampScale+.05,'real modeled lantern participates');
    assert.ok(attentive.glow>neutral.glow+.15,'existing emissive crystal responds');
    assert.deepEqual(pip.group.position.toArray(),[position.x,position.y,position.z],
      'autonomous engine alone controls physical route position');
    pip.update({...focus,time:111});
    assert.deepEqual(pose(pip,lamp),attentive,'reduced motion is a deterministic static pose');
    pip.update({...focus,fossilHeading:NaN});
    assert.deepEqual(pose(pip,lamp),neutral,'lost/invalid public cue leaves no ghost acting');
    for(const overrides of [
      {attentionHeading:1,attentionStrength:1,danger:1},
      {keyHeading:1,keyStrength:1},
      {gateHeading:1,gateStrength:1},
      {pickupStrength:1},
      {result:'capture'}
    ]){
      pip.update({...focus,...overrides});
      const withFossil=pose(pip,lamp);
      pip.update({...focus,...overrides,fossilStrength:0});
      assert.deepEqual(pose(pip,lamp),withFossil,
        'real threat, known key, witnessed gate, pickup and terminal events outrank curiosity');
    }
    for(let i=0;i<48;i++)pip.update({...focus,time:i/24,
      reducedMotion:false,fossilStrength:i/47});
    const after=new Set();
    pip.group.traverse(node=>{if(node.geometry)after.add(node.geometry);if(node.material)after.add(node.material)});
    assert.deepEqual(after,resources,'no material or geometry is created during real render-frame acting');
    assert.equal(JSON.stringify(original),frozen,'public runtime payload is never modified');
    world.update(state([],{runToken:'next-run',privateMazeCells:[10]}));
    assert.equal(world.publicFossilAttention(position),null,
      'run reset and undisclosed tiles cannot leave a phantom target');
  }finally{pip.dispose();world.dispose();}
});

test('hazards, blocked tiles and genuine key/gate landmarks cannot earn an invented fossil reaction',async()=>{
  const {createMazeWorld,cellPosition}=await worldLoaded;
  const world=createMazeWorld({balanced:true});
  try{
    const hero=cellPosition(10,7,7);
    for(const published of [
      state([],{privateMazeCells:[10]}),
      state([tile(10,{trap:true})]),
      state([tile(10,{blocked:true})]),
      state([tile(10,{checkpoint:true})]),
      state([tile(10,{clue:true})]),
      state([tile(10)],{keys:[{id:'real',cell:10,collected:false}]}),
      state([tile(10)],{exitCell:10}),
      state([tile(10),tile(11,{neighbors:[10]})],
        {doors:[{a:10,b:11,open:false}]})
    ]){
      world.update(published);
      assert.equal(world.publicFossilAttention(hero),null,
        'only an actual safe already-disclosed modeled organ may elicit attention');
    }
  }finally{world.dispose();}
});
