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
// One witnessed authority event authorizes at most ONE original foley onset.
// Retained IDs are bounded, just like the controller's cue/receipt histories.
export const MAX_ORIGINAL_CONFIRMED_CUE_IDS=128;
// Read-only source.start() audit ring, not proof of delivered PCM samples.
export const MAX_ORIGINAL_RECORDED_STARTS=32;
// Independently HP-confirmed simultaneous wounds deserve distinct but sparse
// onsets. Bound both victim memory and mix density for long-lived streams.
export const MAX_ORIGINAL_DAMAGE_TARGET_COOLDOWNS=16;
export const MAX_ORIGINAL_DAMAGE_ONSETS_PER_WINDOW=2;
export const ORIGINAL_DAMAGE_ONSET_WINDOW_SECONDS=.085;
// Distinct, witnessed sword attempts deserve separately audible air foley.
// Sound proves no contact; bound every source and each crowded onset window.
export const MAX_ORIGINAL_SWING_ACTOR_COOLDOWNS=16;
export const MAX_ORIGINAL_SWING_ONSETS_PER_WINDOW=2;
export const ORIGINAL_SWING_ONSET_WINDOW_SECONDS=.075;
export const ORIGINAL_COMBAT_MASTER_GAIN=.12;
export const ORIGINAL_COMBAT_MAX_NOISE_SAMPLES=19200;
// Fixed-rate original texture: WebAudio resamples it for each device context.
// This preserves one 280ms period at 8/44.1/48/96kHz without exceeding cap.
export const ORIGINAL_COMBAT_NOISE_TEXTURE_RATE=48000;
export const ORIGINAL_COMBAT_NOISE_TEXTURE_SAMPLES=13440;
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
/** A verified HP-loss cue can identify only its VICTIM, never a guessed striker. */
export function verifiedDamageFoleyVictim(cue){
 return (cue?.kind==='damage'&&cue.audio==='impact'||
  cue?.kind==='damage-fatal'&&cue.audio==='fatal-impact')&&
  cue?.proof==='observed-hp-drop'&&
  cue.actorId===null&&typeof cue.targetId==='string'&&
  cue.targetId.length>0&&cue.targetId.length<=128&&
  (cue.audio==='impact'||cue.audio==='fatal-impact')?cue.targetId:null;
}
/** A real public swing ATTEMPT is not an impact or attacker-victim claim. */
export function verifiedSwingFoleyActor(cue){
 return cue?.kind==='swing'&&cue.audio==='whoosh'&&cue.visual==='trail'&&
  cue.proof==='authority-attempt-not-hit'&&
  Number.isSafeInteger(cue.tick)&&cue.tick>=0&&
  typeof cue.sceneKey==='string'&&cue.sceneKey.length>0&&cue.sceneKey.length<=128&&
  typeof cue.actorId==='string'&&cue.actorId.length>0&&cue.actorId.length<=128?
  cue.actorId:null;
}
/**
 * An audio retry must not borrow a different run, tick, action or victim's
 * authoritative cue ID. A verified flag is not a substitute for an identity
 * matching the public snapshot planner's actual immutable event tuple.
 * No attacker is inferred for HP-only injury; '-' is a sentinel, not a source.
 * This guard is deliberately limited to strict production swing/injury foley.
 */
export function isCanonicalVerifiedCombatFoleyCue(cue){
 if(cue?.verified!==true||typeof cue.id!=='string'||cue.id.length<1||
  cue.id.length>256||typeof cue.sceneKey!=='string'||
  !/^(?:0|[1-9]\d*):[1-9]\d*$/.test(cue.sceneKey)||
  !Number.isSafeInteger(cue.tick)||cue.tick<0)return false;
 const [runText,floorText]=cue.sceneKey.split(':');
 const run=Number(runText),floor=Number(floorText);
 if(!Number.isSafeInteger(run)||run<0||
  !Number.isSafeInteger(floor)||floor<1)return false;
 const actor=verifiedSwingFoleyActor(cue);
 const victim=verifiedDamageFoleyVictim(cue);
 if(actor===null&&victim===null)return false;
 return cue.id===`${cue.sceneKey}:${cue.tick}:${cue.kind}:${actor??'-'}:${victim??'-'}`;
}

export function createCombatMutePreference(storage){
 // Private browsing and embedded canvases may deny localStorage. Explicit
 // user action must remain truthful for this page, even without persistence.
 // A fresh page still defaults to muted until a real opt-in gesture.
 let volatileMuted=true,storageWritable=true;
 const read=()=>{
  if(storageWritable)try{
   const saved=storage?.getItem?.(COMBAT_MUTE_PREFERENCE_KEY);
   if(saved==='false')volatileMuted=false;
   else if(saved==='true')volatileMuted=true;
  }catch{storageWritable=false}
  return volatileMuted;
 };
 const write=muted=>{
  volatileMuted=muted!==false;
  if(storageWritable)try{
   storage?.setItem?.(COMBAT_MUTE_PREFERENCE_KEY,String(volatileMuted));
  }catch{storageWritable=false}
  return volatileMuted;
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
/**
 * Presentation-only phase separation for simultaneous original noise voices.
 * One shared generated mono buffer remains in use; bounded 16-way search
 * avoids exact coherent summation when several notes start in one audio frame.
 * Phases follow AudioContext time, never the authoritative simulation clock.
 */
export function chooseOriginalNoisePhaseOffset(duration,nowSeconds,voices=[]){
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(nowSeconds)||
  !Array.isArray(voices))return 0;
 const candidates=16,maxVoices=MAX_ORIGINAL_COMBAT_VOICES;
 let selected=0,widestGap=-1;
 for(let i=0;i<candidates;i++){
  const offset=i*duration/candidates;
  let gap=duration;
  for(let j=0;j<Math.min(maxVoices,voices.length);j++){
   const voice=voices[j];
   if(!Number.isFinite(voice?.noiseOffset)||!Number.isFinite(voice?.startedAt))continue;
   const elapsed=Math.max(0,nowSeconds-voice.startedAt);
   const phase=((voice.noiseOffset+elapsed)%duration+duration)%duration;
   const delta=Math.abs(offset-phase);
   gap=Math.min(gap,delta,duration-delta);
  }
  if(gap>widestGap){selected=offset;widestGap=gap}
 }
 return selected;
}

export function createOriginalCombatFoley(ctx,{output=null,requireVerifiedContact=false}={}){
 let started=false,enabled=false,disposed=false,bus=null,limiter=null,noiseBuffer=null;
 let played=0,dropped=0,stopped=0,peakVoices=0,deviceFailures=0;
 const active=[],lastPlayed=new Map(),lastVerifiedDamage=new Map(),damageOnsets=[],
   lastVerifiedSwing=new Map(),swingOnsets=[],confirmedCueIds=new Set(),
    recentOriginalStarts=[];
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
   // A WebAudio AudioBuffer may have a different sample rate from its
   // AudioContext. The browser resamples this fixed 48kHz mono texture at
   // playback, so the 280ms loop period does not shorten on 96kHz devices.
   const hz=ORIGINAL_COMBAT_NOISE_TEXTURE_RATE;
   const sampleCount=ORIGINAL_COMBAT_NOISE_TEXTURE_SAMPLES;
   const buffer=ctx.createBuffer(1,sampleCount,hz),samples=buffer.getChannelData(0);
   let seed=0x674cc87d;
   for(let i=0;i<sampleCount;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    samples[i]=(seed/4294967296)*2-1;
   }
   // Equal-power seam crossfade, computed ONCE at init. The earlier symmetric
   // fade-to-zero imposed two 3ms silence troughs every loop, repeatedly
   // thinning 430-600ms Warden tails. Preserve the natural seeded-noise RMS
   // while matching the last sample exactly to the first; no new audio nodes.
   const edge=Math.max(8,Math.min(Math.floor(hz*.003),Math.floor(sampleCount/32)));
   for(let i=0;i<edge;i++){
    const phase=(i+1)/edge,tail=sampleCount-edge+i;
    samples[tail]=samples[tail]*Math.cos(phase*Math.PI*.5)+
     samples[(i+1)%edge]*Math.sin(phase*Math.PI*.5);
   }
   samples[sampleCount-1]=samples[0];
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
  // Preview production must not launder a failed cue contract into material
  // foley. In particular an AIR attempt cannot become a synthetic sword,
  // and only independently observed victim HP loss can make impact audio.
  // The default remains compatible with standalone sound auditions that
  // deliberately pass generic recipe names without authoritative snapshots.
  if(requireVerifiedContact&&
    (cue.audio==='whoosh'||cue.audio==='impact'||cue.audio==='fatal-impact')&&
    !isCanonicalVerifiedCombatFoleyCue(cue)){
   dropped++;return false;
  }
  // Per-actor time cooldown alone permits replaying the EXACT same attack
  // or HP-loss event once 75/85ms has passed. A received authoritative cue
  // ID is one-shot, independently of unrelated later ticks or sound density.
  // No receipt is consumed when the sound was muted, evicted or failed to start.
  const confirmedCue= requireVerifiedContact&&cue?.verified===true&&
   typeof cue.id==='string'&&cue.id.length>0&&cue.id.length<=256;
  if(requireVerifiedContact&&
   (cue.audio==='whoosh'||cue.audio==='impact'||cue.audio==='fatal-impact')&&
   !confirmedCue){dropped++;return false}
  if(confirmedCue&&confirmedCueIds.has(cue.id)){dropped++;return false}
  cleanup();
  const t=now(),victim=verifiedDamageFoleyVictim(cue),
    swinger=verifiedSwingFoleyActor(cue);
   // Retain global type cooldown for unverified/anonymous cues. Independent
   // actor-local air swooshes require the EXACT public attempted-swing proof.
   const last=victim!==null?lastVerifiedDamage.get(victim)??-Infinity:
    swinger!==null?lastVerifiedSwing.get(swinger)??-Infinity:
    lastPlayed.get(cue.audio)??-Infinity;
   const cooldown=victim!==null?ORIGINAL_DAMAGE_ONSET_WINDOW_SECONDS:
    swinger!==null?ORIGINAL_SWING_ONSET_WINDOW_SECONDS:
    COOLDOWN[cue.audio]??.05;
   if(t-last<cooldown){dropped++;return false}
   if(victim!==null){
    while(damageOnsets.length&&t-damageOnsets[0]>=ORIGINAL_DAMAGE_ONSET_WINDOW_SECONDS)
     damageOnsets.shift();
    if(damageOnsets.length>=MAX_ORIGINAL_DAMAGE_ONSETS_PER_WINDOW){dropped++;return false}
   }
   // ALL whooshes consume this two-onset air-noise budget. A cue with a
   // fabricated/missing actor can never bypass the shared density ceiling.
   if(cue.audio==='whoosh'){
    while(swingOnsets.length&&t-swingOnsets[0]>=ORIGINAL_SWING_ONSET_WINDOW_SECONDS)
     swingOnsets.shift();
    if(swingOnsets.length>=MAX_ORIGINAL_SWING_ONSETS_PER_WINDOW){dropped++;return false}
   }
   const priority=clamp(cue?.priority,0,10,1);
  if(active.length>=MAX_ORIGINAL_COMBAT_VOICES){
   let weakest=0;
   for(let i=1;i<active.length;i++)if(active[i].priority<active[weakest].priority)weakest=i;
   if(active[weakest].priority>=priority){dropped++;return false}
   stopVoice(active[weakest]);active.splice(weakest,1);
  }
  // Only a genuine witnessed swing can supply this read-only renderer
  // measurement. Slower measured AIR passage is slightly quieter; even
  // maximum motion never exceeds the existing original whoosh peak.
  // Missing/stale measurements preserve the established sound exactly.
  const handSpeed=swinger!==null?cue?.detail?.measuredHandMetersPerSecond:null;
  const airLevel=Number.isFinite(handSpeed)&&handSpeed>0?
   clamp(.84+.16*(handSpeed-.9)/7.1,.84,1):1;
  const duration=clamp(profile.duration,.05,.7),severity=clamp(cue?.severity,0,1),
   peak=Math.min(.12,profile.peak*(.83+.19*severity)*airLevel),
   material=MATERIALS[cue?.detail?.materialRole]??MATERIALS.neutral;
  // Offset each simultaneously active noise texture to avoid coherent peaks.
  // No new buffer, voice, listener or per-sample work is introduced.
  const noiseOffset=chooseOriginalNoisePhaseOffset(noiseBuffer?.duration,t,active);
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
   const voice={sources,nodes,stopAt,priority,noiseOffset,startedAt:t,done:false};
   const lastSource=sources.at(-1);
   if(lastSource)lastSource.onended=()=>stopVoice(voice);
   for(const source of sources){
    if(source===n)source.start(t,noiseOffset);
    else source.start(t);
    source.stop(stopAt);
   }
   active.push(voice);
   if(requireVerifiedContact){
    // Record only AFTER every original WebAudio source.start() succeeded.
    // This scheduling clock is not the renderer's performance.now clock,
    // MediaRecorder PTS or decoded audible PCM. Never invent an attacker.
    const cueId=typeof cue?.id==='string'&&cue.id.length>0&&
     cue.id.length<=256?cue.id:null;
    recentOriginalStarts.push(Object.freeze({
     cueId,kind:typeof cue?.kind==='string'?cue.kind:null,
     audio:cue.audio,
     sceneKey:typeof cue?.sceneKey==='string'&&cue.sceneKey.length<=128?
      cue.sceneKey:null,
     tick:Number.isSafeInteger(cue?.tick)?cue.tick:null,
     scheduledContextMs:Math.round(t*1000),
     startedSources:sources.length,
     verifiedCanonicalCue:isCanonicalVerifiedCombatFoleyCue(cue),
     sampleSynchronized:false
    }));
    if(recentOriginalStarts.length>MAX_ORIGINAL_RECORDED_STARTS)
     recentOriginalStarts.shift();
   }
   if(confirmedCue){
    confirmedCueIds.add(cue.id);
    if(confirmedCueIds.size>MAX_ORIGINAL_CONFIRMED_CUE_IDS)
     confirmedCueIds.delete(confirmedCueIds.values().next().value);
   }
   if(victim!==null){
    lastVerifiedDamage.delete(victim);lastVerifiedDamage.set(victim,t);
    if(lastVerifiedDamage.size>MAX_ORIGINAL_DAMAGE_TARGET_COOLDOWNS)
     lastVerifiedDamage.delete(lastVerifiedDamage.keys().next().value);
    damageOnsets.push(t);
   }else if(swinger!==null){
    lastVerifiedSwing.delete(swinger);lastVerifiedSwing.set(swinger,t);
    if(lastVerifiedSwing.size>MAX_ORIGINAL_SWING_ACTOR_COOLDOWNS)
     lastVerifiedSwing.delete(lastVerifiedSwing.keys().next().value);
   }else lastPlayed.set(cue.audio,t);
   if(cue.audio==='whoosh')swingOnsets.push(t);
   played++;peakVoices=Math.max(peakVoices,active.length);
   return true;
  }catch{
   for(const n of sources)try{n.stop?.()}catch{}
   for(const n of nodes)try{n.disconnect?.()}catch{}
   deviceFailures++;dropped++;return false;
  }
 }
 function flush(){for(const v of active)stopVoice(v);active.length=0;
  lastPlayed.clear();lastVerifiedDamage.clear();damageOnsets.length=0;
   lastVerifiedSwing.clear();swingOnsets.length=0;confirmedCueIds.clear();
   recentOriginalStarts.length=0;}
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
  verifiedDamageTargets:lastVerifiedDamage.size,verifiedDamageOnsets:damageOnsets.length,
   verifiedSwingActors:lastVerifiedSwing.size,swingOnsets:swingOnsets.length,
   confirmedCueIds:confirmedCueIds.size,maxConfirmedCueIds:MAX_ORIGINAL_CONFIRMED_CUE_IDS,
  played,dropped,stopped,deviceFailures,masterGain:ORIGINAL_COMBAT_MASTER_GAIN,
  recentOriginalStarts:[...recentOriginalStarts],
  maxOriginalRecordedStarts:MAX_ORIGINAL_RECORDED_STARTS,
  limiterAvailable:!!limiter,noiseSamples:noiseBuffer?.length??0,
  noiseSampleRate:noiseBuffer?.sampleRate??0,
  noisePeriodMs:Math.round((noiseBuffer?.duration??0)*1000),
  originalAssets:'local-seeded-filtered-noise-and-bounded-resonators',externalSamples:0
 })}
 return Object.freeze({enable,emit,cleanup,disable,flush,reset,dispose,stats});
}
