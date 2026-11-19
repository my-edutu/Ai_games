'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {archivePlan,completeOriginalFilmPlans,SCENARIOS,VIEWPORTS}=
  require('../../scripts/tower-complete-original-review.cjs');
const {htmlFor}=require('../../scripts/tower-event-review-playlist.cjs');
const FROZEN='1731b380851162741761c5569e2bc152a0869ca9';
const CANDIDATE='a'.repeat(40);
function film(source,scenario,viewport) {
  const sha=source==='baseline'?FROZEN:CANDIDATE;
  const hash=(source==='baseline'?'b':'c').repeat(64);
  const width=viewport==='desktop'?960:390,height=viewport==='desktop'?600:844;
  return {source,scenario,viewport,sourceSha:sha,videoPresent:true,
    videoSha256:hash,videoBytes:1234,
    videoPath:'tower-motion-'+source+'-'+scenario+'/'+viewport+'/live.webm',
    index:{sourceSha:sha,scenario,seed:'matched-seed'},
    motion:{sourceSha:sha,scenario,seed:'matched-seed',graphicsTier:'low',
      reducedMotion:false,soundEnabled:false,actualWallSeconds:67,
      viewport:{name:viewport,width,height}},
    nativeFilmAudit:{sourceSha:sha,scenario,status:'SOURCE_VIDEO_TRANSPORT_ONLY',
      viewports:[{viewport,status:'SOURCE_VIDEO_TRANSPORT_ONLY',problems:[],
        originalWebMSha256:hash,videoBytes:1234,
        native:{width,height,firstPtsSeconds:0,lastPtsSeconds:66}}]},
    videoClock:{sourceSha:sha,scenario,seed:'matched-seed',graphicsTier:'low',
      status:'CALIBRATED',originalWebMSha256:hash,
      originalWebMBytes:1234,originalVideoUnmodified:true,
      originalVideoDurationSeconds:66,viewport:{name:viewport,width,height}}
  };
}
function library() {
 const rows=[];
 for(const scenario of SCENARIOS)for(const viewport of VIEWPORTS)
  for(const source of ['baseline','candidate']) rows.push(film(source,scenario,viewport));
 return rows;
}
function fakeDanger(viewport) {
 return {viewport,status:'NOT EVALUATED',canReview:false,
   unalignedInspectionOnly:true,nativeRasterAnchors:[],anchors:[],
   failures:['native-source-raster-not-aligned'],originalVideoUnmodified:true,
   files:{baseline:'old',candidate:'new'},hashes:{baseline:'b'.repeat(64),
     candidate:'c'.repeat(64)},shuffleAB:false};
}
test('P0 complete original gameplay review contains ALL four scenes in BOTH native viewports, ungraded',()=>{
 const plans=completeOriginalFilmPlans(library(),
   VIEWPORTS.map(fakeDanger),CANDIDATE,FROZEN);
 assert.equal(plans.length,8);
 for(const scenario of SCENARIOS)for(const viewport of VIEWPORTS){
   const p=plans.find(x=>x.scenario===scenario&&x.viewport===viewport);
   assert.ok(p);
   assert.equal(p.canReview,false);
   assert.equal(p.status,'NOT EVALUATED');
   if(scenario!=='danger'){
     assert.deepEqual(p.failures,[]);
     assert.equal(p.unalignedInspectionOnly,true);
     assert.deepEqual(p.anchors,[]);
     assert.equal(p.sourceEventMatched,false);
   }else assert.match(p.failures.join(','),/native-source-raster/);
 }
 const html=htmlFor(plans);
 for(const scenario of SCENARIOS)assert.match(html,new RegExp('"scenario":"'+scenario+'"'));
 for(const viewport of VIEWPORTS)
   assert.match(html,new RegExp('review-media/ascent-'+viewport+'-a.webm'));
 assert.match(html,/id="scenario"/);
 assert.match(html,/id="viewport"/);
 assert.doesNotMatch(html,new RegExp(FROZEN));
 assert.doesNotMatch(html,new RegExp(CANDIDATE));
 assert.match(html,/"synchronized":false/);
 assert.match(html,/NOT EVALUATED/);
});
test('do not package missing or duplicate source originals or switch source SHA',()=>{
 const rows=library().filter(x=>!(x.scenario==='outcome'&&x.viewport==='portrait'&&x.source==='candidate'));
 const p=archivePlan(rows,'outcome','portrait',CANDIDATE,FROZEN);
 assert.equal(p.unalignedInspectionOnly,false);
 assert.match(p.failures.join(','),/missing-or-duplicate/);
 const b=film('candidate','moving','desktop');
 b.sourceSha='0'.repeat(40);
 assert.match(archivePlan([film('baseline','moving','desktop'),b],
   'moving','desktop',CANDIDATE,FROZEN).failures.join(','),/unverified-original-candidate/);
});
test('source, pixel, privacy and recording contracts veto forged or short films',()=>{
 const cases=[
  r=>{r.motion.actualWallSeconds=21;},
  r=>{r.videoClock.originalVideoDurationSeconds=22;},
  r=>{r.nativeFilmAudit.viewports[0].native.lastPtsSeconds=22;},
  r=>{r.videoClock.originalWebMSha256='0'.repeat(64);},
  r=>{r.nativeFilmAudit.viewports[0].problems=['tampered'];},
  r=>{r.motion.viewport.width=999;},
  r=>{r.videoClock.status='NOT EVALUATED';},
  r=>{r.index.sourceSha='0'.repeat(40);}
 ];
 for(const mutate of cases){
   const a=film('baseline','ascent','portrait'),b=film('candidate','ascent','portrait');
   mutate(b);
   const p=archivePlan([a,b],'ascent','portrait',CANDIDATE,FROZEN);
   assert.equal(p.unalignedInspectionOnly,false);
   assert.ok(p.failures.length>0);
 }
 const a=film('baseline','moving','portrait'),b=film('candidate','moving','portrait');
 b.motion.reducedMotion=true;
 assert.match(archivePlan([a,b],'moving','portrait',CANDIDATE,FROZEN).failures.join(','),
   /capture-conditions-not-matched/);
});
test('correct coverage never manufactures event frame alignment or positive votes',()=>{
 const a=film('baseline','outcome','desktop'),b=film('candidate','outcome','desktop');
 const p=archivePlan([a,b],'outcome','desktop',CANDIDATE,FROZEN);
 assert.equal(p.eventPixelsConfirmed,false);
 assert.equal(p.sourceEventMatched,false);
 assert.equal(p.canReview,false);
 assert.equal(p.anchors.length,0);
 assert.equal(p.fullVideoSeconds.baseline,66);
 assert.equal(p.fullVideoSeconds.candidate,66);
 assert.match(p.caveat,/NOT independently verified/);
});
