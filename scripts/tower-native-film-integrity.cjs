'use strict';
// Inspect the actual, unedited browser WebM and its immutable-source sidecars.
// This is capture TRANSPORT integrity, not a LOOKS/FEELS/PLAYS score, a
// measured device frame rate, or proof an event appeared on screen.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const DIMENSIONS = Object.freeze({
  desktop: Object.freeze({width:960,height:600}),
  portrait: Object.freeze({width:390,height:844}),
});
const MIN_DURATION = 60;
// More than half a second without a recorded picture or sustained <12 fps
// cannot support honest normal-speed FEELS/PLAYS comparison, even when the
// WebM container claims 60+ seconds. These are film-transport vetoes, NOT
// device FPS budgets or a positive quality review.
const MIN_RECORDED_FPS = 12;
const MAX_FRAME_GAP_SECONDS = .5;
function inspectFilmMetadata(probe, motion, index, expected) {
  const problems = [], warnings = [];
  const target = DIMENSIONS[expected.viewport];
  if (!target) throw new Error('Unsupported viewport: ' + expected.viewport);
  const stream = (probe?.streams || []).find(s => s.codec_type === 'video');
  if (!stream || stream.width !== target.width || stream.height !== target.height)
    problems.push('native-WebM-viewport-not-' + target.width + 'x' + target.height);
  const frames = Array.isArray(probe?.frames) ? probe.frames : [];
  const pts = frames.map(f => Number(f.best_effort_timestamp_time));
  const allPtsValid = pts.length >= 2 &&
    pts.every(v => Number.isFinite(v) && v >= 0) &&
    pts.every((v,i) => i === 0 || v > pts[i-1]);
  if (!allPtsValid) problems.push('missing-or-nonmonotonic-native-PTS');
  const first = allPtsValid ? pts[0] : null;
  const last = allPtsValid ? pts[pts.length-1] : null;
  const duration = Number(probe?.format?.duration);
  // The container duration and actual decoded frame coverage must both
  // support a 60+ second assessment. A long header with 8s of pictures fails.
  if (!Number.isFinite(duration) || duration < MIN_DURATION)
    problems.push('native-container-shorter-than-60s');
  if (!allPtsValid || last - first < MIN_DURATION)
    problems.push('decoded-video-frames-do-not-span-60s');
  // A long recording with an empty opening or trailing encoded blackout
  // cannot be interpreted as an uninterrupted source-matched first scene.
  if (allPtsValid && first > 1)
    problems.push('native-film-missing-opening-gameplay');
  if (allPtsValid && Number.isFinite(duration) && duration-last > 1.5)
    problems.push('native-film-trailing-picture-gap');
  const gaps = allPtsValid ? pts.slice(1).map((v,i) => v - pts[i]) : [];
  const maxFrameGapSeconds = gaps.length ? Math.max(...gaps) : null;
  const presentedFramesPerSecond = allPtsValid && duration > 0
    ? pts.length / duration : null;
  if (maxFrameGapSeconds !== null && maxFrameGapSeconds > MAX_FRAME_GAP_SECONDS)
    problems.push('original-film-has-over-0.5s-without-a-video-frame');
  else if (maxFrameGapSeconds !== null && maxFrameGapSeconds > .20)
    warnings.push('original-film-has-visible-cadence-gaps');
  if (presentedFramesPerSecond !== null && presentedFramesPerSecond < MIN_RECORDED_FPS)
    problems.push('original-film-too-sparse-for-reliable-motion-judgement');
  else if (presentedFramesPerSecond !== null && presentedFramesPerSecond < 20)
    warnings.push('original-film-has-low-motion-sampling');
  if (motion?.sourceSha !== expected.sourceSha || index?.sourceSha !== expected.sourceSha)
    problems.push('source-sidecar-SHA-mismatch');
  if (motion?.scenario !== expected.scenario || index?.scenario !== expected.scenario)
    problems.push('source-sidecar-scenario-mismatch');
  if (motion?.viewport?.name !== expected.viewport ||
      motion?.viewport?.width !== target.width ||
      motion?.viewport?.height !== target.height ||
      index?.viewport?.name !== expected.viewport ||
      index?.viewport?.width !== target.width ||
      index?.viewport?.height !== target.height)
    problems.push('source-sidecar-viewport-mismatch');
  if (motion?.seed !== 'tower-transformation-capture-v1' ||
      index?.seed !== motion?.seed)
    problems.push('recording-seed-mismatch');
  // Do not compare 60 seconds of a different graphics/reduced-motion mode
  // under the same source SHA. These are the declared CI capture settings;
  // native hardware and non-muted audio remain separate acceptance tasks.
  if (motion?.graphicsTier !== 'low' || index?.recordingQuality !== 'low' ||
      motion?.reducedMotion !== false || motion?.soundEnabled !== false)
    problems.push('recording-conditions-not-matched');
  if (Array.isArray(motion?.errors) && motion.errors.length)
    problems.push('original-browser-reported-errors');
  const requiredFloor = expected.scenario === 'danger' ? 8 :
    expected.scenario === 'moving' ? 7 : 0;
  if (motion?.launchFloor !== String(requiredFloor) ||
      motion?.startScene?.floor !== requiredFloor ||
      !Number.isSafeInteger(motion?.startScene?.tick) ||
      motion.startScene.tick < 0 || motion.startScene.tick > 250 ||
      typeof motion?.startScene?.runToken !== 'string' ||
      !motion.startScene.runToken)
    problems.push('wrong-or-late-real-source-episode');
  if (!Number.isFinite(motion?.actualWallSeconds) ||
      motion.actualWallSeconds < MIN_DURATION)
    problems.push('browser-observation-shorter-than-60s');
  const sourceEpisodeObserved = motion?.sourceStory?.sameEpisodeSourceSequenceObserved === true;
  if (!sourceEpisodeObserved)
    problems.push('required-source-authentic-episode-not-observed');
  const sourceStoryStatus = sourceEpisodeObserved
    ? 'SOURCE_EPISODE_OBSERVED_NOT_VIDEO_VERIFIED' : 'NOT EVALUATED';
  return {
    status: problems.length ? 'BLOCKED' : 'SOURCE_VIDEO_TRANSPORT_ONLY',
    problems, warnings,
    sourceSha: expected.sourceSha, scenario:expected.scenario,
    viewport:expected.viewport,
    native: {width:stream?.width ?? null,height:stream?.height ?? null,
      codec:stream?.codec_name ?? null,containerDurationSeconds:Number.isFinite(duration)?duration:null,
      decodedFrameCount:pts.length,firstPtsSeconds:first,lastPtsSeconds:last,
      maxFrameGapSeconds,presentedFramesPerSecond},
    motionReviewability: warnings.length ? 'NOT EVALUATED: original footage has cadence warnings; inspect at normal speed' :
      'NOT EVALUATED: no full-motion independent human inspection',
    sourceStoryStatus, visibleGameplayEvents:'NOT EVALUATED',
    independentBlindReviews:'NOT EVALUATED', realDevicePerformance:'NOT EVALUATED',
    caveat:'ffprobe validates unmodified encoded transport only. A 60s WebM, even with correct dimensions and source-sidecars, does not prove visible guardian hits, physical gateway, restart, artistic quality or realtime hardware performance.',
  };
}
function auditCaptureFolder(dir, expected) {
  const records = [];
  for (const viewport of Object.keys(DIMENSIONS)) {
    const folder = path.join(dir,viewport), video = path.join(folder,'live.webm');
    try {
      const motion = JSON.parse(fs.readFileSync(path.join(folder,'motion.json'),'utf8'));
      const index = JSON.parse(fs.readFileSync(path.join(folder,'event-index.json'),'utf8'));
      const raw = execFileSync('ffprobe',['-v','error','-select_streams','v:0',
        '-show_streams','-show_frames','-show_format',
        '-show_entries','stream=codec_type,codec_name,width,height:frame=best_effort_timestamp_time:format=duration',
        '-of','json',video],{encoding:'utf8',maxBuffer:16*1024*1024,timeout:60000});
      const value = inspectFilmMetadata(JSON.parse(raw),motion,index,{...expected,viewport});
      value.videoBytes=fs.statSync(video).size;
      value.originalWebMSha256=createHash('sha256').update(fs.readFileSync(video)).digest('hex');
      records.push(value);
    } catch (error) {
      records.push({viewport,sourceSha:expected.sourceSha,scenario:expected.scenario,
        status:'BLOCKED',problems:['native-WebM-or-source-sidecar-unreadable'],
        error:String(error?.message || error).slice(0,500),
        visibleGameplayEvents:'NOT EVALUATED',realDevicePerformance:'NOT EVALUATED'});
    }
  }
  return {schemaVersion:1,sourceSha:expected.sourceSha,scenario:expected.scenario,
    status:records.every(r=>r.status==='SOURCE_VIDEO_TRANSPORT_ONLY')?
      'SOURCE_VIDEO_TRANSPORT_ONLY':'BLOCKED',
    viewports:records,qualityVerdict:'NOT EVALUATED',
    note:'Integrity gate only. Review authentic full-motion video and event timestamps separately.'};
}
if (require.main === module) {
  const [directory,sourceSha,scenario] = process.argv.slice(2);
  if (!directory || !/^[0-9a-f]{40}$/.test(sourceSha||'') ||
      !['ascent','moving','danger','outcome'].includes(scenario)) {
    console.error('Usage: node scripts/tower-native-film-integrity.cjs <scenario-folder> <exact-source-SHA> <scenario>');
    process.exitCode=2;
  } else {
    const result=auditCaptureFolder(path.resolve(directory),{sourceSha,scenario});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if (result.status==='BLOCKED') process.exitCode=1;
  }
}
module.exports={DIMENSIONS,inspectFilmMetadata,auditCaptureFolder};
