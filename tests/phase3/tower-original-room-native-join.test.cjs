'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {nativePtsFromAnchors,summarizeReturnedOwners,joinOriginalRoomEvidence}=require('../../scripts/tower-original-room-native-join.cjs');
const sha='a'.repeat(40),hash='b'.repeat(64);
const anchors=[{wallAtMs:100000,videoPtsSeconds:1},{wallAtMs:110000,videoPtsSeconds:11},{wallAtMs:120000,videoPtsSeconds:21},{wallAtMs:130000,videoPtsSeconds:31}];
const base={sourceSha:sha,viewport:'desktop',videoHash:hash,videoBytes:100,
 clock:{sourceSha:sha,scenario:'danger',status:'CALIBRATED',calibration:{status:'CALIBRATED',anchorTimeline:anchors},originalWebMSha256:hash,originalWebMBytes:100,originalVideoDurationSeconds:70},
 phase:{sourceSha:sha,scenario:'danger',viewport:'desktop',originalWebMSha256:hash,originalVideoUnmodified:true,phase:{videoPhaseWitness:{nativeSeconds:22}}},
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
