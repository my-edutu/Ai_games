'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {sourceRecordFromSnapshot,createTowerPublicStateWitness}=
  require('../../scripts/tower-public-state-witness.cjs');
const {indexTowerCaptureEvents}=require('../../scripts/tower-event-alignment.cjs');
const {sourceStoryCoverage}=require('../../scripts/tower-event-pairing.cjs');
const state=(tick,lifecycle,runToken='authentic-baseline')=>({
  tick,floor:0,runToken,lifecycle,publicChecksum:'real-'+tick,
  player:{x:10,y:20,halfWidth:3,halfHeight:4,health:3},
  platforms:[{id:'f0:cap',x:0,y:0,width:100,height:10}],
  enemies:[],hazards:[],intent:{targetPlatformId:'f0:cap'},
  result:['result','intermission'].includes(lifecycle)
    ?{kind:'game',reason:'authentic source outcome'}:null,
});
test('independent original-host sampling preserves a real one-tick result and same-tick intermission',async()=>{
  let current=state(899,'running'),time=1000,callback,unscheduled=false;
  const witness=createTowerPublicStateWitness(async()=>current,{
    now:()=>time+=50,schedule:fn=>(callback=fn,1),
    unschedule:()=>{unscheduled=true;},
  });
  await witness.start();
  // Even if a Chromium rAF callback never fires during this interval, the
  // original HTTP public state is witnessed rather than a fabricated result.
  current=state(900,'result');await callback();await witness.poll();
  current=state(900,'intermission');await callback();await witness.poll();
  current=state(0,'running','authentic-restart');await callback();
  const report=await witness.finish();
  const ticks=witness.snapshot();
  assert.deepEqual(ticks.map(x=>x.lifecycle),['running','result','intermission','running']);
  const index=indexTowerCaptureEvents(ticks,[],{
    sourceSha:'1731b380851162741761c5569e2bc152a0869ca9',
    scenario:'outcome',publicWitnessMode:true});
  const story=sourceStoryCoverage({index},'outcome','baseline');
  assert.equal(story.sameEpisodeSourceSequenceObserved,true);
  assert.equal(story.observedEpisode,0);
  assert.equal(report.overflow,0);assert.equal(unscheduled,true);
  assert.equal(report.videoQualityVerdict,'NOT EVALUATED');
});
test('a missed result remains missing evidence even when intermission is genuinely observed',async()=>{
  let current=state(899,'running'),time=1000;
  const witness=createTowerPublicStateWitness(async()=>current,{
    now:()=>time+=50,schedule:()=>1,unschedule:()=>{}});
  await witness.start();
  current=state(900,'intermission');await witness.poll();
  current=state(0,'running','authentic-restart');
  await witness.finish();
  const index=indexTowerCaptureEvents(witness.snapshot(),[],{
    scenario:'outcome',publicWitnessMode:true});
  assert.equal(sourceStoryCoverage({index},'outcome','baseline')
    .sameEpisodeSourceSequenceObserved,false,
    'never infer result from later intermission, DOM, or restart');
});
test('the original host reader rejects missing source, bounds records and never overlaps requests',async()=>{
  assert.equal(sourceRecordFromSnapshot({tick:1,floor:0,lifecycle:'running'},100),null);
  let current=state(1,'running'),release,requests=0,callback,clock=1000;
  const witness=createTowerPublicStateWitness(async()=>{
    requests++;if(requests===2)await new Promise(resolve=>release=resolve);
    return current;},{
    maxRecords:100,now:()=>clock+=25,
    schedule:fn=>(callback=fn,1),unschedule:()=>{}});
  await witness.start();
  const waiting=callback();await Promise.resolve();
  await callback();assert.equal(requests,2,'avoid duplicate live source requests');
  release();await waiting;
  for(let i=2;i<120;i++){current=state(i,'running');await witness.poll();}
  const report=await witness.finish();
  assert.equal(report.acceptedSamples,100);
  assert.ok(report.overflow>0,'bounded read-only collector drops oldest evidence visibly');
  assert.equal(report.videoQualityVerdict,'NOT EVALUATED');
  assert.throws(()=>createTowerPublicStateWitness(()=>null,{cadenceMs:1}),RangeError);
});
test('a genuine server transport failure does not invent terminal ticks',async()=>{
  let current=state(899,'running'),fail=false;
  const witness=createTowerPublicStateWitness(async()=>{
    if(fail)throw new Error('original-http-timeout');
    return current;
  },{schedule:()=>1,unschedule:()=>{}});
  await witness.start();fail=true;await witness.poll();
  fail=false;current=state(900,'intermission');await witness.finish();
  assert.equal(witness.status().failures,1);
  assert.equal(witness.status().lastError,'original-http-timeout');
  const index=indexTowerCaptureEvents(witness.snapshot(),[],{scenario:'outcome'});
  assert.equal(sourceStoryCoverage({index},'outcome','baseline')
    .sameEpisodeSourceSequenceObserved,false);
});
