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
  {starterTrials:[{...starters[0],after:outcome(.013,.020)},
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
 assert.ok(Math.abs(accepted.sourceToeLiftMeters-.042)<1e-10,
  'true original toe lift is measured with floating-point tolerance, not rounded to a synthetic exact binary decimal');
 for(const bad of [
  {neutralClipName:'Run'},{sourceNeutralRigVerified:false},
  {reducedMotion:true},{sourceWeight:.91},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.27,after:outcome(.042,-.042)}]},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.20,after:outcome(.025,.028)}]},
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.20,after:{
   ...outcome(.042,-.042),left:{...loaded,heelY:loaded.heelY+.005}}}]}, 
  {trials:[{neutralBlend:.42,maxJointDeltaRad:.20,after:{
   ...outcome(.042,-.042),right:{...swing,heelY:.12,toeY:-.05,toeXZ:[.2,0]}}}]}
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

test('real 390px source shoe at 57.8mm burial qualifies a bounded original Idle full-chain trial without granting a plant',async()=>{
 const {planOriginalSourceAuthoredNeutralBlends:plan,
  chooseOriginalSourceAuthoredNeutralLegTrial:choose}=await load();
 // Actual original KayKit Walking_A mobile HEAD e546515e:
 // native-rig Actions 43752353309, tick 3 weighted heel/toe positions
 // and the exact -90/+75mrad dual-skinned starter deltas below.
 // Sample XZ projection, neutral-after positions and candidate outcome
 // remain expressly TEST FIXTURES, never claimed measured neutral WebGL.
 const right={heelY:.2092983856843685,toeY:-.07780778112186443,
  heelXZ:[0,0],toeXZ:[.0698,0]};
 const left={heelY:-.008357621627137362,toeY:.014235324240819622,
  heelXZ:[1,0],toeXZ:[1.27,0]};
 const current={...owner,before:{right,left}};
 const altered=(toeLift,heelDelta)=>({
  right:{...right,toeY:right.toeY+toeLift,heelY:right.heelY+heelDelta,
   heelXZ:[.0065,0],toeXZ:[.105,0]},
  left:{...left}
 });
 const starterTrials=[
  {upperRad:.09,lowerRad:-.075,after:altered(-.007799362948773189,-.02830632308427336)},
  {upperRad:-.09,lowerRad:.075,after:altered(.013671053945321199,.026379916764464217)}
 ];
 assert.ok((-.02-right.toeY)>.055&&(-.02-right.toeY)<.06,
  'the exact source toe is materially buried, just below the old arbitrary 60mm gate');
 assert.deepEqual(plan({...current,starterTrials}),[.28,.42]);
 const hypothetical={neutralBlend:.28,maxJointDeltaRad:.20,after:altered(.024,-.018)};
 const picked=choose({...current,trials:[hypothetical]});
 assert.equal(picked?.contactLocked,false);
 assert.equal(picked?.originalOppositeShoeVerified,true);
 assert.ok(picked.sourceToeLiftMeters>=.018);
 for(const wrong of [
  {before:{right:{...right,toeY:-.074},left}},
  {before:{right:{...right,toeXZ:[.24,0]},left}},
  {before:{right,left:{...left,toeY:.017}}},
  {reducedMotion:true},{interrupted:true},{sourceInstanceSame:false},
  {starterTrials:[starterTrials[0]]}
 ])assert.equal(plan({...current,starterTrials,...wrong}),null);
 assert.equal(choose({...current,before:{right:{...right,toeY:-.074},left},
  trials:[hypothetical]}),null);
 assert.equal(choose({...current,trials:[{
  ...hypothetical,after:altered(.024,.027)
 }]}),null,'a heel-dominant neutral trial must still fail actual two-shoe pitch protection');
});

test('real slow mobile original Walking_A swing can try bounded Idle bones after a long displayed frame, not invent a foot plant',async()=>{
 const {planOriginalSourceAuthoredNeutralBlends:plan}=await load();
 // Exact same-frame original GLB 390px skinned shoes at tick 8,
 // successful Actions #43755344687, SHA 3db98508. The trial Y changes
 // are from actual source hip/knee starter probes. The after XZ values
 // are intentionally held as a conservative fixture, not WebGL evidence.
 const mobileSwing={heelY:.19112150149048887,toeY:-.11052621681944015,
  heelXZ:[-2.667257124525803,-7.120854474234475],
  toeXZ:[-2.7201429995270305,-7.1328669514640834]};
 const mobileLoaded={heelY:-.03263928880400248,toeY:-.031041985798242282,
  heelXZ:[-2.7096633459806823,-6.957903705069923],
  toeXZ:[-2.9798735448609377,-6.93257368634913]};
 const slowOwner={...owner,frameInterval:.1833999999999918,
  before:{right:mobileSwing,left:mobileLoaded}};
 const after=(toeLift,heelRise)=>({
  right:{...mobileSwing,toeY:mobileSwing.toeY+toeLift,
   heelY:mobileSwing.heelY+heelRise},
  left:{...mobileLoaded}
 });
 const realStarters=[
  {upperRad:.12,lowerRad:-.09,after:after(-.013546392194931242,-.03231076450208828)},
  {upperRad:-.12,lowerRad:.09,after:after(.023053701555781722,.028619230757589154)}
 ];
 assert.deepEqual(plan({...slowOwner,starterTrials:realStarters}),[.28,.42],
  'a measured 183ms source display frame and 5.6mm heel-dominant rise must earn two safe original skin probes');
 for(const bad of [
  {frameInterval:.205},{frameInterval:.25},{teleport:true},
  {reducedMotion:true},{interrupted:true},{mode:'attack'},
  {sourceClipName:'Idle'},{sourceWeight:.90},
  {before:{right:mobileSwing,left:{...mobileLoaded,toeY:.08}}},
  {starterTrials:[realStarters[0],
   {upperRad:-.12,lowerRad:.09,after:after(.023053701555781722,.026053701555781722)}]}
 ])assert.equal(plan({...slowOwner,starterTrials:realStarters,...bad}),null,
  'unsupported delayed frames, wrong owner, free-floating stance and weak pitch must still fail closed');
});


test('original Idle knee source-angle budget adapts two full-chain probes instead of rejecting a legal first blend',async()=>{
 const {planOriginalSourceSafeNeutralBlendSamples:budget}=await load();
 // 0.765rad is a representative source-knee rotation magnitude from the
 // licensed Walking_A track audit. It is NOT a measured Idle-vs-Walking_A
 // blend angle and does NOT claim any accepted live native GLB correction.
 const first=budget({source:'licensed-original-Idle-joint-gap',
  sourceClipName:'Idle',sourceChainVerified:true,
  sourceJointAngularSeparationRad:[.38,.765,.22],maxJointDeltaRad:.26});
 assert.ok(first&&first.length===2,'retain two skinned trials within the existing four-probe budget');
 assert.equal(first[0],.28);
 assert.ok(first[1]>.30&&first[1]<.42,
  'permit a safe second source pose when a .42 blend violates a real joint budget');
 assert.ok(first.every(b=>b*.765<=.260001));
 assert.deepEqual(budget({source:'licensed-original-Idle-joint-gap',
  sourceClipName:'Idle',sourceChainVerified:true,
  sourceJointAngularSeparationRad:[.25,.50,.12],maxJointDeltaRad:.26}),[.28,.42]);
 for(const bad of [
  {source:'unverified-skeleton'},
  {sourceClipName:'Walking_A'},{sourceChainVerified:false},
  {sourceJointAngularSeparationRad:[.38,.765]},
  {sourceJointAngularSeparationRad:[.38,NaN,.22]},
  {sourceJointAngularSeparationRad:[.38,3.5,.22]},
  {sourceJointAngularSeparationRad:[0,0,0]},
  {sourceJointAngularSeparationRad:[.38,.95,.22]},
  {maxJointDeltaRad:.40},
  {maxJointDeltaRad:-.1}
 ])assert.equal(budget({source:'licensed-original-Idle-joint-gap',
   sourceClipName:'Idle',sourceChainVerified:true,
   sourceJointAngularSeparationRad:[.38,.765,.22],
   maxJointDeltaRad:.26,...bad}),null);
});

test('native source renderer uses real original joint angular separation to budget Idle trials and restores mixer-owned quaternions',()=>{
 assert.match(renderer,/planOriginalSourceSafeNeutralBlendSamples\(/);
 assert.match(renderer,/original\[i\]\.angleTo\(targets\[i\]\)/);
 assert.match(renderer,/sampleOriginalIdle\(blend\)/);
 assert.match(renderer,/originalNeutralMounts\[i\]\.bone\.quaternion/);
 assert.match(renderer,/mount\.last\.multiply\(delta\)/);
});
