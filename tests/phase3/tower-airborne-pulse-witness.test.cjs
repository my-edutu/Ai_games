'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

let source;
async function witness(){
  source ||= import(pathToFileURL(path.join(__dirname,
    '../../public/infinite-tower-climb/visuals/airborne-pulse.mjs')).href);
  return (await source).witnessedAirbornePulse;
}
function frame(tick=10){
  return {
    runToken:'same-verified-run',floor:3,tick,lifecycle:'running',
    player:{state:'airborne',x:100000,y:200000,health:5,facing:1},
    projectiles:[],
  };
}
function shot(id='hero:projectile:10:0'){
  return {id,owner:'player',x:114000,y:200000,vx:14000,vy:0};
}
test('authentic source-new airborne shot produces a bounded witness and leaves frames immutable',async()=>{
  const observe=await witness();
  const before=frame(),next=frame(11);next.projectiles=[shot()];
  const original=JSON.stringify({before,next});
  assert.deepEqual(observe(before,next),{
    runToken:next.runToken,floor:3,tick:11,
    projectileId:next.projectiles[0].id,facing:1,
  });
  assert.equal(JSON.stringify({before,next}),original);
});
test('unchanged shot and missing or stale source frames cannot make a second pulse',async()=>{
  const observe=await witness();
  const before=frame();before.projectiles=[shot()];
  const next=frame(11);next.projectiles=[shot()];
  assert.equal(observe(before,next),null);
  const stale=frame(50);stale.projectiles=[shot('new')];
  assert.equal(observe(before,stale),null);
  assert.equal(observe(null,next),null);
  next.runToken='new-run';
  assert.equal(observe(before,next),null);
  next.runToken=before.runToken;next.floor++;
  assert.equal(observe(before,next),null);
});
test('only an authentic player-owned same-direction source-height airborne launch triggers pose',async()=>{
  const observe=await witness();
  const before=frame(),next=frame(11);
  next.projectiles=[{...shot(),owner:'enemy'}];
  assert.equal(observe(before,next),null);
  next.projectiles=[{...shot(),x:200000}];
  assert.equal(observe(before,next),null);
  next.projectiles=[{...shot(),y:220000}];
  assert.equal(observe(before,next),null);
  next.projectiles=[{...shot(),vx:-14000}];
  assert.equal(observe(before,next),null);
  next.projectiles=[shot()];
  next.player.state='standing';
  assert.equal(observe(before,next),null);
  next.player.state='airborne';before.player.state='standing';
  assert.equal(observe(before,next),null);
  before.player.state='airborne';next.lifecycle='result';
  assert.equal(observe(before,next),null);
});
