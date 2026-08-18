'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const ant=require('../../dist/games/ai-ant-colony/src/index.js');
const salt='phase4-private-salt-value';
function vote(overrides={}){return ant.normalizeAntProviderVote({provider:'youtube',eventId:'evt-001',subject:'provider-user-44',displayName:'Never Persist This',optionId:'nectar-bloom',entitlementWeight:1,occurredTick:10,receivedTick:10,authenticated:true,moderation:'pass',regionAllowed:true,identitySalt:salt,...overrides})}

test('provider normalization tokenizes identity and drops display metadata',()=>{const a=vote(),b=vote({eventId:'evt-002'});assert.match(a.viewerToken,/^viewer_[a-f0-9]{24}$/);assert.equal(a.viewerToken,b.viewerToken);assert.equal('displayName'in a,false);assert.equal(JSON.stringify(a).includes('Never Persist This'),false);assert.equal(a.idempotencyKey,'youtube:evt-001')});

test('gateway accepts one valid input and rejects duplicate delivery',()=>{const gateway=new ant.AntAudienceGateway();const input=vote();assert.equal(gateway.accept(input).status,'accepted');assert.deepEqual(gateway.accept(input),{status:'rejected',reason:'duplicate'});assert.equal(gateway.snapshot().seenCount,1)});

test('gateway fails closed on authentication, moderation, region and entitlement errors',()=>{for(const[overrides,reason]of[[{authenticated:false},'authentication'],[{moderation:'unavailable'},'moderation-unavailable'],[{moderation:'reject'},'moderation-reject'],[{regionAllowed:false},'region'],[{entitlementWeight:4},'entitlement-weight']]){const gateway=new ant.AntAudienceGateway();assert.equal(gateway.accept(vote({...overrides,eventId:`evt-${reason}`})).reason,reason)}});

test('rejected inputs do not consume viewer or global rate capacity',()=>{const gateway=new ant.AntAudienceGateway({perViewerLimit:1,globalLimit:1});assert.equal(gateway.accept(vote({eventId:'evt-bad',authenticated:false})).reason,'authentication');assert.equal(gateway.accept(vote({eventId:'evt-good'})).status,'accepted');assert.equal(gateway.accept(vote({eventId:'evt-over'})).reason,'viewer-rate')});

test('gateway rejects stale, future and arbitrary effect inputs before state scheduling',()=>{const gateway=new ant.AntAudienceGateway({maxEventAgeTicks:20,maxFutureTicks:2});assert.equal(gateway.accept(vote({eventId:'evt-stale',occurredTick:1,receivedTick:30})).reason,'stale');assert.equal(gateway.accept(vote({eventId:'evt-future',occurredTick:20,receivedTick:10})).reason,'future');const invalid=vote({eventId:'evt-effect'});invalid.optionId='kill-queen';assert.equal(gateway.accept(invalid).reason,'effect')});
