'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {nativePtsFromAnchors,summarizeReturnedOwners,joinOriginalRoomEvidence}=require('../../scripts/tower-original-room-native-join.cjs');
const sha='a'.repeat(40),hash='b'.repeat(64);
const anchors=[{wallAtMs:100000,videoPtsSeconds:1},{wallAtMs:110000,videoPtsSeconds:11},{wallAtMs:120000,videoPtsSeconds:21},{wallAtMs:130000,videoPtsSeconds:31}];
const base={sourceSha:sha,viewport:'desktop',videoHash:hash,videoBytes:100,
 clock:{sourceSha:sha,scenario:'danger',status:'CALIBRATED',calibration:{status:'CALIBRATED',anchorTimeline:anchors},originalWebMSha256:hash,originalWebMBytes:100,originalVideoDurationSeconds:70},
 phase:{sourceSha:sha,scenario:'danger',viewport:'desktop',originalWebMSha256:hash,originalVideoUnmodified:true,firstEpisodeWindow:{startSeconds:21,endSeconds:27},phase:{videoPhaseWitness:{nativeSeconds:22}}},
 timeline:{sourceSha:sha,scenario:'danger',viewport:'desktop',status:'SOURCE_RENDER_RETURNS_ONLY',returnedRoomFrames:[{sourceBound:true,runToken:'run-1',sourceTick:475,returnedWallMs:121000,originalOwnerPresent:true,originalGatewayOpacity:1,successorOwnerPresent:true,successorStructuralRootVisible:false,successorStructuralOpacity:0,successorStructuralVisibleReturns:0},{sourceBound:true,runToken:'run-1',sourceTick:477,returnedWallMs:122000,originalOwnerPresent:false,originalGatewayOpacity:null,successorOwnerPresent:true,successorStructuralRootVisible:false,successorStructuralOpacity:0,successorStructuralVisibleReturns:0},{sourceBound:true,runToken:'run-1',sourceTick:479,returnedWallMs:123000,originalOwnerPresent:false,successorOwnerPresent:true,successorStructuralRootVisible:true,successorStructuralOpacity:.2,successorStructuralVisibleReturns:1}]}};
test('bounded genuine compositor anchors map search times only',()=>{
 assert.equal(nativePtsFromAnchors(121000,anchors),22);
 assert.equal(nativePtsFromAnchors(99000,anchors),null);
 assert.equal(nativePtsFromAnchors(140000,anchors),null);
 assert.equal(nativePtsFromAnchors(105000,[anchors[0],{wallAtMs:110000,videoPtsSeconds:25},anchors[2]]),null);
});
test('detects returned old-room gap without inventing native pixel acceptance',()=>{
 const x=joinOriginalRoomEvidence(base);
 assert.equal(x.status,'SOURCE_OWNER_AND_NATIVE_SEARCH_TIMELINE_JOINED');
 assert.equal(x.sourceReturnedRoomSummary.finding,'OLD_OWNER_LOST_BEFORE_QUALIFIED_SUCCESSOR_RETURN');
 assert.equal(x.nativePtsSearchHandles,3);
 assert.equal(x.verdict,'NOT EVALUATED');
 assert.equal(x.nativePixelMatched,false);
 assert.equal(x.returnedFramesNearNativeColorShift.length,2);
});
test('reports co-returned owners without declaring actual visible gate',()=>{
 const rows=structuredClone(base.timeline.returnedRoomFrames);
 rows[0].successorStructuralRootVisible=true;rows[0].successorStructuralOpacity=.15;rows[0].successorStructuralVisibleReturns=1;
 const x=joinOriginalRoomEvidence({...base,timeline:{...base.timeline,returnedRoomFrames:rows}});
 assert.equal(x.sourceReturnedRoomSummary.finding,'SCENE_OWNERS_CO_RETURNED_BUT_PIXELS_NOT_ESTABLISHED');
 assert.equal(x.verdict,'NOT EVALUATED');
});
test('vetoes mismatched WebM hash, partial calibration, another run, no trace',()=>{
 assert.equal(joinOriginalRoomEvidence({...base,videoHash:'c'.repeat(64)}).status,'NOT EVALUATED');
 assert.equal(joinOriginalRoomEvidence({...base,clock:{...base.clock,status:'PARTIALLY_CALIBRATED'}}).status,'NOT EVALUATED');
 assert.equal(joinOriginalRoomEvidence({...base,timeline:null}).status,'NOT EVALUATED');
 const rows=structuredClone(base.timeline.returnedRoomFrames);rows[1].runToken='other';
 assert.equal(joinOriginalRoomEvidence({...base,timeline:{...base.timeline,returnedRoomFrames:rows}}).status,'NOT EVALUATED');
});
test('does not extrapolate across sparse anchor gaps or accept synthetic returns',()=>{
 assert.equal(nativePtsFromAnchors(125000,[anchors[0],anchors[1],{wallAtMs:130000,videoPtsSeconds:31}]),null);
 const rows=structuredClone(base.timeline.returnedRoomFrames);rows[0].sourceBound=false;
 assert.equal(joinOriginalRoomEvidence({...base,timeline:{...base.timeline,returnedRoomFrames:rows}}).status,'NOT EVALUATED');
 assert.equal(summarizeReturnedOwners([]).finding,'NO_ORIGINAL_RETURNED_SCENE_OBSERVED');
});

test('vetoes a later floor-nine episode despite source-valid returned owners',()=>{
 const rows=structuredClone(base.timeline.returnedRoomFrames);
 for(const row of rows)row.returnedWallMs+=30000;
 const x=joinOriginalRoomEvidence({...base,timeline:{...base.timeline,returnedRoomFrames:rows}});
 assert.equal(x.status,'NOT EVALUATED');
 assert.equal(x.reason,'no-genuine-returns-mapped-to-first-native-floor-nine-episode');
});


test('genuine returned source camera trials disclose partial/complete and physical vetoes at native search times, not video proof',()=>{
 const rows=structuredClone(base.timeline.returnedRoomFrames);
 const examples=[
  {sourceBound:true,sourceTick:475,outcome:'no-lens-proposal',
    trialsEvaluated:0,raisedDeckId:'f9:p2',originalMetalPanesBefore:0},
  {sourceBound:true,sourceTick:477,outcome:'accepted-partial',
    trialsEvaluated:2,raisedDeckId:'f9:p2',originalMetalPanesBefore:0,
    originalMetalPanesSubmitted:1,worldRayVetoes:1,coreVetoes:0},
  {sourceBound:true,sourceTick:479,outcome:'accepted-complete-projection',
    trialsEvaluated:1,raisedDeckId:'f9:p2',originalMetalPanesBefore:1,
    originalMetalPanesSubmitted:3,worldRayVetoes:0,coreVetoes:0}
 ];
 rows.forEach((r,i)=>r.cameraJointRecovery=examples[i]);
 const joined=joinOriginalRoomEvidence({...base,timeline:{...base.timeline,returnedRoomFrames:rows}});
 assert.equal(joined.status,'SOURCE_OWNER_AND_NATIVE_SEARCH_TIMELINE_JOINED');
 assert.deepEqual(joined.cameraJointRecoverySummary.countsByOutcome,{
   'no-lens-proposal':1,'accepted-partial':1,'accepted-complete-projection':1
 });
 assert.equal(joined.cameraJointRecoverySummary.firstPartialNativeSearchPtsSeconds,23);
 assert.equal(joined.cameraJointRecoverySummary.firstCompleteNativeSearchPtsSeconds,24);
 assert.equal(joined.cameraJointRecoverySummary.totalWorldRayVetoes,1);
 assert.equal(joined.alignedSceneOwnerReturns[1].cameraJointRecovery.outcome,'accepted-partial');
 assert.equal(joined.nativePixelMatched,false);
 assert.equal(joined.verdict,'NOT EVALUATED');
 const invalid=structuredClone(rows);invalid[1].cameraJointRecovery.sourceTick=99;
 const mismatch=joinOriginalRoomEvidence({...base,timeline:{...base.timeline,returnedRoomFrames:invalid}});
 assert.equal(mismatch.alignedSceneOwnerReturns[1].cameraJointRecovery,null,
  'a camera trace from a different source tick cannot borrow the filmed return');
 assert.equal(mismatch.cameraJointRecoverySummary.countsByOutcome['accepted-partial'],undefined);
});
test('scene captures final source-owned camera recovery decisions after successful WebGL returns only',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const scene=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const animate=scene.slice(scene.indexOf('function animate(now) {'));
 const proposed=animate.indexOf('let cameraJointRecoveryWitness = null;');
 const render=animate.indexOf('renderer.render(scene, camera);');
 const returned=animate.indexOf('originalToVoidReturnedTimeline.push({');
 const bound=animate.indexOf('cameraJointRecovery: cameraJointRecoveryWitness');
 assert.ok(proposed>=0&&proposed<render&&returned>render&&bound>returned);
 assert.match(animate,/outcome:'accepted-partial'/);
 assert.match(animate,/outcome:'accepted-complete-projection'/);
 assert.match(animate,/worldRayVetoes/);
 assert.match(animate,/coreVetoes/);
});
