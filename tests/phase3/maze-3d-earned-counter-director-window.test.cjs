'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'public/ai-maze-escape/public-counter-moment.mjs');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

const publicPair=(tick,parried=false)=>({
  lifecycle:'running',runToken:'same-run',tick,result:null,
  visibleCells:[90,91,74],
  threats:[{id:'threat-1',cell:parried?74:91,lanternParried:parried}]
});

test('only an original consecutive same-run public parry can start the physical director',async()=>{
  const {publicGuardianCounterMoment:moment}=await import(pathToFileURL(modulePath).href);
  const before=publicPair(7),after=publicPair(8,true);
  assert.deepEqual(moment(before,after),{
    runToken:'same-run',id:'threat-1',fromCell:91,cell:74,tick:8
  });
  for(const altered of [
    {...after,tick:9},
    {...after,runToken:'another-run'},
    {...after,visibleCells:[90,91]},
    {...after,threats:[{id:'threat-2',cell:74,lanternParried:true}]},
    {...after,result:{reason:'capture'}},
    {...after,lifecycle:'intermission'}
  ])assert.equal(moment(before,altered),null,
    'a skipped, hidden, replaced or ended threat cannot start a hit');
  assert.equal(moment(null,after),null,'a first-seen already-parried enemy never earns recoil');
});

test('counter stage ends on real clock expiration or a subsequent guardian move',async()=>{
  const {publicGuardianCounterStageActive:active,
    PUBLIC_GUARDIAN_COUNTER_SECONDS:duration}=await import(pathToFileURL(modulePath).href);
  const since=10,from=74,parried=true;
  assert.equal(duration,2.0,'keep the existing strict shared HUD/actor clock');
  assert.equal(active(since,from,from,parried,since),true);
  assert.equal(active(since,from,from,parried,since+duration-.01),true);
  assert.equal(active(since,from,from,parried,since+duration),false);
  assert.equal(active(since,from,from,parried,since+duration+1),false);
  assert.equal(active(since,from,from,parried,since-.01),false);
  assert.equal(active(since,from,91,parried,since+.2),false,
    'moving to a later patrol square ends the earned presentation');
  for(const stale of [null,NaN,Infinity,-Infinity,undefined])
    assert.equal(active(stale,from,from,parried,since+.5),false,
      'no first-seen, unclocked or malformed parry earns a stage');
  assert.equal(active(since,-1,-1,parried,since+.5),false);
  assert.equal(active(since,from,from,false,since+.5),false);
});

test('real renderer releases hero, guardian rig, camera and scenery together',()=>{
  assert.ok(source.includes('publicGuardianCounterMoment(previousWardenSnapshot,snapshot)'));
  assert.ok(source.includes('witnessedCounterMoment?.id===threat.id'));
  assert.ok(source.includes('entry.counterCell=threat.cell'));
  assert.ok(source.includes('const activeEarnedCounter=!result'));
  assert.ok(source.includes('publicGuardianCounterStageActive('));
  assert.ok(source.includes('if (activeEarnedCounter && separation < earnedCounterDistance)'));
  assert.ok(source.includes('const counterPhase=lanternParried && entry.counterSince!==null && activeEarnedCounter'));
  assert.ok(source.includes('const actorAttention=activeEarnedCounter'));
  assert.ok(source.includes('const earnedDuelContinuity ='));
  assert.ok(source.includes('const earnedGuardianFrame=!!earnedCounterModel'));
  assert.ok(source.includes('guardianCounterPhase:witnessedCounter ? earnedCounterActor.counterPhase : undefined'));
  assert.ok(!source.includes('const actorAttention=lanternParried?Math.max(.75,attentionStrength)'));
});
