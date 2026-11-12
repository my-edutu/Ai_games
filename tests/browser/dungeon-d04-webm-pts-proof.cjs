'use strict';
// D04-only forensic EBML parser. Packet timing is NOT decoded pixel motion,
// a physical contact witness, or audible WebAudio/Opus sample synchronization.
const MAX_BYTES=20*1024*1024;
const MAX_ELEMENTS=25000;
const MAX_BLOCKS=4096;
function readVint(buf,at,isId=false){
 if(at>=buf.length)throw Error('Truncated EBML vint');
 let mask=128,n=1;
 while(n<=8&&!(buf[at]&mask)){mask>>=1;n++}
 if(n>8||(isId&&n>4)||at+n>buf.length)throw Error('Invalid EBML vint');
 let val=BigInt(isId?buf[at]:(buf[at]&(mask-1)));
 for(let j=1;j<n;j++)val=(val<<8n)+BigInt(buf[at+j]);
 const unknown=!isId&&val===(1n<<BigInt(7*n))-1n;
 if(!unknown&&val>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Unsafe EBML vint');
 return {value:unknown?null:Number(val),length:n,unknown};
}
function readUint(buf,start,end){
 if(end-start<1||end-start>8)throw Error('Invalid EBML uint');
 let n=0n;for(let i=start;i<end;i++)n=(n<<8n)+BigInt(buf[i]);
 if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Unsafe EBML uint');
 return Number(n);
}
function parseVideoBlocks(buf){
 let scale=1000000,elements=0;
 const tracks=new Map(),blocks=[];
 const containerIds=new Set([0x1A45DFA3,0x18538067,0x1654AE6B,0xAE,0x1F43B675,0xA0]);
 function walk(start,end,depth,ctx){
  if(depth>12)throw Error('EBML nesting exceeds budget');
  let at=start,clusterTime=ctx.clusterTime,entry=ctx.entry;
  while(at<end){
   if(++elements>MAX_ELEMENTS)throw Error('EBML element budget exceeded');
   const id=readVint(buf,at,true);at+=id.length;
   const size=readVint(buf,at);at+=size.length;
   const stop=size.unknown?end:at+size.value;
   if(stop>buf.length||stop>end||stop<at)throw Error('EBML size out of bounds');
   if(size.unknown&&id.value!==0x18538067&&id.value!==0x1F43B675)
    throw Error('Unexpected unknown-size EBML element');
   if(id.value===0x2AD7B1)scale=readUint(buf,at,stop);
   else if(id.value===0xE7)clusterTime=readUint(buf,at,stop);
   else if(id.value===0xD7&&entry)entry.number=readUint(buf,at,stop);
   else if(id.value===0x83&&entry)entry.type=readUint(buf,at,stop);
   else if(id.value===0xA3||id.value===0xA1){
    const track=readVint(buf,at);
    const pos=at+track.length;
    if(pos+3>stop)throw Error('Truncated WebM block');
    const rel=buf.readInt16BE(pos);
    const laced=(buf[pos+2]&0x06)!==0;
    if(blocks.length>=MAX_BLOCKS)throw Error('WebM block budget exceeded');
    if(clusterTime===null)throw Error('Block missing cluster timestamp');
    blocks.push({track:track.value,ticks:clusterTime+rel,laced});
   }else if(id.value===0x1F43B675&&size.unknown&&ctx.inUnknownCluster){
    // A new unknown-size Cluster is a sibling, not infinite recursive nesting.
    clusterTime=null;continue;
   }else if(containerIds.has(id.value)){
    const nextEntry=id.value===0xAE?{number:null,type:null}:entry;
    walk(at,stop,depth+1,{
     clusterTime:id.value===0x1F43B675?null:clusterTime,
     entry:nextEntry,inUnknownCluster:size.unknown&&id.value===0x1F43B675});
    if(id.value===0xAE&&nextEntry.number!==null&&nextEntry.type!==null){
     if(tracks.has(nextEntry.number))throw Error('Duplicate WebM track');
     tracks.set(nextEntry.number,nextEntry.type);
    }
   }
   at=stop;
  }
 }
 walk(0,buf.length,0,{clusterTime:null,entry:null,inUnknownCluster:false});
 if(!Number.isSafeInteger(scale)||scale<1||scale>1e9)throw Error('Invalid TimestampScale');
 const videoTracks=[...tracks].filter(([,v])=>v===1).map(([k])=>k);
 const audioTracks=[...tracks].filter(([,v])=>v===2).map(([k])=>k);
 if(videoTracks.length!==1||audioTracks.length!==1)throw Error('Missing exactly one video and one audio track');
 const ptsMs=blocks.filter(b=>b.track===videoTracks[0]).map(b=>{
  if(b.laced)throw Error('Laced video packet has ambiguous frame count');
  const ms=b.ticks*scale/1e6;
  if(!Number.isFinite(ms)||ms<0||ms>120000)throw Error('Out-of-range video timestamp');
  return Number(ms.toFixed(3));
 });
 if(!ptsMs.length)throw Error('No encoded video block');
 return {videoFrames:ptsMs.length,ptsMs,audioTrackFound:true};
}
function inspectRealWebMVideoPTS(media={}){
 const source='d04-ebml-video-pts',fail=reason=>({
  source,status:'UNAVAILABLE',reason,sampleSynchronized:false});
 if(media.source!=='real-webgl-receipt-readback-serial-original-audio'||
  media.phase!=='after-all-primary-encoders-settled'||
  media.primaryRecordersSettled!==true||media.optedInAtStart!==true||
  media.originalSoundstageTrackLive!==true||media.status!=='RECORDED'||
  media.videoTracks!==1||media.audioTracks!==1||
  !/^video\/webm(?:;|$)/i.test(media.mimeType||'')||
  !Number.isSafeInteger(media.bytes)||media.bytes<=1024||media.bytes>MAX_BYTES||
  !Number.isFinite(media.recordingMs)||media.recordingMs<1000||media.recordingMs>15500||
  typeof media.base64!=='string'||media.base64.length>MAX_BYTES*1.34+8)
  return fail('Unproven original real-WebGL WebM source');
 try{
  const bytes=Buffer.from(media.base64,'base64');
  if(bytes.length!==media.bytes||bytes.toString('base64')!==media.base64)
   return fail('Encoded WebM bytes failed exact base64 validation');
  const parsed=parseVideoBlocks(bytes);
  const p=parsed.ptsMs;
  if(p.some((v,i)=>v>media.recordingMs+250||(i>0&&v<=p[i-1])))
   return fail('Nonmonotonic or out-of-window video packet timestamps');
  return {source,status:'PARSED',method:'bounded-ebml-video-simpleblock-pts',...parsed,
   firstVideoMs:p[0],lastVideoMs:p[p.length-1],
   sampleSynchronized:false,pixelMotionVerified:false,audibleImpactVerified:false,
   limitation:'Packet timestamps are neither decoded moving pixels nor audible impact alignment'};
 }catch(e){return fail('WebM EBML parse: '+String(e.message||e).slice(0,120))}
}
function classifyEncodedFrameYield(media={},proof={}){
 const pump=media.framePump||{},samples=pump.samples;
 if(proof.source!=='d04-ebml-video-pts'||proof.status!=='PARSED'||
  proof.sampleSynchronized!==false||proof.pixelMotionVerified!==false||
  media.source!=='real-webgl-receipt-readback-serial-original-audio'||
  pump.mode!=='real-webgl-render-receipt-readback'||pump.requestFailures!==0||
  !Number.isSafeInteger(pump.requestedFrames)||pump.requestedFrames<1||
  !Array.isArray(samples)||pump.requestedFrames!==samples.length||
  !Number.isSafeInteger(proof.videoFrames)||proof.videoFrames<1||
  proof.videoFrames>pump.requestedFrames||
  !Array.isArray(proof.ptsMs)||proof.ptsMs.length!==proof.videoFrames)
  return 'ENCODED_FRAME_TIMING_UNVERIFIED';
 for(let i=0;i<samples.length;i++){
  if(!Number.isSafeInteger(samples[i]?.receipt)||
   !Number.isFinite(samples[i]?.atMs)||samples[i].atMs<0||
   (i>0&&(samples[i].receipt<=samples[i-1].receipt||samples[i].atMs<=samples[i-1].atMs)))
   return 'ENCODED_FRAME_TIMING_UNVERIFIED';
 }
 for(let i=0;i<proof.ptsMs.length;i++){
  if(!Number.isFinite(proof.ptsMs[i])||
   (i>0&&proof.ptsMs[i]<=proof.ptsMs[i-1]))
   return 'ENCODED_FRAME_TIMING_UNVERIFIED';
 }
 return proof.videoFrames===1?'ONE_ENCODED_VIDEO_FRAME_UNALIGNED':'SPARSE_ENCODED_VIDEO_PTS_UNALIGNED';
}
module.exports={inspectRealWebMVideoPTS,classifyEncodedFrameYield};
