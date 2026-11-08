/**
 * D04 original procedural material foley — v2.
 *
 * No third-party audio, music, online sample or script. Noise-dominant wind,
 * grounded low impacts and muted inharmonic steel resonances replace generic
 * oscillator beeps. One precomputed seeded mono noise texture, short fixed
 * envelopes, priority-evicted voices and a finite output bus. Sound remains
 * OPTIONAL and is never proof that damage or a strike occurred.
 */
export const MAX_ORIGINAL_COMBAT_VOICES=8;
export const ORIGINAL_COMBAT_MASTER_GAIN=.12;
export const ORIGINAL_COMBAT_MAX_NOISE_SAMPLES=19200;
export const COMBAT_MUTE_PREFERENCE_KEY='ai-dungeon:physical-combat-muted-v1';
const P=(duration,peak,noise,low,high,partials=[],filter='bandpass')=>Object.freeze({
 duration,peak,noise,low,high,partials,filter
});
// [initial Hz, ending Hz, gain multiplier, waveform]. Metal uses inharmonic,
// independently damped resonances; unconfirmed air swings use NO oscillator.
const STEEL=Object.freeze([
 [783,559,.30,'triangle'],[1171,734,.22,'sine'],[2029,1359,.12,'sine']
]);
const RECIPES=Object.freeze({
 whoosh:P(.23,.072,.94,175,1600),
 draw:P(.12,.030,.88,245,760),
 'ranged-release':P(.20,.064,.75,360,2100,[[195,98,.14,'triangle']]),
 'spell-release':P(.34,.062,.65,420,2850,[[196,470,.30,'triangle'],[392,840,.12,'sine']]),
 'cast-dry':P(.15,.031,.82,320,920),
 utility:P(.27,.050,.57,440,1400,[[340,580,.12,'sine']]),
 impact:P(.23,.103,.82,1600,250,[[125,52,.25,'triangle']],'lowpass'),
 'fatal-impact':P(.43,.111,.90,1200,160,[[105,36,.28,'triangle']],'lowpass'),
 block:P(.31,.077,.76,2900,1010,STEEL),
 guard:P(.17,.038,.66,1300,460,[[240,130,.12,'triangle']]),
 evade:P(.17,.042,.94,560,2300),
 interrupt:P(.29,.075,.72,3700,720,[[792,135,.22,'triangle'],[1211,430,.16,'sine']]),
 recovery:P(.34,.047,.45,400,990,[[215,365,.18,'sine']]),
 counter:P(.32,.082,.73,2500,600,[[530,112,.32,'triangle'],[1285,765,.15,'sine']]),
 'threat-warning':P(.25,.039,.60,600,280,[[195,124,.10,'triangle']]),
 'boss-warning':P(.37,.063,.56,480,190,[[110,71,.24,'triangle']]),
 'boss-warning-rising':P(.43,.065,.64,510,210,[[102,64,.28,'triangle']]),
 'boss-warning-final':P(.50,.084,.61,670,120,[[151,54,.31,'triangle']]),
 'warden-release':P(.58,.106,.82,730,140,[[78,35,.37,'triangle'],[151,89,.09,'sawtooth']],'lowpass'),
 defeat:P(.60,.063,.32,490,130,[[130,43,.34,'triangle']],'lowpass')
});
const COOLDOWN=Object.freeze({whoosh:.075,impact:.085,block:.11,
 evade:.1,'boss-warning-final':.15,counter:.14,
 'warden-release':.2,interrupt:.12,defeat:.5});
const clamp=(x,lo,hi,defaultValue=lo)=>Number.isFinite(x)?Math.max(lo,Math.min(hi,x)):defaultValue;
export function createCombatMutePreference(storage){
 const read=()=>{try{return storage?.getItem?.(COMBAT_MUTE_PREFERENCE_KEY)==='false'?false:true}catch{return true}};
 const write=muted=>{
  const m=muted!==false;
  try{storage?.setItem?.(COMBAT_MUTE_PREFERENCE_KEY,String(m))}catch{}
  return m;
 };
 return Object.freeze({read,write});
}
/** A material role is a TIMBRE choice only, not evidence of who struck whom. */
const MATERIALS=Object.freeze({
 stone:Object.freeze({noise:.85,brightness:.48}),
 steel:Object.freeze({noise:.75,brightness:1.2}),
 wood:Object.freeze({noise:.72,brightness:.6}),
 cloth:Object.freeze({noise:.54,brightness:.8}),
 neutral:Object.freeze({noise:1,brightness:1})
});
export function createOriginalCombatFoley(ctx,{output=null}={}){
 let started=false,enabled=false,disposed=false,bus=null,limiter=null,noiseBuffer=null;
 let played=0,dropped=0,stopped=0,peakVoices=0,deviceFailures=0;
 const active=[],lastPlayed=new Map();
 const now=()=>clamp(ctx?.currentTime,0,1e12,0);
 const usable=()=>ctx&&typeof ctx.createGain==='function'&&
  typeof ctx.createBuffer==='function'&&typeof ctx.createBufferSource==='function'&&
  typeof ctx.createBiquadFilter==='function'&&typeof ctx.createOscillator==='function';
 function stopVoice(voice){
  if(!voice||voice.done)return;
  voice.done=true;stopped++;
  for(const n of voice.sources){try{n.onended=null;n.stop?.()}catch{}}
  for(const n of voice.nodes)try{n.disconnect?.()}catch{}
 }
 function cleanup(){
  const t=now();
  for(let i=active.length-1;i>=0;i--){const v=active[i];
   if(v.done||v.stopAt<=t){stopVoice(v);active.splice(i,1)}
  }
 }
 function init(){
  if(started)return true;
  if(!usable()||disposed||ctx.state!=='running')return false;
  let b=null,c=null;
  try{
   b=ctx.createGain();b.gain.value=ORIGINAL_COMBAT_MASTER_GAIN;
   // The compressor protects denser streams without substituting for a
   // measured output true peak. Low baseline gain is retained regardless.
   if(typeof ctx.createDynamicsCompressor==='function'){
    c=ctx.createDynamicsCompressor();c.threshold.value=-19;c.knee.value=8;
    c.ratio.value=3.5;c.attack.value=.003;c.release.value=.105;
    b.connect(c);c.connect(output??ctx.destination);
   }else b.connect(output??ctx.destination);
   const hz=clamp(ctx.sampleRate,8000,96000,48000);
   const sampleCount=Math.min(ORIGINAL_COMBAT_MAX_NOISE_SAMPLES,
    Math.max(256,Math.ceil(hz*.28)));
   const buffer=ctx.createBuffer(1,sampleCount,hz),samples=buffer.getChannelData(0);
   let seed=0x674cc87d;
   // Retain one ORIGINAL noise texture across long Warden, warning and
   // defeat cues. The former non-looping 280ms buffer fell silent before
   // their 430-600ms envelopes finished, leaving resonator-only tails.
   // A brief symmetric edge taper avoids a discontinuity on each wrap.
   const edge=Math.max(8,Math.min(Math.floor(hz*.003),Math.floor(sampleCount/32)));
   for(let i=0;i<sampleCount;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const fadeIn=Math.min(1,i/edge),fadeOut=Math.min(1,(sampleCount-1-i)/edge);
    const edgeGain=Math.sin(Math.min(fadeIn,fadeOut)*Math.PI*.5)**2;
    samples[i]=((seed/4294967296)*2-1)*edgeGain;
   }
   bus=b;limiter=c;noiseBuffer=buffer;started=true;return true;
  }catch{
   try{b?.disconnect()}catch{}try{c?.disconnect()}catch{}
   deviceFailures++;return false;
  }
 }
 function enable(){
  if(disposed||ctx?.state!=='running'||!init())return false;
  enabled=true;return true;
 }
 function envelope(param,t,amplitude,length,attack=.008){
  const peak=Math.max(.0002,amplitude);
  param.setValueAtTime(.0001,t);
  param.exponentialRampToValueAtTime(peak,t+attack);
  param.exponentialRampToValueAtTime(.0001,t+length);
 }
 function emit(cue){
  if(disposed||!enabled||ctx?.state!=='running')return false;
  const profile=RECIPES[cue?.audio];
  if(!profile||!bus)return false;
  cleanup();
  const t=now(),last=lastPlayed.get(cue.audio)??-Infinity;
  if(t-last<(COOLDOWN[cue.audio]??.05)){dropped++;return false}
  const priority=clamp(cue?.priority,0,10,1);
  if(active.length>=MAX_ORIGINAL_COMBAT_VOICES){
   let weakest=0;
   for(let i=1;i<active.length;i++)if(active[i].priority<active[weakest].priority)weakest=i;
   if(active[weakest].priority>=priority){dropped++;return false}
   stopVoice(active[weakest]);active.splice(weakest,1);
  }
  const duration=clamp(profile.duration,.05,.7),severity=clamp(cue?.severity,0,1),
   peak=Math.min(.12,profile.peak*(.83+.19*severity)),
   material=MATERIALS[cue?.detail?.materialRole]??MATERIALS.neutral;
  const sources=[],nodes=[];
  try{
   // Air, debris and impacts are predominantly filtered noise. Filter motion
   // is monotonic and short; no harsh perpetual synthesized chime is needed.
   const n=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   sources.push(n);nodes.push(n,filter,gain);
   n.buffer=noiseBuffer;n.loop=true;filter.type=profile.filter;
   const brightness=material.brightness;
   filter.frequency.setValueAtTime(clamp(profile.low*brightness,80,9500),t);
   filter.frequency.exponentialRampToValueAtTime(clamp(profile.high*brightness,80,9500),t+duration);
   filter.Q.value=profile.filter==='bandpass'?.7:.55;
   envelope(gain.gain,t,peak*profile.noise*material.noise,duration*.93,.013);
   n.connect(filter);filter.connect(gain);gain.connect(bus);
   // Inharmonic, explicitly bounded resonances are only used for material or
   // dramatic beats. A sword swing intentionally has ZERO pure-tone voices.
   for(const [begin,end,ratio,wave] of profile.partials){
    const osc=ctx.createOscillator(),partialGain=ctx.createGain();
    sources.push(osc);nodes.push(osc,partialGain);
    osc.type=wave;osc.frequency.setValueAtTime(begin,t);
    osc.frequency.exponentialRampToValueAtTime(end,t+duration);
    envelope(partialGain.gain,t,peak*ratio,duration*.78,.006);
    osc.connect(partialGain);partialGain.connect(bus);
   }
   const stopAt=t+duration+.035;
   const voice={sources,nodes,stopAt,priority,done:false};
   const lastSource=sources.at(-1);
   if(lastSource)lastSource.onended=()=>stopVoice(voice);
   for(const source of sources){source.start(t);source.stop(stopAt)}
   active.push(voice);lastPlayed.set(cue.audio,t);
   played++;peakVoices=Math.max(peakVoices,active.length);
   return true;
  }catch{
   for(const n of sources)try{n.stop?.()}catch{}
   for(const n of nodes)try{n.disconnect?.()}catch{}
   deviceFailures++;dropped++;return false;
  }
 }
 function flush(){for(const v of active)stopVoice(v);active.length=0;lastPlayed.clear()}
 function disable(){enabled=false;flush()}
 function reset(){flush()}
 function dispose(){
  if(disposed)return;
  disable();disposed=true;
  try{bus?.disconnect()}catch{}try{limiter?.disconnect()}catch{}
  noiseBuffer=null;limiter=null;bus=null;
 }
 function stats(){cleanup();return Object.freeze({
  engine:'d04-original-material-foley-v2',started,enabled,disposed,
  activeVoices:active.length,peakVoices,voiceCap:MAX_ORIGINAL_COMBAT_VOICES,
  played,dropped,stopped,deviceFailures,masterGain:ORIGINAL_COMBAT_MASTER_GAIN,
  limiterAvailable:!!limiter,noiseSamples:noiseBuffer?.length??0,
  originalAssets:'local-seeded-filtered-noise-and-bounded-resonators',externalSamples:0
 })}
 return Object.freeze({enable,emit,cleanup,disable,flush,reset,dispose,stats});
}
