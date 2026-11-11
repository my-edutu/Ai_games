'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'public/ai-dungeon/native-duel-continuity.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const attack={kind:'vanguard',action:'attack',actionTick:54,hp:90};
const threat={targetId:'warden-1',distance:1};

test('a real source-body attack crosses the authority boundary into recovery, never a second hit',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 const first=plan(null,attack,.215,.016,threat);
 assert.equal(first.mode,'attack');assert.equal(first.contactAllowed,true);
 const idle={...attack,action:'idle',actionTick:55};
 const follow=plan(first.memory,idle,0,.016);
 assert.equal(follow.mode,'recovery');assert.equal(follow.contactAllowed,false);
 assert.ok(follow.age>=.355&&follow.age<.62);assert.equal(follow.targetId,'warden-1');
 assert.ok(plan(follow.memory,idle,0,.05).age>follow.age);
});

test('severe 350ms visual stalls show no more than ONE honest recovery stance',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 const first=plan(null,attack,.34,.34,threat),idle={...attack,action:'idle',actionTick:55};
 const next=plan(first.memory,idle,0,.35);
 assert.equal(next.mode,'recovery');assert.equal(next.age,.49);
 assert.equal(plan(next.memory,idle,0,.35).mode,'rest');
});

test('new action, invalid target, death, reduced-motion, teleport and detached rig abort the tail',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 assert.equal(plan(null,attack,.2,.016,{...threat,distance:2}).mode,'rest');
 const first=plan(null,attack,.2,.016,threat);
 for(const action of ['move','attack','cast','guard','hurt'])
  assert.equal(plan(first.memory,{...attack,action,actionTick:55},0,.016).mode,'rest');
 for(const extra of [{reducedMotion:true},{teleport:true},{attached:false}])
  assert.equal(plan(first.memory,{...attack,action:'idle',actionTick:55},0,.016,extra).mode,'rest');
 for(const invalid of [{...attack,hp:0},{...attack,kind:'ranger'},
  {...attack,actionTick:53}])
  assert.equal(plan(first.memory,{...invalid,action:'idle'},0,.016).mode,'rest');
});

test('three authentic imported melee roles have deterministic bounded continuity; renderer hooks clear state',async()=>{
 const {planNativeDuelContinuity:plan}=await load();
 for(const kind of ['vanguard','revenant','warden']){
  const state={...attack,kind},initial=plan(null,state,.1,.016,threat);
  assert.equal(initial.mode,'attack');assert.ok(Object.isFrozen(initial.memory));
  let next=initial;
  for(let i=0;i<12;i++){
   next=plan(next.memory,{...state,action:'idle',actionTick:55},0,.016);
   assert.equal(next.mode,'recovery');assert.equal(next.contactAllowed,false);
  }
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 for(const name of ['planNativeDuelContinuity','actor.nativeDuelMemory=continuation.memory',
  'continuation.mode===\'recovery\'','actor.nativeDuelMemory=null'])
  assert.ok(model.includes(name),'missing integrated physical source-actor continuity: '+name);
 assert.ok(server.includes("['/dungeon/native-duel-continuity.js','native-duel-continuity.js']"));
 assert.doesNotMatch(src,/Math\.random|Date\.now|performance\.now|DungeonRuntime|fetch\(/);
});
