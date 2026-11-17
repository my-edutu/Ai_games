'use strict';
/**
 * D04 read-only ORIGINAL PCM evidence. Compare actual live FX-bus PCM samples
 * against the original successful WebAudio source.start() clock, only for a
 * genuine delivered and drawable HP-only injury receipt. A coincident
 * transient is NOT a decoded video contact, isolated injury sound, audible
 * speaker onset, or A/V synchronization.
 *
 * No procedural audition, source.start alone, synthetic waveform, or PCM
 * energy alone may satisfy the real-game acceptance gate.
 */
const MAX_PCM_BYTES=2*1024*1024;
const MAX_IMPACTS=16;
const WINDOW_MS=90;
const round=v=>Math.round(v*10000)/10000;
const legitimateReceipt=r=>r&&
 (r.kind==='damage'||r.kind==='damage-fatal')&&
 r.audio===true&&r.visual===true&&r.decision==='delivered'&&
 r.visualDrawableAtSubmission===true&&r.frameId!==null&&
 typeof r.cueId==='string'&&r.cueId.length<=256&&
 typeof r.scene==='string'&&
 Number.isSafeInteger(r.tick)&&r.tick>=0;
const originalStart=(r,s)=>s&&s.cueId===r.cueId&&
 s.audio===(r.kind==='damage-fatal'?'fatal-impact':'impact')&&
 s.sceneKey===r.scene&&s.tick===r.tick&&
 s.verifiedCanonicalCue===true&&
 Number.isSafeInteger(s.startedSources)&&s.startedSources>0&&
 Number.isFinite(s.scheduledContextMs)&&s.scheduledContextMs>=0;
function auditD04OriginalPcmImpactOnsets({pcm={},receipts=[],sourceStarts=[]}={}){
 const base={source:'live-opted-in-original-d04-fx-pcm-and-actual-HP-receipts',
  sampleSynchronized:false,decodedVideoContact:false,
  audibleImpactOnsetVerified:false,
  limitation:'Pre-master FX contains other authentic effects. PCM samples and WebAudio source starts share an AudioContext clock, not decoded WebM video PTS or measured speaker output.'};
 const unavailable=(status,reason)=>({...base,status,reason,candidates:[]});
 if(pcm?.status!=='RECORDED'||pcm?.captureBus!=='d04-combat-fx-pre-master'||
  pcm?.pcmClock?.status!=='CONTIGUOUS_CONTEXT_TIME_ONLY'||
  !Number.isFinite(pcm?.pcmClock?.firstSampleContextSeconds)||
  !Number.isFinite(pcm?.pcmClock?.lastSampleEndContextSeconds))
  return unavailable('ORIGINAL_PCM_CLOCK_UNVERIFIED','No verified live D04 FX-bus PCM time window');
 const rate=pcm.sampleRate,frames=pcm.frames,first=pcm.pcmClock.firstSampleContextSeconds;
 if(!Number.isSafeInteger(rate)||rate<8000||rate>96000||
  !Number.isSafeInteger(frames)||frames<2048||
  !Number.isSafeInteger(pcm.bytes)||pcm.bytes!==44+frames*2||
  pcm.bytes>MAX_PCM_BYTES||typeof pcm.wavBase64!=='string'||
  pcm.pcmClock.lastSampleEndContextSeconds<=first||
  Math.abs(first+frames/rate-pcm.pcmClock.lastSampleEndContextSeconds)>.002)
  return unavailable('ORIGINAL_PCM_BYTES_UNVERIFIED','Invalid bounded PCM frame/timing metadata');
 const wav=Buffer.from(pcm.wavBase64,'base64');
 if(wav.length!==pcm.bytes||wav.toString('ascii',0,4)!=='RIFF'||
  wav.toString('ascii',8,16)!=='WAVEfmt '||
  wav.toString('ascii',36,40)!=='data'||
  wav.readUInt16LE(20)!==1||wav.readUInt16LE(22)!==1||
  wav.readUInt32LE(24)!==rate||wav.readUInt16LE(34)!==16||
  wav.readUInt32LE(40)!==frames*2||wav.readUInt32LE(4)!==wav.length-8)
  return unavailable('ORIGINAL_PCM_BYTES_UNVERIFIED','Not an authenticated PCM16 mono WAV');
 const injuries=(Array.isArray(receipts)?receipts:[]).filter(legitimateReceipt).slice(-MAX_IMPACTS);
 if(!injuries.length)return unavailable('NO_DRAWABLE_REAL_HP_IMPACT','No genuine submitted/drawable HP impact');
 const starts=(Array.isArray(sourceStarts)?sourceStarts:[]).slice(-32);
 const span=(left,right)=>{
  const lo=Math.max(0,Math.floor(left)),hi=Math.min(frames,Math.ceil(right));
  if(hi<=lo)return 0;
  let sum=0;
  for(let i=lo;i<hi;i++){const v=wav.readInt16LE(44+i*2)/32768;sum+=v*v}
  return Math.sqrt(sum/(hi-lo));
 };
 const candidates=[];
 for(const receipt of injuries){
  const matches=starts.filter(s=>originalStart(receipt,s));
  if(matches.length!==1){
   candidates.push({cueId:receipt.cueId,status:matches.length?
    'AMBIGUOUS_SOURCE_START':'NO_IDENTITY_MATCHED_ORIGINAL_START'});continue;
  }
  const start=matches[0],t=start.scheduledContextMs;
  const conflicting=starts.some(s=>s!==start&&
   Number.isFinite(s?.scheduledContextMs)&&
   Math.abs(s.scheduledContextMs-t)<=WINDOW_MS);
  if(conflicting){
   candidates.push({cueId:receipt.cueId,status:'OVERLAPPING_ORIGINAL_FX_CUES'});continue;
  }
  const center=(t/1000-first)*rate;
  // Require pre-onset silence evidence and a complete post-onset window,
  // not truncated PCM boundaries that could manufacture a rising transient.
  if(center-rate*.05<0||center+rate*.09>=frames){
   candidates.push({cueId:receipt.cueId,status:'OUTSIDE_COMPLETE_PCM_WINDOW'});continue;
  }
  const baseline=span(center-rate*.045,center-rate*.012);
  // An already-active authentic FX cue can contaminate this same shared bus.
  if(baseline>.015){
   candidates.push({cueId:receipt.cueId,status:'PREEXISTING_FX_ENERGY',
    baselineRms:round(baseline)});continue;
  }
  const bin=Math.max(1,Math.round(rate*.006));
  let best=0,bestOffset=null;
  for(let at=Math.floor(center);at<center+rate*.084;at+=bin){
   const measured=span(at,Math.min(at+bin,center+rate*.09));
   if(measured>best){best=measured;bestOffset=(at-center)*1000/rate}
  }
  const onsetCandidate=best>Math.max(.006,baseline*4);
  candidates.push({cueId:receipt.cueId,
   status:onsetCandidate?'PCM_FX_TRANSIENT_NEAR_AUTHENTIC_START':
    'NO_CLEAR_FX_TRANSIENT',
   scheduledContextMs:Math.round(t),baselineRms:round(baseline),
   maxPostStartRms:round(best),
   maxEnergyOffsetMs:bestOffset===null?null:Math.round(bestOffset),
   sampleSynchronized:false});
 }
 const candidateCount=candidates.filter(c=>c.status==='PCM_FX_TRANSIENT_NEAR_AUTHENTIC_START').length;
 return {...base,status:candidateCount?
  'ORIGINAL_PCM_TRANSIENT_CANDIDATE_VIDEO_UNALIGNED':
  'NO_UNAMBIGUOUS_ORIGINAL_PCM_TRANSIENT',
  qualifyingDrawableReceipts:injuries.length,candidateCount,candidates};
}
module.exports={auditD04OriginalPcmImpactOnsets,MAX_PCM_BYTES,MAX_IMPACTS};
