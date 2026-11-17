import {planSoundCues,planSoundMood} from '/dungeon/soundstage-plan.js';
import {planAuthorityDamageBeats,planVerifiedMeleeImpactDelay} from '/dungeon/impact-choreography-plan.js';
import {planVisualContact} from '/dungeon/facing-plan.js';
import {createMaterialFoley} from '/dungeon/material-foley.js';

/**
 * Original browser-generated dungeon sound design. All music and effects are
 * newly synthesized; no borrowed songs, samples, streaming URLs or assets.
 * Explicit click opt-in is REQUIRED before creating any oscillators.
 * Every cue is read-only presentation from a real public authority snapshot.
 */
const MAX_VOICES=10;
const MASTER_GAIN=.15;
const MAX_PENDING_CONTACT=12;
const VISUAL_CONTACT_DELAYS=Object.freeze({weapon:.185,ranged:.14,magic:.19,kill:.235});
const CUES=Object.freeze({
 defeat:    {hz:185,end:46,length:1.08,peak:.12,type:'triangle'},
 renewal:   {hz:262,end:440,length:.70,peak:.08,type:'sine'},
 transition:{hz:196,end:392,length:.82,peak:.09,type:'sine'},
  unseal:    {hz:147,end:587,length:.72,peak:.105,type:'triangle'},
 warning:   {hz:142,end:81,length:.66,peak:.125,type:'sawtooth'},
 'warning-rising':{hz:112,end:74,length:.35,peak:.074,type:'triangle'},
 'warning-final':{hz:172,end:62,length:.48,peak:.102,type:'sawtooth'},
 // The real final-phase, three-lane Eclipse sounds weightier than an early nova,
 // but remains an original, bounded low-level synth with no imported sample.
 'eclipse-rising':{hz:98,end:65,length:.48,peak:.090,type:'triangle'},
 'eclipse-final':{hz:164,end:39,length:.64,peak:.120,type:'sawtooth'},
 boss:      {hz:88,end:51,length:.64,peak:.13,type:'sawtooth'},
 'boss-fall':{hz:174,end:330,length:.88,peak:.105,type:'triangle'},
 opening:   {hz:260,end:118,length:.40,peak:.09,type:'triangle'},
 counter:   {hz:410,end:102,length:.29,peak:.103,type:'triangle'},
 interrupt: {hz:535,end:91,length:.31,peak:.105,type:'triangle'},
 danger:    {hz:118,end:74,length:.43,peak:.10,type:'triangle'},
 breach:    {hz:106,end:42,length:.42,peak:.115,type:'sawtooth'},
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
 cover:     {hz:234,end:145,length:.27,peak:.078,type:'triangle'},
 'lane-clear':{hz:312,end:180,length:.17,peak:.048,type:'triangle'},
 'cover-impact':{hz:170,end:54,length:.34,peak:.132,type:'triangle'},
 block:     {hz:350,end:145,length:.15,peak:.075,type:'triangle'},
 evade:     {hz:450,end:690,length:.14,peak:.048,type:'sine'},
 footstep:  {hz:112,end:54,length:.10,peak:.041,type:'triangle'}
});
const PER_KIND_COOLDOWN=Object.freeze({
 weapon:.065,impact:.065,warning:.25,'warning-rising':.18,'warning-final':.18,'eclipse-rising':.18,'eclipse-final':.18,boss:.22,'boss-fall':.7,opening:.35,counter:.22,interrupt:.25,breach:.20,cover:.24,'lane-clear':.26,'cover-impact':.25,reward:.20,guard:.13,footstep:.16
});
const safe=(v,min,max,fallback)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
const stopAndDisconnect=voice=>{
 if(voice.done)return;
 voice.done=true;
 try{voice.osc.stop()}catch{}
 try{voice.osc.disconnect()}catch{}
 try{voice.gain.disconnect()}catch{}
 try{voice.foley?.stop()}catch{}
};
const D04_OWNED_LEGACY_COMBAT_CUES=new Set(['weapon','ranged','magic','impact','kill',
 'guard','block','evade','interrupt','counter','opening','boss','warning',
 'warning-rising','warning-final','eclipse-rising','eclipse-final','danger',
 'breach','cover-impact','defeat']);
export function createDungeonSoundstage(ctx,{reducedMotion=false,suppressCombat=false}={}){
 if(!ctx||typeof ctx.createGain!=='function'||typeof ctx.createOscillator!=='function')return null;
 let started=false,enabled=false,previous=null,sceneMood=null,disposed=false;
 let played=0,suppressed=0,peakVoices=0,sceneChanges=0,lastCue='none';
 const active=[],cooldown=new Map(),beds=[],nodes=[],pending=[];
 let contactCuesPlayed=0,contactCuesDropped=0;
 let master=null,bedBus=null,fxBus=null,physicalFoleyBus=null,capture=null,foley=null,pcmSession=null;
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
   // Only original D04 foley enters this unity-gain child bus.
   // Footsteps, rewards and the legacy master keep their existing path.
   if(suppressCombat){
    physicalFoleyBus=ctx.createGain();physicalFoleyBus.gain.value=1;
    physicalFoleyBus.connect(fxBus);
   }
   bedBus.connect(master);fxBus.connect(master);master.connect(ctx.destination);
   foley=createMaterialFoley(ctx);
   nodes.push(master,bedBus,fxBus);
   if(physicalFoleyBus)nodes.push(physicalFoleyBus);
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
   const voice={osc,gain,foley:foley?.emit(cue.kind,t,fxBus,cue.tick)||null,
    stopAt:t+profile.length+.04,priority:cue.priority||1,done:false};
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
  // D04-only diagnostic preparation begins at consent, before later WebGL
  // render stalls can hold up a first original FX PCM capture request.
  primeD04CombatPcmModule();
  return true;
 }
 /**
  * Record ACTUAL opt-in live WebAudio output, not an offline invented score.
  * Headless canvas MediaRecorder can return zero bytes while original game
  * oscillators are audible. A bounded, SILENT-OUTPUT live processor captures
  * the real synth mix independently; never touches microphones or uploads.
  * Unsupported/silent graphs report UNAVAILABLE or SILENT, never a win.
  */

 let pcmWorkletModuleLoad=null;
 // Recorder-fallback age only; never the authentic combat deadline.
 let pcmWorkletModuleRequestedAtMs=null;
 // Consent-time MODULE promise evidence only: not PCM output, onset or A/V sync.
 let pcmWorkletModuleState='NOT_REQUESTED';
 function primeD04CombatPcmModule(){
  // Load only after a fresh user audio opt-in. This creates no sound, no
  // recorder and no audio voices. A later PCM request reuses the same worklet
  // module rather than starting its first module load under heavy WebGL.
  if(!suppressCombat||!enabled||disposed||pcmWorkletModuleLoad||
   ctx.state!=='running'||typeof ctx.audioWorklet?.addModule!=='function'||
   typeof globalThis.AudioWorkletNode!=='function')return;
  try{
   pcmWorkletModuleState='LOADING';
   pcmWorkletModuleRequestedAtMs=Date.now();
   const load=Promise.resolve(ctx.audioWorklet.addModule('/dungeon/d04-combat-pcm-worklet.js'));
   pcmWorkletModuleLoad=load;
   // A fulfilled addModule promise only certifies module registration.
   // It is never counted as audio-thread PCM, audible onset or A/V contact.
   load.then(()=>{
    if(pcmWorkletModuleLoad===load)pcmWorkletModuleState='RESOLVED';
   },()=>{
    if(pcmWorkletModuleLoad===load){
     pcmWorkletModuleLoad=null;pcmWorkletModuleState='REJECTED';
    }
   });
  }catch{pcmWorkletModuleLoad=null;pcmWorkletModuleState='REJECTED'}
 }
 function recordD04CombatPcmWorklet(seconds,tapBus,sampleRate){
  const maxFrames=Math.ceil(seconds*sampleRate);
  return new Promise(resolve=>{
   let recorder=null,loadWatchdog=null,captureWatchdog=null,settled=false;
   const finish=(reason='complete',payload=null)=>{
    if(settled)return;
    settled=true;
    if(loadWatchdog!==null)clearTimeout(loadWatchdog);
    if(captureWatchdog!==null)clearTimeout(captureWatchdog);
    if(recorder){
     recorder.port.onmessage=null;
     recorder.onprocessorerror=null;
     try{recorder.port.postMessage({type:'stop'})}catch{}
     try{tapBus.disconnect(recorder)}catch{}
     try{recorder.disconnect()}catch{}
    }
    if(pcmSession?.finish===finish)pcmSession=null;
    if(reason!=='complete'||!payload){
     resolve({status:'UNAVAILABLE',reason,frames:0,sampleRate});return;
    }
    const {buffer,frames,firstFrame,blocks,invalidClocks,discontinuities}=payload;
    if(!(buffer instanceof ArrayBuffer)||buffer.byteLength!==maxFrames*2||
     frames!==maxFrames||!Number.isSafeInteger(blocks)||blocks<1||
     !Number.isSafeInteger(invalidClocks)||invalidClocks<0||
     !Number.isSafeInteger(discontinuities)||discontinuities<0){
     resolve({status:'UNAVAILABLE',reason:'Invalid bounded audio-thread PCM delivery',
      frames:0,sampleRate});return;
    }
    const samples=new Int16Array(buffer);
    const wav=new Uint8Array(44+frames*2),view=new DataView(wav.buffer);
    const ascii=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i))};
    ascii(0,'RIFF');view.setUint32(4,wav.length-8,true);ascii(8,'WAVE');
    ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
    view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);
    view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,frames*2,true);
    let squares=0,peak=0;
    for(let i=0;i<frames;i++){
     const raw=samples[i],value=raw/32768;
     view.setInt16(44+i*2,raw,true);
     peak=Math.max(peak,Math.abs(value));squares+=value*value;
    }
    const rms=Math.sqrt(squares/frames);
    const trustworthy=Number.isSafeInteger(firstFrame)&&firstFrame>=0&&
     invalidClocks===0&&discontinuities===0;
    resolve({status:peak>.0005&&rms>.0001?'RECORDED':'SILENT',
     sampleRate,channels:1,frames,durationSeconds:frames/sampleRate,
     captureBus:'d04-combat-fx-pre-master',
     captureTopology:'d04-original-foley-audio-thread-v1',
     pcmClock:{status:trustworthy?'CONTIGUOUS_CONTEXT_TIME_ONLY':
      invalidClocks>0||firstFrame===null?'UNVERIFIED_MISSING_OR_INVALID_CLOCK':
       'UNVERIFIED_NONCONTIGUOUS_CONTEXT_TIME',
      clock:'AudioWorkletGlobalScope.currentFrame',blocks,invalidClocks,discontinuities,
      firstSampleContextSeconds:trustworthy?firstFrame/sampleRate:null,
      lastSampleEndContextSeconds:trustworthy?(firstFrame+frames)/sampleRate:null},
     sampleSynchronized:false,bytes:wav.length,peak,rms,format:'PCM16_LE_WAV',wav});
   };
   // A suspended browser or stalled audio renderer must never retain a
   // permanently connected diagnostic node or block later sessions.
   pcmSession={finish};
   // Loading a worklet can wait behind software-WebGL main-thread stalls.
   // Do not spend the actual PCM recording budget before the node exists.
   // Each phase has its own finite deadline; neither changes the 400 ms
   // authentic combat impact admission/sound deadline.
   loadWatchdog=setTimeout(()=>finish('Audio-thread PCM module load timed out'),12000);
   Promise.resolve().then(async()=>{
    if(!pcmWorkletModuleLoad){
     pcmWorkletModuleState='LOADING';
     pcmWorkletModuleRequestedAtMs=Date.now();
     pcmWorkletModuleLoad=ctx.audioWorklet.addModule('/dungeon/d04-combat-pcm-worklet.js');
    }
    try{
     await pcmWorkletModuleLoad;
     if(pcmWorkletModuleState==='LOADING')pcmWorkletModuleState='RESOLVED';
    }catch(error){
     pcmWorkletModuleLoad=null;pcmWorkletModuleState='REJECTED';throw error;
    }
    if(settled)return;
    if(loadWatchdog!==null){clearTimeout(loadWatchdog);loadWatchdog=null}
    if(ctx.state!=='running')return finish('AudioContext stopped before PCM capture');
    recorder=new globalThis.AudioWorkletNode(ctx,'d04-original-foley-pcm',{
     numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],
     processorOptions:{frames:maxFrames}});
    // This diagnostic processor fills EVERY output sample with zero.
    // Do not place an additional zero-gain sink after it: render engines
    // may prune silent output branches and starve its input PCM recorder.
    // Direct destination connection remains silent by processor contract.
    recorder.onprocessorerror=()=>finish('Audio-thread PCM processor failure');
    recorder.port.onmessage=e=>{
     if(e.data?.type==='complete')finish('complete',e.data);
     else if(e.data?.type==='unavailable')finish(String(e.data.reason).slice(0,150));
    };
    tapBus.connect(recorder);recorder.connect(ctx.destination);
    // Do not let a 12 s clock started before addModule() cut off a 5.5 s
    // original-sample window when the browser's main thread is stalled.
    // This is an evidence recorder watchdog ONLY, not late audio permission.
    captureWatchdog=setTimeout(()=>finish('Audio-thread PCM capture timed out'),
     Math.max(20000,Math.ceil(seconds*1000)+12000));
   }).catch(error=>finish('Audio-thread PCM unavailable: '+String(error).slice(0,160)));
  });
 }

 function recordOriginalPcm(seconds=4,{source='mix'}={}){
  // Isolate only original D04 physical foley, not footfalls/rewards, for
   // the read-only PCM audit. Existing speaker mix and legacy tap are unchanged.
  if(source!=='mix'&&source!=='d04-combat-fx')
   return Promise.resolve({status:'UNAVAILABLE',reason:'Unknown original PCM capture bus'});
  if(source==='d04-combat-fx'&&!suppressCombat)
   return Promise.resolve({status:'UNAVAILABLE',reason:'D04 combat PCM requires opt-in D04 soundstage'});
  const tapBus=source==='d04-combat-fx'?physicalFoleyBus:master;
  if(disposed||!started||!enabled||ctx.state!=='running'||!master||
   !tapBus||!Number.isFinite(seconds)||seconds<.5||seconds>10||
   (!(source==='d04-combat-fx'&&typeof ctx.audioWorklet?.addModule==='function'&&
      typeof globalThis.AudioWorkletNode==='function')&&
    typeof ctx.createScriptProcessor!=='function')||pcmSession)
   return Promise.resolve({status:'UNAVAILABLE',reason:'Audio must be opted in, active, bounded and not already recording'});
  const sampleRate=ctx.sampleRate;
  if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>96000)
   return Promise.resolve({status:'UNAVAILABLE',reason:'Invalid live AudioContext sample rate'});
  // When consent-time worklet loading has ALREADY stalled over 12s, waiting
  // another 12s would only lose the real original-combat PCM window. Use
  // the existing live FX-only ScriptProcessor tap, if available, instead.
  // Timestamp gaps remain UNVERIFIED; this does not grant late impact sound.
  const stalledConsentModule=source==='d04-combat-fx'&&
   pcmWorkletModuleState==='LOADING'&&
   Number.isFinite(pcmWorkletModuleRequestedAtMs)&&
   Date.now()-pcmWorkletModuleRequestedAtMs>=12000;
  const mainThreadD04Fallback=stalledConsentModule&&
   typeof ctx.createScriptProcessor==='function';
  if(source==='d04-combat-fx'&&typeof ctx.audioWorklet?.addModule==='function'&&
   typeof globalThis.AudioWorkletNode==='function'&&!mainThreadD04Fallback)
   return recordD04CombatPcmWorklet(seconds,tapBus,sampleRate);
  // D04-only diagnostics need a live output path; legacy routing is unchanged.
  const directSilentD04Output=source==='d04-combat-fx';
  return new Promise(resolve=>{
   let recorder=null,silence=null,frames=0,sumSquares=0,peak=0,settled=false;
   let fallbackWatchdog=null;
   // AudioProcessingEvent.playbackTime anchors real PCM blocks on the
   // AudioContext clock. Neither audible onset nor video PTS follows.
   let pcmBlocks=0,timedBlocks=0,invalidClocks=0,discontinuities=0;
   let firstSampleContextSeconds=null,lastSampleEndContextSeconds=null;
   const chunks=[],maxFrames=Math.ceil(seconds*sampleRate);
   const finish=(reason='complete')=>{
    if(settled)return;settled=true;
    if(fallbackWatchdog!==null){clearTimeout(fallbackWatchdog);fallbackWatchdog=null}
    try{tapBus.disconnect(recorder)}catch{}
    try{recorder?.disconnect()}catch{}
    try{silence?.disconnect()}catch{}
    if(pcmSession?.finish===finish)pcmSession=null;
    if(reason!=='complete'||frames<Math.min(2048,maxFrames*.20)){
     resolve({status:'UNAVAILABLE',reason,frames,sampleRate});return;
    }
    const wav=new Uint8Array(44+frames*2),view=new DataView(wav.buffer);
    const ascii=(at,v)=>{for(let i=0;i<v.length;i++)view.setUint8(at+i,v.charCodeAt(i));};
    ascii(0,'RIFF');view.setUint32(4,wav.length-8,true);ascii(8,'WAVE');ascii(12,'fmt ');
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);
    ascii(36,'data');view.setUint32(40,frames*2,true);
    let offset=44;
    for(const chunk of chunks)for(let i=0;i<chunk.length;i++){
     view.setInt16(offset,chunk[i],true);offset+=2;
    }
    const rms=Math.sqrt(sumSquares/Math.max(1,frames));
    const clockStatus=invalidClocks>0||timedBlocks!==pcmBlocks?
     'UNVERIFIED_MISSING_OR_INVALID_CLOCK':
     discontinuities>0?'UNVERIFIED_NONCONTIGUOUS_CONTEXT_TIME':
      pcmBlocks>0?'CONTIGUOUS_CONTEXT_TIME_ONLY':'UNVERIFIED_MISSING_OR_INVALID_CLOCK';
    const validWindow=clockStatus==='CONTIGUOUS_CONTEXT_TIME_ONLY';
    resolve({status:peak>.0005&&rms>.0001?'RECORDED':'SILENT',
     sampleRate,channels:1,frames,durationSeconds:frames/sampleRate,
     captureBus:source==='d04-combat-fx'?'d04-combat-fx-pre-master':'original-master-mix',
     captureTopology:source==='d04-combat-fx'?'d04-original-foley-only-v1':'legacy-master-mix-v1',
     diagnosticFallbackFromStalledWorklet:mainThreadD04Fallback,
     pcmClock:{status:clockStatus,clock:'AudioProcessingEvent.playbackTime',
      blocks:pcmBlocks,discontinuities,invalidClocks,
      firstSampleContextSeconds:validWindow?firstSampleContextSeconds:null,
      lastSampleEndContextSeconds:validWindow?lastSampleEndContextSeconds:null},
     // Processor timestamps never certify actual decoded contact samples or
     // video-to-audio synchronization, even for a contiguous original stem.
     sampleSynchronized:false,
     bytes:wav.length,peak,rms,format:'PCM16_LE_WAV',wav});
   };
   try{
    recorder=ctx.createScriptProcessor(1024,1,1);
    if(directSilentD04Output){
     // A prunable zero-gain sink can starve original FX PCM under WebGL load.
     tapBus.connect(recorder);recorder.connect(ctx.destination);
    }else{
     silence=ctx.createGain();silence.gain.value=0;
     tapBus.connect(recorder);recorder.connect(silence);silence.connect(ctx.destination);
    }
    recorder.onaudioprocess=e=>{
     if(directSilentD04Output){
      let output=null;
      try{output=e?.outputBuffer?.getChannelData?.(0)}catch{}
      if(!output||typeof output.fill!=='function'){
       finish('D04 diagnostic output unavailable for guaranteed silence');return;
      }
      // Never echo original input into the audible destination.
      output.fill(0);
     }
     if(settled)return;
     const input=e.inputBuffer.getChannelData(0),length=Math.min(input.length,maxFrames-frames);
     if(length<=0){finish();return;}
     const playbackTime=e?.playbackTime;
     if(Number.isFinite(playbackTime)&&playbackTime>=0){
      if(timedBlocks===0)firstSampleContextSeconds=playbackTime;
      else if(lastSampleEndContextSeconds!==null&&
       Math.abs(playbackTime-lastSampleEndContextSeconds)>.002)discontinuities++;
      timedBlocks++;
      lastSampleEndContextSeconds=playbackTime+length/sampleRate;
     }else invalidClocks++;
     pcmBlocks++;
     const chunk=new Int16Array(length);
     for(let i=0;i<length;i++){
      const value=Math.max(-1,Math.min(1,Number.isFinite(input[i])?input[i]:0));
      sumSquares+=value*value;peak=Math.max(peak,Math.abs(value));
      chunk[i]=Math.round(value<0?value*32768:value*32767);
     }
     chunks.push(chunk);frames+=length;
     if(frames>=maxFrames)finish();
    };
    pcmSession={finish};
    // D04-only bounded original FX diagnostic, one processor, zero speaker
    // gain. Legacy master recording does not gain a new timer or route.
    if(source==='d04-combat-fx')fallbackWatchdog=setTimeout(
     ()=>finish('D04 main-thread PCM capture timed out'),
     Math.max(20000,Math.ceil(seconds*1000)+12000));
   }catch(e){finish('Audio capture processor unsupported: '+String(e));}
  });
 }
 function revokeCapture(){
  if(!capture)return;
  try{master?.disconnect(capture)}catch{}
  try{capture.disconnect?.()}catch{}
  for(const track of capture.stream?.getAudioTracks?.()||[])try{track.stop?.()}catch{}
  capture=null;
 }
 function disable(){
  pcmSession?.finish?.('Audio disabled during recording');
  enabled=false;pending.length=0;
  for(const voice of active)stopAndDisconnect(voice);
  active.length=0;
  if(master)automate(master.gain,0,.015);
  revokeCapture();
 }
 function acceptSnapshot(s){
  if(!s||disposed)return;
  if(previous&&(previous.run!==s.run||previous.floor!==s.floor))pending.length=0;
  const mood=planSoundMood(s);setMood(mood);
  const cues=planSoundCues(previous,s,(u,current)=>planVisualContact(u,current))
   .filter(c=>!suppressCombat||!D04_OWNED_LEGACY_COMBAT_CUES.has(c.kind));
  // Share the exact true-HP-loss / legal-sword-contact proof used by the skinned
  // hit reaction and physical debris. Melee contact waits for the blade; all
  // fatal, ranged, ambiguous and reduced-motion damage is audible immediately.
  const contactDelays=new Map(planAuthorityDamageBeats(previous,s).map(beat=>[
   beat.id,planVerifiedMeleeImpactDelay(beat,s,{reducedMotion})
  ]));
  // Keep only the public fields used by the next comparison; no giant snapshots.
  previous={
   tick:s.tick,run:s.run,floor:s.floor,
   units:(Array.isArray(s.units)?s.units:[]).slice(0,96).map(u=>({
    id:u.id,kind:u.kind,action:u.action,actionTick:u.actionTick,
    faction:u.faction,hp:u.hp,maxHp:u.maxHp,x:u.x,z:u.z,
     recoveryUntilTick:u.recoveryUntilTick
   })),
   bossWarning:s.bossWarning?{warning:s.bossWarning.warning,shape:s.bossWarning.shape,
    attackTick:s.bossWarning.attackTick,turnsUntilImpact:s.bossWarning.turnsUntilImpact}:null
  };
  if(enabled)for(const cue of cues){
   const delay=cue.kind==='impact'?(contactDelays.get(cue.actorId)??0):VISUAL_CONTACT_DELAYS[cue.kind];
   if(delay&&Number.isSafeInteger(cue.tick)&&cue.tick>=s.tick-3){
    if(pending.length>=MAX_PENDING_CONTACT){pending.shift();contactCuesDropped++;}
    pending.push({cue,remaining:delay});
   }else if(!delay)emit(cue);
   else contactCuesDropped++;
  }
 }
 // Same bounded visual clock drives imported rig actions and contact audio.
 function advanceVisualFrame(frameSeconds){
  if(!enabled||disposed||!started||ctx.state!=='running')return 0;
  const step=Number.isFinite(frameSeconds)?Math.min(.05,Math.max(0,frameSeconds)):0;
  if(!step)return 0;
  for(const item of pending)item.remaining-=step;
  const due=pending.filter(item=>item.remaining<=0).sort((a,b)=>
   (b.cue.priority||1)-(a.cue.priority||1)||a.cue.tick-b.cue.tick);
  let count=0;
  for(const item of due){
   const index=pending.indexOf(item);
   if(index!==-1)pending.splice(index,1);
   if(emit(item.cue)){contactCuesPlayed++;count++;}
  }
  return count;
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
   lastCue,masterGain:MASTER_GAIN,suppressCombat,
   d04PcmModuleState:suppressCombat?pcmWorkletModuleState:null,
   pendingContactCues:pending.length,contactCuesPlayed,contactCuesDropped,
   foley:foley?.stats()??null,engine:'original-synth-web-audio'
  };
 }
 function dispose(){
  if(disposed)return;
  disable();disposed=true;
  for(const bed of beds)try{bed.oscillator.stop()}catch{}
  for(const node of nodes)try{node.disconnect()}catch{}
  nodes.length=beds.length=0;cooldown.clear();previous=null;
 }
 return {enable,disable,acceptSnapshot,advanceVisualFrame,cueWelcome,footstep,captureStream,
  combatEffectsInput:()=>started&&enabled?(suppressCombat?physicalFoleyBus:fxBus):null,
  recordOriginalPcm,stats,dispose};
}
