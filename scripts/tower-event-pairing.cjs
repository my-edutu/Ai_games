'use strict';
// SOURCE EVENT SEARCH ONLY. Never manufacture frame-time calibration, reviewed
// footage, identical gameplay or acceptance from matching event names.
const fs=require('node:fs'),path=require('node:path');
const FROZEN='1731b380851162741761c5569e2bc152a0869ca9';
const SCENARIOS=['ascent','danger','moving','outcome'],VIEWPORTS=['desktop','portrait'];
const KINDS=new Set(['route-selection','guardian-present','guardian-hp-decrease',
 'guardian-source-defeated','floor-transition','hazard-charge-begin',
 'observed-moving-deck-position-change','source-result-phase','source-run-token-change',
 'source-supported-gate-approach','guardian-earned-floor-nine-handoff']);
function signature(e){
 if(!e||!KINDS.has(e.kind)||!Number.isSafeInteger(e.floor))return null;
 const parts=[e.kind,e.floor];
 if(e.kind==='floor-transition'||e.kind==='guardian-earned-floor-nine-handoff')parts.push(e.fromFloor,e.toFloor);
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
function nativeViewport(m){
 const v=m?.viewport;
 if(v?.width===960&&v?.height===600)return 'desktop';
 if(v?.width===390&&v?.height===844)return 'portrait';
 return null;
}
function auditPairs(recordings,candidateSha){
 const result={schemaVersion:1,stage:'P0 evidence authenticity',frozenBaselineSha:FROZEN,
  candidateSha:candidateSha||null,verdict:'NOT EVALUATED',
  independentlyReviewed:false,videoTimecodesCalibrated:false,
  fullMotionPaired:false,hardwareBenchmarks:'NOT EVALUATED',
  caveat:'Source-only event-order index. Different elapsed seconds, multiple run episodes, renderer occlusion and lost short ticks preclude a certified A/B. Inspect original full WebM at normal speed; independently match film frames and gather blind votes and actual-device measurements.',
  recordingsFound:recordings.length,comparisons:[],missingPairs:[],provenanceDefects:[]};
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
  if(!before.videoPresent||!after.videoPresent)faults.push('native WebM missing');
  if(!(before.index?.sourceTicksObserved>1&&after.index?.sourceTicksObserved>1))
   faults.push('missing passive source ticks');
  const aligned=matchSourceEvents(before.index.events,after.index.events);
  // Source-story gaps are inspection priorities, not film failures or quality
  // votes. Baseline naturally need not contain the new physical threshold.
  const sourceKinds=record=>new Set((record.index?.events||[]).map(e=>e.kind));
  const expected=scenario==='danger'
    ?['guardian-present','guardian-hp-decrease','guardian-source-defeated',
      'source-supported-gate-approach','guardian-earned-floor-nine-handoff']
    :scenario==='moving'?['observed-moving-deck-position-change']
    :scenario==='outcome'?['source-result-phase','source-run-token-change']
    :['route-selection'];
  const candidateObserved=sourceKinds(after),baselineObserved=sourceKinds(before);
  const sourceStory={requiredSearchEvents:expected,
    missingCandidateSearchEvents:expected.filter(k=>!candidateObserved.has(k)),
    missingBaselineSearchEvents:expected.filter(k=>!baselineObserved.has(k)),
    exactFilmMatchVerified:false,
    caveat:'50ms passive source observer can skip real events; no event proves a frame was displayed or that a physical crossing was filmed'};
  result.comparisons.push({scenario,viewport,provenanceVerified:faults.length===0,faults,sourceStory,
   baselineArtifact:before.artifact,candidateArtifact:after.artifact,
   baselineVideo:before.videoPath,candidateVideo:after.videoPath,
   sourceEventPairs:aligned.pairs,missingFromBaseline:aligned.missingFromBaseline,
   missingFromCandidate:aligned.missingFromCandidate,
   verdict:'NOT EVALUATED: authentic matching event NAMES are not video-visible matches'});
  if(faults.length)result.provenanceDefects.push({scenario,viewport,faults});
 }
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
    const webm=path.join(dir,'live.webm');
    rows.push({artifact:entry.name,source:match[1],scenario:match[2],
      viewport:path.basename(dir),sourceSha:motion.sourceSha,motion,index,
      videoPath:path.relative(root,webm),videoPresent:fs.existsSync(webm)});
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
  ' integrity defects. Quality NOT EVALUATED.\n');
 if(manifest.missingPairs.length||manifest.provenanceDefects.length)process.exitCode=1;
}
module.exports={FROZEN,signature,matchSourceEvents,auditPairs,collect};
