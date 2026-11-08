'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const root=path.resolve(__dirname,'../..');
const load=n=>import(pathToFileURL(path.join(root,'public/ai-dungeon',n)).href);
const observation=(changes={})=>({sceneMatches:true,observedFrameVerified:true,
 elapsedSeconds:.2,submissionSeconds:.025,maxStalenessSeconds:.4,
 visualAccepted:true,visualAlive:true,...changes});
test('short 230ms hit visual expires during still-eligible 300ms submitted frame',async()=>{
 const {classifySubmittedCombatAudio:gate}=await load('physical-feedback-frame-gate.js');
 assert.equal(gate(observation({elapsedSeconds:.30,visualAlive:false})),'expired-visual');
 assert.equal(gate(observation({elapsedSeconds:.11})),'deliver');
 assert.equal(gate(observation({visualAccepted:false,visualAlive:false})),'deliver');
 assert.equal(gate(observation({elapsedSeconds:.39,submissionSeconds:.025})),'stale-frame');
 assert.equal(gate(observation({submissionSeconds:NaN})),'unverified-frame');
 assert.equal(gate(observation({observedFrameVerified:false})),'unverified-frame');
 assert.equal(gate(observation({sceneMatches:false})),'scene-changed');
 assert.equal(gate(observation({visualAlive:null})),'deliver');
});
const snapshot=(tick,hp)=>({tick,run:1,floor:1,events:[],units:[{
 id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
 hp,maxHp:30,action:hp<30?'hurt':'idle',actionTick:tick
}]});
function fixture({expired=false,draw=true}={}){
 const alive=new Set(),audio=[];
 return {audio,visuals:{emit:c=>{if(draw)alive.add(c.id);return draw},
  advance(_dt,raw){if(expired&&raw>.23)alive.clear()},
  hasLiveCue:id=>alive.has(id),reset(){alive.clear()},dispose(){alive.clear()}},
  sounds:{enable(){return true},emit(c){audio.push(c);return true},
   disable(){},flush(){},cleanup(){},dispose(){}}};
}
async function run(config,interval){
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const f=fixture(config),d=createPhysicalCombatFeedback({
  visualAdapter:f.visuals,audioAdapter:f.sounds,requirePresentedFrame:true});
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(snapshot(10,30));d.acceptSnapshot(snapshot(11,20));
 assert.ok(d.stats().awaitingPresentation>0,'actual HP loss makes contact');
 d.advance(Math.min(interval,.05),interval);
 return {f,d};
}
test('expired retained impact never plays late audio but leaves a reasoned receipt',async()=>{
 const {f,d}=await run({expired:true},.30);
 assert.equal(d.acknowledgePresentedFrame(1,.015),0);
 assert.equal(f.audio.length,0);
 assert.ok(d.stats().expiredVisualAudioDropped>0);
 assert.equal(d.stats().recentDeliveryReceipts.at(-1).decision,'expired-visual');
 d.dispose();
});
test('fresh retained impact plays once; duplicate submitted frame does not replay',async()=>{
 const {f,d}=await run({},.016);
 assert.equal(d.acknowledgePresentedFrame(2,.009),1);
 assert.equal(d.acknowledgePresentedFrame(2,.009),0);
 assert.equal(f.audio.length,1);
 d.dispose();
});
test('real HP damage can sound even if optional presentation art was unavailable',async()=>{
 const {f,d}=await run({draw:false},.016);
 assert.equal(d.acknowledgePresentedFrame(3,.009),1);
 assert.equal(f.audio.length,1);
 d.dispose();
});
test('new D04 frame gate module has a stream route',()=>{
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(server.includes("['/dungeon/physical-feedback-frame-gate.js','physical-feedback-frame-gate.js']"));
});


test('newly due swing survives a 260ms browser frame without replaying a stale VFX lifetime',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const positions=new Map(),ordered=[],sounds=[];
 const visualAdapter={
  emit(c){ordered.push('emit');positions.set(c.id,0);return true},
  advance(_dt,raw){ordered.push('age');for(const [id,age] of positions){
   if(age+raw>=.23)positions.delete(id);else positions.set(id,age+raw);
  }},
  hasLiveCue:id=>positions.has(id),reset(){positions.clear()},dispose(){}
 };
 const audioAdapter={enable(){return true},emit(c){sounds.push(c.id);return true},
  disable(){},flush(){},cleanup(){},dispose(){}};
 const director=createPhysicalCombatFeedback({visualAdapter,audioAdapter,requirePresentedFrame:true});
 const s=(tick,action)=>({run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
  hp:30,maxHp:30,action,actionTick:tick
 }]});
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(s(10,'idle'));director.acceptSnapshot(s(11,'attack'));
 director.advance(.05,.05);director.advance(.05,.05);
 assert.equal(positions.size,0,'not-yet-due swing must not fabricate early art');
 director.advance(.05,.26);
 assert.deepEqual(ordered.slice(-2),['age','emit'],
  'previous frame art ages before a newly due swing is first staged');
 assert.equal(positions.size,1,'freshly admitted art survives its first GPU submission');
 assert.equal(director.acknowledgePresentedFrame('swing-first-submit',.012),1);
 assert.equal(sounds.length,1,'genuine swing whoosh releases once after render');
 assert.equal(director.acknowledgePresentedFrame('swing-first-submit',.012),0);
 director.advance(.05,.26);
 assert.equal(positions.size,0,'older, previously submitted art still expires on stalls');
 director.dispose();
});
