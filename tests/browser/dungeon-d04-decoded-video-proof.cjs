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
module.exports={decodeSerialRealWebGLMotion,decodeReceiptReadbackMotion,decodeSameWindowReadbackMotion};
