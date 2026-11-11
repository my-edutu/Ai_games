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
    return {status:'NOT EVALUATED',
      reason:'Fewer than three distinct, unambiguous native-frame visual anchors',
      anchorsAccepted:separated.length};
  if(separated.at(-1).wallAtMs-separated[0].wallAtMs<15000)
    return {status:'NOT EVALUATED',
      reason:'Calibrated anchors do not span enough original gameplay',
      anchorsAccepted:separated.length};
  const offsets=separated.map(a=>a.videoPtsSeconds*1000-a.wallAtMs);
  const offsetMs=median(offsets);
  const residuals=offsets.map(v=>Math.abs(v-offsetMs));
  const maxResidualMs=Math.max(...residuals);
  const anchorTimeline=separated.map(a=>({
    wallAtMs:a.wallAtMs,videoPtsSeconds:a.videoPtsSeconds,
    captureSpanMs:a.captureSpanMs,
  }));
  const slopes=[],invalidIntervals=[],segments=[];
  let active=[anchorTimeline[0]];
  for(let i=1;i<anchorTimeline.length;i++){
    const prev=anchorTimeline[i-1],next=anchorTimeline[i];
    const slope=(next.videoPtsSeconds-prev.videoPtsSeconds)*1000/
      (next.wallAtMs-prev.wallAtMs);
    if(!Number.isFinite(slope)||slope<.75||slope>1.25){
      // A real browser frame timing discontinuity is a HARD GAP. Never
      // interpolate source actions through it or relax the 0.75..1.25 rule.
      // Still preserve independently observed, contiguous, long before/after
      // windows for forensic inspection of the original unmodified WebM.
      invalidIntervals.push({beforeWallAtMs:prev.wallAtMs,
        afterWallAtMs:next.wallAtMs,
        beforeVideoPtsSeconds:prev.videoPtsSeconds,
        afterVideoPtsSeconds:next.videoPtsSeconds,
        observedVideoToWallSlope:slope,invalidSegment:i-1});
      segments.push(active);
      active=[next];
    }else{
      slopes.push(slope);
      active.push(next);
    }
  }
  segments.push(active);
  if(invalidIntervals.length){
    const trusted=segments.filter(segment=>
      segment.length>=MIN_ANCHORS &&
      segment.at(-1).wallAtMs-segment[0].wallAtMs>=15000 &&
      segment.at(-1).videoPtsSeconds>segment[0].videoPtsSeconds);
    if(!trusted.length)return {status:'NOT EVALUATED',
      reason:'Native video frame anchors disagree: abrupt, reversed or implausible wall/video timebase',
      anchorsAccepted:separated.length,maxResidualMs,
      invalidSegment:invalidIntervals[0].invalidSegment,
      observedVideoToWallSlope:invalidIntervals[0].observedVideoToWallSlope};
    return {status:'PARTIALLY_CALIBRATED',
      method:'segmented-original-WebM-visual-anchors-forensics-only',
      reason:'Original WebM has unsafe compositor-clock gaps; full event/video comparison remains blocked',
      anchorsAccepted:separated.length,
      anchorsUsable:trusted.reduce((sum,part)=>sum+part.length,0),
      maxResidualMs,invalidIntervals,
      anchorSegments:trusted.map(segment=>({
        anchorTimeline:segment,firstWallAtMs:segment[0].wallAtMs,
        lastWallAtMs:segment.at(-1).wallAtMs,
        firstVideoPtsSeconds:segment[0].videoPtsSeconds,
        lastVideoPtsSeconds:segment.at(-1).videoPtsSeconds,
      })),
      caveat:'Only independently bounded intact sections may yield source-event timecode SEARCH handles. The gap and full-film synchronization are NOT calibrated. Event pixels, gameplay acceptance and reviewer votes remain NOT EVALUATED.'};
  }
  // Keep existing whole-film certification unchanged when every original
  // browser/PTS interval is independently valid.
  return {status:'CALIBRATED',
    method:maxResidualMs>350?'bounded-piecewise-original-WebM-visual-anchors':
      'full-frame-original-WebM-to-unmodified-viewport-screenshot',
    anchorsAccepted:separated.length,offsetMs,maxResidualMs,
    anchorTimeline,
    minVideoToWallSlope:Math.min(...slopes),
    maxVideoToWallSlope:Math.max(...slopes),
    caveat:'Bounded native-video timecode SEARCH only between visually matched original full-viewport anchors. Source-to-GPU latency and frame-visible actions are NOT established; no on-screen or blind-review acceptance.'};
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

function originalFrameDecodeArgs(video) {
  return ['-v','error','-i',video,'-vf',
    `scale=${THUMB_WIDTH}:${THUMB_HEIGHT},format=gray`,
    '-vsync','0','-f','rawvideo','-pix_fmt','gray','pipe:1'];
}
function readVideoFrames(video) {
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0',
    '-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',video],
  {encoding:'utf8',maxBuffer:16*1024*1024,timeout:45000}));
  const pts=(probe.frames||[]).map(frame=>Number(frame.best_effort_timestamp_time));
  if(!pts.length||pts.length>7200||pts.some(v=>!Number.isFinite(v)||v<0))
    throw new Error('Missing, invalid or oversized original video PTS');
  // Pinned isolated @ffmpeg-installer binary is FFmpeg 2018 (N-47683):
  // it does not recognize '-fps_mode passthrough' (added years later).
  // '-vsync 0' is the compatible historical passthrough: it MUST preserve
  // one output thumbnail per decoded native PTS. The equality check below
  // still vetoes any duplicate/drop or unexpected decoder disagreement.
  // This changes observational decoding ONLY, not the original WebM.
  const bytes=execFileSync('ffmpeg',originalFrameDecodeArgs(video),
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

// Calibrated source-event search handles are NOT visually verified events.
// Accept only real events emitted by the original read-only event index. Their
// source wall clock and native recording timebase must be separately measured.
function mapObservedEventTimecodes(events,calibration,durationSeconds) {
  const complete=calibration?.status==='CALIBRATED';
  const partial=calibration?.status==='PARTIALLY_CALIBRATED';
  if((!complete&&!partial)||
     !Number.isFinite(durationSeconds)||durationSeconds<0)return [];
  const timeline=complete&&Array.isArray(calibration.anchorTimeline)&&
    calibration.anchorTimeline.length>=MIN_ANCHORS
      ?calibration.anchorTimeline:null;
  // Partial evidence MUST contain actual separate trusted spans. Never accept
  // a single manufactured offset, or join a source event across an unsafe gap.
  const windows=partial?
    (Array.isArray(calibration.anchorSegments)?calibration.anchorSegments:[])
      .filter(w=>Array.isArray(w.anchorTimeline)&&
        w.anchorTimeline.length>=MIN_ANCHORS &&
        w.anchorTimeline.at(-1).wallAtMs-w.anchorTimeline[0].wallAtMs>=15000)
      .map(w=>w.anchorTimeline)
    :timeline?[timeline]:[];
  if(partial&&!windows.length)return [];
  if(complete&&!timeline&&!Number.isFinite(calibration.offsetMs))return [];
  // A native timecode remains a SEARCH handle, not a rendered event.
  const source=(Array.isArray(events)?events:[]).filter(event=>
    event&&typeof event.kind==='string'&&event.kind.length>0&&
    Number.isFinite(event.atMs)&&Number.isSafeInteger(event.floor)&&
    Number.isSafeInteger(event.sourceTick??event.tick)&&
    typeof (event.observedRunToken??event.runToken)==='string'&&
    (event.observedRunToken??event.runToken).length>0).slice(0,400);
  return source.flatMap(event=>{
    let nativeVideoSeconds,clockUncertaintyMs=null;
    if(windows.length){
      const window=windows.find(w=>event.atMs>=w[0].wallAtMs &&
        event.atMs<=w.at(-1).wallAtMs);
      if(!window)return [];
      const j=window.findIndex((anchor,i)=>i<window.length-1 &&
        event.atMs>=anchor.wallAtMs&&event.atMs<=window[i+1].wallAtMs);
      if(j<0)return [];
      const a=window[j],b=window[j+1];
      if(!Number.isFinite(a.wallAtMs)||!Number.isFinite(b.wallAtMs)||
        !Number.isFinite(a.videoPtsSeconds)||!Number.isFinite(b.videoPtsSeconds)||
        b.wallAtMs<=a.wallAtMs||b.videoPtsSeconds<=a.videoPtsSeconds)
        return [];
      const fraction=(event.atMs-a.wallAtMs)/(b.wallAtMs-a.wallAtMs);
      nativeVideoSeconds=a.videoPtsSeconds+
        fraction*(b.videoPtsSeconds-a.videoPtsSeconds);
      clockUncertaintyMs=Math.max(200,
        (Math.max(a.captureSpanMs||0,b.captureSpanMs||0)/2)+120);
    } else {
      // Historical standalone fully calibrated constant offset only.
      nativeVideoSeconds=(event.atMs+calibration.offsetMs)/1000;
    }
    return [{...event,nativeVideoSeconds,
      inOriginalVideo:nativeVideoSeconds>=0&&nativeVideoSeconds<=durationSeconds,
      clockUncertaintyMs,
      matchingMethod:partial?'partial-bounded-original-WebM-forensic-search':
        windows.length?'bounded-piecewise-source-to-native-PTS-search':
        'calibrated-wall-to-native-PTS-event-search',
      originalFullFilmTimebaseCertified:complete,
      eventVisibleInVideo:'NOT EVALUATED',
      sourceToPresentedFrameLatency:'NOT EVALUATED'}];
  });
}

function calibrateOriginalVideo({video,anchors,sourceTicks,sourceEvents}) {
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
    if(!['CALIBRATED','PARTIALLY_CALIBRATED'].includes(result.status))return evidence;
    const duration=frames.pts.at(-1);
    // Prefer the SAME original-source event index used by the 8-pair audit.
    // The old generic source-event extractor remains a backward-compatible
    // fallback for standalone consumers, not an independently inferred story.
    const observedEvents=Array.isArray(sourceEvents)
      ?sourceEvents:meaningfulSourceEvents(sourceTicks);
    evidence.sourceEventTimecodes=mapObservedEventTimecodes(
      observedEvents,result,duration);
    evidence.timecodeProvenance=Array.isArray(sourceEvents)
      ?'unaltered-original-source-event-index'
      :'read-only-source-tick-fallback';
    evidence.calibratedSourceEventSearchOnly=true;
    evidence.fullFilmTimebaseCertified=result.status==='CALIBRATED';
    evidence.partialFilmForensicsOnly=result.status==='PARTIALLY_CALIBRATED';
    evidence.originalVideoDurationSeconds=duration;
    return evidence;
  } catch(error) {
    return {...evidence,error:String(error?.message||error).slice(0,320),
      note:'Native footage was kept; no clock calibration or visual acceptance inferred.'};
  }
}

module.exports={assessVideoTimebase,distance,visuallyMatchAnchor,
  meaningfulSourceEvents,mapObservedEventTimecodes,calibrateOriginalVideo,
  FRAME_BYTES,originalFrameDecodeArgs,readVideoFrames};
