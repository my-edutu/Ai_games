'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const helper = import('../../public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs');
const original = { gateBefore:[1.12,.2,.5], gateAfter:[.95,.1,.5],
  actorBefore:[-.2,.1,.4,.15], actorAfter:[-.3,.08,.4,.15],
  actorCoreClear:true, gatewayCoreClear:true };
test('source-earned physical gate benefits from an unobstructed portrait correction', async () => {
  const { acceptEarnedGatewayEscort }=await helper;
  assert.ok(acceptEarnedGatewayEscort(original) > .1);
});
test('already safe or invalid gate never drives a camera correction', async () => {
  const { acceptEarnedGatewayEscort, gatewayScreenError }=await helper;
  for (const ndc of [[.4,.3,.4],[NaN,0,.5],[1,0,9]])
    assert.equal(acceptEarnedGatewayEscort({...original,gateBefore:ndc}),0);
  assert.equal(gatewayScreenError([0,0,2]),Infinity);
});
test('full climber and both solid-core sightlines veto a gateway-only shot', async () => {
  const { acceptEarnedGatewayEscort }=await helper;
  assert.equal(acceptEarnedGatewayEscort({...original,actorAfter:[-.3,.67,.4,.18]}),0);
  assert.equal(acceptEarnedGatewayEscort({...original,actorCoreClear:false}),0);
  assert.equal(acceptEarnedGatewayEscort({...original,gatewayCoreClear:false}),0);
  assert.equal(acceptEarnedGatewayEscort({...original,actorBefore:[-.1,.1,.4,.02]}),0);
});
test('marginal or worse proposal must not produce portrait camera oscillation', async () => {
  const { acceptEarnedGatewayEscort }=await helper;
  assert.equal(acceptEarnedGatewayEscort({...original,gateAfter:[1.11,.19,.5]}),0);
  assert.equal(acceptEarnedGatewayEscort({...original,gateAfter:[1.3,.19,.5]}),0);
});

test('earned doorway uses bounded smooth motion at both source-pinned viewports', async () => {
  const { earnedGatewayEscortResponse }=await helper;
  const desktop=earnedGatewayEscortResponse(960/600,1/30);
  const portrait=earnedGatewayEscortResponse(390/844,1/30);
  assert.ok(desktop>0 && desktop<=.11);
  assert.ok(portrait>desktop && portrait<=.20);
  for(const aspect of [-1,0,Infinity,NaN,2.5])
    assert.equal(earnedGatewayEscortResponse(aspect,1/30),0);
  for(const dt of [-1,0,Infinity,NaN])
    assert.equal(earnedGatewayEscortResponse(1.6,dt),0);
});
test('desktop gateway rescue keeps the climber readable and cannot turn around the solid core', async () => {
  const { acceptEarnedGatewayEscort }=await helper;
  const desktop={...original,gateBefore:[1.3,.26,.3],gateAfter:[.88,.14,.3],
    actorBefore:[-.15,-.1,.4,.17],actorAfter:[-.25,-.1,.4,.17]};
  assert.ok(acceptEarnedGatewayEscort(desktop)>.2);
  assert.equal(acceptEarnedGatewayEscort({...desktop,actorAfter:[-.25,.7,.4,.17]}),0);
  assert.equal(acceptEarnedGatewayEscort({...desktop,gatewayCoreClear:false}),0);
});
test('shipped 3D follow camera and source diagnostics support later guardian caps',()=>{
  const fs=require('node:fs');
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/camera\.aspect > 0 && camera\.aspect < 2\.5/);
  assert.match(scene,/earnedGatewayEscortResponse\(camera\.aspect, cameraDt\)/);
  assert.match(scene,/const cameraDt = sourceSubmittedDoorwayCameraDt\(dt,coldArchLens,snapshot,options\)/);
  assert.doesNotMatch(scene,/earnedGatewayEscortResponse\(camera\.aspect, dt\)/,
    'the earned door and living body share one source-qualified camera submission clock');
  assert.match(scene,/const earnedSource = !options\.stale &&/);
  assert.doesNotMatch(scene,/const earnedSource = snapshot\?\.floor === 8/);
});

 
test('earned near-roof airborne cap transit keeps the real doorway in the same safe exterior lens',async()=>{
  const {observedAirborneGatewayShot,observedGroundedGatewayShot}=await helper;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const source={lifecycle:'running',stale:false,runToken:'earned-episode-1',
    floor:8,tick:362,worldWidth:480000,
    player:{state:'airborne',grounded:false,health:4,
      x:310000,y:cap.y+cap.height+14000+18000,
      halfWidth:9000,halfHeight:14000}};
  const earned={runToken:source.runToken,floor:8,cap};
  const phone=observedAirborneGatewayShot(source,earned,390/844);
  const wide=observedAirborneGatewayShot(source,earned,960/600);
  assert.ok(phone?.realAirborneCap && wide?.realAirborneCap);
  assert.equal(phone.sourceTick,source.tick);
  assert.ok(phone.radius>=30&&phone.radius<=60);
  assert.ok(wide.radius>=30&&wide.radius<=53);
  assert.ok(phone.focusWeight>0&&phone.focusWeight<=.29);
  assert.ok(0<phone.approach&&phone.approach<1);
  assert.equal(observedGroundedGatewayShot(source,earned,390/844),null,
    'airborne camera must not fabricate grounded contact');
  for(const variant of [
    {...source,stale:true},{...source,floor:9},
    {...source,runToken:'post-restart'},
    {...source,player:{...source.player,health:0}},
    {...source,player:{...source.player,grounded:true}},
    {...source,player:{...source.player,state:'standing'}},
    {...source,player:{...source.player,y:cap.y+cap.height+14000+90000}},
    {...source,player:{...source.player,y:cap.y+cap.height+14000-7000}},
    {...source,player:{...source.player,x:cap.x+cap.width+10000}},
    {...source,player:{...source.player,x:cap.x+10000}},
  ])assert.equal(observedAirborneGatewayShot(variant,earned,390/844),null,
    'false episode, dead body, unsupported position or unearned route must not activate');
  assert.ok(observedAirborneGatewayShot({...source,
    player:{...source.player,state:'dashing'}},earned,390/844));
  assert.equal(observedAirborneGatewayShot(source,{...earned,cap:{...cap,id:'f7:cap'}},390/844),null);
  assert.equal(observedAirborneGatewayShot(source,null,390/844),null);
  assert.equal(observedAirborneGatewayShot(source,earned,0),null);
  assert.equal(observedAirborneGatewayShot(source,earned,390/844,1.4),null);
});
test('actual native 3D follow rig extends both physically earned lens and foreground corridor through airborne crossing',()=>{
  const fs=require('node:fs');
  const source=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(source,/observedAirborneGatewayShot\(snapshot, liveExit, camera\.aspect, zoom\)/);
  assert.match(source,/sourceEarnedWalk \|\| sourceAirborneWalk \|\| sourceLastStand/);
  assert.match(source,/!!sourceAirborneWalk\?\.realAirborneCap/);
  assert.match(source,/airborneGateway:sourceAirborneWalk\?\.realAirborneCap === true/);
  assert.match(source,/sightlinePriorities\.arrival\?observedLandingSightline:/);
  assert.match(source,/sightlinePriorities\.gate&&sightlinePriorities\.arrival/);
  assert.match(source,/\?earnedGatewayFocus:null\)/);
  // The real scene protects an airborne landing and an earned gateway as
  // independent camera-relative targets; the retired protectArrival variable
  // must not be reinstated merely to satisfy this source-contract test.
  assert.match(source,/protectLiveRoute&&sightlinePriorities\.arrival\?observedLandingSightline:/);
  assert.match(source,/protectLiveRoute&&sightlinePriorities\.gate&&sightlinePriorities\.arrival\s*\?earnedGatewayFocus:null/);
});
