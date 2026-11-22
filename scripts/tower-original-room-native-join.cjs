'use strict';
// Read-only P0 join of *returned Three.js scene owners* to independent,
// unmodified native WebM frame-search times. This is NOT a pixel/quality gate.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const SHA = /^[0-9a-f]{40}$/;
const VIEWS = new Set(['desktop', 'portrait']);
const finite = Number.isFinite;
const round = n => finite(n) ? +n.toFixed(3) : null;
function nativePtsFromAnchors(wallMs, anchors) {
  if (!finite(wallMs) || !Array.isArray(anchors) || anchors.length < 3) return null;
  // Never extrapolate a first/last screen capture or bridge an unsafe gap.
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i-1], b = anchors[i];
    if (![a?.wallAtMs,a?.videoPtsSeconds,b?.wallAtMs,b?.videoPtsSeconds]
      .every(finite) || b.wallAtMs <= a.wallAtMs ||
        wallMs < a.wallAtMs || wallMs > b.wallAtMs) continue;
    const slope = (b.videoPtsSeconds-a.videoPtsSeconds)*1000/(b.wallAtMs-a.wallAtMs);
    if (slope < .75 || slope > 1.25 ||
        b.wallAtMs-a.wallAtMs > 12000) return null;
    return round(a.videoPtsSeconds + (wallMs-a.wallAtMs)*slope/1000);
  }
  return null;
}
function summarizeReturnedOwners(rows) {
  // Do NOT equate a successful renderer return to native compositor pixels.
  const old = r => r?.originalOwnerPresent===true &&
    finite(r.originalGatewayOpacity) && r.originalGatewayOpacity>.035;
  const next = r => r?.successorOwnerPresent===true &&
    r.successorStructuralRootVisible===true &&
    finite(r.successorStructuralOpacity) && r.successorStructuralOpacity>.015 &&
    Number.isSafeInteger(r.successorStructuralVisibleReturns) &&
    r.successorStructuralVisibleReturns>=1;
  const firstIndex = predicate => rows.findIndex(predicate);
  const firstOld = firstIndex(old), firstNext = firstIndex(next);
  const firstShared = firstIndex(r => old(r) && next(r));
  const firstOldGoneAfterSeen = firstOld < 0 ? -1 :
    rows.findIndex((r,i)=>i>firstOld && !old(r));
  const potentialGap = firstOldGoneAfterSeen>=0 &&
    (firstNext<0 || firstOldGoneAfterSeen<firstNext);
  return {firstOldReturnIndex:firstOld>=0?firstOld:null,
    firstReturnedStructuralIndex:firstNext>=0?firstNext:null,
    firstJointOldNewReturnedSceneIndex:firstShared>=0?firstShared:null,
    firstOldAbsentAfterOldReturnIndex:firstOldGoneAfterSeen>=0
      ?firstOldGoneAfterSeen:null,
    returnOwnerGapBeforeNextStructure:potentialGap,
    finding:firstOld<0?'NO_ORIGINAL_RETURNED_SCENE_OBSERVED':
      potentialGap?'OLD_OWNER_LOST_BEFORE_QUALIFIED_SUCCESSOR_RETURN':
      firstShared>=0?'SCENE_OWNERS_CO_RETURNED_BUT_PIXELS_NOT_ESTABLISHED':
      firstNext>=0?'NO_JOINT_OWNER_RETURN_OBSERVED':
      'SUCCESSOR_STRUCTURAL_RETURN_NOT_OBSERVED',
    limitation:'Only scene visibility/material state after successful WebGL return. Cannot prove visible native pixels, original camera composition, guardian defeat, crossing or review acceptance.'};
}
function joinOriginalRoomEvidence({sourceSha,viewport,clock,phase,timeline,videoHash,videoBytes}) {
  const report = {schemaVersion:1,sourceSha,viewport,scenario:'danger',
    stage:'P0 OPEN',verdict:'NOT EVALUATED',nativePixelMatched:false,
    independentReviewCounts:{looks:0,feels:0,plays:0},
    deviceFrameTimesAndMemory:'NOT EVALUATED',status:'NOT EVALUATED',
    limitations:['A WebGL render-return is not GPU completion or a native WebM pixel',
      'Native compositor anchor calibration gives event-search PTS only, never confirms game action pixels',
      'Original 1x full-motion films and independent blind assessment remain required']};
  const fail = reason => ({...report,reason});
  if (!SHA.test(sourceSha||'') || !VIEWS.has(viewport))return fail('invalid-source-or-viewport');
  if (!timeline || timeline.sourceSha!==sourceSha || timeline.scenario!=='danger' ||
      timeline.viewport!==viewport || timeline.status!=='SOURCE_RENDER_RETURNS_ONLY' ||
      !Array.isArray(timeline.returnedRoomFrames) ||
      !timeline.returnedRoomFrames.length)return fail('no-authentic-source-pinned-returned-room-timeline');
  if (!clock || clock.sourceSha!==sourceSha || clock.scenario!=='danger' ||
      clock.status!=='CALIBRATED' || clock.calibration?.status!=='CALIBRATED' ||
      clock.originalWebMSha256!==videoHash ||
      clock.originalWebMBytes!==videoBytes ||
      !(clock.originalVideoDurationSeconds>=60) ||
      !Array.isArray(clock.calibration.anchorTimeline) ||
      clock.calibration.anchorTimeline.length<3)
    return fail('native-video-timebase-not-fully-calibrated-to-unchanged-WebM');
  if (!phase || phase.sourceSha!==sourceSha ||
      phase.originalWebMSha256!==videoHash ||
      phase.originalVideoUnmodified!==true ||
      phase.viewport!==viewport || phase.scenario!=='danger')
    return fail('missing-source-and-original-video-verified-native-phase');
  const anchors = clock.calibration.anchorTimeline;
  if (anchors.some((a,i)=>i>0 && a.wallAtMs<=anchors[i-1].wallAtMs))
    return fail('invalid-or-nonmonotonic-native-compositor-anchors');
  if (timeline.returnedRoomFrames.length>80)return fail('unbounded-returned-room-timeline');
  let previousWall=-Infinity,run=null;
  const aligned=[];
  for (const [i,r] of timeline.returnedRoomFrames.entries()) {
    if (!r || r.sourceBound!==true ||
        typeof r.runToken!=='string' || !r.runToken ||
        !Number.isSafeInteger(r.sourceTick) || !finite(r.returnedWallMs) ||
        r.returnedWallMs<=previousWall ||
        (run!==null && r.runToken!==run))
      return fail('invalid-stale-or-mixed-returned-scene-owner-evidence');
    previousWall=r.returnedWallMs;
    run=r.runToken;
    const pts=nativePtsFromAnchors(r.returnedWallMs,anchors);
    aligned.push({index:i,sourceTick:r.sourceTick,
      nativeSearchPtsSeconds:pts,
      nativePtsIndependentlyConfirmedFrame:false,
      originalOwnerPresent:r.originalOwnerPresent===true,
      originalGatewayOpacity:finite(r.originalGatewayOpacity)
        ?round(r.originalGatewayOpacity):null,
      originalDeckOpacity:finite(r.originalDeckOpacity)
        ?round(r.originalDeckOpacity):null,
      successorOwnerPresent:r.successorOwnerPresent===true,
      successorStructuralRootVisible:r.successorStructuralRootVisible===true,
      successorStructuralOpacity:finite(r.successorStructuralOpacity)
        ?round(r.successorStructuralOpacity):null,
      successorStructuralVisibleReturns:Number.isSafeInteger(r.successorStructuralVisibleReturns)
        ?r.successorStructuralVisibleReturns:null,
      camera:r.submittedCamera ?? null,
      cameraGaze:r.submittedGaze ?? null,
      fogColor:r.submittedFogColor ?? null});
  }
  const summary=summarizeReturnedOwners(aligned);
  const phaseSeconds=phase.phase?.videoPhaseWitness?.nativeSeconds ?? null;
  const hudSeconds=phase.hud?.observed?.nativeVideoSeconds ??
    phase.visibleHandoff?.hudNativeVideoSeconds ?? null;
  const near = finite(phaseSeconds)
    ?aligned.filter(x=>finite(x.nativeSearchPtsSeconds) &&
       Math.abs(x.nativeSearchPtsSeconds-phaseSeconds)<=1.25):[];
  return {...report,status:'SOURCE_OWNER_AND_NATIVE_SEARCH_TIMELINE_JOINED',
    sourceReturnedRoomFrames:aligned.length,
    nativePtsSearchHandles:aligned.filter(x=>finite(x.nativeSearchPtsSeconds)).length,
    firstDrawnFloor9HudSeconds:finite(hudSeconds)?hudSeconds:null,
    firstSustainedVioletVideoSeconds:finite(phaseSeconds)?phaseSeconds:null,
    nativeChromaEvidenceIsNotGameplayEvent:true,
    sourceReturnedRoomSummary:summary,
    returnedFramesNearNativeColorShift:near,
    alignedSceneOwnerReturns:aligned,
    nextAction:summary.returnOwnerGapBeforeNextStructure
      ?'Inspect actual old-geometry teardown versus successor scene construction; fix shared old-world/new-shaft lifecycle, then capture 1x native gameplay again.'
      :'Check original camera projection against verified full-motion native gateway, hero, true receiving roof and onward platform; if camera fails, fix shared physical staging. Do not award P0.'};
}
function inspectViewport(root,sourceSha,viewport){
  const dir=path.join(root,viewport);
  const readJson=name=>{try{return JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));}catch{return null;}};
  let videoHash=null,videoBytes=null;
  try {const video=fs.readFileSync(path.join(dir,'live.webm'));
    videoHash=createHash('sha256').update(video).digest('hex');videoBytes=video.length;}catch{}
  const report=joinOriginalRoomEvidence({sourceSha,viewport,
    clock:readJson('native-video-clock.json'),
    phase:readJson('native-scene-phase.json'),
    timeline:readJson('original-to-void-returned-room-timeline.json'),
    videoHash,videoBytes});
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'original-room-native-alignment.json'),
    JSON.stringify(report,null,2)+'\n');
  return report;
}
if(require.main===module){
  const [root,sourceSha]=process.argv.slice(2);
  if(!root || !SHA.test(sourceSha||'')){
    console.error('Usage: node scripts/tower-original-room-native-join.cjs <danger-dir> <40-char-source-sha>');
    process.exitCode=2;
  }else {
    for (const viewport of VIEWS){const result=inspectViewport(root,sourceSha,viewport);
      console.log(JSON.stringify({viewport,status:result.status,reason:result.reason??null,
        finding:result.sourceReturnedRoomSummary?.finding??null,
        nativePtsSearchHandles:result.nativePtsSearchHandles??0,
        verdict:result.verdict}));}
  }
}
module.exports={nativePtsFromAnchors,summarizeReturnedOwners,joinOriginalRoomEvidence,inspectViewport};
