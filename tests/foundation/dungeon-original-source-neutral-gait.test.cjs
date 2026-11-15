'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const renderer=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/model-assets.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

// Genuine 390px native GLB observed at exact HEAD 33143460,
// Actions 43743032245: right swing toe -0.122087m, heel +0.166044m.
// Original -90/+75mrad source leg raised toe +13.653mm and heel +26.346mm;
// the two 75/90, 85/90mrad continuations STILL raised heel more.
// XZ and all candidate neutral-pose trial results BELOW are TEST FIXTURES,
// NOT claimed measured WebGL outcomes.
const swing={heelY:.16604432108392625,toeY:-.12208686615783017,
 heelXZ:[0,0],toeXZ:[.068,0]};
const loaded={heelY:-.042811022835614124,toeY:-.018844058244601225,
 heelXZ:[1,0],toeXZ:[1.27,0]};
const before={right:swing,left:loaded};
const outcome=(lift,heelDelta)=>({
 right:{...swing,toeY:swing.toeY+lift,heelY:swing.heelY+heelDelta,
  heelXZ:[.014,0],toeXZ:[.082,0]},
 left:{...loaded,heelXZ:[...loaded.heelXZ],toeXZ:[...loaded.toeXZ]}
});
const owner={
 mode:'move',sourceClipName:'Walking_A',neutralClipName:'Idle',
 sourceWeight:1,sourceInstanceSame:true,sourceNeutralRigVerified:true,
 ownerLocomotion:true,alive:true,visible:true,
 reducedMotion:false,teleport:false,interrupted:false,
 previousLinkedCertified:false,frameInterval:.0333,side:'right',
 floorTopY:-.02,before
};
const starters=[
 {upperRad:.09,lowerRad:-.075,after:outcome(-.007789,-.02827)},
 {upperRad:-.09,lowerRad:.075,after:outcome(.013653,.026346)}
];
test('RED: real heel-dominated licensed Walking_A allows exactly TWO original Idle full-leg source probes',async()=>{
 const {planOriginalSourceAuthoredNeutralBlends:plan}=await load();
 assert.deepEqual(plan({...owner,starterTrials:starters}),[.28,.42]);
 for(const bad of [
  {mode:'attack'},{sourceClipName:'Idle'},{sourceInstanceSame:false},
  {sourceWeight:.9},{reducedMotion:true},{interrupted:true},
  {teleport:true},{previousLinkedCertified:true},{side:'none'},
  {before:{...before,right:{...swing,toeXZ:[.20,0]}}},
  {starterTrials:[starters[0]]},
  {starterTrials:[{...starters[0],after:outcome(.013,.027)},
    {...starters[0],after:outcome(.002,.005)}]}
 ])assert.equal(plan({...owner,...bad}),null);
});
test('RED: authored connected leg source candidate requires toe clearance, less vertical pitch, stable support',async()=>{
 const {chooseOriginalSourceAuthoredNeutralLegTrial:choose}=await load();
 const candidates=[
  {neutralBlend:.28,maxJointDeltaRad:.18,after:outcome(.027,-.024)},
  {neutralBlend:.42,maxJointDeltaRad:.24,after:outcome(.042,-.042)}
 ];
 const accepted=choose({...owner,trials:candidates});
 assert.equal(accepted?.source,'licensed-original-Walking_A-Idle-connected-leg-blend');
 assert.equal(accepted.neutralBlend,.42);
 assert.equal(accepted.originalOppositeShoeVerified,true);
 assert.equal(accepted.contactLocked,false);
 assert.equal(accepted.sourceToeLiftMeters,.042);
 for(const bad of [
  {neutralClipName:'Run'},{sourceNeutralRigVerified:false},
  {reducedMotion:true},{sourceWeight:.91},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.27,after:outcome(.042,-.042)}]},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.20,after:outcome(.025,.028)}]},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.20,after:{
   ...outcome(.042,-.042),left:{...loaded,heelY:loaded.heelY+.005}}]},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.20,after:{
   ...outcome(.042,-.042),right:{...swing,heelY:.12,toeY:-.05,toeXZ:[.2,0]}}]}
 ])assert.equal(choose({...owner,...bad}),null);
});
test('RED: native original renderer retains four probes, independent FINAL skinned shoes and reversible three-source-bone ownership',()=>{
 assert.match(renderer,/planOriginalSourceAuthoredNeutralBlends\(/);
 assert.match(renderer,/chooseOriginalSourceAuthoredNeutralLegTrial\(/);
 assert.match(renderer,/sourceNeutralSwingCurrentFrameProofs/);
 assert.match(renderer,/originalNeutralMounts\[i\]\.bone\.quaternion/);
 assert.match(renderer,/mount\.last\.multiply\(delta\)/);
 assert.match(renderer,/finalIndependentSourceSkin:true/);
});
