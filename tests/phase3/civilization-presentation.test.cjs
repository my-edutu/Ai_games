'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {CivilizationRuntime}=require('../../dist/games/ai-civilization/src/runtime/run.js');
const {createCivilizationRenderSnapshot}=require('../../dist/games/ai-civilization/src/presentation/snapshot.js');
const {deriveCivilizationAudioFrame,initialCivilizationAudioMemory}=require('../../dist/games/ai-civilization/src/presentation/audio.js');

function runtimeWithEvents(seed='presentation'){
  const runtime=CivilizationRuntime.create({maxRunDays:2400},seed);
  for(let i=0;i<160;i++)runtime.step();
  return runtime;
}

test('render snapshot is deeply immutable, detached, bounded and privacy-safe',()=>{
  const runtime=runtimeWithEvents('immutable');
  const events=runtime.peekEvents(200);
  events.push({seq:99999,tick:runtime.state.tick,type:'provider-debug',data:{provider:'secret-provider',privateId:'user-123',rawText:'viewer says hello',stack:'/host/path'}});
  const before=checksum(runtime.state);
  const snapshot=createCivilizationRenderSnapshot(runtime.state,events);
  assert.equal(Object.isFrozen(snapshot),true);
  assert.equal(Object.isFrozen(snapshot.world),true);
  assert.equal(Object.isFrozen(snapshot.world.tiles),true);
  assert.equal(Object.isFrozen(snapshot.characters.ruler),true);
  assert.equal(snapshot.world.tiles.length<=160,true);
  assert.equal(snapshot.characters.councillors.length<=4,true);
  assert.equal(snapshot.characters.rivals.length<=3,true);
  assert.equal(snapshot.events.length<=12,true);
  assert.ok(snapshot.accessibility.summary.length<=320);
  const serialized=JSON.stringify(snapshot);
  for(const forbidden of ['secret-provider','user-123','viewer says hello','/host/path','privateId','rawText','provider-debug'])assert.equal(serialized.includes(forbidden),false,forbidden);
  assert.equal(checksum(runtime.state),before);
  assert.throws(()=>{snapshot.world.tiles.push({})},TypeError);
});

test('public render identity never exposes an operator-supplied seed',()=>{
  const runtime=CivilizationRuntime.create({},'operator-secret-seed');
  const snapshot=createCivilizationRenderSnapshot(runtime.state,runtime.peekEvents());
  assert.equal(JSON.stringify(snapshot).includes('operator-secret-seed'),false);
});

test('render tiles expose deterministic truthful aggregate presentation descriptors without mutating authority',()=>{
  const runtime=runtimeWithEvents('living-kingdom-descriptors');
  const [farm,workshop,home]=runtime.state.world.tiles;
  farm.owner='player';workshop.owner='player';home.owner='player';
  farm.building={id:'presentation-farm',type:'farm',level:1,builtAtTick:runtime.state.tick};
  workshop.building={id:'presentation-workshop',type:'workshop',level:1,builtAtTick:runtime.state.tick};
  home.building={id:'presentation-house',type:'house',level:1,builtAtTick:runtime.state.tick};
  const events=runtime.peekEvents(200);
  const before=checksum(runtime.state);
  const snapshot=createCivilizationRenderSnapshot(runtime.state,events);
  const repeated=createCivilizationRenderSnapshot(runtime.state,events);
  assert.equal(snapshot.world.tiles.some(tile=>tile.buildingType==='farm'&&tile.activity?.kind==='farm'),true);
  assert.equal(snapshot.world.tiles.some(tile=>tile.buildingType==='workshop'&&tile.activity?.kind==='craft'),true);
  assert.equal(snapshot.world.tiles.some(tile=>tile.buildingType==='house'&&tile.activity?.kind==='domestic'),true);
  assert.equal(snapshot.world.tiles.every(tile=>Number.isInteger(tile.visualVariant)&&tile.visualVariant>=0&&tile.visualVariant<=3),true);
  assert.equal(snapshot.world.tiles.every(tile=>['none','cultivated','timber','masonry','domestic','civic'].includes(tile.groundDetail)),true);
  assert.equal(snapshot.world.tiles.every(tile=>!tile.activity||tile.activity.aggregate===true),true);
  for(const tile of snapshot.world.tiles){
    if(!tile.activity)continue;
    assert.ok(tile.activity.density>=1&&tile.activity.density<=3);
    assert.equal(/deliver|carry|path|assigned citizen/i.test(tile.activity.label),false,tile.activity.label);
  }
  assert.deepEqual(repeated,snapshot);
  assert.equal(checksum(runtime.state),before);
});

test('render snapshot exposes the broadcast hierarchy and causal danger without leaking exact rival strength',()=>{
  const runtime=runtimeWithEvents('hierarchy');
  runtime.state.crisis={id:'crisis-demo',kind:'border-raid',conflictGroup:'war',severity:4,phase:'active',remainingDays:5,warnedAtTick:runtime.state.tick-3,recoveryCost:{wood:12,stone:8}};
  runtime.state.diplomacy[0].strength=99;
  runtime.state.diplomacy[0].observedStrengthBand='stronger';
  const snapshot=createCivilizationRenderSnapshot(runtime.state,runtime.peekEvents());
  assert.equal(snapshot.identity.gameId,'ai-civilization');
  assert.ok(snapshot.goal.name.length>0);
  assert.ok(snapshot.goal.decree.length>0);
  assert.ok(snapshot.progress.tier.length>0);
  assert.ok(snapshot.progress.renown>=0);
  assert.ok(snapshot.realm.population.total>=0);
  assert.ok(snapshot.realm.stability>=0&&snapshot.realm.stability<=100);
  assert.ok(snapshot.realm.defence>=0&&snapshot.realm.defence<=100);
  assert.equal(snapshot.danger.level,'critical');
  assert.match(snapshot.danger.cause,/border raid/i);
  assert.equal(snapshot.characters.ruler.role,'Ruler');
  assert.ok(snapshot.characters.ruler.intent.length>0);
  assert.equal(snapshot.characters.rivals[0].strengthBand,'stronger');
  assert.equal(JSON.stringify(snapshot.characters.rivals[0]).includes('99'),false);
});

test('audio frame uses semantic priority, cooldown, dedupe, hysteresis and a 16-voice cap',()=>{
  const runtime=runtimeWithEvents('audio');
  runtime.state.crisis={id:'crisis-audio',kind:'plague',conflictGroup:'health',severity:5,phase:'active',remainingDays:6,warnedAtTick:runtime.state.tick-2,recoveryCost:{food:14,gold:6}};
  const snapshot=createCivilizationRenderSnapshot(runtime.state,runtime.peekEvents());
  const many=Array.from({length:40},(_,i)=>({seq:1000+i,tick:runtime.state.tick,type:i%2?'construction-complete':'crisis-active',data:{building:'farm',kind:'plague'}}));
  const first=deriveCivilizationAudioFrame(snapshot,many,initialCivilizationAudioMemory(),{muted:false,volume:0.8});
  assert.equal(first.musicState,'crisis');
  assert.ok(first.cues.length>0&&first.cues.length<=16);
  assert.equal(new Set(first.cues.map(c=>c.eventSequence)).size,first.cues.length);
  assert.equal(first.cues[0].priority>=first.cues.at(-1).priority,true);
  const second=deriveCivilizationAudioFrame(snapshot,many,first.memory,{muted:false,volume:0.8});
  assert.equal(second.cues.length,0);
  const calmer={...snapshot,danger:{...snapshot.danger,score:0.4,level:'watch'}};
  const held=deriveCivilizationAudioFrame(calmer,[],first.memory,{muted:false,volume:0.8});
  assert.equal(held.musicState,'crisis');
});

test('muted and unavailable audio preserve captions and never mutate authoritative state',()=>{
  const runtime=runtimeWithEvents('muted');
  const events=runtime.peekEvents();
  const before=checksum(runtime.state);
  const snapshot=createCivilizationRenderSnapshot(runtime.state,events);
  const frame=deriveCivilizationAudioFrame(snapshot,events,initialCivilizationAudioMemory(),{muted:true,volume:0});
  assert.equal(frame.cues.length,0);
  assert.ok(frame.captions.length>0);
  assert.equal(checksum(runtime.state),before);
});
