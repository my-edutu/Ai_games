'use strict';
// P0 evidence only. Inspect exact original WebM around already-calibrated
// source events. A screenshot is NOT an event-verification, an independent
// reviewer, GPU-frame measurement, or transformation verdict.
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const MAX_EVENTS=10,OFFSETS=[-.28,.28];
const SCENARIOS=new Set(['ascent','moving','danger','outcome']);
const VIEWPORTS={desktop:[960,600],portrait:[390,844]};
function validateFilmProvenance({expectedSha,scenario,viewport,index,clock,hash,size}) {
 const errors=[];
 if(!/^[0-9a-f]{40}$/.test(expectedSha||'')||
   index?.sourceSha!==expectedSha||clock?.sourceSha!==expectedSha)
   errors.push('source-sha-mismatch');
 if(!SCENARIOS.has(scenario)||index?.scenario!==scenario||
    clock?.scenario!==scenario)errors.push('scenario-mismatch');
 if(!VIEWPORTS[viewport]||
   clock?.viewport?.width!==VIEWPORTS[viewport]?.[0]||
   clock?.viewport?.height!==VIEWPORTS[viewport]?.[1])errors.push('viewport-mismatch');
 if(index?.seed!==clock?.seed)errors.push('seed-mismatch');
 const partial=clock?.status==='PARTIALLY_CALIBRATED' &&
   clock.calibration?.status==='PARTIALLY_CALIBRATED' &&
   Array.isArray(clock.calibration.anchorSegments) &&
   clock.calibration.anchorSegments.some(s=>Array.isArray(s.anchorTimeline) &&
     s.anchorTimeline.length>=3 &&
     s.lastWallAtMs-s.firstWallAtMs>=15000);
 if((clock?.status!=='CALIBRATED'&&!partial)||
    !Array.isArray(clock?.sourceEventTimecodes)||
    !(clock?.originalVideoDurationSeconds>=60))errors.push('uncalibrated-original-film');
 if(!/^[0-9a-f]{64}$/.test(hash||'')||
    clock?.originalWebMSha256!==hash)errors.push('original-WebM-sha256-mismatch');
 if(!Number.isSafeInteger(size)||size<=0||
    clock?.originalWebMBytes!==size)errors.push('original-WebM-byte-count-mismatch');
 return errors;
}
function eligible(event,duration){
 return event&&Number.isSafeInteger(event.observedEpisode)&&
  event.observedEpisode>=0&&Number.isFinite(event.nativeVideoSeconds)&&
  event.nativeVideoSeconds>=.6&&event.nativeVideoSeconds<=duration-.6&&
  event.inOriginalVideo===true&&event.eventVisibleInVideo==='NOT EVALUATED'&&
  Number.isSafeInteger(event.sourceTick)&&event.sourceTick>=0;
}
function selectFilmEvents(sourceEvents,scenario,duration) {
 const rows=Array.isArray(sourceEvents)?sourceEvents.filter(e=>eligible(e,duration)):[];
 const candidateEpisode=rows.find(e=>
   scenario==='danger'?e.kind==='guardian-source-defeated':
   scenario==='outcome'?e.kind==='source-result-phase'&&e.phase==='result':
   scenario==='moving'?e.kind==='observed-moving-deck-position-change':
   e.kind==='route-selection');
 const episode=candidateEpisode?.observedEpisode??0;
 const same=rows.filter(e=>e.observedEpisode===episode);
 const first=(kind,predicate=()=>true)=>same.find(e=>e.kind===kind&&predicate(e));
 const last=(kind,predicate=()=>true)=>[...same].reverse().find(e=>e.kind===kind&&predicate(e));
 const ordered=[];
 const add=e=>{if(e&&!ordered.includes(e)&&ordered.length<MAX_EVENTS)ordered.push(e);};
 if(scenario==='danger'){
   add(first('hazard-charge-begin'));
   add(first('guardian-hp-decrease'));
   add(last('guardian-hp-decrease'));
   add(first('guardian-source-defeated'));
   add(first('source-supported-gate-approach'));
   add(first('guardian-source-physical-threshold',e=>e.fromFloor===8&&e.toFloor===9));
   add(first('guardian-earned-floor-nine-handoff',e=>e.fromFloor===8&&e.toFloor===9));
   add(first('floor-transition',e=>e.fromFloor===8&&e.toFloor===9));
   add(first('route-selection',e=>e.floor===9));
 } else if(scenario==='outcome'){
   add(first('source-result-phase',e=>e.phase==='result'&&e.resultKind==='game'));
   add(first('source-result-phase',e=>e.phase==='intermission'&&e.resultKind==='game'));
   // A real restart starts the NEXT episode. Do not splice unrelated later runs.
   add(rows.find(e=>e.kind==='source-run-token-change'&&
     e.observedEpisode===episode+1));
 } else if(scenario==='moving') {
   add(first('observed-moving-deck-position-change'));
   add(last('observed-moving-deck-position-change'));
   add(first('route-selection'));
 } else {
   add(first('route-selection'));
   add(last('route-selection'));
   add(first('floor-transition'));
 }
 ordered.sort((a,b)=>a.nativeVideoSeconds-b.nativeVideoSeconds);
 return {episode,events:ordered,visualVerdict:'NOT EVALUATED',
   independentReviewCount:0,sourceEventsAreRenderedFrames:false};
}
function writeOriginalFilmProbes(root,expectedSha,scenario,viewport) {
 const dir=path.join(root,viewport),out=path.join(dir,'film-event-probes');
 fs.mkdirSync(out,{recursive:true});
 const result={schemaVersion:1,stage:'P0 source-to-original-film inspection handles',
   sourceSha:expectedSha,scenario,viewport,
   visualVerdict:'NOT EVALUATED',sourceEventsAreRenderedFrames:false,
   independentReviewCount:0,photosSupportOnly:true,
   note:'Native PTS search from source clocks. These are unretouched original WebM frames, but still require normal-speed video inspection and independent critics.',
   failures:[],frames:[],sourceBeatsFound:[],missingSourceBeats:[]};
 const save=()=>fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(result,null,2)+'\n');
 try {
   const index=JSON.parse(fs.readFileSync(path.join(dir,'event-index.json'),'utf8'));
   const clock=JSON.parse(fs.readFileSync(path.join(dir,'native-video-clock.json'),'utf8'));
   const video=path.join(dir,'live.webm');
   const bytes=fs.readFileSync(video);
   const hash=createHash('sha256').update(bytes).digest('hex');
   result.failures=validateFilmProvenance({expectedSha,scenario,viewport,
     index,clock,hash,size:bytes.length});
   if(result.failures.length){save();return result;}
   result.originalWebMSha256=hash;
   result.originalVideoDurationSeconds=clock.originalVideoDurationSeconds;
   result.nativeVideoTimebaseStatus=clock.status;
   result.partialWindowsForensicOnly=clock.status==='PARTIALLY_CALIBRATED';
   const chosen=selectFilmEvents(clock.sourceEventTimecodes,scenario,
     clock.originalVideoDurationSeconds);
   const required=scenario==='danger'
     ?['guardian-hp-decrease','guardian-source-defeated',
       'source-supported-gate-approach','guardian-source-physical-threshold',
       'guardian-earned-floor-nine-handoff','floor-transition']
     :scenario==='outcome'
       ?['source-result-phase:result','source-result-phase:intermission','source-run-token-change']
       :scenario==='moving'?['observed-moving-deck-position-change']:['route-selection'];
   const marker=e=>e.kind==='source-result-phase'?e.kind+':'+e.phase:e.kind;
   result.sourceBeatsFound=[...new Set(chosen.events.map(marker))];
   result.missingSourceBeats=required.filter(x=>!result.sourceBeatsFound.includes(x));
   result.observedEpisode=chosen.episode;
   for(const [i,e] of chosen.events.entries()){
     for(const [j,delta] of OFFSETS.entries()){
       const t=e.nativeVideoSeconds+delta;
       if(t<0||t>=clock.originalVideoDurationSeconds)continue;
       const label=String(i).padStart(2,'0')+'-'+e.kind.replace(/[^a-z0-9-]/gi,'')+
         '-'+(j?'after':'before')+'.jpg';
       const output=path.join(out,label);
       try {
         execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
           '-ss',t.toFixed(3),'-i',video,'-frames:v','1',
           '-q:v','3','-y',output],{timeout:30000,stdio:['ignore','pipe','pipe']});
         if(fs.statSync(output).size<128)throw Error('empty-frame');
         result.frames.push({file:label,sourceKind:e.kind,sourceFloor:e.floor,
           sourceTick:e.sourceTick,observedEpisode:e.observedEpisode,
           sourceEventNativeVideoSeconds:e.nativeVideoSeconds,
           sampledOriginalWebMSeconds:t,searchOffsetSeconds:delta,
           screenEventConfirmed:false,qualityAccepted:false});
       } catch(err){result.failures.push('extract-'+label+':'+String(err.message).slice(0,140));}
     }
   }
   // Partial native timecodes can locate genuinely recorded original frames,
   // but NEVER turn an incomplete 60s film into a comparable video.
   if(clock.status==='PARTIALLY_CALIBRATED')
     result.failures.push('partial-native-clock-gap-full-film-comparison-blocked');
 } catch(err){result.failures.push('missing-original-evidence: '+String(err.message).slice(0,200));}
 save();
 return result;
}
if(require.main===module){
 const [root,sha,scenario]=process.argv.slice(2);
 if(!root||!sha||!SCENARIOS.has(scenario)){process.stderr.write(
 'Usage: node scripts/tower-event-frame-probes.cjs <scenario-dir> <source-sha> <scenario>\n');
  process.exitCode=2;
 } else {
  const results=Object.keys(VIEWPORTS).map(viewport=>writeOriginalFilmProbes(root,sha,scenario,viewport));
  process.stdout.write(JSON.stringify(results.map(r=>({viewport:r.viewport,
    frameCount:r.frames.length,failures:r.failures,missingSourceBeats:r.missingSourceBeats,
    verdict:r.visualVerdict})),null,2)+'\n');
  if(results.some(r=>r.failures.length))process.exitCode=1;
 }
}
module.exports={validateFilmProvenance,selectFilmEvents,writeOriginalFilmProbes};
