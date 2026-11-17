// IIFE scope prevents global lexical declarations colliding with the main 2D application.
(()=>{
'use strict';
// Procedural audio uses only published, idempotent public presentation cues.
// Audio requires deliberate user activation, or an opt-in ?audio=1 browser source.
const soundParams=new URLSearchParams(location.search);
const button=document.getElementById('sound-toggle');
let audio=null;
let master=null;
let ambience=[];
let lastMoveAt=0;
let lastDangerAt=0;
const heard=new Set();
const order=[];
const isMuted=soundParams.get('muted')==='1';
const soundAllowed=!isMuted&&('AudioContext' in window||'webkitAudioContext' in window);
function setLabel(){
  if(!button)return;
  button.textContent=isMuted?'MUTED':audio?.state==='running'?'SOUND ON':'ENABLE SOUND';
  button.setAttribute('aria-pressed',String(audio?.state==='running'));
  button.disabled=isMuted||!soundAllowed;
}
function tone(frequency,seconds,volume=.06,type='sine',delay=0){
  if(!audio||audio.state!=='running')return;
  const now=audio.currentTime+delay;
  const osc=audio.createOscillator();
  const gain=audio.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(frequency,now);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.015);
  gain.gain.exponentialRampToValueAtTime(.0001,now+seconds);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now+seconds+.02);
}
function rumble(seconds,volume=.025,cutoff=340){
  if(!audio||audio.state!=='running')return;
  const sampleRate=audio.sampleRate,length=Math.floor(sampleRate*Math.min(seconds,1.5));
  const buffer=audio.createBuffer(1,length,sampleRate),out=buffer.getChannelData(0);
  let phase=0;
  for(let i=0;i<length;i++){
    // Deterministic procedural noise, not a buffered sound effect asset.
    const n=Math.sin((i+1)*12.9898)*43758.5453;
    const white=(n-Math.floor(n))-.5;
    phase=phase*.91+white*.09;
    out[i]=phase;
  }
  const src=audio.createBufferSource();src.buffer=buffer;
  const low=audio.createBiquadFilter();low.type='lowpass';low.frequency.value=cutoff;
  const env=audio.createGain();const now=audio.currentTime;
  env.gain.setValueAtTime(.0001,now);
  env.gain.linearRampToValueAtTime(volume,now+.025);
  env.gain.exponentialRampToValueAtTime(.0001,now+Math.max(.09,seconds));
  src.connect(low).connect(env).connect(master);
  src.start(now);src.stop(now+Math.min(seconds,1.5));
}
function playCue(cue){
  if(!audio||audio.state!=='running')return;
  const at=performance.now();
  switch(cue){
    case 'move':
      if(at-lastMoveAt<280)return;
      lastMoveAt=at;rumble(.075,.013,260);break;
    case 'key-collected':
      tone(660,.22,.065,'sine');tone(880,.28,.055,'sine',.12);tone(1175,.43,.037,'sine',.23);break;
    case 'door-opened':
      rumble(.65,.047,140);tone(179,.56,.04,'triangle');tone(330,.2,.04,'sine',.35);break;
    case 'threat-near':
      if(at-lastDangerAt<1600)return;
      lastDangerAt=at;tone(89,.63,.07,'sawtooth');tone(74,.5,.03,'sine',.1);break;
    case 'trap-triggered':rumble(.58,.065,510);tone(86,.46,.07,'triangle');break;
    case 'checkpoint':
    case 'clue-discovered':tone(420,.26,.034,'sine');tone(633,.38,.027,'sine',.11);break;
    case 'result':tone(392,.35,.04);tone(523,.35,.055,'sine',.24);tone(784,.6,.06,'sine',.49);break;
    case 'restart':tone(220,.3,.035,'triangle');break;
  }
}
async function activate(){
  if(!soundAllowed)return;
  try{
    if(!audio){
      const Context=window.AudioContext||window.webkitAudioContext;
      audio=new Context();
      master=audio.createGain();master.gain.value=.28;
      const limiter=audio.createDynamicsCompressor();
      limiter.threshold.value=-16;limiter.knee.value=16;
      limiter.ratio.value=8;limiter.attack.value=.008;limiter.release.value=.2;
      master.connect(limiter).connect(audio.destination);
      // The quiet tension bed is harmonically original and continues on unattended streams.
      for(const [pitch,gainValue,type] of [[55,.011,'sine'],[82.41,.006,'sine'],[110.25,.003,'triangle']]){
        const osc=audio.createOscillator(),gain=audio.createGain();
        osc.type=type;osc.frequency.value=pitch;
        gain.gain.value=gainValue;
        osc.connect(gain).connect(master);osc.start();
        ambience.push({osc,gain});
      }
    }
    await audio.resume();
  }catch{ /* blocked audio is deliberately silent; captions remain available */ }
  setLabel();
}
if(button){
  button.addEventListener('click',activate);
  setLabel();
}
window.addEventListener('maze:frame',event=>{
  const frame=event.detail;
  if(!frame?.audio||!audio||audio.state!=='running')return;
  const messages=frame.audio.voices||[];
  for(const item of messages){
    const key=frame.snapshot?.runToken+':'+String(item.id);
    if(heard.has(key))continue;
    heard.add(key);order.push(key);
    if(order.length>300)heard.delete(order.shift());
    playCue(String(item.cue));
  }
});
window.addEventListener('pagehide',()=>{
  for(const item of ambience)item.osc.stop();
  if(audio)audio.close();
},{once:true});
if(soundParams.get('audio')==='1'&&!isMuted)activate();

})();
