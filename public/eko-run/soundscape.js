// EKO RUN / ORIGINAL GENERATED AUDIO CUES
// Intentionally opt-in (no autoplay); bounded voice count and no copyrighted assets.
// Ambient city texture, subdued bass pulse, alert stingers and token celebrations.
export function createEkoSoundscape() {
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  let context=null,master=null,ambient=null,ambientSource=null,filter=null;
  let enabled=false,district='',sequenceKeys=new Set(),history=[],activeVoices=new Set();
  const cap=6;
  function ensure(){
    if(context)return;
    if(!Audio)throw new Error('AudioContext is unsupported');
    context=new Audio({latencyHint:'interactive'});
    master=context.createGain();master.gain.value=0;
    master.connect(context.destination);
    const samples=Math.max(2048,Math.floor(context.sampleRate*2));
    const buffer=context.createBuffer(1,samples,context.sampleRate);
    const data=buffer.getChannelData(0);let state=0x3a9e21cd;
    for(let i=0;i<samples;i++){
      // Generated stable low-level city hiss; one looping buffer, no random runtime signals.
      state^=state<<13;state^=state>>>17;state^=state<<5;
      data[i]=((state>>>0)/0xffffffff*2-1)*.42;
    }
    ambientSource=context.createBufferSource();ambientSource.buffer=buffer;ambientSource.loop=true;
    filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;
    ambient=context.createGain();ambient.gain.value=.036;
    ambientSource.connect(filter);filter.connect(ambient);ambient.connect(master);
    ambientSource.start();
  }
  function cue(pitch,type='sine',loud=.1,duration=.18,slide=.8){
    if(!enabled||!context||activeVoices.size>=cap)return;
    const now=context.currentTime;
    const tone=context.createOscillator(),volume=context.createGain();
    tone.type=type;
    tone.frequency.setValueAtTime(pitch,now);
    tone.frequency.exponentialRampToValueAtTime(Math.max(55,pitch*slide),now+duration);
    volume.gain.setValueAtTime(.0001,now);
    volume.gain.exponentialRampToValueAtTime(Math.max(.003,loud),now+.016);
    volume.gain.exponentialRampToValueAtTime(.0001,now+duration);
    tone.connect(volume);volume.connect(master);
    activeVoices.add(tone);
    tone.onended=()=>{tone.disconnect();volume.disconnect();activeVoices.delete(tone)};
    tone.start(now);tone.stop(now+duration+.025);
  }
  function play(type){
    if(!enabled)return;
    switch(type){
      case 'player.jumped':cue(340,'triangle',.09,.18,1.48);break;
      case 'player.landed':cue(138,'triangle',.09,.14,.52);break;
      case 'player.slid':cue(270,'sine',.05,.12,.65);break;
      case 'player.vaulted':cue(400,'triangle',.07,.20,1.36);break;
      case 'hazard.warned':cue(260,'triangle',.075,.16,.78);break;
      case 'hazard.hit':cue(95,'sawtooth',.11,.33,.47);break;
      case 'hazard.resolved':cue(440,'sine',.09,.17,1.2);break;
      case 'token.collected':cue(630,'sine',.10,.18,1.32);break;
      case 'checkpoint.reached':cue(520,'triangle',.12,.30,1.65);break;
      case 'district.completed':cue(660,'sine',.13,.35,1.70);break;
    }
  }
  function ingest(events,runId){
    if(!Array.isArray(events))return;
    for(const e of events){
      if(!Number.isInteger(e?.sequence))continue;
      const id=runId+':'+e.sequence;
      if(sequenceKeys.has(id))continue;
      sequenceKeys.add(id);history.push(id);
      while(history.length>128)sequenceKeys.delete(history.shift());
      play(e.type);
    }
  }
  function theme(id){
    if(district===id)return;
    district=id;
    if(!context||!filter)return;
    const now=context.currentTime;
    const cutoff=id==='island-night'?200:id==='rainy-lagos'?940:id==='market-rush'?620:420;
    filter.frequency.setTargetAtTime(cutoff,now,.35);
    if(ambient)ambient.gain.setTargetAtTime(id==='rainy-lagos'?.05:.03,now,.3);
  }
  async function setEnabled(value){
    enabled=Boolean(value);
    if(enabled){
      try{
        ensure();await context.resume();
        master.gain.setTargetAtTime(.15,context.currentTime,.06);
        theme(district);
      }catch(err){enabled=false;throw err;}
    }else if(master){
      master.gain.setTargetAtTime(0,context.currentTime,.06);
    }
    return enabled;
  }
  return Object.freeze({
    setEnabled,ingest,theme,
    get enabled(){return enabled;},
    get status(){return !Audio?'unsupported':enabled?'playing':'muted';},
    dispose(){
      enabled=false;
      if(ambientSource){try{ambientSource.stop()}catch{}ambientSource.disconnect();}
      if(context)context.close().catch(()=>{});
      context=master=ambientSource=ambient=filter=null;
      activeVoices.clear();sequenceKeys.clear();history=[];
    }
  });
}
