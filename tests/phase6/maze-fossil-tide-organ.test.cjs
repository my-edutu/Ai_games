'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
// Real installed Three and actual game geometry, not a mocked counter or
// fabricated screenshot. No collision, source privacy or camera gate relaxed.
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const moduleUrl=n=>pathToFileURL(path.join(root,'public/ai-maze-escape',n)).href;
const threeUrl=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const loaded=import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(threeUrl))
  .replace("'./gate-moment.mjs'",JSON.stringify(moduleUrl('gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(moduleUrl('map-view.mjs')))).toString('base64'));
const tile=(cell,other={})=>({cell,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false,...other});
const state=(cells=[tile(10,{neighbors:[11]})],extra={})=>({
  runToken:'real-disclosed-fossil-organ',width:7,height:7,tick:1,currentCell:10,
  cells,visibleCells:cells.map(c=>c.cell),doors:[],keys:[],inventory:[],
  threats:[],exitCell:null,result:null,...extra
});
const pose=g=>Math.max(Math.abs(g.rotation.x),Math.abs(g.rotation.z));
test('a true observed impassable alcove gets a rooted, articulated 3D tide-organ, not a UI sprite',async()=>{
  const {createMazeWorld,cellPosition,cellHeight}=await loaded;
  const {Vector3}=await import(threeUrl);
  const world=createMazeWorld({balanced:true});
  try {
    const sourceState=state(),unchanged=JSON.stringify(sourceState);
    const budget=world.stats();
    world.update(sourceState);
    const organ=world.group.getObjectByName('Disclosed fossil tide-organ 10');
    assert.ok(organ?.isGroup);
    assert.equal(world.stats().responsiveFossilOrgans,1);
    assert.equal(world.stats().responsiveFossilSails,2);
    const center=cellPosition(10,7,7),height=cellHeight(10,7,7);
    assert.ok(organ.position.z<center.z-.98 && organ.position.z>center.z-1.2,
      'organ is physically rooted on north disclosed non-passable edge');
    assert.ok(Math.abs(organ.position.y-height-.20)<1e-8);
    assert.ok(organ.children.filter(c=>c.isMesh).length>=3,
      'real central stone vertebra exists, not a ghost sprite');
    const leaves=[-1,1].map(side=>world.group.getObjectByName('Disclosed fossil tide-organ leaf 10 '+side));
    assert.ok(leaves.every(g=>g?.isGroup && g.parent===organ && g.children.length===2));
    assert.ok(leaves.every(g=>g.children.every(child=>child.isMesh)));
    world.animate(2,{explorerPosition:new Vector3(150,0,150)});
    const far=leaves.map(pose);
    world.animate(2,{explorerPosition:new Vector3(center.x,height,center.z)});
    assert.ok(leaves.every((g,i)=>pose(g)>far[i]+.45),
      'both actual stone leaves physically fan open near the published explorer');
    assert.ok(Math.abs(pose(leaves[0])-pose(leaves[1]))<1e-8,
      'no asymmetric or random motion: physical animation is deterministic');
    world.animate(2,{reducedMotion:true,explorerPosition:new Vector3(center.x,height,center.z)});
    assert.ok(leaves.every(g=>Math.abs(pose(g)-.28)<1e-8),
      'reduced motion holds a quiet stable articulated pose');
    world.animate(2,{reducedMotion:false,explorerPosition:new Vector3(150,0,150)});
    assert.ok(leaves.every(g=>Math.abs(pose(g)-.12)<1e-8),
      'retreat restores a stable known silhouette without ghost reaction');
    assert.equal(JSON.stringify(sourceState),unchanged,'rendering never edits the published engine snapshot');
    assert.equal(world.stats().geometryCount,budget.geometryCount);
    assert.equal(world.stats().materialCount,budget.materialCount);
    assert.equal(world.stats().textureCount,budget.textureCount);
    world.update(state([],{runToken:'fresh-empty-run'}));
    assert.equal(world.stats().responsiveFossilOrgans,0);
    assert.equal(world.group.getObjectByName('Disclosed fossil tide-organ 10'),undefined);
  }finally {world.dispose();}
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
  assert.equal(world.stats().textureCount,0);
});
test('private fields, hazards, blocked cells and real gate endpoints cannot fabricate a new sculpture',async()=>{
  const {createMazeWorld}=await loaded;
  const world=createMazeWorld({balanced:true});
  try {
    const forbidden=[
      state([],{privateMazeCells:[10],hiddenExitCell:10,privateThreatCell:10}),
      state([tile(10,{neighbors:[11],trap:true})]),
      state([tile(10,{neighbors:[11],blocked:true})]),
      state([tile(10,{neighbors:[11]})],{keys:[{id:'known',cell:10,collected:false}]}),
      state([tile(10,{neighbors:[11]}),tile(11,{neighbors:[10]})],{
        doors:[{a:10,b:11,open:false}]}),
    ];
    for(const s of forbidden){
      world.update(s);
      assert.equal(world.stats().responsiveFossilOrgans,0,
        'non-disclosed, unsafe or real gate cells cannot grow this cosmetic model');
    }
    world.update(state([tile(10,{neighbors:[11]})],{
      privateMazeCells:[10,44],hiddenExitCell:10,privateThreatCell:10,privateRoute:[3,4]
    }));
    assert.equal(world.stats().responsiveFossilOrgans,1,
      'new authored objects use only published safe tile/edge evidence');
  }finally {world.dispose();}
});