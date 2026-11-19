'use strict';
// P0: authenticated, unedited A/B ORIGINAL movies for EVERY required
// gameplay scene. These are honest inspection media, never source-event matched
// video, real-time GPU performance evidence, independent reviews or a PASS.
const {createHash}=require('node:crypto');
const SCENARIOS=Object.freeze(['ascent','moving','danger','outcome']);
const VIEWPORTS=Object.freeze(['desktop','portrait']);
const HASH=/^[0-9a-f]{64}$/;
function archivePlan(rows,scenario,viewport,candidateSha,frozenSha) {
  const plan={scenario,viewport,status:'NOT EVALUATED',canReview:false,
    unalignedInspectionOnly:false,anchors:[],nativeRasterAnchors:[],
    unmatchedSourceBeats:[],failures:[],originalVideoUnmodified:true,
    eventPixelsConfirmed:false,sourceEventMatched:false};
  const get=source=>rows.filter(r=>r.source===source&&
    r.scenario===scenario&&r.viewport===viewport);
  const a=get('baseline'),b=get('candidate');
  if(a.length!==1||b.length!==1){
    plan.failures.push('missing-or-duplicate-original-recording');
    return plan;
  }
  const originals=[a[0],b[0]];
  const width=viewport==='desktop'?960:390;
  const height=viewport==='desktop'?600:844;
  const uncalibrated=[];
  // Native decoder/immutable WebM provenance and source-to-video TIMEBASE
  // are separate checks. A genuine 60s original may be safe for raw unaligned
  // inspection even if the CDP visual-anchor fit failed. Never assign event
  // cues, "canReview", votes or a passing comparison from that raw film.
  for(let i=0;i<2;i++){
    const record=originals[i],sha=i===0?frozenSha:candidateSha;
    const clock=record.videoClock,meta=record.motion,audit=record.nativeFilmAudit;
    const native=audit?.viewports?.filter(v=>v.viewport===viewport);
    const audited=native?.length===1?native[0]:null;
    const calibrated=clock?.status==='CALIBRATED';
    if(!calibrated)uncalibrated.push(record.source);
    if(record.sourceSha!==sha||record.index?.sourceSha!==sha||
       record.index?.scenario!==scenario ||
       clock?.sourceSha!==sha||clock?.scenario!==scenario||
       meta?.sourceSha!==sha||meta?.scenario!==scenario||
       meta?.viewport?.width!==width||meta?.viewport?.height!==height||
       !record.videoPresent||!HASH.test(record.videoSha256||'')||
       !(record.videoBytes>0)||
       typeof record.videoPath!=='string'||!record.videoPath||
       clock?.originalWebMSha256!==record.videoSha256||
       clock?.originalWebMBytes!==record.videoBytes||
       clock?.originalVideoUnmodified!==true||
       clock?.viewport?.name!==viewport||
       clock?.viewport?.width!==width||clock?.viewport?.height!==height||
       (calibrated && !(clock.originalVideoDurationSeconds>=60))||
       (Number.isFinite(clock?.originalVideoDurationSeconds) &&
         clock.originalVideoDurationSeconds<60)||
       !(meta?.actualWallSeconds>=60)||
       audit?.sourceSha!==sha||audit?.scenario!==scenario||
       audit?.status!=='SOURCE_VIDEO_TRANSPORT_ONLY'||
       audited?.status!=='SOURCE_VIDEO_TRANSPORT_ONLY'||
       !Array.isArray(audited?.problems)||audited.problems.length!==0||
       audited.originalWebMSha256!==record.videoSha256||
       audited.videoBytes!==record.videoBytes||
       audited.native?.width!==width||audited.native?.height!==height||
       !(audited.native?.lastPtsSeconds-audited.native?.firstPtsSeconds>=60))
      plan.failures.push('unverified-original-'+record.source);
  }
  if(originals[0].motion?.seed!==originals[1].motion?.seed||
     originals[0].motion?.graphicsTier!==originals[1].motion?.graphicsTier||
     originals[0].motion?.reducedMotion!==originals[1].motion?.reducedMotion||
     originals[0].motion?.soundEnabled!==originals[1].motion?.soundEnabled||
     originals[0].index?.seed!==originals[1].index?.seed||
     originals[0].videoClock?.seed!==originals[1].videoClock?.seed||
     originals[0].videoClock?.graphicsTier!==originals[1].videoClock?.graphicsTier)
    plan.failures.push('capture-conditions-not-matched');
  if(plan.failures.length)return plan;
  plan.files={baseline:originals[0].videoPath,candidate:originals[1].videoPath};
  plan.hashes={baseline:originals[0].videoSha256,candidate:originals[1].videoSha256};
  plan.fullVideoSeconds=Object.fromEntries(originals.map(record=>{
    const native=record.nativeFilmAudit.viewports.find(v=>v.viewport===viewport).native;
    // The independent decoded PTS span, not an invented or transferred
    // browser wall offset, is the only raw-film duration when timebase fails.
    return [record.source, record.videoClock.status==='CALIBRATED'
      ?record.videoClock.originalVideoDurationSeconds
      :native.lastPtsSeconds-native.firstPtsSeconds];
  }));
  plan.shuffleAB=createHash('sha256').update(
    originals[0].videoSha256+':'+originals[1].videoSha256+':'+
    scenario+':'+viewport).digest()[0]%2===1;
  if(uncalibrated.length){
    // Keep the unedited authenticated originals inspectable; explicitly veto
    // matching and record the exact source whose native timeline failed.
    plan.failures.push(...uncalibrated.map(source=>
      'uncalibrated-native-source-video-clock-'+source));
    plan.uncalibratedSources=uncalibrated;
    plan.nativeTimebaseVerified=false;
    plan.originalVideoAuthenticated=true;
    plan.unalignedInspectionOnly=true;
    plan.caveat='Transport-authenticated unedited 60+s native WebM only. Native source-event clock FAILED; visual inspection is unaligned and NOT EVALUATED. No event cue, vote or acceptance.';
    return plan;
  }
  // No event cue is inferred from a scenario's file name, seed or clock:
  // ordinary ascent, moving hazards and outcome/restart are observed later.
  plan.unalignedInspectionOnly=true;
  plan.originalVideoAuthenticated=true;
  plan.caveat='Unedited 60+s original WebM, hash-bound to source; scene beats and frame-visible action NOT independently verified.';
  return plan;
}
function completeOriginalFilmPlans(rows,dangerPlans,candidateSha,frozenSha) {
  const plans=[];
  for(const scenario of SCENARIOS)for(const viewport of VIEWPORTS){
    if(scenario==='danger'){
      const plan=dangerPlans.find(p=>p.viewport===viewport);
      if(!plan)throw Error('missing guardian danger plan '+viewport);
      const original=archivePlan(rows,'danger',viewport,candidateSha,frozenSha);
      plans.push({...plan,scenario:'danger',
        originalVideoAuthenticated:original.originalVideoAuthenticated===true,
        // Authentic original bytes and source-event pairing are SEPARATE
        // gates. A 1.3s honest source-to-pixel delay must fail pairing,
        // never disappear from the full ORIGINAL visual review.
        unalignedInspectionOnly:original.originalVideoAuthenticated===true &&
          (plan.unalignedInspectionOnly===true || plan.canReview!==true),
        ...(original.originalVideoAuthenticated!==true?{
          canReview:false,failures:[...plan.failures,
            'authentic-original-film-missing-or-invalid',...original.failures]
        }:{})});
    }else plans.push(archivePlan(rows,scenario,viewport,candidateSha,frozenSha));
  }
  return plans;
}
module.exports={SCENARIOS,VIEWPORTS,archivePlan,completeOriginalFilmPlans};
