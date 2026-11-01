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
 const after=snap(11,{units:[unit('hero','attack',11),unit('enemy','hurt',11,'revenant','enemy')]});
 const valid=u=>u.id==='hero'?{targetId:'enemy',distance:1}:null;
 const sound=planSoundCues(before,after,valid);
 assert.deepEqual(sound.filter(c=>c.kind==='weapon').map(c=>c.actorId),['hero']);
 assert.deepEqual(sound.filter(c=>c.kind==='impact').map(c=>c.actorId),['enemy']);
 assert.ok(sound.every(c=>Number.isSafeInteger(c.tick)&&Number.isSafeInteger(c.priority)));
 assert.equal(planSoundCues(before,after,()=>null).some(c=>c.kind==='weapon'),false,'blocked lane cannot synthesize contact');
 assert.deepEqual(planSoundCues(after,after,valid),[],'same authority tick never repeats audio');
 assert.deepEqual(planSoundCues(null,after,valid),[],'first page load never replays old actions');
 assert.deepEqual(before.units[0],unit('hero','idle',9),'plans cannot mutate authoritative snapshots');
});
test('events, transitions and missed polls produce bounded, semantic, text-independent audio',async()=>{
 const {planSoundCues,MAX_SOUND_CUES}=await plan();
 const before=snap(19);
 const after=snap(22,{events:[
  {kind:'telegraph',tick:20,text:'do not speak visitor input'},
  {kind:'healing',tick:21,text:'whatever'},
  {kind:'loot',tick:22,text:'treasure'},
  {kind:'floor',tick:22,text:'new depth'},
  {kind:'untrusted',tick:22,text:'not a sound'}
 ]});
 const cues=planSoundCues(before,after,()=>null);
 assert.ok(cues.some(c=>c.kind==='warning'));
 assert.ok(cues.some(c=>c.kind==='heal'));
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
 assert.doesNotMatch(source,/Math\\.random|Date\\.|performance\\.now|AudioContext|fetch\\(/);
});
test('live 3D viewer loads original soundstage behind explicit opt-in and routes semantic combat',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/import \\{createDungeonSoundstage\\} from '\\/dungeon\\/soundstage\\.js'/);
 assert.match(app,/soundstage\\?\\.acceptSnapshot\\(s\\)/);
 assert.match(app,/soundstage\\?\\.stats\\(\\)/);
 assert.match(app,/soundstage\\.enable\\(\\)/);
 assert.ok(server.includes("['/dungeon/soundstage.js','soundstage.js']"));
 assert.ok(server.includes("['/dungeon/soundstage-plan.js','soundstage-plan.js']"));
});
