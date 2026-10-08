'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePath=path.resolve(__dirname,'../../public/infinite-tower-climb/grip-v10.js');
const source=fs.readFileSync(modulePath,'utf8');
const loaded=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('two-bone articulated hands reach an actual hold in either facing direction',async()=>{
  const {solveGrip2D,WAYFINDER_ARM}=await loaded;
  for(const side of [-1,1])for(const target of [[side*12,18],[side*8,14],[side*10,10],[side*15,6]]){
    const ik=solveGrip2D({side,targetX:target[0],targetY:target[1],bend:side});
    assert.ok(ik,'reachable hold should have solution');
    assert.ok(Math.hypot(ik.endX-target[0],ik.endY-target[1])<1e-6,'hand reaches solved hold');
    assert.ok(Math.hypot(ik.elbowX-side*WAYFINDER_ARM.shoulderOffset,ik.elbowY-WAYFINDER_ARM.shoulderY)<WAYFINDER_ARM.upper+.0001);
    assert.ok(Number.isFinite(ik.shoulderZ)&&Number.isFinite(ik.elbowZ));
  }
});

test('contact posing does not invent climbing holds or mutate frozen server snapshots',async()=>{
  const {selectVisibleLedge}=await loaded;
  const snapshot=Object.freeze({
    player:Object.freeze({state:'airborne',vy:8000}),
    platforms:Object.freeze([Object.freeze({id:'f3:p2',x:114000,y:101000,width:120000,height:10000})])
  });
  const before=JSON.stringify(snapshot);
  const right=selectVisibleLedge(snapshot,{actorX:105,actorY:102,scale:14/26,facing:1});
  assert.equal(right.platformId,'f3:p2');
  assert.equal(right.side,1);
  assert.ok(right.reach<19);
  const left=selectVisibleLedge(snapshot,{actorX:105,actorY:102,scale:14/26,facing:-1});
  assert.equal(left.platformId,'f3:p2');
  assert.equal(left.side,-1);
  assert.equal(JSON.stringify(snapshot),before,'no authoritative data changed');
  assert.equal(selectVisibleLedge({...snapshot,player:{state:'standing',vy:0}},{actorX:105,actorY:102,scale:14/26}),null,'no false grip while standing');
  assert.equal(selectVisibleLedge({...snapshot,player:{state:'airborne',vy:-9000}},{actorX:105,actorY:102,scale:14/26}),null,'no grip when falling away');
  assert.equal(selectVisibleLedge(snapshot,{actorX:450,actorY:102,scale:14/26}),null,'distant platform cannot be grasped');
});

test('out-of-reach, malformed and non-finite IK targets fail safely',async()=>{
  const {solveGrip2D,selectVisibleLedge}=await loaded;
  assert.equal(solveGrip2D({side:1,targetX:100,targetY:100}),null);
  assert.equal(solveGrip2D({side:1,targetX:NaN,targetY:10}),null);
  assert.equal(selectVisibleLedge(null,{actorX:0,actorY:0,scale:1}),null);
  assert.equal(selectVisibleLedge({player:{state:'airborne',vy:4000},platforms:[{x:0,y:0,width:0,height:0}]},{actorX:0,actorY:0,scale:1}),null);
});

test('contact pose changes only presentation arm joints, never the character root or authority',async()=>{
  const {applyContactPose}=await loaded;
  const arm=()=>({shoulder:{rotation:{x:0,z:0}},elbow:{rotation:{x:0,z:0}},hand:{rotation:{z:0}}});
  const a=arm(),b=arm();
  const hero={position:{x:105,y:102},userData:{arms:[a,b]}};
  const snapshot=JSON.stringify(hero.position);
  assert.equal(applyContactPose(hero,{side:1,localX:16.7,localY:16.7}),true);
  assert.ok(Math.abs(b.shoulder.rotation.z)>.05);
  assert.equal(a.shoulder.rotation.z,0,'other arm remains available for animation');
  assert.equal(JSON.stringify(hero.position),snapshot);
  assert.equal(applyContactPose(hero,null),false);
});
