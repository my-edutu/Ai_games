'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
const {isUninterruptedMeleeWitness,isUninjuredIdleRecovery}=require('./dungeon-animation-witness.cjs');
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
 const event=witness((u,before)=>u.kind==='ranger'&&u.hp>0&&u.action==='attack'&&
  before.units.some(old=>old.id===u.id&&old.actionTick!==u.actionTick));
 const stage=await loadStage(page,event.before);
 stage.set(event.after);
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.sourceClipBindings?.
   find(b=>b.kind==='ranger'&&b.action==='attack')?.clipName??null
 ),{timeout:18000,intervals:[70,90,120,180]}).toBe('2H_Ranged_Shoot');
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 const binding=d.authored3D.sourceClipBindings.find(b=>b.kind==='ranger');
 expect(binding.clipName).toBe('2H_Ranged_Shoot');
 expect(binding.sourceTick).toBe(event.actor.actionTick);
 expect(d.authored3D.sourceClipAudits.some(x=>x.kind==='ranger'&&
  x.clips.some(c=>c.name==='2H_Ranged_Shoot'&&c.rotation>0))).toBe(true);
 const rig=await nativeRigProof(page);
 expect(rig.summary.invalidMatrixCount).toBe(0);
 expect(stage.errors).toEqual([]);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-real-ranger-release.png',timeout:60000});
 await test.info().attach('genuine-ranger-source-release',{contentType:'application/json',
  body:Buffer.from(JSON.stringify({seed:event.seed,sourceTick:event.actor.actionTick,
   realActor:event.actor.id,clip:binding.clipName,source:'unmodified DungeonRuntime.step()',
   deformation:rig.summary,clipAudits:d.authored3D.sourceClipAudits,
   frame:d.frame,sourceSha:process.env.GITHUB_SHA??null},null,2))});
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
 const {measureSourceJointTravel}=await import('data:text/javascript;base64,'+
  Buffer.from(code).toString('base64'));
 const trace=[];
 let previous=null;
 for(const snap of sequence.states){
  stage.set(snap);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.tick??null),
   {timeout:22000,intervals:[80,120,200]}).toBe(snap.tick);
  // Let the original mixer display real in-between poses. Do not synthesize
  // another authority tick, alter source HP or change the public action.
  await page.waitForTimeout(160);
  const audit=await nativeRigProof(page);
  const actor=audit.actors.find(a=>a.id===sequence.actorId);
  expect(actor?.sourceInstanceId,'the same original GLB clone remains bound').toBeTruthy();
  expect(actor.validSegments).toBeGreaterThanOrEqual(4);
  expect(actor.maxStretchFraction).toBeLessThanOrEqual(.20);
  const travel=previous?measureSourceJointTravel(previous,actor):null;
  if(travel)expect(travel.comparable,'never compare different source clones').toBe(true);
  trace.push({tick:snap.tick,floor:snap.floor,sourceId:actor.sourceInstanceId,
   rootWorld:actor.rootWorld,footJointWorld:actor.footJointWorld,
   sourceClip:actor.sourceClock,footPhase:actor.groundedFootPhase,
   jointTravel:travel,deformation:audit.summary});
  previous=actor;
 }
 const measured=trace.slice(1).map(t=>t.jointTravel.rootTravelMeters);
 expect(measured.every(Number.isFinite)).toBe(true);
 // Measured movement of real source joints is necessary, not proof of sole
 // mesh contact or a completed foot-lock IK solver.
 expect(measured.some(n=>n>.005),'source skeleton cannot remain frozen').toBe(true);
 expect(stage.errors).toEqual([]);
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-full-body-nine-tick-'+view.name+'.png',timeout:60000});
 await test.info().attach('original-GLB-nine-tick-moving-trace',{contentType:'application/json',
  body:Buffer.from(JSON.stringify({seed:sequence.seed,actorId:sequence.actorId,
   legalSteps:sequence.legalSteps,view:view.name,source:'real consecutive DungeonRuntime.step snapshots',
   limitation:'Original foot joints are not skinned sole vertices; no sole lock or IK claim.',
   trace},null,2))});
});

