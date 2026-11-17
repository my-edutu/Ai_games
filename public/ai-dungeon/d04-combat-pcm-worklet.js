'use strict';
/**
 * Opt-in D04 original combat FX PCM diagnostic. The browser's audio render
 * thread gathers samples even when the Three.js/main thread stalls.
 * This processor is silent and cannot invent an audible game outcome.
 */
class D04OriginalFoleyPcmProcessor extends AudioWorkletProcessor {
 constructor(options){
  super();
  const requested=options?.processorOptions?.frames;
  this.limit=Number.isSafeInteger(requested)&&requested>=2048&&requested<=960000?requested:0;
  this.samples=new Int16Array(this.limit);
  this.written=0;this.blocks=0;this.discontinuities=0;this.invalidClocks=0;
  this.firstFrame=null;this.expectedFrame=null;this.active=this.limit>0;this.awaitingStop=false;
  this.port.onmessage=e=>{if(e.data?.type==='stop')this.active=false};
 }
 process(inputs,outputs){
  for(const channel of outputs[0]??[])channel.fill(0);
  if(!this.active)return false;
  // Preserve the transferable PCM delivery until the main thread explicitly
  // acknowledges it; the browser may be inside a multi-second WebGL call.
  // The already-zeroed output remains silent and no further samples accrue.
  if(this.awaitingStop)return true;
  const source=inputs[0]?.[0];
  const quantum=outputs[0]?.[0]?.length??source?.length??128;
  if(!Number.isSafeInteger(quantum)||quantum<1||quantum>2048){
   this.active=false;this.port.postMessage({type:'unavailable',reason:'Invalid audio render quantum'});
   return false;
  }
  const frame=Number.isSafeInteger(currentFrame)&&currentFrame>=0?currentFrame:null;
  if(frame===null)this.invalidClocks++;
  else if(this.expectedFrame!==null&&frame!==this.expectedFrame)this.discontinuities++;
  if(this.firstFrame===null&&frame!==null)this.firstFrame=frame;
  this.expectedFrame=frame===null?null:frame+quantum;
  this.blocks++;
  const count=Math.min(quantum,this.limit-this.written);
  for(let i=0;i<count;i++){
   const sample=source?.[i],value=Number.isFinite(sample)?Math.max(-1,Math.min(1,sample)):0;
   this.samples[this.written+i]=Math.round(value<0?value*32768:value*32767);
  }
  this.written+=count;
  if(this.written===this.limit){
   this.awaitingStop=true;
   const buffer=this.samples.buffer;
   // A SINGLE bounded transfer, not thousands of main-thread audio events.
   this.port.postMessage({type:'complete',buffer,frames:this.written,
    firstFrame:this.firstFrame,blocks:this.blocks,invalidClocks:this.invalidClocks,
    discontinuities:this.discontinuities},[buffer]);
   return true;
  }
  return true;
 }
}
registerProcessor('d04-original-foley-pcm',D04OriginalFoleyPcmProcessor);
