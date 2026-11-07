/**
 * Original, bounded procedural material transients for REAL Dungeon events.
 * Seeded sample noise is generated once after explicit spectator sound opt-in.
 * A stone footstep, metal strike or Warden impact now contains an actual
 * filtered transient instead of only a single pure oscillator beep.
 * No external samples, random gameplay draws, network requests or WebGL work.
 */
const MATERIALS=Object.freeze({
 footstep:{hz:290,peak:.072,length:.105,type:'lowpass'},
 weapon:{hz:1620,peak:.054,length:.135,type:'bandpass'},
 ranged:{hz:1950,peak:.028,length:.095,type:'bandpass'},
 impact:{hz:410,peak:.082,length:.165,type:'lowpass'},
 block:{hz:2200,peak:.062,length:.11,type:'bandpass'},
 trap:{hz:660,peak:.043,length:.20,type:'lowpass'},
 boss:{hz:190,peak:.07,length:.27,type:'lowpass'},
 warning:{hz:430,peak:.027,length:.29,type:'bandpass'},
 unseal:{hz:820,peak:.051,length:.31,type:'bandpass'},
 defeat:{hz:195,peak:.035,length:.37,type:'lowpass'}
});
const finite=(n,lo,hi,otherwise)=>Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):otherwise;
export function createMaterialFoley(ctx){
 if(!ctx||typeof ctx.createBuffer!=='function'||typeof ctx.createBufferSource!=='function')return null;
 const hz=finite(ctx.sampleRate,22050,96000,48000),count=Math.min(8192,Math.max(256,Math.floor(hz*.17)));
 let buffer;
 try{
  buffer=ctx.createBuffer(1,count,hz);
  const samples=buffer.getChannelData(0);let seed=0xa83ef29b;
  for(let i=0;i<count;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const t=i/count,decay=(1-t)*(1-t);
   samples[i]=((seed/4294967296)*2-1)*decay;
  }
 }catch{return null}
 let synthesized=0,skipped=0;
 function emit(kind,at,bus,tick=0){
  const recipe=MATERIALS[kind];if(!recipe||!bus)return null;
  let source=null,gain=null,filter=null;
  try{
   source=ctx.createBufferSource();source.buffer=buffer;
   const rate=1+((Number.isSafeInteger(tick)?tick:0)%7)*.011;
   if(source.playbackRate)source.playbackRate.value=rate;
   gain=ctx.createGain();gain.gain.setValueAtTime(.0001,at);
   gain.gain.exponentialRampToValueAtTime(recipe.peak,at+.011);
   gain.gain.exponentialRampToValueAtTime(.0001,at+recipe.length);
   if(typeof ctx.createBiquadFilter==='function'){
    filter=ctx.createBiquadFilter();filter.type=recipe.type;
    filter.frequency.value=recipe.hz;filter.Q.value=recipe.type==='bandpass'?.74:.55;
    source.connect(filter);filter.connect(gain);
   }else source.connect(gain);
   gain.connect(bus);source.start(at);source.stop(at+recipe.length+.016);
   synthesized++;
   let released=false;
   return {stop(){if(released)return;released=true;
    try{source.stop()}catch{}try{source.disconnect()}catch{}
    try{filter?.disconnect()}catch{}try{gain.disconnect()}catch{}
   }};
  }catch{
   try{source?.stop()}catch{}try{source?.disconnect()}catch{}
   try{filter?.disconnect()}catch{}try{gain?.disconnect()}catch{}
   skipped++;return null;
  }
 }
 return {emit,stats:()=>({materialSynthesis:'original-seeded-foley',sampleCount:count,events:synthesized,failed:skipped})};
}
