'use strict';
// This synthetic DOM exercises decoder presentation policy ONLY. It is not a
// Dungeon capture, encoded-pixel comparison or sound synchronization proof.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sampleChromiumDecodedD04WebM}=
 require('../browser/dungeon-d04-decoded-video-proof.cjs');

test('durationless original WebM decoder presents a visible bounded frame consumer before collecting pixels',async()=>{
 const timers=new Set(),frames=[.1,.32,.61,.95];
 let video=null,frameIndex=0,revoked=0;
 const schedule=(f,ms=0)=>{
  const id=setTimeout(()=>{timers.delete(id);f()},ms);timers.add(id);return id;
 };
 const events=new Map();
 video={
  style:{cssText:''},readyState:0,videoWidth:0,videoHeight:0,duration:Infinity,
  volume:1,muted:false,playsInline:false,preload:'',isConnected:false,
  addEventListener(name,cb){events.set(name,cb)},
  removeEventListener(name,cb){if(events.get(name)===cb)events.delete(name)},
  load(){
   if(!this.src)return;
   schedule(()=>{this.videoWidth=390;this.videoHeight=625;this.readyState=4;
    events.get('loadedmetadata')?.()},0);
  },
  getBoundingClientRect(){
   // Chromium may deprioritize requestVideoFrameCallback for offscreen video.
   const visible=/right:\s*\d+px/.test(this.style.cssText)&&
    !/left:\s*-/.test(this.style.cssText)&&
    /width:\s*2px/.test(this.style.cssText)&&
    /height:\s*2px/.test(this.style.cssText)&&
    /opacity:\s*1(?:;|$)/.test(this.style.cssText);
   return {width:visible?2:0,height:visible?2:0};
  },
  requestVideoFrameCallback(cb){this.frameCallback=cb;return ++this.frameCallbackId||1},
  cancelVideoFrameCallback(){this.frameCallback=null},
  play(){
   const rect=this.getBoundingClientRect();
   if(!this.isConnected||rect.width<2||rect.height<2)return Promise.resolve();
   const next=()=>{
    if(!this.frameCallback||!frames.length)return;
    const cb=this.frameCallback;this.frameCallback=null;
    frameIndex++;
    cb(0,{mediaTime:frames.shift()});
    schedule(next,5);
   };
   schedule(next,5);return Promise.resolve();
  },
  pause(){},
  removeAttribute(name){if(name==='src')this.src=''},
  remove(){this.isConnected=false}
 };
 const canvas={width:0,height:0,getContext:()=>({
  drawImage(){},
  getImageData(){
   const data=new Uint8ClampedArray(24*16*4);
   for(let i=0;i<data.length;i+=4){
    data[i]=(i/4+frameIndex*13)%256;
    data[i+1]=(i/4*2)%256;
    data[i+2]=((i/4)*3)%256;
    data[i+3]=255;
   }
   return {data};
  }
 })};
 const document={body:{appendChild(node){node.isConnected=true}},
  createElement(name){return name==='video'?video:canvas},
  visibilityState:'visible'};
 const bytes=Buffer.alloc(2400,88),input={
  source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',videoTracks:1,audioTracks:1,
  optedInAtStart:true,originalSoundstageTrackLive:true,
  bytes:bytes.length,base64:bytes.toString('base64'),
  framePump:{mode:'submitted-frame-request',observedFrameAdvances:5,
   requestedFrames:4,requestFailures:0}
 };
 const globals={document,URL:{createObjectURL:()=> 'blob:fixture',
  revokeObjectURL(){revoked++}},Blob:class{},atob: b64=>
  Buffer.from(b64,'base64').toString('binary'),setTimeout,clearTimeout};
 const fn=Function(...Object.keys(globals),'input',
  'return ('+sampleChromiumDecodedD04WebM.toString()+')(input)');
 try{
  const result=await fn(...Object.values(globals),input);
  assert.equal(result.status,'SAMPLED',
   'a post-capture visible 2px consumer must receive actual frame callbacks');
  assert.equal(result.samplingMode,'playback-frame-callback');
  assert.equal(result.samples.length,4);
  assert.equal(new Set(result.samples.map(x=>x.hash)).size,4);
  assert.equal(result.sampleSynchronized,false);
  assert.equal(video.isConnected,false,'decoder is detached after the bounded audition');
  assert.equal(revoked,1,'bounded Blob URL must be revoked');
 }finally{for(const id of timers)clearTimeout(id)}
});
