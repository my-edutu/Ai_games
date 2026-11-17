'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');

const source=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

// Genuine original player_swordsman.glb (CC0, pinned SHA) desktop Chromium
// Actions 43381914826, RAF 61 -> 62 at 1440px. The airborne LEFT shoe
// becomes nearly vertical: its XZ heel/toe projection is only 63.15 -> 77.72
// mm, while its true skinned 3D length remains 306.02 -> 304.30 mm.
// The RIGHT source-loaded shoe drifts ~35-36 mm during 19.64 mm legal root
// travel. This isn't synthetic contact or IK: it is a reversible <=18mm
// presentation-only opportunity that must still pass live readback.
const before={
 left:{heel:[-5.648971662064303,.20708390239746327,-6.960149788500405],
  toe:[-5.7063452296960975,-.09234804904901626,-6.933755263271569]},
 right:{heel:[-5.679683868411334,-.02274134505348726,-7.112227465336585],
  toe:[-5.949723697044612,-.03615459273937912,-7.137275820243999]}
};
const after={
 left:{heel:[-5.633030860093171,.20451058015318663,-6.945252435394299],
  toe:[-5.708598116120008,-.08969519012990541,-6.927100472859871]},
 right:{heel:[-5.644538488695346,-.02265523506443769,-7.103696788132081],
  toe:[-5.914666314148776,-.03261125957440168,-7.129281391308135]}
};
const evidence={
 mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
 sourceInstanceSame:true,ownerLocomotion:true,rootTravel:.019641225088437,
 recentRootTravel:.019641225088437,recentTravelAge:0,
 frameInterval:.1333,previousRootYaw:-Math.PI/2,
 currentRootYaw:-Math.PI/2,alive:true,visible:true,
 teleport:false,reducedMotion:false,interrupted:false,
 floorTopY:-.02,previous:before,current:after
};
test('actual source airborne steep shoe permits conservative loaded-foot skid relief',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 const result=plan(evidence);
 assert.equal(result?.side,'right',
  'the actual stable loaded source shoe must be eligible despite the other steep original shoe');
 assert.ok(result.reductionMeters>.009&&result.reductionMeters<.012,
  'remain below 18mm, and below 55% of independently witnessed 19.64mm root travel');
 assert.equal(result.contactLocked,false,'this does not assert world-space IK or fixed contact');
 assert.equal(result.oppositeSwing3DLengthVerified,true,
  'the opposite shoe must retain its true skinned 3D length');
});
test('no angular, deformed, interrupted or unwitnessed source is rescued',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 for(const change of [
  {previousRootYaw:-Math.PI/2,currentRootYaw:-Math.PI/2+.6375},
  {rootTravel:0,recentRootTravel:0},
  {teleport:true},{reducedMotion:true},{sourceWeight:.5},
  {mode:'attack'},{sourceInstanceSame:false},
  {previous:{...before,left:{...before.left,toe:[...before.left.toe.slice(0,1),-.01,before.left.toe[2]]}}},
  {previous:{...before,left:{...before.left,toe:[-5.648971662064303,.20,-6.960149788500405]}}}
 ])assert.equal(plan({...evidence,...change}),null,
   'do not rescue an invalid/rejected original source pose: '+JSON.stringify(change));
});


// Actual original mobile Walking_A trial evidence from exact-head Actions
// #43890060013, source-rig artifact 14238496473, first slow swing at
// 233.3ms: toe=-62.174mm, heel=+231.266mm (floor=-20mm). The original
// 120/90mrad trial raised its toe 16.885mm AND heel 28.533mm; larger
// 145/110mrad raised toe 21.714mm AND heel 34.128mm. ALL worsened the
// ~293mm heel-to-toe pitch, despite keeping the other loaded source shoe
// still. XZ positions below are synthetic LOCAL anchors with the ORIGINAL
// measured displacement magnitudes; original trial Y and the >200ms source
// display interval are genuine. No claim of plant/contact/IK is made.
const sparseGaitSource={
 mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
 sourceInstanceSame:true,sourceChainVerified:true,
 sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
 sourceBindVerified:true,ownerLocomotion:true,alive:true,visible:true,
 teleport:false,reducedMotion:false,interrupted:false,
 rootTravel:.02,frameAge:.02,frameInterval:.2333,floorTopY:-.02,
 side:'left',previousLinkedCertified:false,
 before:{
  left:{heelY:.23126603764078027,toeY:-.06217434950262485,
   heelXZ:[0,0],toeXZ:[.058,0]},
  right:{heelY:.008921103597759047,toeY:-.0015700389674986048,
   heelXZ:[1,0],toeXZ:[1.27,0]}
 },
};
function measuredSparseTrial(upperRad,lowerRad,toeLift,heelRise,toeShift,heelShift){
 const before=sparseGaitSource.before;
 return {upperRad,lowerRad,after:{
  left:{heelY:before.left.heelY+heelRise,
   toeY:before.left.toeY+toeLift,
   heelXZ:[heelShift,0],toeXZ:[.058+toeShift,0]},
  right:{...before.right}
 }};
}
const sparseOriginalTrials=[
 measuredSparseTrial(.12,-.09,-.007117547,-.031600624,.04904231,.00315768),
 measuredSparseTrial(-.12,.09,.016885366,.028533266,.04644836,.00892317),
 measuredSparseTrial(-.14,.105,.020593172,.032890058,.05382552,.01093182),
 measuredSparseTrial(-.145,.11,.021713770,.034127618,.05581329,.01162822)
];

test('RED: original 233ms 390px source shoe must not gain more airborne heel than toe while still buried',async()=>{
 const {chooseOriginalSourceSwingLinkedLegTrial:select}=await load();
 assert.equal(select({...sparseGaitSource,trials:sparseOriginalTrials}),null,
  'all four authentic Y trials worsened deep shoe pitch; sparse 233ms is not an exemption');
 const recovered=sparseOriginalTrials.map((trial,i)=>i===2?
  {...trial,after:{...trial.after,left:{...trial.after.left,
   heelY:sparseGaitSource.before.left.heelY+.010}}}:trial);
 const safe=select({...sparseGaitSource,trials:recovered});
 assert.ok(safe,'a source-skinned 20.59mm toe rise with only 10mm heel rise remains eligible');
 assert.equal(safe.upperRad,-.14);
 assert.equal(safe.contactLocked,false);
 for(const bad of [
  {sourceInstanceSame:false},{sourceWeight:.8},{reducedMotion:true},
  {interrupted:true},{mode:'hurt'},{frameInterval:.25}
 ])assert.equal(select({...sparseGaitSource,trials:recovered,...bad}),null,
  'never infer a rescue from stale/invalid source ownership or time');
});


test('sparse 390px original hip-knee shoe pitch retains independent final source skin certificate',async()=>{
 const {chooseOriginalSourceSwingLinkedLegTrial:select,
  certifyOriginalSourceFirstSwingPitch:certify}=await load();
 const trials=sparseOriginalTrials.map((trial,i)=>i===2?
  {...trial,after:{...trial.after,left:{...trial.after.left,
   heelY:sparseGaitSource.before.left.heelY+.010}}}:trial);
 const candidate=select({...sparseGaitSource,trials});
 assert.equal(candidate?.originalSwingPitchProtected,true);
 const input={candidate,sourceClipName:'Walking_A',sourceInstanceSame:true,
  sourceWeight:1,side:'left',floorTopY:-.02,before:sparseGaitSource.before,
  after:trials[2].after};
 const proof=certify(input);
 assert.equal(proof?.contactLocked,false,'this is not a foot plant');
 assert.ok(proof?.sourcePitchGainMeters>.010&&proof.sourceToeLiftMeters>.020);
 const wrongHeel={...trials[2].after,left:{...trials[2].after.left,
  heelY:trials[2].after.left.heelY+.004}};
 const driftingSupport={...trials[2].after,right:{...trials[2].after.right,
  toeY:trials[2].after.right.toeY+.005}};
 for(const bad of [
  {after:wrongHeel},{after:driftingSupport},
  {sourceClipName:'Idle'},{sourceWeight:.8},{sourceInstanceSame:false},
  {before:{...sparseGaitSource.before,left:{...sparseGaitSource.before.left,
   toeY:sparseGaitSource.before.left.toeY-.01}}}
 ])assert.equal(certify({...input,...bad}),null,
  'final licensed shoes, clip ownership and opposite sole must independently match');
});


// Authentic 17 November 2026 exact-source WebGL #44041479976,
// 390px Vanguard Walking_A right swing shoe, tick 6 (original-sole patch
// mobile evidence). Projection is ~59.5mm, not a synthetic 60mm foot.
// The current 60mm cutoff suppresses outsole-world-pitch even though
// the SAME skinned source heel and toe verify a non-degenerate 300mm drop.
// This regression is eligibility ONLY; actual correction still needs the
// downstream two-shoe re-skin and genuine before/after footage.
test('RED: authentic 17 November source mobile micro-projection qualifies for original outsole-world pitch',async()=>{
 const {planOriginalSourceWorldSolePitchAxis:plan}=await load();
 const source={
  heelXZ:[-3.665895134576252,-7.131502700894674],
  toeXZ:[-3.722258800592407,-7.150651891426191],
  heelY:.1920155532406111,toeY:-.10835566389042844,
  floorTopY:-.02,sourceSoleVerified:true,sourceTrackVerified:true
 };
 const projection=Math.hypot(source.toeXZ[0]-source.heelXZ[0],
  source.toeXZ[1]-source.heelXZ[1]);
 assert.ok(projection>.059&&projection<.060,
  'the genuine original source GLB toe-to-heel horizontal projection must match this regression');
 const result=plan(source);
 assert.equal(result?.source,'verified-original-skinned-world-outsole-axis',
  'near-vertical real source shoe must reach downstream reversible source-skin trials');
 assert.ok(Math.abs(result.projectionMeters-projection)<1e-8);
 const dx=source.toeXZ[0]-source.heelXZ[0];
 const dz=source.toeXZ[1]-source.heelXZ[1];
 assert.ok(result.worldAxis[2]*dx-result.worldAxis[0]*dz>.059);
 for(const corrupt of [
  {sourceSoleVerified:false},{sourceTrackVerified:false},
  {toeXZ:[source.heelXZ[0]-.035,source.heelXZ[1]]},
  {heelY:.015},{toeY:-.015},{floorTopY:0}
 ])assert.equal(plan({...source,...corrupt}),null,
  'arbitrary short shoe or unverified source cannot pass original outsole gate');
});


// Session 03, 17 Nov 2026: exact source-GLB Walking_A 390px
// shoe with a 59.5mm XZ outsole and ~300mm heel-to-toe vertical drop.
// The source thigh+calf followup *changes the foot's world basis*. Converting
// the authentic world-pitch axis through the PRE-THIGH foot quaternion is
// physically wrong even if the outsole world axis was originally verified.
// Recompute for each tested imported three-joint candidate; no new skin read,
// hit, IK target, mesh or root step. Real after-GLB video is still required.
test('RED: genuine world-outsole axis is converted after source thigh/calf candidate, not before',()=>{
 const {Bone,Quaternion,Vector3}=require('three');
 const skeletonRoot=new Bone(),upper=new Bone(),lower=new Bone(),foot=new Bone();
 skeletonRoot.add(upper);upper.add(lower);lower.add(foot);
 skeletonRoot.rotation.y=.61;
 upper.rotation.x=.17;
 lower.rotation.z=-.11;
 foot.rotation.y=.29;
 skeletonRoot.updateMatrixWorld(true);
 const dx=-3.722258800592407-(-3.665895134576252);
 const dz=-7.150651891426191-(-7.131502700894674);
 const worldAxis=new Vector3(-dz,0,dx).normalize();
 const originalWorld=foot.getWorldQuaternion(new Quaternion());
 const staleLocal=worldAxis.clone().applyQuaternion(originalWorld.clone().invert());
 upper.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),-.11));
 lower.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),.11));
 upper.updateWorldMatrix(true,true);
 const candidateWorld=foot.getWorldQuaternion(new Quaternion());
 const correctedLocal=worldAxis.clone().applyQuaternion(candidateWorld.clone().invert());
 assert.ok(correctedLocal.clone().applyQuaternion(candidateWorld).angleTo(worldAxis)<1e-6,
  'new local foot pitch must raise the same verified world-space toe direction');
 assert.ok(staleLocal.clone().applyQuaternion(candidateWorld).angleTo(worldAxis)>.02,
  'the old pre-thigh basis points the foot pitch off the true skinned outsole');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('for(const {upperRad,lowerRad,footRad} of connectedAngles)');
 const end=renderer.indexOf('trials.push({upperRad,lowerRad,footRad',start);
 assert.ok(start>0&&end>start,'actual original-GLB two-candidate foot sweep must exist');
 const trial=renderer.slice(start,end);
 assert.match(trial,/upper\.bone\.updateWorldMatrix\(true,true\);[\s\S]*foot\.bone\.getWorldQuaternion\(/,
  'update the imported upper/lower transforms before mapping the source world pitch into foot-local');
 assert.match(trial,/footAxis\.copy\(worldSoleAxis\)/,
  'the world sole direction must be applied to each trial rather than cached before candidate thigh/calf');
 assert.match(trial,/foot\.bone\.quaternion\.copy\(kneeFootCoupled\.savedFoot\)\.multiply\(/,
  'real imported foot still receives a reversible local delta');
});
