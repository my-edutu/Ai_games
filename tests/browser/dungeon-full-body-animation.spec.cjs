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
 u.faction==='party'&&u.hp>0&&u.action==='move'&&
 before.units.some(old=>old.id===u.id&&
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
 const originalRigCode=fs.readFileSync(require('node:path').join(__dirname,
  '../../public/ai-dungeon/native-rig-deformation-plan.js'),'utf8');
 const {measureSourceJointTravel}=await import('data:text/javascript;base64,'+
  Buffer.from(originalRigCode).toString('base64'));
 const beforeActor=beforeRig.actors.find(a=>a.id===event.actor.id);
 expect(beforeActor?.sourceActionSample,'the real original actor must exist before the step').toBeTruthy();
 // Preserve the SAME real source-GLB frame which proves both legal root travel
 // and Walking_A ownership. A later requestAnimationFrame may legitimately
 // crossfade to Idle after the authority move; it is not this gait witness.
 let walkingRig=null;
 stage.set(event.after);
 // A newly delivered public snapshot is not necessarily painted on the FIRST
 // rAF. Poll the actual original skin/root until the requested, legal
 // DungeonRuntime.step movement has reached the WebGL source instance.
 // Never treat a global frame counter, server move label or a zero-distance
 // source-clip twitch as a successful travelling root.
 await expect.poll(async()=>{
  const audit=await page.evaluate(()=>window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.()??null);
  const current=audit?.actors?.find(a=>a.id===event.actor.id);
  const measured=measureSourceJointTravel(beforeActor,current);
  if(measured?.comparable===true&&
   current?.sourceActionSample?.clipName==='Walking_A'&&
   measured.rootTravelMeters>.008){
   walkingRig=audit;
   return measured.rootTravelMeters;
  }
  return 0;
 },{timeout:22000,intervals:[90,140,200,300]}).toBeGreaterThan(.008);
 // The imported Walking_A legitimately owns all native leg bones once
 // its source clip reaches full weight. Additive rigGaitPeakRad can be exactly
 // ZERO: requiring a procedural twitch would reject correct source ownership.
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.fullBodyFootSupportPeakRad).toBeLessThanOrEqual(.063);
 // Additive hips/ankles and authentic footsteps must have the same phase.
 // Do not claim soles are world-locked merely because these numbers agree.
 expect(d.authored3D.fullBodyFootfallPhaseErrorRad).toBeLessThanOrEqual(.002);
 expect(d.authored3D.fullBodySettlingActors).toBeGreaterThanOrEqual(0);
 expect(d.authored3D.rigGaitBones).toBeGreaterThanOrEqual(4);
 expect(walkingRig?.actors?.length,
  'the qualifying moving source frame must have been captured atomically').toBeGreaterThan(0);
 // The native rig must have advanced real WebGL frames, not only a route mock.
 expect(d.frame).toBeGreaterThan(beforeFrame);
 const walkingActor=walkingRig.actors.find(a=>a.id===event.actor.id);
 const jointTrajectory=measureSourceJointTravel(beforeActor,walkingActor);
 expect(jointTrajectory.comparable,'same original GLB and both source ankles').toBe(true);
 // Measure actual same-GLB skinned ankle travel after an unmodified
 // DungeonRuntime public step, not the optional procedural support angle.
 expect(jointTrajectory.rootTravelMeters,
  'source actor root must translate in the actual WebGL comparison').toBeGreaterThan(.008);
 expect(Object.values(jointTrajectory.footWorldDeltaMeters).every(Number.isFinite)).toBe(true);
 expect(Math.max(...Object.values(jointTrajectory.footWorldDeltaMeters)),
  'at least one original source ankle must move in world-space').toBeGreaterThan(.008);
 expect(walkingActor?.sourceActionSample?.clipName,
  'the actual imported Walking_A, not the optional procedural gait, must own the rendered character').toBe('Walking_A');
 expect(Number.isFinite(walkingActor?.sourceActionSample?.time)).toBe(true);
 expect(Math.max(...Object.values(jointTrajectory.footRelativeToRootDeltaMeters)),
  'original ankle motion relative to the real authority root must be visible, not only root translation').toBeGreaterThan(.003);
 const phase=walkingActor?.groundedFootPhase,support=d.authored3D.fullBodyFootSupportPeakRad;
 // The original licensed clip keys both legs. Zero additional rig rotation
 // is expected at full source weight, at any authentic footfall phase.
 expect(Number.isFinite(d.authored3D.rigGaitPeakRad)&&d.authored3D.rigGaitPeakRad>=0).toBe(true);
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
  originalGroundedPhase:phase,sourceGaitPeak:d.authored3D.rigGaitPeakRad,
  supportIsOptionalAtPhaseZero:true,
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
 const {measureSourceJointTravel,measureSourceSoleGripContinuity,assessSourceSoleFrameWindow,measureSourceSolePatchContinuity,auditOriginalSourceFootFacing,reconcileOriginalSourceContactWitness}=await import('data:text/javascript;base64,'+
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
     originalSpineCounterturnBeforeRad:pair.before.nativeLegOwnership?.originalWalkingTorsoCounterturnRad??0,
     originalSpineCounterturnAfterRad:pair.after.nativeLegOwnership?.originalWalkingTorsoCounterturnRad??0,
     originalSpineCounterturnFrames:pair.after.nativeLegOwnership?.originalWalkingTorsoCounterturnFrames??0,
     originalSpineFirstWalkFrames:pair.after.nativeLegOwnership?.originalWalkingTorsoFirstWalkFrames??0,
     originalSourceClipWeightBefore:pair.before.nativeLegOwnership?.originalSourceWeight??null,
     originalSourceClipWeightAfter:pair.after.nativeLegOwnership?.originalSourceWeight??null,
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
  // Optional REAL original source skin after the bounded visual correction.
  // Never claim a foot plant or IK from a reduced shoe displacement.
  const nativeLeg=actor.nativeLegOwnership;
  // Native imported chest may counterturn only under original Walking_A
  // locomotion; a genuine result cannot change authoritative facing/feet.
  const torsoTurn=nativeLeg?.originalWalkingTorsoCounterturnRad??0;
  expect(Number.isFinite(torsoTurn)).toBe(true);
  expect(Math.abs(torsoTurn)).toBeLessThanOrEqual(.120001);
  expect(nativeLeg?.originalWalkingTorsoCounterturnPeakRad??0).toBeLessThanOrEqual(.120001);
  if(Math.abs(torsoTurn)>.0001){
   expect(actor.mode).toBe('move');
   expect(nativeLeg.clipName).toBe('Walking_A');
   expect(nativeLeg.originalWalkingTorsoCounterturnFrames).toBeGreaterThan(0);
  }
  // Never infer a planted foot from a prior toe-lift angle: the final
  // original-GLB frame must report a same-clone weighted toe and opposite
  // shoe witness for any ankle-continuity hold actually displayed.
  expect(Number.isInteger(nativeLeg?.sourceSwingToeContinuityFrames)).toBe(true);
  expect(nativeLeg.sourceSwingToeContinuityFrames).toBeGreaterThanOrEqual(0);
  expect(nativeLeg.sourceSwingToeContinuityFrames).toBeLessThanOrEqual(1000000);
  if(nativeLeg?.sourceSwingToeLiftProof?.continuityHold){
   expect(nativeLeg.sourceSwingToeContinuityFrames).toBeGreaterThan(0);
   expect(nativeLeg.sourceSwingToeLiftProof.source)
    .toBe('same-original-GLB-foot-skinned-vertices');
   expect(nativeLeg.sourceSwingToeLiftProof.continuitySource)
    .toBe('same-original-GLB-weighted-swing-ankle-continuation');
   expect(nativeLeg.sourceSwingToeLiftProof.originalOppositeShoeVerified).toBe(true);
   expect(nativeLeg.sourceSwingToeLiftProof.contactLocked).toBe(false);
   expect(nativeLeg.sourceSwingToeLiftProof.sourceClip).toBe('Walking_A');
   expect(nativeLeg.sourceSwingToeLiftProof.liftMeters).toBeGreaterThan(.001);
  }
  // Read the *rendered* source-rig carry, not merely a unit planner result.
  // A previous witnessed 18mm pivot shift must retire over the next three
  // <=50ms frames, not silently accumulate or pop beyond the 18mm budget.
  const carried=nativeLeg?.sourceStanceSlideCarryMeters??0;
  expect(carried).toBeGreaterThanOrEqual(0);
  expect(carried).toBeLessThanOrEqual(.0180001);
  expect(nativeLeg?.sourceStanceSlideCarryPeakMeters??0).toBeLessThanOrEqual(.0180001);
  if((nativeLeg?.sourceStanceSlideCarryFrames??0)>0)
   expect(nativeLeg.sourceStanceSlideCarryPeakMeters).toBeGreaterThan(0);
  const skid=nativeLeg?.sourceStanceSlideReliefProof;
  if(skid){
   expect(skid.sourceInstanceId).toBe(actor.sourceInstanceId);
   expect(skid.sourceClip).toBe('Walking_A');
   expect(skid.verifiedBy).toBe('final-original-weighted-skinned-two-shoe-readback');
   expect(skid.contactLocked).toBe(false);
   expect(skid.otherShoeProjectedSpanDeltaMeters).toBeLessThanOrEqual(.0360001);
   if(skid.otherShoeProjectedSpanDeltaMeters>.025||
    skid.otherShoeMinimumProjectedSpanMeters<.11){
    expect(skid.oppositeOriginalSwingHeelVerified).toBe(true);
    expect(skid.sourceYawChangeRadians).toBeLessThanOrEqual(.080001);
   }
   expect(skid.reductionMeters).toBeGreaterThanOrEqual(.004);
   expect(skid.reductionMeters).toBeLessThanOrEqual(.0180001);
   expect(skid.witnessedRootTravelMeters).toBeGreaterThanOrEqual(.015);
   expect(skid.witnessedRootTravelMeters).toBeLessThanOrEqual(.18);
   expect(skid.witnessedRootTravelAgeSeconds).toBeGreaterThanOrEqual(0);
   expect(skid.witnessedRootTravelAgeSeconds).toBeLessThanOrEqual(.18);
   expect(skid.reductionMeters).toBeLessThanOrEqual(.55*skid.witnessedRootTravelMeters+.000001);
   expect(skid.beforeHeelTravelMeters-skid.afterHeelTravelMeters).toBeGreaterThan(.00399);
   expect(skid.beforeToeTravelMeters-skid.afterToeTravelMeters).toBeGreaterThan(.00399);
   expect(Math.hypot(skid.worldDeltaX,skid.worldDeltaZ)).toBeLessThanOrEqual(.0180001);
  }

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
  // At actual 390px frame 86->87 a stationary SINGLE weighted left sole
  // vertex looked planted, yet its licensed HEEL was airborne. Compare that
  // exact same-clone rendered pair against BOTH skinned outsole endpoints.
  const correlated=reconcileOriginalSourceContactWitness(stanceWindow,sourcePatch,{
   sameOriginalActor:Boolean(actor.sourceInstanceId&&
    actor.sourceInstanceId===sameTickActor?.sourceInstanceId),
   sameFramePair:afterFrame===beforeFrame+1,
   sourceClipName:actor.nativeLegOwnership?.clipName??''
  });
  expect(correlated?.ikAccepted??false).toBe(false);
  expect(correlated?.provenFootPlant??false).toBe(false);
  sourcePatchWindows.push({tick:snap.tick,beforeFrame,afterFrame,
   measurement:sourcePatch,correlatedSourceContact:correlated,
   singleVertexOnlySides:correlated?.singleVertexOnlySides??[],
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
 await test.info().attach('original-source-walking-torso-turn-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'real-original-GLB-spine-sharp-travel-counterturn',
   authoritativeFacingUnchanged:true,sourceFootPlantClaimed:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    clip:t.nativeLegOwnership?.clipName,
    spineOffsetRad:t.nativeLegOwnership?.originalWalkingTorsoCounterturnRad??0,
    acceptedFrames:t.nativeLegOwnership?.originalWalkingTorsoCounterturnFrames??0,
    peakRad:t.nativeLegOwnership?.originalWalkingTorsoCounterturnPeakRad??0,
    grip:t.sourceWeaponGrip??null}))},null,2))
 });
 await test.info().attach('original-source-measured-stance-slide-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'same-original-GLB-weighted-two-point-stance',
   claimedFootLock:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    cumulative:t.nativeLegOwnership?.sourceStanceSlideReliefFrames??0,
    finalReadback:t.nativeLegOwnership?.sourceStanceSlideReliefProof??null,
    currentOriginalSoles:t.sourceSolePatchWorld??null}))},null,2))
 });
 // The optional original loaded-pelvis proof is captured only after actual
 // source leg overlays. This is never a manufactured foot plant or IK pass.
 await test.info().attach('original-source-loaded-pelvis-foot-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'same-original-skinned-source-rig',
   claimedFootLock:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    liftMeters:t.nativeLegOwnership?.sourceLoadedPelvisLiftMeters??0,
    cumulative:t.nativeLegOwnership?.sourceLoadedPelvisAcceptedFrames??0,
    rollbackFrames:t.nativeLegOwnership?.sourceLoadedPelvisRollbackFrames??0,
    rollbackFootProof:t.nativeLegOwnership?.sourceLoadedPelvisRollbackFootProof??null,
    finalSourceFootProof:t.nativeLegOwnership?.sourceLoadedPelvisFrameProof??null}))},null,2))
 });
 await test.info().attach('original-source-loaded-knee-two-shoe-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'licensed-Walking_A-original-lowerleg',
   claimedFootLock:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    cumulative:t.nativeLegOwnership?.sourceStanceKneeSupportFrames??0,
    probes:t.nativeLegOwnership?.sourceStanceKneeProbeOutcomes??null,
    proofs:t.nativeLegOwnership?.sourceStanceKneeCurrentFrameProofs??null}))},null,2))
 });
 // Independently measured original imported source transition: neither a
 // unit fixture nor a proposed planted sole proves a playable fade.
 // When the actual desktop/mobile nine-tick GLB witnesses an accelerated
 // move, require genuine travel, source identity and both original legs.
 await test.info().attach('original-source-full-skeleton-travel-fade',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'actual-source-GLB-corrective-crossfade-never-an-authority-step',
   frames:trace.map(t=>({tick:t.tick,
    sourceClip:t.nativeLegOwnership?.clipName??null,
    sourceWeight:t.nativeLegOwnership?.originalSourceWeight??null,
    fade:t.nativeLegOwnership?.originalRealTravelFade??null}))},null,2))
 });
 for(const frame of trace){
  const fade=frame.nativeLegOwnership?.originalRealTravelFade;
  if(!fade)continue;
  expect(fade.syntheticContact).toBe(false);
  expect(fade.contactLocked).toBe(false);
  expect([.09,.12,.23]).toContain(fade.seconds);
  if(fade.reason==='interrupted-source-switch'){
   expect(fade.seconds).toBe(.09);
   expect(fade.interrupted).toBe(true);
  }else if(fade.seconds===.09){
   expect(fade.reason).toBe('sparse-original-travel');
   expect(fade.interrupted).toBe(false);
   expect(fade.sourceClipName).toBe('Walking_A');
   expect(['Idle','Guard'].includes(fade.previousSourceClipName)).toBe(true);
   expect(fade.witnessedRootMovement).toBe(true);
   expect(fade.rootTravelMeters).toBeGreaterThanOrEqual(.24);
   expect(fade.rootTravelMeters).toBeLessThanOrEqual(.54);
   expect(fade.frameIntervalSeconds).toBeGreaterThanOrEqual(.24);
   const witnessedLongSourceFrame=fade.frameIntervalSeconds>1.2;
   expect(fade.frameIntervalSeconds).toBeLessThanOrEqual(
    witnessedLongSourceFrame?1.9:1.2);
   if(witnessedLongSourceFrame){
    expect(fade.rootTravelMeters).toBeGreaterThanOrEqual(.42);
    expect(fade.rootTravelMeters/fade.frameIntervalSeconds).toBeGreaterThanOrEqual(.23);
    expect(fade.rootTravelMeters/fade.frameIntervalSeconds).toBeLessThanOrEqual(.5);
   }else{
    expect(fade.rootTravelMeters/fade.frameIntervalSeconds).toBeGreaterThanOrEqual(.25);
    expect(fade.rootTravelMeters/fade.frameIntervalSeconds).toBeLessThanOrEqual(2.5);
   }
  }else if(fade.seconds===.23){
   expect(fade.reason).toBe('ordinary-source-transition');
   expect(fade.interrupted).toBe(false);
  }
  if(fade.seconds===.12){
   expect(fade.reason).toBe('witnessed-original-travel');
   expect(fade.interrupted).toBe(false);
   expect(fade.sourceClipName).toBe('Walking_A');
   expect(typeof fade.previousSourceClipName==='string'&&fade.previousSourceClipName.length>0).toBe(true);
   expect(fade.witnessedRootMovement).toBe(true);
   expect(fade.rootTravelMeters).toBeGreaterThanOrEqual(.012);
   expect(fade.rootTravelMeters).toBeLessThanOrEqual(.24);
   expect(fade.frameIntervalSeconds).toBeGreaterThanOrEqual(.008);
   expect(fade.frameIntervalSeconds).toBeLessThanOrEqual(.24);
  }
 }
 // Genuine original-GLB linked leg trial is a FULL chain, not an
 // isolated rotating toe or guessed contact. All accepted real-frame
 // proofs must preserve the untouched source-weighted opposite shoe.
 await test.info().attach('original-source-linked-hip-knee-dual-shoe',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'real-licensed-Walking_A-original-skinned-both-shoes',
   plantedFootCertified:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    acceptedFrames:t.nativeLegOwnership?.sourceSwingLinkedAcceptedFrames??0,
    probeFrames:t.nativeLegOwnership?.sourceSwingLinkedProbeFrames??0,
    measuredTrial:t.nativeLegOwnership?.sourceSwingLinkedLastProbe??null,
    proofs:t.nativeLegOwnership?.sourceSwingLinkedCurrentFrameProofs??null,
    skinnedShoes:t.sourceSolePatchWorld??null}))},null,2))
 });

 // The three-joint licensed Idle/Walking_A escape was previously excluded
 // for an actual 57.8mm buried source toe by a 60mm threshold. Preserve
 // BOTH the attempted genuine source probes and any independently skinned
 // accepted final frame. Zero acceptances are a FAIL-CLOSED candidate,
 // never reported as a successful new foot plant.
 const originalNeutralFrames=trace.map(t=>({
  tick:t.tick,sourceId:t.sourceId,
  sourceClip:t.nativeLegOwnership?.clipName??null,
  attempted:t.nativeLegOwnership?.sourceNeutralSwingLastProbe??null,
  gate:t.nativeLegOwnership?.sourceNeutralSwingGateLast??null,
  acceptedFrames:t.nativeLegOwnership?.sourceNeutralSwingAcceptedFrames??0,
  independentFinal:t.nativeLegOwnership?.sourceNeutralSwingCurrentFrameProofs??null,
  skinnedShoe:t.sourceSolePatchWorld??null
 }));
 let actualNeutralProofs=0;
 for(const frame of trace){
  const gate=frame.nativeLegOwnership?.sourceNeutralSwingGateLast;
  if(gate?.reason==='licensed-idle-trials-angle-certified'){
   expect(gate.verifiedIdleJointTracks).toHaveLength(3);
   expect(gate.originalSourceJointGapRad).toHaveLength(3);
   expect(gate.sampleBlends).toHaveLength(2);
   for(const b of gate.sampleBlends)for(const angle of gate.originalSourceJointGapRad)
    expect(b*angle).toBeLessThanOrEqual(.260001);
   for(const t of gate.verifiedIdleJointTracks){
    expect(['footr','footl'].includes(t.bone?.toLowerCase())||
     /(?:leg|thigh|calf|foot)/i.test(t.bone)).toBe(true);
    expect(t.sourceTrackMatches).toBeGreaterThanOrEqual(1);
    expect(t.sourceTrackMatches).toBeLessThanOrEqual(4);
    expect(t.equivalentDuplicate).toBe(t.sourceTrackMatches>1);
    expect(t.sourceKeyframeCount).toBeGreaterThanOrEqual(1);
    expect(t.sourceKeyframeCount).toBeLessThanOrEqual(512);
    expect(t.sourceTrackNames).toHaveLength(t.sourceTrackMatches);
   }
  }
  if(gate?.reason==='original-idle-joint-rotation-budget'&&
     Array.isArray(gate.originalSourceJointGapRad)){
   // Previous source footage had a measured 1.8135rad knee gap, within
   // this strict bounded-sample window. Rejecting that source without TWO
   // measured original shoe trials would repeat the old blocking defect.
   const largest=Math.max(...gate.originalSourceJointGapRad);
   expect(largest>2.30||largest<1.10||
    (Math.min(.42,(.26-.002)/largest)<.12)).toBe(true);
  }
  if(gate?.reason==='licensed-idle-joint-track-not-proven'){
   expect(gate.sourceTrackReason).toMatch(/original-idle-joint|original-idle-track|original-idle/);
   expect(gate.sourceTrackMatches).toBeGreaterThanOrEqual(0);
  }
 }
 for(const frame of trace)for(const side of ['left','right']){
  const p=frame.nativeLegOwnership?.sourceNeutralSwingCurrentFrameProofs?.[side];
  if(!p)continue;
  actualNeutralProofs++;
  const other=side==='left'?'right':'left';
  expect(p.sourceInstanceId).toBe(frame.sourceId);
  expect(p.sourceClip).toBe('Walking_A');
  expect(p.neutralClip).toBe('Idle');
  expect(p.sourceProbeCount).toBe(4);
  expect(p.sourceBoundedJointCount).toBe(3);
  expect(p.finalIndependentSourceSkin).toBe(true);
  expect(p.originalOppositeShoeVerified).toBe(true);
  expect(p.contactLocked).toBe(false);
  expect(p.sourceToeLiftMeters).toBeGreaterThanOrEqual(.017999);
  expect(p.originalPitchGainMeters).toBeGreaterThanOrEqual(.008999);
  expect(p.maxJointDeltaRad).toBeLessThanOrEqual(.260001);
  const attempted=frame.nativeLegOwnership?.sourceNeutralSwingLastProbe;
  if(attempted?.sourceInstanceId===frame.sourceId&&attempted.side===side){
   expect(attempted.originalSourceJointGapRad).toHaveLength(3);
   expect(attempted.originalSourceJointGapRad.every(n=>Number.isFinite(n)&&n>=0)).toBe(true);
   expect(attempted.actuallyTestedNeutralBlends).toHaveLength(2);
   for(const blend of attempted.actuallyTestedNeutralBlends)
    for(const gap of attempted.originalSourceJointGapRad)
     expect(blend*gap).toBeLessThanOrEqual(.260001);
  }
  expect(Math.abs(p.after?.[other]?.heelY-p.before?.[other]?.heelY))
   .toBeLessThanOrEqual(.003001);
  expect(Math.abs(p.after?.[other]?.toeY-p.before?.[other]?.toeY))
   .toBeLessThanOrEqual(.003001);
 }
 await test.info().attach('original-license-source-neutral-sole-trials',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({
   viewport:view.name,source:'genuine original KayKit source Walking_A + Idle',
   actualNeutralProofs,claimedFootPlant:false,
   acceptance:actualNeutralProofs?
    'measured three-joint candidate; not full-gait or planted-foot acceptance':
    'unverified: no original Idle three-joint candidate certified in sampled film',
   originalNeutralFrames
  },null,2))
 });
 for(const frame of trace)for(const side of ['left','right']){
  const proof=frame.nativeLegOwnership?.sourceSwingLinkedCurrentFrameProofs?.[side];
  if(!proof)continue;
  expect(proof.sourceInstanceId).toBe(frame.sourceId);
  expect(proof.sourceClip).toBe('Walking_A');
  expect(proof.contactLocked).toBe(false);
  expect(proof.oppositeShoePreserved).toBe(true);
  // Genuine source-rig regression #14260128935, 390px tick 5:
  // a real 16.6ms first-fast Walking_A frame with 81.96mm buried toe
  // accepted +14.15mm toe lift but +31.18mm already-elevated heel rise.
  // This live WebGL gate catches that viewer-worse full-leg pose even if
  // the source planner chose a different four-sample sequence.
  const born=proof.before?.[side],displayed=proof.after?.[side];
  if(born&&displayed&&proof.linkedContinuity==='safe-first-source-frame'&&
   proof.witnessedSourceWeight>=.95&&
   proof.witnessedFrameIntervalSeconds>=.016&&
   proof.witnessedFrameIntervalSeconds<.05){
   const burial=-.02-born.toeY;
   const projection=Math.hypot(
    born.heelXZ[0]-born.toeXZ[0],born.heelXZ[1]-born.toeXZ[1]);
   const fullLength=Math.hypot(projection,born.heelY-born.toeY);
   const steep=burial>=.055&&burial<=.10&&
    born.heelY+.02>=.18&&
    projection>=.045&&projection<=.15&&
    fullLength>=.285&&fullLength<=.325;
   if(steep){
    expect(proof.sourceFirstSwingPitchProof,
     'real steep first-fast source must carry independent final dual-shoe pitch receipt')
     .toBeTruthy();
    const gain=(displayed.toeY-born.toeY)-(displayed.heelY-born.heelY);
    expect(gain>=-.002001||-.02-displayed.toeY<=.020001,
     'never worsen a still-buried toe relative to its original airborne heel')
     .toBe(true);
   }
  }
  // First-fast original linked knee/hip pitch certification is separate
  // from historical probe counts. It must be a genuine FINAL same-frame
  // weighted heel+toe measurement of BOTH original CC0 GLB shoes.
  if(proof.sourceFirstSwingPitchProof){
   const pitch=proof.sourceFirstSwingPitchProof,shoe=proof.after[side],
    old=proof.before[side];
   expect(pitch.source).toBe('verified-original-GLB-final-first-swing-pitch');
   expect(pitch.side).toBe(side);
   expect(pitch.sourceClip).toBe('Walking_A');
   expect(pitch.originalOppositeShoeVerified).toBe(true);
   expect(pitch.contactLocked).toBe(false);
   // Original first fast source pitch uses <=85/90mrad; a genuinely
   // skinned, independently certified slow (50-200ms) original gait may
   // use the bounded 105/110mrad knee-biased alternative. Verify actual
   // renderer ownership, not a source-only hypothetical gait assertion.
   const measuredSlow=proof.witnessedFrameIntervalSeconds>=.05&&
    proof.witnessedFrameIntervalSeconds<=.20&&
    proof.witnessedSourceWeight>=.95;
   expect(Math.abs(proof.upperRad)).toBeLessThanOrEqual(
    measuredSlow?.105001:.085001);
   expect(Math.abs(proof.lowerRad)).toBeLessThanOrEqual(
    measuredSlow?.110001:.090001);
   expect(pitch.sourceToeLiftMeters).toBeCloseTo(shoe.toeY-old.toeY,6);
   expect(pitch.sourceHeelRiseMeters).toBeCloseTo(shoe.heelY-old.heelY,6);
   expect(pitch.sourcePitchGainMeters).toBeCloseTo(
    pitch.sourceToeLiftMeters-pitch.sourceHeelRiseMeters,6);
   expect(pitch.sourcePitchGainMeters>=-.002001||
    -.02-shoe.toeY<=.020001).toBe(true);
  }
  expect(proof.witnessedFrameIntervalSeconds).toBeGreaterThanOrEqual(.008);
  expect(proof.witnessedFrameIntervalSeconds).toBeLessThanOrEqual(.240001);
  expect(proof.witnessedRootTravelAgeSeconds).toBeLessThanOrEqual(.150001);
  expect(proof.witnessedRootTravelMeters).toBeGreaterThanOrEqual(.008);
  expect(proof.liftMeters).toBeGreaterThanOrEqual(.012);
  expect(proof.fractionCleared).toBeGreaterThanOrEqual(.15);
  expect(proof.after?.[side]?.toeY).toBeGreaterThanOrEqual(
   proof.before?.[side]?.toeY+.011999);
  expect(Math.sign(proof.upperRad)).not.toBe(Math.sign(proof.lowerRad));
  expect(['safe-first-source-frame','same-certified-source-frame']).toContain(
   proof.linkedContinuity);
  if(proof.witnessedFrameIntervalSeconds<.05){
   const previouslyWitnessed=proof.linkedContinuity==='same-certified-source-frame';
   expect(Math.abs(proof.upperRad)).toBeLessThanOrEqual(
    previouslyWitnessed?.115001:.110001);
   expect(Math.abs(proof.lowerRad)).toBeLessThanOrEqual(
    previouslyWitnessed?.095001:.090001);
  }
  // The measured dual-shoe source frame sets its own fast/slow arc cap;
  // the original 33ms source-bound trial is NOT an unverified long-frame cue.
  // fully weighted original walking frame, never by inventing a foot plant.
  const extended=Math.abs(proof.upperRad)>.095001||
   Math.abs(proof.lowerRad)>.080001;
  if(extended){
   const slowSource=proof.witnessedFrameIntervalSeconds>=.05&&
    proof.witnessedSourceWeight>=.95;
   // A new 33ms original-rig frame may use at most 110/90mrad with actual
   // two-shoe proof; larger fast arcs need a certified prior frame.
   expect(Math.abs(proof.upperRad)).toBeLessThanOrEqual(
    slowSource?.145001:.115001);
   expect(Math.abs(proof.lowerRad)).toBeLessThanOrEqual(
    slowSource?.110001:.095001);
  }else{
   expect(Math.abs(proof.upperRad)).toBeLessThanOrEqual(.105001);
   expect(Math.abs(proof.lowerRad)).toBeLessThanOrEqual(.075001);
  }
  const opposite=side==='left'?'right':'left';
  for(const end of ['toe','heel']){
   expect(Math.abs(proof.after?.[opposite]?.[end+'Y']-
    proof.before?.[opposite]?.[end+'Y'])).toBeLessThanOrEqual(.003001);
  }
  // The WebGL renderer runs source toe and stance-slide stages AFTER the
  // linked-leg stage. An old precomposition proof must never be interpreted
  // as a final physical result. Compare actual displayed source skin here.
  for(const foot of ['left','right'])for(const tip of ['heel','toe']){
   const final=frame.sourceSolePatchWorld?.[foot]?.[tip];
   const predicted=proof.after?.[foot];
   expect(Array.isArray(final)&&final.length===3).toBe(true);
   expect(Math.abs(final[1]-predicted[tip==='heel'?'heelY':'toeY']))
    .toBeLessThan(.003);
  }
 }
 // Original upper-leg correction is a measured source-rig trial; never
 // promote a one-frame positive toe delta into a moving planted-foot claim.
 await test.info().attach('original-source-thigh-airborne-shoe-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'same-original-GLB-upperleg-weighted-both-shoes',
   claimedFootLock:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    cumulative:t.nativeLegOwnership?.sourceSwingThighAcceptedFrames??0,
    proofs:t.nativeLegOwnership?.sourceSwingThighCurrentFrameProofs??null,
    quietReleaseFrames:t.nativeLegOwnership?.sourceSwingThighEaseOutFrames??0,
    continuityHoldFrames:t.nativeLegOwnership?.sourceSwingThighHoldFrames??0,
    physicalAfterFrame:t.sourceSolePatchWorld??null}))},null,2))
 });
 for(const t of trace)for(const side of ['left','right']){
  const proof=t.nativeLegOwnership?.sourceSwingThighCurrentFrameProofs?.[side];
  if(!proof)continue;
  expect(proof.source).toBe('licensed-Walking_A-original-upperleg-dual-shoe');
  expect(proof.sourceInstanceId).toBe(t.sourceId);
  expect(proof.clipName).toBe('Walking_A');
  expect(proof.contactLocked).toBe(false);
  if(proof.continuityHold===true){
   // A previously witnessed joint must still improve the real buried toe
   // while independent original-source measurements preserve BOTH shoes.
   expect(proof.priorSupportedAngleRad).toBe(proof.angleRad);
   expect(proof.oppositeFootVerified).toBe(true);
   expect(proof.improvementMeters).toBeGreaterThanOrEqual(.001);
   expect(proof.improvementMeters).toBeLessThan(.040001);
   expect(proof.before?.[side]?.toeY).toBeLessThan(-.055);
   expect(proof.after?.[side]?.toeY).toBeGreaterThanOrEqual(
    proof.before?.[side]?.toeY+.000999);
   // If this frame ALSO carried an independently measured ankle/calf
   // correction, final same-source weighted toe/heel must reconcile
   // both joints instead of preserving a stale pre-thigh proof.
   const ankleAndThigh=t.nativeLegOwnership?.sourceSwingToeCurrentFrameProofs?.[side];
   if(ankleAndThigh?.combinedSourceThighVerified){
    expect(ankleAndThigh.combinedSourceThighKind).toBe('hold');
    expect(ankleAndThigh.sourceInstanceId).toBe(t.sourceId);
    expect(ankleAndThigh.contactLocked).toBe(false);
    expect(Math.abs(ankleAndThigh.afterToeY-proof.after?.[side]?.toeY)).toBeLessThan(.0015);
    expect(Math.abs(ankleAndThigh.afterHeelY-proof.after?.[side]?.heelY)).toBeLessThan(.0015);
   }
  }else if(proof.continuityRelease===true){
   // This is a proven same-source hip RELEASE, not a new >=4mm rescue.
   // Never certify foot contact or require fresh stone penetration here.
   expect(Math.abs(proof.priorSupportedAngleRad)).toBeGreaterThanOrEqual(.0449);
   expect(Math.abs(proof.angleRad-proof.priorSupportedAngleRad)).toBeLessThanOrEqual(.045001);
   expect(proof.oppositeFootVerified).toBe(true);
   expect(proof.improvementMeters).toBeGreaterThanOrEqual(0);
   expect(proof.improvementMeters).toBeLessThan(.004001);
   expect(proof.after?.[side]?.toeY).toBeGreaterThanOrEqual(
    proof.before?.[side]?.toeY-.001501);
  }else{
   expect(proof.improvementMeters).toBeGreaterThanOrEqual(.004);
   // Genuine original-GLB source thigh trials must purchase meaningful
   // clearance, not merely rotate an adult limb while its airborne toe
   // remains deeply beneath stone. This verifies the *actual* final
   // skinned toe in desktop and 390px Chromium, not a synthetic test pose.
   const burialBefore=-.02-proof.before?.[side]?.toeY;
   const burialAfter=-.02-proof.after?.[side]?.toeY;
   if(Number.isFinite(burialBefore)&&Number.isFinite(burialAfter)&&
    burialAfter>.025)
    expect(proof.improvementMeters+.000001).toBeGreaterThanOrEqual(
     burialBefore*.10);
  }
  expect(Math.abs(proof.angleRad)).toBeLessThanOrEqual(.135001);
  if(Math.abs(proof.angleRad)>.090001){
   expect(Math.abs(proof.priorSupportedAngleRad)).toBeGreaterThanOrEqual(.089);
   expect(Math.sign(proof.angleRad)).toBe(Math.sign(proof.priorSupportedAngleRad));
   expect(Math.abs(proof.angleRad-proof.priorSupportedAngleRad)).toBeLessThanOrEqual(.045001);
  }
  // A larger source thigh candidate is lawful ONLY for a severely buried
  // original weighted toe and must have a still-safe real opposite shoe.
  if(Math.abs(proof.angleRad)>.045001){
   if(proof.continuityHold===true){
    expect(proof.before?.[side]?.toeY).toBeLessThan(-.055);
    expect(proof.after?.[side]?.toeY).toBeGreaterThanOrEqual(
     proof.before?.[side]?.toeY+.000999);
   }else if(proof.continuityRelease!==true){
    expect(proof.before?.[side]?.toeY).toBeLessThan(-.045);
    expect(proof.after?.[side]?.toeY).toBeGreaterThan(proof.before?.[side]?.toeY+.004);
   }else{
    expect(proof.after?.[side]?.toeY).toBeGreaterThanOrEqual(
     proof.before?.[side]?.toeY-.001501);
   }
   const other=side==='left'?'right':'left';
   expect(Math.abs(proof.after?.[other]?.heelY-proof.before?.[other]?.heelY)).toBeLessThanOrEqual(.003001);
   expect(Math.abs(proof.after?.[other]?.toeY-proof.before?.[other]?.toeY)).toBeLessThanOrEqual(.003001);
  }
  expect(proof.sourceTrack).toMatch(/\.quaternion$/);
  // The actual final inspected skinned heel and toe must agree with the
  // saved on-frame candidate on the very same loaded original GLB instance.
  for(const foot of ['left','right'])for(const tip of ['heel','toe']){
   const final=t.sourceSolePatchWorld?.[foot]?.[tip];
   const predicted=proof.after?.[foot];
   expect(Array.isArray(final)&&final.length===3).toBe(true);
   expect(Math.abs(final[1]-predicted[tip==='heel'?'heelY':'toeY'])).toBeLessThan(.003);
  }
 }
 // Stance-shoe proof is a DISTINCT original skinned heel/toe measurement
 // from airborne toe correction. Its absence is reported, not converted into
 // a fake plant or a passing motion-quality claim.
 await test.info().attach('original-source-stance-shoe-frame-witness',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   source:'same-original-GLB-weighted-heel-toe',
   claimedFootLock:false,
   frames:trace.map(t=>({tick:t.tick,sourceId:t.sourceId,
    cumulative:t.nativeLegOwnership?.sourceStanceReliefFrames??0,
    probes:t.nativeLegOwnership?.sourceStanceProbeOutcomes??null,
    proofs:t.nativeLegOwnership?.sourceStanceSoleCurrentFrameProofs??null}))},null,2))
 });
 for(const t of trace){
  const n=t.nativeLegOwnership;
  const sourceLoaded=n?.sourceLoadedPelvisFrameProof;
  expect(n?.sourceLoadedPelvisLiftMeters??0).toBeLessThanOrEqual(.01601);
  const rollback=n?.sourceLoadedPelvisRollbackFootProof;
  if(rollback){
   expect(rollback.source).toBe('same-original-GLB-post-leg-pelvis-rollback');
   expect(rollback.sourceInstanceId).toBe(t.sourceId);
   expect(rollback.sourceClip).toBe('Walking_A');
   expect(rollback.originalLegsRestored).toBe(true);
   for(const k of ['rejectedHeelY','rejectedToeY','restoredHeelY','restoredToeY'])
    expect(Number.isFinite(rollback[k]),
     'actual original skinned heel/toe after all six imported joints return to source pose: '+k).toBe(true);
   expect(n?.sourceLoadedPelvisLiftMeters??0).toBe(0);
   expect(n?.sourceLoadedPelvisFrameProof??null).toBeNull();
   expect(typeof rollback.retryAttempted).toBe('boolean');
   expect(rollback.retryVerifiedStanceFeet??0).toBeLessThanOrEqual(2);
   if(rollback.retryAttempted){
    // The rejected raised source pelvis was restored first. The original
    // source legs may be independently re-staged at the legitimate root ONCE.
    for(const k of ['retryFinalHeelY','retryFinalToeY'])
     expect(Number.isFinite(rollback[k]),
      'actual same-original-GLB restored-root skinned shoe: '+k).toBe(true);
    expect(typeof rollback.retrySourceSolesSafe).toBe('boolean');
    const both=rollback.retryWholeSoleSafety;
    expect(both?.source).toBe('same-original-GLB-restored-root');
    expect(both?.contactLocked).toBe(false);
    if(rollback.retrySourceSolesSafe){
     expect(both?.verified).toBe(true);
     for(const side of ['left','right'])for(const edge of ['heelY','toeY']){
      expect(Number.isFinite(both?.before?.[side]?.[edge])).toBe(true);
      expect(Number.isFinite(both?.after?.[side]?.[edge])).toBe(true);
      const a=both.before[side][edge],z=both.after[side][edge];
      expect(z<-.024&&z<a-.004).toBe(false);
     }
    }
    if(rollback.retrySourceSolesSafe){
     const proved=Object.values(n?.sourceStanceSoleCurrentFrameProofs??{}).filter(Boolean);
     expect(rollback.retryVerifiedStanceFeet).toBe(proved.length);
     for(const proof of proved){
      expect(proof.sourceInstanceId).toBe(t.sourceId);
      expect(proof.afterWorstMeters).toBeLessThan(proof.beforeWorstMeters-.00149);
     }
    }else{
     expect(rollback.retryVerifiedStanceFeet).toBe(0);
     expect(n?.sourceSwingToeCorrectionsThisFrame??0).toBe(0);
     expect(n?.sourceSwingCalfTrialOutcome?.accepted??false).toBe(false);
     expect(n?.sourceSwingCalfAssistProof??null).toBeNull();
    }
   }else{
    expect(n?.sourceSwingToeCorrectionsThisFrame??0).toBe(0);
    expect(n?.sourceSwingCalfCurrentFrameMask??0).toBe(0);
    expect(n?.sourceSwingToeLiftProof??null).toBeNull();
    expect(n?.sourceSwingCalfAssistProof??null).toBeNull();
   }
  }
  if(sourceLoaded){
   expect(sourceLoaded.source).toBe('original-weighted-heel-toe-and-rendered-pelvis');
   expect(sourceLoaded.sourceInstanceId).toBe(t.sourceId);
   expect(sourceLoaded.sourceClip).toBe('Walking_A');
   expect(sourceLoaded.originalSourceContactLocked).toBe(false);
   expect(sourceLoaded.appliedLiftMeters).toBeGreaterThan(0);
   expect(sourceLoaded.appliedLiftMeters).toBeLessThanOrEqual(.01601);
   expect(sourceLoaded.finalHeelY).toBeGreaterThan(-.075);
   expect(sourceLoaded.finalToeY).toBeGreaterThan(-.075);
   // Both endpoints belong to the SAME final imported skinned source foot.
   // A clearing toe with a deeper loaded heel is a physical visual failure.
   expect(sourceLoaded.finalHeelY).toBeGreaterThanOrEqual(
    sourceLoaded.beforeHeelY-.00101);
   expect(sourceLoaded.finalToeY).toBeGreaterThanOrEqual(
    sourceLoaded.beforeToeY-.00101);
   expect(sourceLoaded.afterWorstMeters).toBeLessThan(sourceLoaded.beforeWorstMeters-.00149);
   expect(Math.max(Math.abs(sourceLoaded.finalHeelY-sourceLoaded.floorTopY),
    Math.abs(sourceLoaded.finalToeY-sourceLoaded.floorTopY)))
    .toBeCloseTo(sourceLoaded.afterWorstMeters,6);
  }
  const stance=Object.values(n?.sourceStanceSoleCurrentFrameProofs??{}).filter(Boolean);
  expect(stance.length).toBeLessThanOrEqual(2);
  // Authentic optional probes are NOT planted-sole certification.
  const actualChosenSoleXZ=pair=>Array.isArray(pair)&&pair.length===2&&
   pair.every(Number.isFinite);
  for(const [side,probe] of Object.entries(n?.sourceStanceProbeOutcomes??{})){
   if(!probe)continue;
   expect(['left','right']).toContain(side);
   expect(probe.source).toBe('same-original-GLB-multiscale-ankle-probe');
   expect(probe.sourceInstanceId).toBe(t.sourceId);
   expect(probe.sourceClip).toBe('Walking_A');
   expect(probe.side).toBe(side);
   expect(probe.trials.length).toBeLessThanOrEqual(4);
   expect(probe.trials.every(p=>Number.isFinite(p.signed)&&
    Number.isFinite(p.heel)&&Number.isFinite(p.toe))).toBe(true);
   expect((probe.appliedCandidates??[]).length).toBeLessThanOrEqual(2);
   if(probe.status==='accepted'){
    const sourceProof=stance.find(p=>p.side===side);
    expect(sourceProof).toBeTruthy();
    expect(probe.finalWorstMeters).toBeLessThan(probe.beforeWorstMeters-.00149);
    expect(probe.fineFallbackUsed).toBe(sourceProof.fineFallbackUsed);
    const actuallyChosen=probe.appliedCandidates?.[probe.selectedMeasuredIndex];
    expect(actuallyChosen).toBeTruthy();
    expect(actuallyChosen.delta).toBeCloseTo(sourceProof.appliedAngleRad,6);
    expect(actuallyChosen.heelY).toBeCloseTo(sourceProof.afterHeelY,6);
    expect(actuallyChosen.toeY).toBeCloseTo(sourceProof.afterToeY,6);
    expect(sourceProof.heelShiftXZMeters).toBeLessThanOrEqual(.01801);
    expect(sourceProof.toeShiftXZMeters).toBeLessThanOrEqual(.01801);
    expect(sourceProof.heelShiftXZMeters).toBeGreaterThanOrEqual(0);
    expect(sourceProof.toeShiftXZMeters).toBeGreaterThanOrEqual(0);
    expect(actualChosenSoleXZ(actuallyChosen.heelXZ)).toBe(true);
    expect(actualChosenSoleXZ(actuallyChosen.toeXZ)).toBe(true);
    if(probe.fineFallbackUsed){
     expect(Math.abs(sourceProof.appliedAngleRad)).toBeCloseTo(.045,3);
     expect(probe.trials.some(trial=>
      Math.abs(trial.signed-sourceProof.appliedAngleRad)<.001)).toBe(true);
     expect(sourceProof.afterHeelY).toBeGreaterThanOrEqual(
      sourceProof.beforeHeelY-.00401);
     expect(sourceProof.afterToeY).toBeGreaterThanOrEqual(
      sourceProof.beforeToeY-.00401);
     // This is source-shoe *clearance*, NOT a stationary plant certificate.
    }
   }
  }
  for(const proof of stance){
   expect(proof.source).toBe('same-original-GLB-two-point-stanced-shoe');
   expect(proof.sourceInstanceId).toBe(t.sourceId);
   expect(proof.sourceClip).toBe('Walking_A');
   expect(proof.afterWorstMeters).toBeLessThan(proof.beforeWorstMeters-.00149);
   expect(Math.abs(proof.appliedAngleRad)).toBeLessThanOrEqual(.14001);
   expect(Number.isFinite(proof.previousCorrectionRad)).toBe(true);
   expect(Math.abs(proof.appliedAngleRad-proof.previousCorrectionRad))
    .toBeLessThanOrEqual(.04501);
   if(Math.abs(proof.previousCorrectionRad)>.001)
    expect(Math.sign(proof.appliedAngleRad)).toBe(Math.sign(proof.previousCorrectionRad));
   expect(proof.afterToeY).toBeGreaterThanOrEqual(-.055);
   expect(proof.afterHeelY).toBeGreaterThanOrEqual(-.055);
   expect(proof.afterToeY).toBeGreaterThanOrEqual(proof.beforeToeY-.00401);
   expect(proof.afterHeelY).toBeGreaterThanOrEqual(proof.beforeHeelY-.00401);
  }
  // Original source-knee loaded-shoe assistance is separate from both the
  // airborne calf and the loaded ankle. Only a SAME-INSTANCE skinned receipt
  // with independently improved heel and toe can count as an accepted pose.
  // One frame is not a world-space planted foot or a completed gait review.
  const knee=Object.values(n?.sourceStanceKneeCurrentFrameProofs??{}).filter(Boolean);
  expect(knee.length).toBeLessThanOrEqual(2);
  for(const proof of knee){
   expect(proof.source).toBe('same-original-GLB-loaded-knee-two-shoe');
   expect(proof.sourceInstanceId).toBe(t.sourceId);
   expect(proof.sourceClip).toBe('Walking_A');
   expect(['left','right']).toContain(proof.side);
   expect(proof.feetVerified).toBe(2);
   expect(proof.contactLocked).toBe(false);
   expect(Math.abs(proof.delta)).toBeCloseTo(.045,3);
   expect(proof.improvementMeters).toBeGreaterThanOrEqual(.00149);
   expect(proof.afterWorst).toBeLessThan(proof.beforeWorst-.00149);
   expect(proof.afterToeY).toBeGreaterThanOrEqual(proof.beforeToeY-.00401);
   expect(proof.afterHeelY).toBeGreaterThanOrEqual(proof.beforeHeelY-.00401);
   const trial=n?.sourceStanceKneeProbeOutcomes?.[proof.side];
   expect(trial?.accepted).toBe(true);
   expect(trial?.sourceInstanceId).toBe(t.sourceId);
   expect(trial?.trials?.length).toBe(2);
   expect(trial?.sourceKneeBone).toBe(proof.sourceKneeBone);
   expect(trial?.hingeAlignment).toBeGreaterThan(0);
   expect(trial?.bindLengths?.upperLength).toBeGreaterThan(0);
   expect(trial?.bindLengths?.lowerLength).toBeGreaterThan(0);
  }
  for(const probe of Object.values(n?.sourceStanceKneeProbeOutcomes??{}).filter(Boolean)){
   expect(probe.source).toBe('licensed-Walking_A-lowerleg-two-shoe-trials');
   expect(probe.sourceInstanceId).toBe(t.sourceId);
   expect(probe.sourceClip).toBe('Walking_A');
   expect(probe.contactLocked).toBe(false);
   expect(probe.trials.length).toBeLessThanOrEqual(2);
  }
  const current=Object.values(n?.sourceSwingToeCurrentFrameProofs??{}).filter(Boolean);
  expect(n?.sourceSwingToeCorrectionsThisFrame??0).toBe(current.length);
  expect(current.length).toBeLessThanOrEqual(2);
  // The genuine same-frame imported sole witness must report a *per-frame*
  // source ankle rotation, not mislabel a cumulative original-clip overlay
  // as a sudden 186mrad 60Hz toe snap. Certified sole contact is NOT implied.
  for(const ankle of current){
   if(ankle.continuityHold)continue;
   expect(Number.isFinite(ankle.sourceAnkleStepRad)).toBe(true);
   expect(Number.isFinite(ankle.sourceAnkleFrameLimitRad)).toBe(true);
   expect(ankle.sourceAnkleStepRad).toBeGreaterThanOrEqual(0);
   expect(ankle.sourceAnkleStepRad).toBeLessThanOrEqual(
    ankle.sourceAnkleFrameLimitRad+.000001);
   expect(ankle.sourceAnkleFrameLimitRad).toBeLessThanOrEqual(.160001);
   expect(ankle.frameAwareSwingUsed).toBe(
    ankle.sourceAnkleStepRad>.080001,
    'only a genuinely slow new original toe step earns the sparse-frame label');
   if(ankle.frameAwareSwingUsed){
    expect(ankle.visibleFrameIntervalSeconds).toBeGreaterThan(.016);
    expect(ankle.sourceWeight).toBeGreaterThanOrEqual(.9);
    expect(ankle.penetrationBeforeMeters).toBeGreaterThanOrEqual(.045);
    // The genuine 390px 33.3ms deeply submerged original toe may now
    // receive 120mrad, never a free 60Hz snap or a fake stance plant.
    // The actual imported heel/toe and opposite shoe remain checked.
    if(ankle.visibleFrameIntervalSeconds<=.05)
     expect(ankle.sourceAnkleFrameLimitRad).toBeLessThanOrEqual(.120001);
   }
  }

  const calfMask=n?.sourceSwingCalfCurrentFrameMask??0;
  expect(Number.isInteger(calfMask)&&calfMask>=0&&calfMask<=3).toBe(true);
  // Historical calf measurements cannot represent unobserved new motion.
  const calfProof=n?.sourceSwingCalfAssistProof;
  if(calfProof){
   expect(calfProof.source).toBe('same-original-connected-GLB-calf-and-skinned-toe');
   expect(calfProof.sourceInstanceId).toBe(t.sourceId);
   expect(calfProof.sourceClip).toBe('Walking_A');
   // One true 390px source knee trial lifted 5.696mm at .2rad; the\n   // connected .06rad/frame result may start as an independently measured\n   // ~1mm step. The source heel remains independently validated below.\n   expect(calfProof.afterToeY-calfProof.beforeToeY).toBeGreaterThan(.000999);
   // A real original calf bend is a viewer-facing joint performance. It
   // cannot claim a useful correction by moving 1.94mm while an airborne
   // source toe remains 36mm inside the stone (prior genuine desktop WebGL).
   const beforeDepth=Math.max(0,-.02-calfProof.beforeToeY);
   const afterDepth=Math.max(0,-.02-calfProof.afterToeY);
   if(beforeDepth>.035&&afterDepth>.025)
    expect(calfProof.afterToeY-calfProof.beforeToeY)
     .toBeGreaterThanOrEqual(beforeDepth*.10-.000001);
   expect(calfProof.afterHeelY).toBeGreaterThan(-.02+.055);
   // This is a cumulative source-joint angle, NOT one frame of slew.
   // Each accepted mixer frame is bounded by 0.06rad and the imported
   // joint's existing lifetime angle limit is 0.18rad. The actual source
   // WebGL witnessed 0.177114rad on the corrected world-root ordering.
   expect(Math.abs(calfProof.appliedAngleRad)).toBeLessThanOrEqual(.18001);
  }
  for(const proof of current){
   // A historical ankle receipt cannot become a new "planted foot". The
   // final same-source readback is required for a linked original hip/knee
   // escalation; neither stage can invent a different loaded shoe.
   expect(proof.originalOppositeShoeVerified).toBe(true);
   expect(proof.contactLocked).toBe(false);
   if(proof.linkedOriginalSourceJointProof===true){
    const linked=n?.sourceSwingLinkedCurrentFrameProofs?.[proof.side];
    expect(linked?.sourceAnkleEscalationVerified).toBe(true);
    expect(linked?.sourceInstanceId).toBe(t.sourceId);
    expect(linked?.sourceClip).toBe('Walking_A');
    expect(linked?.oppositeShoePreserved).toBe(true);
    expect(proof?.originalAnkleLiftMeters).toBeGreaterThanOrEqual(.005);
    expect(proof?.linkedLegAddedLiftMeters).toBeGreaterThanOrEqual(.012);
    expect(proof?.afterToeY).toBeCloseTo(linked.after[proof.side].toeY,4);
    expect(proof?.afterHeelY).toBeCloseTo(linked.after[proof.side].heelY,4);
    expect(proof?.liftMeters).toBeCloseTo(
     proof.afterToeY-proof.beforeToeY,4);
    expect(linked.after[proof.side].toeY).toBeGreaterThan(
     linked.before[proof.side].toeY+.01199);
   }
   expect(proof?.source).toBe('same-original-GLB-foot-skinned-vertices');
   expect(proof?.side).toMatch(/^(left|right)$/);
   expect(proof?.sourceClip).toBe('Walking_A');
   expect(proof?.sourceInstanceId).toBe(t.sourceId);
   expect(proof?.liftMeters).toBeGreaterThan(.001);
   // f235c439 actual 390px original source ankle bent 80mrad yet cleared
   // only 9.261mm of a 106.835mm burial, leaving 97.573mm in stone.
   // A measured source toe moving upward is NOT proof of useful clearance.
   // Deep still-buried source shoes must now earn >=10mm AND >=10% depth
   // before an ankle or continuation can own the displayed full-body pose.
   const originalBurial=Math.max(0,-.02-proof.beforeToeY);
   const remainingBurial=Math.max(0,-.02-proof.afterToeY);
   if(originalBurial>.055&&remainingBurial>.025){
    expect(proof.afterToeY-proof.beforeToeY).toBeGreaterThanOrEqual(
     Math.max(.010,originalBurial*.10)-.000001);
   }
   expect(proof?.afterToeY).toBeGreaterThan(proof?.beforeToeY);
   expect(proof?.afterHeelY).toBeGreaterThan(-.02+.045);
   // Verified ±0.2 source ankle trials allow ≤0.22rad at ≤0.08rad/frame.
   expect(Math.abs(proof?.appliedAngleRad)).toBeLessThanOrEqual(.221);
   const beforeDepth=Math.max(0,proof.floorTopY-proof.beforeToeY);
   const afterDepth=Math.max(0,proof.floorTopY-proof.afterToeY);
   // Early original-source swing is allowed from >10mm penetration.
   expect(beforeDepth).toBeGreaterThan(.01);
   expect(proof.earlySourceToeRescue).toBe(beforeDepth<.025);
   expect(proof.penetrationBeforeMeters).toBeCloseTo(beforeDepth,6);
   expect(proof.penetrationAfterMeters).toBeCloseTo(afterDepth,6);
   expect(afterDepth).toBeLessThan(beforeDepth-.001);
  }
 }

 // New LAST original toe-knuckle presentation is optional: it may exist
 // only when both SOURCE weighted shoes make the physically safe trial.
 // If zero is accepted, report the failure to witness rather than claiming
 // foot planting or viewer-visible toe-clearance improvement.
 const toeJointTrace=trace.map(t=>({
  tick:t.tick,sourceId:t.sourceId,
  clip:t.nativeLegOwnership?.clipName,
  weight:t.nativeLegOwnership?.originalSourceWeight,
  cumulative:t.nativeLegOwnership?.sourceToeJointAcceptedFrames??0,
  originalTwoShoeProof:t.nativeLegOwnership?.sourceToeJointCurrentFrameProofs??null,
  originalSourceGate:t.nativeLegOwnership?.sourceToeJointGateLast??null,
  boundedGateCounts:t.nativeLegOwnership?.sourceToeJointGateCounts??null,
  adaptiveOriginalSourceToeTrials:t.nativeLegOwnership?.sourceToeJointAdaptiveTrialLast??null,
  adaptiveOriginalSourceToeProbeFrames:t.nativeLegOwnership?.sourceToeJointAdaptiveProbeFrames??0,
  originalWeightedFeet:t.sourceSolePatchWorld??null
 }));
 // A genuinely displayed original walking source pose must explicitly
 // classify both toe sides; no eligible trial remains an honest rejection.
 // These witnesses never certify foot contact or a visual improvement.
 for(const sample of toeJointTrace.filter(t=>t.clip==='Walking_A')){
  expect(sample.originalSourceGate).toBeTruthy();
  for(const side of ['left','right']){
   expect(typeof sample.originalSourceGate[side]).toBe('string');
   expect(sample.originalSourceGate[side].length).toBeGreaterThan(3);
  }
  expect(Object.values(sample.boundedGateCounts??{}).every(v=>
   Number.isInteger(v)&&v>=0&&v<=1000000)).toBe(true);
 }
 for(const t of trace)for(const side of ['left','right']){
  const proof=t.nativeLegOwnership?.sourceToeJointCurrentFrameProofs?.[side];
  if(!proof)continue;
  const linkedToeFinish=proof.source==='licensed-original-linked-Walking_A-toes-hinge';
  expect(proof.source).toBe(linkedToeFinish?
   'licensed-original-linked-Walking_A-toes-hinge':
   'licensed-original-Walking_A-toes-hinge');
  expect(proof.sourceInstanceId).toBe(t.sourceId);
  expect(proof.sourceBone.toLowerCase()).toBe(side==='left'?'toesl':'toesr');
  expect(proof.sourceTrack.toLowerCase().endsWith(proof.sourceBone.toLowerCase()+'.quaternion')).toBe(true);
  expect(proof.oppositeFootVerified).toBe(true);
  expect(proof.originalSourceContactLocked).toBe(false);
  expect(t.nativeLegOwnership?.sourceToeJointGateLast?.[side]).toBe(
   linkedToeFinish?'accepted-linked-original-toe-finisher':'accepted-original-source-toe-lift');
  // A fourth, larger source-toes trial may be selected ONLY on a genuine
  // original full-weight moving frame after both original 100mrad probes
  // failed. Match its SAME real source clone and actual two-shoe readback,
  // rather than assuming an extended hinge is a planted foot.
  const adaptive=t.nativeLegOwnership?.sourceToeJointAdaptiveTrialLast;
  if(!linkedToeFinish&&Math.abs(proof.angleRad)>.100001){
   expect(adaptive?.acceptedCandidate).toBe(true);
   expect(adaptive?.sourceInstanceId).toBe(t.sourceId);
   expect(adaptive?.sourceBone).toBe(proof.sourceBone);
   expect(adaptive?.trialCount).toBe(2);
   expect(adaptive?.contactLocked).toBe(false);
   expect(adaptive?.trials.map(v=>Math.abs(v.angleRad)))
    .toEqual([.14,.14]);
   expect(t.nativeLegOwnership?.sourceToeJointAdaptiveProbeFrames??0)
    .toBeGreaterThan(0);
  }
  expect(Math.abs(proof.angleRad)).toBeLessThanOrEqual(
   linkedToeFinish?.160001:.140001);
  expect(proof.liftMeters).toBeGreaterThanOrEqual(linkedToeFinish?.005:.004);
  if(linkedToeFinish){
   // A real connected-leg/toe joint must update the very same source
   // full-leg certificate with its FINAL weighted both-shoe result.
   const certified=t.nativeLegOwnership?.sourceSwingLinkedCurrentFrameProofs?.[side];
   expect(certified?.linkedOriginalToeFinisher?.sourceToeBone).toBe(proof.sourceBone);
   expect(certified?.linkedOriginalToeFinisher?.sourceToeTrack).toBe(proof.sourceTrack);
   expect(proof.linkedSourceRetained).toBe(true);
   expect(proof.contactLocked).toBe(false);
   const beforeBurial=-.02-proof.beforeToeY;
   if(proof.shallowSourceToeFinish){
    expect(beforeBurial).toBeGreaterThanOrEqual(.005999);
    expect(beforeBurial).toBeLessThan(.025001);
    expect(proof.liftMeters).toBeGreaterThanOrEqual(
     Math.max(.005,beforeBurial*.45)-.000001);
    expect(Math.max(0,-.02-proof.afterToeY)).toBeLessThanOrEqual(.008001);
    expect(Math.abs(proof.angleRad)).toBeLessThanOrEqual(.100001);
   }else{
    expect(beforeBurial).toBeGreaterThanOrEqual(.024999);
    expect(proof.liftMeters).toBeGreaterThanOrEqual(
     Math.max(.010,beforeBurial*.15)-.000001);
   }
  }
  expect(proof.liftMeters).toBeLessThanOrEqual(.040001);
  expect(proof.afterToeY).toBeGreaterThan(proof.beforeToeY);
  // A rare connected-leg finishing toe has NOT proved sole contact; reject
  // any source receipt with residual burial >8mm, weak improvement, or
  // an invented owner, even if ordinary toe tests were green.
  if(proof.connectedLegPartialFinish===true){
   expect(proof.originalSourceContactLocked).toBe(false);
   expect(proof.liftMeters).toBeGreaterThanOrEqual(.005);
   expect(proof.liftMeters/(-.02-proof.beforeToeY)).toBeGreaterThanOrEqual(.45);
   expect(proof.beforeToeY).toBeGreaterThan(-.045);
   expect(proof.beforeToeY).toBeLessThan(-.026);
   expect(proof.afterToeY).toBeGreaterThanOrEqual(-.028001);
   expect(proof.afterToeY).toBeLessThan(-.023);
  }
  // Only a genuinely measured >=15% relief justifies moving the source
  // knuckle if this toe remains >25mm buried in the original dungeon stone.
  // Previous real desktop 6.283mm / ~69mm did not earn this gate; it
  // represented an isolated 100mrad cosmetic toe bend, not real clearance.
  if(proof.afterToeY<-.045){
   const beforeBurial=-.02-proof.beforeToeY;
   expect(beforeBurial).toBeGreaterThan(.025);
   expect(proof.afterToeY-proof.beforeToeY).toBeGreaterThanOrEqual(
    beforeBurial*.15-.00001);
  }
  // Exact source toe residual in real mobile entry was 7.94mm below
  // the actual -20mm stone at 85.5% Walking_A blend. A new optional
  // partial-source toe-hinge receipt cannot claim a deep-stone rescue:
  // require both genuine source-skinned feet and nearly cleared shallow toe.
  if((t.nativeLegOwnership?.originalSourceWeight??0)<.90){
   expect(t.nativeLegOwnership.originalSourceWeight).toBeGreaterThanOrEqual(.82);
   expect(proof.beforeToeY).toBeGreaterThan(-.04501);
   expect(proof.beforeToeY).toBeLessThanOrEqual(-.026);
   expect(proof.afterToeY).toBeGreaterThanOrEqual(-.02301);
   expect(proof.afterToeY).toBeLessThanOrEqual(-.01199);
  }
  const opposite=side==='left'?'right':'left';
  const original=proof.before?.[opposite],after=proof.after?.[opposite];
  expect(original&&after,'both original source shoes must be attached').toBeTruthy();
  for(const y of ['heelY','toeY'])expect(Math.abs(after[y]-original[y])).toBeLessThanOrEqual(.002001);
  for(const p of ['heelXZ','toeXZ'])expect(Math.hypot(
   after[p][0]-original[p][0],after[p][1]-original[p][1]
  )).toBeLessThanOrEqual(.002001);
 }
 await test.info().attach('original-source-toes-hinge-airborne-proof',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   acceptedFrames:toeJointTrace.filter(t=>Object.values(t.originalTwoShoeProof??{}).some(Boolean)).length,
   onlyReadbackVerified:true,footPlantClaimed:false,
   limitation:'Zero accepted source-toes hinge probes means original source-foot clearance remains inconclusive, NOT improved.',
   frames:toeJointTrace},null,2))
 });
 // The connected ORIGINAL footl/footr hinge is a narrowly scoped
 // follow-on to a real linked upperleg+lowerleg two-shoe witness. The
 // source motion may reject EVERY attempt: zero accepted is INCONCLUSIVE,
 // never a fictitious perfect foot plant. If it does accept, every actual
 // WebGL frame must preserve the licensed bone, track and source skin.
 const originalFootFinishTrace=[];
 for(const frame of trace){
  const native=frame.nativeLegOwnership;
  for(const side of ['left','right']){
   const proof=native?.sourceLinkedFootCurrentFrameProofs?.[side];
   if(!proof)continue;
   const linked=native?.sourceSwingLinkedCurrentFrameProofs?.[side];
   expect(proof.source).toBe('licensed-original-linked-Walking_A-foot-hinge');
   expect(proof.sourceInstanceId).toBe(frame.sourceId);
   expect(proof.sourceBone.toLowerCase()).toBe('foot'+(side==='left'?'l':'r'));
   expect(proof.sourceTrack.toLowerCase().endsWith(
    proof.sourceBone.toLowerCase()+'.quaternion')).toBe(true);
   expect(proof.sourceAxis).toHaveLength(3);
   expect(proof.sourceAxis.every(Number.isFinite)).toBe(true);
   expect(['original-clip-track','original-bind-dorsiflexion',
    'original-weighted-outsole-swing','original-knee-chain-swing']).toContain(proof.sourceAxisKind);
   if(proof.sourceAxisKind==='original-bind-dorsiflexion'){
    expect(proof.sourceBindTransverseAudit?.source)
     .toBe('original-skeleton-inverse-bind-foot-dorsiflexion');
    expect(proof.sourceBindTransverseAudit?.contactLocked).toBe(false);
    expect(proof.sourceBindTransverseAudit?.axis).toHaveLength(3);
    for(let axis=0;axis<3;axis++)expect(proof.sourceAxis[axis])
     .toBeCloseTo(proof.sourceBindTransverseAudit.axis[axis],6);
   }
   if(proof.sourceAxisKind==='original-weighted-outsole-swing'){
    const measured=proof.sourceWeightedOutsoleAudit;
    expect(measured?.source)
     .toBe('source-weighted-outsole-world-to-original-foot-local');
    expect(measured?.contactLocked).toBe(false);
    expect(measured?.axis).toHaveLength(3);
    expect(measured?.horizontalSpanMeters).toBeGreaterThanOrEqual(.05);
    if(measured?.horizontalSpanMeters<.055){
     expect(measured?.steepSourceProjectionVerified).toBe(true);
     expect(measured?.fullSoleSpanMeters).toBeGreaterThanOrEqual(.295);
    }
    expect(measured?.fullSoleSpanMeters).toBeGreaterThanOrEqual(.24);
    for(let axis=0;axis<3;axis++)expect(proof.sourceAxis[axis])
     .toBeCloseTo(measured.axis[axis],6);
    expect(proof.sourceBindTransverseAudit).toBeNull();
   }
   if(proof.sourceAxisKind==='original-knee-chain-swing'){
    const knee=proof.sourceKneeChainAudit;
    expect(knee?.source).toBe('licensed-original-knee-plane-foot-local');
    expect(knee?.contactLocked).toBe(false);
    expect(knee?.soleKneeAlignment).toBeLessThanOrEqual(.400001);
    expect(knee?.sourceTrackAlignment).toBeLessThanOrEqual(.920001);
    expect(knee?.fullSoleSpanMeters).toBeGreaterThanOrEqual(.24);
    expect(knee?.axis).toHaveLength(3);
    for(let component=0;component<3;component++)
     expect(proof.sourceAxis[component]).toBeCloseTo(knee.axis[component],6);
   }
   // Stronger source ankle is legal only with an authentic long frame,
   // matching licensed hip+knee, exact same clone and both skinned soles.
   expect(Math.abs(proof.angleRad)).toBeLessThanOrEqual(
    proof.deepOriginalSwingArc===true?.240001:.120001);
   if(proof.deepOriginalSwingArc===true){
    expect(proof.sourceAxisKind).toBe('original-clip-track');
    expect(linked?.witnessedFrameIntervalSeconds).toBeGreaterThanOrEqual(.10);
    expect(linked?.witnessedSourceWeight).toBeGreaterThanOrEqual(.95);
    expect(proof.sourceInstanceId).toBe(frame.sourceId);
    expect(proof.liftMeters).toBeGreaterThanOrEqual(.018);
    expect(proof.liftMeters/(-.02-proof.beforeToeY)).toBeGreaterThanOrEqual(.22);
   }
   expect(proof.liftMeters).toBeGreaterThanOrEqual(.008);
   expect(proof.oppositeFootVerified).toBe(true);
   expect(proof.contactLocked).toBe(false);
   expect(proof.originalSourceContactLocked).toBe(false);
   expect(linked?.linkedOriginalFootFinisher?.sourceBone).toBe(proof.sourceBone);
   expect(linked?.afterToeY).toBeCloseTo(proof.after[side].toeY,6);
   const opposite=side==='left'?'right':'left';
   for(const edge of ['heelY','toeY'])
    expect(Math.abs(proof.after[opposite][edge]-
     proof.before[opposite][edge])).toBeLessThanOrEqual(.002001);
   for(const edge of ['heelXZ','toeXZ'])
    expect(Math.hypot(
     proof.after[opposite][edge][0]-proof.before[opposite][edge][0],
     proof.after[opposite][edge][1]-proof.before[opposite][edge][1]
    )).toBeLessThanOrEqual(.003001);
   originalFootFinishTrace.push({tick:frame.tick,side,
    sourceBone:proof.sourceBone,sourceTrack:proof.sourceTrack,
    angleRad:proof.angleRad,sourceAxisKind:proof.sourceAxisKind,
    sourceToeBeforeY:proof.beforeToeY,
    sourceToeAfterY:proof.afterToeY,
    liftMeters:proof.liftMeters,
    penetrationAfterMeters:Math.max(0,-.02-proof.afterToeY),
    linkedFinalToeY:linked.afterToeY,
    oppositeFootVerified:proof.oppositeFootVerified,
    contactLocked:proof.contactLocked});
  }
 }
 await test.info().attach('original-source-hip-knee-foot-finish',{
  contentType:'application/json',
  body:Buffer.from(JSON.stringify({viewport:view.name,
   acceptedFrames:originalFootFinishTrace.length,
   source:'real source Walking_A SkeletonUtils skinned both-shoe readback',
   status:originalFootFinishTrace.length?
    'source-linked ankle clearance measured; full foot planting unverified':
    'inconclusive: no foot-ankle finisher accepted by real source shoes',
   noInventedContacts:true,frames:originalFootFinishTrace},null,2))
 });
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
  correlatedOriginalSourcePairs:sourcePatchWindows.filter(w=>w.correlatedSourceContact).length,
  misleadingSingleVertexPlantCount:sourcePatchWindows.filter(w=>
   w.singleVertexOnlySides.length>0).length,
  corroboratedNotCertifiedContactCount:sourcePatchWindows.filter(w=>
   w.correlatedSourceContact?.corroboratedSides.length>0).length,
  aboveFloor:sourcePatchWindows.filter(w=>
   w.measurement.classification==='source-patches-above-floor').length,
  sourcePatchWindows,
  limitation:'Contact candidates only; no anatomical heel/toe proof, surface raycast, foot lock or tested IK.'};
 fs.writeFileSync('artifacts/dungeon-full-body-source-contact-patch-'+view.name+'.json',
  JSON.stringify(patchEvidence,null,2));
 await test.info().attach('source-GLB-floor-contact-patch',{
  contentType:'application/json',body:Buffer.from(JSON.stringify(patchEvidence,null,2))
 });
 // Only actual consecutive SAME-source original Walking_A skinned frames can
 // witness a genuine root pivot, an actual weighted source clip and bounded
 // imported-spine relief. Do not substitute made-up root turns or unit poses.
 const realOriginalTurns=rafWindows.flatMap(w=>w.pairs).filter(p=>{
  if(p.beforeMode!=='move'||p.afterMode!=='move'||
   p.sourceClipBefore!=='Walking_A'||p.sourceClipAfter!=='Walking_A'||
   !Number.isFinite(p.originalSourceClipWeightAfter)||
   p.originalSourceClipWeightAfter<.75||p.originalSourceClipWeightAfter>1.001||
   !Array.isArray(p.beforeRootWorld)||!Array.isArray(p.afterRootWorld)||
   !Number.isFinite(p.beforeRootYaw)||!Number.isFinite(p.afterRootYaw))return false;
  const yaw=Math.atan2(Math.sin(p.afterRootYaw-p.beforeRootYaw),
   Math.cos(p.afterRootYaw-p.beforeRootYaw));
  const move=Math.hypot(p.afterRootWorld[0]-p.beforeRootWorld[0],
   p.afterRootWorld[2]-p.beforeRootWorld[2]);
  return Math.abs(yaw)>.18&&Math.abs(yaw)<=.9&&move>=.015&&move<=.18;
 });
 const physicallyObservedCounterturns=realOriginalTurns.filter(p=>
  Number.isFinite(p.originalSpineCounterturnAfterRad)&&
  Math.abs(p.originalSpineCounterturnAfterRad)>.0001&&
  Math.abs(p.originalSpineCounterturnAfterRad)<=.120001);
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
  genuineSourcePivotCandidates:realOriginalTurns.length,
  originalImportedSpinePivotWitnesses:physicallyObservedCounterturns.length,
  genuineSourceFirstWalkCounterturnFrames:rafWindows.reduce((max,w)=>Math.max(max,
   ...w.pairs.map(p=>p.originalSpineFirstWalkFrames||0),0),0),
  caveat:'Only actual source clip weight, same GLB, genuine XZ root displacement and bounded imported-spine proof qualify; not IK, a floor raycast or planted-foot evidence.'};
 // Preserve the actual source-pivot trace even when a genuine counterturn
 // gate fails. Previously the proof was written AFTER the assertion, so a
 // real mobile 2-of-1 regression discarded the only frame-level diagnosis.
 // This is a read-only browser artifact, not production telemetry or a pose.
 fs.writeFileSync('artifacts/dungeon-full-body-original-raf-patch-'+view.name+'.json',
  JSON.stringify(rafEvidence,null,2));
 await test.info().attach('original-consecutive-render-source-patches',{
  contentType:'application/json',body:Buffer.from(JSON.stringify(rafEvidence,null,2))
 });
 expect(rafEvidence.consecutiveWitnessPairs,
  'an original-rig high-frequency source film must contain real adjacent displayed walking frames').toBeGreaterThan(0);
 // Only demand a visible benefit when the FULL sampled evidence actually
 // qualifies: real clip weight, distinct displayed frames, legal same-root
 // displacement and angular turn. Empty opportunities remain explicitly
 // unverified instead of fabricated counterturn success.
 if(realOriginalTurns.length){
  expect(physicallyObservedCounterturns.length,
   'a witnessed 0.637rad original Walking_A pivot must have a measured bounded source-spine response').toBeGreaterThan(0);
  // Previous real 1440px source film had TWO legal root-pivot candidates
  // but only ONE imported-spine response. A green one-of-two is not a
  // viewer-perceived continuity pass: every qualifying real source frame
  // must own its own bounded original chest/weapon-follow-through response.
  // Nonqualifying frames remain explicitly unclaimed in the raw evidence.
  expect(physicallyObservedCounterturns.length,
   'every legal actual Walking_A root pivot needs same-frame source-spine response, not just one lucky frame').toBe(realOriginalTurns.length);
 }
 for(const p of rafWindows.flatMap(w=>w.pairs)){
  expect(Math.abs(p.originalSpineCounterturnAfterRad||0)).toBeLessThanOrEqual(.120001);
 }
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


/**
 * Real, unmodified DungeonRuntime snapshots are the ONLY HP-loss witness.
 * Capture the actual incoming source Hit_A on desktop and 390px mobile;
 * these clips are original CC0 GLB and video is saved by Playwright CI.
 * This is NOT an animation-quality pass or a substitute for Warden/restart.
 */
function witnessedPartyHpLoss(){
 for(const seed of ['visual-room-art-18','gauntlet-corpus-v1-0','gauntlet-corpus-v1-1']){
  const game=DungeonRuntime.create(seed);
  let before=game.publicState();
  for(let i=0;i<1500;i++){
   const after=game.step();
   const actor=after.units.find(u=>{
    const prior=before.units.find(p=>p.id===u.id);
    return u.faction==='party'&&u.hp>0&&u.maxHp>0&&
     prior?.hp>0&&prior.hp>u.hp&&
     u.kind===prior.kind&&u.id===prior.id;
   });
   if(actor){
    const prior=before.units.find(p=>p.id===actor.id);
    return {seed,before,after,actor,loss:prior.hp-actor.hp};
   }
   before=after;
  }
 }
 throw Error('No genuine nonfatal party HP-loss event in declared seed corpus');
}
for(const view of [
 {name:'desktop',width:1440,height:900},
 {name:'mobile',width:390,height:844}
])test('genuine witnessed HP-loss Hit_A enters original source mixer: '+view.name,async({page})=>{
 test.setTimeout(130000);
 await page.setViewportSize({width:view.width,height:view.height});
 const event=witnessedPartyHpLoss();
 const stage=await loadStage(page,event.before);
 const before=await nativeRigProof(page);
 const previous=before.actors.find(a=>a.id===event.actor.id);
 expect(previous?.skinnedMeshes??0).toBeGreaterThan(0);
 stage.set(event.after);
 let matched=null;
 await expect.poll(async()=>{
  const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  const binding=d?.authored3D?.sourceClipBindings?.find(a=>a.id===event.actor.id);
  if(binding?.clipName==='Hit_A'&&
   (d?.authored3D?.fullBodyModes?.hurt??0)>0){
   matched={frame:d.frame,binding,owner:d.authored3D.fullBodyModes};
   return true;
  }
  return false;
 },{timeout:30000,intervals:[80,110,160]}).toBe(true);
 const injuryRig=await nativeRigProof(page);
 const afterActor=injuryRig.actors.find(a=>a.id===event.actor.id);
 expect(afterActor?.skinnedMeshes??0).toBeGreaterThan(0);
 expect(afterActor?.maxStretchFraction??Infinity).toBeLessThanOrEqual(.20);
 expect(afterActor?.sourceWeaponGrip?.attachedToGripSocket).toBe(true);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({
  path:'artifacts/dungeon-full-body-true-hp-loss-'+view.name+'.png',timeout:60000});
 await test.info().attach('genuine-positive-hp-loss-Hit_A-'+view.name,{
  contentType:'application/json',body:Buffer.from(JSON.stringify({
   seed:event.seed,viewport:view.name,source:'two consecutive unmodified DungeonRuntime.step snapshots',
   actorId:event.actor.id,kind:event.actor.kind,
   authoritativeTicks:[event.before.tick,event.after.tick],
   actualPositiveHpLoss:event.loss,
   originalSourceClipWitness:matched,
   priorOriginalRig:previous,postOriginalRig:afterActor,
   deformation:injuryRig.summary,
   warning:'Single legal HP-loss entry / video is not whole-game motion acceptance, sustained foot plant, or proof of exact per-frame blend rate.'
  },null,2))
 });
});
