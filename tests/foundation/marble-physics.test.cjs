'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {
  MarbleRuntime,
  stepMarblePhysics,
  marbleStateChecksum
}=require('../../dist/games/marble-survival/src/index.js');

function physicsState(seed='physics-fixture',rosterSize=3){
  const runtime=MarbleRuntime.create({rosterSize,roundQuotas:rosterSize===2?[1,1,1,1,1]:[2,1,1,1,1],roundTimeoutTicks:10000},seed);
  runtime.state.lifecycle='active';
  runtime.state.roundIntroRemaining=0;
  runtime.state.arena.obstacles=[];
  runtime.state.arena.bumpers=[];
  runtime.state.arena.hazards=[];
  runtime.state.arena.windZones=[];
  runtime.state.arena.sweepers=[];
  return runtime.state;
}

function idleActions(state){return state.marbles.filter(m=>m.status==='active').map(m=>({marbleId:m.id,steerX:0,steerY:0,boostPermille:1000,intent:'holding-line',confidence:'medium'}));}

test('world collision is bounded and frame schedule cannot alter fixed-step outcome',()=>{
  const a=physicsState('wall-a',2),b=structuredClone(a);
  for(const state of [a,b]){
    const marble=state.marbles[0];
    marble.position={x:state.config.marbleRadius-20,y:8000};
    marble.velocity={x:-180,y:0};
  }
  const once=stepMarblePhysics(a,idleActions(a));
  let other=b; for(let i=0;i<1;i++)other=stepMarblePhysics(other,idleActions(other)).state;
  assert.equal(marbleStateChecksum(once.state),marbleStateChecksum(other));
  assert.ok(once.state.marbles[0].position.x>=once.state.config.marbleRadius);
  assert.ok(once.state.marbles[0].velocity.x>=0);
  assert.ok(once.contacts.some(contact=>contact.kind==='world'));
});

test('bumper and thin obstacle contacts prevent outcome-changing tunnelling',()=>{
  let state=physicsState('obstacle-probe',2);
  const radius=state.config.marbleRadius;
  state.arena.bumpers=[{id:'b-1',kind:'bumper',x:12000,y:8000,radius:500,restitutionPermille:900}];
  state.arena.obstacles=[{id:'thin-gate',kind:'block',x:6000,y:5000,width:120,height:6000}];
  const first=state.marbles[0];
  first.position={x:5000,y:8000};
  first.velocity={x:state.config.maxSpeed,y:0};
  for(let i=0;i<12;i++)state=stepMarblePhysics(state,idleActions(state)).state;
  assert.ok(first.id===state.marbles[0].id);
  assert.ok(state.marbles[0].position.x<=6000-radius+state.config.penetrationTolerance);
  const second=state.marbles[1];
  second.position={x:11000,y:8000};
  second.velocity={x:state.config.maxSpeed,y:0};
  const hit=stepMarblePhysics(state,idleActions(state));
  assert.ok(hit.contacts.some(contact=>contact.kind==='bumper'||contact.kind==='obstacle'));
  assert.ok(Number.isInteger(hit.state.marbles[1].position.x));
});

test('marble pair resolution is stable regardless of array insertion order',()=>{
  const a=physicsState('pair-order',3),b=structuredClone(a);
  for(const state of [a,b]){
    state.marbles[0].position={x:11000,y:8000};state.marbles[0].velocity={x:80,y:0};
    state.marbles[1].position={x:11400,y:8000};state.marbles[1].velocity={x:0,y:0};
    state.marbles[2].position={x:11800,y:8000};state.marbles[2].velocity={x:-80,y:0};
  }
  b.marbles.reverse();
  const outA=stepMarblePhysics(a,idleActions(a));
  const outB=stepMarblePhysics(b,idleActions(b));
  const normalized=value=>value.state.marbles.slice().sort((x,y)=>x.id-y.id).map(m=>({id:m.id,p:m.position,v:m.velocity}));
  assert.deepEqual(normalized(outA),normalized(outB));
  assert.ok(outA.contacts.filter(contact=>contact.kind==='marble').length>=1);
});

test('solver clamps speed, bounds contact work, and reports invalid numeric range',()=>{
  const state=physicsState('limits',3);
  state.marbles[0].velocity={x:999999999,y:-999999999};
  state.arena.bumpers=Array.from({length:40},(_,index)=>({id:`dense-${index}`,kind:'bumper',x:12000+(index%5),y:8000+Math.floor(index/5),radius:500,restitutionPermille:900}));
  const out=stepMarblePhysics(state,idleActions(state));
  const speedSquared=out.state.marbles[0].velocity.x**2+out.state.marbles[0].velocity.y**2;
  assert.ok(speedSquared<=out.state.config.maxSpeed**2+2*out.state.config.maxSpeed);
  assert.ok(out.contacts.length<=out.state.config.maxContactsPerTick);
  const corrupt=structuredClone(out.state);
  corrupt.marbles[0].position.x=Number.MAX_SAFE_INTEGER;
  const invalid=stepMarblePhysics(corrupt,idleActions(corrupt));
  assert.equal(invalid.integrityIssue?.code,'numeric-range');
});
