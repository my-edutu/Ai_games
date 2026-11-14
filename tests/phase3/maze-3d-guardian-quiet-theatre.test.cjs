'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const original=()=>({
  runToken:'public-guardian-quiet-theatre',lifecycle:'running',result:null,
  width:5,height:5,currentCell:6,visibleCells:[1,6,7,8,11],
  cells:[
    {cell:1,blocked:false,neighbors:[]},
    {cell:6,blocked:false,neighbors:[7,11]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]},
    {cell:11,blocked:false,neighbors:[6]},
  ],doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:8}]
});
test('whole public guardian theatre loses competing physical tesserae but restores normal stone when unobserved',async()=>{
  const {createMazeWorld,cellPosition,cellHeight,publicGuardianForecourtShoulderCells,publicGuardianCausewayCells}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const s=original(),before=JSON.stringify(s);
  assert.deepEqual([...publicGuardianCausewayCells(s)],[[6,'x'],[7,'x'],[8,'x']]);
  assert.ok(publicGuardianForecourtShoulderCells(s).has(1),
    'public cell1 is a genuine sealed spectator boundary, not a guessed shortcut');
  const world=createMazeWorld({balanced:true}),budget=world.stats();
  const mat=new Matrix4(),pos=new Vector3(),quat=new Quaternion(),scale=new Vector3();
  const floor=cellPosition(1,5,5),height=cellHeight(1,5,5)+.007;
  const tesserae=()=>{
    let count=0;
    world.group.traverse(o=>{
      if(!o.isInstancedMesh)return;
      for(let i=0;i<o.count;i++){
        o.getMatrixAt(i,mat);mat.decompose(pos,quat,scale);
        if(Math.abs(scale.x-.39)<.001 && Math.abs(scale.y-.014)<.001
          && Math.abs(scale.z-.39)<.001 && Math.abs(pos.y-height)<.012
          && Math.abs(pos.x-floor.x)<.70 && Math.abs(pos.z-floor.z)<.70)
          count++;
      }
    });
    return count;
  };
  try{
    world.update(s);
    assert.equal(tesserae(),0,'repeated four physical spectator petals no longer compete with the two actors');
    assert.equal(world.stats().guardianCausewayTiles,3,'all authoritative original public causeway tiles remain');
    assert.equal(world.stats().guardianTideSignalTiles,3,'all six real rising warning leaves remain');
    assert.equal(world.stats().geometryCount,budget.geometryCount,'no GPU geometry classes added');
    assert.equal(world.stats().materialCount,budget.materialCount,'no GPU material classes added');
    world.update({...s,threats:[]});
    assert.equal(tesserae(),4,'all four original floor petals return when no guardian is witnessed');
    world.update({...s,visibleCells:[1,6,7,11]});
    assert.equal(tesserae(),4,'a hidden guardian cannot keep the stage or remove ordinary art');
    for(let i=0;i<6;i++){
      world.update({...s,runToken:'quiet-theatre-reset-'+i});
      assert.equal(tesserae(),0,'public quiet stage persists across genuine run resets');
      assert.ok(world.stats().geometryCount<100,'unaltered strict six-run geometry budget');
    }
    assert.equal(JSON.stringify(s),before,'world art may not change public AI truth');
  }finally{
    world.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});
