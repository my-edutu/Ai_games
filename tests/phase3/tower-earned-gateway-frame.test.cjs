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
  assert.match(scene,/earnedGatewayEscortResponse\(camera\.aspect, dt\)/);
  assert.match(scene,/const earnedSource = !options\.stale &&/);
  assert.doesNotMatch(scene,/const earnedSource = snapshot\?\.floor === 8/);
});
