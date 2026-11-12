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
 * This function is serialized directly into page.evaluate. Do not reference
 * any Node helper or closure; do not draw to the Dungeon WebGL canvas.
 */
async function sampleChromiumDecodedD04WebM(input){
 const source='chromium-decoded-real-webgl-original-webm';
 const fail=reason=>({source,status:'UNAVAILABLE',reason:String(reason).slice(0,160),
  sampleSynchronized:false});
 if(input?.source!=='real-webgl-receipt-readback-serial-original-audio'||
  input?.status!=='RECORDED'||input?.videoTracks!==1||
  input?.audioTracks!==1||input?.optedInAtStart!==true||
  input?.originalSoundstageTrackLive!==true||
  !Number.isSafeInteger(input.bytes)||input.bytes<=1024||
  input.bytes>4*1024*1024||typeof input.base64!=='string'||
  input.base64.length>Math.ceil(4*1024*1024*4/3)+8)
  return fail('No bounded, opted-in authentic WebGL + soundstage recording');
 let objectUrl=null,video=null;
 try{
  const binary=atob(input.base64);
  if(binary.length!==input.bytes)return fail('WebM encoded length mismatch');
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const blob=new Blob([bytes],{type:'video/webm'});
  objectUrl=URL.createObjectURL(blob);
  video=document.createElement('video');
  video.muted=true;video.playsInline=true;video.preload='auto';
  // Muted, hidden, read-only decoder; does not alter the active game scene,
  // feed the recorder or create an audio output connection.
  video.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1px;height:1px';
  document.body.appendChild(video);
  const waitFor=(name,ms)=>{
   return new Promise(resolve=>{
    let done=false;
    const finish=ok=>{if(done)return;done=true;clearTimeout(timer);
     video.removeEventListener(name,listener);
     video.removeEventListener('error',onError);resolve(ok)};
    const listener=()=>finish(true),onError=()=>finish(false);
    const timer=setTimeout(()=>finish(false),ms);
    video.addEventListener(name,listener,{once:true});
    video.addEventListener('error',onError,{once:true});
   });
  };
  const metadata=waitFor('loadedmetadata',2200);
  video.src=objectUrl;video.load();
  if(!await metadata)return fail('Chromium could not decode WebM metadata');
  const duration=video.duration;
  if(!Number.isFinite(duration)||duration<.2||duration>30||
   !Number.isInteger(video.videoWidth)||video.videoWidth<16||
   video.videoWidth>4096||!Number.isInteger(video.videoHeight)||
   video.videoHeight<16||video.videoHeight>4096)
   return fail('Missing bounded WebM video dimensions or duration');
  const checker=document.createElement('canvas');
  checker.width=24;checker.height=16;
  const ctx=checker.getContext('2d',{willReadFrequently:true});
  if(!ctx)return fail('Chromium pixel readback unavailable');
  const samples=[];
  for(const fraction of [.08,.32,.62,.91]){
   const requested=Math.min(duration-.015,Math.max(.001,duration*fraction));
   if(!Number.isFinite(requested)||requested<0)continue;
   const seek=waitFor('seeked',1300);
   try{video.currentTime=requested}catch{continue}
   if(!await seek||video.readyState<2)continue;
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
    samples.push({requestedSeconds:Number(requested.toFixed(5)),
     hash:hash.toString(16).padStart(8,'0'),lumaRange:max-min});
   }catch{return fail('Chromium decoded canvas pixel read failed')}
  }
  return {source,status:samples.length>=2?'SAMPLED':'UNAVAILABLE',
   reason:samples.length>=2?null:'Fewer than two decoded seek samples',
   width:video.videoWidth,height:video.videoHeight,
   durationSeconds:Number(duration.toFixed(5)),
   samples,sampleSynchronized:false,
   limitation:'Decoded seek snapshots are not video-frame counts, presentation PTS or combat/audio sync'};
 }catch(error){return fail('Chromium decoder: '+String(error))}
 finally{
  if(video){try{video.pause();video.removeAttribute('src');video.load()}catch{}
   video.remove()}
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
 if(media.source!=='real-webgl-receipt-readback-serial-original-audio'||
  media.status!=='RECORDED'||media.videoTracks!==1||media.audioTracks!==1||
  media.optedInAtStart!==true||media.originalSoundstageTrackLive!==true||
  !Number.isSafeInteger(media.bytes)||media.bytes<=1024||
  media.bytes>4*1024*1024||
  proof.source!==unavailable.source||proof.status!=='SAMPLED'||
  !Number.isSafeInteger(proof.width)||proof.width<16||proof.width>4096||
  !Number.isSafeInteger(proof.height)||proof.height<16||proof.height>4096||
  !Number.isFinite(proof.durationSeconds)||proof.durationSeconds<.2||
  proof.durationSeconds>30||!Array.isArray(proof.samples)||
  proof.samples.length<2||proof.samples.length>4)
  return unavailable;
 let lastTime=-1;
 for(const sample of proof.samples){
  if(!Number.isFinite(sample.requestedSeconds)||
   sample.requestedSeconds<=lastTime||
   sample.requestedSeconds<0||
   sample.requestedSeconds>=proof.durationSeconds||
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
 sampleChromiumDecodedD04WebM,classifyChromiumDecodedRealWebM};
