'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const{runAntInteractionCampaign}=require('../../dist/games/ai-ant-colony/src/index.js');

test('zero-audience and provider-outage modes preserve complete autonomous continuity',()=>{const none=runAntInteractionCampaign({seed:'zero-audience',ticks:500,pressure:'none'}),outage=runAntInteractionCampaign({seed:'provider-outage',ticks:500,pressure:'outage'});assert.equal(none.ticks,500);assert.equal(none.applied,0);assert.equal(outage.ticks,500);assert.equal(outage.applied,0);assert.equal(outage.accepted,0)});

test('maximum bounded pressure is deterministic, invariant-safe and never exceeds caps',()=>{const input={seed:'maximum-pressure',ticks:900,pressure:'maximum'},a=runAntInteractionCampaign(input),b=runAntInteractionCampaign(input);assert.deepEqual(a,b);assert.ok(a.accepted>0);assert.ok(a.applied>0);assert.ok(a.records<=2048);assert.ok(a.predators<=4);assert.ok(['active','result'].includes(a.lifecycle))});
