'use strict';
// SOURCE EVENT SEARCH ONLY. Never manufacture frame-time calibration, reviewed
// footage, identical gameplay or acceptance from matching event names.
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const FROZEN='1731b380851162741761c5569e2bc152a0869ca9';
const SCENARIOS=['ascent','danger','moving','outcome'],VIEWPORTS=['desktop','portrait'];
const KINDS=new Set(['route-selection','guardian-present','guardian-hp-decrease',
 'guardian-source-defeated','floor-transition','hazard-charge-begin',
 'observed-moving-deck-position-change','source-result-phase','source-run-token-change',
 'source-supported-gate-approach','guardian-earned-floor-nine-handoff',
 'guardian-source-physical-threshold']);
function signature(e){
 if(!e||!KINDS.has(e.kind)||!Number.isSafeInteger(e.floor))return null;
 const parts=[e.kind,e.floor];
 if(e.kind==='floor-transition'||(e.kind==='guardian-earned-floor-nine-handoff'||e.kind==='guardian-source-physical-threshold'))parts.push(e.fromFloor,e.toFloor);
 if(e.kind==='route-selection')parts.push(e.selectedPlatformId);
 if(e.kind==='hazard-charge-begin')parts.push(e.hazardId);
 if(e.kind==='observed-moving-deck-position-change')parts.push(e.platformId);
 if(e.kind==='source-result-phase')parts.push(e.phase,e.resultKind,e.reason);
 return parts.join(':');
}
function matchSourceEvents(a,b){
 const old=(Array.isArray(a)?a:[]).filter(e=>signature(e)&&Number.isFinite(e.atMs));
 const current=(Array.isArray(b)?b:[]).filter(e=>signature(e)&&Number.isFinite(e.atMs));
 // Never silently splice a second post-death attempt onto the first attempt.
 // Missing episode fields in historical indexes remain explicitly ambiguous.
 const episode=e=>Number.isSafeInteger(e.observedEpisode)&&e.observedEpisode>=0
   ? e.observedEpisode : null;
 const sameEvent=(l,r)=>signature(l)===signature(r)&&episode(l)===episode(r);
 let cursor=0;const pairs=[],missingFromCandidate=[],missingFromBaseline=[];
 for(const e of old){
  const key=signature(e);
  const i=current.findIndex((v,j)=>j>=cursor&&sameEvent(e,v));
  if(i<0){missingFromCandidate.push(key);continue;}
  for(let j=cursor;j<i;j++)missingFromBaseline.push(signature(current[j]));
  pairs.push({event:key,kind:e.kind,floor:e.floor,
   baselineObservationMs:e.atMs,candidateObservationMs:current[i].atMs,
   baselineApproxOffsetMs:e.relativeToFirstBrowserObservationMs??null,
   candidateApproxOffsetMs:current[i].relativeToFirstBrowserObservationMs??null,
   baselineObservedEpisode:episode(e),candidateObservedEpisode:episode(current[i]),
   observedEpisodeProvenance:episode(e)!==null,
   uneditedVideoTimecodeVerified:false,visuallyMatched:false});
  cursor=i+1;
 }
 for(let i=cursor;i<current.length;i++)missingFromBaseline.push(signature(current[i]));
 return {pairs,missingFromBaseline,missingFromCandidate};
}
// Veto stale native evidence whose serialized source events were appended out
// of wall-clock or run-episode order. The source collector must repair its
// ordering BEFORE a film is admitted; sorting here would hide an artifact
// provenance defect. This is not a claim that the event is visible on camera.
function sourceEventOrderDefect(index) {
 const events=index?.events;
 if(!Array.isArray(events))return 'missing-source-event-index';
 let lastMs=-Infinity,lastEpisode=-Infinity;
 for(const event of events) {
  if(!event||!Number.isFinite(event.atMs))continue;
  if(event.atMs<lastMs)return 'nonmonotonic-source-event-index';
  if(Number.isSafeInteger(event.observedEpisode)) {
   if(event.observedEpisode<lastEpisode)
    return 'nonmonotonic-source-episode-index';
   lastEpisode=event.observedEpisode;
  }
  lastMs=event.atMs;
 }
 return null;
}
function nativeViewport(m){
 const v=m?.viewport;
 if(v?.width===960&&v?.height===600)return 'desktop';
 if(v?.width===390&&v?.height===844)return 'portrait';
 return null;
}
// An event index cannot authenticate an unedited film by itself. A matched
// viewport needs its ffprobe audit AND exact video bytes. This is a source/
// transport admission veto, never an independent gameplay or quality score.
function inspectNativeFilmTransport(record) {
 const problems=[];
 const report=record?.nativeFilmAudit;
 if(!report||report.schemaVersion!==1||report.status!=='SOURCE_VIDEO_TRANSPORT_ONLY')
   problems.push('report-missing-or-blocked');
 if(report&&(report.sourceSha!==record.sourceSha||report.scenario!==record.scenario))
   problems.push('report-source-or-scenario-mismatch');
 const matches=Array.isArray(report?.viewports)
   ?report.viewports.filter(v=>v?.viewport===record.viewport):[];
 if(matches.length!==1)problems.push('viewport-audit-missing-or-duplicated');
 else {
  const row=matches[0];
  if(row.status!=='SOURCE_VIDEO_TRANSPORT_ONLY'||
     !Array.isArray(row.problems)||row.problems.length||
     row.sourceSha!==record.sourceSha||row.scenario!==record.scenario)
    problems.push('viewport-audit-blocked-or-mismatched');
  if(!/^[0-9a-f]{64}$/.test(record.videoSha256||'')||
     record.videoSha256!==row.originalWebMSha256)
    problems.push('original-WebM-sha256-does-not-match-audit');
  if(!Number.isSafeInteger(record.videoBytes)||record.videoBytes<=0||
     row.videoBytes!==record.videoBytes)
    problems.push('original-WebM-byte-count-does-not-match-audit');
 }
 return {status:problems.length?'BLOCKED':'SOURCE_VIDEO_TRANSPORT_ONLY',problems};
}
// Native-video clock alignment yields inspection timestamps, NEVER a visible
// action or a blind preference. Both original recordings remain unmodified.
function inspectedSourceTimebase(row) {
 const clock=row?.videoClock;
 if(!clock)return {status:'NOT EVALUATED',reason:'native-video-clock.json absent'};
 if(clock.sourceSha!==row.sourceSha||
    clock.scenario!==row.scenario||
    nativeViewport({viewport:clock.viewport})!==row.viewport||
    clock.seed!==row.index?.seed||
    clock.graphicsTier!==row.motion?.graphicsTier)
   return {status:'NOT EVALUATED',reason:'native-video sidecar provenance mismatch'};
 if(clock.status!=='CALIBRATED'||!Number.isFinite(clock.calibration?.offsetMs)||
    !Array.isArray(clock.sourceEventTimecodes))
   return {status:'NOT EVALUATED',
    reason:clock.calibration?.reason||clock.error||'native frame anchors not calibrated'};
 return {status:'CALIBRATED',
   sourceEventsAvailable:clock.sourceEventTimecodes.length,
   events:clock.sourceEventTimecodes};
}
function originalFilmEventSearch(clock,pair,side) {
 if(clock.status!=='CALIBRATED')return null;
 const atMs=side==='baseline'?pair.baselineObservationMs:pair.candidateObservationMs;
 const candidates=clock.events.filter(e=>e.atMs===atMs&&e.kind===pair.kind&&
    e.floor===pair.floor&&Number.isFinite(e.nativeVideoSeconds)&&
    e.inOriginalVideo===true&&e.eventVisibleInVideo==='NOT EVALUATED');
 if(candidates.length!==1)return null;
 return {nativeVideoSeconds:candidates[0].nativeVideoSeconds,
   observedEpisode:candidates[0].observedEpisode??null,
   sourceTick:candidates[0].sourceTick??candidates[0].tick??null,
   caveat:'Calibrated source search handle; on-screen event NOT EVALUATED'};
}
// A 60-second file can still contain the WRONG gameplay: a floor-eight
// danger capture may begin on floor ten after an unrelated restart. Check
// that source-observed beats occur in the SAME real episode, in order.
// This is evidence COVERAGE, never a video-visibility or gameplay-quality PASS.
function sourceStoryCoverage(record,scenario,source){
 const events=Array.isArray(record?.index?.events)?record.index.events:[];
 const relevant=events.filter(e=>signature(e)&&Number.isFinite(e.atMs)&&
   Number.isSafeInteger(e.observedEpisode)&&e.observedEpisode>=0);
 const ordered=scenario==='danger'
   ? source==='candidate'
     ? ['guardian-present','guardian-hp-decrease','guardian-source-defeated',
        'source-supported-gate-approach','guardian-earned-floor-nine-handoff',
        'guardian-source-physical-threshold']
     : ['guardian-present','guardian-hp-decrease']
   :scenario==='outcome'?['source-result-phase:result',
       'source-result-phase:intermission','source-run-token-change']
   :scenario==='moving'?['observed-moving-deck-position-change']
   :['route-selection'];
 const valid=(e,kind)=>e.kind===(kind.startsWith('source-result-phase:')
   ?'source-result-phase':kind)&&
   (scenario!=='danger'||(kind==='guardian-earned-floor-nine-handoff'||
     kind==='guardian-source-physical-threshold'?e.floor===9&&
     e.fromFloor===8&&e.toFloor===9:e.floor===8))&&
   (scenario!=='moving'||e.floor===7)&&
   (scenario!=='ascent'||e.floor===0)&&
   (!kind.startsWith('source-result-phase:')||
    (e.resultKind==='game'&&e.phase===kind.slice('source-result-phase:'.length)));
 const missing=ordered.filter(kind=>!relevant.some(e=>valid(e,kind)));
 const episodes=[...new Set(relevant.map(e=>e.observedEpisode))];
 let completedEpisode=null;
 for(const episode of episodes){
   let previousAt=-Infinity,success=true;
   for(let index=0;index<ordered.length;index++){
     const kind=ordered[index];
     // A genuine restart changes the run token, so its indexed episode
     // must advance exactly once from the preceding game result episode.
     const requiredEpisode=episode+(scenario==='outcome'&&index===2?1:0);
     const match=relevant.find(e=>e.observedEpisode===requiredEpisode&&
       valid(e,kind)&&e.atMs>=previousAt);
     if(!match){success=false;break;}
     previousAt=match.atMs;
   }
   if(success){completedEpisode=episode;break;}
 }
 return {requiredSourceBeats:ordered,missingObservedBeats:missing,
   sameEpisodeSourceSequenceObserved:completedEpisode!==null,
   observedEpisode:completedEpisode,
   evidenceStatus:completedEpisode!==null?'SOURCE_SEQUENCE_OBSERVED_NOT_FILM_VERIFIED':
     'MISSING_OR_SPLIT_SOURCE_EPISODE_NOT_EVALUATED',
   caveat:'50ms read-only sampling can miss real ticks. Missing markers mean missing evidence, NOT proven missing gameplay. A source sequence cannot establish visible pixels or independent approval.'};
}
function auditPairs(recordings,candidateSha){
 const result={schemaVersion:1,stage:'P0 evidence authenticity',frozenBaselineSha:FROZEN,
  candidateSha:candidateSha||null,verdict:'NOT EVALUATED',
  independentlyReviewed:false,videoTimecodesCalibrated:false,
  fullMotionPaired:false,hardwareBenchmarks:'NOT EVALUATED',
  caveat:'Source-only event-order index. Different elapsed seconds, multiple run episodes, renderer occlusion and lost short ticks preclude a certified A/B. Inspect original full WebM at normal speed; independently match film frames and gather blind votes and actual-device measurements.',
  recordingsFound:recordings.length,comparisons:[],missingPairs:[],provenanceDefects:[],sourceStoryDefects:[]};
 for(const scenario of SCENARIOS)for(const viewport of VIEWPORTS){
  const get=source=>recordings.filter(r=>r.source===source&&r.scenario===scenario&&r.viewport===viewport);
  const b=get('baseline'),c=get('candidate');
  if(b.length!==1||c.length!==1){
   result.missingPairs.push({scenario,viewport,baselineCount:b.length,candidateCount:c.length});continue;
  }
  const before=b[0],after=c[0],faults=[];
  if(before.sourceSha!==FROZEN)faults.push('baseline SHA mismatch');
  if(!candidateSha||after.sourceSha!==candidateSha)faults.push('candidate SHA mismatch');
  if(before.index?.sourceSha!==before.sourceSha||after.index?.sourceSha!==after.sourceSha||
    before.motion?.sourceSha!==before.sourceSha||after.motion?.sourceSha!==after.sourceSha)
   faults.push('sidecar SHA mismatch');
  if(before.index?.scenario!==scenario||after.index?.scenario!==scenario||
     nativeViewport(before.motion)!==viewport||nativeViewport(after.motion)!==viewport)
   faults.push('scenario/viewport mismatch');
  if(before.motion?.seed!==after.motion?.seed||before.index?.seed!==after.index?.seed||
     before.motion?.graphicsTier!==after.motion?.graphicsTier||
     before.motion?.reducedMotion!==after.motion?.reducedMotion||
     before.motion?.soundEnabled!==after.motion?.soundEnabled)
   faults.push('recording setup mismatch');
  if(!(before.motion?.actualWallSeconds>=60&&after.motion?.actualWallSeconds>=60))
   faults.push('insufficient observed wall-time');
  // A previous two-viewport Playwright invocation reused the exact SAME live
  // host. Portrait recording began hundreds of ticks later, sometimes on
  // floor ten while the requested danger episode was floor eight.
  // Detect this BEFORE source-event name matching. Floor/tick are read-only
  // source provenance, never fabricated matching WebM frame timecodes.
  const launchFloor=scenario==='danger'?8:scenario==='moving'?7:0;
  const firstScene=record=>record.motion?.startScene;
  const startValid=s=>s&&s.floor===launchFloor&&
    Number.isSafeInteger(s.tick)&&s.tick>=0&&s.tick<=250&&
    typeof s.runToken==='string'&&s.runToken.length>0;
  const bStart=firstScene(before),cStart=firstScene(after);
  if(!startValid(bStart)||!startValid(cStart))
    faults.push('missing, late, or wrong-floor initial source episode');
  else if(Math.abs(bStart.tick-cStart.tick)>60)
    faults.push('initial source ticks differ by over 3 seconds');
  if(!before.videoPresent||!after.videoPresent)faults.push('native WebM missing');
  const baselineTransport=inspectNativeFilmTransport(before);
  const candidateTransport=inspectNativeFilmTransport(after);
  for(const [label,transport] of [['baseline',baselineTransport],['candidate',candidateTransport]])
    for(const problem of transport.problems)faults.push(label+'-native-WebM-'+problem);
  if(!(before.index?.sourceTicksObserved>1&&after.index?.sourceTicksObserved>1))
   faults.push('missing passive source ticks');
  for(const [label,index] of [['baseline',before.index],['candidate',after.index]]) {
   const orderDefect=sourceEventOrderDefect(index);
   if(orderDefect)faults.push(label+'-'+orderDefect);
  }
  const aligned=matchSourceEvents(before.index.events,after.index.events);
  const baselineClock=faults.length?{status:'NOT EVALUATED',
    reason:'native film integrity or source provenance veto'}:inspectedSourceTimebase(before);
  const candidateClock=faults.length?{status:'NOT EVALUATED',
    reason:'native film integrity or source provenance veto'}:inspectedSourceTimebase(after);
  const pairedSourceSearch=aligned.pairs.map(pair=>{
    const baseline=originalFilmEventSearch(baselineClock,pair,'baseline');
    const candidate=originalFilmEventSearch(candidateClock,pair,'candidate');
    return {...pair,calibratedSourceEventSearch:{
      baseline,candidate,bothInOriginalVideo:!!baseline&&!!candidate,
      eventVisibleInBothVideos:false,
      verdict:'NOT EVALUATED: calibrated source-clock pointers, not viewed frames'}};
  });
  const pairedCalibratedSearchCount=pairedSourceSearch.filter(pair=>
    pair.calibratedSourceEventSearch.bothInOriginalVideo).length;
  // Source-story gaps are inspection priorities, not film failures or quality
  // votes. Baseline naturally need not contain the new physical threshold.
  const sourceKinds=record=>new Set((record.index?.events||[]).map(e=>
    e.kind==='source-result-phase'?e.kind+':'+e.phase:e.kind));
  const expected=scenario==='danger'
    ?['guardian-present','guardian-hp-decrease','guardian-source-defeated',
      'source-supported-gate-approach','guardian-earned-floor-nine-handoff',
      'guardian-source-physical-threshold']
    :scenario==='moving'?['observed-moving-deck-position-change']
    :scenario==='outcome'?['source-result-phase:result',
       'source-result-phase:intermission','source-run-token-change']
    :['route-selection'];
  const candidateObserved=sourceKinds(after),baselineObserved=sourceKinds(before);
  const sourceStory={requiredSearchEvents:expected,
    missingCandidateSearchEvents:expected.filter(k=>!candidateObserved.has(k)),
    missingBaselineSearchEvents:expected.filter(k=>!baselineObserved.has(k)),
    exactFilmMatchVerified:false,
    caveat:'50ms passive source observer can skip real events; no event proves a frame was displayed or that a physical crossing was filmed'};
  const candidateStory=sourceStoryCoverage(after,scenario,'candidate');
  const baselineStory=sourceStoryCoverage(before,scenario,'baseline');
  if(!candidateStory.sameEpisodeSourceSequenceObserved||
     !baselineStory.sameEpisodeSourceSequenceObserved)
    result.sourceStoryDefects.push({scenario,viewport,
      candidateEvidenceStatus:candidateStory.evidenceStatus,
      baselineEvidenceStatus:baselineStory.evidenceStatus,
      candidateMissingBeats:candidateStory.missingObservedBeats,
      baselineMissingBeats:baselineStory.missingObservedBeats});
  result.comparisons.push({scenario,viewport,provenanceVerified:faults.length===0,
   sourceStorySequenceObserved:candidateStory.sameEpisodeSourceSequenceObserved&&
     baselineStory.sameEpisodeSourceSequenceObserved,
   sourceStoryEpisodes:{baseline:baselineStory,candidate:candidateStory},faults,sourceStory,
   nativeFilmTransport:{baseline:baselineTransport,candidate:candidateTransport},
   baselineArtifact:before.artifact,candidateArtifact:after.artifact,
   baselineVideo:before.videoPath,candidateVideo:after.videoPath,
   nativeSourceVideoTimebase:{
     baseline:baselineClock.status,candidate:candidateClock.status,
     baselineReason:baselineClock.reason||null,
     candidateReason:candidateClock.reason||null,
     calibratedSourceEventPairSearchHandles:pairedCalibratedSearchCount,
     visualEventVerification:'NOT EVALUATED'},
   sourceEventPairs:pairedSourceSearch,missingFromBaseline:aligned.missingFromBaseline,
   missingFromCandidate:aligned.missingFromCandidate,
   verdict:'NOT EVALUATED: authentic matching event NAMES are not video-visible matches'});
  if(faults.length)result.provenanceDefects.push({scenario,viewport,faults});
 }
 // Timebase alignment is independent of all film-visibility and UX gates.
 result.calibratedTimebasePairs=result.comparisons.filter(p=>
   p.provenanceVerified&&p.nativeSourceVideoTimebase.baseline==='CALIBRATED'&&
   p.nativeSourceVideoTimebase.candidate==='CALIBRATED').length;
 result.videoTimecodesCalibrated=result.comparisons.length===8&&
   result.missingPairs.length===0&&result.calibratedTimebasePairs===8;
 result.fullMotionPaired=false;
 result.verdict='NOT EVALUATED';
 return result;
}
function collect(root){
 const rows=[];
 if(!fs.existsSync(root))return rows;
 for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const match=/^tower-motion-(baseline|candidate)-(ascent|danger|moving|outcome)-[0-9]+$/.exec(entry.name);
  if(!match)continue;
  function visit(dir){
   for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,item.name);
    if(item.isDirectory()){visit(full);continue;}
    if(item.name!=='event-index.json'||!VIEWPORTS.includes(path.basename(dir)))continue;
    const motionPath=path.join(dir,'motion.json');
    if(!fs.existsSync(motionPath))continue;
    const index=JSON.parse(fs.readFileSync(full,'utf8'));
    const motion=JSON.parse(fs.readFileSync(motionPath,'utf8'));
    // Hosted captures place the audit at scenario root; existing offline
    // archives may place it at artifact root. Neither is game source.
    const auditPaths=[path.join(path.dirname(dir),'native-film-integrity.json'),
      path.join(root,entry.name,'native-film-integrity.json')];
    const auditFile=auditPaths.find(candidate=>fs.existsSync(candidate));
    let nativeFilmAudit=null;
    if(auditFile)try{nativeFilmAudit=JSON.parse(fs.readFileSync(auditFile,'utf8'));}
      catch{nativeFilmAudit={status:'BLOCKED',schemaVersion:1,
        error:'unreadable native film audit JSON'};}
    const webm=path.join(dir,'live.webm');
    const videoPresent=fs.existsSync(webm);
    let videoSha256=null,videoBytes=null;
    if(videoPresent)try{
      const bytes=fs.readFileSync(webm);
      videoBytes=bytes.length;
      videoSha256=createHash('sha256').update(bytes).digest('hex');
    }catch{videoSha256=null;videoBytes=null;}
    const clockPath=path.join(dir,'native-video-clock.json');
    let videoClock=null;
    if(fs.existsSync(clockPath)){
      try {videoClock=JSON.parse(fs.readFileSync(clockPath,'utf8'));}
      catch {videoClock={status:'NOT EVALUATED',
        error:'Unreadable native-video-clock.json'};}
    }
    rows.push({artifact:entry.name,source:match[1],scenario:match[2],
      viewport:path.basename(dir),sourceSha:motion.sourceSha,motion,index,videoClock,
      videoPath:path.relative(root,webm),videoPresent,
      videoSha256,videoBytes,nativeFilmAudit});
   }
  }
  visit(path.join(root,entry.name));
 }
 return rows;
}
if(require.main===module){
 const root=process.argv[2]||'artifacts/tower-event-pair-input';
 const out=process.argv[3]||'artifacts/tower-event-pairs/manifest.json';
 const manifest=auditPairs(collect(root),process.env.TOWER_EXPECTED_CANDIDATE_SHA);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');
 process.stdout.write('Tower original-footage event index: '+manifest.comparisons.length+
  '/8 paired source timelines; '+manifest.missingPairs.length+
  ' missing pairs, '+manifest.provenanceDefects.length+
  ' integrity defects; '+manifest.sourceStoryDefects.length+
  ' missing/split authentic source stories. Quality NOT EVALUATED.\n');
 if(manifest.missingPairs.length||manifest.provenanceDefects.length||
    manifest.sourceStoryDefects.length)process.exitCode=1;
}
module.exports={FROZEN,signature,matchSourceEvents,sourceStoryCoverage,auditPairs,collect};
