// Opt-in, bounded procedural spatial sound. All sound is cosmetic, never authority.
// Browser autoplay is respected: the user must explicitly unlock AudioContext.
export function createTowerSound(win){
  let ctx=null,master=null,ambience=null,ambientGain=null,theme='foundry',enabled=false;
  const active=new Set(),seen=new Set();
  let listenerX=0,listenerZ=0;
  const colors={foundry:61.74,ruins:92.5,clockwork:73.42,storm:55.0,void:46.25};
  function ensure(){
    if(ctx)return true;
    const AudioContext=win.AudioContext||win.webkitAudioContext;
    if(!AudioContext)return false;
    ctx=new AudioContext();
    master=ctx.createGain();master.gain.value=.18;master.connect(ctx.destination);
    ambience=ctx.createOscillator();ambience.type='sine';ambience.frequency.value=colors[theme];
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=190;
    ambientGain=ctx.createGain();ambientGain.gain.value=.04;
    ambience.connect(filter);filter.connect(ambientGain);ambientGain.connect(master);
    ambience.start();
    return true;
  }
  async function enable(){
    if(!ensure())return false;
    await ctx.resume();enabled=ctx.state==='running';
    return enabled;
  }
  function setTheme(next){
    if(!(next in colors)||theme===next)return;
    theme=next;
    if(ambience&&ctx)ambience.frequency.setTargetAtTime(colors[next],ctx.currentTime,.55);
  }
  function effect(freq,duration,{type='sine',gain=.12,detune=0,x=0,z=0,sweep=0}={}){
    if(!enabled||!ctx||active.size>=12)return;
    const osc=ctx.createOscillator(),amp=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),ctx.currentTime);
    if(sweep)osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq+sweep),ctx.currentTime+duration);
    osc.detune.value=detune;
    const distance=Math.hypot((x-listenerX)*.08,(z-listenerZ)*.08);
    const level=Math.min(.2,gain)/(1+distance*.35);
    amp.gain.setValueAtTime(.0001,ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0001,level),ctx.currentTime+.018);
    amp.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    let stereo=null;
    if(typeof ctx.createStereoPanner==='function'){
      stereo=ctx.createStereoPanner();
      stereo.pan.value=Math.max(-.7,Math.min(.7,(x-listenerX)*.055));
      osc.connect(amp);amp.connect(stereo);stereo.connect(master);
    }else{osc.connect(amp);amp.connect(master)}
    osc.start();osc.stop(ctx.currentTime+duration+.025);
    active.add(osc);
    osc.onended=()=>{active.delete(osc);osc.disconnect();amp.disconnect();if(stereo)stereo.disconnect()};
  }
  const cues={
    'run-start':()=>effect(164,.7,{type:'triangle',sweep:100,gain:.08}),
    'checkpoint':()=>{effect(440,.28,{type:'sine',gain:.09});effect(660,.34,{type:'sine',gain:.06})},
    'moving-platform':()=>effect(290,.18,{type:'triangle',sweep:130,gain:.04}),
    'precision-landing':()=>effect(355,.24,{type:'sine',sweep:80,gain:.07}),
    'unstable-ground':()=>effect(112,.55,{type:'sawtooth',sweep:-64,gain:.06}),
    'guardian-telegraph':()=>effect(180,.62,{type:'sawtooth',sweep:430,gain:.09}),
    'guardian-evaded':()=>effect(850,.19,{type:'triangle',sweep:-200,gain:.05}),
    'guardian-hit':()=>effect(160,.37,{type:'sawtooth',sweep:-90,gain:.12}),
    'guardian-defeated':()=>{effect(262,.44,{gain:.11});effect(392,.65,{gain:.09})},
    'recovery-item':()=>effect(600,.34,{type:'sine',sweep:360,gain:.06}),
    'upgrade':()=>effect(520,.36,{type:'triangle',sweep:240,gain:.09}),
    'biome':()=>effect(185,.75,{type:'sine',sweep:80,gain:.035}),
    'updraft':()=>effect(340,.44,{type:'triangle',sweep:310,gain:.04}),
    'recovery':()=>effect(90,.8,{type:'sine',sweep:-25,gain:.08})
  };
  function consume(events=[],player={}){
    listenerX=Number(player.x)||0;listenerZ=Number(player.z)||0;
    for(const event of events){
      if(seen.has(event.id))continue;
      seen.add(event.id);
      if(seen.size>180)seen.clear();
      if(enabled&&cues[event.type])cues[event.type]();
    }
  }
  function status(){return {enabled,activeSources:active.size,theme,audioState:ctx?.state||'locked'};}
  function dispose(){if(ambience){ambience.stop();ambience.disconnect()}if(ctx){void ctx.close()}active.clear();seen.clear();enabled=false;}
  return {enable,setTheme,consume,status,dispose};
}
