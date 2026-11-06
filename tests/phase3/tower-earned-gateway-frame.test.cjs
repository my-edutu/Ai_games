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
