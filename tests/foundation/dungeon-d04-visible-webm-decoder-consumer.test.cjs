'use strict';
// This synthetic DOM exercises decoder presentation policy ONLY. It is not a
// Dungeon capture, encoded-pixel comparison or sound synchronization proof.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sampleChromiumDecodedD04WebM,classifyChromiumDecodedRealWebM}=
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


test('finite-duration original WebM falls back to muted decoded playback when seeks never complete',async()=>{
 // Chromium sometimes exposes a finite duration yet cannot seek its sparse
 // MediaRecorder VP8 cluster. This synthetic DOM models that failure, not a
 // rendered Dungeon contact, decoded PCM or audiovisual synchronization.
 const events=new Map(),pending=new Set(),mediaTimes=[.12,.36,.74,1.18];
 let frame=0,revocations=0,plays=0,draws=0,seekAttempts=0;
 const schedule=(fn,ms=0)=>{
  const timer=setTimeout(()=>{pending.delete(timer);fn()},Math.min(ms,120));
  pending.add(timer);return timer;
 };
 const cancel=timer=>{pending.delete(timer);clearTimeout(timer)};
 const video={
  src:'',isConnected:false,readyState:0,videoWidth:0,videoHeight:0,
  duration:2.4,muted:false,volume:1,style:{cssText:''},
  _currentTime:0,frameCallback:null,
  get currentTime(){return this._currentTime},
  set currentTime(value){this._currentTime=value;seekAttempts++},
  addEventListener(name,fn){events.set(name,fn)},
  removeEventListener(name,fn){if(events.get(name)===fn)events.delete(name)},
  getBoundingClientRect(){return {width:this.style.cssText.includes('width:2px')?2:0,
   height:this.style.cssText.includes('height:2px')?2:0}},
  load(){
   if(!this.src)return;
   schedule(()=>{this.readyState=4;this.videoWidth=390;this.videoHeight=844;
    events.get('loadedmetadata')?.()},0);
  },
  requestVideoFrameCallback(fn){this.frameCallback=fn;return ++this.callbackSerial||1},
  cancelVideoFrameCallback(){this.frameCallback=null},
  play(){
   plays++;
   const step=()=>{
    if(!this.frameCallback||mediaTimes.length===0)return;
    const fn=this.frameCallback;this.frameCallback=null;frame++;
    fn(0,{mediaTime:mediaTimes.shift()});
    schedule(step,5);
   };
   schedule(step,5);return Promise.resolve();
  },
  pause(){},
  removeAttribute(name){if(name==='src')this.src=''},
  remove(){this.isConnected=false}
 };
 const canvas={getContext:()=>({
  drawImage(){draws++},
  getImageData(){
   const data=new Uint8ClampedArray(24*16*4);
   for(let i=0;i<data.length;i+=4){
    data[i]=((i/4)+frame*19)%256;
    data[i+1]=((i/4)*3)%256;
    data[i+2]=((i/4)*7)%256;data[i+3]=255;
   }
   return {data};
  }
 })};
 const document={visibilityState:'visible',
  body:{appendChild(node){node.isConnected=true}},
  createElement(name){return name==='video'?video:canvas}};
 const binary=Buffer.alloc(2400,37);
 const input={
  source:'real-canvas-plus-opted-in-soundstage',status:'RECORDED',
  mimeType:'video/webm;codecs=vp8,opus',videoTracks:1,audioTracks:1,
  optedInAtStart:true,originalSoundstageTrackLive:true,
  bytes:binary.length,base64:binary.toString('base64'),
  framePump:{mode:'submitted-frame-request',requestedFrames:4,
   observedFrameAdvances:5,requestFailures:0}
 };
 const globals={document,URL:{createObjectURL:()=> 'blob:finite-seek-fixture',
   revokeObjectURL(){revocations++}},Blob:class{},
  atob:value=>Buffer.from(value,'base64').toString('binary'),
  setTimeout:schedule,clearTimeout:cancel};
 const isolated=Function(...Object.keys(globals),'input',
  'return ('+sampleChromiumDecodedD04WebM.toString()+')(input)');
 try{
  const proof=await isolated(...Object.values(globals),input);
  assert.equal(seekAttempts,2,'stop seeking after two bounded misses');
  assert.equal(plays,1,'the authentic WebM is decoded muted at most once');
  assert.equal(video.muted,true,'browser playback must not audibly emit the original soundtrack');
  assert.equal(video.volume,0);
  assert.equal(proof.status,'SAMPLED');
  assert.equal(proof.samplingMode,'playback-frame-callback');
  assert.equal(proof.durationSeconds,2.4,'finite duration is still recorded truthfully');
  assert.equal(proof.samples.length,4);
  assert.ok(draws>=4);
  assert.equal(classifyChromiumDecodedRealWebM(input,proof).classification,
   'BROWSER_DECODED_MOVING_PIXELS_UNALIGNED');
  assert.equal(proof.sampleSynchronized,false);
  assert.equal(video.isConnected,false,'all post-capture DOM is removed');
  assert.equal(revocations,1,'the bounded WebM URL is released');
 }finally{for(const timer of pending)cancel(timer)}
});
