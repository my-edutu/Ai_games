'use strict';
// D04-only evidence decoder. A WebM byte count is not a moving combat clip:
// Chromium produced a 14,055-byte, single-frame VP8 WebM on 11 Nov 2026.
function decodeProvenancedWebGLMotion(video={},acceptedSource,decoderSource){
 const base={source:decoderSource,method:'framemd5-24x16-first-64'};
 if(video.source!==acceptedSource||video.status!=='RECORDED'||
  typeof video.base64!=='string')
  return {...base,status:'UNAVAILABLE',reason:'No authenticated serial WebGL video'};
 const bytes=Buffer.from(video.base64,'base64');
 if(bytes.length!==video.bytes||bytes.length<=1024||bytes.length>20*1024*1024)
  return {...base,status:'UNAVAILABLE',reason:'Source video bytes invalid or out of budget'};
 const {spawnSync}=require('node:child_process');
 const opts={input:bytes,encoding:'utf8',timeout:12000,maxBuffer:256*1024};
 try{
  const probe=spawnSync('ffprobe',['-v','error','-select_streams','v:0',
   '-show_entries','stream=codec_name','-of','default=nw=1:nk=1','pipe:0'],opts);
  const codec=typeof probe.stdout==='string'?probe.stdout.trim():'';
  if(probe.status!==0||codec!=='vp8')
   return {...base,status:'UNAVAILABLE',reason:'Verified VP8 stream unavailable'};
  const run=spawnSync('ffmpeg',['-nostdin','-hide_banner','-loglevel','error',
   '-threads','1','-i','pipe:0','-map','0:v:0','-vf','scale=24:16',
   '-frames:v','64','-f','framemd5','pipe:1'],opts);
  if(run.status!==0||typeof run.stdout!=='string')
   return {...base,status:'UNAVAILABLE',reason:'Decoded thumbnail inspection unavailable'};
  const hashes=[];
  for(const line of run.stdout.split('\n')){
   const match=/^0,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*\d+,\s*([a-f0-9]{32})\s*$/.exec(line);
   if(match)hashes.push(match[1]);
  }
  if(hashes.length<1||hashes.length>64)
   return {...base,status:'UNAVAILABLE',reason:'No bounded decoded frames'};
  return {...base,status:'DECODED',codec,frameCount:hashes.length,
   distinctFrames:new Set(hashes).size,hashes};
 }catch(e){
  return {...base,status:'UNAVAILABLE',reason:'Video decoder unavailable: '+String(e).slice(0,100)};
 }
}
function decodeSerialRealWebGLMotion(video={}){
 return decodeProvenancedWebGLMotion(video,
  'real-webgl-canvas-serial-video-only',
  'ffmpeg-decoded-real-webgl-serial-video');
}
function decodeReceiptReadbackMotion(video={}){
 if(video.videoTracks!==1||video.audioTracks!==0)
  return {source:'ffmpeg-decoded-real-webgl-receipt-readback-video',
   method:'framemd5-24x16-first-64',status:'UNAVAILABLE',
   reason:'Not a single video-only real WebGL readback stream'};
 return decodeProvenancedWebGLMotion(video,
  'real-webgl-receipt-readback-serial-video-only',
  'ffmpeg-decoded-real-webgl-receipt-readback-video');
}
/**
 * A same-recorder soundstage track is NOT sample-accurate contact evidence.
 * Only decode it when its source is the authenticated receipt-gated real
 * WebGL transport and the actual encoded audio stream is Opus.
 */
function decodeSameWindowReadbackMotion(video={}){
 const source='ffmpeg-decoded-real-webgl-receipt-readback-original-audio';
 const method='framemd5-24x16-first-64';
 if(video.videoTracks!==1||video.audioTracks!==1||
  video.optedInAtStart!==true||video.originalSoundstageTrackLive!==true)
  return {source,method,status:'UNAVAILABLE',reason:'Missing opted-in original soundstage track'};
 const parsed=decodeProvenancedWebGLMotion(video,
  'real-webgl-receipt-readback-serial-original-audio',source);
 if(parsed.status!=='DECODED')return parsed;
 try{
  const {spawnSync}=require('node:child_process');
  const bytes=Buffer.from(video.base64,'base64');
  const probe=spawnSync('ffprobe',['-v','error','-select_streams','a:0',
   '-show_entries','stream=codec_name','-of','default=nw=1:nk=1','pipe:0'],
   {input:bytes,encoding:'utf8',timeout:12000,maxBuffer:256*1024});
  if(probe.status!==0||typeof probe.stdout!=='string'||probe.stdout.trim()!=='opus')
   return {source,method,status:'UNAVAILABLE',reason:'Original Opus encoded stream missing'};
  return {...parsed,audioCodec:'opus'};
 }catch{
  return {source,method,status:'UNAVAILABLE',reason:'Audio decoder unavailable'};
 }
}

/**
 * Backup for runners without ffprobe/ffmpeg. Decode the SAME bounded original
 * VP8/Opus WebM with Chromium's native <video>, seek to four bounded times,
 * and hash the ACTUALLY decoded 24x16 pixels. A sampled seek is not a counted
 * video frame, contact PTS, audible foley onset or playback-performance pass.
 *
 * Only the function body is serialized into page.evaluate, not
 * its Node module closure. Do not draw to the Dungeon WebGL canvas.
 */
/**
 * Only two real, bounded capture routes may enter Chromium's pixel decoder:
 * the frame-acknowledged primary canvas + opted-in ORIGINAL soundstage, or
 * the separately verified real WebGL receipt readback in the same audio
 * window. Synthetic positive controls never qualify. Neither source gives
 * video PTS, audible onset or synchronized contact evidence.
 */
function authenticatedOriginalD04WebM(input){
 const common=input?.status==='RECORDED'&&input.videoTracks===1&&
  input.audioTracks===1&&input.optedInAtStart===true&&
  input.originalSoundstageTrackLive===true&&
  Number.isSafeInteger(input.bytes)&&input.bytes>1024&&
  input.bytes<=4*1024*1024;
 if(!common)return false;
 if(input.source==='real-webgl-receipt-readback-serial-original-audio')
  return true;
 if(input.source!=='real-canvas-plus-opted-in-soundstage'||
  !/^video\/webm;codecs=vp8,opus$/i.test(input.mimeType||''))return false;
 const pump=input.framePump;
 if(!pump||pump.requestFailures!==0||
  !Number.isSafeInteger(pump.observedFrameAdvances)||
  pump.observedFrameAdvances<1||pump.observedFrameAdvances>2048||
  !Number.isSafeInteger(pump.requestedFrames)||
  pump.requestedFrames<0||pump.requestedFrames>2048)return false;
 return pump.mode==='submitted-frame-request'&&
  pump.requestedFrames>0&&pump.requestedFrames<=pump.observedFrameAdvances||
  pump.mode==='native-capture-stream'&&pump.requestedFrames===0;
}
/**
 * Prefer the separately authenticated original readback, but never let a
 * RECORDED label on an invalid/unfinished serial diagnostic obscure the
 * real opted-in primary WebGL canvas + original soundstage recording.
 * Selection alone makes no pixel, timing or PCM synchronization claim.
 */
function selectAuthenticatedOriginalD04WebM(serialAV,primaryAV){
 if(authenticatedOriginalD04WebM(serialAV))return serialAV;
 if(authenticatedOriginalD04WebM(primaryAV))return primaryAV;
 return null;
}
async function sampleChromiumDecodedD04WebM(input){
 const source='chromium-decoded-real-webgl-original-webm';
 const fail=reason=>({source,status:'UNAVAILABLE',reason:String(reason).slice(0,160),
  sampleSynchronized:false});
 // This function is serialized ALONE into the page, without module helpers.
 const serial=input?.source==='real-webgl-receipt-readback-serial-original-audio';
 const primary=input?.source==='real-canvas-plus-opted-in-soundstage'&&
  /^video\/webm;codecs=vp8,opus$/i.test(input?.mimeType||'')&&
  input?.framePump?.requestFailures===0&&
  Number.isSafeInteger(input.framePump.observedFrameAdvances)&&
  input.framePump.observedFrameAdvances>0&&input.framePump.observedFrameAdvances<=2048&&
  Number.isSafeInteger(input.framePump.requestedFrames)&&
  input.framePump.requestedFrames>=0&&input.framePump.requestedFrames<=2048&&
  (input.framePump.mode==='submitted-frame-request'&&
   input.framePump.requestedFrames>0&&
   input.framePump.requestedFrames<=input.framePump.observedFrameAdvances||
   input.framePump.mode==='native-capture-stream'&&
   input.framePump.requestedFrames===0);
 if(!(serial||primary)||input.status!=='RECORDED'||
  input.videoTracks!==1||input.audioTracks!==1||
  input.optedInAtStart!==true||input.originalSoundstageTrackLive!==true||
  !Number.isSafeInteger(input.bytes)||input.bytes<=1024||
  input.bytes>4*1024*1024||typeof input.base64!=='string'||
  input.base64.length>Math.ceil(4*1024*1024*4/3)+8)
  return fail('No bounded, opted-in authentic WebGL + soundstage recording');
 let objectUrl=null,video=null,callbackId=null,callbackActive=false;
 try{
  const binary=atob(input.base64);
  if(binary.length!==input.bytes)return fail('WebM encoded length mismatch');
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  objectUrl=URL.createObjectURL(new Blob([bytes],{type:'video/webm'}));
  video=document.createElement('video');
  // Decode without audible playback, new AudioContext or game-canvas work.
  video.muted=true;video.volume=0;video.playsInline=true;video.preload='auto';
  // Unlike a DOM-offscreen consumer, a 2px visible decoder is eligible for
  // Chromium's requestVideoFrameCallback presentation. This is installed
  // only AFTER the authentic original recorder has stopped; it never writes
  // to the Dungeon WebGL canvas, creates an encoder or changes the soundtrack.
  // The pre-existing live-track delivery monitor uses the same visibility
  // policy. Keep its tiny footprint and remove it in finally.
  video.style.cssText='position:fixed;right:4px;bottom:4px;width:2px;height:2px;opacity:1;visibility:visible;pointer-events:none;z-index:2147483647';
  document.body.appendChild(video);
  const bounds=video.getBoundingClientRect();
  if(!video.isConnected||bounds.width<2||bounds.height<2||
   document.visibilityState!=='visible')
   return fail('Original WebM decoder cannot present a visible frame consumer');
  const waitFor=(name,ms)=>new Promise(resolve=>{
   let done=false;
   const finish=ok=>{if(done)return;done=true;clearTimeout(timer);
    video.removeEventListener(name,listener);
    video.removeEventListener('error',onError);resolve(ok)};
   const listener=()=>finish(true),onError=()=>finish(false);
   const timer=setTimeout(()=>finish(false),ms);
   video.addEventListener(name,listener,{once:true});
   video.addEventListener('error',onError,{once:true});
  });
  const metadata=waitFor('loadedmetadata',2200);
  video.src=objectUrl;video.load();
  let metadataReady=await metadata;
  if(!metadataReady){
   // Some genuine MediaRecorder WebM blobs expose their metadata only after
   // an initial muted play request. One bounded recovery attempt, then fail.
   const recovery=waitFor('loadedmetadata',1700);
   try{
    const start=video.play();
    if(start&&typeof start.catch==='function')start.catch(()=>{});
   }catch{}
   metadataReady=await recovery;
   try{video.pause()}catch{}
  }
  if(!metadataReady&&!(video.readyState>=1&&video.videoWidth>=16&&
   video.videoHeight>=16))
   return fail('Chromium could not decode WebM metadata after muted retry');
  const duration=video.duration,finite=Number.isFinite(duration);
  if((finite&&(duration<.2||duration>30))||
   !Number.isInteger(video.videoWidth)||video.videoWidth<16||
   video.videoWidth>4096||!Number.isInteger(video.videoHeight)||
   video.videoHeight<16||video.videoHeight>4096)
   return fail('Missing bounded WebM video dimensions or duration');
  const checker=document.createElement('canvas');
  checker.width=24;checker.height=16;
  const ctx=checker.getContext('2d',{willReadFrequently:true});
  if(!ctx)return fail('Chromium pixel readback unavailable');
  const samples=[];
  const samplePixels=at=>{
   if(!Number.isFinite(at)||at<0||at>30||
    (samples.length&&at<=samples[samples.length-1].requestedSeconds))return;
   try{
    ctx.drawImage(video,0,0,24,16);
    const pixels=ctx.getImageData(0,0,24,16).data;
    let hash=2166136261,min=255,max=0;
    for(let i=0;i<pixels.length;i+=4){
     const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
     hash=Math.imul(hash^r,16777619)>>>0;
     hash=Math.imul(hash^g,16777619)>>>0;
     hash=Math.imul(hash^b,16777619)>>>0;
     const luma=Math.round((r*3+g*6+b)/10);
     min=Math.min(min,luma);max=Math.max(max,luma);
    }
    samples.push({requestedSeconds:Number(at.toFixed(5)),
     hash:hash.toString(16).padStart(8,'0'),lumaRange:max-min});
   }catch{/* An inaccessible decoded picture is never admitted as evidence. */}
  };
  let samplingMode='seek';
  if(finite){
   for(const fraction of [.08,.32,.62,.91]){
    const requested=Math.min(duration-.015,Math.max(.001,duration*fraction));
    if(!Number.isFinite(requested)||requested<0)continue;
    const seek=waitFor('seeked',1300);
    try{video.currentTime=requested}catch{continue}
    if(!await seek||video.readyState<2)continue;
    samplePixels(requested);
   }
  }else{
   // Chromium MediaRecorder WebM often has NO Duration element, even though
   // FFmpeg independently decodes actual VP8 frames. Never call seek(Infinity).
   // Playback frame callbacks read only decoded real pictures, bounded to
   // four pictures / 5.3s. This video is muted and detached from the game.
   samplingMode='playback-frame-callback';
   if(typeof video.requestVideoFrameCallback!=='function')
    return fail('Durationless WebM requires decoded video-frame callbacks');
   await new Promise(resolve=>{
    let stopped=false;
    const finish=()=>{if(stopped)return;stopped=true;callbackActive=false;
     clearTimeout(timeout);resolve()};
    const timeout=setTimeout(finish,5300);
    callbackActive=true;
    const onFrame=(now,metadata)=>{
     if(stopped)return;
     if(video.readyState>=2&&Number.isFinite(metadata?.mediaTime))
      samplePixels(metadata.mediaTime);
     if(samples.length>=4){finish();return}
     callbackId=video.requestVideoFrameCallback(onFrame);
    };
    callbackId=video.requestVideoFrameCallback(onFrame);
    try{
     const playing=video.play();
     if(playing&&typeof playing.catch==='function')
      playing.catch(()=>finish());
    }catch{finish()}
    video.addEventListener('ended',finish,{once:true});
    video.addEventListener('error',finish,{once:true});
   });
  }
  return {source,status:samples.length>=2?'SAMPLED':'UNAVAILABLE',
   reason:samples.length>=2?null:'Fewer than two decoded video pictures',
   width:video.videoWidth,height:video.videoHeight,
   durationSeconds:finite?Number(duration.toFixed(5)):null,
   samplingMode,samples,sampleSynchronized:false,
   limitation:'Decoded video pictures are not proven combat contact, original PCM onset or sample-accurate A/V synchronization'};
 }catch(error){return fail('Chromium decoder: '+String(error))}
 finally{
  callbackActive=false;
  if(video){
   if(callbackId!==null&&typeof video.cancelVideoFrameCallback==='function')
    try{video.cancelVideoFrameCallback(callbackId)}catch{}
   try{video.pause();video.removeAttribute('src');video.load()}catch{}
   video.remove();
  }
  if(objectUrl)URL.revokeObjectURL(objectUrl);
 }
}

/**
 * Distinct decoded pictures from the unchanged real WebM can diagnose moving
 * encoded pixels even without FFmpeg. This deliberately never classifies a
 * moving *combat event*, contact or sound/sample synchronization.
 */
function classifyChromiumDecodedRealWebM(media={},proof={}){
 const unavailable={source:'chromium-decoded-real-webgl-original-webm',
  classification:'BROWSER_DECODE_UNVERIFIED',sampleSynchronized:false};
 if(!authenticatedOriginalD04WebM(media)||
  proof.source!==unavailable.source||proof.status!=='SAMPLED'||
  !Number.isSafeInteger(proof.width)||proof.width<16||proof.width>4096||
  !Number.isSafeInteger(proof.height)||proof.height<16||proof.height>4096||
  !((proof.samplingMode==='playback-frame-callback'&&
   proof.durationSeconds===null)||
   ((proof.samplingMode===undefined||proof.samplingMode==='seek')&&
    Number.isFinite(proof.durationSeconds)&&proof.durationSeconds>=.2&&
    proof.durationSeconds<=30))||
  !Array.isArray(proof.samples)||
  proof.samples.length<2||proof.samples.length>4)
  return unavailable;
 let lastTime=-1;
 for(const sample of proof.samples){
  if(!Number.isFinite(sample.requestedSeconds)||
   sample.requestedSeconds<=lastTime||
   sample.requestedSeconds<0||
   (proof.samplingMode==='playback-frame-callback'?
    sample.requestedSeconds>30:
    sample.requestedSeconds>=proof.durationSeconds)||
   typeof sample.hash!=='string'||!/^[0-9a-f]{8}$/.test(sample.hash)||
   !Number.isSafeInteger(sample.lumaRange)||
   sample.lumaRange<12||sample.lumaRange>255)return unavailable;
  lastTime=sample.requestedSeconds;
 }
 const distinctFrames=new Set(proof.samples.map(s=>s.hash)).size;
 return {source:unavailable.source,
  classification:distinctFrames>1?
   'BROWSER_DECODED_MOVING_PIXELS_UNALIGNED':
   'BROWSER_DECODED_STATIC_OR_SPARSE_UNALIGNED',
  sampledFrames:proof.samples.length,distinctFrames,
  sampleSynchronized:false,
  limitation:'Decoded pixel snapshots never certify actual contact, encoded frame count, video PTS or audible impact PCM'};
}

module.exports={decodeSerialRealWebGLMotion,decodeReceiptReadbackMotion,decodeSameWindowReadbackMotion,
 sampleChromiumDecodedD04WebM,classifyChromiumDecodedRealWebM,
 selectAuthenticatedOriginalD04WebM};
