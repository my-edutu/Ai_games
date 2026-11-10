'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

const unit=(kind,action,actionTick,hp=30)=>({
 id:'source',kind,faction:kind==='warden'?'enemy':'party',
 x:2,z:2,hp,maxHp:30,action,actionTick,
 ...(kind==='warden'?{recoveryUntilTick:12}:{}),
 ...(kind==='ranger'||kind==='mystic'?{targetId:'victim'}:{})
});
function snapshot(tick,scenario,after=false){
 const kind=scenario==='ranged'?'ranger':scenario==='spell'?'mystic':
  scenario==='warden'?'warden':'vanguard';
 const action=after?(scenario==='ranged'?'attack':
  scenario==='guard'?'guard':scenario==='damage'?'hurt':'cast'):'idle';
 const events=after&&scenario==='warden'?
  [{kind:'opening',tick:11,text:'untrusted'}]:[];
 const source=unit(kind,action,after?11:10,scenario==='damage'&&after?20:30);
 return {run:1,floor:1,tick,phase:'exploring',events,
  units:[source,{id:'victim',kind:'revenant',faction:'enemy',x:4,z:2,
    hp:30,maxHp:30,action:'idle',actionTick:10}],
  guardianWard:false,map:[],
  ...(scenario==='warden'&&after?{bossRecovery:{remaining:2}}:{})};
}
async function trial(scenario,{revoke=false,draw=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 let authenticated=true;
 const sounded=[],queries=[];
 const visuals={
  emit:()=>draw,advance(){},reset(){},dispose(){},
  hasLiveCue:()=>draw,hasDrawableCue:()=>draw,
  hasAuthenticatedReleasePose(cue){queries.push('release:'+cue.kind);return authenticated},
  hasAuthenticatedBodyPose(cue){queries.push('body:'+cue.kind);return authenticated}
 };
 const f=createPhysicalCombatFeedback({requirePresentedFrame:true,
  visualAdapter:visuals,resolveContact:()=>({targetId:'victim',distance:2}),
  audioAdapter:{enable:()=>true,emit(cue){sounded.push(cue);return true},
   disable(){},flush(){},cleanup(){},dispose(){}}
 });
 assert.equal(f.enableAudioFromGesture(),true);
 f.acceptSnapshot(snapshot(10,scenario));
 f.acceptSnapshot(snapshot(11,scenario,true));
 // Launch cues have authoritative non-zero delays; stage all before receipt.
 for(let i=0;i<(scenario==='ranged'||scenario==='spell'?7:1);i++)
  f.advance(.05,.05);
 if(revoke)authenticated=false; // Actor or rig disappears AFTER sound staging.
 const delivered=f.acknowledgePresentedFrame(1,.016);
 const result={delivered,sounded:sounded.map(x=>x.kind),queries,
  receipts:f.stats().recentDeliveryReceipts};
 f.dispose();return result;
}

for(const scenario of ['ranged','spell']){
 test('frame receipt revalidates undrawn '+scenario+' origin after source disappears',async()=>{
  const x=await trial(scenario,{revoke:true});
  assert.deepEqual(x.sounded,[]);
  assert.equal(x.delivered,0);
  assert.equal(x.receipts.at(-1)?.decision,'revoked-release-pose');
  assert.deepEqual(x.queries,['release:'+(scenario==='ranged'?'ranged-release':'spell-release'),
   'release:'+(scenario==='ranged'?'ranged-release':'spell-release')]);
 });
 test('still-authenticated undrawn '+scenario+' may sound after genuine submission',async()=>{
  const x=await trial(scenario);
  assert.equal(x.delivered,1);
  assert.deepEqual(x.sounded,[scenario==='ranged'?'ranged-release':'spell-release']);
  assert.equal(x.receipts.at(-1)?.decision,'delivered');
  assert.equal(x.queries.length,2);
 });
}
test('frame receipt revalidates both Warden release and recovery independently',async()=>{
 const x=await trial('warden',{revoke:true});
 assert.deepEqual(x.sounded,[]);
 assert.equal(x.delivered,0);
 assert.deepEqual(x.receipts.map(r=>r.decision),
  ['revoked-body-pose','revoked-body-pose']);
 assert.deepEqual(x.queries,['body:warden-release','body:opening',
  'body:warden-release','body:opening']);
});
test('undrawn guarded gesture is revoked before frame-receipt sound',async()=>{
 const x=await trial('guard',{revoke:true});
 assert.deepEqual(x.sounded,[]);
 assert.equal(x.receipts.at(-1)?.decision,'revoked-body-pose');
});
test('verified HP loss stays audible with no sourced attacker',async()=>{
 const x=await trial('damage',{revoke:true});
 assert.deepEqual(x.sounded,['damage']);
 assert.equal(x.delivered,1);
 assert.deepEqual(x.queries,[]);
});
