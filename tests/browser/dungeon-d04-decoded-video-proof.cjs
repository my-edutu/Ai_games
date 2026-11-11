'use strict';
// D04-only evidence decoder. A WebM byte count is not a moving combat clip:
// Chromium produced a 14,055-byte, single-frame VP8 WebM on 11 Nov 2026.
function decodeSerialRealWebGLMotion(video={}){
 const base={source:'ffmpeg-decoded-real-webgl-serial-video',method:'framemd5-24x16-first-64'};
 if(video.source!=='real-webgl-canvas-serial-video-only'||video.status!=='RECORDED'||
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
module.exports={decodeSerialRealWebGLMotion};
