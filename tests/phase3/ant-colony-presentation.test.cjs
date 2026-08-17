'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const ant=require('../../dist/games/ai-ant-colony/src/index.js');

const config={width:40,height:26,targetPopulation:60,initialWorkers:16,broodInterval:18,eggHatchTicks:10,larvaTicks:10,pupaTicks:10,predatorCap:2,predatorSpawnInterval:60,noProgressTicks:1000};
function runtime(seed='phase3'){return ant.AntColonyRuntime.create(config,seed)}

test('render snapshots are deeply immutable, sanitized and authority-preserving',()=>{
  const r=runtime('privacy');for(let i=0;i<20;i++)r.step();
  const before=ant.stateChecksum(r.state),events=r.drainEvents();
  const snapshot=ant.createAntRenderSnapshot(r.state,events);
  assert.equal(Object.isFrozen(snapshot),true);
  assert.equal(Object.isFrozen(snapshot.ants),true);
  assert.equal(Object.isFrozen(snapshot.world.tiles),true);
  const encoded=JSON.stringify(snapshot);
  for(const forbidden of ['"seed"','"runId"','deterministicVersion','appliedIds','cooldowns','scheduledTick','lastCell','bias','nextAntId'])assert.equal(encoded.includes(forbidden),false,forbidden);
  assert.equal(snapshot.audience.pendingEffects,0);
  assert.ok(Buffer.byteLength(encoded)<2_500_000);
  assert.throws(()=>{snapshot.colony.foodStore=999999},TypeError);
  assert.equal(ant.stateChecksum(r.state),before);
});

test('snapshot entity identity, revisions and public intent remain stable and bounded',()=>{
  const r=runtime('identity');for(let i=0;i<12;i++)r.step();
  const a=ant.createAntRenderSnapshot(r.state,r.drainEvents());
  const b=ant.createAntRenderSnapshot(r.state,[]);
  assert.equal(a.revision,b.revision);
  assert.deepEqual(a.ants.map(x=>x.id),b.ants.map(x=>x.id));
  assert.ok(a.ants.every(x=>x.intent.length<=96));
  assert.ok(a.ants.every(x=>x.confidence>=0&&x.confidence<=100));
  assert.equal(a.goal.targetPopulation,60);
  assert.ok(a.goal.progress>=0&&a.goal.progress<=1);
  assert.ok(['colony','crisis'].includes(a.scene));
});

test('result, intermission and quarantine use distinct truthful public scenes and captions',()=>{
  const r=runtime('scenes');r.state.queen.health=0;r.step();
  const result=ant.createAntRenderSnapshot(r.state,r.drainEvents());
  assert.equal(result.scene,'result');assert.match(result.headline,/colony|extinction|ascension/i);assert.ok(result.captions.length>0);
  r.step();const intermission=ant.createAntRenderSnapshot(r.state,r.drainEvents());assert.equal(intermission.scene,'intermission');
  const quarantined=structuredClone(r.state);quarantined.lifecycle='quarantined';delete quarantined.result;
  const recovery=ant.createAntRenderSnapshot(quarantined,[{seq:99,tick:quarantined.tick,type:'quarantined',data:{reason:'checksum-divergence',secret:'do-not-show'}}]);
  assert.equal(recovery.scene,'recovery');assert.equal(JSON.stringify(recovery).includes('do-not-show'),false);
});

test('responsive layouts preserve gameplay, primary HUD and caption safe zones',()=>{
  const desktop=ant.computeAntLayout(1920,1080,false),phone=ant.computeAntLayout(640,360,false),clean=ant.computeAntLayout(1280,720,true);
  assert.equal(desktop.breakpoint,'desktop');assert.ok(desktop.world.width>desktop.hud.width);assert.ok(desktop.caption.height>=48);
  assert.equal(phone.breakpoint,'phone-landscape');assert.ok(phone.world.width>=400);assert.ok(phone.primaryFontPx>=16);assert.ok(phone.caption.y+phone.caption.height<=360);
  assert.equal(clean.cleanFeed,true);assert.equal(clean.hud.width,0);assert.equal(clean.narrative.width,0);assert.equal(clean.world.width,1280);
  assert.throws(()=>ant.computeAntLayout(0,720,false),/width/);
});

test('camera and audio derive bounded semantic feedback without mutating authority',()=>{
  const r=runtime('feedback');for(let i=0;i<10;i++)r.step();const before=ant.stateChecksum(r.state),base=ant.createAntRenderSnapshot(r.state,r.drainEvents());
  const camera=ant.deriveAntCamera(base,null),audio=ant.deriveAntAudioCues(base,null);
  assert.ok(['overview','resource-run','queen-defense','result','recovery'].includes(camera.mode));assert.ok(camera.zoom>=0.8&&camera.zoom<=2);assert.ok(camera.impulse>=0&&camera.impulse<=1);
  assert.ok(audio.length<=8);assert.ok(audio.every(cue=>cue.priority>=1&&cue.priority<=5&&cue.caption.length>0));
  const danger=structuredClone(base);danger.colony.threat=95;danger.predators=[{id:1,kind:'spider',x:danger.world.entrance%danger.world.width,y:danger.world.surfaceRow,health:40,intent:'Entering the nest'}];Object.freeze(danger);
  const crisisCamera=ant.deriveAntCamera(danger,base);assert.equal(crisisCamera.mode,'queen-defense');assert.ok(crisisCamera.impulse>0);
  assert.equal(ant.stateChecksum(r.state),before);
});

test('presentation controller rejects stale/divergent snapshots and restores the latest accepted truth',()=>{
  const r=runtime('controller'),controller=new ant.AntPresentationController();
  const first=ant.createAntRenderSnapshot(r.state,r.drainEvents());assert.equal(controller.accept(first).status,'accepted');
  r.step();const second=ant.createAntRenderSnapshot(r.state,r.drainEvents());assert.equal(controller.accept(second).status,'accepted');
  assert.equal(controller.accept(first).status,'rejected-stale');
  const divergent=structuredClone(second);divergent.revision=second.revision;divergent.colony.foodStore++;
  assert.equal(controller.accept(divergent).status,'rejected-divergent');
  assert.deepEqual(controller.recover(),second);
  r.restart('controller-new-run');const next=ant.createAntRenderSnapshot(r.state,r.drainEvents());assert.equal(controller.accept(next).status,'accepted');
});

test('output health distinguishes stale, frozen, black, silent and wrong-scene faults',()=>{
  const healthy={nowMs:10_000,lastSnapshotMs:9_900,lastProgressMs:9_900,frameLuma:0.35,pixelHash:'a',previousPixelHash:'b',audioExpected:true,audioLevel:0.2,expectedScene:'colony',actualScene:'colony'};
  assert.equal(ant.classifyAntOutputHealth(healthy).status,'healthy');
  assert.equal(ant.classifyAntOutputHealth({...healthy,lastSnapshotMs:5_000}).status,'stale');
  assert.equal(ant.classifyAntOutputHealth({...healthy,lastProgressMs:4_000,pixelHash:'x',previousPixelHash:'x'}).status,'frozen');
  assert.equal(ant.classifyAntOutputHealth({...healthy,frameLuma:0}).status,'black');
  assert.equal(ant.classifyAntOutputHealth({...healthy,audioLevel:0}).status,'silent');
  assert.equal(ant.classifyAntOutputHealth({...healthy,actualScene:'result'}).status,'wrong-scene');
});
