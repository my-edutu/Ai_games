import {planSoundCues,planSoundMood} from '/dungeon/soundstage-plan.js';
import {planVisualContact} from '/dungeon/facing-plan.js';

/**
 * Original browser-generated dungeon sound design. All music and effects are
 * newly synthesized; no borrowed songs, samples, streaming URLs or assets.
 * Explicit click opt-in is REQUIRED before creating any oscillators.
 * Every cue is read-only presentation from a real public authority snapshot.
 */
const MAX_VOICES=10;
const MASTER_GAIN=.15;
const CUES=Object.freeze({
 defeat:    {hz:185,end:46,length:1.08,peak:.12,type:'triangle'},
 renewal:   {hz:262,end:440,length:.70,peak:.08,type:'sine'},
 transition:{hz:196,end:392,length:.82,peak:.09,type:'sine'},
  unseal:    {hz:147,end:587,length:.72,peak:.105,type:'triangle'},
 warning:   {hz:142,end:81,length:.66,peak:.125,type:'sawtooth'},
 boss:      {hz:88,end:51,length:.64,peak:.13,type:'sawtooth'},
 danger:    {hz:118,end:74,length:.43,peak:.10,type:'triangle'},
 impact:    {hz:124,end:46,length:.17,peak:.145,type:'triangle'},
 weapon:    {hz:198,end:66,length:.23,peak:.12,type:'sawtooth'},
 ranged:    {hz:330,end:131,length:.16,peak:.085,type:'triangle'},
 magic:     {hz:392,end:710,length:.34,peak:.085,type:'sine'},
 heal:      {hz:440,end:660,length:.42,peak:.075,type:'sine'},
 kill:      {hz:160,end:86,length:.33,peak:.095,type:'triangle'},
 reward:    {hz:660,end:990,length:.27,peak:.065,type:'sine'},
 trap:      {hz:95,end:55,length:.27,peak:.11,type:'sawtooth'},
 disarm:    {hz:550,end:880,length:.25,peak:.065,type:'sine'},
 guard:     {hz:285,end:173,length:.16,peak:.057,type:'triangle'},
 block:     {hz:350,end:145,length:.15,peak:.075,type:'triangle'},
 evade:     {hz:450,end:690,length:.14,peak:.048,type:'sine'},
 footstep:  {hz:112,end:54,length:.10,peak:.041,type:'triangle'}
});
const PER_KIND_COOLDOWN=Object.freeze({
 weapon:.065,impact:.065,warning:.25,boss:.22,reward:.20,guard:.13,footstep:.16
});
const safe=(v,min,max,fallback)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
const stopAndDisconnect=voice=>{
 if(voice.done)return;
 voice.done=true;
 try{voice.osc.stop()}catch{}
 try{voice.osc.disconnect()}catch{}
 try{voice.gain.disconnect()}catch{}
};
export function createDungeonSoundstage(ctx){
 if(!ctx||typeof ctx.createGain!=='function'||typeof ctx.createOscillator!=='function')return null;
 let started=false,enabled=false,previous=null,sceneMood=null,disposed=false;
 let played=0,suppressed=0,peakVoices=0,sceneChanges=0,lastCue='none';
 const active=[],cooldown=new Map(),beds=[],nodes=[];
 let master=null,bedBus=null,fxBus=null,capture=null;
 const now=()=>safe(ctx.currentTime,0,Number.MAX_SAFE_INTEGER,0);
 function addBed(type){
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();
  oscillator.type=type;oscillator.frequency.value=55;gain.gain.value=0;
  oscillator.connect(gain);gain.connect(bedBus);oscillator.start();
  beds.push({oscillator,gain});nodes.push(oscillator,gain);
 }
 function start(){
  if(started||disposed)return !disposed;
  try{
   master=ctx.createGain();master.gain.value=MASTER_GAIN;
   bedBus=ctx.createGain();bedBus.gain.value=.65;
   fxBus=ctx.createGain();fxBus.gain.value=.85;
   bedBus.connect(master);fxBus.connect(master);master.connect(ctx.destination);
   nodes.push(master,bedBus,fxBus);
   addBed('sine');addBed('triangle');
   started=true;return true;
  }catch(error){
   // Bad output devices must not interrupt the autonomous game.
   for(const voice of beds)try{voice.oscillator.stop()}catch{}
   for(const node of nodes)try{node.disconnect()}catch{}
   beds.length=nodes.length=0;started=false;enabled=false;return false;
  }
 }
 function automate(param,value,time=.08){
  try{
   const t=now();param.cancelScheduledValues(t);
   param.setTargetAtTime(value,t,safe(time,.015,1,.08));
  }catch{try{param.value=value}catch{}}
 }
 function setMood(mood){
  if(!mood||disposed)return;
  const changed=sceneMood?.floor!==mood.floor||sceneMood?.mood!==mood.mood;
  if(!changed)return;
  sceneMood=mood;sceneChanges++;
  if(!started)return;
  const level=mood.mood==='intermission'?.24:mood.mood==='defeat'?.12:.68;
  automate(bedBus.gain,level,.42);
  automate(beds[0].oscillator.frequency,mood.droneHz,.42);
  automate(beds[1].oscillator.frequency,mood.upperHz,.52);
  automate(beds[0].gain.gain,.085+.045*mood.urgency,.38);
  automate(beds[1].gain.gain,.038+.028*mood.urgency,.42);
 }
 function cleanup(){
  const t=now();
  for(let i=active.length-1;i>=0;i--)if(active[i].stopAt<=t||active[i].done){
   stopAndDisconnect(active[i]);active.splice(i,1);
  }
 }
 function emit(cue){
  if(!enabled||disposed||ctx.state!=='running')return false;
  const profile=CUES[cue?.kind];
  if(!profile||!started)return false;
  const t=now();
  cleanup();
  const key=cue.kind,previousTime=cooldown.get(key)??-Infinity;
  if(t-previousTime<(PER_KIND_COOLDOWN[key]??.065)){suppressed++;return false}
  if(active.length>=MAX_VOICES){
   let weakest=0;
   for(let i=1;i<active.length;i++)if(active[i].priority<active[weakest].priority)weakest=i;
   if(active[weakest].priority>=cue.priority){suppressed++;return false}
   stopAndDisconnect(active[weakest]);active.splice(weakest,1);
  }
  let osc=null,gain=null;
  try{
   osc=ctx.createOscillator();gain=ctx.createGain();
   osc.type=profile.type;
   osc.frequency.setValueAtTime(profile.hz,t);
   osc.frequency.exponentialRampToValueAtTime(profile.end,t+profile.length);
   gain.gain.setValueAtTime(.0001,t);
   gain.gain.exponentialRampToValueAtTime(profile.peak,t+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,t+profile.length);
   osc.connect(gain);gain.connect(fxBus);
   const voice={osc,gain,stopAt:t+profile.length+.04,priority:cue.priority||1,done:false};
   osc.onended=()=>{stopAndDisconnect(voice)};
   osc.start(t);osc.stop(voice.stopAt);
   active.push(voice);cooldown.set(key,t);
   peakVoices=Math.max(peakVoices,active.length);played++;lastCue=key;
   // High-priority danger and defeat stand apart from background atmosphere.
   if((cue.priority||1)>=4&&bedBus){
    const back=sceneMood?.mood==='intermission'?.24:sceneMood?.mood==='defeat'?.12:.68;
    try{
     bedBus.gain.cancelScheduledValues(t);
     bedBus.gain.setTargetAtTime(.24,t,.05);
     bedBus.gain.setTargetAtTime(back,t+profile.length,.28);
    }catch{}
   }
   return true;
  }catch(error){
   try{osc?.stop()}catch{}
   try{osc?.disconnect()}catch{}
   try{gain?.disconnect()}catch{}
   suppressed++;return false;
  }
 }
 function enable(){
  if(disposed||ctx.state!=='running'||!start())return false;
  enabled=true;
  if(master)automate(master.gain,MASTER_GAIN,.035);
  if(sceneMood){const old=sceneMood;sceneMood=null;setMood(old)}
  return true;
 }
 function revokeCapture(){
  if(!capture)return;
  try{master?.disconnect(capture)}catch{}
  try{capture.disconnect?.()}catch{}
  for(const track of capture.stream?.getAudioTracks?.()||[])try{track.stop?.()}catch{}
  capture=null;
 }
 function disable(){
  enabled=false;
  for(const voice of active)stopAndDisconnect(voice);
  active.length=0;
  if(master)automate(master.gain,0,.015);
  revokeCapture();
 }
 function acceptSnapshot(s){
  if(!s||disposed)return;
  const mood=planSoundMood(s);setMood(mood);
  const cues=planSoundCues(previous,s,(u,current)=>planVisualContact(u,current));
  // Keep only the public fields used by the next comparison; no giant snapshots.
  previous={
   tick:s.tick,run:s.run,floor:s.floor,
   units:(Array.isArray(s.units)?s.units:[]).slice(0,96).map(u=>({
    id:u.id,kind:u.kind,action:u.action,actionTick:u.actionTick,
    faction:u.faction,hp:u.hp,x:u.x,z:u.z
   }))
  };
  if(enabled)for(const cue of cues)emit(cue);
 }
 function cueWelcome(){return emit({kind:'renewal',priority:5})}
 // Invoked by physically planted rendered steps, never by invented AI events.
 function footstep(){return emit({kind:'footstep',priority:1})}
 // A real browser can record actual oscillator output and combine it with
 // the real WebGL canvas. This creates no external upload or audio source,
 // and is unavailable until an explicit spectator opt-in.
 function captureStream(){
  if(disposed||!started||!enabled||ctx.state!=='running'||
   typeof ctx.createMediaStreamDestination!=='function')return null;
  if(!capture){
   try{
    capture=ctx.createMediaStreamDestination();
    master.connect(capture);nodes.push(capture);
   }catch{return null}
  }
  return capture.stream;
 }
 function stats(){
  cleanup();
  return {
   enabled,started,disposed,voices:active.length,peakVoices,voiceCap:MAX_VOICES,
   cuesPlayed:played,cuesSuppressed:suppressed,sceneChanges,
   mood:sceneMood?.mood??'unavailable',biome:sceneMood?.biome??null,
   lastCue,masterGain:MASTER_GAIN,engine:'original-synth-web-audio'
  };
 }
 function dispose(){
  if(disposed)return;
  disable();disposed=true;
  for(const bed of beds)try{bed.oscillator.stop()}catch{}
  for(const node of nodes)try{node.disconnect()}catch{}
  nodes.length=beds.length=0;cooldown.clear();previous=null;
 }
 return {enable,disable,acceptSnapshot,cueWelcome,footstep,captureStream,stats,dispose};
}
