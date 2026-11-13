'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'public/ai-dungeon/soundstage-plan.js');
async function plan(){
 const source=fs.readFileSync(file,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const unit=(id,action='idle',actionTick=0,kind='vanguard',faction='party')=>({id,action,actionTick,kind,faction,hp:12,maxHp:12,x:2,z:2});
const snap=(tick,changes={})=>({tick,run:1,floor:1,phase:'exploring',bossPhase:'SENTINEL',map:Array.from({length:5},()=> '.....'),units:[unit('hero')],events:[],...changes});
test('original sound stage uses one finite hierarchy for exploration, danger, guardian and rest',async()=>{
 const {planSoundMood}=await plan();
 assert.equal(planSoundMood(snap(1)).mood,'exploration');
 assert.equal(planSoundMood(snap(1,{units:[unit('hero'),{...unit('boss','idle',0,'warden','enemy'),x:3}]})).mood,'guardian');
 assert.equal(planSoundMood(snap(1,{phase:'intermission'})).mood,'intermission');
 assert.equal(planSoundMood(snap(1,{units:[{...unit('hero'),hp:0}],phase:'defeat'})).mood,'defeat');
 assert.equal(planSoundMood(snap(1,{units:[{...unit('hero'),hp:2}]})).mood,'danger');
 for(const floor of [1,2,3,4,5,100]){const mood=planSoundMood(snap(1,{floor}));
  assert.ok(mood.droneHz>=40&&mood.droneHz<=120);assert.ok(mood.upperHz>mood.droneHz&&mood.upperHz<=220);}
 const themes=[1,2,3,4].map(floor=>planSoundMood(snap(1,{floor})).droneHz);
 assert.equal(new Set(themes).size,4,'all four dungeon biomes must sound different');
});
test('actual public combat actions generate priority-gated cues, never guessed contact',async()=>{
 const {planSoundCues}=await plan();
 const before=snap(10,{units:[unit('hero','idle',9),unit('enemy','idle',9,'revenant','enemy')]});
 const after=snap(11,{units:[unit('hero','attack',11),{...unit('enemy','hurt',11,'revenant','enemy'),hp:8}]});
 const valid=u=>u.id==='hero'?{targetId:'enemy',distance:1}:null;
 const sound=planSoundCues(before,after,valid);
 assert.deepEqual(sound.filter(c=>c.kind==='weapon').map(c=>c.actorId),['hero']);
 assert.deepEqual(sound.filter(c=>c.kind==='impact').map(c=>c.actorId),['enemy']);
 assert.equal(planSoundCues(before,snap(11,{units:[unit('hero','attack',11),unit('enemy','hurt',11,'revenant','enemy')]}),valid).some(c=>c.kind==='impact'),false,'a hurt pose without real HP loss cannot play fake impact');
 assert.ok(sound.every(c=>Number.isSafeInteger(c.tick)&&Number.isSafeInteger(c.priority)));
 assert.equal(planSoundCues(before,after,()=>null).some(c=>c.kind==='weapon'),false,'blocked lane cannot synthesize contact');
 assert.deepEqual(planSoundCues(after,after,valid),[],'same authority tick never repeats audio');
 assert.deepEqual(planSoundCues(null,after,valid),[],'first page load never replays old actions');
 assert.deepEqual(before.units[0],unit('hero','idle',9),'plans cannot mutate authoritative snapshots');
});
test('only real HP loss scores impacts even during travel, fatal collapse or unchanged action',async()=>{
 const {planSoundCues}=await plan();
 const before=snap(11,{units:[unit('hero','idle',11),unit('enemy','idle',11,'revenant','enemy')]});
 const traveling=snap(12,{units:[unit('hero','idle',11),{...unit('enemy','move',11,'revenant','enemy'),hp:6}]});
 const cues=planSoundCues(before,traveling,()=>null);
 assert.deepEqual(cues.filter(c=>c.kind==='impact').map(c=>c.actorId),['enemy']);
 assert.equal(cues.find(c=>c.kind==='impact').tick,12);
 const fatal=snap(12,{units:[unit('hero','idle',11),{...unit('enemy','idle',11,'revenant','enemy'),hp:0}]});
 assert.deepEqual(planSoundCues(before,fatal,()=>null).filter(c=>c.kind==='impact').map(c=>c.actorId),['enemy']);
 const falseHurt=snap(12,{units:[unit('hero','idle',11),unit('enemy','hurt',12,'revenant','enemy')]});
 assert.equal(planSoundCues(before,falseHurt,()=>null).some(c=>c.kind==='impact'),false);
 assert.equal(planSoundCues(before,{...traveling,tick:18},()=>null).some(c=>c.kind==='impact'),false,'stale comparison has no causally supported contact');
 assert.equal(planSoundCues(before,{...traveling,floor:2},()=>null).some(c=>c.kind==='impact'),false,'floor transitions cannot import old damage');
 assert.deepEqual(planSoundCues(traveling,traveling,()=>null),[]);
 assert.equal(before.units[1].hp,12,'source snapshots remain untouched');
});
test('events, transitions and missed polls produce bounded, semantic, text-independent audio',async()=>{
 const {planSoundCues,MAX_SOUND_CUES}=await plan();
 const before=snap(19);
 const after=snap(22,{events:[
  {kind:'telegraph',tick:20,text:'do not speak visitor input'},
  {kind:'healing',tick:21,text:'whatever'},
  {kind:'unseal',tick:21,text:'guardian seal was truly broken'},
  {kind:'loot',tick:22,text:'treasure'},
  {kind:'floor',tick:22,text:'new depth'},
  {kind:'untrusted',tick:22,text:'not a sound'}
 ]});
 const cues=planSoundCues(before,after,()=>null);
 assert.ok(cues.some(c=>c.kind==='warning'));
 assert.ok(cues.some(c=>c.kind==='heal'));
 assert.ok(cues.some(c=>c.kind==='unseal'),'the real shield-break milestone must be audible after consent');
 assert.ok(cues.some(c=>c.kind==='reward'));
 assert.ok(cues.every(c=>!('text' in c)));
 assert.equal(cues.some(c=>c.kind==='transition'),false,'floor only advances when authoritative floor changes');
 const next=snap(23,{floor:2});
 assert.equal(planSoundCues(after,next,()=>null).filter(c=>c.kind==='transition').length,1);
 const storm=snap(24,{units:Array.from({length:80},(_,i)=>unit('hero'+i,'guard',24)),events:Array.from({length:150},(_,i)=>({kind:'loot',tick:24,text:'x'+i}))});
 const restrained=planSoundCues(before,storm,()=>null);
 assert.ok(restrained.length<=MAX_SOUND_CUES);
 assert.equal(new Set(restrained.map(c=>c.kind)).has('reward'),true);
});
test('sound plan rejects invalid, out-of-order, reduced-trust events and never reads wall clock or RNG',async()=>{
 const {planSoundCues}=await plan();
 assert.deepEqual(planSoundCues(snap(10),snap(8)),[],'old state must not re-trigger sounds');
 assert.deepEqual(planSoundCues(snap(10),null),[]);
 assert.deepEqual(planSoundCues(null,snap(10)),[]);
 const a=planSoundCues(snap(9),snap(11,{events:[{kind:'defeat',tick:11},{kind:'telegraph',tick:11}]}));
 assert.deepEqual(a,planSoundCues(snap(9),snap(11,{events:[{kind:'defeat',tick:11},{kind:'telegraph',tick:11}]})));
 assert.equal(a[0].kind,'defeat','terminal cue gets priority');
 const source=fs.readFileSync(file,'utf8');
 for(const forbidden of ['Math.random','Date.','performance.now','AudioContext','fetch('])assert.ok(!source.includes(forbidden),forbidden);
});
test('live 3D viewer loads original soundstage behind explicit opt-in and routes semantic combat',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(app.includes("import {createDungeonSoundstage} from '/dungeon/soundstage.js'"));
 assert.ok(app.includes('soundstage?.acceptSnapshot(s)'));
 assert.ok(app.includes('soundstage?.stats()'));
 assert.ok(app.includes('soundstage?.enable()'),'opt-in sound must fail closed when device initialization is unavailable');
 assert.ok(server.includes("['/dungeon/soundstage.js','soundstage.js']"));
 assert.ok(server.includes("['/dungeon/soundstage-plan.js','soundstage-plan.js']"));
});

test('real opt-in audio stops active voices on mute and revokes capture, not gameplay',async()=>{
 const original=fs.readFileSync(path.join(root,'public/ai-dungeon/soundstage.js'),'utf8');
 const planUrl='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64');
 const faceUrl='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8')).toString('base64');
 const foleyUrl='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/material-foley.js'),'utf8')).toString('base64');
 const impactUrl='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/impact-choreography-plan.js'),'utf8')).toString('base64');
 const code=original.replace("'/dungeon/soundstage-plan.js'","'"+planUrl+"'")
  .replace("'/dungeon/facing-plan.js'","'"+faceUrl+"'")
  .replace("'/dungeon/material-foley.js'","'"+foleyUrl+"'")
  .replace("'/dungeon/impact-choreography-plan.js'","'"+impactUrl+"'");
 const {createDungeonSoundstage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const param=()=>({
  value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}
 });
 let stopped=0,captures=0;
 const ctx={
  state:'running',currentTime:0,destination:{},
  createGain:()=>({gain:param(),connect(){},disconnect(){}}),
  createOscillator:()=>({frequency:param(),connect(){},disconnect(){},start(){},stop(){stopped++}}),
  createMediaStreamDestination:()=>{captures++;return {stream:{getAudioTracks:()=>[{}]},disconnect(){}}}
 };
 const stage=createDungeonSoundstage(ctx);
 assert.equal(stage.stats().started,false,'never autoplay before a click');
 assert.equal(stage.captureStream(),null,'cannot capture audio before consent');
 assert.equal(stage.enable(),true);
 assert.equal(stage.cueWelcome(),true);
 assert.equal(stage.stats().voices,1);
 const floor=Array.from({length:7},()=>'.'.repeat(7));
 const old={tick:11,run:1,floor:1,phase:'exploring',map:floor,events:[],units:[
  {...unit('vanguard','idle',11),x:2,z:2,hp:30,maxHp:30},
  {...unit('revenant','idle',11,'revenant','enemy'),x:3,z:2,hp:30,maxHp:30}
 ]};
 const next={...old,tick:12,units:[
  {...old.units[0],action:'attack',actionTick:12,targetId:'revenant'},
  {...old.units[1],hp:19}
 ]};
 stage.acceptSnapshot(old);
 stage.acceptSnapshot(next);
 assert.equal(stage.stats().pendingContactCues>=1,true,'real sword contact has pending opt-in audio');
 for(let i=0;i<4;i++)stage.advanceVisualFrame(.05);
 assert.equal(stage.stats().pendingContactCues>=1,true,'impact waits until the real skinned contact frame');
 stage.advanceVisualFrame(.05);
 assert.equal(stage.stats().pendingContactCues,0);
 assert.equal(stage.stats().lastCue,'impact','true contact releases original sound on the shared 215ms beat');
 // A second REAL adjacent HP decrease, delivered by a 433ms sparse render.
 const idle={...next,tick:13,units:[{...next.units[0],action:'idle',actionTick:13},next.units[1]]};
 const again={...next,tick:14,units:[{...next.units[0],action:'attack',actionTick:14},{...next.units[1],hp:10}]};
 stage.acceptSnapshot(idle);stage.acceptSnapshot(again);
 assert.ok(stage.stats().pendingContactCues>=1);
 stage.advanceVisualFrame(.433);
 assert.ok(stage.stats().pendingContactCues>=1,'impact must not sound during first visible windup');
 stage.advanceVisualFrame(.433);
 assert.equal(stage.stats().pendingContactCues,0,'blade and original impact meet on second sparse frame');
 assert.equal(stage.stats().lastCue,'impact');
 assert.ok(stage.captureStream()?.getAudioTracks().length);
 assert.ok(stage.captureStream()?.getAudioTracks().length);
 assert.equal(captures,1,'reuse only one recording output');
 stage.disable();
 assert.equal(stage.stats().enabled,false);
 assert.equal(stage.stats().voices,0,'mute must stop any in-flight sound not leave it suspended');
 assert.equal(stage.captureStream(),null,'mute revokes spectator audio capture');
 assert.ok(stopped>=1);
 stage.dispose();assert.equal(stage.stats().disposed,true);
});

test('Warden opening sound exists only for the real public authority counterattack event',async()=>{
 const {planSoundCues}=await plan();
 const before=snap(6),after=snap(7,{events:[{tick:7,kind:'opening',text:'counter Warden'}]});
 const cues=planSoundCues(before,after);
 assert.equal(cues.filter(c=>c.kind==='opening').length,1);
 assert.equal(planSoundCues(after,after).length,0,'identical polls cannot replay the opening');
 assert.equal(planSoundCues(null,after).length,0,'first page load must remain quiet');
});

test('a real current-tick costly cover gets distinct original metal audio, never a fake impact',async()=>{
 const {planSoundCues}=await plan();
 const hero=hp=>({id:'vanguard',kind:'vanguard',faction:'party',hp,maxHp:120,action:'guard',actionTick:30,x:1,z:1});
 const before={tick:30,run:1,floor:1,units:[hero(120)],events:[]};
 const hit={kind:'cover',tick:31,text:'Ashen Vanguard intercepted 12 damage for ranger · 9 HP paid'};
 const after={...before,tick:31,units:[hero(111)],events:[hit]};
 assert.equal(planSoundCues(before,after).filter(c=>c.kind==='cover-impact').length,1);
 assert.equal(planSoundCues(before,{...after,units:[hero(120)]}).some(c=>c.kind==='cover-impact'),false);
 assert.equal(planSoundCues(before,{...after,events:[{...hit,text:'ASHEN VANGUARD · COVERING RANGER'}]}).some(c=>c.kind==='cover-impact'),false);
 assert.deepEqual(planSoundCues(after,after),[]);
});

test('actual Warden death uniquely earns an original audio resolution, not a generic enemy cue',async()=>{
 const {planSoundCues}=await plan(),before=snap(24);
 const boss=snap(25,{events:[{tick:25,kind:'kill',text:'WARDEN DEFEATED · +12 gold'}]});
 const cues=planSoundCues(before,boss);
 assert.equal(cues.filter(c=>c.kind==='boss-fall').length,1);
 assert.equal(cues.some(c=>c.kind==='kill'),false);
 assert.ok(cues.find(c=>c.kind==='boss-fall').priority>3);
 assert.deepEqual(planSoundCues(boss,boss),[],'repeated polling never replays a death');
 const mob=snap(25,{events:[{tick:25,kind:'kill',text:'Enemy defeated · +12 gold'}]});
 assert.equal(planSoundCues(before,mob).some(c=>c.kind==='boss-fall'),false);
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/soundstage.js'),'utf8');
 assert.match(source,/'boss-fall':\{hz:/);
});


test('authentic three-beat Warden NOVA earns rising and final opt-in cues, never phantom sound',async()=>{
 const {planSoundCues}=await plan();
 const boss={...unit('boss','guard',3,'warden','enemy'),x:3,z:3};
 const warned=(tick,remaining)=>snap(tick,{units:[unit('hero'),boss],
  bossWarning:{shape:'NOVA',warning:true,attackTick:6,turnsUntilImpact:remaining,cells:[{x:3,z:3}]}});
 const t3=warned(3,3),t2=warned(4,2),t1=warned(5,1);
 assert.equal(planSoundCues(t3,t2).filter(c=>c.kind==='warning-rising').length,1);
 assert.equal(planSoundCues(t2,t1).filter(c=>c.kind==='warning-final').length,1);
 assert.deepEqual(planSoundCues(t1,t1),[],'repeat poll must stay silent');
 assert.deepEqual(planSoundCues(null,t1),[],'no first-load warning replay');
 assert.equal(planSoundCues(t3,{...t2,bossWarning:null}).some(c=>c.kind==='warning-rising'),false);
 assert.equal(planSoundCues(t3,{...t2,units:[unit('hero')]}).some(c=>c.kind==='warning-rising'),false);
 const bad={...t2,bossWarning:{...t2.bossWarning,attackTick:100}};
 assert.equal(planSoundCues(t3,bad).some(c=>c.kind==='warning-rising'),false);
});

test('a genuine Eclipse HP phase earns original rising and final cues over three fixed source beats',async()=>{
 const {planSoundMood,planSoundCues}=await plan();
 const boss={...unit('boss','guard',1,'warden','enemy'),x:3,z:3,hp:2,maxHp:12};
 const state=(tick,remaining)=>snap(tick,{units:[unit('hero'),boss],
  bossWarning:{shape:'ECLIPSE_SWEEP',warning:true,attackTick:4,turnsUntilImpact:remaining,cells:[{x:3,z:3}]}});
 const first=state(1,3),second=state(2,2),last=state(3,1);
 assert.equal(planSoundMood(first).mood,'eclipse');
 assert.ok(planSoundMood(first).droneHz<planSoundMood(snap(1,{units:[unit('hero'),{...boss,hp:12}]})).droneHz);
 assert.equal(planSoundCues(first,second).filter(c=>c.kind==='eclipse-rising').length,1);
 assert.equal(planSoundCues(second,last).filter(c=>c.kind==='eclipse-final').length,1);
 assert.deepEqual(planSoundCues(last,last),[]);
 assert.deepEqual(planSoundCues(null,last),[]);
 assert.equal(planSoundCues(first,{...second,bossWarning:null}).some(c=>c.kind==='eclipse-rising'),false);
 assert.equal(planSoundCues(first,{...second,units:[unit('hero')]}).some(c=>c.kind==='eclipse-rising'),false);
});

test('original Warden counter sound requires true previous recovery and HP loss',async()=>{
 const {planSoundCues}=await plan();
 const boss=(hp,recoveryUntilTick)=>({...unit('warden','guard',40,'warden','enemy'),hp,
  maxHp:90,recoveryUntilTick});
 const before=snap(40,{units:[unit('hero'),boss(60,41)]});
 const event={kind:'counter',tick:41,text:'vanguard countered the exposed Warden for 20 damage'};
 const after=snap(41,{units:[unit('hero'),boss(40,41)],events:[event]});
 assert.equal(planSoundCues(before,after).filter(c=>c.kind==='counter').length,1);
 assert.equal(planSoundCues(before,{...after,units:[unit('hero'),boss(60,41)]}).some(c=>c.kind==='counter'),false);
 assert.deepEqual(planSoundCues(after,after),[],'same poll cannot repeat a hit');
 const noRecovery=snap(40,{units:[unit('hero'),boss(60,undefined)]});
 assert.equal(planSoundCues(noRecovery,after).some(c=>c.kind==='counter'),false,'no fake exposed window');
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/soundstage.js'),'utf8');
 assert.match(source,/counter:\s*\{hz:/);
});

test('a real Vanguard tile handoff earns low-volume original opt-in sound; counter audit retains the earned prior window',async()=>{
 const {planSoundCues}=await plan();
 const before=snap(10,{units:[unit('vanguard','idle',10)]});
 const after=snap(11,{units:[unit('vanguard','move',11)],events:[
  {kind:'cover-advance',tick:11,text:'Ashen Vanguard opened safe stone for ranger'}]});
 assert.equal(planSoundCues(before,after).filter(c=>c.kind==='lane-clear').length,1);
 assert.equal(planSoundCues(after,after).some(c=>c.kind==='lane-clear'),false);
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/soundstage.js'),'utf8');
 assert.match(src,/recoveryUntilTick:u\.recoveryUntilTick/,
  'the live stage caches genuine Warden prior recovery for counter audio verification');
 assert.match(src,/'lane-clear':\{hz:/);
});
