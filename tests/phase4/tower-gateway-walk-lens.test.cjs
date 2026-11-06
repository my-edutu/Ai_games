'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const modulePromise = import(pathToFileURL(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs')).href);
function caseFor(x) {
  const source={runToken:'episode-8',floor:8,tick:111,lifecycle:'running',
    worldWidth:480000,player:{x,y:342000,halfHeight:12000,
      state:'standing',health:4,grounded:true,groundedPlatformId:'f8:cap'}};
  const earned={runToken:'episode-8',floor:8,guardianId:'f8:guardian',
    cap:{id:'f8:cap',x:240000,y:310000,width:240000,height:20000}};
  return {source,earned};
}
test('earned grounded walk tightens the physical doorway lens',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(360000);
  const far=lens(source,earned,390/844);
  assert.ok(far?.radius>30);
  assert.equal(far.exitX,422400);
  source.player.x=403000;
  const close=lens(source,earned,390/844);
  assert.ok(close.radius<far.radius);
  assert.ok(close.focusWeight>far.focusWeight);
  assert.ok(close.radius>=30 && close.radius<=67);
});
test('rejects distant, airborne, displaced or dead climber',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(280000);
  assert.equal(lens(source,earned,390/844),null);
  source.player.x=410000;source.player.y+=13000;
  assert.equal(lens(source,earned,390/844),null);
  source.player.y-=13000;source.player.state='airborne';source.player.grounded=false;
  assert.equal(lens(source,earned,390/844),null);
  source.player.state='standing';source.player.grounded=true;source.player.health=0;
  assert.equal(lens(source,earned,390/844),null);
});
test('does not retain previous-run, stale, result or wrong-floor doorway',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(410000);
  assert.equal(lens({...source,stale:true},earned,390/844),null);
  assert.equal(lens({...source,runToken:'next'},earned,390/844),null);
  assert.equal(lens({...source,lifecycle:'result'},earned,390/844),null);
  assert.equal(lens(source,{...earned,cap:{...earned.cap,id:'f9:cap'}},390/844),null);
});
test('portrait budgets, zoom preference and bad projection do not force lens',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(408000);
  const portrait=lens(source,earned,390/844),desktop=lens(source,earned,960/600);
  assert.ok(portrait.radius>desktop.radius);
  assert.ok(portrait.focusWeight>desktop.focusWeight);
  assert.equal(lens(source,earned,NaN),null);
  assert.equal(lens(source,earned,390/844,0),null);
  assert.equal(lens(source,earned,390/844,1.25),null);
});
test('injured-but-physically-footed hero retains doorway lens; unsupported or wrong-deck hero cannot',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(405000);
  source.player.state='hurt';
  assert.ok(lens(source,earned,390/844),'recoil should not erase the actual grounded exit');
  source.player.grounded=false;
  assert.equal(lens(source,earned,390/844),null);
  source.player.grounded=true;source.player.groundedPlatformId='f8:p6';
  assert.equal(lens(source,earned,390/844),null);
});

test('earned walk dolly approaches both silhouettes without going through the solid clockwork core',async()=>{
  const {safeEarnedGatewayDollyRadius}=await modulePromise;
  const camera={x:0,y:28,z:70}, actor={x:0,y:4,z:25}, gate={x:1,y:5,z:25};
  const unobstructed=safeEarnedGatewayDollyRadius(camera,44,actor,gate);
  assert.ok(unobstructed<=44.01 && unobstructed>=44);
  // An opposite-side target is behind the opaque core: do not make the
  // gameplay hero larger at the cost of hiding the earned real doorway.
  const occluded=safeEarnedGatewayDollyRadius(
    {x:70,y:28,z:0},44,{x:-25,y:4,z:0},{x:-25,y:5,z:2});
  assert.equal(occluded,70);
});
test('no unsafe or malformed earned-camera radius can enter the 3D lens',async()=>{
  const {safeEarnedGatewayDollyRadius}=await modulePromise;
  const camera={x:0,y:28,z:70},actor={x:0,y:4,z:25},gate={x:1,y:5,z:25};
  assert.equal(safeEarnedGatewayDollyRadius(camera,90,actor,gate),70);
  assert.equal(safeEarnedGatewayDollyRadius(camera,44,actor,gate,-1),null);
  assert.equal(safeEarnedGatewayDollyRadius({...camera,z:NaN},44,actor,gate),null);
  assert.equal(safeEarnedGatewayDollyRadius(camera,44,{...actor,x:NaN},gate),null);
  assert.equal(safeEarnedGatewayDollyRadius(camera,0,actor,gate),null);
});
