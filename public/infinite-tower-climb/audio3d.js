// Original procedural soundtrack for the infinite ascent. No licensed recordings,
// no external streaming URLs, and no autoplay audio without user interaction.
export function createTowerAudio(){
  let ctx=null,master=null,wind=null,windFilter=null,droneA=null,droneB=null,
    droneGain=null,windGain=null,source=null,enabled=false,heard=new Set();
  const tones={foundry:[110,165],ruins:[130.81,196],clockwork:[146.83,220],
    storm:[98,146.83],void:[92.5,138.59]};
  function setup(){
    if(ctx)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)throw Error('Web Audio not available');
    ctx=new Audio();
    master=ctx.createGain();master.gain.value=.17;master.connect(ctx.destination);
    windGain=ctx.createGain();windGain.gain.value=.045;windGain.connect(master);
    const noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),out=noise.getChannelData(0);
    let seed=763271;
    for(let i=0;i<out.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;out[i]=(seed/2147483648-1)*.45;}
    source=ctx.createBufferSource();source.buffer=noise;source.loop=true;
    windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=950;
    source.connect(windFilter).connect(windGain);source.start();
    droneGain=ctx.createGain();droneGain.gain.value=.03;droneGain.connect(master);
    droneA=ctx.createOscillator();droneA.type='sine';droneA.frequency.value=110;
    droneB=ctx.createOscillator();droneB.type='triangle';droneB.frequency.value=165;
    droneA.connect(droneGain);droneB.connect(droneGain);
    droneA.start();droneB.start();
  }
  function eventTone(hz=.01,duration=.2,volume=.09){
    if(!ctx||ctx.state!=='running')return;
    const o=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
    o.type='sine';o.frequency.setValueAtTime(Math.max(40,hz),now);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,hz*.69),now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(gain).connect(master);o.start(now);o.stop(now+duration+.03);
    o.onended=()=>{o.disconnect();gain.disconnect();};
  }
  async function toggle(){
    if(!ctx)setup();
    if(enabled){await ctx.suspend();enabled=false;}
    else{await ctx.resume();enabled=true;}
    return enabled;
  }
  function update(state,events=[]){
    if(!enabled||!ctx)return;
    const biome=state.biome||state.theme||'foundry';
    const pair=tones[biome]||tones.foundry,now=ctx.currentTime;
    droneA.frequency.setTargetAtTime(pair[0],now,1.8);droneB.frequency.setTargetAtTime(pair[1],now,1.8);
    const motion=state.climbing||/WALL|JUMP|FALL/.test(state.mode||'');
    windGain.gain.setTargetAtTime(motion?.095:.04,now,.7);
    windFilter.frequency.setTargetAtTime(biome==='storm'?2200:biome==='void'?610:1150,now,1.2);
    for(const e of events.slice(-2)){
      if(!e?.id||heard.has(e.id))continue;
      heard.add(e.id);if(heard.size>150)heard.delete(heard.values().next().value);
      const type=e.type;
      if(type==='guardian-telegraph')eventTone(210,.65,.11);
      else if(type==='guardian-defeated')eventTone(720,.75,.17);
      else if(type==='wall-mantle'||type==='checkpoint')eventTone(520,.48,.13);
      else if(type==='biome')eventTone(390,.85,.13);
      else if(type==='recovery')eventTone(140,.51,.10);
    }
  }
  const dispose=async()=>{
    if(!ctx)return;await ctx.close();enabled=false;ctx=null;
  };
  return {toggle,update,dispose,get enabled(){return enabled},get supported(){
    return Boolean(typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext));
  },signature:'original-ambient-ascent-score-v1'};
}
