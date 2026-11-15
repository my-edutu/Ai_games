'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/full-body-animation-controller.js'),'utf8')).toString('base64'));

// Genuine source: 390px original GLB nine-tick c14f7d5 successful native
// Actions #43701955324, tick 6 Walking_A: left loaded foot accepted a
// 45mrad original ankle relief; right SWING toe is 81.687mm inside stone
// with heel 219.262mm above stone. Synthetic deltas below are negative
// controls, not claims of actually improved WebGL animation.
const loaded={heelY:-.026265531464683158,toeY:-.023251034400082436,
 heelXZ:[-3.7081733125210254,-6.971616589100173],
 toeXZ:[-3.9781437740335295,-6.943950056800063]};
const swing={heelY:.19926209379729437,toeY:-.10168743330030737,
 heelXZ:[-3.61,-6.99],toeXZ:[-3.91,-6.95]};
const stance={
 source:'same-original-GLB-two-point-stanced-shoe',
 sourceInstanceId:'c53eb9b8-2a24-4228-a079-af207a018bb5',
 side:'left',sourceClip:'Walking_A',
 beforeHeelY:-.02373920773229324,beforeToeY:-.03333131489160944,
 afterHeelY:loaded.heelY,afterToeY:loaded.toeY,
 afterHeelXZ:loaded.heelXZ,afterToeXZ:loaded.toeXZ,
 beforeWorstMeters:.01333131489160944,
 afterWorstMeters:.006265531464683158,
 heelShiftXZMeters:.002413532959422479,
 toeShiftXZMeters:.002525723037566391,
 floorTopY:-.02,appliedAngleRad:-.045
};
const options={
 stanceProof:stance,swingSide:'right',
 sourceInstanceId:stance.sourceInstanceId,sourceClipName:'Walking_A',
 sourceWeight:1,floorTopY:-.02,currentLoaded:loaded,currentSwing:swing
};

test('RED: a real certified original loaded foot does not blanket-veto the opposite connected original hip+knee',async()=>{
 const {qualifyOriginalSourceLoadedStanceCompanion:qualify}=await load();
 assert.equal(typeof qualify,'function','missing strict companion source-shoe arbitration');
 const certified=qualify(options);
 assert.equal(certified?.source,'measured-same-original-GLB-stance-and-swing');
 assert.equal(certified?.loadedSide,'left');
 assert.equal(certified?.swingSide,'right');
 assert.equal(certified?.contactLocked,false);
 assert.equal(certified?.loadedShoePreserved,true);
 assert.equal(certified?.sameSourceFrame,true);
});

test('original opposite loaded-shoe handoff fails closed on stale, switched or unphysical source',async()=>{
 const {qualifyOriginalSourceLoadedStanceCompanion:qualify}=await load();
 for(const corrupt of [
  {stanceProof:{...stance,sourceInstanceId:'stale-clone'}},
  {stanceProof:{...stance,sourceClip:'Idle'}},
  {stanceProof:{...stance,side:'right'}},
  {stanceProof:{...stance,source:'fabricated-stanced-shoe'}},
  {stanceProof:{...stance,afterHeelXZ:null}},
  {stanceProof:{...stance,afterToeXZ:[NaN,0]}},
  {stanceProof:{...stance,beforeWorstMeters:.005}},
  {stanceProof:{...stance,heelShiftXZMeters:.013}},
  {stanceProof:{...stance,appliedAngleRad:.4}},
  {currentLoaded:{...loaded,toeY:loaded.toeY+.007}},
  {currentLoaded:{...loaded,heelXZ:[loaded.heelXZ[0]+.01,loaded.heelXZ[1]]}},
  {currentSwing:{...swing,toeY:-.005}},
  {currentSwing:{...swing,heelY:.015}},
  {sourceClipName:'Idle'},{sourceWeight:.6},
  {sourceInstanceId:'other-GLB'}, {floorTopY:.01},
  {swingSide:'left'}, {stanceProof:null}
 ])assert.equal(qualify({...options,...corrupt}),null,
  'no stale/other-shoe/invalid source pose can earn a linked swing');
});

test('original renderer must preserve and final-recheck loaded stance skin after linked source swing',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const begin=source.indexOf('function stageOriginalSourceSwingLinkedLegAfterMixer(');
 const end=source.indexOf('function stageRigLegsAfterMixer(',begin);
 assert.ok(begin>=0&&end>begin);
 const stage=source.slice(begin,end);
 assert.doesNotMatch(stage,/actor\.sourceStanceSoleCurrentFrameProofs\?\.\[opposite\]\|\|/);
 assert.match(stage,/qualifyOriginalSourceLoadedStanceCompanion\(/);
 assert.match(stage,/const after=read\(\);[\s\S]*qualifyOriginalSourceLoadedStanceCompanion\(/);
 assert.match(stage,/sourceLoadedStanceCompanionVerified/);
 // Source-loaded shoe must be independently measured, not a presumed
 // world-space plant or synthetic authoritative step.
 assert.match(stage,/const before=read\(\)/);
 assert.match(stage,/const after=read\(\)/);
});


// Test-first: genuine 1440px original GLB Actions #43706135986 tick 6
// verified Walking_A linked hip+knee + original foot, but left a genuine
// swinging toe 55.382mm below -20mm stone. Baseline ±120mrad foot track
// raised the exact source toe 11.205mm without moving the right loaded shoe.
// The +180/+240mrad samples below are explicit SYNTHETIC candidate trials,
// not a claim that native WebGL has yet accepted or filmed them.
test('RED: measured original deep-swing foot arc can spend two unused licensed-skin trials',async()=>{
 const {
  planOriginalSourceDeepSwingFootFollowups:followups,
  chooseOriginalSourceSwingLinkedFootFinisher:select
 }=await load();
 assert.equal(typeof followups,'function','missing source-measured slow-frame adaptive original foot continuation');
 const original={
  left:{heelY:.2194714347,toeY:-.0865865893,
   heelXZ:[-3.68752,-6.955368],toeXZ:[-3.667785,-6.935734]},
  right:{heelY:-.0360614169,toeY:-.0370463736,
   heelXZ:[-3.743833,-7.113063],toeXZ:[-4.014022,-7.138308]}
 };
 const shoe=(heelY,toeY,toeDx)=>({
  heelY,toeY,heelXZ:[-3.68752-.005,-6.955368],
  toeXZ:[-3.667785+toeDx,-6.935734]
 });
 const base={
  mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceInstanceId:'live-source-41-joint',sourceFootChainVerified:true,
  sourceFootTrackVerified:true,ownerLocomotion:true,
  alive:true,visible:true,rootTravel:.0504,frameAge:0,
  frameInterval:.1166,side:'left',floorTopY:-.02,before:original,
  linkedProof:{source:'measured-original-skinned-linked-leg',
   sourceClip:'Walking_A',sourceInstanceId:'live-source-41-joint',
   side:'left',contactLocked:false,oppositeShoePreserved:true,
   upperRad:-.14,lowerRad:.105,after:original}
 };
 const probes=[
  {angleRad:-.12,axisKind:'original-clip-track',
   after:{left:shoe(.2256654,-.0753818,.0225),right:original.right}},
  {angleRad:.12,axisKind:'original-clip-track',
   after:{left:shoe(.2123976,-.094661,.020),right:original.right}}
 ];
 const proposal=followups({...base,trials:probes});
 assert.deepEqual(proposal,[-.18,-.24],
  'original positive signed 120mrad toe lift earns only two remaining actual-shoe reads');
 const extended=[
  {...probes[0],angleRad:-.18,
   after:{left:shoe(.229,-.0702,.032),right:original.right}},
  {...probes[0],angleRad:-.24,
   after:{left:shoe(.232,-.0642,.045),right:original.right}}
 ];
 const chosen=select({...base,trials:[...probes,...extended]});
 assert.equal(chosen?.angleRad,-.24);
 assert.equal(chosen?.source,'actual-original-linked-hip-knee-foot-skinned-trial');
 assert.equal(chosen?.oppositeFootVerified,true);
 assert.equal(chosen?.contactLocked,false);
 assert.ok(chosen.liftMeters>.02);
 // Real full-speed frames, alternative unproven axes, stale poses, and
 // externally shifted supporting soles must never spend this arc.
 assert.equal(followups({...base,frameInterval:.0333,trials:probes}),null);
 assert.equal(followups({...base,sourceClipName:'Idle',trials:probes}),null);
 assert.equal(followups({...base,sourceWeight:.7,trials:probes}),null);
 assert.equal(followups({...base,linkedProof:{...base.linkedProof,sourceInstanceId:'other'},trials:probes}),null);
 assert.equal(select({...base,frameInterval:.0333,trials:extended}),null);
 assert.equal(select({...base,trials:extended.map(t=>({...t,axisKind:'original-bind-dorsiflexion'}))}),null);
 assert.equal(select({...base,trials:extended.map(t=>({...t,after:{
  ...t.after,left:{...t.after.left,heelY:.25}
 }}))}),null);
 assert.equal(select({...base,trials:extended.map(t=>({...t,after:{
  ...t.after,right:{...original.right,toeY:original.right.toeY+.006}
 }}))}),null);
});
