'use strict';
// Read-only decode of genuine D04 combined-canvas WebM. Does not infer impact
// causality, frame contact, speaker onset, or synchronization from audio energy.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const MAX_SECONDS=30;
const SAMPLE_RATE=48000;
function inspectPcm(pcm,{channels=2,sampleRate=SAMPLE_RATE}={}){
 if(channels!==2||sampleRate!==SAMPLE_RATE||!Buffer.isBuffer(pcm)||
   pcm.byteLength===0||pcm.byteLength%8!==0||pcm.byteLength>MAX_SECONDS*SAMPLE_RATE*8)
  return {status:'INVALID_STEREO_PCM',sampleSynchronized:false};
 const frames=pcm.byteLength/8,peak=[0,0],sum=[0,0],above=[0,0],first=[null,null];
 for(let i=0;i<frames;i++)for(let c=0;c<2;c++){
  const v=pcm.readFloatLE(i*8+c*4);
  if(!Number.isFinite(v)||Math.abs(v)>1.01)
   return {status:'INVALID_STEREO_PCM',sampleSynchronized:false};
  const a=Math.abs(v);peak[c]=Math.max(peak[c],a);sum[c]+=v*v;
  if(a>0.00005){above[c]++;if(first[c]===null)first[c]=i/SAMPLE_RATE;}
 }
 const rms=sum.map(n=>Math.sqrt(n/frames));
 const distinctCombatStem=peak[1]>.0005&&rms[1]>.000005&&above[1]>=20;
 return {status:distinctCombatStem?'DECODED_ORIGINAL_FX_STEM_UNALIGNED':
  'COMBAT_FX_STEM_SILENT_OR_UNVERIFIED',
  sampleSynchronized:false,decodedVideoContact:false,physicalContactOnsetVerified:false,
  decoderEvidence:'actual decoded stereo Opus PCM, not oscillator scheduling',
  sampleRate,channels,frames,durationSeconds:frames/sampleRate,
  mixLeft:{peak:peak[0],rms:rms[0],samplesAboveNoise:above[0],firstAboveNoiseSeconds:first[0]},
  originalCombatFxRight:{peak:peak[1],rms:rms[1],samplesAboveNoise:above[1],firstAboveNoiseSeconds:first[1]},
  limitation:'Opus decoding establishes an isolated right-channel original FX stem; without authenticated event-to-encoded-PTS mapping and visible contact it cannot prove injury or audiovisual synchronization'};
}
function run(input){
 const ffmpeg=process.env.D04_FFMPEG||'ffmpeg';
 const ffprobe=process.env.D04_FFPROBE||'ffprobe';
 if(!fs.existsSync(input))return {status:'INPUT_MISSING',sampleSynchronized:false};
 const probe=spawnSync(ffprobe,['-v','error','-select_streams','a:0','-show_entries',
  'stream=codec_name,channels,sample_rate','-of','json',input],{encoding:'utf8',timeout:20000,maxBuffer:1e6});
 if(probe.error?.code==='ENOENT')return {status:'DECODER_UNAVAILABLE',sampleSynchronized:false,reason:'ffprobe not installed'};
 if(probe.status!==0)return {status:'DECODER_UNAVAILABLE',sampleSynchronized:false,reason:'ffprobe error'};
 let stream;
 try{stream=JSON.parse(probe.stdout).streams?.[0];}catch{}
 if(!stream||stream.codec_name!=='opus'||stream.channels!==2)
  return {status:'INPUT_NOT_REAL_STEREO_OPUS',sampleSynchronized:false};
 const decoded=spawnSync(ffmpeg,['-v','error','-i',input,'-map','0:a:0',
  '-ac','2','-ar',String(SAMPLE_RATE),'-c:a','pcm_f32le','-f','f32le','pipe:1'],
  {timeout:45000,maxBuffer:MAX_SECONDS*SAMPLE_RATE*8+1024});
 if(decoded.error?.code==='ENOENT')return {status:'DECODER_UNAVAILABLE',sampleSynchronized:false,reason:'ffmpeg not installed'};
 if(decoded.status!==0)return {status:'DECODE_FAILED',sampleSynchronized:false,
  reason:String(decoded.stderr||'').slice(0,240)};
 return {...inspectPcm(decoded.stdout),source:path.basename(input),encodedCodec:stream.codec_name,
  encodedSampleRate:Number(stream.sample_rate)};
}
if(require.main===module){
 const input=process.argv[2],output=process.argv[3];
 if(!input){console.error('usage: node dungeon-d04-stereo-stem-decoder.cjs INPUT.webm [RESULT.json]');process.exitCode=2;}
 else{
  const verdict=run(input),json=JSON.stringify(verdict,null,2)+'\n';
  if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,json);}
  console.log(json);
  // Missing decoder is explicitly UNVERIFIED. If installed, bad or missing
  // real-game evidence fails this recording check rather than faking success.
  if(!['DECODED_ORIGINAL_FX_STEM_UNALIGNED','DECODER_UNAVAILABLE'].includes(verdict.status))
   process.exitCode=1;
 }
}
module.exports={inspectPcm,run};
