'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const snap = (cells, step, run='same') => Object.freeze({
  width:10,height:6,movementStep:step,runToken:run,
  snake:Object.freeze(cells.map(cell=>Object.freeze({cell})))
});
const load = () => Promise.all([
  import('../../public/snake-stream/motion.mjs'),
  import('../../public/snake-stream/serpent.mjs'),
]);
function ringCenter(mesh,index){const a=mesh.geometry.getAttribute('position');const n=9;let x=0,z=0;
  for(let j=0;j<n;j++){x+=a.getX(index*n+j);z+=a.getZ(index*n+j)}
  return {x:x/n,z:z/n};
}
test('T2 genuine portal exit carries old public head direction; never invents east-facing singleton',async()=>{
  const [{buildMotion}]=await load();
  const previous=snap([21,11,10,0],14), next=snap([45,21,11,10],15);
  const frozen=JSON.stringify([previous,next]);
  const pose=buildMotion(next,previous,0.35);
  assert.equal(pose.paths.length,2);
  assert.deepEqual(pose.paths[0][0],{x:0.5,z:1.5},'portal head must never interpolate across exit');
  assert.deepEqual(pose.direction,{x:0,z:1});
  assert.deepEqual(pose.fragmentDirections[0],{x:0,z:1});
  assert.equal(JSON.stringify([previous,next]),frozen,'immutable public snapshots untouched');
});
test('T2 old publicly connected torso guides each isolated portal-fragment stub independently',async()=>{
  const [{buildMotion},{createSerpent}]=await load();
  const prev=snap([21,11,10,9,8],4);
  const next=snap([45,21,8,7,6],5);
  const pose=buildMotion(next,prev,0.5);
  assert.equal(pose.paths.length,3);
  assert.deepEqual(pose.fragmentDirections[0],{x:0,z:1});
  assert.deepEqual(pose.fragmentDirections[1],{x:0,z:1});
  const model=createSerpent(THREE);
  try {
    model.update(pose.paths,{detail:'low',reducedMotion:true,runToken:'same',direction:pose.direction,
      fragmentDirections:pose.fragmentDirections});
    assert.equal(model.stats().paths,3);
    const body=model.group.getObjectByName('Continuous sculpted serpent body');
    const start=ringCenter(body,3), nextRing=ringCenter(body,4);
    assert.ok(Math.abs(nextRing.x-start.x)<.035,'old torso guides vertical extension, not fabricated east-facing stub');
    assert.ok(nextRing.z<start.z-.07,'isolated broken torso extends away from preceding head');
  }finally{model.dispose()}
});
test('T2 portal and reset directions fail closed on missing prior evidence, with finite 40+ body poses',async()=>{
 const [{buildMotion},{createSerpent}]=await load();
 const path=[5,15,25,35,45,55];
 const first=buildMotion(snap(path,20),null,0);
 assert.deepEqual(first.direction,{x:0,z:-1},'current connected path determines actual head direction');
 const solitary=buildMotion(snap([45],50,'new'),snap([21,11],49,'old'),0.2);
 assert.deepEqual(solitary.direction,{x:1,z:0},'no invented old-run orientation');
 const legal=[];for(let row=0;row<5;row++){for(let col=0;col<10;col++)legal.push(row%2===0?row*10+col:row*10+9-col)}
 const pose=buildMotion(snap(legal,100),null,1), before=JSON.stringify(pose.paths);
 const model=createSerpent(THREE);
 try{for(const reducedMotion of [false,true])model.update(pose.paths,{detail:'low',reducedMotion,runToken:'same',direction:pose.direction,fragmentDirections:pose.fragmentDirections});
  assert.equal(model.stats().truncated,false);
  assert.ok(model.stats().bodyRings>=45);
  const pos=model.group.getObjectByName('Continuous sculpted serpent body').geometry.attributes.position.array;
  for(let i=0;i<model.stats().bodyVertices*3;i++)assert.ok(Number.isFinite(pos[i]));
  assert.equal(JSON.stringify(pose.paths),before);
 }finally{model.dispose()}
});
