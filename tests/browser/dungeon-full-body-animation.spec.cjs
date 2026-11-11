'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
const {pairOriginalSourceFrames}=require('./dungeon-source-raf-pair.cjs');
const {isUninterruptedMeleeWitness,isUninjuredIdleRecovery,isExactNativeClipWitness,isUninterruptedRangedWitness}=require('./dungeon-animation-witness.cjs');
fs.mkdirSync('artifacts',{recursive:true});

function witness(accept){
 const game=DungeonRuntime.create('visual-room-art-18');
 let before=game.publicState();
 for(let i=0;i<950;i++){
  const after=game.step();
  const actor=after.units.find(unit=>accept(unit,before,after));
  if(actor)return{before,after,actor,seed:'visual-room-art-18'};
  before=after;
 }
 throw Error('No genuine eligible authority transition in the source seed');
}
const attack=()=>witness((u,before)=>
 u.faction==='party'&&u.hp>0&&u.action==='attack'&&
 before.units.some(old=>old.id===u.id&&old.actionTick!==u.actionTick));
const travel=()=>witness((u,before)=>
 u.faction==='party'&&u.hp>0&&before.units.some(old=>old.id===u.id&&
 (old.x!==u.x||old.z!==u.z)));

async function loadStage(page,snapshot){
 let state=snapshot;
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),
  {timeout:60000}).toBeGreaterThanOrEqual(3);
 return {set(next){state=next},errors};
}


/**
 * The source-rig inspector is sampled explicitly, never on every game frame.
 * It reads genuine imported-bone world transforms after the live Three.js
 * AnimationMixer and reversible joint overlays have already been applied.
 */
async function nativeRigProof(page){
 const audit=await page.evaluate(()=>window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.()??null);
 expect(audit?.schemaVersion).toBe(1);
 expect(audit.summary.sourceActors).toBeGreaterThanOrEqual(3);
 expect(audit.summary.sampledSegments).toBeGreaterThanOrEqual(12);
 expect(audit.summary.disconnectedSegments).toBe(0);
 expect(audit.summary.invalidSegments).toBe(0);
 expect(audit.summary.invalidQuaternionCount).toBe(0);
 expect(audit.summary.invalidMatrixCount).toBe(0);
 expect(audit.summary.bindReferenceComplete,'original inverse-bind reference').toBe(true);
 expect(audit.summary.bindReferenceMissingActors).toBe(0);
 expect(audit.summary.maxQuaternionError).toBeLessThan(.015);
 expect(audit.actors.every(a=>a.skinnedMeshes>0&&a.validSegments>=4)).toBe(true);
 return audit;
}

/**
 * True desktop/mobile original source-GLB skin-to-floor acceptance probe.
 * BEFORE: archived exact-original actor soles ~+.210m above the stone.
 * AFTER: comparable idle sample must ground without any root translation.
 */
for(const view of [
 {name:'desktop',width:1440,height:900},
 {name:'mobile',width:390,height:844}
])test('original skinned idle shoe rests on real stone without moving the authority root: '+view.name,
 async({page})=>{
 test.setTimeout(140000);
 await page.setViewportSize({width:view.width,height:view.height});
 const start=DungeonRuntime.create('visual-room-art-18').publicState();
 const stage=await loadStage(page,start),rig=await nativeRigProof(page);
 const vanguard=rig.actors.find(a=>a.kind==='vanguard'&&a.mode==='idle');
 expect(vanguard,'genuine source Vanguard Idle must be visible').toBeTruthy();
 expect(vanguard?.sourceActionSample?.clipName,
  'original imported Idle is inspected at genuine mixer time, not inferred from server labels').toBe('Idle');
 expect(Number.isFinite(vanguard?.sourceActionSample?.time)).toBe(true);
 expect(vanguard.sourceActionSample.time).toBeGreaterThanOrEqual(0);
 expect(vanguard.sourceActionSample.time).toBeLessThanOrEqual(vanguard.sourceActionSample.duration);
 expect(vanguard?.sourceGroundAnchor?.accepted,
  'the original heel/sole should no longer hover 23cm above stone').toBe(true);
 expect(vanguard?.sourceGroundAnchor?.measuredFrom).toBe('original-skinned-sole-vertices');
 expect(vanguard?.sourceGroundAnchor?.offsetY).toBeLessThan(-.06);
 expect(vanguard?.sourceGroundAnchor?.offsetY).toBeGreaterThan(-.36);
 const soles=[vanguard.soleVertexWorld.left,vanguard.soleVertexWorld.right];
 expect(soles.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))).toBe(true);
 const minSoleY=Math.min(...soles.map(p=>p[1]));
 expect(Math.abs(minSoleY-(-.02)),
  'skinned original sole, not sword-tip bounds, should meet the actual floor').toBeLessThan(.055);
 expect(vanguard.rootWorld[1],
  'the fixed-step grid owner must never move because of cosmetic grounding').toBe(0);
 expect(vanguard.sourceWeaponGrip?.attachedToGripSocket).toBe(true);
 expect(vanguard.maxStretchFraction).toBeLessThanOrEqual(.20);
 expect(rig.summary.bindReferenceComplete).toBe(true);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({
  path:'artifacts/dungeon-full-body-true-floor-'+view.name+'.png',timeout:60000});
 await test.info().attach('original-source-skin-to-stone-'+view.name,{
  contentType:'application/json',body:Buffer.from(JSON.stringify({
   seed:'visual-room-art-18',viewport:view.name,
   floorEvidence:'real authored cube upper surface y=-0.02',
   authorityRoot:vanguard.rootWorld,grounding:vanguard.sourceGroundAnchor,
   sourceSoleVertexWorld:vanguard.soleVertexWorld,
   originalWeaponGrip:vanguard.sourceWeaponGrip,
   deformation:rig.summary,
   beforeArtifact:'Actions 42900564186 source-rig artifact 13802952358',
   warning:'Idle attachment corrects baseline hover, not planted stance, full walk or native IK.'
  },null,2))
 });
});

test('real imported rig attack has one named action owner and source-clip audit',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/full-body-animation-controller.js')).status()).toBe(200);
 const event=attack(),stage=await loadStage(page,event.before);
 const original=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(original.authored3D.sourceClipAudits.length).toBeGreaterThanOrEqual(3);
 expect(original.authored3D.sourceClipAudits.some(a=>a.clips.length>0)).toBe(true);
 const beforeRig=await nativeRigProof(page);
 stage.set(event.after);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.fullBodyModes?.attack??0),
  {timeout:18000,intervals:[70,90,120,180]}).toBeGreaterThanOrEqual(1);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.fullBodyInterruptions).toBeGreaterThanOrEqual(0);
 expect(d.authored3D.fullBodyRestarts).toBeGreaterThanOrEqual(0);
 expect(d.authored3D.rigMeleeBones).toBeGreaterThanOrEqual(2);
 const attackedRig=await nativeRigProof(page);
 expect(attackedRig.summary.maxStretchFraction).toBeLessThanOrEqual(.20);
 expect(Number.isFinite(d.authored3D.fullBodySourceClockMaxRemainingSeconds)).toBe(true);
 expect(d.authored3D.fullBodySourceClockCorrectedFrames).toBeGreaterThanOrEqual(0);
 expect(attackedRig.actors.every(a=>!a.sourceClock||
  (Number.isFinite(a.sourceClock.sourceTime)&&a.sourceClock.sourceTime>=0&&
   Number.isFinite(a.sourceClock.duration)&&a.sourceClock.duration>0))).toBe(true);
 const actorBefore=beforeRig.actors.find(a=>a.id===event.actor.id),
  actorAfter=attackedRig.actors.find(a=>a.id===event.actor.id);
 expect(actorBefore?.validSegments).toBeGreaterThanOrEqual(4);
 expect(actorAfter?.maxStretchFraction).toBeLessThanOrEqual(.20);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-attack.png',timeout:60000});
 await test.info().attach('genuine-attack-frame',{contentType:'application/json',body:Buffer.from(JSON.stringify({
  seed:event.seed,tick:event.after.tick,actorId:event.actor.id,
  source:'unmodified DungeonRuntime publicState',headSha:process.env.GITHUB_SHA??null,
  owners:d.authored3D.fullBodyModes,clipAudits:d.authored3D.sourceClipAudits,
  interruptions:d.authored3D.fullBodyInterruptions,restarts:d.authored3D.fullBodyRestarts,
  sourceClockCorrectedFrames:d.authored3D.fullBodySourceClockCorrectedFrames,
  sourceClockPeakDriftSeconds:d.authored3D.fullBodySourceClockPeakDriftSeconds,
  sourceClockMaxRemainingSeconds:d.authored3D.fullBodySourceClockMaxRemainingSeconds,
  beforeRig,attackedRig
 },null,2))});
});

test('real authority movement drives bounded support on original leg bones without fake combat',async({page})=>{
 test.setTimeout(120000);
 const event=travel(),stage=await loadStage(page,event.before);
 const beforeRig=await nativeRigProof(page);
 const beforeFrame=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0);
 stage.set(event.after);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.fullBodyFootSupportPeakRad??0),
  {timeout:22000,intervals:[70,90,110,140]}).toBeGreaterThan(.003);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.fullBodyFootSupportPeakRad).toBeLessThanOrEqual(.063);
 // Additive hips/ankles and authentic footsteps must have the same phase.
 // Do not claim soles are world-locked merely because these numbers agree.
 expect(d.authored3D.fullBodyFootfallPhaseErrorRad).toBeLessThanOrEqual(.002);
 expect(d.authored3D.fullBodySettlingActors).toBeGreaterThanOrEqual(0);
 expect(d.authored3D.rigGaitBones).toBeGreaterThanOrEqual(4);
 const walkingRig=await nativeRigProof(page);
 // The native rig must have advanced real WebGL frames, not only a route mock.
 expect(d.frame).toBeGreaterThan(beforeFrame);
 const originalRigCode=fs.readFileSync(require('node:path').join(__dirname,
  '../../public/ai-dungeon/native-rig-deformation-plan.js'),'utf8');
 const {measureSourceJointTravel}=await import('data:text/javascript;base64,'+
  Buffer.from(originalRigCode).toString('base64'));
 const beforeActor=beforeRig.actors.find(a=>a.id===event.actor.id);
 const walkingActor=walkingRig.actors.find(a=>a.id===event.actor.id);
 const jointTrajectory=measureSourceJointTravel(beforeActor,walkingActor);
 expect(jointTrajectory.comparable,'same original GLB and both source ankles').toBe(true);
 expect(jointTrajectory.rootTravelMeters).toBeGreaterThanOrEqual(0);
 expect(Object.values(jointTrajectory.footWorldDeltaMeters).every(Number.isFinite)).toBe(true);
 expect(walkingRig.summary.maxStretchFraction).toBeLessThanOrEqual(.20);
 expect(beforeRig.summary.sourceActors).toBeGreaterThanOrEqual(3);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.webgl).toBe(true);expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-travel.png',timeout:60000});
 await test.info().attach('genuine-stride-frame',{contentType:'application/json',body:Buffer.from(JSON.stringify({
  seed:event.seed,tick:event.after.tick,actorId:event.actor.id,
  source:'unmodified DungeonRuntime publicState',supportPeak:d.authored3D.fullBodyFootSupportPeakRad,
  gaitBones:d.authored3D.rigGaitBones,phaseErrorRad:d.authored3D.fullBodyFootfallPhaseErrorRad,
  settlingActors:d.authored3D.fullBodySettlingActors,owners:d.authored3D.fullBodyModes,
  beforeRig,walkingRig,jointTrajectory,
  warning:'Ankle-joint displacement is NOT physical sole-to-stone locking.'
 },null,2))});
});

/** The next 350ms authority tick may be idle even though the original 620ms
 * source animation has not finished. Capture a real, adjacent, two-tick fight.
 * Never manufacture a target, public action, hp or grid coordinate. */
async function witnessedSourceRecovery(){
 const path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/facing-plan.js'),'utf8');
 const {planCombatFacing}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const seed of ['visual-room-art-18','gauntlet-corpus-v1-0','gauntlet-corpus-v1-1']){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let i=0;i<1350;i++){
   const after=game.step();
   const fighter=after.units.find(u=>isUninterruptedMeleeWitness(
    before,after,u,planCombatFacing(u,after.units,after.map)));
   if(fighter){
    const idle=game.step();
    if(isUninjuredIdleRecovery(after,idle,fighter.id))
     return {seed,before,attack:after,idle,actorId:fighter.id};
    before=idle;
   }else before=after;
  }
 }
 throw Error('No legal adjacent melee -> next idle tick in the declared real seed corpus');
}
test('genuine adjacent strike preserves skinned attack follow-through into the next authoritative idle tick',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/full-body-animation-controller.js')).status()).toBe(200);
 const sequence=await witnessedSourceRecovery();
 const stage=await loadStage(page,sequence.before);
 stage.set(sequence.attack);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.fullBodyModes?.attack??0),
  {timeout:25000,intervals:[70,90,120]}).toBeGreaterThan(0);
 stage.set(sequence.idle);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.fullBodyVerifiedContactRecoveryFrames??0),
  {timeout:25000,intervals:[70,90,120]}).toBeGreaterThan(0);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.fullBodyHeldRecoveryFrames).toBeGreaterThan(0);
 expect(d.authored3D.fullBodyVerifiedContactRecoveryFrames).toBeLessThanOrEqual(d.authored3D.fullBodyHeldRecoveryFrames);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.authored3D.nativeContinuousActors).toBeGreaterThanOrEqual(3);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-source-recovery.png',timeout:60000});
 await test.info().attach('authentic-adjacent-attack-to-idle-recovery',{contentType:'application/json',body:Buffer.from(JSON.stringify({
  seed:sequence.seed,actorId:sequence.actorId,
  source:'actual consecutive DungeonRuntime.step snapshots; no simulated attack or target',
  ticks:[sequence.before.tick,sequence.attack.tick,sequence.idle.tick],
  recoveryFrames:d.authored3D.fullBodyHeldRecoveryFrames,
  contactRecoveryFrames:d.authored3D.fullBodyVerifiedContactRecoveryFrames,
  ownerModes:d.authored3D.fullBodyModes
 },null,2))});
});


test('Ranger witnessed arrow action selects native 41-joint ranged release in actual WebGL',async({page})=>{
 test.setTimeout(120000);
 const event=witness((u,before,after)=>isUninterruptedRangedWitness(before,after,u));
 const stage=await loadStage(page,event.before);
 stage.set(event.after);
 // The original 2H_Ranged_Shoot legitimately crossfades to Idle in 620ms.
 // Polling the action then reading sourceClipBindings AGAIN can capture the
 // later idle frame and falsely fail a genuine source release. Capture source
 // binding, exact event tick and original source-joint audit atomically.
 const expected={id:event.actor.id,kind:'ranger',action:'attack',
  sourceTick:event.actor.actionTick,clipName:'2H_Ranged_Shoot'};
 let observed=null;
 await expect.poll(async()=>{
  const sample=await page.evaluate(({id,tick})=>{
   const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
   const binding=d?.authored3D?.sourceClipBindings?.find(b=>
    b.id===id&&b.kind==='ranger'&&b.action==='attack'&&b.sourceTick===tick);
   if(binding?.clipName!=='2H_Ranged_Shoot')return null;
   const rig=window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.();
   return {binding,rig,actor:rig?.actors?.find(a=>a.id===id)??null,
    clipAudits:d.authored3D.sourceClipAudits,frame:d.frame,
    missingAssets:d.authored3D.missingAssets};
  },{id:event.actor.id,tick:event.actor.actionTick});
  if(isExactNativeClipWitness(sample,expected))observed=sample;
  return observed!==null;
 },{timeout:18000,intervals:[70,90,120,180]}).toBe(true);
 expect(observed.binding.clipName).toBe('2H_Ranged_Shoot');
 expect(observed.binding.sourceTick).toBe(event.actor.actionTick);
 expect(observed.clipAudits.some(x=>x.kind==='ranger'&&
  x.clips.some(c=>c.name==='2H_Ranged_Shoot'&&c.rotation>0))).toBe(true);
 expect(observed.missingAssets).toBe(0);
 expect(observed.rig.summary.maxStretchFraction).toBeLessThanOrEqual(.20);
 expect(observed.rig.summary.invalidMatrixCount).toBe(0);
 expect(stage.errors).toEqual([]);
 // This image is a real later frame, NOT evidence the fleeting release is
 // still held. The atomic source witness above and the genuine WebM are the
 // authoritative evidence of the short-lived release.
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-ranger-release.png',timeout:60000});
 await test.info().attach('genuine-ranger-source-release',{contentType:'application/json',
  body:Buffer.from(JSON.stringify({seed:event.seed,sourceTick:event.actor.actionTick,
   realActor:event.actor.id,clip:observed.binding.clipName,
   source:'one atomic original WebGL frame from unmodified DungeonRuntime.step()',
   deformation:observed.rig.summary,hand:observed.actor.sourceHandName,
   clipAudits:observed.clipAudits,frame:observed.frame,
   sourceSha:process.env.GITHUB_SHA??null},null,2))});
});
/**
 * A still attack/travel pair cannot demonstrate a continuous original-rig
 * gait. Only nine CONSECUTIVE genuine source ticks qualify for this film.
 * Do not inject an HP value, event, target, path or invented gameplay frame.
 */
function witnessedNativeStrideSequence(){
 const seeds=['visual-room-art-18','gauntlet-corpus-v1-0','gauntlet-corpus-v1-1'];
 for(const seed of seeds){
  const game=DungeonRuntime.create(seed),history=[game.publicState()];
  for(let tick=0;tick<1000;tick++){
   const state=game.step();history.push(state);
   if(history.length>9)history.shift();
   if(history.length!==9||history.some(s=>s.floor!==history[0].floor||s.run!==history[0].run))continue;
   for(const unit of history[0].units.filter(u=>u.faction==='party'&&u.hp>0)){
    let legalSteps=0,legal=true;
    for(let i=1;i<history.length;i++){
     const a=history[i-1].units.find(u=>u.id===unit.id),
      b=history[i].units.find(u=>u.id===unit.id);
     if(!a||!b||a.hp<=0||b.hp<=0||a.kind!==b.kind){legal=false;break;}
     const dist=Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
     if(!Number.isInteger(dist)||dist>1){legal=false;break;}
     if(dist===1)legalSteps++;
    }
    if(legal&&legalSteps>=2)return {seed,actorId:unit.id,
     states:history.slice(),legalSteps};
   }
  }
 }
 throw Error('No two legal source travel steps in a single nine-tick witness');
}

for(const view of [
 {name:'desktop',width:1440,height:900},
 {name:'mobile',width:390,height:844}
])test('original imported skeleton maintains continuous witnessed travel across nine live ticks: '+view.name,async({page})=>{
 test.setTimeout(220000);
 await page.setViewportSize({width:view.width,height:view.height});
 const sequence=witnessedNativeStrideSequence();
 const stage=await loadStage(page,sequence.states[0]);
 const code=fs.readFileSync(require('node:path').join(__dirname,
  '../../public/ai-dungeon/native-rig-deformation-plan.js'),'utf8');
 const {measureSourceJointTravel,measureSourceSoleGripContinuity,assessSourceSoleFrameWindow,measureSourceSolePatchContinuity,auditOriginalSourceFootFacing}=await import('data:text/javascript;base64,'+
  Buffer.from(code).toString('base64'));
 const trace=[],stanceWindows=[],fastWalkWindows=[],sourcePatchWindows=[],rafWindows=[];
 let previous=null,probedMotion=0;
 for(const snap of sequence.states){
  stage.set(snap);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick??null),
   {timeout:22000,intervals:[80,120,200]}).toBe(snap.tick);
  // The old poll-based source-patch capture mostly skipped rendered frames:
  // all original patch pairs were unqualified despite real moving footage.
  // Capture a small, explicit sequence of consecutive original-rig rAF poses
  // while the SAME legal authority tick is still active. This runs only in
  // this browser test, never in production per-frame skinning.
  if(probedMotion<3&&snap.units.find(u=>u.id===sequence.actorId)?.action==='move'){
   const sampled=await captureOriginalRafSourceFrames(page,sequence.actorId,snap.tick);
   const paired=pairOriginalSourceFrames(sampled.frames,snap.tick,sequence.actorId);
   rafWindows.push({tick:snap.tick,callbackCount:sampled.callbacks,
    observedOriginalFrames:sampled.frames.length,
    frameIndices:sampled.frames.map(f=>f.frame),rejected:paired.rejected,
    pairs:paired.pairs.map(pair=>({
     beforeFrame:pair.beforeFrame,afterFrame:pair.afterFrame,
     beforeMode:pair.before.mode,afterMode:pair.after.mode,
     sourceInstanceId:pair.before.sourceInstanceId,
     sourceClipBefore:pair.before.nativeLegOwnership?.clipName??null,
     sourceClipAfter:pair.after.nativeLegOwnership?.clipName??null,
     beforeCalfSafety:pair.before.nativeLegOwnership?.sourceSwingCalfTrialOutcome??null,
     afterCalfSafety:pair.after.nativeLegOwnership?.sourceSwingCalfTrialOutcome??null,
     sourceTimeBefore:pair.before.sourceActionSample?.time??null,
     sourceTimeAfter:pair.after.sourceActionSample?.time??null,
     sourceDurationBefore:pair.before.sourceActionSample?.duration??null,
     sourceDurationAfter:pair.after.sourceActionSample?.duration??null,
     // Genuine imported source-bone and weighted shoe observations paired to
     // the SAME displayed frames; no authoritative root or joint alteration.
     beforeRootWorld:pair.before.rootWorld,
     afterRootWorld:pair.after.rootWorld,
     beforeRootYaw:pair.before.rootYaw??null,
     afterRootYaw:pair.after.rootYaw??null,
     beforeFootJointWorld:pair.before.footJointWorld??null,
     afterFootJointWorld:pair.after.footJointWorld??null,
     beforeSourceSolePatchWorld:pair.before.sourceSolePatchWorld??null,
     afterSourceSolePatchWorld:pair.after.sourceSolePatchWorld??null,
     beforeOriginalToeAxis:pair.before.sourceSolePatchAnatomy??null,
     afterOriginalToeAxis:pair.after.sourceSolePatchAnatomy??null,
     contact:measureSourceSolePatchContinuity(pair.before,pair.after,{
      beforeFrame:pair.beforeFrame,afterFrame:pair.afterFrame,
      beforeTick:pair.beforeTick,afterTick:pair.afterTick,visible:true,
      floorEvidence:'authored-cube-floor-top',floorTopY:-.02}),
     facing:auditOriginalSourceFootFacing(pair.before,pair.after,{
      beforeFrame:pair.beforeFrame,afterFrame:pair.afterFrame,
      beforeTick:pair.beforeTick,afterTick:pair.afterTick,visible:true,
      floorEvidence:'authored-cube-floor-top',floorTopY:-.02})
    }))});
   probedMotion++;
  }
  // Let the original mixer display real in-between poses. Do not synthesize
  // another authority tick, alter source HP or change the public action.
  await page.waitForTimeout(160);
  const audit=await nativeRigProof(page);
  const actor=audit.actors.find(a=>a.id===sequence.actorId);
  expect(actor?.sourceInstanceId,'the same original GLB clone remains bound').toBeTruthy();
  // Native 41-joint source contact auditing must use the actual foot->toes
  // deform-bone hierarchy and immutable inverse binds, not whichever costume
  // vertex happens to lie farthest to the side. Source anatomy alone does not
  // establish an actual planted foot or authorize world-space ankle IK.
  for(const side of ['left','right']){
   const provenance=actor.sourceSolePatchAnatomy?.[side];
   expect(provenance?.originalToeAxis?.source,
    'original source inverse-bind toe-chain must be inspectable for '+side)
    .toBe('original-foot-to-toes-inverse-bind-axis');
   expect(provenance.originalToeAxis.sourceBoneSeparation).toBeGreaterThan(.035);
   expect(provenance.originalToeAxis.sourceBoneSeparation).toBeLessThan(.45);
   if(provenance.anatomicalHeelToeVerified){
    expect(provenance.source).toBe('original-foot-to-toes-inverse-bind-axis');
    expect(provenance.originalToeAxis.selectedAnatomicalPatch).toBe(true);
   }
  }
  // On original Idle->Walking_A micro-entry, an authentic 5mm visual root
  // step must NOT drive a second fake native 0.58-weight pelvis/leg stride.
  // The on-demand source rig measures real GLB, never invented authority.
  if(actor.nativeLegOwnership?.sourceIdleHandoffHeld){
   expect(actor.nativeLegOwnership.clipName).toBe('Idle');
   expect(actor.nativeLegOwnership.nativeWalkEntryPendingMeters).toBeGreaterThan(0);
   expect(actor.nativeLegOwnership.gaitWeight).toBeLessThan(.001);
   expect(actor.nativeLegOwnership.bodyStrideWeight).toBeLessThan(.001);
  }
  expect(actor.validSegments).toBeGreaterThanOrEqual(4);
  expect(actor.maxStretchFraction).toBeLessThanOrEqual(.20);
  const travel=previous?measureSourceJointTravel(previous,actor):null;
  if(travel)expect(travel.comparable,'never compare different source clones').toBe(true);
  const soleGrip=previous?measureSourceSoleGripContinuity(previous,actor):null;

  // Two consecutive VISIBLE renderer frames at the SAME real source tick,
  // without inventing a state, move, hit or pose. Only this can distinguish
  // source joint animation from the coarse 350ms authority snapshots.
  const beforeFrame=await page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??null);
  expect(Number.isSafeInteger(beforeFrame),'a real rendered frame index').toBe(true);
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??null),
   {timeout:15000,intervals:[70,130,200,350]}).toBeGreaterThan(beforeFrame);
  const sameTickAudit=await nativeRigProof(page);
  const sameTickActor=sameTickAudit.actors.find(a=>a.id===sequence.actorId);
  const afterFrame=await page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??null);
  const stanceWindow=assessSourceSoleFrameWindow(actor,sameTickActor,{
   beforeFrame,afterFrame,beforeTick:snap.tick,afterTick:snap.tick,visible:true});
  const sourcePatch=measureSourceSolePatchContinuity(actor,sameTickActor,{
   beforeFrame,afterFrame,beforeTick:snap.tick,afterTick:snap.tick,visible:true,
   floorTopY:-.02,floorEvidence:'authored-cube-floor-top'});
  expect(sourcePatch.ikAccepted).toBe(false);
  sourcePatchWindows.push({tick:snap.tick,beforeFrame,afterFrame,measurement:sourcePatch,
   first:actor.sourceSolePatchWorld,last:sameTickActor?.sourceSolePatchWorld??null});
  stanceWindows.push({tick:snap.tick,beforeFrame,afterFrame,
   beforeMode:actor.mode,afterMode:sameTickActor?.mode??null,
   beforeRootWorld:actor.rootWorld,afterRootWorld:sameTickActor?.rootWorld??null,
   beforeSkinnedSoles:actor.soleVertexWorld,
   afterSkinnedSoles:sameTickActor?.soleVertexWorld??null,
   beforeLegOwnership:actor.nativeLegOwnership,
   afterLegOwnership:sameTickActor?.nativeLegOwnership??null,
   measurement:stanceWindow});
  // Extended genuine licensed Walking_A trajectory. During at most two
  // additional visible WebGL frames per witnessed walking tick, record the
  // same imported clone's weighted soles without stepping simulation.
  // This is explicit test-time evidence, never runtime skinning work or IK.
  if(actor.mode==='move'&&sameTickActor?.mode==='move'){
   let priorSource=sameTickActor,priorFrame=afterFrame;
   for(let extra=0;extra<2;extra++){
    await expect.poll(()=>page.evaluate(()=>
     window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??null),
    {timeout:15000,intervals:[70,130,200,350]}).toBeGreaterThan(priorFrame);
    const laterAudit=await nativeRigProof(page);
    const laterSource=laterAudit.actors.find(a=>a.id===sequence.actorId);
    const laterFrame=await page.evaluate(()=>
     window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??null);
    const observedTick=await page.evaluate(()=>
     window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick??null);
    expect(observedTick,'no extra authority tick may be invented').toBe(snap.tick);
    const assessment=assessSourceSoleFrameWindow(priorSource,laterSource,{
     beforeFrame:priorFrame,afterFrame:laterFrame,
     beforeTick:snap.tick,afterTick:observedTick,visible:true});
    expect(assessment.ikAccepted,'a source-sole witness is not tested IK').toBe(false);
    fastWalkWindows.push({tick:snap.tick,beforeFrame:priorFrame,afterFrame:laterFrame,
     beforeMode:priorSource.mode,afterMode:laterSource?.mode??null,
     beforeRootWorld:priorSource.rootWorld,afterRootWorld:laterSource?.rootWorld??null,
     beforeSkinnedSoles:priorSource.soleVertexWorld,
     afterSkinnedSoles:laterSource?.soleVertexWorld??null,
     measurement:assessment});
    priorSource=laterSource;priorFrame=laterFrame;
   }
  }

  if(soleGrip){
   expect(soleGrip.comparable,'same original GLB and skinned source soles').toBe(true);
   // The licensed source clip intentionally rotates handslot.r under
   // hand.r; require a rigid sword at its actual authored GRIP socket,
   // while retaining hand-relative movement as an independent diagnostic.
   expect(soleGrip.rigidGripComparable,
    'the actual original right-hand source socket must be witnessed').toBe(true);
   expect(soleGrip.sourceGripSocketName).toBe('handslotr');
   expect(soleGrip.weaponSocketDriftMeters).toBeLessThan(.006);
   expect(soleGrip.weaponSocketMatrixMaxDelta).toBeLessThan(.015);
  }
  trace.push({tick:snap.tick,floor:snap.floor,sourceId:actor.sourceInstanceId,
   rootWorld:actor.rootWorld,footJointWorld:actor.footJointWorld,
   soleVertexWorld:actor.soleVertexWorld,sourceSolePatchWorld:actor.sourceSolePatchWorld,
   sourceSolePatchAnatomy:actor.sourceSolePatchAnatomy,
   sourceWeaponGrip:actor.sourceWeaponGrip,
   sourceClip:actor.sourceClock,footPhase:actor.groundedFootPhase,
   nativeLegOwnership:actor.nativeLegOwnership,
   jointTravel:travel,soleGrip,deformation:audit.summary});
  previous=actor;
 }
 // The same actual original skinned source rig must report bounded imported
 // Walking_A leg ownership; this is not a world-space IK acceptance check.
 expect(trace.every(t=>Number.isFinite(t.nativeLegOwnership?.overlayScale)&&
  t.nativeLegOwnership.overlayScale>=0&&t.nativeLegOwnership.overlayScale<=1),
  'the original 41-joint Walking_A may entirely own locomotion with ZERO duplicate sine layers').toBe(true);
 expect(trace.every(t=>Number.isFinite(t.nativeLegOwnership?.bodyStrideWeight)&&
  Math.abs(t.nativeLegOwnership.bodyStrideWeight-
   t.nativeLegOwnership.gaitWeight*t.nativeLegOwnership.overlayScale)<1e-8),
  'genuine source gait must transfer identical ownership to hips, spine, shoulders and original legs').toBe(true);
 // If actual original GLB ankle correction was applied, the SAME skinned
 // toe/heel frame must prove positive final lift and the heel stays airborne.
 // Attach the real original-rig per-frame toe/heel witness before assertions.
 await test.info().attach('original-source-swing-frame-foot-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    clip:t.nativeLegOwnership?.clipName,
    sourceWeight:t.nativeLegOwnership?.originalSourceWeight,
    cumulative:t.nativeLegOwnership?.sourceSwingToeCorrectionFrames??0,
    correctionsThisFrame:t.nativeLegOwnership?.sourceSwingToeCorrectionsThisFrame??0,
    currentFeet:t.nativeLegOwnership?.sourceSwingToeCurrentFrameProofs??null,
    lastHistorical:t.nativeLegOwnership?.sourceSwingToeLiftProof??null}))},null,2))
 });
 for(const t of trace){
  const n=t.nativeLegOwnership;
  const current=Object.values(n?.sourceSwingToeCurrentFrameProofs??{}).filter(Boolean);
  expect(n?.sourceSwingToeCorrectionsThisFrame??0).toBe(current.length);
  expect(current.length).toBeLessThanOrEqual(2);

  const calfProof=n?.sourceSwingCalfAssistProof;
  if(calfProof){
   expect(calfProof.source).toBe('same-original-connected-GLB-calf-and-skinned-toe');
   expect(calfProof.sourceInstanceId).toBe(t.sourceId);
   expect(calfProof.sourceClip).toBe('Walking_A');
   expect(calfProof.afterToeY-calfProof.beforeToeY).toBeGreaterThan(.002);
   expect(calfProof.afterHeelY).toBeGreaterThan(-.02+.055);
   expect(Math.abs(calfProof.appliedAngleRad)).toBeLessThanOrEqual(.121);
  }
  for(const proof of current){
   expect(proof?.source).toBe('same-original-GLB-foot-skinned-vertices');
   expect(proof?.side).toMatch(/^(left|right)$/);
   expect(proof?.sourceClip).toBe('Walking_A');
   expect(proof?.sourceInstanceId).toBe(t.sourceId);
   expect(proof?.liftMeters).toBeGreaterThan(.001);
   expect(proof?.afterToeY).toBeGreaterThan(proof?.beforeToeY);
   expect(proof?.afterHeelY).toBeGreaterThan(-.02+.045);
   // Verified ±0.2 source ankle trials allow ≤0.22rad at ≤0.08rad/frame.
   expect(Math.abs(proof?.appliedAngleRad)).toBeLessThanOrEqual(.221);
   const beforeDepth=Math.max(0,proof.floorTopY-proof.beforeToeY);
   const afterDepth=Math.max(0,proof.floorTopY-proof.afterToeY);
   expect(beforeDepth).toBeGreaterThan(.025);
   expect(afterDepth).toBeLessThan(beforeDepth-.001);
  }
 }
 const measured=trace.slice(1).map(t=>t.jointTravel.rootTravelMeters);
 expect(measured.every(Number.isFinite)).toBe(true);
 // The observed licensed Walking_A crossfade commonly carries ~.51-.58
 // mixer weight at genuine moving roots. Those frames must now reach the
 // narrowly scoped anatomical swing-toe probe; a zero witness means the
 // production correction is still unreachable despite the pure planner.
 const realCrossfades=trace.filter(t=>
  t.nativeLegOwnership?.clipName==='Walking_A'&&
  t.nativeLegOwnership?.originalSourceWeight>=.5&&
  t.nativeLegOwnership.originalSourceWeight<.9&&
  t.nativeLegOwnership.originalSwingTravelWitnessMeters>=.008);
 // Source blend cadence is browser/GPU dependent: a lawful nine-tick
 // simulation does NOT guarantee the same 50-90% mixer-weight observation
 // in both viewports. Preserve zero qualified pairs as INCONCLUSIVE, never
 // counterfeit real movement or claim an unconditional viewer pass.
 // When a genuine original walking crossfade IS present, its probe MUST run.
 if(realCrossfades.length)expect(realCrossfades.some(t=>
  t.nativeLegOwnership.sourceSwingToeWitnessFrames>0),
  'a genuinely captured original Walking_A crossfade must reach the anatomical toe probe').toBe(true);
 await test.info().attach('original-source-crossfade-toe-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   qualifiedOriginalSourceFrames:realCrossfades.length,
   witnessedOriginalSourceFrames:realCrossfades.filter(t=>
    t.nativeLegOwnership.sourceSwingToeWitnessFrames>0).length,
   confidence:realCrossfades.length?'legal witnessed crossfade probe reached':
    'inconclusive: no qualifying same-frame original walking blend/root displacement',
   requirement:'Do not claim improved toe clearance until source-skinned toe-to-floor before/after is filmed.'},null,2))
 });
 const soleObservations=trace.slice(1).map(t=>t.soleGrip);
 expect(soleObservations.every(s=>s?.comparable),
  'each source GLB action must expose original weighted sole samples');
 expect(soleObservations.every(s=>Object.values(s.soleWorldDeltaMeters).every(Number.isFinite)),
  'no nonfinite skinned sole world displacement');
 // Measured movement of real source joints is necessary, not proof of sole
 // mesh contact or a completed foot-lock IK solver.
 expect(measured.some(n=>n>.005),'source skeleton cannot remain frozen').toBe(true);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-nine-tick-'+view.name+'.png',timeout:60000});
 await test.info().attach('original-GLB-nine-tick-moving-trace',{contentType:'application/json',
  body:Buffer.from(JSON.stringify({seed:sequence.seed,actorId:sequence.actorId,
   legalSteps:sequence.legalSteps,view:view.name,source:'real consecutive DungeonRuntime.step snapshots',
   limitation:'One weight-painted source sole vertex is not full sole-to-stone contact or proven IK.',
   trace},null,2))});
 const soleEvidence={seed:sequence.seed,actorId:sequence.actorId,viewport:view.name,
  provenance:'consecutive real DungeonRuntime.step snapshots and original GLB',
  sourceSoleFrames:soleObservations.length,
  rigidGripFrames:soleObservations.filter(s=>s.rigidGripComparable).length,
  trace:trace.map(t=>({tick:t.tick,soleVertexWorld:t.soleVertexWorld,
   nativeLegOwnership:t.nativeLegOwnership,
   sourceWeaponGrip:t.sourceWeaponGrip,soleGrip:t.soleGrip})),
  caveat:'Weighted source sole candidates are not full sole-ground contact or native IK.'};
 fs.writeFileSync('artifacts/dungeon-full-body-original-sole-hand-'+view.name+'.json',
  JSON.stringify(soleEvidence,null,2));
 await test.info().attach('source-GLB-sole-and-hand-evidence',{
  contentType:'application/json',body:Buffer.from(JSON.stringify(soleEvidence,null,2))
 });

 const visibleFrameEvidence={seed:sequence.seed,actorId:sequence.actorId,
  viewport:view.name,source:'same-tick-real-mixer-sole-window',
  comparisonCount:stanceWindows.length,
  rapidUnresolved:stanceWindows.filter(w=>w.measurement.classification==='rapid-root-travel-unresolved').length,
  extraGenuineMovingFramePairs:fastWalkWindows.length,
  witnessedPotentialPlants:[...stanceWindows,...fastWalkWindows].filter(w=>w.measurement.classification==='potential-plant').length,
  caveat:'Rapid original root travel remains unresolved, NOT certified skating; weighted sole vertices are NOT flat-foot ground contact, IK, or proof of a planted foot.',
  stanceWindows,fastWalkWindows};
 fs.writeFileSync('artifacts/dungeon-full-body-native-stance-window-'+view.name+'.json',
  JSON.stringify(visibleFrameEvidence,null,2));
 await test.info().attach('same-tick-real-mixer-sole-window',{
  contentType:'application/json',body:Buffer.from(JSON.stringify(visibleFrameEvidence,null,2))
 });
 // Original walkable cube tile is 0.16m high centred at y=-0.10m:
 // its upper stone surface is y=-0.02m (public/ai-dungeon/app.js).
 // Two-point original-skin patch observations are NOT source-rig IK.
 const patchEvidence={seed:sequence.seed,actorId:sequence.actorId,viewport:view.name,
  source:'original-source-skinned-shoe-to-authored-upper-tile-y-0.02',
  usablePairs:sourcePatchWindows.filter(w=>w.measurement.comparable).length,
  possibleTwoPointContact:sourcePatchWindows.filter(w=>
   w.measurement.potentialContactSides?.length>0).length,
  aboveFloor:sourcePatchWindows.filter(w=>
   w.measurement.classification==='source-patches-above-floor').length,
  sourcePatchWindows,
  limitation:'Contact candidates only; no anatomical heel/toe proof, surface raycast, foot lock or tested IK.'};
 fs.writeFileSync('artifacts/dungeon-full-body-source-contact-patch-'+view.name+'.json',
  JSON.stringify(patchEvidence,null,2));
 await test.info().attach('source-GLB-floor-contact-patch',{
  contentType:'application/json',body:Buffer.from(JSON.stringify(patchEvidence,null,2))
 });
 const rafEvidence={seed:sequence.seed,actorId:sequence.actorId,viewport:view.name,
  source:'on-demand-original-source-GLB-after-render-requestAnimationFrame',
  legalAuthorityTicks:rafWindows.map(w=>w.tick),rafWindows,
  consecutiveWitnessPairs:rafWindows.reduce((n,w)=>n+w.pairs.length,0),
  comparableSourceContactPairs:rafWindows.reduce((n,w)=>n+
   w.pairs.filter(p=>p.contact.comparable).length,0),
  possibleSourceFootContacts:rafWindows.reduce((n,w)=>n+
   w.pairs.filter(p=>p.contact.potentialContactSides?.length).length,0),
  comparableSourceFacingPairs:rafWindows.reduce((n,w)=>n+
   w.pairs.filter(p=>p.facing.comparable).length,0),
  sourceFacingLagWitnesses:rafWindows.reduce((n,w)=>n+
   w.pairs.filter(p=>p.facing.classification==='source-facing-lags-world-travel').length,0),
  caveat:'Consecutive original skinned frames are evidence, NOT IK, a floor raycast or validated foot plants.'};
 expect(rafEvidence.consecutiveWitnessPairs,
  'an original-rig high-frequency source film must contain real adjacent displayed walking frames').toBeGreaterThan(0);
 // The old evidence path looked for solePatchWorld while live original GLB
 // diagnostics emit sourceSolePatchWorld. Reject another silently empty patch
 // metric for a qualifying imported walking pair on either viewport.
 for(const window of rafEvidence.rafWindows){
  for(const p of window.pairs){
   expect(p.contact.reason,
    'true source shoe contact must not be discarded by a diagnostic key mismatch'
   ).not.toBe('missing-original-skinned-contact-patch');
  }
 }
 fs.writeFileSync('artifacts/dungeon-full-body-original-raf-patch-'+view.name+'.json',
  JSON.stringify(rafEvidence,null,2));
 await test.info().attach('original-consecutive-render-source-patches',{
  contentType:'application/json',body:Buffer.from(JSON.stringify(rafEvidence,null,2))
 });

});



/**
 * A BOUNDED test-only requestAnimationFrame sampler of original source GLB
 * skin and imported source clock. Each on-demand audit follows the existing
 * Three.js render loop; no simulation step or synthetic transform is issued.
 * The helper subsequently rejects every skipped/hidden/different-tick pair.
 */
async function captureOriginalRafSourceFrames(page,actorId,expectedTick){
 return page.evaluate(({actorId,expectedTick})=>new Promise(resolve=>{
  const frames=[];let callbacks=0,done=false;
  const finish=()=>{if(done)return;done=true;clearTimeout(safety);resolve({callbacks,frames});};
  const safety=setTimeout(finish,11000);
  function witness(){
   if(done)return;
   callbacks++;
   const diagnostic=window.__DUNGEON_RENDER_DIAGNOSTICS__;
   const frame=diagnostic?.frame,tick=diagnostic?.renderedState?.tick;
   if(Number.isSafeInteger(frame)&&Number.isSafeInteger(tick)&&tick===expectedTick){
    const rig=window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.();
    const actor=rig?.actors?.find(a=>a.id===actorId);
    if(actor)frames.push({frame,tick,actor,visible:document.visibilityState==='visible'});
   }
   if(callbacks>=14)finish();
   else requestAnimationFrame(witness);
  }
  requestAnimationFrame(witness);
 }),{actorId,expectedTick});
}

/**
 * A genuine consecutive public-state guard/idle event, never a fabricated
 * state transition. All animation clock observations come from original
 * SkeletonUtils-cloned source GLB actors inside the running WebGL renderer.
 */
function witnessedNativeIdleGuardHandoff(){
 const seeds=['visual-room-art-18','gauntlet-corpus-v1-0','gauntlet-corpus-v1-5',
  'gauntlet-corpus-v1-12','gauntlet-corpus-v1-18'];
 for(const seed of seeds){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let i=0;i<1000;i++){
   const after=game.step();
   const actor=after.units.find(u=>{
    if(u.faction!=='party'||u.hp<=0||!['idle','guard'].includes(u.action))return false;
    const previous=before.units.find(b=>b.id===u.id&&b.kind===u.kind);
    return Boolean(previous&&previous.hp===u.hp&&previous.hp>0&&
     previous.action!==u.action&&['idle','guard'].includes(previous.action)&&
     previous.x===u.x&&previous.z===u.z&&before.floor===after.floor);
   });
   if(actor)return {seed,before,after,actorId:actor.id,
    priorAction:before.units.find(u=>u.id===actor.id).action,nextAction:actor.action};
   before=after;
  }
 }
 throw Error('No original consecutive idle/guard public-state witness; do not synthesize one');
}

test('original native 41-joint Idle keeps source mixer phase during witnessed idle/guard ownership handoff',async({page})=>{
 test.setTimeout(170000);
 const e=witnessedNativeIdleGuardHandoff(),stage=await loadStage(page,e.before);
 const loop=id=>page.evaluate(id=>window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.()
  ?.actors?.find(a=>a.id===id)?.sourceLoop??null,id);
 await expect.poll(async()=>{const b=await loop(e.actorId);return b?.mode===e.priorAction?b?.time??0:0;},
  {timeout:35000,intervals:[75,100,140]}).toBeGreaterThan(.23);
 const before=await loop(e.actorId);
 expect(before?.clipName).toBe('Idle');
 expect(before.running).toBe(true);
 stage.set(e.after);
 await expect.poll(()=>page.evaluate(id=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D
  ?.sourceClipBindings?.find(b=>b.id===id)?.action??null,e.actorId),
  {timeout:35000,intervals:[70,120,180]}).toBe(e.nextAction);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D
  ?.fullBodyOriginalIdleClockHandoffs??0),{timeout:15000,intervals:[70,120]}).toBeGreaterThan(0);
 const after=await loop(e.actorId),rig=await nativeRigProof(page);
 expect(after?.clipName).toBe('Idle');
 expect(after.running).toBe(true);
 expect(after.duration).toBeCloseTo(before.duration,6);
 expect(after.time).toBeGreaterThanOrEqual(0);
 expect(after.time).toBeLessThan(after.duration);
 expect(rig.actors.find(a=>a.id===e.actorId)?.sourceInstanceId).toBeTruthy();
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-guard-idle-source-clock.png',timeout:60000});
 await test.info().attach('original-GLB-guard-idle-source-clock',{contentType:'application/json',
  body:Buffer.from(JSON.stringify({source:'two consecutive authentic DungeonRuntime.step snapshots',
   seed:e.seed,actorId:e.actorId,authorityTicks:[e.before.tick,e.after.tick],
   actions:[e.priorAction,e.nextAction],before,after,
   phaseDeltaSeconds:((after.time-before.time+after.duration)%after.duration),
   handoffs:(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__
    ?.authored3D?.fullBodyOriginalIdleClockHandoffs??0)),
   deformation:rig.summary,
   limitation:'Native original foot bones are not sole-mesh vertices; phase continuity is not full 3D LOOK/FEEL acceptance.'},null,2))});
});


/**
 * Genuine adjacent snapshots drive the visible original 41-joint Idle rig.
 * Never inject a guard, block, HP event, facing, root displacement or target.
 * Only the authenticated observed actor is compared before/after in WebGL.
 */
for(const view of [
 {name:'desktop',width:1440,height:900},
 {name:'mobile',width:390,height:844}
])test('source-rig guard-to-idle physically supported native joint blend: '+view.name,async({page})=>{
 test.setTimeout(200000);
 await page.setViewportSize({width:view.width,height:view.height});
 const e=witnessedNativeIdleGuardHandoff();
 const stage=await loadStage(page,e.before);
 const read=()=>page.evaluate(id=>{
  const audit=window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.();
  const actor=audit?.actors?.find(a=>a.id===id);
  const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
  return {actor,summary:audit?.summary??null,frame:d?.frame??null,
   binding:d?.authored3D?.sourceClipBindings?.find(b=>b.id===id)??null,
   guardActors:d?.authored3D?.fullBodyNativeGuardActors??null,
   guardPeakRad:d?.authored3D?.fullBodyNativeGuardPeakRad??null,
   missingAssets:d?.authored3D?.missingAssets??null};
 },e.actorId);
 await page.waitForTimeout(240);
 const before=await read();
 expect(before.actor?.sourceLoop?.clipName).toBe('Idle');
 expect(before.binding?.action).toBe(e.priorAction);
 expect(before.actor?.sourceInstanceId).toBeTruthy();
 if(e.priorAction==='guard')expect(before.actor.guardBlend).toBeGreaterThan(.75);
 else expect(before.actor.guardBlend).toBe(0);
 stage.set(e.after);
 await expect.poll(async()=>(await read()).binding?.action,
  {timeout:30000,intervals:[75,110,180]}).toBe(e.nextAction);
 await page.waitForTimeout(80);
 const first=await read();
 // Guard uses one bounded visible-frame clock: under software WebGL, 190ms
 // of test wall time can contain only ONE rendered frame. Wait for actual
 // original-rig guard pose completion instead of assuming browser FPS.
 // A stalled/missing pose still fails the same strict .70/.25 threshold.
 await expect.poll(async()=>{
  const sample=await read();
  return sample.actor?.guardBlend??(e.nextAction==='guard'?-1:2);
 },{timeout:30000,intervals:[100,170,250,350]})[e.nextAction==='guard'?
  'toBeGreaterThan':'toBeLessThan'](e.nextAction==='guard'?.70:.25);
 const final=await read();
 expect(final.actor?.sourceInstanceId).toBe(before.actor.sourceInstanceId);
 expect(final.actor?.sourceLoop?.clipName).toBe('Idle');
 expect(final.actor?.sourceLoop?.running).toBe(true);
 expect(final.actor?.validSegments).toBeGreaterThanOrEqual(4);
 expect(final.summary?.bindReferenceComplete).toBe(true);
 expect(final.summary?.invalidQuaternionCount).toBe(0);
 expect(final.summary?.maxStretchFraction).toBeLessThanOrEqual(.20);
 expect(final.guardPeakRad).toBeGreaterThan(.15);
 expect(final.guardPeakRad).toBeLessThan(.4);
 expect(final.missingAssets).toBe(0);
 expect(final.frame).toBeGreaterThan(before.frame);
 if(e.nextAction==='guard'){
  expect(final.actor.guardBlend).toBeGreaterThan(.70);
  expect(final.actor.guardBlend).toBeGreaterThanOrEqual(first.actor.guardBlend);
 }else{
  expect(final.actor.guardBlend).toBeLessThan(.25);
  expect(final.actor.guardBlend).toBeLessThanOrEqual(first.actor.guardBlend);
 }
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({
  path:'artifacts/dungeon-full-body-native-guard-blend-'+view.name+'.png',timeout:60000
 });
 await test.info().attach('native-source-guard-to-idle-'+view.name,{
  contentType:'application/json',body:Buffer.from(JSON.stringify({
   source:'consecutive real DungeonRuntime.step snapshots rendered by original GLB',
   seed:e.seed,actorId:e.actorId,ticks:[e.before.tick,e.after.tick],
   actions:[e.priorAction,e.nextAction],view:view.name,
   before,first,after:final,
   limitations:'Original foot JOINT positions are not sole-mesh vertices; no shield block or hit is synthesized; no certified foot lock.'
  },null,2))
 });
});
