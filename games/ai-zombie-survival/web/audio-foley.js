// Generative spatial foley for autonomous livestreams. No remote audio or copyrighted samples.
export function spatialVolume(x,z,cx,cz){
  const distance=Math.hypot(x-cx,z-cz);
  return Math.max(0,Math.min(1,1/(1+(distance/12)**2)));
}
export function eventSound(type){
  return ({
    shot:{band:'crack',volume:.11,seconds:.15},
    hit:{band:'impact',volume:.10,seconds:.16},
    kill:{band:'impact',volume:.075,seconds:.21},
    'barricade-hit':{band:'impact',volume:.12,seconds:.28},
    'barricade-repair':{band:'metal',volume:.06,seconds:.15},
    rescue:{band:'success',volume:.08,seconds:.46},
    'civilian-found':{band:'success',volume:.06,seconds:.29},
    horde:{band:'growl',volume:.12,seconds:.65},
    'near-death':{band:'alarm',volume:.10,seconds:.75},
    'safehouse-upgrade':{band:'success',volume:.09,seconds:.48},
    heal:{band:'success',volume:.06,seconds:.32}
  })[type]||null;
}
export function createSpatialFoley(ctx,master){
  const sampleRate=ctx.sampleRate,buffer=ctx.createBuffer(1,sampleRate, sampleRate);
  const values=buffer.getChannelData(0);
  let random=0x3a7f23c9;
  // Deterministic procedural broadband noise buffer, not a loaded audio asset.
  for(let i=0;i<values.length;i++){
    random^=random<<13;random^=random>>>17;random^=random<<5;
    values[i]=((random>>>0)/0xffffffff)*2-1;
  }
  const weatherGain=ctx.createGain();weatherGain.gain.value=.0001;weatherGain.connect(master);
  const windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=680;
  windFilter.connect(weatherGain);
  const ambience=ctx.createBufferSource();ambience.buffer=buffer;ambience.loop=true;
  ambience.connect(windFilter);ambience.start();
  let voiceCount=0,lastReset=0,disposed=false;
  function update(kind,intensity=0){
    if(disposed)return;
    const at=ctx.currentTime;
    const wet=kind==='storm'?.13:kind==='rain'?.08:kind==='fog'?.028:.009;
    weatherGain.gain.setTargetAtTime(wet*Math.max(.35,Math.min(1,intensity||0)),at,.33);
    windFilter.frequency.setTargetAtTime(kind==='storm'?1600:kind==='rain'?1150:420,at,.4);
  }
  function play(e,focusX,focusZ){
    if(disposed)return false;
    const plan=eventSound(e.type);if(!plan)return false;
    if(ctx.currentTime-lastReset>1){voiceCount=0;lastReset=ctx.currentTime;}
    if(voiceCount>=16)return false;voiceCount++;
    const at=ctx.currentTime,duration=plan.seconds;
    const vol=plan.volume*spatialVolume(e.x??focusX,e.y??focusZ,focusX,focusZ);
    if(vol<.002)return false;
    const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(vol,at+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
    if(pan){
      const normalized=Math.max(-1,Math.min(1,((e.x??focusX)-focusX)/24));
      pan.pan.setValueAtTime(normalized,at);gain.connect(pan);pan.connect(master);
    }else gain.connect(master);
    if(['crack','impact','metal','growl'].includes(plan.band)){
      const noise=ctx.createBufferSource();noise.buffer=buffer;
      const filter=ctx.createBiquadFilter();filter.type=plan.band==='growl'?'lowpass':'bandpass';
      filter.frequency.setValueAtTime(plan.band==='crack'?2600:plan.band==='metal'?1950:plan.band==='impact'?700:185,at);
      filter.Q.value=plan.band==='metal'?1.5:.64;
      noise.connect(filter);filter.connect(gain);
      noise.start(at,0);noise.stop(at+duration+.025);
      noise.onended=()=>{try{noise.disconnect();filter.disconnect();gain.disconnect();pan?.disconnect()}catch{}};
    }else{
      const oscillator=ctx.createOscillator();oscillator.type=plan.band==='alarm'?'sawtooth':'triangle';
      oscillator.frequency.setValueAtTime(plan.band==='alarm'?550:490,at);
      oscillator.frequency.exponentialRampToValueAtTime(plan.band==='alarm'?290:790,at+duration);
      oscillator.connect(gain);oscillator.start(at);oscillator.stop(at+duration+.025);
      oscillator.onended=()=>{try{oscillator.disconnect();gain.disconnect();pan?.disconnect()}catch{}};
    }
    return true;
  }
  return {update,play,dispose(){
    disposed=true;try{ambience.stop();ambience.disconnect();windFilter.disconnect();weatherGain.disconnect()}catch{}
  }};
}
