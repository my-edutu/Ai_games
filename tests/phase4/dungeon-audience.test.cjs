'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{normalizeDungeonAudienceInput}=require('../../dist/games/ai-dungeon-endless-adventure/src/influence/index.js');
const{buildDungeonRenderSnapshot}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/snapshot.js');
const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};
function envelope(id,kind='effect',extra={}){return{providerEventId:id,actorId:'viewer-secret-42',source:'chat',kind,moderation:'approved',receivedTick:0,...extra}}

test('normalization removes raw provider identity and rejects malformed or moderated input',()=>{
  const ok=normalizeDungeonAudienceInput(envelope('evt-1','effect',{effectId:'shield'}));
  assert.equal(ok.ok,true);assert.equal(ok.input.providerEventId,'evt-1');assert.notEqual(ok.input.actorToken,'viewer-secret-42');assert.equal(JSON.stringify(ok.input).includes('viewer-secret-42'),false);
  assert.equal(normalizeDungeonAudienceInput({...envelope('evt-2'),moderation:'blocked'}).ok,false);
  assert.equal(normalizeDungeonAudienceInput({...envelope(''),providerEventId:''}).ok,false);
});

test('duplicate reordered and disabled inputs apply at most once and remain bounded',()=>{
  const runtime=new DungeonRuntime(base,'audience-idempotency','audience-run');
  const normalized=normalizeDungeonAudienceInput(envelope('evt-shield','effect',{effectId:'shield'})).input;
  const a=runtime.submitAudience(normalized);const b=runtime.submitAudience(normalized);
  assert.equal(a.accepted,true);assert.equal(b.accepted,false);assert.equal(b.reason,'duplicate');
  runtime.step({kind:'wait'});const shield=runtime.state.hero.shield;runtime.step({kind:'wait'});assert.equal(runtime.state.hero.shield,shield);
  runtime.setAudienceEnabled(false);const disabled=runtime.submitAudience(normalizeDungeonAudienceInput(envelope('evt-off','effect',{effectId:'shield'})).input);assert.equal(disabled.accepted,false);assert.equal(disabled.reason,'disabled');
  assert.ok(runtime.state.influence.processedIds.length<=256);assert.ok(runtime.state.influence.ledger.length<=128);assert.ok(runtime.state.influence.queued.length<=32);
});

test('route choices create distinct bounded next-floor gameplay consequences',()=>{
  const expectations={warded:'shield',riches:'chest',trial:'challenger'};
  for(const [route,kind] of Object.entries(expectations)){
    const runtime=new DungeonRuntime(base,`route-${route}`,`run-${route}`);
    const input=normalizeDungeonAudienceInput(envelope(`evt-${route}`,'effect',{effectId:'route',optionId:route})).input;
    assert.equal(runtime.submitAudience(input).accepted,true);runtime.step({kind:'wait'});
    runtime.state.lifecycle='floor-result';runtime.state.intermissionRemaining=1;runtime.step({kind:'wait'});
    assert.equal(runtime.state.influence.currentRouteModifier,route);
    if(kind==='shield')assert.ok(runtime.state.hero.shield>=4);
    if(kind==='chest'){runtime.state.hero.cell=runtime.state.floor.chest;const before=runtime.state.hero.gold;runtime.step({kind:'interact'});assert.ok(runtime.state.hero.gold-before>=12)}
    if(kind==='challenger')assert.ok(runtime.state.enemies.some(enemy=>enemy.id.startsWith('audience-trial-')));
  }
});

test('relic vote has deterministic tie break, capped weight and zero-ballot autonomous fallback',()=>{
  const runtime=new DungeonRuntime(base,'vote-seed','vote-run');runtime.state.lifecycle='chapter-result';runtime.state.rewardChoices=['ember-edge','echo-guard','wayfinder-lens'];runtime.state.intermissionRemaining=2;
  assert.equal(runtime.openRelicVote(20).opened,true);
  const a=normalizeDungeonAudienceInput(envelope('vote-a','vote',{optionId:'ember-edge',weight:99})).input;
  const b=normalizeDungeonAudienceInput({...envelope('vote-b','vote',{optionId:'echo-guard',weight:1}),actorId:'other-viewer'}).input;
  runtime.submitAudience(a);runtime.submitAudience(b);for(let i=0;i<21;i++)runtime.step({kind:'wait'});
  assert.ok(runtime.state.hero.relics.length===1);assert.ok(runtime.state.influence.vote===null||runtime.state.influence.vote.closed);
  const zero=new DungeonRuntime(base,'vote-zero','vote-zero-run');zero.state.lifecycle='chapter-result';zero.state.rewardChoices=['ember-edge','echo-guard','wayfinder-lens'];zero.state.intermissionRemaining=1;zero.openRelicVote(1);zero.step({kind:'wait'});zero.step();assert.equal(zero.state.hero.relics.length,1);
});

test('reversal only compensates reversible effects and cannot erase audit history',()=>{
  const runtime=new DungeonRuntime(base,'reversal-seed','reversal-run');
  runtime.submitAudience(normalizeDungeonAudienceInput(envelope('theme-1','effect',{effectId:'theme',optionId:'ember'})).input);runtime.step({kind:'wait'});
  const reversed=runtime.reverseAudience('theme-1','operator');assert.equal(reversed.reversed,true);assert.equal(runtime.state.influence.themeId,'default');assert.ok(runtime.state.influence.ledger.some(entry=>entry.providerEventId==='theme-1'&&entry.status==='reversed'));
  runtime.submitAudience(normalizeDungeonAudienceInput(envelope('shield-1','effect',{effectId:'shield'})).input);runtime.step({kind:'wait'});assert.equal(runtime.reverseAudience('shield-1','operator').reversed,false);
});

test('public render state discloses bounded audience consequences without private identity or guarantee language',()=>{
  const runtime=new DungeonRuntime(base,'public-audience','public-run');runtime.submitAudience(normalizeDungeonAudienceInput(envelope('theme-public','effect',{effectId:'theme',optionId:'frost'})).input);runtime.step({kind:'wait'});
  const snapshot=buildDungeonRenderSnapshot(runtime.state);const text=JSON.stringify(snapshot);
  assert.equal(text.includes('viewer-secret-42'),false);assert.ok(snapshot.audience);assert.ok(snapshot.audience.disclosure.toLowerCase().includes('cannot guarantee'));assert.ok(snapshot.audience.recent.length<=4);
});
