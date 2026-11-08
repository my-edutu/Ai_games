'use strict';
// Original-footage timebase calibration for Tower P0. No pixels, video or
// authoritative source ticks are modified. A missing/ambiguous match is
// NOT EVALUATED, never silently promoted to an event-matched comparison.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const THUMB_WIDTH = 48;
const THUMB_HEIGHT = 30;
const FRAME_BYTES = THUMB_WIDTH * THUMB_HEIGHT;
const MAX_VIDEO_BYTES = FRAME_BYTES * 240 * 30; // <=4 minutes at <=30fps
const MIN_ANCHORS = 3;

function median(values) {
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted.length % 2
    ? sorted[(sorted.length-1)/2]
    : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
}

function assessVideoTimebase(anchors) {
  const valid=(anchors||[]).filter(a=>a &&
    Number.isFinite(a.videoPtsSeconds) && a.videoPtsSeconds>=0 &&
    Number.isFinite(a.wallAtMs) &&
    Number.isFinite(a.imageDifference) &&
    Number.isFinite(a.captureSpanMs) && a.captureSpanMs>=0 &&
    a.captureSpanMs<=350 &&
    Number.isFinite(a.uniquenessMargin) && a.uniquenessMargin>=1.5 &&
    a.imageDifference<=24).sort((a,b)=>a.wallAtMs-b.wallAtMs);
  const separated=[];
  for(const anchor of valid)
    if(!separated.length||anchor.wallAtMs-separated.at(-1).wallAtMs>=3000)
      separated.push(anchor);
  if(separated.length<MIN_ANCHORS)
    return {status:'NOT EVALUATED',reason:'Fewer than three distinct, unambiguous native-frame visual anchors',anchorsAccepted:separated.length};
  const offsets=separated.map(a=>a.videoPtsSeconds*1000-a.wallAtMs);
  const offsetMs=median(offsets);
  const residuals=offsets.map(v=>Math.abs(v-offsetMs));
  const maxResidualMs=Math.max(...residuals);
  if(maxResidualMs>350)
    return {status:'NOT EVALUATED',reason:'Native video frame anchors disagree with the wall-clock source observer',anchorsAccepted:separated.length,maxResidualMs};
  if(separated.at(-1).wallAtMs-separated[0].wallAtMs<15000)
    return {status:'NOT EVALUATED',reason:'Calibrated anchors do not span enough original gameplay',anchorsAccepted:separated.length};
  return {status:'CALIBRATED',method:'full-frame-original-WebM-to-unmodified-viewport-screenshot',
    anchorsAccepted:separated.length,offsetMs,maxResidualMs,
    caveat:'Frame-to-wall mapping only; source events may precede the displayed render. A mapped timecode does not establish on-screen action visibility or blind preference.'};
}

function distance(frame, anchor) {
  if(frame.length!==FRAME_BYTES||anchor.length!==FRAME_BYTES)
    throw new Error('Invalid luminance thumbnail length');
  let total=0;
  // A true full-viewport screenshot and original recording have identical
  // dimensions before neutral thumbnailing. Pixel error is a matching clue,
  // never an experience-quality score.
  for(let i=0;i<FRAME_BYTES;i++)total+=Math.abs(frame[i]-anchor[i]);
  return total/FRAME_BYTES;
}

function readGrayThumbnail(file) {
  const bytes=execFileSync('ffmpeg',['-v','error','-i',file,'-vf',
    `scale=${THUMB_WIDTH}:${THUMB_HEIGHT},format=gray`,
    '-frames:v','1','-f','rawvideo','-pix_fmt','gray','pipe:1'],
  {maxBuffer:FRAME_BYTES*4,timeout:30000});
  if(bytes.length!==FRAME_BYTES)throw new Error('Screenshot thumbnail decode incomplete');
  return bytes;
}

function readVideoFrames(video) {
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0',
    '-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',video],
  {encoding:'utf8',maxBuffer:16*1024*1024,timeout:45000}));
  const pts=(probe.frames||[]).map(frame=>Number(frame.best_effort_timestamp_time));
  if(!pts.length||pts.length>7200||pts.some(v=>!Number.isFinite(v)||v<0))
    throw new Error('Missing, invalid or oversized original video PTS');
  const bytes=execFileSync('ffmpeg',['-v','error','-i',video,'-vf',
    `scale=${THUMB_WIDTH}:${THUMB_HEIGHT},format=gray`,
    '-fps_mode','passthrough','-f','rawvideo','-pix_fmt','gray','pipe:1'],
  {maxBuffer:MAX_VIDEO_BYTES,timeout:120000});
  if(bytes.length!==pts.length*FRAME_BYTES)
    throw new Error('Frame/PTS mismatch; cannot align original footage');
  return {bytes,pts};
}

function visuallyMatchAnchor(frames, thumbnail) {
  const ranked=[];
  for(let i=0;i<frames.pts.length;i++){
    const score=distance(
      frames.bytes.subarray(i*FRAME_BYTES,(i+1)*FRAME_BYTES),thumbnail);
    if(!Number.isFinite(score))continue;
    ranked.push({videoPtsSeconds:frames.pts[i],imageDifference:score});
  }
  ranked.sort((a,b)=>a.imageDifference-b.imageDifference);
  const best=ranked[0];
  if(!best)return null;
  // Static/loading frames cannot provide an honest wall/video offset.
  const distant=ranked.find(row=>Math.abs(row.videoPtsSeconds-best.videoPtsSeconds)>=.8);
  return {...best,uniquenessMargin:distant
    ?distant.imageDifference-best.imageDifference:0};
}

function meaningfulSourceEvents(ticks) {
  const events=[],seen=new Set();
  let previous=null;
  for(const tick of ticks||[]){
    if(!tick||!Number.isFinite(tick.atMs)||
       !Number.isSafeInteger(tick.tick)||!Number.isSafeInteger(tick.floor)||
       typeof tick.runToken!=='string')continue;
    const guardian=(tick.guardians||[]).find(g=>g.id&&Number.isFinite(g.health));
    const preceding=previous?.guardian;
    let kind=null;
    if(previous&&previous.runToken!==tick.runToken)kind='authentic-run-restart';
    else if(previous&&tick.floor!==previous.floor)kind='source-floor-transition';
    else if(previous&&tick.lifecycle!==previous.lifecycle)
      kind='source-lifecycle-'+tick.lifecycle;
    else if(guardian&&preceding&&previous?.runToken===tick.runToken &&
      preceding.id===guardian.id && preceding.health>0&&guardian.health<=0 &&
      guardian.active===false)kind='source-guardian-defeat';
    else if(guardian&&preceding&&previous?.runToken===tick.runToken&&
      preceding.id===guardian.id&&guardian.health<preceding.health)
      kind='source-guardian-damaged';
    if(kind){
      const key=tick.runToken+':'+tick.tick+':'+kind;
      if(!seen.has(key)){
        seen.add(key);events.push({kind,atMs:tick.atMs,tick:tick.tick,
          floor:tick.floor,runToken:tick.runToken});
      }
    }
    previous={runToken:tick.runToken, floor:tick.floor,
      lifecycle:tick.lifecycle,guardian:guardian?{...guardian}:null};
  }
  return events.slice(0,240);
}

function calibrateOriginalVideo({video,anchors,sourceTicks}) {
  const evidence={status:'NOT EVALUATED',originalVideoUnmodified:true,
    imageAnchorsChecked:0,sourceEventTimecodes:[],
    originalSourceEventVisibility:'NOT EVALUATED',
    blindExperienceVerdict:'NOT EVALUATED'};
  try {
    if(!video||!fs.existsSync(video))throw new Error('Original native WebM unavailable');
    const frames=readVideoFrames(video),matches=[];
    for(const anchor of anchors||[]){
      if(!anchor?.file||!fs.existsSync(anchor.file)||
         !Number.isFinite(anchor.startAtMs)||!Number.isFinite(anchor.endAtMs))
         continue;
      const captureSpanMs=anchor.endAtMs-anchor.startAtMs;
      if(captureSpanMs<0||captureSpanMs>350)continue;
      const match=visuallyMatchAnchor(frames,readGrayThumbnail(anchor.file));
      if(!match)continue;
      matches.push({...match,captureSpanMs,
        wallAtMs:(anchor.startAtMs+anchor.endAtMs)/2,file:anchor.file});
    }
    evidence.imageAnchorsChecked=matches.length;
    const result=assessVideoTimebase(matches);
    evidence.status=result.status;
    evidence.calibration=result;
    evidence.anchorMatches=matches.map(({file,...values})=>({
      screenshot:file.split(/[\\/]/).at(-1),...values}));
    if(result.status!=='CALIBRATED')return evidence;
    const duration=frames.pts.at(-1);
    evidence.sourceEventTimecodes=meaningfulSourceEvents(sourceTicks).map(event=>({
      ...event,
      // This maps a source-observed wall clock to the original video clock.
      // It does NOT assert that the GPU submitted this same tick.
      nativeVideoSeconds:(event.atMs+result.offsetMs)/1000,
      inOriginalVideo:(event.atMs+result.offsetMs)/1000>=0 &&
        (event.atMs+result.offsetMs)/1000<=duration,
    }));
    evidence.originalVideoDurationSeconds=duration;
    return evidence;
  } catch(error) {
    return {...evidence,error:String(error?.message||error).slice(0,320),
      note:'Native footage was kept; no clock calibration or visual acceptance inferred.'};
  }
}

module.exports={assessVideoTimebase,distance,visuallyMatchAnchor,
  meaningfulSourceEvents,calibrateOriginalVideo,FRAME_BYTES};
