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
test('a real licensed Idle full-leg trial does not throw after the original reversible four-probe try/finally',()=>{
 // The previous exact-head native Chromium #43795038691 produced
 // ReferenceError: neutralBlends is not defined ONLY when an eligible real
 // source-pose entered the post-try skin receipt. Existing live browser
 // assertions remain the behavioral RED regression; this narrow scope
 // check keeps the missing lexical binding from being reintroduced.
 const start=renderer.indexOf('function stageOriginalSourceSwingLinkedLegAfterMixer(');
 const end=renderer.indexOf('function stageRigLegsAfterMixer(',start);
 assert.ok(start>=0&&end>start);
 const stage=renderer.slice(start,end);
 assert.match(stage,/let neutralBlends=null;/);
 assert.match(stage,/try\\s*\\{[\\s\\S]*?neutralBlends=!sourceAnkleProof\\?/);
 assert.doesNotMatch(stage,/const neutralBlends=!sourceAnkleProof/);
 assert.match(stage,/requestedNeutralBlends:neutralBlends/);
 assert.match(stage,/actuallyTestedNeutralBlends:trials/);
});

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

test('RED: real original mobile 1.8135-rad Idle knee gap gets safe reversible source-chain samples',async()=>{
 const {planOriginalSourceSafeNeutralBlendSamples:plan,
  chooseOriginalSourceAuthoredNeutralLegTrial:choose}=await load();
 // Measured ORIGINAL KayKit source (not a hypothetical source gap):
 // nine-tick 390px native source-rig Actions #43788636071, SHA 29b91e1,
 // original Idle vs Walking_A upperlegl/lowerlegl/footl at ticks 7–8.
 // Original native frame gate said 'original-idle-joint-rotation-budget'.
 // Only the source joint angular separations are observed here.
 // All XZ sole endpoints and AFTER candidate shoes remain test fixtures:
 // native WebGL must independently measure them; never claim a plant.
 const realSourceGap=[.23162567504770912,1.8135315203505873,.6506337549949619];
 const safe=plan({source:'licensed-original-Idle-joint-gap',
  sourceClipName:'Idle',sourceChainVerified:true,
  sourceJointAngularSeparationRad:realSourceGap,maxJointDeltaRad:.26});
 assert.ok(safe&&safe.length===2,
  'do not reject the actual high-gap Idle knee when two small bounded original-mixer blends exist');
 assert.ok(safe[0]>=.08&&safe[0]<.12);
 assert.ok(safe[1]>=.12&&safe[1]<.15);
 assert.ok(safe[1]-safe[0]>=.02);
 for(const blend of safe)for(const gap of realSourceGap)
  assert.ok(blend*gap<=.260001,
   'real original knee, hip and ankle rotations remain within the source-bone angular budget');
 // A still-buried ORIGINAL skinned swing toe needs REAL toe clearance AND
 // better toe-to-heel pitch; this hypothetical candidate cannot certify it.
 const hypothetical={neutralBlend:safe[1],
  maxJointDeltaRad:safe[1]*realSourceGap[1],
  after:outcome(.024,-.018)};
 const picked=choose({...owner,originalSourceJointGapRad:realSourceGap,
  trials:[hypothetical]});
 assert.equal(picked?.contactLocked,false);
 assert.ok(picked?.originalPitchGainMeters>=.04);
 for(const wrong of [
  {...owner,originalSourceJointGapRad:null},
  {...owner,originalSourceJointGapRad:[.23,3.10,.65]},
  {...owner,originalSourceJointGapRad:realSourceGap,
   trials:[{...hypothetical,maxJointDeltaRad:.001}]},
  {...owner,originalSourceJointGapRad:realSourceGap,
   trials:[{...hypothetical,neutralBlend:.25,maxJointDeltaRad:.26}]},
  {...owner,originalSourceJointGapRad:realSourceGap,
   trials:[{...hypothetical,after:outcome(.024,.027)}]},
  {...owner,originalSourceJointGapRad:realSourceGap,reducedMotion:true}
 ])assert.equal(choose({...owner,trials:[hypothetical],...wrong}),null,
  'no source-gap proof, over-budget joints, heel-dominated pose or reduced-motion bypass');
 // Deny source Idle blending that would be so small it cannot support
 // meaningful full-leg deformation without exceeding the joint budget.
 assert.equal(plan({source:'licensed-original-Idle-joint-gap',
  sourceClipName:'Idle',sourceChainVerified:true,
  sourceJointAngularSeparationRad:[.20,2.99,.65],maxJointDeltaRad:.26}),null);
 assert.match(renderer,/originalSourceJointGapRad:originalNeutralGapRad/,
  'native THREE renderer must verify the identical original gap at selection and final re-skin');
});

test('native source renderer uses real original joint angular separation to budget Idle trials and restores mixer-owned quaternions',()=>{
 assert.match(renderer,/planOriginalSourceSafeNeutralBlendSamples\(/);
 assert.match(renderer,/original\[i\]\.angleTo\(targets\[i\]\)/);
 assert.match(renderer,/sampleOriginalIdle\(blend\)/);
 assert.match(renderer,/originalNeutralMounts\[i\]\.bone\.quaternion/);
 assert.match(renderer,/mount\.last\.multiply\(delta\)/);
});


test('RED: measured original desktop deeply pitched shoe permits source Idle full-leg alternatives even when heel excess is only 2.8mm',async()=>{
 const {planOriginalSourceAuthoredNeutralBlends:plan}=await load();
 // Genuine 1440px original GLB, Actions #43766094802, tick 6:
 // left swing toe -102.823mm, heel +201.411mm against upper stone Y=-20mm,
 // opposite right shoe -15.914/-26.506mm; source weight=1,
 // actually delivered Walking_A frame 116.6ms. Two same-frame original
 // skin starter arcs lifted toe +26.243mm / heel +29.059mm, so the heel
 // still dominates by 2.816mm. XZ positions here are explicitly fixtures:
 // artifact sourceSwingLinkedLastProbe records Y and XZ deltas, not the
 // starting absolute XZ endpoints. Never report the fixture as WebGL proof.
 const left={heelY:.20141098851937922,toeY:-.10282251726531028,
  heelXZ:[0,0],toeXZ:[.065,0]};
 const right={heelY:-.015914026048654432,toeY:-.02650552064114879,
  heelXZ:[1,0],toeXZ:[1.27,0]};
 const measured=(lift,rise)=>({
  left:{...left,toeY:left.toeY+lift,heelY:left.heelY+rise},
  right:{...right}
 });
 const starterTrials=[
  {upperRad:.12,lowerRad:-.09,after:measured(-.016699513266538582,-.03283311333169367)},
  {upperRad:-.12,lowerRad:.09,after:measured(.026243315047378618,.029059106371224885)}
 ];
 const input={...owner,side:'left',before:{left,right},
  frameInterval:.11659999999999826,starterTrials};
 assert.deepEqual(plan(input),[.28,.42],
  'severe genuine source pitch needs two bounded original Idle trials, never an assumed successful plant');
 assert.equal(plan({...input,starterTrials:[
  starterTrials[0],{...starterTrials[1],after:measured(.026243315047378618,.027243315047378618)}
 ]}),null,'a heel rise within 1mm of toe rise is not strong new evidence');
 assert.equal(plan({...input,before:{left:{...left,toeXZ:[.20,0]},right}}),null);
 assert.equal(plan({...input,mode:'attack'}),null);
 assert.equal(plan({...input,sourceInstanceSame:false}),null);
 assert.equal(plan({...input,reducedMotion:true}),null);
 assert.equal(plan({...input,interrupted:true}),null);
});

test('RED: native original-source renderer records WHY Idle full-leg trials were excluded instead of claiming a correction',()=>{
 assert.match(renderer,/sourceNeutralSwingGateLast/);
 assert.match(renderer,/source-neutral-planner-not-qualified/);
 assert.match(renderer,/original-idle-joint-rotation-budget/);
 assert.match(renderer,/originalSourceJointGapRad/);
});

test('RED: genuine current-head 390px 35mm buried steep swing receives original Idle three-joint trial, never invented foot contact',async()=>{
 const {planOriginalSourceAuthoredNeutralBlends:plan,
  chooseOriginalSourceAuthoredNeutralLegTrial:choose}=await load();
 // Exact bda8431 original KayKit mobile source GLB, Actions #43776692938:
 // Walking_A right swing before toe=-55.3149mm, heel=+240.5292mm.
 // Actual opposite source shoe heel=+11.2702mm, toe=+0.3364mm,
 // frameInterval=83.4ms, source weight=1. The original two measured
 // connected hip/knee starter Y deltas were (-9.187,-31.780)mm
 // and (+18.862,+28.466)mm for toe/heel respectively.
 // XZ coordinates and AFTER Idle blend outcomes below are *fixtures*,
 // NOT real measured neutral-pose proof or planted-foot testimony.
 const right={heelY:.2405292172124042,toeY:-.05531494463773174,
  heelXZ:[0,0],toeXZ:[.079,0]};
 const left={heelY:.011270231042909015,toeY:.0003364444615051431,
  heelXZ:[1,0],toeXZ:[1.27,0]};
 const before={right,left};
 const outcome=(toeLift,heelRise)=>({
  right:{...right,toeY:right.toeY+toeLift,heelY:right.heelY+heelRise},
  left:{...left}
 });
 const starterTrials=[
  {upperRad:.12,lowerRad:-.09,after:outcome(-.009186987295148948,-.031780389567421075)},
  {upperRad:-.12,lowerRad:.09,after:outcome(.018861642662973348,.028465551334822953)}
 ];
 const input={...owner,before,frameInterval:.08339999999999748,starterTrials};
 assert.ok(-.02-right.toeY>.035&&-.02-right.toeY<.036);
 assert.deepEqual(plan(input),[.28,.42],
  'the *measured* current original rig is heel-up/toe-buried with a heel-dominated starter; only two reversible source probes are allowed');
 const candidate={neutralBlend:.28,maxJointDeltaRad:.20,
  after:outcome(.024,-.014)};
 const picked=choose({...input,trials:[candidate]});
 assert.equal(picked?.contactLocked,false);
 assert.equal(picked?.originalOppositeShoeVerified,true);
 assert.ok(picked?.originalPitchGainMeters>=.0379,
  'this is a synthetic candidate contract, not verified actual WebGL clearance');
 for(const bad of [
  {before:{right:{...right,toeY:-.048},left}},
  {before:{right:{...right,heelY:.070},left}},
  {before:{right:{...right,toeXZ:[.175,0]},left}},
  {before:{right,left:{...left,toeY:.055}}},
  {starterTrials:[starterTrials[0],{
   ...starterTrials[1],after:outcome(.018861642662973348,.022)}]},
  {frameInterval:.21},{mode:'hurt'},{interrupted:true},
  {sourceClipName:'Idle'},{reducedMotion:true},{teleport:true}
 ])assert.equal(plan({...input,...bad}),null,
  'unsupported original pose, poor heel evidence or foreign action must not authorize three-joint probes');
 assert.equal(choose({...input,before:{right:{...right,toeY:-.048},left},
  trials:[candidate]}),null);
 assert.equal(choose({...input,trials:[{...candidate,
  after:outcome(.024,.032)}]}),null,
  'lifting the already airborne heel more than the toe is not an accepted connected correction');
});

/**
 * Source provenance guard for a REAL defect: native 390px original GLB
 * sourceNeutralSwingGateLast repeatedly reports two matching 'footr'
 * original Idle quaternion tracks (Actions #43782482690), so no three-joint
 * correction is ever sampled. We must resolve only truly identical licensed
 * source sequences; a merely similar first quaternion, extra suffix bone,
 * malformed clip or different future pose must never be silently selected.
 *
 * The synthetic track arrays below are explicit contract fixtures, NOT a
 * claim that the actual GLB's duplicate tracks have identical motion.
 */
test('RED: original Idle bone track resolver distinguishes identical duplicate bindings from conflicting source motion',async()=>{
 const {resolveLicensedIdleJointQuaternionTracks:resolve}=await load();
 const track=(name,values,times=[0,.5,1])=>({name,
  times:new Float32Array(times),values:new Float32Array(values)});
 const q0=[0,0,0,1],q1=[0,.1,0,Math.sqrt(.99)];
 const frames=[...q0,...q1,...q0];
 const primary=track('Armature.footr.quaternion',frames);
 const exactAlias=track('footr.quaternion',frames);
 const positive=resolve([primary,exactAlias],'footr');
 assert.equal(positive?.verified,true);
 assert.equal(positive?.sourceTrackMatches,2);
 assert.equal(positive?.equivalentDuplicate,true);
 assert.ok(Math.abs(positive.quaternion[3]-1)<1e-7);
 assert.deepEqual(positive?.sourceTrackNames,['Armature.footr.quaternion','footr.quaternion']);
 const negated=track('footr.quaternion',frames.map(v=>-v));
 assert.equal(resolve([primary,negated],'footr')?.verified,true,
  'q and -q encode the same original rotation at every source sample');
 const suffixCollision=track('backupfootr.quaternion',[...q0,...q1,...q0]);
 assert.equal(resolve([primary,suffixCollision],'footr')?.sourceTrackMatches,1,
  'nearby source bone names cannot masquerade as footr');
 const changedFuture=track('footr.quaternion',[...q0,...q0,...q1]);
 for(const bad of [
  [primary,changedFuture],
  [primary,track('footr.quaternion',frames,[0,.4,1])],
  [primary,track('footr.quaternion',[...q0,...q1])],
  [primary,track('footr.quaternion',[...q0,...q1,NaN,0,0,1])],
  [primary,track('footr.quaternion',[...q0,...q1,0,0,0,0])],
 ])assert.notEqual(resolve(bad,'footr')?.verified,true,
  'conflicting, untimed, truncated, nonfinite or nonunit original clips fail closed');
 assert.notEqual(resolve([track('fool.quaternion',frames)],'footr')?.verified,true);
 assert.notEqual(resolve([primary],'foor')?.verified,true);
 assert.notEqual(resolve([primary],'footr\u0000')?.verified,true);
 assert.match(renderer,/resolveLicensedIdleJointQuaternionTracks\(/,
  'native rig renderer must use the source-proven duplicate-safe resolver');
});
