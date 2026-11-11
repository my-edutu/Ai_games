'use strict';
// P0 source-authentic, anonymous A/B ORIGINAL full-motion review artifact.
// Never renders frames, changes game authority, edits/retimes original WebMs,
// infers event visibility, or counts independent critics.
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {collect,FROZEN}=require('./tower-event-pairing.cjs');
const VIEWPORTS=['desktop','portrait'];
const REQUIRED=['guardian-hp-decrease','floor-transition'];
const OPTIONAL=['guardian-source-defeated','guardian-source-physical-threshold','guardian-earned-floor-nine-handoff'];

// Original raster-phase search is NOT source-event synchronization. Keep this
// check independent of the strict source cue veto and require two agreeing
// native samplers from the exact SAME immutable original WebM.
function nativeRasterPhase(record,viewport){
 const scene=record?.nativeScenePhase, clock=record?.videoClock;
 const phase=scene?.phase?.videoPhaseWitness,hud=scene?.hud?.visibleHudFloorChange;
 const floors=clock?.sourceEventTimecodes?.filter(e=>e.kind==='floor-transition' &&
   e.floor===9&&e.fromFloor===8&&e.toFloor===9&&e.observedEpisode===0&&
   e.inOriginalVideo===true&&Number.isFinite(e.nativeVideoSeconds));
 if(!scene||!clock||!Array.isArray(floors)||floors.length!==1||!hud||
    scene.sourceSha!==record.sourceSha||scene.originalWebMSha256!==record.videoSha256||
    scene.originalWebMBytes!==record.videoBytes||scene.originalVideoUnmodified!==true||
    scene.viewport!==viewport||scene.scenario!=='danger'||
    !['CHROMATIC_PHASE_NEAR_SOURCE_CUE_ONLY','SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE','NOT EVALUATED'].includes(scene.phase.status)||
    !['DRAWN_HUD_NEAR_SOURCE_SEARCH_ONLY','SOURCE_CUE_AND_DRAWN_HUD_DISAGREE'].includes(scene.hud.status)||
    scene.phase.sourceTick!==floors[0].sourceTick||scene.hud.sourceTick!==floors[0].sourceTick||
    scene.phase.eventPixelsConfirmed!==false||scene.hud.sourceEventIsScreenProof!==false||
    !(scene.phase.nativeOriginalFramesSampled>=240)||!(scene.hud.originalFramesSampled>=240)||
    !(scene.hud.recognitionCounts?.eight>=40&&scene.hud.recognitionCounts?.nine>=20)||
    hud.observedDigitBefore!==8||hud.observedDigitAfter!==9||
    !(hud.precedingEightFrames>=8&&hud.followingNineFrames>=4)||
    !Number.isFinite(hud.nativeVideoSeconds)||
    (phase && !Number.isFinite(phase.nativeSeconds))||
    (!phase && scene.phase.status!=='NOT EVALUATED')||
    !(hud.precisionSeconds>0&&hud.precisionSeconds<=.25)||
    (phase && !(phase.precisionSeconds>0&&phase.precisionSeconds<=.25))||
    (phase && Math.abs(hud.nativeVideoSeconds-phase.nativeSeconds)>.75)||
    hud.nativeVideoSeconds<3||hud.nativeVideoSeconds>=clock.originalVideoDurationSeconds-3)return null;
 return {nativeSeconds:hud.nativeVideoSeconds,
    evidence:phase?'confirmed-HUD-plus-color-scene':'confirmed-HUD-only-color-stage-inconclusive',
   sourceToRasterSeconds:Math.round((hud.nativeVideoSeconds-floors[0].nativeVideoSeconds)*1000)/1000};
}
function planPair(rows,viewport,candidateSha){
  const plan={viewport,status:'NOT EVALUATED',canReview:false,
    anchors:[],nativeRasterAnchors:[],unmatchedSourceBeats:[],failures:[],originalVideoUnmodified:true};
  const get=source=>rows.filter(r=>r.source===source&&r.scenario==='danger'&&r.viewport===viewport);
  const baseline=get('baseline'),candidate=get('candidate');
  if(baseline.length!==1||candidate.length!==1){
    plan.failures.push('missing-or-duplicate-original-recording');return plan;
  }
  const [a,b]=[baseline[0],candidate[0]];
  plan.source={baseline:a.sourceSha,candidate:b.sourceSha};
  for(const [source,record]of [['baseline',a],['candidate',b]]){
    const clock=record.videoClock,meta=record.motion;
    if(record.sourceSha!==(source==='baseline'?FROZEN:candidateSha) ||
       record.index?.sourceSha!==record.sourceSha ||
       clock?.sourceSha!==record.sourceSha ||
       !record.videoPresent || clock?.status!=='CALIBRATED' ||
       clock?.originalWebMSha256!==record.videoSha256 ||
       clock?.originalWebMBytes!==record.videoBytes ||
       clock?.originalVideoUnmodified!==true ||
       !(clock?.originalVideoDurationSeconds>=60) ||
       clock?.viewport?.name!==viewport ||
       clock?.viewport?.width!==(viewport==='portrait'?390:960) ||
       clock?.viewport?.height!==(viewport==='portrait'?844:600) ||
       clock?.scenario!=='danger' || meta?.scenario!=='danger' ||
       record.nativeFilmAudit?.sourceSha!==record.sourceSha ||
       record.nativeFilmAudit?.scenario!=='danger' ||
       record.nativeFilmAudit?.status!=='SOURCE_VIDEO_TRANSPORT_ONLY' ||
       !record.nativeFilmAudit?.viewports?.some(v=>v.viewport===viewport &&
         v.status==='SOURCE_VIDEO_TRANSPORT_ONLY' && Array.isArray(v.problems) &&
         v.problems.length===0 && v.originalWebMSha256===record.videoSha256 &&
         v.videoBytes===record.videoBytes &&
         v.native?.width===(viewport==='portrait'?390:960) &&
         v.native?.height===(viewport==='portrait'?844:600) &&
         v.native?.lastPtsSeconds-v.native?.firstPtsSeconds>=60) ||
       !Array.isArray(clock?.sourceEventTimecodes)){
      plan.failures.push('unverified-original-'+source);
    }
  }
  if(a.motion?.seed!==b.motion?.seed || a.motion?.graphicsTier!==b.motion?.graphicsTier ||
     a.videoClock?.seed!==b.videoClock?.seed ||
     a.videoClock?.graphicsTier!==b.videoClock?.graphicsTier){
    plan.failures.push('capture-conditions-not-matched');
  }
  if(plan.failures.length)return plan;
  const first=(record,kind)=>record.videoClock.sourceEventTimecodes
    .filter(e=>e.kind===kind && e.observedEpisode===0 &&
      e.inOriginalVideo===true &&
      e.eventVisibleInVideo==='NOT EVALUATED' &&
      e.floor===(['floor-transition','guardian-source-physical-threshold','guardian-earned-floor-nine-handoff'].includes(kind)?9:8) &&
      Number.isFinite(e.nativeVideoSeconds) &&
      e.nativeVideoSeconds>=3 &&
      e.nativeVideoSeconds<record.videoClock.originalVideoDurationSeconds-3 &&
      (!['floor-transition','guardian-source-physical-threshold','guardian-earned-floor-nine-handoff'].includes(kind)||e.fromFloor===8 && e.toFloor===9))
    .sort((x,y)=>x.nativeVideoSeconds-y.nativeVideoSeconds)[0]||null;
  for(const kind of [...REQUIRED,...OPTIONAL]){
    const before=first(a,kind),after=first(b,kind);
    if(!before||!after){
      plan.unmatchedSourceBeats.push({kind,
        baselineObserved:!!before,candidateObserved:!!after,
        verdict:'NOT COMPARABLE — never synthesize an absent source beat'});
      continue;
    }
    plan.anchors.push({kind,baselineSeconds:before.nativeVideoSeconds,
      candidateSeconds:after.nativeVideoSeconds,
      baselineTick:before.sourceTick,candidateTick:after.sourceTick,
      baselineEpisode:before.observedEpisode,candidateEpisode:after.observedEpisode,
      eventPixelsConfirmed:false,meaning:'native film inspection location only'});
  }
  // Genuine original movies remain inspectable even when identical native
  // source beats cannot be anchored in BOTH recordings. Never manufacture an
  // event sync; preserve the A/B comparison veto for missing shared beats.
  plan.files={baseline:a.videoPath,candidate:b.videoPath};
  plan.hashes={baseline:a.videoSha256,candidate:b.videoSha256};
  plan.fullVideoSeconds={baseline:a.videoClock.originalVideoDurationSeconds,
    candidate:b.videoClock.originalVideoDurationSeconds};
  plan.shuffleAB=createHash('sha256').update(
    a.videoSha256+':'+b.videoSha256+':'+viewport).digest()[0]%2===1;
  // The native WebM scene shift is a separate, hash-bound RASTER witness,
  // not evidence that the exact gameplay floor event was painted. The latest
  // genuine source film's calibrated event was 2-4s before the visual phase.
  // Never offer a frame-aligned review cue for that timestamp. Preserve the
  // unmodified films for honest UNSYNCHRONIZED inspection.
  for(const [source,record] of [['baseline',a],['candidate',b]]){
    const chroma=record.nativeScenePhase;
    if(chroma?.sourceSha!==record.sourceSha ||
       chroma.originalWebMSha256!==record.videoSha256 ||
       chroma.originalWebMBytes!==record.videoBytes ||
       chroma.viewport!==viewport || chroma.scenario!=='danger' ||
       chroma.originalVideoUnmodified!==true ||
       chroma.phase?.status!=='CHROMATIC_PHASE_NEAR_SOURCE_CUE_ONLY' ||
       chroma.hud?.status!=='DRAWN_HUD_NEAR_SOURCE_SEARCH_ONLY'){
      // Even if a scene changes color near an event, the original film's
      // actually DRAWN floor digit must agree before time-cued review.
      plan.failures.push('native-scene-phase-not-confirmed-'+source);
    }
  }
  // Genuine original HUD pixels can be cued for *visual inspection* even
  // though source/GPU latency differs. Do not turn this into source sync.
  const seenA=nativeRasterPhase(a,viewport),seenB=nativeRasterPhase(b,viewport);
  if(seenA&&seenB)plan.nativeRasterAnchors.push({
    kind:'DRAWN-HUD-8-to-9 (raster only)',baselineSeconds:seenA.nativeSeconds,
    baselineRasterEvidence:seenA.evidence,candidateRasterEvidence:seenB.evidence,
    candidateSeconds:seenB.nativeSeconds,
    baselineSourceToRasterSeconds:seenA.sourceToRasterSeconds,
    candidateSourceToRasterSeconds:seenB.sourceToRasterSeconds,
    eventPixelsConfirmed:false,physicalGatewayCrossingConfirmed:false,
    meaning:'native sustained HUD 8→9; optional chroma may corroborate; NOT source-event synchronization'});
  if(plan.failures.length){
    plan.unalignedInspectionOnly=true;
    return plan;
  }
  const have=new Set(plan.anchors.map(e=>e.kind));
  if(REQUIRED.some(kind=>!have.has(kind))){
    plan.failures.push('missing-common-guardian-and-onward-source-anchors');
    plan.unalignedInspectionOnly=true;
    return plan;
  }
  plan.canReview=true;
  // Actual common beats permit the event-cued review. An alternate concealed
  // order remains available, without changing either original 1x video.
  return plan;
}

function htmlFor(plans){
  // All generated references are under the trusted local archive. The viewer
  // never contacts a server, stores a vote, displays source SHAs, or retimes
  // the original 1x videos. The private JSON retains the identity/provenance.
  const publicPlans=plans.filter(p=>p.canReview||p.unalignedInspectionOnly).map(p=>({
    viewport:p.viewport, swap:p.shuffleAB, synchronized:p.canReview,
    anchors:p.anchors.map(a=>({kind:a.kind,a:a.baselineSeconds,b:a.candidateSeconds})),
    rasterAnchors:p.nativeRasterAnchors.map(a=>({kind:a.kind,a:a.baselineSeconds,b:a.candidateSeconds})),
    // In the reviewer-only bundle the file paths never reveal source order.
    files:{a:'review-media/'+p.viewport+'-a.webm',
      b:'review-media/'+p.viewport+'-b.webm'}
  }));
  const data=JSON.stringify(publicPlans).replace(/</g,'\\u003c');
  return '<!doctype html>\n'+
  '<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Anonymous authentic Tower duel A/B</title><style>'+
  'body{font:16px system-ui;background:#121921;color:#f3f5f7;margin:0 auto;max-width:1120px;padding:22px}'+
  'button,select{font:inherit;padding:10px;border:1px solid #8ba1a9;background:#213442;color:white;border-radius:7px;cursor:pointer}'+
  'header{line-height:1.5;margin-bottom:16px}.players{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+
  'video{width:100%;height:clamp(220px,55vh,680px);background:#000;object-fit:contain}'+
  '.controls{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}label{display:grid;gap:8px}'+
  '.message{margin-top:18px;font-size:.92rem;color:#c3d4db}h2{margin:6px 0}'+
  '@media(max-width:600px){body{padding:10px}.players{gap:5px}video{height:55vh}}'+
  '</style><header><h1>Unedited Tower duel — anonymous A/B</h1>'+
  '<p>These are TWO complete original, 1× speed source-pinned recordings. Choose a shared source event only when raster-aligned; otherwise cue separately observed drawn HUD 8→9 pixels, not an authoritative gateway event. This is an inspection aid, <strong>not proof of rendered causality or a quality verdict</strong>. Both clips remain unmodified. Different gameplay may occur between events.</p></header>'+
  '<div class="controls"><label>Viewport <select id="viewport"></select></label>'+
  '<label>Source event <select id="event"></select></label>'+
  '<button id="cue">Cue both 3s before observed phase</button><button id="play">Play both at 1×</button><button id="pause">Pause both</button></div>'+
  '<div class="players"><section><h2>A</h2><video id="a" controls playsinline preload="metadata"></video></section>'+
  '<section><h2>B</h2><video id="b" controls playsinline preload="metadata"></video></section></div>'+
  '<p class="message" id="status" role="status">No review has been submitted or counted. For LOOKS, FEELS and PLAYS judgments, inspect the full original movies and all ascent, movement, outcome and restart recordings independently.</p>'+
  '<script>const plans='+data+';const $=id=>document.getElementById(id);let plan,anchor,playing=false;'+
  'const opts=(el,values)=>{el.replaceChildren();for(const [label,value] of values){const o=document.createElement("option");o.textContent=label;o.value=value;el.append(o)}};'+
  'opts($("viewport"),plans.map((p,i)=>[p.viewport,i]));function reset(){plan=plans[Number($("viewport").value)];'+
  'const alt=(new URLSearchParams(location.search).get("swap")==="1");'+
  'const paths=alt?[plan.files.b,plan.files.a]:[plan.files.a,plan.files.b];'+
  '$("a").src=paths[0];$("b").src=paths[1];'+
  'const sync=plan.synchronized && plan.anchors.length>0;const rasterOnly=!sync&&plan.rasterAnchors.length>0;'+
  'opts($("event"),sync?plan.anchors.map((e,i)=>[e.kind,i]):rasterOnly?plan.rasterAnchors.map((e,i)=>[e.kind,i]):[["No shared source-event anchor",0]]);'+
  '$("event").disabled=!(sync||rasterOnly);$("cue").disabled=!(sync||rasterOnly);'+
  'if(sync||rasterOnly)cue();else{anchor=null;$("a").currentTime=0;$("b").currentTime=0;'+
  '$("status").textContent="Original unmodified footage only. Common guardian/onward source-event anchors missing: these films are NOT synchronized or comparable and remain NOT EVALUATED."}}'+
  'function cue(){if(!plan)return;const choices=plan.synchronized?plan.anchors:plan.rasterAnchors;if(!choices.length)return;anchor=choices[Number($("event").value)];const swap=plan.swap !== (new URLSearchParams(location.search).get("swap")==="1");'+
  'const t=swap?[anchor.b,anchor.a]:[anchor.a,anchor.b];$("a").pause();$("b").pause();playing=false;'+
  'for(let i=0;i<2;i++){const v=$(i?"b":"a");v.currentTime=Math.max(0,t[i]-3);v.playbackRate=1;}'+
  '$("status").textContent=plan.synchronized?"Source search cue: "+anchor.kind+". Exact event pixels are NOT evaluated.":"Raster-only cue: authentic drawn floor 8→9; source-event synchronization, guardian victory and grounded crossing are NOT VERIFIED. Complete original films are unchanged; quality NOT EVALUATED."}'+
  'async function play(){playing=true;for(const id of ["a","b"]){$(id).playbackRate=1;}await Promise.allSettled([$("a").play(),$("b").play()])}'+
  'function pause(){playing=false;$("a").pause();$("b").pause()}'+
  '$("viewport").onchange=reset;$("event").onchange=cue;$("cue").onclick=cue;$("play").onclick=play;$("pause").onclick=pause;'+
  // Re-anchor only if >350ms drift; preserved native source speed, no time stretch.
  'setInterval(()=>{if(!plan?.synchronized||!playing||!anchor||$("a").paused||$("b").paused)return;'+
  'const swap=plan.swap !== (new URLSearchParams(location.search).get("swap")==="1");'+
  'const delta=(swap?anchor.a-anchor.b:anchor.b-anchor.a);'+
  'if(Math.abs(($("b").currentTime-$("a").currentTime)-delta)>.35){$("b").currentTime=$("a").currentTime+delta;}},500);'+
  'reset();</script></html>\n';
}
function writeReview(root,out,candidateSha){
  if(!/^[0-9a-f]{40}$/.test(candidateSha||''))throw Error('missing immutable candidate SHA');
  const rows=collect(root);
  const plans=VIEWPORTS.map(viewport=>planPair(rows,viewport,candidateSha));
  const report={schemaVersion:1,stage:'P0 ungraded original full-motion event-aligned review',
    frozenBaselineSha:FROZEN,candidateSha,verdict:'NOT EVALUATED',
    eventPixelsConfirmed:false,fullMotionPaired:false,
    independentlyReviewed:{looks:0,feels:0,plays:0},
    hardware:'NOT EVALUATED',mediaOriginalBytesUnmodified:true,
    caveat:'Matching source-event names and native PTS do NOT prove identical decisions, visible cause/effect, viewer preference or supported-device performance.',
    plans,nativeRasterOnlyViewports:plans.filter(p=>p.unalignedInspectionOnly&&p.nativeRasterAnchors.length).map(p=>p.viewport),
    missingScenarios:['ascent','moving','outcome']};
  fs.mkdirSync(out,{recursive:true});
  for(const plan of plans){
    if(!plan.canReview&&!plan.unalignedInspectionOnly)continue;
    for(const source of ['baseline','candidate']){
      const record=rows.find(r=>r.source===source&&r.scenario==='danger'&&r.viewport===plan.viewport);
      const position=source===(plan.shuffleAB?'candidate':'baseline')?'a':'b';
      const from=path.join(root,record.videoPath),to=path.join(out,'blind-review','review-media',plan.viewport+'-'+position+'.webm');
      fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);
      const hash=createHash('sha256').update(fs.readFileSync(to)).digest('hex');
      if(hash!==plan.hashes[source])throw Error('copy-sha256-mismatch');
    }
  }
  // Only the separate blind-review/ directory is to be sent to reviewers.
  // Its video names, HTML and on-screen copy contain NO source identities.
  // Keep the provenance mapping and source SHAs outside that bundle for audit.
  fs.mkdirSync(path.join(out,'blind-review'),{recursive:true});
  fs.writeFileSync(path.join(out,'blind-review','index.html'),htmlFor(plans));
  report.reviewerOnlyDirectory='blind-review/';
  report.shareOnlyThisDirectoryWithIndependentCritics=true;
  report.unalignedOriginalViewports=plans.filter(p=>p.unalignedInspectionOnly).map(p=>p.viewport);
  fs.writeFileSync(path.join(out,'review-manifest.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}
if(require.main===module){
  const root=process.argv[2]||'artifacts/tower-event-pair-input';
  const out=process.argv[3]||'artifacts/tower-event-pairs';
  const report=writeReview(root,out,process.env.TOWER_EXPECTED_CANDIDATE_SHA);
  process.stdout.write('Unedited event-aligned duel A/B: '+report.plans.filter(p=>p.canReview).length+
    '/2 viewports; independent experience NOT EVALUATED.\n');
  if(report.plans.some(p=>p.failures.length))process.exitCode=1;
}
module.exports={planPair,writeReview,htmlFor};
