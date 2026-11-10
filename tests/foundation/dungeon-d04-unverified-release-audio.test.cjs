'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

const snapshot=(tick,kind,action,hp=30)=>({
 run:1,floor:1,tick,events:[],units:[
  {id:'source',kind,faction:'party',x:2,z:2,hp,maxHp:30,
   action,actionTick:tick,targetId:'victim'},
  {id:'victim',kind:'revenant',faction:'enemy',x:4,z:2,
   hp:30,maxHp:30,action:'idle',actionTick:10}
 ]
});

async function trial({kind='ranger',action='attack',draw=false,
 witness=false,provideWitness=true,damage=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 const sounds=[],visuals=[],queries=[];
 const v={
  emit(cue){visuals.push(cue);return draw},
  advance(){},reset(){},dispose(){},
  hasLiveCue(){return true},hasDrawableCue(){return true}
 };
 if(provideWitness)v.hasAuthenticatedReleasePose=cue=>{
  queries.push(cue.kind);return witness;
 };
 const d=createPhysicalCombatFeedback({requirePresentedFrame:true,
  resolveContact:()=>({targetId:'victim',distance:2}),
  visualAdapter:v,
  audioAdapter:{enable(){return true},emit(c){sounds.push(c);return true},
   disable(){},flush(){},cleanup(){},dispose(){}}
 });
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(snapshot(10,kind,'idle'));
 d.acceptSnapshot(snapshot(11,kind,damage?'hurt':action,damage?20:30));
 for(let i=0;i<6;i++)d.advance(.05,.05);
 const released=d.acknowledgePresentedFrame(1,.015);
 const results={sounds,visuals,queries,released,stats:d.stats()};
 d.dispose();
 return results;
}

test('a delayed ranger release with NO current firing pose cannot sound from an empty emitter',async()=>{
 const x=await trial({kind:'ranger',action:'attack',draw:false,witness:false});
 assert.deepEqual(x.visuals.map(c=>c.kind),['ranged-release']);
 assert.equal(x.released,0);
 assert.equal(x.sounds.length,0);
 assert.deepEqual(x.queries,['ranged-release']);
 assert.equal(x.stats.recentDeliveryReceipts.at(-1)?.decision,'unverified-release-pose');
});
test('an authored caster with no authenticated hand cannot create a ghost cast sound',async()=>{
 const x=await trial({kind:'mystic',action:'cast',draw:false,witness:false});
 assert.deepEqual(x.visuals.map(c=>c.kind),['spell-release']);
 assert.equal(x.sounds.length,0);
 assert.deepEqual(x.queries,['spell-release']);
 assert.equal(x.stats.recentDeliveryReceipts.at(-1)?.decision,'unverified-release-pose');
});
test('an authentic release may sound without an arrow sprite when map clearance hides it',async()=>{
 const x=await trial({draw:false,witness:true});
 assert.equal(x.released,1);
 assert.equal(x.sounds[0].kind,'ranged-release');
 assert.equal(x.sounds[0].proof,'authority-action');
 assert.equal(x.stats.recentDeliveryReceipts.at(-1)?.decision,'delivered');
});
test('missing source-pose adapter fails closed ONLY for undrawn launch sounds',async()=>{
 const x=await trial({draw:false,provideWitness:false});
 assert.equal(x.sounds.length,0);
 assert.equal(x.stats.recentDeliveryReceipts.at(-1)?.decision,'unverified-release-pose');
 const y=await trial({draw:true,provideWitness:false});
 assert.equal(y.sounds.length,1,'drawn release already passed the VFX admission contract');
 assert.deepEqual(y.queries,[]);
});
test('actual HP loss remains sound-capable when its optional VFX fails',async()=>{
 const x=await trial({damage:true,draw:false,witness:false});
 assert.equal(x.released,1);
 assert.deepEqual(x.sounds.map(c=>c.kind),['damage']);
 assert.equal(x.sounds[0].actorId,null,'do not invent who hit the victim');
 assert.equal(x.stats.recentDeliveryReceipts.at(-1)?.decision,'delivered');
 assert.deepEqual(x.queries,[]);
});
