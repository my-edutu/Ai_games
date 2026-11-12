import * as THREE from '/dungeon/vendor/three.module.js';
import {makeWallMasonryPixels} from '/dungeon/wall-masonry-plan.js';
import {applySoftwareWorldRasterTier} from '/dungeon/software-world-raster.js';
import {planFracturedWallStone,planWallStoneVariation} from '/dungeon/fractured-wall-plan.js';
import {planCutawayWallTransform,planCutawayFoundationTransform,planCutawayParapetTransform} from '/dungeon/cutaway-floor-plan.js';
import {encounterTarget,isSceneAlert,installSpectatorUI} from '/dungeon/spectator-ui.js';
import {enrichEnvironment} from '/dungeon/environment.js';
import {planDungeonWallProfiles,planLegibleWallMass} from '/dungeon/wall-profile-plan.js';
import {createFloorRuins} from '/dungeon/floor-ruins.js';
import {createExpeditionStonework} from '/dungeon/expedition-stonework.js';
import {planVaultedWallBays} from '/dungeon/vaulted-wall-plan.js';
import {createVaultedWallGallery} from '/dungeon/vaulted-wall-gallery.js';
import {planEncounterSightlines} from '/dungeon/encounter-sightlines.js';
import {planCombatSightlineExtension,planCinematicSilhouetteRecess} from '/dungeon/encounter-sightlines.js';
import {planEncounterLighting} from '/dungeon/encounter-lighting-plan.js';
import {planEncounterFrame} from '/dungeon/encounter-frame-plan.js';
import {planCinematicShot,planCinematicVisibleHero,planReadableExpeditionLens,planCriticalSubjectFit,planWardenCharge,planWardenTrueStrikeRelease,planOathguardPose,planBossDuelSightline,planPartyVistaSightline} from '/dungeon/cinematic-chapter-plan.js';
import {planPartyWallReveal,createCutawayBandCache,shouldUploadCutawayBand,resolveRenderedSilhouetteSubjects,planProjectedBodyAperture,planPortraitStageClearance} from '/dungeon/party-visibility-plan.js';
import {planBoundaryCamera} from '/dungeon/camera-boundary-plan.js';
import {advancePresentationActionAge,planSourceRigPlaybackStep} from '/dungeon/character-motion-plan.js';
import {planExpeditionStep,advanceExpeditionFootfall,planGroundedAnimation} from '/dungeon/expedition-locomotion-plan.js';
import {planAuthorityDamageBeats,planDamageReaction,resolveImpactSide,planDefeatTableauPose,planImpactCameraHold,planVerifiedMeleeImpactDelay,planVisibleMeleeContactStep,DAMAGE_BEAT_DURATION,DEATH_BEAT_DURATION} from '/dungeon/impact-choreography-plan.js';
import {planAuthorityEvasions,EVASION_BEAT_DURATION} from '/dungeon/evasion-performance-plan.js';
import {planPostFXBudget,adaptPostFXPixelCap,postFXStallAction,isSoftwareWebGLRenderer,createFrameIntervalProbe,planDirectRenderBudget,adaptDirectRenderPixelCap,planRenderSurfaceUpdate,createSoftwareDeliveryBudgetGovernor,deferRenderDiagnostics,createRenderPhaseProfiler,createAuthorityCueBatch,createRetainedStaticDetailBatches,createBaseWorldArchitecturalBatches,createSoftwareWorldLightBudget,createSoftwareDiffuseMasonry,planRenderedForegroundStageHitOwners} from '/dungeon/postfx-budget.js';
import {planRendererAntialias} from '/dungeon/render-context-plan.js';
import {planEventVisualPriority} from '/dungeon/event-visual-priority-plan.js';
import {planCombatFacing,planMovementFacing,approachCharacterYaw,shortestYawDelta} from '/dungeon/facing-plan.js';
import {enrichCharacter} from '/dungeon/characters.js';
import {createBiomeAtmosphere} from '/dungeon/biome-atmosphere.js';
import {createCombatOverlay} from '/dungeon/combat-overlay.js';
import {createCombatDirector} from '/dungeon/combat-director.js';
import {planCombatStage,stagePoint,MAX_STAGE_OFFSET,inspectBattlefieldCrowding} from '/dungeon/combat-staging-plan.js';
import {createCombatShotContinuity} from '/dungeon/combat-shot-continuity.js';
import {createPhysicalCameraDirector} from '/dungeon/physical-camera-director.js';
import {createActorOcclusionStage} from '/dungeon/actor-occlusion-stage.js';
import {planEncounterViewport} from '/dungeon/encounter-viewport-plan.js';
import {planWardenTacticalCue} from '/dungeon/warden-tactical-ux-plan.js';
import {planWardenCourtPriority} from '/dungeon/warden-court-priority-plan.js';
import {captureForegroundVolumes,planForegroundBodyClearance,planWardenWarningSightlinePoints,planForegroundWarningClearance} from '/dungeon/foreground-sightline-plan.js';
import {applyForegroundRecession} from '/dungeon/foreground-recession.js';
import {planPerimeterWallLanterns} from '/dungeon/perimeter-wall-lantern-plan.js';
import {createDungeonSoundstage} from '/dungeon/soundstage.js';
import {planRealActorScreenReadability} from '/dungeon/actor-screen-readability.js';
import {sampleNativeActorSurface} from '/dungeon/native-surface-sightline.js';
import {createWardenRitual} from '/dungeon/warden-ritual.js';
import {createWardenImpactScars} from '/dungeon/warden-impact-scars.js';
import {planWardenExposurePose} from '/dungeon/warden-chapter-plan.js';
import {WARDEN_STAGE_PROFILE} from '/dungeon/warden-regalia-plan.js';
import {planWorldStoryStage} from '/dungeon/world-story-stage-plan.js';
import {addContactProjection} from '/dungeon/contact-projection.js';
import {createLivingWorld} from '/dungeon/living-world.js';
import {createChapterNaves} from '/dungeon/chapter-nave.js';
import {planConnectedDungeonJourney} from '/dungeon/connected-journey-plan.js';
import {planWardenArenaStage} from '/dungeon/warden-arena-stage-plan.js';
import {attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats as assetStats} from '/dungeon/model-assets.js';
const $=id=>document.getElementById(id),canvas=$('world'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const spectatorUI=installSpectatorUI();
let focusedHeroId='vanguard',autoDirector=true,lastAutoSwitch=0;
function directCamera(s){
 const alive=s.units.filter(u=>u.faction==='party'&&u.hp>0);
 if(!alive.length)return;
 const current=alive.find(u=>u.id===focusedHeroId);
 if(!autoDirector&&current)return;
 const now=performance.now();
 if(current&&now-lastAutoSwitch<4800)return;
 const foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0);
 const priority=alive.map(u=>{
  const minDist=foes.length?Math.min(...foes.map(f=>Math.abs(f.x-u.x)+Math.abs(f.z-u.z))):100;
  return {u,score:(u.action==='attack'?8:u.action==='cast'?9:u.action==='hurt'?6:0)+(minDist<=3?3:0)-(u.hp/u.maxHp<.25?2:0)}
 }).sort((a,b)=>b.score-a.score||a.u.id.localeCompare(b.u.id));
 const select=priority[0]?.u;
 if(!select||select.id===focusedHeroId)return;
 focusedHeroId=select.id;lastAutoSwitch=now;
 $('focus-label').textContent='DIRECTOR FOLLOW · '+(classMeta[select.kind]?.name||select.kind).toUpperCase();
}
const combatShotContinuity=createCombatShotContinuity();
const physicalCameraDirector=createPhysicalCameraDirector();
const actorOcclusionStage=createActorOcclusionStage(THREE);
const renderContextPlan=planRendererAntialias(()=>document.createElement('canvas'));
const renderer=new THREE.WebGLRenderer({canvas,antialias:renderContextPlan.antialias,powerPreference:'high-performance',alpha:false});
renderer.info.autoReset=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
// Use the actual renderer identity, not a browser/OS guess. CPU SwiftShader
// cannot afford eager multi-pass bloom before its first spectator frame.
const webglRendererName=(()=>{
 try{
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  return String(gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)||'');
 }catch{return ''}
})();
const softwareWebGL=isSoftwareWebGLRenderer(webglRendererName);
// Read back the live context: preflight may be privacy-limited or choose a
// different driver. Report actual MSAA, never an assumed performance gain.
const actualContextAntialias=Boolean(renderer.getContext().getContextAttributes()?.antialias);
// Software WebGL can take seconds per full-resolution, shadowed frame.
// Preserve the CSS stage and live game truth while limiting CPU raster work.
const directRequestedDpr=Math.min(devicePixelRatio||1,1.6);
let directRenderPixelCap=650000,directRenderMs=0,directDownshifts=0,directSlowStreak=0;
let appliedSurfaceWidth=0,appliedSurfaceHeight=0,appliedSurfaceDpr=null;
let surfaceRendererResizes=0,surfaceDprChanges=0,surfaceComposerResizes=0,surfaceCameraUpdates=0;
const directDeliveryGovernor=createSoftwareDeliveryBudgetGovernor();
let directDeliveryStatus='unmeasured',directDeliveryCapChanges=0;
let directBudget=planDirectRenderBudget(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight),directRequestedDpr,softwareWebGL,directRenderPixelCap);
directBudget.shadows=directBudget.shadows&&!reduced;
renderer.setPixelRatio(directBudget.pixelRatio);
appliedSurfaceDpr=directBudget.pixelRatio;
renderer.shadowMap.enabled=directBudget.shadows;
const scene=new THREE.Scene();scene.background=new THREE.Color('#070d18');scene.fog=new THREE.FogExp2('#090f1a',.024);
// One bounded real-GPU draw for all marked cultist impacts. This is placed at
// the authority's *locked* attack tile; it never predicts a fictional hit.
const CULTIST_TELL_MAX=6;
const cultistTell=new THREE.InstancedMesh(
 new THREE.RingGeometry(.26,.45,24).rotateX(-Math.PI/2),
 new THREE.MeshBasicMaterial({color:'#c37aff',transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false}),
 CULTIST_TELL_MAX);
cultistTell.name='cultist-hex-floor-tells';cultistTell.count=0;cultistTell.frustumCulled=false;
scene.add(cultistTell);
const cultistTellMatrix=new THREE.Matrix4();
// Original iron four-corner scar and slash mark the *true* locked tile.
// Both capped instanced batches are static and honor reduced-motion settings.
const REVENANT_TELL_MAX=8;
const breachDiamond=new THREE.InstancedMesh(
 new THREE.RingGeometry(.34,.48,4).rotateX(-Math.PI/2),
 new THREE.MeshBasicMaterial({color:'#f4a765',transparent:true,opacity:.80,side:THREE.DoubleSide,depthWrite:false}),REVENANT_TELL_MAX);
const breachSlash=new THREE.InstancedMesh(
 new THREE.PlaneGeometry(.085,.68).rotateX(-Math.PI/2),
 new THREE.MeshBasicMaterial({color:'#ffe0a5',transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false}),REVENANT_TELL_MAX);
for(const mesh of [breachDiamond,breachSlash]){mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);}
breachDiamond.name='revenant-locked-ground-breach';breachSlash.name='revenant-chiseled-scar';
const breachMatrix=new THREE.Matrix4(),breachSlashMatrix=new THREE.Matrix4();
const breachRotation=new THREE.Matrix4().makeRotationY(Math.PI/4);
// Reusable, original PHYSICAL armour: a forged shield carries its geometry
// into the same moving 3D world as the real protector and protected ally.
// All parts are static GPU meshes; no dynamic shadows, extra lights or assets.
const oathShape=new THREE.Shape();
oathShape.moveTo(0,-.65);oathShape.lineTo(-.36,-.39);
oathShape.lineTo(-.45,.29);oathShape.lineTo(0,.64);
oathShape.lineTo(.45,.29);oathShape.lineTo(.36,-.39);oathShape.closePath();
const oathguardAegis=new THREE.Group();
oathguardAegis.name='truthful-party-oathguard-shield';
const oathPlate=new THREE.Mesh(new THREE.ExtrudeGeometry(oathShape,{
 depth:.07,steps:1,bevelEnabled:true,bevelThickness:.035,bevelSize:.038,bevelSegments:2}),
 new THREE.MeshStandardMaterial({color:'#c7a373',metalness:.77,roughness:.31,side:THREE.DoubleSide}));
oathPlate.name='forged-bronze-perimeter';oathguardAegis.add(oathPlate);
const oathInset=new THREE.Mesh(new THREE.ShapeGeometry(oathShape),
 new THREE.MeshStandardMaterial({color:'#384954',metalness:.68,roughness:.43,side:THREE.DoubleSide}));
oathInset.name='patinated-iron-inset';oathInset.position.z=.118;oathInset.scale.set(.84,.84,1);
oathguardAegis.add(oathInset);
const oathGold=new THREE.MeshStandardMaterial({color:'#e8c78f',metalness:.80,roughness:.30});
const oathIron=new THREE.MeshStandardMaterial({color:'#9dadaf',metalness:.84,roughness:.39});
const keel=new THREE.Mesh(new THREE.CylinderGeometry(.041,.060,1.05,8),oathIron);
keel.position.z=.155;keel.name='raised-forged-keel';oathguardAegis.add(keel);
for(const side of [-1,1]){
 const rib=new THREE.Mesh(new THREE.CylinderGeometry(.023,.032,.52,7),oathGold);
 rib.name='forged-diagonal-rib';rib.position.set(side*.16,.13,.151);
 rib.rotation.z=side*.72;oathguardAegis.add(rib);
 for(const y of [-.27,.31]){
  const rivet=new THREE.Mesh(new THREE.SphereGeometry(.038,8,6),oathGold);
  rivet.name='forged-rivet';rivet.position.set(side*.325,y,.145);
  oathguardAegis.add(rivet);
 }
}
const oathCrest=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,1),oathGold);
oathCrest.name='raised-oath-crest';oathCrest.scale.z=.55;
oathCrest.position.set(0,.095,.21);oathguardAegis.add(oathCrest);
// A single capped ring only responds to an actual lost-HP intercept, not a
// speculative cover pose or an old log record. Reduced motion disables it.
const oathguardImpactRing=new THREE.Mesh(new THREE.RingGeometry(.56,.68,28),
 new THREE.MeshBasicMaterial({color:'#f7d8a4',transparent:true,opacity:0,
 side:THREE.DoubleSide,depthWrite:false}));
oathguardImpactRing.position.z=.19;oathguardImpactRing.visible=false;
oathguardImpactRing.name='true-cover-impact-wave';oathguardAegis.add(oathguardImpactRing);
let oathguardImpactAge=10;
oathguardAegis.visible=false;oathguardAegis.frustumCulled=false;scene.add(oathguardAegis);
// Real, completed two-hero handoff only: authentic Ranger/Mystic feet step
// onto the square the Vanguard vacated this same authority tick. Never a
// speculative immunity indicator or a second fake Warden danger footprint.
const oathguardEscapeMark=new THREE.Mesh(new THREE.RingGeometry(.28,.41,32),
 new THREE.MeshBasicMaterial({color:'#b0e1c5',transparent:true,opacity:.61,
  depthWrite:false,side:THREE.DoubleSide}));
oathguardEscapeMark.name='real-vanguard-escape-lane-handoff';
oathguardEscapeMark.rotation.x=-Math.PI/2;oathguardEscapeMark.visible=false;
scene.add(oathguardEscapeMark);
let oathguardEscapeAge=10;
const camera=new THREE.PerspectiveCamera(50,1,.1,110);
const cameraAim=new THREE.Vector3();
// Deferred, optional 3D post-processing: selective emissive bloom adds light without
// sacrificing the whole scene to fog/black overlays. Direct WebGL remains fallback.
let composer=null,bloomPass=null,postFXEnabled=!reduced&&!softwareWebGL,postFXStatus=softwareWebGL?'software-fallback':reduced?'disabled':'loading',postFXBudget=null,postFXLoading=false;
let bloomPixelCap=850000,bloomRenderMs=0,bloomDownshifts=0,bloomSlowStreak=0,bloomAutoDisabled=false;
const fxButton=$('fx-toggle');
fxButton.setAttribute('aria-pressed',String(postFXEnabled));
if(softwareWebGL){
 fxButton.title='CPU-rendered WebGL: using direct 3D for smooth playback; click to try optional glow';
 fxButton.querySelector('span').textContent='DIRECT 3D';
}
fxButton.addEventListener('click',()=>{
 postFXEnabled=!postFXEnabled;
 if(postFXEnabled){bloomSlowStreak=0;bloomAutoDisabled=false;postFXStatus=composer?'ready':'loading';fxButton.removeAttribute('title');if(!composer)initializePostFX()}
 fxButton.setAttribute('aria-pressed',String(postFXEnabled));
 fxButton.querySelector('span').textContent=postFXEnabled?'Glow on':'Glow off';
});
async function initializePostFX(){
 if(composer||postFXLoading)return;
 postFXLoading=true;
 try{
  const [c,r,b,o]=await Promise.all([
   import('/dungeon/vendor/addons/postprocessing/EffectComposer.js'),
   import('/dungeon/vendor/addons/postprocessing/RenderPass.js'),
   import('/dungeon/vendor/addons/postprocessing/UnrealBloomPass.js'),
   import('/dungeon/vendor/addons/postprocessing/OutputPass.js')
  ]);
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  const budget=planPostFXBudget(width,height,renderer.getPixelRatio(),bloomPixelCap);
  const pipeline=new c.EffectComposer(renderer);
  pipeline.setPixelRatio(budget.pixelRatio);
  pipeline.addPass(new r.RenderPass(scene,camera));
  bloomPass=new b.UnrealBloomPass(new THREE.Vector2(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight)),.29,.36,.9);
  pipeline.addPass(bloomPass);pipeline.addPass(new o.OutputPass());
  pipeline.setSize(width,height);
  postFXBudget=budget;composer=pipeline;postFXStatus='ready';
  if(postFXEnabled)fxButton.querySelector('span').textContent='Glow on';
 }catch(error){composer=null;postFXStatus='unavailable';postFXEnabled=false;fxButton.title='Post effects unavailable: using direct 3D rendering';fxButton.setAttribute('aria-pressed','false');fxButton.querySelector('span').textContent='DIRECT 3D';console.warn('[DUNGEON] optional bloom unavailable:',String(error))}
 finally{postFXLoading=false}
}
if(postFXEnabled)initializePostFX();
const ambient=new THREE.HemisphereLight('#9da8c8','#533b35',1.85);scene.add(ambient);
const wardenSpot=new THREE.PointLight('#ffbd76',0,9.5,2);scene.add(wardenSpot);
const moon=new THREE.DirectionalLight('#ffe0b2',1.65);moon.position.set(-7,17,5);moon.castShadow=directBudget.shadows;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-17;moon.shadow.camera.right=17;moon.shadow.camera.top=17;moon.shadow.camera.bottom=-17;scene.add(moon);
const partyGlow=new THREE.PointLight('#50e9ff',1.65,7.7,2);partyGlow.position.set(0,2,0);scene.add(partyGlow);
// A warm photographic key light follows the real viewed character, preserving
// the character silhouette inside the dark vault without increasing global bloom.
const heroKey=new THREE.PointLight('#ffdfbc',2.65,6.8,2);heroKey.position.set(1,2.6,2);heroKey.castShadow=false;scene.add(heroKey);
const lightStep=new THREE.Vector3();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:'#080e17',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.17;scene.add(ground);
const actors=new Map(),world=new THREE.Group();scene.add(world);
let crowdedStageActors=0,lastStagePositions=Object.create(null);
const combatOverlay=createCombatOverlay($('battle-overlay'));
const combatDirector=createCombatDirector(scene,{reducedMotion:reduced,actorById:id=>actors.get(id)});
const floorThemes=[
 // Lighting and core PBR tint follow each real floor. The crypt is warm
 // weathered limestone, leaving deliberately cold blues for the obsidian vault.
 // No extra draw calls, shadow casters, network assets or gameplay decisions.
 {sky:'#292922',fog:'#292c26',torch:'#ffb874',accent:'#86c8af',fill:'#cfbda5',
  wallTint:'#f3e0c7',floorTint:'#50463c',trimTint:'#7c6d5b',partyFill:'#9bd8ba',partyIntensity:1.05,biome:'SUNKEN CRYPT'},
 {sky:'#311c2d',fog:'#341b2e',torch:'#ffaf55',accent:'#fe806f',fill:'#a66d9a',
  wallTint:'#e4e9eb',floorTint:'#40353d',trimTint:'#65545b',partyFill:'#ffb88c',partyIntensity:1.20,biome:'EMBER CATHEDRAL'},
 {sky:'#1a2543',fog:'#1a2452',torch:'#82f7ef',accent:'#72bbff',fill:'#648ed5',
  wallTint:'#e4e9eb',floorTint:'#28313b',trimTint:'#404957',partyFill:'#50e9ff',partyIntensity:1.65,biome:'OBSIDIAN VAULT'},
 {sky:'#321e50',fog:'#2f1b4d',torch:'#d39bff',accent:'#fc91c8',fill:'#aa8ae2',
  wallTint:'#e4e9eb',floorTint:'#34303d',trimTint:'#56506a',partyFill:'#c59fef',partyIntensity:1.30,biome:'HOLLOW SANCTUM'}
];let lastCutawayKey='';
const cachedVec=new THREE.Vector3(),cachedQuat=new THREE.Quaternion(),cachedScale=new THREE.Vector3(),cachedMatrix=new THREE.Matrix4();
// The camera follows one hero, but every living party member needs a clear view.
// Read only public snapshots; this presentation pass never alters authority.
function sightlineClearance(x,z,subjects,cameraPosition,pad=2.1){
 return planPartyWallReveal(x,z,subjects,cameraPosition,pad)!=='none';
}
let cachedWarningSnapshot=null,activeWarningSightlinePoints=[];
function cutawayWalls(target,subjects,wallPad=2.1,view=null,forceWalls=null,frameDt=0,verifiedRenderedStageRoots=null){
 const positions=world.userData.wallPositions,mesh=world.userData.walls;
 if(!mesh||!positions)return;
 // Every frame is intentional: a rounded key previously skipped critical
 // updates while the camera and party moved within a tile.
 let cut=0,nearbyCut=0,wallMatrixWrites=0,screenSpaceWallReveals=0;
 const wallBands=world.userData.wallCutawayBands;
 for(let i=0;i<positions.length;i++){
  const point=positions[i];
  const coarse=planPartyWallReveal(point[0],point[1],subjects,camera.position,wallPad,world.userData.wallHeights?.[i]??2.6);
  const projected=coarse!=='sightline'&&subjects.some(p=>p.visibleActor===true&&
   Math.hypot(p.x-point[0],p.z-point[1])<4.6)&&
   planProjectedBodyAperture([point[0]-.525,0,point[1]-.525,
    point[0]+.525,world.userData.wallHeights?.[i]??2.6,point[1]+.525],
    subjects,camera.position,view);
  const reveal=forceWalls?.has(i)?'sightline':projected?'sightline':coarse;
  if(projected)screenSpaceWallReveals++;
  const cutaway=planCutawayWallTransform(reveal,world.userData.wallHeights?.[i]??2.6);
  if(reveal!=='none')cut++;
  if(reveal==='nearby')nearbyCut++;
  if(!shouldUploadCutawayBand(wallBands,i,reveal==='sightline'?2:reveal==='nearby'?1:0))continue;
  wallMatrixWrites++;
  cachedVec.set(point[0],cutaway.height/2-.03,point[1]);cachedScale.set(cutaway.footprint,cutaway.height,cutaway.footprint);
  const weather=planWallStoneVariation(point[0],point[1],state?.floor??1);
  cachedQuat.setFromAxisAngle(wallVertical,weather.yaw);
  cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);mesh.setMatrixAt(i,cachedMatrix);
 }
 cachedQuat.identity();
 world.userData.vaultedGallery?.cutaway(wallBands);
 world.userData.cutawayWalls=cut;world.userData.cutawayNearbyWalls=nearbyCut;
 world.userData.screenSpaceWallReveals=screenSpaceWallReveals;
 world.userData.wallMatrixWrites=wallMatrixWrites;
 // Foundation courses use the same cached parent wall bands to avoid drawing
 // enormous black 1x1 tiles over the textured under-wall floor when the
 // spectator camera clears opaque walls. All changes are render-only.
 const foundationMesh=world.userData.foundationMesh;
 const foundationBrickWallIndices=world.userData.foundationBrickWallIndices;
 const foundationPositions=world.userData.foundationBrickPositions;
 const foundationBands=world.userData.foundationCutawayBands;
 let clearedFoundationBricks=0,foundationMatrixWrites=0;
 if(foundationMesh&&foundationPositions&&foundationBrickWallIndices){
  for(let i=0;i<foundationPositions.length;i++){
   const footWallIndex=foundationBrickWallIndices[i];
   const band=footWallIndex>=0&&footWallIndex<wallBands.length?wallBands[footWallIndex]:0;
   const reveal=band===2?'sightline':band===1?'nearby':'none';
   if(reveal!=='none')clearedFoundationBricks++;
   if(!shouldUploadCutawayBand(foundationBands,i,reveal==='sightline'?2:reveal==='nearby'?1:0))continue;
   const foundation=planCutawayFoundationTransform(reveal);
   if(!foundation)continue;
   const [fx,,fz]=foundationPositions[i];
   cachedVec.set(fx,foundation.y,fz);
   cachedScale.set(foundation.footprint,foundation.height,foundation.footprint);
   cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);
   foundationMesh.setMatrixAt(i,cachedMatrix);foundationMatrixWrites++;
  }
  if(foundationMatrixWrites)foundationMesh.instanceMatrix.needsUpdate=true;
 }
 world.userData.clearedFoundationBricks=clearedFoundationBricks;
 world.userData.foundationMatrixWrites=foundationMatrixWrites;
 // Decorative wall crowns must obey the same true-world sightline clearance
 // as the main masonry. Otherwise an invisible wall can still hide the model
 // behind an unrelated 2.5m-high square parapet.
 const parapets=world.userData.parapets,parapetPositions=world.userData.parapetPositions;
 let clearedParapets=0,parapetMatrixWrites=0;
 const parapetBands=world.userData.parapetCutawayBands;
 if(parapets&&parapetPositions){
  for(let i=0;i<parapetPositions.length;i++){
   const [px,pz]=parapetPositions[i],hidden=sightlineClearance(px,pz,subjects,camera.position,wallPad);
   if(hidden)clearedParapets++;
   if(!shouldUploadCutawayBand(parapetBands,i,hidden?1:0))continue;
   const parapet=planCutawayParapetTransform(hidden,world.userData.parapetHeights?.[i]??2.53);
   if(!parapet)continue;
   parapetMatrixWrites++;
   cachedVec.set(px,parapet.y,pz);
   cachedScale.set(parapet.footprint,parapet.height,parapet.footprint);
   cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);
   parapets.setMatrixAt(i,cachedMatrix);
  }
  if(parapetMatrixWrites)parapets.instanceMatrix.needsUpdate=true;
 }
 world.userData.cutawayParapets=clearedParapets;
 world.userData.parapetMatrixWrites=parapetMatrixWrites;
 let removed=0,portraitCleared=0,warningCleared=0;
 for(const [i,group] of (world.userData.foregroundProps||[]).entries()){
  const hidden=sightlineClearance(group.position.x,group.position.z,subjects,camera.position,wallPad)||
   planForegroundBodyClearance(world.userData.foregroundPropVolumes?.[i],subjects,camera.position)||
   planProjectedBodyAperture(world.userData.foregroundPropVolumes?.[i],subjects,camera.position,view);
  const portrait=planPortraitStageClearance(world.userData.foregroundPropVolumes?.[i],subjects,camera.position,view);
  // Only actual authority warning tiles can clear a prop that hides the live
  // Warden strike. Whole props physically retreat; no fake hazard overlay.
  const danger=planForegroundWarningClearance(world.userData.foregroundPropVolumes?.[i],activeWarningSightlinePoints,camera.position);
  applyForegroundRecession(group,hidden||portrait||danger||verifiedRenderedStageRoots?.has(group),frameDt,reduced,world.userData.foregroundPropVolumes?.[i]);
  if(hidden||portrait||danger)removed++;
  if(danger&&!hidden&&!portrait)warningCleared++;
  if(portrait&&!hidden)portraitCleared++;
 }
 world.userData.hiddenForegroundProps=removed;
 world.userData.portraitStagePropsCleared=portraitCleared;
 world.userData.wardenWarningForegroundCleared=warningCleared;
 if(wallMatrixWrites)mesh.instanceMatrix.needsUpdate=true;
}

const seenEventIds=new Set();
const cueBatch=createAuthorityCueBatch(THREE,scene,{
 maxParticles:72,maxPulses:12,
 ringGeometry:new THREE.RingGeometry(.66,.76,40),
 shockGeometry:new THREE.RingGeometry(1.12,1.24,48)
});
let shakeStrength=0;
function genuineWardenGroundEvent(event){
 return (event?.kind==='danger'||event?.kind==='evade')&&
  typeof event.text==='string'&&
  /^The Warden (nova|rift cross|eclipse sweep) shockwave struck \d+ hero(?:es)?$/.test(event.text);
}
function pulseFX(plan,s){
 const p=plan.pulse;if(!p)return;
 const origin=s.units.find(u=>u.id===p.targetId);
 if(!origin)return;
 cueBatch.emitPulse({kind:p.kind,x:origin.x-9,y:.068,z:origin.z-9,
  from:p.from,to:p.to,duration:p.duration,color:p.theme});
}
function cue(event,s){
 if(reduced)return;
 const visualPlan=planEventVisualPriority(event,s);
 pulseFX(visualPlan,s);
 if(visualPlan.particleCount===0)return;
 const colors={unseal:'#ffe7a1',kill:'#ffe3a0',combat:'#e99159',danger:'#ef5864',phase:'#efb7ff',guard:'#72ffdf',evade:'#88b9ff',block:'#92eaff',trap:'#ff646c',disarm:'#74f8be',telegraph:'#ffb77b',healing:'#58ebba',loot:'#66d7e5',floor:'#d7bbff'};
 const color=colors[event.kind];if(!color)return;
 const bossFall=event.kind==='kill'&&event.text?.startsWith('WARDEN DEFEATED');
 const target=genuineWardenGroundEvent(event)?s.units.find(u=>u.kind==='warden'):
  bossFall?s.units.find(u=>u.kind==='warden'&&u.hp===0):
  event.kind==='unseal'?s.units.find(u=>u.kind==='warden'):
  event.kind==='danger'?s.units.find(u=>u.faction==='party'&&u.hp>0):
  event.kind==='kill'?s.units.find(u=>u.faction==='enemy'&&u.hp===0):
  s.units.find(u=>u.id==='mystic')||s.units[0];
 const x=(target?.x??s.exit.x)-9,z=(target?.z??s.exit.z)-9;
 const count=visualPlan.particleCount;
 for(let i=0;i<count;i++){
  const angle=i*2.399963+event.tick*.25,velocity=.4+(i%4)*.15;
  cueBatch.emitParticle({x,y:1.2+(i%3)*.09,z,scale:.55+(i%3)*.27,
   duration:.45+(i%3)*.18,vx:Math.cos(angle)*velocity,
   vy:.5+(i%5)*.16,vz:Math.sin(angle)*velocity,color});
 }
}
let state=null,worldFloor='',received=false,lastTick=-1,errorAt=0;
let impactCameraHold=null,lightInjury=null,observedDamageBeats=0,observedFatalBeats=0;
const palette={vanguard:['#4a87a8','#bed8df','#eab967'],ranger:['#527c58','#bdd19f','#d2b178'],mystic:['#65508f','#c2abf0','#76d8e0'],revenant:['#54656e','#b3c4bd','#dfb76f'],cultist:['#743e4c','#b18a89','#f0636b'],warden:['#483552','#c79a62','#ec7f42']};
const mat=(color,metalness=.1,roughness=.75)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const authoredStone=mat('#26303d',.1,.95),authoredFloor=mat('#28313b',.05,.95);
const stone=createSoftwareDiffuseMasonry(THREE,authoredStone,{software:softwareWebGL});
const floorMat=createSoftwareDiffuseMasonry(THREE,authoredFloor,{software:softwareWebGL});
if(softwareWebGL){authoredStone.dispose();authoredFloor.dispose()}
const stoneEdge=mat('#404957',.15,.88),gold=mat('#c9a366',.7,.33),black=mat('#111724',.2,.8);
let wallMasonryTexture=null;
const tealGlow=new THREE.MeshStandardMaterial({color:'#53aebc',emissive:'#228a98',emissiveIntensity:2.2,roughness:.2});
const dangerGlow=new THREE.MeshStandardMaterial({color:'#e67f50',emissive:'#bd4f18',emissiveIntensity:2.3});
const wallVertical=new THREE.Vector3(0,1,0);
const geo={cube:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,12,8),cylinder:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,10)};
const make=(geometry,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=!reduced;o.receiveShadow=true;parent.add(o);return o};
function perimeterWallSconce(parent,site,index){
 // A physical lamp on an ACTUAL solid exterior wall. The former four
 // unsupported 2m cylinders projected as giant opaque mobile foreground
 // columns. Keep the original masonry material and warm keyed light without
 // introducing fictional collision, opaque combat-stage geometry, or props.
 const root=new THREE.Group();
 root.name='Wall-supported original perimeter lantern — '+site.side;
 root.position.set(site.x,0,site.z);root.rotation.y=site.yaw;
 make(geo.cube,stoneEdge,root,0,.60,-.16,.32,.42,.19);
 make(geo.cube,gold,root,0,.74,.015,.17,.12,.18);
 const lamp=make(geo.sphere,dangerGlow,root,0,.86,.075,.13,.15,.13);
 lamp.castShadow=false;
 if(index<3){
  const light=new THREE.PointLight(floorThemes[(state?.floor??1)-1>=0?((state?.floor??1)-1)%floorThemes.length:0].torch,3,9,2);
  light.position.set(0,.86,.075);
  light.userData.dungeonDecorativePractical=true;
  root.add(light);
 }
 parent.add(root);
 parent.userData.foregroundProps?.push(root);
 parent.userData.baseColumnRoots?.push(root);
 return root;
}
function disposeActor(a){
 a.ground?.dispose();disposeActorAsset(a);a.detail?.dispose();
 const protectedMaterials=new Set([stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow]),seenMat=new Set(),seenGeo=new Set();
 a.root.traverse(o=>{
  if(o.geometry&&!o.userData.sharedAssetGeometry&&!Object.values(geo).includes(o.geometry)&&!seenGeo.has(o.geometry)){seenGeo.add(o.geometry);o.geometry.dispose()}
  const list=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
  for(const m of list)if(!seenMat.has(m)&&!protectedMaterials.has(m)){seenMat.add(m);m.dispose()}
 });
 scene.remove(a.root);
}
function clearWorld(){world.userData.baseWorldArchitecturalBatches?.dispose();world.userData.baseWorldArchitecturalBatchesAlt?.dispose();world.userData.baseWorldArchitecturalBatches=null;world.userData.baseWorldArchitecturalBatchesAlt=null;stageVerifiedSourceRoots.clear();stageOriginalSourceBounds.clear();world.userData.renderedStageDirectMeshes=[];world.userData.softwareWorldRasterTier=null;world.userData.softwareWorldLights?.dispose();world.userData.softwareWorldLights=null;for(const batch of world.userData.staticDetailBatches||[])batch.dispose();world.userData.staticDetailBatches=[];actorOcclusionStage.reset();world.userData.wardenImpactScars?.dispose();world.userData.wardenImpactScars=null;combatDirector.reset();world.userData.archRibGeometry?.dispose();world.userData.archRibGeometry=null;world.userData.expeditionStonework?.dispose();world.userData.expeditionStonework=null;world.userData.floorRuins?.dispose();world.userData.floorRuins=null;world.userData.vaultedGallery?.dispose();world.userData.vaultedGallery=null;world.userData.chapterNaves?.dispose();world.userData.chapterNaves=null;world.userData.livingWorld?.dispose();world.userData.livingWorld=null;world.userData.atmosphere?.dispose();world.userData.atmosphere=null;world.userData.dressing?.dispose();world.userData.dressing=null;while(world.children.length){const obj=world.children[0];world.remove(obj);obj.traverse(o=>{if(o.geometry&&!o.userData.sharedAssetGeometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose();if(o.material&&!o.userData.sharedAssetGeometry&&!Object.values({stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow}).includes(o.material)){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.dispose()}})}for(const a of actors.values())disposeActor(a);actors.clear()}
function buildWorld(s){clearWorld();worldFloor=s.run+'-'+s.floor;world.userData.sceneKey=worldFloor;world.userData.foregroundProps=[];world.userData.baseColumnRoots=[];world.userData.baseArchRoots=[];world.userData.baseShrineRoots=[[],[]];world.userData.staticDetailBatches=[];lastCutawayKey='';
 // Original authored Warden Court is one open physical combat volume; every
 // decorative clearance is mapped to the genuine floor/entrance topology.
 const wardenArena=planWardenArenaStage(s.map,s.exit,
  planConnectedDungeonJourney(s.map,s.floor,s.exit,s.units));
 let courtFloorAccentsSuppressed=0,courtShrinesSuppressed=0;
 // The main InstancedMesh wall blocks previously had a near-black flat surface
 // even while the exposed masonry facades were textured. One shared original
 // 128px PBR albedo gives every overhead-visible top/side real stone courses.
 // Floor changes dispose the previous GPU texture; failure retains safe stone.
 try{
  const pixels=makeWallMasonryPixels(s.floor,128);
  if(pixels.length===128*128*4){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
   const ctx=canvas.getContext('2d');
   if(ctx){
    const image=ctx.createImageData(128,128);image.data.set(pixels);ctx.putImageData(image,0,0);
    const next=new THREE.CanvasTexture(canvas);
    next.colorSpace=THREE.SRGBColorSpace;next.wrapS=next.wrapT=THREE.RepeatWrapping;next.anisotropy=4;
    wallMasonryTexture?.dispose();wallMasonryTexture=next;
    stone.map=wallMasonryTexture;stone.bumpMap=softwareWebGL?null:wallMasonryTexture;stone.bumpScale=softwareWebGL?0:.04;
    stone.color.set('#e4e9eb');stone.needsUpdate=true;
   }
  }
 }catch(error){console.warn('[DUNGEON] original masonry texture unavailable, retaining simple wall material:',String(error))}

 const theme=floorThemes[(s.floor-1)%floorThemes.length];scene.background=new THREE.Color(theme.sky);scene.fog.color.set(theme.fog);moon.color.set(theme.fill);ambient.intensity=1.95;
 // Re-grade the actual existing instanced surfaces and key/fill lights on floor change only.
 stone.color.set(theme.wallTint);floorMat.color.set(theme.floorTint);stoneEdge.color.set(theme.trimTint);
 partyGlow.color.set(theme.partyFill);partyGlow.intensity=theme.partyIntensity;
 const floors=[],walls=[],trim=[];const size=s.map.length,offset=Math.floor(size/2);
 const wallIndexByTile=new Int32Array(size*size).fill(-1);
 const sculpture=planFracturedWallStone(s.floor);
 const fracturedWall=new THREE.BufferGeometry();
 fracturedWall.setAttribute('position',new THREE.Float32BufferAttribute(sculpture.vertices,3));
 fracturedWall.setAttribute('uv',new THREE.Float32BufferAttribute(sculpture.uvs,2));
 fracturedWall.setIndex(sculpture.indices);fracturedWall.computeVertexNormals();
  const wallProfiles=planDungeonWallProfiles(s.map,s.floor),wallHeights=wallProfiles.map(p=>p.height);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=x-offset,pz=z-offset;
  if(s.map[z][x]==='.'){floors.push([px,-.10,pz]);if((x*13+z*7)%11===0)trim.push([px,-.028,pz])}
  else {wallIndexByTile[z*size+x]=walls.length;walls.push([px,1.27,pz]);}
 }
 // Replace selected repeated wall-box tops with sculpted pointed vaults;
 // the entire authority map stays solid and collision/pathfinding unchanged.
 const vaultedSites=planVaultedWallBays(s.map,s.floor,s.exit);
 const vaultedTileKeys=new Set(vaultedSites.map(site=>site.gridZ*size+site.gridX));
 const vaultedWallIndices=vaultedSites.map(site=>wallIndexByTile[site.gridZ*size+site.gridX]);
 const spectatorMassing=planLegibleWallMass(s.map,s.floor,vaultedSites);
  for(let i=0;i<wallHeights.length;i++)wallHeights[i]=spectatorMassing[i]??wallHeights[i];
 const instance=(geometry,material,data,scale,heights=null)=>{const mesh=new THREE.InstancedMesh(geometry,material,data.length);const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scaling=new THREE.Vector3(...scale);for(let i=0;i<data.length;i++){position.set(...data[i]);if(heights){position.y=heights[i]/2-.03;scaling.y=heights[i];const weather=planWallStoneVariation(data[i][0],data[i][2],s.floor);quaternion.setFromAxisAngle(wallVertical,weather.yaw);mesh.setColorAt(i,new THREE.Color().setRGB(weather.shade,weather.shade,weather.shade));}matrix.compose(position,quaternion,scaling);mesh.setMatrixAt(i,matrix)}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=!reduced;mesh.receiveShadow=true;world.add(mesh)};
 instance(geo.cube,floorMat,floors,[.99,.16,.99]);
 world.userData.expeditionStonework=createExpeditionStonework(world,s.map,s.floor,s.exit,{softwareWebGL});
 world.userData.floorRuins=createFloorRuins(world,s.map,s.floor,s.exit);
 instance(fracturedWall,stone,walls,[1.015,2.6,1.015],wallHeights);
 world.userData.wallSculpture={sculpted:true,variants:4,wallCount:walls.length,stoneTriangles:sculpture.indices.length/3,profile:'five carved courses with irregular twelve-facet crowns',collisionEffects:0};world.userData.walls=world.children[world.children.length-1];world.userData.wallPositions=walls.map(([x,,z])=>[x,z]);world.userData.wallHeights=wallHeights;world.userData.wallCutawayBands=createCutawayBandCache(walls.length);world.userData.vaultedGallery=createVaultedWallGallery(world,vaultedSites,vaultedWallIndices,s.floor);
  const exposedProfiles=wallProfiles.map((profile,i)=>({...profile,renderHeight:wallHeights[i]})).filter(profile=>profile.exposedFaces>0);
  world.userData.wallProfileMetrics={totalWalls:wallProfiles.length,exposedWalls:exposedProfiles.length,distinctHeights:new Set(exposedProfiles.map(profile=>profile.renderHeight)).size,minHeight:exposedProfiles.length?Math.min(...exposedProfiles.map(profile=>profile.renderHeight)):0,maxHeight:exposedProfiles.length?Math.max(...exposedProfiles.map(profile=>profile.renderHeight)):0};
 instance(geo.cube,stoneEdge,trim,[.86,.02,.86]);
 // Multiple architecturally distinct layers: foundation courses, arches, broken stone tiles and inlaid runes.
 const topBricks=[],footBricks=[],foundationBrickWallIndices=[],runes=[],stonePavers=[],shards=[],caps=[];
 const fracture=(x,z)=>((x*73+z*139+s.floor*41+4096)&1023);
  const wallHeightAt=new Map(wallProfiles.map((profile,i)=>[profile.z*size+profile.x,wallHeights[i]]));
 for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++){
  const wx=x-offset,wz=z-offset,f=fracture(x,z);
  if(s.map[z][x]==='#'){
   if(f%11===0&&!vaultedTileKeys.has(z*size+x))topBricks.push([wx,(wallHeightAt.get(z*size+x)??2.6)-.07,wz]);
   if(f%7===0){footBricks.push([wx,.1,wz]);foundationBrickWallIndices.push(wallIndexByTile[z*size+x]);}
   if(s.map[z-1][x]==='.'&&f%13===0&&!vaultedTileKeys.has(z*size+x))caps.push([wx,(wallHeightAt.get(z*size+x)??2.6)+.03,wz-.34]);
  }else if(wardenArena.clearCourtTile(x,z)){
   // Generic blocky surface rubble, trim pavers and glows formerly competed
   // directly with the true 23+ Warden warning cells and native feet.
   // The actual solid stone floor, authored procession, danger carvings,
   // movement space and collision all remain fully intact.
   courtFloorAccentsSuppressed+=Number(f%4===0)+Number(f%17===0)+Number(f%11===0);
  }else{
   if(f%4===0)stonePavers.push([wx,-.005,wz]);
   if(f%17===0)runes.push([wx,.008,wz]);
   if(f%11===0)shards.push([wx+.26,.10,wz-.22]);
  }
 }
 const ornament=mat(theme.accent,.5,.5),blackStone=mat('#171c29',.15,.98),runeMat=new THREE.MeshStandardMaterial({color:theme.torch,emissive:theme.torch,emissiveIntensity:1.6,roughness:.35});
 const garnish=(material,data,scale)=>{if(!data.length)return null;const mesh=new THREE.InstancedMesh(geo.cube,material,data.length);const m=new THREE.Matrix4(),p=new THREE.Vector3(),sc=new THREE.Vector3(...scale),rot=new THREE.Quaternion();
  for(let i=0;i<data.length;i++){p.set(...data[i]);m.compose(p,rot,sc);mesh.setMatrixAt(i,m)}mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;world.add(mesh);return mesh};
 world.userData.parapets=garnish(stoneEdge,topBricks,[1.04,.12,1.04]);world.userData.parapetPositions=topBricks.map(([x,,z])=>[x,z]);world.userData.parapetHeights=topBricks.map(([,y])=>y);world.userData.parapetCutawayBands=new Uint8Array(topBricks.length);
 world.userData.foundationMesh=garnish(blackStone,footBricks,[1.035,.21,1.035]);
 world.userData.foundationBrickPositions=footBricks;
 world.userData.foundationBrickWallIndices=foundationBrickWallIndices;
 // The instanced GPU transforms start intact; only actual changed bands upload.
 world.userData.foundationCutawayBands=new Uint8Array(footBricks.length);
 garnish(stoneEdge,stonePavers,[.86,.025,.86]);garnish(runeMat,runes,[.52,.009,.10]);
 garnish(ornament,caps,[.30,.23,.35]);garnish(blackStone,shards,[.16,.17,.20]);
 // A bounded procession of genuinely sculpted, OPEN pointed ribs replaces
 // thick block lintels across the real traversable corridor. Sightline
 // cutaways remove frames ahead of the camera; no collision/grid change.
 const archRibGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.43,1.61,0),new THREE.Vector3(-.40,1.82,0),
  new THREE.Vector3(-.22,2.06,0),new THREE.Vector3(0,2.25,0),
  new THREE.Vector3(.22,2.06,0),new THREE.Vector3(.40,1.82,0),
  new THREE.Vector3(.43,1.61,0)
 ]),28,.067,7,false);
 world.userData.archRibGeometry=archRibGeometry;
 let archCount=0;
 for(let z=2;z<size-2;z++)for(let x=2;x<size-2;x++){
   if(archCount>=4||s.map[z][x]!=='.'||fracture(x,z)%19!==0)continue;
   const horizontal=s.map[z][x-1]==='.'&&s.map[z][x+1]==='.';
   const vertical=s.map[z-1][x]==='.'&&s.map[z+1][x]==='.';
   if(!horizontal&&!vertical)continue;
   const ax=x-offset,az=z-offset,arch=new THREE.Group();arch.position.set(ax,0,az);
   if(horizontal)arch.rotation.y=Math.PI/2;
   make(geo.cylinder,stoneEdge,arch,-.43,.85,0,.090,.83,.095);
   make(geo.cylinder,stoneEdge,arch,.43,.85,0,.090,.83,.095);
   const rib=new THREE.Mesh(archRibGeometry,stoneEdge);
   rib.name='Open processional ogive';rib.castShadow=false;
   rib.userData.sharedAssetGeometry=true;arch.add(rib);
   make(geo.sphere,gold,arch,0,2.22,0,.09,.12,.09);
   world.add(arch);world.userData.foregroundProps.push(arch);world.userData.baseArchRoots.push(arch);archCount++;
 }

 // Lit path markers, carved stone columns and modest dynamic lighting budget.
 // No unsupported 2m freestanding torch-column beside the real boss.
 // Warden light/ceremony already comes from the actual linked ritual stage.
 // Four old corner columns were freestanding even without a real opening.
 // Place at most four much smaller original lamps on actual perimeter wall
 // supports, only where a genuine traversable cell faces each wall.
 const perimeterSconces=planPerimeterWallLanterns(s.map,s.units);
 perimeterSconces.forEach((site,i)=>perimeterWallSconce(world,site,i));
 world.userData.perimeterWallLanterns={wallSupported:perimeterSconces.length,
  unsupportedFreestandingColumns:0,authorityChanges:0};
 // Ruined altars and relic vaults are used sparingly to preserve navigational readability.
 const openCells=floors.filter(([x,,z])=>(Math.abs(x)+Math.abs(z))>3&&Math.abs(x)+Math.abs(z)<22);
 let placed=0;
 for(const [px,,pz] of openCells){if(placed>=5)break;const k=fracture(px+offset,pz+offset);
  if(k%47!==0)continue;
  if(wardenArena.clearCourtTile(px+offset,pz+offset)){courtShrinesSuppressed++;continue;}
  placed++;
  const shrine=new THREE.Group();shrine.position.set(px,.02,pz);
  make(geo.cylinder,stoneEdge,shrine,0,.13,0,.24,.24,.24);
  make(geo.cylinder,gold,shrine,0,.27,0,.20,.045,.20);
  const gem=make(geo.cone,k%2?tealGlow:dangerGlow,shrine,0,.49,0,.12,.37,.12);gem.rotation.z=.1;world.add(shrine);world.userData.foregroundProps.push(shrine);world.userData.baseShrineRoots[k%2].push(shrine);
 }

 const pos=new THREE.Vector3(s.exit.x-offset,.05,s.exit.z-offset);
 const dais=make(geo.cylinder,stoneEdge,world,pos.x,.02,pos.z,.64,.15,.64);dais.castShadow=false;
 const portal=new THREE.Group();portal.position.set(pos.x,.28,pos.z);const ring=new THREE.Mesh(new THREE.TorusGeometry(.47,.075,9,40),tealGlow);ring.rotation.x=Math.PI/2;portal.add(ring);
 const inner=new THREE.Mesh(new THREE.CircleGeometry(.43,32),new THREE.MeshBasicMaterial({color:'#27f0cc',transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));inner.rotation.x=-Math.PI/2;portal.add(inner);world.add(portal);world.userData.portal=portal;
 s.relics.forEach((r,i)=>{const gem=make(new THREE.OctahedronGeometry(.19,0),tealGlow,world,r.x-offset,.4,r.z-offset,.8,1.2,.8);gem.userData.relic=i});
 // Relocate the original Warden Gothic crown to a TRUE route threshold.
 // The connected-journey director already supplies the two structural piers
 // on actual BLOCKED masonry. We do not plant two fictional gate columns in
 // the centre of a source-backed melee/hazard arena. No real threshold means
 // no pretended doorway: the physical Warden court and portal remain intact.
 const supportedGate=wardenArena.gate;
 if(supportedGate){
  const bossGate=new THREE.Group();bossGate.name='Open Warden court gate';
  bossGate.position.set(supportedGate.x,0,supportedGate.z);
  bossGate.rotation.y=supportedGate.yaw;
  const bossArch=new THREE.Mesh(archRibGeometry,stoneEdge);
  bossArch.name='Wall-supported original Warden threshold crown';
  bossArch.scale.set(1.92,1.03,1);bossArch.castShadow=false;
  bossArch.receiveShadow=true;bossArch.userData.sharedAssetGeometry=true;
  bossGate.add(bossArch);
  make(geo.cube,gold,bossGate,0,2.30,0,.16,.16,.16);
  world.add(bossGate);world.userData.foregroundProps.push(bossGate);
 }
 world.userData.openWardenGate=Boolean(supportedGate);
 world.userData.wardenStageClarity={
  courtFloorAccentsSuppressed,courtShrinesSuppressed,
  removedUnsupportedBossColumns:3,realSupportedThreshold:Boolean(supportedGate),
  gateSupportCells:supportedGate?.realBlockedSupports??0,
  source:wardenArena.source,authorityChanges:wardenArena.authorityChanges
 };
 // Warden court: layered ceremonial dais, spatially legible runes and shield ring.
 const court=new THREE.Group();court.position.set(pos.x,.03,pos.z);
 const courtGlow=new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide});
 const outer=new THREE.Mesh(new THREE.TorusGeometry(1.35,.033,6,72),courtGlow);outer.rotation.x=-Math.PI/2;court.add(outer);
 const middle=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,8,68),courtGlow);middle.rotation.x=-Math.PI/2;court.add(middle);
 const ink=new THREE.MeshStandardMaterial({color:'#1b2850',metalness:.8,roughness:.26});
 // The twelve source-identical court glyphs share two original materials.
 // Retain the rotating court parent and all transforms; only draw submission is batched.
 const courtGlyphs=Array.from({length:12},(_,i)=>{
  const a=i*Math.PI/6;
  return {material:i%3===0?gold:tealGlow,position:[Math.cos(a)*1.21,.03,Math.sin(a)*1.21],
   rotationY:-a,scale:[.18,.04,.05]};
 });
 world.userData.staticDetailBatches.push(createRetainedStaticDetailBatches(
  THREE,court,geo.cube,courtGlyphs,{castShadow:!reduced}));
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,x=Math.cos(a)*1.66,z=Math.sin(a)*1.66;
  if(x+pos.x>8.6||z+pos.z>8.6||x+pos.x< -8.6||z+pos.z< -8.6)continue;
  const spire=make(geo.cone,ink,court,x,.44,z,.19,.88,.19);spire.rotation.z=Math.sin(a)*.10;
  make(geo.sphere,i%2?dangerGlow:tealGlow,court,x,.90,z,.14,.14,.14);
 }
 const shield=new THREE.Mesh(new THREE.TorusGeometry(1.32,.04,8,72),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}));shield.rotation.x=-Math.PI/2;shield.position.y=.12;court.add(shield);
 world.add(court);world.userData.court=court;world.userData.courtGlow=courtGlow;world.userData.courtShield=shield;
 world.userData.wardenRitual=createWardenRitual(world,s.exit,{reducedMotion:reduced,map:s.map});
 world.userData.wardenImpactScars=createWardenImpactScars(world,s.map,{reducedMotion:reduced});
 // Interactive hazard meshes directly reflect authoritative trap state.
 const hazardMeshes=new Map();
 for(const t of s.traps||[]){
  const hazard=new THREE.Group();hazard.position.set(t.x-offset,.018,t.z-offset);
  const fire=t.kind==='ember',base=new THREE.Mesh(new THREE.CylinderGeometry(.44,.47,.08,12),stoneEdge);base.position.y=.02;hazard.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.048,8,32),fire?dangerGlow:tealGlow);ring.rotation.x=-Math.PI/2;ring.position.y=.077;hazard.add(ring);
  // Preserve all six exact authoritative trap markings and source materials.
  // Their parent still scales on disarm, so draw consolidation cannot lie about the trap.
  const trapGlyphs=Array.from({length:6},(_,k)=>{
   const angle=k*Math.PI/3,r=.30;
   return {material:k%2?gold:fire?dangerGlow:tealGlow,
    position:[Math.cos(angle)*r,.10,Math.sin(angle)*r],rotationY:angle,scale:[.09,.028,.055]};
  });
  world.userData.staticDetailBatches.push(createRetainedStaticDetailBatches(
   THREE,hazard,geo.cube,trapGlyphs,{castShadow:!reduced}));
  const charge=make(geo.cone,fire?dangerGlow:tealGlow,hazard,0,.23,0,.11,.25,.11);
  hazard.userData={charge,ring,active:t.active};world.add(hazard);hazardMeshes.set(t.id,hazard);
 }
 world.userData.hazardMeshes=hazardMeshes;
 world.userData.dressing=enrichEnvironment(world,s.map,s.floor,vaultedSites,s.exit,s.units,s.traps,{softwareWebGL});
 world.userData.chapterNaves=createChapterNaves(world,s.map,s.exit,s.floor,{
  reducedMotion:reduced,encounterUnits:s.units
 });
 world.userData.atmosphere=createBiomeAtmosphere(world,s.map,s.floor,s.exit);
 world.userData.livingWorld=createLivingWorld(world,s.map,s.floor);
 const authoredSceneKey=worldFloor;
 world.userData.authoredProps=putEnvironment(world,authoredSceneKey,s.map,()=>{
  // Imported world models are asynchronous. The initial empty source group
  // must NOT stay as the physical camera's permanent occluder cache.
  // Ignore late completions from previous floors and original run scenes.
  if(world.userData.sceneKey!==authoredSceneKey)return;
  world.userData.authoredPropVolumes=captureForegroundVolumes(
   THREE,world.userData.authoredProps?.group?.children||[]);
  world.userData.cameraPropVolumes=[...world.userData.foregroundPropVolumes,
   ...(world.userData.dressing?.occlusionPropVolumes||[]),
   ...world.userData.authoredPropVolumes].filter(Boolean).slice(0,160);
  indexRenderedForegroundStageSources();
  },s.units);
 // Cache original geometry ONCE per floor; no per-frame geometry scans.
 // The same genuine stone groups continue to drive camera obstruction, but
 // their repeated source primitives render in retained batches. Recession is
 // synchronized after the physical camera decisions every frame below.
 world.userData.baseWorldArchitecturalBatches=createBaseWorldArchitecturalBatches(
  THREE,world,{columns:world.userData.baseColumnRoots,
   arches:world.userData.baseArchRoots,
   shrines:world.userData.baseShrineRoots[0]});
 // The alternate relic finish is a distinct material and fails closed rather
 // than being misrendered as an apparently identical shader/material batch.
 world.userData.baseWorldArchitecturalBatchesAlt=createBaseWorldArchitecturalBatches(
  THREE,world,{shrines:world.userData.baseShrineRoots[1]});
 world.userData.foregroundPropVolumes=captureForegroundVolumes(THREE,world.userData.foregroundProps);
 world.userData.authoredPropVolumes=captureForegroundVolumes(THREE,world.userData.authoredProps?.group?.children||[]);
 world.userData.cameraPropVolumes=[...world.userData.foregroundPropVolumes,
  ...(world.userData.dressing?.occlusionPropVolumes||[]),
  ...world.userData.authoredPropVolumes].filter(Boolean).slice(0,160);
 indexRenderedForegroundStageSources();
 // On known CPU WebGL only, keep the two nearest original decorative warm
 // practicals instead of evaluating every torch per PBR fragment. Original
 // hero, Warden, chapter combat and warning lights are never candidates.
 world.userData.softwareWorldRasterTier=applySoftwareWorldRasterTier(THREE,world,{software:softwareWebGL,authoredRoot:world.userData.authoredProps?.group});
 world.userData.softwareWorldLights=createSoftwareWorldLightBudget(THREE,world,{software:softwareWebGL,maxDecorativeLights:2});
}
function rig(u){const colors=palette[u.kind],main=mat(colors[0],.5,.4),light=mat(colors[1],.45,.4),accent=mat(colors[2],.55,.3),enemy=u.faction==='enemy',boss=u.kind==='warden';
 const root=new THREE.Group(),impactPivot=new THREE.Group(),body=new THREE.Group();root.add(impactPivot);impactPivot.add(body);const scale=boss?WARDEN_STAGE_PROFILE.worldScale:enemy?1.04:1;root.scale.setScalar(scale);
 const torso=make(geo.cylinder,main,body,0,1.03,0,.29,.60,.22);torso.rotation.z=enemy ? .08 : 0;
 make(geo.cube,light,body,0,1.20,-.14,.47,.21,.38);
 // Individually recognisable silhouettes: armoured knight, leather ranger, robed spellcaster, and towering boss.
 for(const side of [-1,1]){
   const shoulder=make(geo.sphere,light,body,side*.37,1.33,0,.24,.16,.23);shoulder.rotation.z=side*.26;
   const shoulderRim=make(geo.cube,accent,body,side*.37,1.31,-.19,.26,.09,.08);shoulderRim.rotation.z=side*.22;
   make(geo.cylinder,main,body,side*.16,.86,0,.14,.13,.14);
 }
 const belt=make(geo.cube,gold,body,0,.84,-.16,.50,.085,.31);belt.castShadow=false;
 if(u.kind==='mystic'||u.kind==='cultist'){
   const mantle=make(geo.cone,main,body,0,.62,0,.39,.91,.32);
   mantle.rotation.z=.02;make(geo.sphere,accent,body,0,1.21,-.28,.11,.12,.06);
 }
 if(u.kind==='vanguard'||boss){make(geo.cube,accent,body,0,1.35,-.272,.22,.22,.035);}
 if(u.kind==='ranger'){const hood=make(geo.cone,main,body,0,1.81,.055,.30,.37,.32);hood.rotation.x=.18;}

 const head=make(geo.sphere,light,body,0,1.58,0,.23,.25,.22);
 const helm=make(geo.cylinder,main,body,0,1.77,0,.25,.16,.25);helm.rotation.z=.06;
 const crown=make(geo.cone,accent,body,0,1.97,.01,boss?.23:.09,boss?.46:.27,boss?.23:.09);
 if(boss){for(const side of [-1,1]){const blade=make(geo.cone,accent,body,side*.24,1.95,0,.10,.52,.10);blade.rotation.z=-side*.26}
  const shoulderSpikes=make(geo.cone,accent,body,-.40,1.64,0,.14,.39,.14);shoulderSpikes.rotation.z=.35;
 }

 const face=make(geo.cube,enemy?dangerGlow:tealGlow,body,0,1.59,-.212,.25,.055,.065);face.castShadow=false;
 const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.15,.73,0);rightLeg.position.set(.15,.73,0);body.add(leftLeg,rightLeg);
 make(geo.cylinder,main,leftLeg,0,-.3,0,.105,.59,.12);make(geo.cylinder,main,rightLeg,0,-.3,0,.105,.59,.12);
 const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.35,1.27,0);rightArm.position.set(.35,1.27,0);body.add(leftArm,rightArm);
 make(geo.cylinder,light,leftArm,0,-.25,0,.12,.51,.12);make(geo.cylinder,light,rightArm,0,-.25,0,.12,.51,.12);
 if(enemy){const horn=mat(colors[2],.25,.75);for(const side of [-1,1]){const h=make(geo.cone,horn,body,side*.18,1.99,0,.10,.34,.10);h.rotation.z=-side*.27}}
 if(u.kind==='vanguard'||u.kind==='warden'){const blade=make(geo.cube,accent,rightArm,.10,-.55,-.08,.07,.73,.14);blade.rotation.z=-.28;make(geo.cube,gold,rightArm,.10,-.33,-.08,.31,.055,.16);make(geo.cube,main,leftArm,-.1,-.48,-.25,.35,.4,.10)}
 if(u.kind==='mystic'||u.kind==='cultist'){make(geo.cylinder,gold,rightArm,.06,-.57,-.2,.035,.99,.035);const staff=make(geo.sphere,tealGlow,rightArm,.06,-1.05,-.2,.14,.19,.14);staff.castShadow=false}
 if(u.kind==='ranger'){const bow=new THREE.Mesh(new THREE.TorusGeometry(.41,.038,6,18,Math.PI),gold);bow.rotation.y=Math.PI/2;bow.rotation.z=.3;bow.position.set(.12,-.5,-.15);rightArm.add(bow)}
 // A sculpted cloth panel gives each character a readable silhouette from the stream camera.
 const cloak=make(geo.cube,main,body,0,.82,.18,.55,.96,.1);cloak.rotation.x=-.11;
 const base=new THREE.Mesh(new THREE.CircleGeometry(.38,20),new THREE.MeshBasicMaterial({color:enemy?'#c04a53':'#43b3a7',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;base.position.y=.018;root.add(base);
 let telegraph=null;
 if(boss){telegraph=new THREE.Mesh(new THREE.RingGeometry(1.85,2.03,56),new THREE.MeshBasicMaterial({color:'#ff7049',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));telegraph.rotation.x=-Math.PI/2;telegraph.position.y=.025;telegraph.visible=false;root.add(telegraph);}
 const detail=enrichCharacter(u,{root,body,leftLeg,rightLeg,leftArm,rightArm});
 scene.add(root);return {root,impactPivot,body,leftLeg,rightLeg,leftArm,rightArm,detail,telegraph,u,at:new THREE.Vector3(u.x-9,0,u.z-9)};
}
const timeNow=()=>performance.now()/1000;
// Read-only spectator projections never mutate simulation state.
const minimap=$('minimap'),mini=minimap.getContext('2d',{alpha:false}),mapPalette={wall:'#273653',floor:'#15233e',traced:'#477091',hero:'#5bf9e2',enemy:'#ff6f9c',exit:'#65baff',loot:'#ffd277'};
let previousEventKey='',alertTimer=null,ambience=null,soundstage=null,splashTimer=null,lastBiome='';
// Test/review recording exposes only the spectator's already opt-in audio bus.
// No simulated soundtrack, private game state, or recording network endpoint.
window.__DUNGEON_CAPTURE_SOUND__=()=>soundstage?.captureStream()??null;
 // The real browser-original soundtrack, explicitly opted-in, can be tapped
 // without relying on zero-byte software-WebGL canvas MediaRecorder.
 window.__DUNGEON_RECORD_ORIGINAL_PCM__=seconds=>soundstage?.recordOriginalPcm(seconds)??Promise.resolve({status:'UNAVAILABLE',reason:'Audio not opted in'});
const classMeta={vanguard:{name:'ASHEN VANGUARD',title:'FRONT-LINE KNIGHT',icon:'⚔'},ranger:{name:'WILDSHADOW',title:'PHANTOM ARCHER',icon:'➶'},mystic:{name:'STARWEAVER',title:'ARCANE HEALER',icon:'✧'}};
function drawMinimap(s){
 const N=s.map.length,W=minimap.width,H=minimap.height,cell=W/N,margin=0;
 mini.fillStyle='#0d1529';mini.fillRect(0,0,W,H);
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const solid=s.map[z][x]!=='#',px=Math.floor(x*cell),pz=Math.floor(z*cell);
  mini.fillStyle=solid?((x+z)%3===0?'#223952':mapPalette.floor):mapPalette.wall;
  mini.fillRect(px,pz,Math.ceil(cell),Math.ceil(cell));
  if(solid){mini.strokeStyle='#476d9050';mini.lineWidth=.35;mini.strokeRect(px+.3,pz+.3,cell-.6,cell-.6)}
 }
 const cx=x=>x*cell+cell/2,cz=z=>z*cell+cell/2;
 mini.fillStyle='#45ffe2';mini.shadowBlur=13;mini.shadowColor='#45ffe2';
 mini.beginPath();mini.arc(cx(s.exit.x),cz(s.exit.z),cell*.36,0,Math.PI*2);mini.fill();mini.shadowBlur=0;
 mini.fillStyle=mapPalette.loot;for(const r of s.relics){mini.fillRect(cx(r.x)-2,cz(r.z)-2,4,4)}
 for(const trap of s.traps||[]){if(trap.disarmed)continue;mini.fillStyle=trap.active?'#ff9a73':'#b48270';const x=cx(trap.x),z=cz(trap.z);mini.fillRect(x-2.5,z-2.5,5,5);mini.fillStyle='#2b1a36';mini.fillRect(x-1,z-1,2,2)}
 for(const u of s.units){if(u.hp<=0)continue;mini.beginPath();mini.fillStyle=u.faction==='party'?mapPalette.hero:mapPalette.enemy;mini.strokeStyle=u.faction==='party'?'#d9fffd':'#ffd2d9';mini.lineWidth=1.2;mini.arc(cx(u.x)+(u.id==='ranger'?2:u.id==='mystic'?-2:0),cz(u.z),u.kind==='warden'?cell*.46:cell*.29,0,Math.PI*2);mini.fill();mini.stroke()}
 mini.strokeStyle='#72d5e860';mini.lineWidth=1;mini.strokeRect(.5,.5,W-1,H-1);
}
function notifyDungeon(event){
 if(event.kind!=='floor'&&!isSceneAlert(event))return;
 if(event.kind==='floor'){const splash=$('floor-splash');clearTimeout(splashTimer);splash.hidden=false;const match=event.text.match(/^FLOOR (\d+) · (.+)$/);$('splash-floor').textContent=match?match[1].padStart(2,'0'):String(state?.floor??'02').padStart(2,'0');$('splash-name').textContent=match?match[2]:state?.theme??'THE NEXT CHAPTER';splashTimer=setTimeout(()=>{splash.hidden=true},reduced?800:2400)}
 const banner=$('alert-flash');clearTimeout(alertTimer);banner.hidden=false;
 banner.textContent=event.kind==='telegraph'?'⚠  '+event.text.toUpperCase():event.kind==='floor'?'✦  '+event.text.toUpperCase():event.kind==='defeat'?'☠  '+event.text.toUpperCase():event.text.toUpperCase();
 banner.dataset.kind=event.kind;
 alertTimer=setTimeout(()=>{banner.hidden=true},event.kind==='telegraph'?1400:1900);
}
// Browsers without an active audio device must never freeze the video UI.
const settleAudio=(promise,timeout=1400)=>new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(new Error('audio device did not respond')),timeout);
 Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)});
});
$('audio-toggle').addEventListener('click',async()=>{
 const button=$('audio-toggle'),label=button.querySelector('span');
 const setEnabled=enabled=>{button.setAttribute('aria-pressed',String(enabled));label.textContent=enabled?'Sound on':'Sound off'};
 if(!ambience){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){setEnabled(false);button.title='Audio unavailable in this browser';return}
  try{ambience=new Audio()}catch(error){setEnabled(false);button.title='Audio output device unavailable';return}
 }
 if(button.getAttribute('aria-pressed')==='true'){
  setEnabled(false);soundstage?.disable();
  try{await settleAudio(ambience.suspend());button.removeAttribute('title')}
  catch(error){button.title='Audio device could not be suspended'}
  return;
 }
 // An AudioContext may already be running before the first click; only
 // explicit user intent can toggle this opt-in spectator audio control.
 try{
  await settleAudio(ambience.resume());
  if(ambience.state!=='running')throw Error('Audio output remains suspended');
  if(!soundstage)soundstage=createDungeonSoundstage(ambience,{reducedMotion:reduced});
  if(!soundstage?.enable())throw Error('Original soundstage failed to initialize');
  if(state)soundstage.acceptSnapshot(state);
  setEnabled(true);button.removeAttribute('title');soundstage.cueWelcome();
 }catch(error){
  soundstage?.disable();setEnabled(false);button.title='Audio blocked or unavailable in this browser';
  Promise.resolve(ambience.suspend()).catch(()=>{});
 }
});
function renderDashboard(s){
 // Real living combat earns a legible full-height mobile 3D stage.
 // Rendering only; the authoritative expedition is unchanged.
 document.body.dataset.encounterStage=planEncounterViewport(s);
 const biome=['sunken','ember','obsidian','hollow'][(s.floor-1)%4];if(biome!==lastBiome){document.body.dataset.biome=biome;lastBiome=biome;}
 const heroes=s.units.filter(u=>u.faction==='party'),alive=heroes.filter(u=>u.hp>0).length,foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0);
 const boss=s.units.find(u=>u.kind==='warden'),nearBoss=boss&&boss.hp>0&&heroes.some(h=>h.hp>0&&Math.abs(h.x-boss.x)+Math.abs(h.z-boss.z)<6);
 // Follow the authoritative boss's real release tick; recovery can begin
 // immediately on that SAME tick, but its counter label must not erase the hit.
 const wardenRelease=Boolean(nearBoss&&Number.isSafeInteger(s.tick)&&
  boss.action==='cast'&&boss.actionTick===s.tick);
  const tactical=planWardenTacticalCue(s,{nearBoss});
 $('floor').textContent=String(s.floor).padStart(2,'0');$('chapter').textContent=String(s.floor).padStart(2,'0');
 $('theme').textContent=s.theme;$('run').textContent=String(s.run).padStart(3,'0');$('tick').textContent='TICK '+String(s.tick).padStart(5,'0');
 $('kills').textContent=s.kills.toLocaleString();$('gold').textContent=s.gold.toLocaleString();$('level').textContent=s.level;
 $('intent').textContent=s.intent;$('reasoning').textContent=s.intent;
 $('party-count').textContent=alive+' / '+heroes.length;$('party-condition').textContent=alive===heroes.length?'READY':alive?'COMPROMISED':'FALLEN';
 $('status').textContent=s.phase==='intermission'?'THE NEXT EXPEDITION IS FORMING':'AI HEROES EXPLORING THE UNKNOWN';
 $('floor-status').textContent=s.phase==='intermission'?'REASSEMBLING':
  s.guardianWard?'BINDING GUARDS · '+s.defendersRemaining:
  tactical?.floor??(foes.length?'CLEARING THE CRYPT':'PORTAL UNLOCKED');
 const remaining=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
 $('depth-fill').style.width=Math.max(8,Math.min(100,100-(remaining/(s.units.filter(u=>u.faction==='enemy').length||1)*92)))+'%';
 const bossStrip=$('boss-strip');bossStrip.hidden=!nearBoss;
 document.body.dataset.wardenFocus=nearBoss?'true':'false';
 if(boss){const percent=Math.max(0,Math.round(boss.hp/boss.maxHp*100));$('boss-hp').textContent=percent+'%';$('boss-bar').style.width=percent+'%';
  const phase=s.bossPhase||'SENTINEL',exposed=Number.isInteger(s.bossRecovery?.remaining)&&s.bossRecovery.remaining>0;
  $('boss-phase').textContent=tactical?.label??phase;
   bossStrip.dataset.phase=phase;bossStrip.dataset.warded=String(Boolean(s.guardianWard));bossStrip.dataset.recovery=String(exposed);
  bossStrip.dataset.striking=String(wardenRelease);
  const attackInterval=phase==='ECLIPSE'?4:6;
  bossStrip.dataset.warning=String(Boolean(s.bossWarning));
 }
 $('scene-weather').textContent=s.theme.includes('EMBER')?'FIRELIT // ASH':s.theme.includes('OBSIDIAN')?'ARCANE // MIST':s.theme.includes('HOLLOW')?'ETHEREAL // VOID':'MOONLIT // CRYPT';
 const party=$('party');
 // Stable keyed DOM cards: never detach spectator controls on every state tick.
 const activeIds=new Set(heroes.map(u=>u.id));
 for(const old of [...party.children])if(!activeIds.has(old.dataset.heroId))old.remove();
 heroes.forEach((u,i)=>{
  const meta=classMeta[u.kind];let card=[...party.children].find(el=>el.dataset.heroId===u.id);
  if(!card){
   card=document.createElement('article');card.className='hero-card';card.dataset.heroId=u.id;
   card.tabIndex=0;card.setAttribute('role','button');
   const icon=document.createElement('div');icon.className='hero-icon';icon.setAttribute('aria-hidden','true');
   const info=document.createElement('div');info.className='hero-info';
   const head=document.createElement('div');head.className='hero-heading';head.append(document.createElement('b'),document.createElement('small'));
   const sub=document.createElement('div');sub.className='hero-sub';sub.append(document.createElement('span'),document.createElement('b'));
   const bar=document.createElement('div');bar.className='life';bar.append(document.createElement('i'));
   info.append(head,sub,bar);card.append(icon,info);
  }
  card.classList.toggle('down',u.hp<=0);card.setAttribute('aria-disabled',String(u.hp<=0));
  card.dataset.class=u.kind;card.dataset.action=u.action||'idle';card.dataset.focused=String(u.hp>0&&u.id===focusedHeroId);
  if(u.kind==='mystic')card.dataset.focusExhausted=String(Number.isInteger(u.focus)&&u.focus<=0);
  card.setAttribute('aria-label','Follow '+meta.name+' in the cinematic camera'+(u.kind==='mystic'?' · healing focus '+(u.focus??'unavailable')+' of '+(u.maxFocus??5):''));
  card.setAttribute('aria-pressed',String(u.hp>0&&u.id===focusedHeroId));
  card.querySelector('.hero-icon').textContent=meta.icon;
  card.querySelector('.hero-heading b').textContent=meta.name;
  card.querySelector('.hero-heading small').textContent=u.hp+'/'+u.maxHp+' HP'+(u.kind==='mystic'?' · ✦'+(Number.isInteger(u.focus)?u.focus:'—'):'');
  card.querySelector('.hero-sub span').textContent=meta.title;
  const covering=u.kind==='vanguard'&&u.hp>0&&u.action==='guard'&&
   u.guardTick===s.tick&&heroes.find(ally=>ally.id===u.targetId&&ally.hp>0);
  card.querySelector('.hero-sub b').textContent=u.hp<=0?'FALLEN':covering?'COVER · '+covering.kind.toUpperCase():(u.action||'idle').toUpperCase();
  card.querySelector('.life i').style.width=(u.hp/u.maxHp*100)+'%';
  if(party.children[i]!==card)party.insertBefore(card,party.children[i]||null);
 });
 const entries=$('events');entries.replaceChildren(...[...s.events].reverse().slice(0,3).map(e=>{
  const li=document.createElement('li');li.style.setProperty('--event-color',({danger:'#ff7f9e',telegraph:'#ffc178',cover:'#e8c58a',kill:'#ffe28f',healing:'#77ffc6',floor:'#b9a4ff',loot:'#78deff'}[e.kind]||'#8bbfff'));
  const time=document.createElement('small');time.textContent='T+'+String(e.tick).padStart(5,'0')+' · '+e.kind.toUpperCase();li.append(time,document.createTextNode(e.text));return li
 }));
 $('map-cells').textContent=s.map.reduce((n,row)=>n+[...row].filter(ch=>ch==='.').length,0)+' TILES';
 $('hazard-count').textContent=(s.traps||[]).filter(t=>!t.disarmed).length+' ACTIVE';
 const models=assetStats(actors);$('visual-fidelity').textContent=models.authoredCharacters>0?'RIGGED 3D ART: '+models.authoredCharacters:'PROCEDURAL MODEL FALLBACK';
 drawMinimap(s);
}

function update(s){const previousState=state,damageBeats=planAuthorityDamageBeats(previousState,s),evasionBeats=planAuthorityEvasions(previousState,s),firstSnapshot=!received,sceneChanged=worldFloor!==s.run+'-'+s.floor;combatOverlay.record(s,timeNow());state=s;received=true;errorAt=0;
 const oldVanguard=previousState?.units?.find(u=>u.id==='vanguard');
 const newVanguard=s.units?.find(u=>u.id==='vanguard');
 if(previousState?.run===s.run&&previousState?.floor===s.floor&&s.tick>previousState.tick&&
  oldVanguard&&newVanguard&&oldVanguard.hp>newVanguard.hp&&
  s.events.some(e=>e.kind==='cover'&&e.tick>previousState.tick&&e.tick<=s.tick&&
   typeof e.text==='string'&&e.text.includes('intercepted')))oathguardImpactAge=0;
 if(previousState?.run===s.run&&previousState?.floor===s.floor&&
    s.tick===previousState.tick+1&&oldVanguard&&newVanguard&&newVanguard.hp>0&&
    newVanguard.action==='move'&&
    Math.abs(newVanguard.x-oldVanguard.x)+Math.abs(newVanguard.z-oldVanguard.z)===1&&
    s.events.some(e=>e.kind==='cover-advance'&&e.tick===s.tick)){
  const ally=s.units.find(u=>u.id===newVanguard.targetId&&u.faction==='party'&&u.hp>0);
  if(ally?.action==='move'&&ally.x===oldVanguard.x&&ally.z===oldVanguard.z){
   oathguardEscapeAge=0;
   oathguardEscapeMark.position.set(oldVanguard.x-9,.092,oldVanguard.z-9);
  }
 }
 // Authority polling is independent of the browser's WebGL lifecycle. Never
 // hide a graphics failure merely because the autonomous game keeps ticking.
 if(!['context-lost','recovering','stalled','failed'].includes(document.body.dataset.rendererStatus))$('recovery').hidden=true;
 const selected=s.units.find(u=>u.id===focusedHeroId&&u.hp>0);
 if(!selected){const survivor=s.units.find(u=>u.faction==='party'&&u.hp>0);if(survivor)focusedHeroId=survivor.id;}
 spectatorUI.render(s);
 for(const e of s.events){const id=s.run+':'+e.tick+':'+e.kind+':'+e.text;if(!seenEventIds.has(id)){seenEventIds.add(id);if(seenEventIds.size>150)seenEventIds.delete(seenEventIds.values().next().value);if(!firstSnapshot){cue(e,s);notifyDungeon(e)}}}
 if(sceneChanged){combatShotContinuity.reset();physicalCameraDirector.reset();impactCameraHold=null;lightInjury=null;buildWorld(s);camera.userData.dungeonInitialized=false;camera.userData.aimInitialized=false;lastRayAuditAt=-Infinity;}
 // Only the authoritative Warden attack which follows its previous public
 // warning can permanently fracture walkable stone. No fake contact.
 world.userData.wardenImpactScars?.accept(previousState,s,timeNow());
 // The same authoritative impact coordinates are used by the dodge AI,
 // spectators and optional warning audio. Static rings remain visible under
 // reduced-motion preferences; there is no added dynamic light or extra draw per actor.
 const hexes=Array.isArray(s.cultistWarnings)?s.cultistWarnings.slice(0,CULTIST_TELL_MAX):[];
 cultistTell.count=hexes.length;
 for(let i=0;i<hexes.length;i++){
  const mark=hexes[i];
  cultistTellMatrix.makeTranslation(mark.x-9,.075,mark.z-9);
  cultistTell.setMatrixAt(i,cultistTellMatrix);
 }
 if(hexes.length)cultistTell.instanceMatrix.needsUpdate=true;
 const breaches=Array.isArray(s.revenantWarnings)?s.revenantWarnings.slice(0,REVENANT_TELL_MAX):[];
 breachDiamond.count=breaches.length;breachSlash.count=breaches.length;
 for(let i=0;i<breaches.length;i++){
  const mark=breaches[i];breachMatrix.makeTranslation(mark.x-9,.078,mark.z-9);
  breachDiamond.setMatrixAt(i,breachMatrix);
  breachSlash.setMatrixAt(i,breachSlashMatrix.multiplyMatrices(breachMatrix,breachRotation));
 }
 if(breaches.length){breachDiamond.instanceMatrix.needsUpdate=true;breachSlash.instanceMatrix.needsUpdate=true;}
 const damageById=new Map(damageBeats.map(beat=>[beat.id,beat]));
 const evadeById=new Map(evasionBeats.map(beat=>[beat.id,beat]));
 if(damageBeats.length){
  const woundedHero=damageBeats.find(beat=>beat.faction==='party');
  if(woundedHero)lightInjury={beat:woundedHero,age:0};
  observedDamageBeats=Math.min(1000000,observedDamageBeats+damageBeats.length);
  observedFatalBeats=Math.min(1000000,observedFatalBeats+damageBeats.filter(beat=>beat.fatal).length);
  const focus=planImpactCameraHold(s,damageBeats);
  if(focus)impactCameraHold={encounter:focus,age:0};
 }
 const stagePositions=planCombatStage(s,camera.position);lastStagePositions=stagePositions;
 crowdedStageActors=Object.values(stagePositions).filter(position=>position.crowded).length;
 const seen=new Set(s.units.map(u=>u.id));
 for(const [id,a] of actors)if(!seen.has(id)){disposeActor(a);actors.delete(id)}
 for(const u of s.units){let a=actors.get(u.id);if(!a){a=rig(u);a.ground=addContactProjection(a,{reducedMotion:reduced});actors.set(u.id,a);a.root.position.set(u.x-9,0,u.z-9);attachCharacter(a,{softwareWebGL})}
  const damage=damageById.get(u.id);
  if(damage)a.damageBeat={...damage,age:-planVerifiedMeleeImpactDelay(damage,s,{reducedMotion:reduced}),contactAge:0};
  else if(u.hp>0&&a.damageBeat?.fatal)a.damageBeat=null;
  if(evadeById.has(u.id))a.evasionBeat={...evadeById.get(u.id),age:0};
  else if(sceneChanged||u.hp<=0)a.evasionBeat=null;
  if(a.u.actionTick!==u.actionTick||a.u.action!==u.action){a.actionStarted=timeNow();a.visualActionAge=0;}a.u=u;a.wardenPhase=u.kind==='warden'?s.bossPhase:null;
  a.wardenRecovery=u.kind==='warden'?s.bossRecovery:null;a.combatFacing=planCombatFacing(u,s.units,s.map);const staged=stagePoint(stagePositions,u);a.at.set(staged.x-9,0,staged.z-9);if(sceneChanged)a.root.position.copy(a.at);a.root.visible=u.hp>0||Boolean(a.damageBeat?.fatal&&a.damageBeat.age<DEATH_BEAT_DURATION)||
   Boolean(s.phase==='intermission'&&u.faction==='party'&&u.hp===0);if(a.telegraph){
   const interval=s.bossPhase==='ECLIPSE'?4:6;
   a.telegraph.visible=u.hp>0&&Boolean(s.bossWarning);
   a.telegraph.material.color.set(s.bossPhase==='ECLIPSE'?'#c97aff':s.bossPhase==='RUPTURE'?'#ff9f62':'#ff7049');
  }}
 combatDirector.accept(s,camera.position);
 combatDirector.recordDamage(damageBeats,s);
 combatDirector.recordEvasions(evasionBeats);
 const courtPriority=planWardenCourtPriority(s);
 world.userData.courtPriority=courtPriority;
 world.userData.wardenRitual?.setDecorativePriority(courtPriority);
 world.userData.wardenRitual?.accept(s);
 world.userData.dressing?.accept?.(s);
 world.userData.livingWorld?.accept?.(s);
 world.userData.atmosphere?.accept?.(s);
 world.userData.chapterNaves?.accept(s);
 soundstage?.acceptSnapshot(s);
 if(world.userData.courtShield){
  // Actual hazard cells outrank ornamental cyan rings. The sealed ward stays
  // physically visible, while the camera, rig and every threat cell are intact.
  world.userData.courtGlow.opacity=courtPriority.courtRingOpacity;
  world.userData.courtShield.visible=Boolean(s.guardianWard);
  world.userData.courtShield.material.opacity=courtPriority.shieldOpacity;
  world.userData.courtShield.material.color.set('#9aaeff');
 }
 const warden=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 if(warden){wardenSpot.position.set(warden.x-9,2.2,warden.z-9);
  wardenSpot.color.set(s.bossRecovery?.remaining?'#d2ae86':s.guardianWard?'#89b9ff':s.bossPhase==='ECLIPSE'?'#ba72ff':s.bossPhase==='RUPTURE'?'#ff7b68':'#ffcc84');
  wardenSpot.intensity=s.bossRecovery?.remaining?1.9:s.bossPhase==='ECLIPSE'?3.2:s.bossPhase==='RUPTURE'?2.9:2.1;
 }else wardenSpot.intensity=0;
 for(const trap of s.traps||[]){const marker=world.userData.hazardMeshes?.get(trap.id);if(marker){marker.userData.active=trap.active;marker.userData.charge.visible=trap.active;marker.userData.ring.visible=!trap.disarmed;marker.scale.setScalar(trap.disarmed?.67:1)}}
 document.body.dataset.epilogue=s.phase==='intermission'?'true':'false';
 directCamera(s);
 renderDashboard(s);
 window.__DUNGEON_PUBLIC_STATE__=s;
}
let lastFrameTime=0;
const frameDeliveryProbe=createFrameIntervalProbe(180);
const renderPhaseProfiler=createRenderPhaseProfiler(180);
let frameDeliveryReport=null,lastFrameDeliveryReportAt=0;
// Hidden-tab throttling is not a foreground renderer performance measurement.
document.addEventListener('visibilitychange',()=>frameDeliveryProbe.resetClock());
// Actual 3D subject framing metrics, independent from overlay/card brightness.
const compositionHead=new THREE.Vector3(),compositionFoot=new THREE.Vector3();
const bodyPointSample=new THREE.Vector3();
const rayStart=new THREE.Vector3(),rayEnd=new THREE.Vector3();
const stageSourceRaycaster=new THREE.Raycaster(),stageSourceRayPoint=new THREE.Vector2();
const stageSourceFoot=new THREE.Vector3(),stageSourceBoxHit=new THREE.Vector3();
const stageVerifiedSourceRoots=new Set(),stageOriginalSourceBounds=new Map();
// Index the ACTUAL drawable meshes behind original physical foreground
// roots once per floor, plus once when asynchronous licensed scenery loads.
function indexRenderedForegroundStageSources(){
 const sources=[...(world.userData.foregroundProps||[]),
  ...(world.userData.dressing?.occluders||[]).filter(o=>o?.isGroup),
  ...(world.userData.authoredProps?.group?.children||[]).filter(o=>o?.isGroup)];
 const meshes=[],seen=new Set();
 for(const root of sources.slice(0,160)){
  if(!root?.isGroup||seen.has(root))continue;
  seen.add(root);
  if(!stageOriginalSourceBounds.has(root)){
   root.updateWorldMatrix(true,true);
   const box=new THREE.Box3().setFromObject(root);
   if(!box.isEmpty())stageOriginalSourceBounds.set(root,box);
  }
  root.traverse(m=>{
   if(meshes.length>=96||!m?.isMesh||m.isInstancedMesh||m.isSkinnedMesh||!m.visible)return;
   m.userData.dungeonForegroundSourceRoot=root;meshes.push(m);
  });
 }
 world.userData.renderedStageDirectMeshes=meshes;
}
// Bound to nine true camera rays through the live floor, weapon and chest
// stage, proving the actual rendered instance or direct original source root.
function inspectRenderedForegroundStage(subjects){
 const none=()=>({roots:new Set(),rayHits:0,verifiedOwners:0,retainedOwners:0,sourceNames:[]});
 if(camera.aspect>=.86||!Array.isArray(subjects)||subjects.length>5)return none();
 camera.updateMatrixWorld(true);
 const projected=[];
 for(const s of subjects){
  if(s?.visibleActor!==true||![s.x,s.z].every(Number.isFinite))continue;
  const foot=stageSourceFoot.set(s.x,.13,s.z).project(camera);
  if(![foot.x,foot.y,foot.z].every(Number.isFinite)||
   Math.abs(foot.x)>1||Math.abs(foot.y)>1||foot.z< -1||foot.z>1)continue;
  projected.push({x:foot.x,y:foot.y});
 }
 if(projected.length<2)return none();
 const meshes=[...(world.userData.baseWorldArchitecturalBatches?.meshes||[]),
  ...(world.userData.baseWorldArchitecturalBatchesAlt?.meshes||[]),
  ...(world.userData.dressing?.foregroundRenderedMeshes||[]),
  ...(world.userData.renderedStageDirectMeshes||[])].filter(m=>m?.isMesh&&m.visible&&
    (Array.isArray(m.userData?.dungeonForegroundSourceRoots)||
     m.userData?.dungeonForegroundSourceRoot?.isGroup===true));
 if(!meshes.length||meshes.length>136)return none();
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const x=(Math.min(...projected.map(p=>p.x))+Math.max(...projected.map(p=>p.x)))*.5;
 const footY=Math.min(...projected.map(p=>p.y));
 const ys=[clamp(footY+.31,-.73,.75),clamp(footY-.07,-.90,.25),
  clamp(footY-.29,-.94,.06)];
 const results=[],rays=[],stageRayDepths=[];
 for(const y of ys)for(const dx of [-.12,0,.12]){
  stageSourceRayPoint.set(clamp(x+dx,-.96,.96),y);
  stageSourceRaycaster.setFromCamera(stageSourceRayPoint,camera);
  const ray=stageSourceRaycaster.ray;
  rays.push(ray.clone());
  const depth=ray.direction.y<-.015?
   (.13-camera.position.y)/ray.direction.y:Infinity;
  stageRayDepths.push(depth>.1?depth:Infinity);
  results.push(stageSourceRaycaster.intersectObjects(meshes,false));
 }
 const proof=planRenderedForegroundStageHitOwners(results,subjects,camera.position,stageRayDepths);
 const farthest=Math.max(...subjects.filter(p=>p?.visibleActor===true&&
  [p.x,p.z].every(Number.isFinite)).map(p=>
   Math.hypot(camera.position.x-p.x,camera.position.y-.13,camera.position.z-p.z)));
 // Once an actual original mesh is proved, inspect its FROZEN source-space
 // stone AABB until the camera physically clears it. The source mesh sinks
 // below the floor and would otherwise trigger a visible 2-frame strobe.
 for(const root of [...stageVerifiedSourceRoots]){
  const box=stageOriginalSourceBounds.get(root);
  if(!root.parent||!box){stageVerifiedSourceRoots.delete(root);continue}
  let realStageRays=0;
  for(let i=0;i<rays.length;i++){
   if(!rays[i].intersectBox(box,stageSourceBoxHit))continue;
   const d=camera.position.distanceTo(stageSourceBoxHit);
   if(d>.1&&d<Math.min(stageRayDepths[i],farthest+.4)-.35)realStageRays++;
  }
  if(realStageRays>=2)proof.roots.add(root);
  else stageVerifiedSourceRoots.delete(root);
 }
 for(const root of proof.roots)if(stageVerifiedSourceRoots.size<8)
  stageVerifiedSourceRoots.add(root);
 return {...proof,verifiedOwners:proof.roots.size,
  retainedOwners:Math.max(0,proof.roots.size-proof.verifiedOwners),
  sourceNames:[...proof.roots].slice(0,4).map(r=>r.name||'Original foreground group')};
}
let lastRayAuditAt=-Infinity,rayAudit={testedHeroes:0,unoccludedHeroes:0,occludedHeroes:0,testedBosses:0,unoccludedBosses:0,occludedBosses:0,samples:0};
function actualHeroVisibility(s,at){
 if(at-lastRayAuditAt<1.25)return rayAudit;
 lastRayAuditAt=at;
 const obstacles=[
   world.userData.walls,
   ...(world.userData.foregroundProps||[]),
   ...(world.userData.dressing?.occluders||[]),
   ...(world.userData.authoredProps?.group?.children||[])
 ].filter(o=>o?.visible!==false);
 let tested=0,clear=0,blocked=0,bosses=0,clearBosses=0,blockedBosses=0,samples=0;
 let fullBodyHeroes=0,partiallyVisibleHeroes=0,fullBodyBosses=0,bodySamples=0;
 const auditStarted=performance.now();
 const blockedByWorld=actorOcclusionStage.createDiagnosticSampler(obstacles);
 camera.getWorldPosition(rayStart);
 for(const hero of s.units.filter(u=>u.hp>0&&(u.faction==='party'||u.kind==='warden'))){
  const actor=actors.get(hero.id);if(!actor||actor.root.visible===false)continue;
  if(hero.kind==='warden')bosses++;else tested++;
  // A visible helmet is NOT proof that armour, hands and feet are clear.
  // Four anatomical rays retain the old any-visible metric while exposing
  // genuinely partial silhouettes in actual camera motion and WebGL.
  let visibleBodyPoints=0;
  for(const y of [.30,.76,1.22,hero.kind==='warden'?2.28:1.78]){
   actor.root.getWorldPosition(rayEnd);rayEnd.y+=y*(actor.root.scale.y||1);
   if(rayStart.distanceTo(rayEnd)<.25){visibleBodyPoints++;continue}
   samples++;bodySamples++;
   if(!blockedByWorld(rayStart,rayEnd))visibleBodyPoints++;
  }
  const good=visibleBodyPoints>0;
  if(hero.kind==='warden'){
   if(good)clearBosses++;else blockedBosses++;
   if(visibleBodyPoints===4)fullBodyBosses++;
  }else{
   if(good)clear++;else blocked++;
   if(visibleBodyPoints===4)fullBodyHeroes++;
   else if(good)partiallyVisibleHeroes++;
  }
 }
 rayAudit={testedHeroes:tested,unoccludedHeroes:clear,occludedHeroes:blocked,testedBosses:bosses,unoccludedBosses:clearBosses,occludedBosses:blockedBosses,samples,
  fullBodyHeroes,partiallyVisibleHeroes,fullBodyBosses,bodySamples,
  auditDurationMs:Math.round((performance.now()-auditStarted)*100)/100,
  bodyVisibilityMethod:'four anatomical 3D rays; not a pixel or blinded quality grade'};
 return rayAudit;
}

// Demand-driven, bounded real skinned GLB surface sampling for camera and
// actor-ID frame diagnostics. One cached sample per rendered frame.
const nativeBodyCache=new WeakMap();
function liveNativeBodyPoints(actor){
 if(!actor?.authored||!actor.assetRoot||!actor.root?.visible)return [];
 const frame=renderer.info.render.frame;
 const cached=nativeBodyCache.get(actor);
 if(cached?.frame===frame&&cached.root===actor.assetRoot)return cached.points;
 actor.root.updateWorldMatrix(true,true);
 const points=sampleNativeActorSurface(actor),ys=points.map(p=>p.y);
 const extent=ys.length?Math.max(...ys)-Math.min(...ys):0;
 const origin=actor.root.position;
 const valid=extent>=.42&&extent<=4.5&&points.every(p=>
  [p.x,p.y,p.z].every(Number.isFinite)&&
  Math.hypot(p.x-origin.x,p.z-origin.z)<=4.5);
 const output=valid?points:[];
 nativeBodyCache.set(actor,{frame,root:actor.assetRoot,points:output});
 return output;
}

function inspectTrueCombatActorFrames(s,shot){
 const noActor=()=>({status:'UNAVAILABLE',method:'No living spectator game state'});
 if(!s?.units||!Array.isArray(s.units))return noActor();
 camera.updateMatrixWorld(true);
 const measured=[];
 const point=new THREE.Vector3();
 // Bounded diagnostic demand only: read real imported source-bone locations
 // and current posed root (including recoil/locomotion) after the WebGL frame.
 for(const u of s.units.slice(0,32)){
  if(!(u.hp>0))continue;
  const a=actors.get(u.id);
  if(!a?.root?.visible)continue;
  a.root.updateWorldMatrix(true,true);
  const sourcePoints=liveNativeBodyPoints(a);
  const points=sourcePoints.map(p=>({...p})),nativeBones=sourcePoints.length?[]:[a.rigCranial?.bone,a.rigPelvisBone,
   a.rigGaitBones?.find(b=>b.part==='lower'&&b.side==='left')?.bone,
   a.rigGaitBones?.find(b=>b.part==='lower'&&b.side==='right')?.bone];
  let nativeAnchorCount=0;
  for(const bone of nativeBones){
   if(!bone?.isBone)continue;
   bone.getWorldPosition(point);
   if(![point.x,point.y,point.z].every(Number.isFinite))continue;
   points.push({x:point.x,y:point.y,z:point.z});nativeAnchorCount++;
  }
  // Mark proxies as fallback. Do NOT describe these as original GLB pixels.
  if(points.length<2){
   for(const y of [.04,u.kind==='warden'?2.38:1.96]){
    a.root.localToWorld(point.set(0,y,0));points.push({x:point.x,y:point.y,z:point.z});
   }
  }
  measured.push({id:u.id,kind:u.kind,faction:u.faction,hp:u.hp,points,nativeAnchorCount,
   sourceSurfaceCount:sourcePoints.length});
 }
 return planRealActorScreenReadability(measured,{
  project:p=>point.set(p.x,p.y,p.z).project(camera),
  width:Math.max(1,canvas.clientWidth),height:Math.max(1,canvas.clientHeight),
  criticalIds:Array.isArray(shot?.subjects)?shot.subjects.slice(0,3):[],maxActors:12
 });
}
function inspectComposition(s){
 if(!s)return {visibleHeroes:0,minHeroPixels:0,activeEnemies:0,subjectOnscreen:false,bossOnscreen:false};
 camera.updateMatrixWorld();
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
 let visibleHeroes=0,minHeroPixels=1e9,activeEnemies=0,subjectOnscreen=false,bossOnscreen=false;
 for(const u of s.units){
  if(u.hp<=0)continue;
  const a=actors.get(u.id);if(!a||!a.root.visible)continue;
  compositionFoot.set(a.root.position.x,0,a.root.position.z).project(camera);
  compositionHead.set(a.root.position.x,1.85*a.root.scale.y,a.root.position.z).project(camera);
  const within=compositionHead.z>-1&&compositionHead.z<1&&Math.abs(compositionHead.x)<.94&&Math.abs(compositionHead.y)<.90;
  if(u.faction==='party'&&within){
   visibleHeroes++;
   minHeroPixels=Math.min(minHeroPixels,Math.abs(compositionFoot.y-compositionHead.y)*h/2);
   if(u.id===focusedHeroId)subjectOnscreen=true;
  }
  if(u.faction==='enemy'&&within)activeEnemies++;
  if(u.kind==='warden'&&within)bossOnscreen=true;
 }
 return {visibleHeroes,minHeroPixels:minHeroPixels===1e9?0:Math.round(minHeroPixels),activeEnemies,subjectOnscreen,bossOnscreen,viewport:{width:w,height:h}};
}
function animate(t){
 const frameCpuStart=performance.now();
 if(!document.hidden){
  frameDeliveryProbe.observe(t);
  // Sorting only 180 fixed-size samples once per second is outside the hot path.
  if(t-lastFrameDeliveryReportAt>=1000){frameDeliveryReport=frameDeliveryProbe.summary();lastFrameDeliveryReportAt=t;}
 }else frameDeliveryProbe.resetClock();
 requestAnimationFrame(animate);const time=t/1000,frameInterval=Math.max(0,time-lastFrameTime),dt=Math.min(.05,frameInterval);lastFrameTime=time;
 oathguardImpactAge=Math.min(10,oathguardImpactAge+dt);
 oathguardEscapeAge=Math.min(10,oathguardEscapeAge+dt);
 oathguardEscapeMark.visible=oathguardEscapeAge<.72;
 if(oathguardEscapeMark.visible){
  const progress=oathguardEscapeAge/.72;
  oathguardEscapeMark.scale.setScalar(reduced?1:1+.25*progress);
  oathguardEscapeMark.material.opacity=.61*(1-.72*progress);
 }
 // Real software WebGL may render only once every few seconds. Preserve
 // frame-bound action animation, but let cinematic framing catch up with
 // the actual current boss and heroes in one bounded camera update.
 const cameraDt=Math.min(.24,frameInterval);
 if(impactCameraHold)impactCameraHold.age=advancePresentationActionAge(impactCameraHold.age,dt);
 if(lightInjury){lightInjury.age=advancePresentationActionAge(lightInjury.age,dt);if(lightInjury.age>=.36)lightInjury=null;}
 // Source-backed pulses, hit particles and chapter cues now share three
 // retained GPU submissions, rather than a new draw call and material per cue.
 cueBatch.advance(dt);
 shakeStrength=Math.max(0,shakeStrength-dt*.25);

 const w=canvas.clientWidth,h=canvas.clientHeight;
 if(w&&h){
  const nextDirectBudget=planDirectRenderBudget(w,h,directRequestedDpr,softwareWebGL,directRenderPixelCap);
  nextDirectBudget.shadows=nextDirectBudget.shadows&&!reduced;
  const surfaceUpdate=planRenderSurfaceUpdate({
   cssWidth:w,cssHeight:h,pixelRatio:nextDirectBudget.pixelRatio,
   appliedWidth:appliedSurfaceWidth,appliedHeight:appliedSurfaceHeight,
   appliedPixelRatio:appliedSurfaceDpr,
   backingWidth:canvas.width,backingHeight:canvas.height
  });
  // setPixelRatio itself resizes the existing CSS canvas in Three.js.
  // A stable 0.736 DPR at 1440 CSS px produces 1059 backing pixels,
  // not the 1060 pixels expected by the former Math.round check.
  if(surfaceUpdate.sizeChanged){
   // Any unverified software-resolution trial belongs to the former
   // physical viewport. Restore its source cap; redraw at that cap on
   // the next frame rather than retaining degraded quality by accident.
   const restoreCap=directDeliveryGovernor.reset();
   if(Number.isSafeInteger(restoreCap)&&restoreCap>=320000)
    directRenderPixelCap=restoreCap;
  }
  if(surfaceUpdate.setPixelRatio){renderer.setPixelRatio(nextDirectBudget.pixelRatio);surfaceDprChanges++}
  if(surfaceUpdate.setSize){renderer.setSize(w,h,false);surfaceRendererResizes++}
  if(composer&&surfaceUpdate.resizeComposer){
   const budget=planPostFXBudget(w,h,renderer.getPixelRatio(),bloomPixelCap);
   const ratioChanged=budget.pixelRatio!==postFXBudget?.pixelRatio;
   if(ratioChanged)composer.setPixelRatio(budget.pixelRatio);
   // EffectComposer.setPixelRatio invokes its own setSize at prior CSS size.
   if(surfaceUpdate.sizeChanged||!ratioChanged)composer.setSize(w,h);
   postFXBudget=budget;surfaceComposerResizes++;
  }
  if(surfaceUpdate.updateProjection){
   camera.aspect=w/h;camera.updateProjectionMatrix();surfaceCameraUpdates++;
  }
  appliedSurfaceWidth=w;appliedSurfaceHeight=h;appliedSurfaceDpr=nextDirectBudget.pixelRatio;
  directBudget=nextDirectBudget;
 }
 const leader=(actors.get(focusedHeroId)?.u.hp>0?actors.get(focusedHeroId):null)||[...actors.values()].find(a=>a.u.faction==='party'&&a.u.hp>0);
 const encounterFrame=autoDirector&&cameraModes[cameraIndex]==='cinematic'?planEncounterFrame(state):null;
 const heldImpact=impactCameraHold?.age<(impactCameraHold?.encounter.mode==='final-blow'?.72:.43)&&!state?.bossWarning?impactCameraHold.encounter:null;
 const rawCinematicShot=autoDirector&&cameraModes[cameraIndex]==='cinematic'?planCinematicShot(state,heldImpact||encounterFrame,{width:w,height:h,focusedHeroId}):null;
 // The spectator's labelled hero must be a real party subject of the shot
 // we are actually filming. A Warden warning or true contact should not
 // follow a distant hero selected by unrelated earlier actions.
 // Do not override manual spectator selection or fake character positions.
 const filmedHero=autoDirector&&rawCinematicShot?
  planCinematicVisibleHero(state,rawCinematicShot,focusedHeroId):null;
 if(filmedHero&&filmedHero!==focusedHeroId){
  focusedHeroId=filmedHero;lastAutoSwitch=performance.now();
  const subject=state.units.find(u=>u.id===filmedHero);
  $('focus-label').textContent='DIRECTOR FOLLOW · '+
   (classMeta[subject?.kind]?.name||subject?.kind||'HERO').toUpperCase();
 }

  // Sustain the camera side through an ACTUAL ongoing two-body engagement;
  // emergency ground telegraphs, death, floor changes and new targets always
  // override immediately. The shot mode/aim/subjects still come from NOW.
  const cinematicShot=combatShotContinuity.resolve(state,rawCinematicShot,frameInterval,{reducedMotion:reduced});
 const encounterLighting=cinematicShot?planEncounterLighting(state,cinematicShot,{damageBeat:lightInjury?.beat,reducedMotion:reduced}):null;
 const storyStage=planWorldStoryStage(state,cinematicShot,{width:w,reducedMotion:reduced});
 const target=cinematicShot?new THREE.Vector3(cinematicShot.x-9,0,cinematicShot.z-9):encounterFrame?new THREE.Vector3(encounterFrame.x-9,0,encounterFrame.z-9):(leader?.at??new THREE.Vector3(0,0,0));
 for(const a of actors.values()){
  // The displayed body follows genuine authority coordinates at a time-based
  // rate. A stalled/software-WebGL frame cannot imply a new gameplay move.
  const locomotion=planExpeditionStep(a.root.position.x,a.root.position.z,
   a.at.x,a.at.z,frameInterval,{reducedMotion:reduced});
  a.root.position.set(locomotion.x,0,locomotion.z);
  a.locomotionTilt=locomotion.leanPitch;
  a.locomotionTeleport=locomotion.teleport;
  const footfall=advanceExpeditionFootfall(a.footstepDistance??0,locomotion.travel,
   {alive:a.u.hp>0,reducedMotion:reduced,teleport:locomotion.teleport});
  a.footstepDistance=footfall.accumulator;
  if(footfall.plant){
   a.footstepIndex=(a.footstepIndex??0)+1;
   a.ground?.stamp(time,a.footstepIndex%2===0?-1:1);
   // Only the camera-followed real living hero makes quiet travel sound.
   // WebAudio itself still requires explicit spectator opt-in.
   if(a.u.id===focusedHeroId&&a.u.faction==='party')soundstage?.footstep();
  }
  // One actual footstep cycle now owns animation, plantar weight and sound.
  a.groundedPerformance=planGroundedAnimation(a.u.kind,a.u.action||'idle',
   locomotion.travel,frameInterval,footfall.accumulator,a.footstepIndex??0,
   a.groundedPerformance?.weight??0,
   {alive:a.u.hp>0,reducedMotion:reduced,teleport:locomotion.teleport});
  const moving=a.groundedPerformance.moving,stride=2*Math.PI*a.groundedPerformance.footPhase;
  a.body.position.y=a.groundedPerformance.bodyLift;
  a.leftLeg.rotation.x=moving?Math.sin(stride)*.35:0;
  a.rightLeg.rotation.x=-a.leftLeg.rotation.x;
  a.leftArm.rotation.x=moving?Math.sin(stride)*.22:0;
  a.rightArm.rotation.x=-a.leftArm.rotation.x;
  // Keep the first authentic one-shot pose in sight; thereafter allow the
  // original imported rig to catch up with measured elapsed time, unlike
  // the independent 50ms VFX clock. Sparse RAF must not turn a 350ms
  // authority event into several seconds of slow-motion source animation.
  const oneShot=['attack','cast','hurt'].includes(a.u.action);
  const ageBefore=oneShot?(a.visualActionAge??0):time-(a.actionStarted??time);
  const rigPlayback=planSourceRigPlaybackStep(frameInterval,a.u.action,ageBefore);
  const since=oneShot?rigPlayback.age:ageBefore;
  if(oneShot)a.visualActionAge=rigPlayback.age;
  if(a.evasionBeat){a.evasionBeat.age=advancePresentationActionAge(a.evasionBeat.age,dt);
   if(a.evasionBeat.age>=EVASION_BEAT_DURATION)a.evasionBeat=null;}
  const phase=Math.max(0,Math.min(1,since/.32));
  if(a.u.action==='attack'&&since<.32){a.rightArm.rotation.x=-1.5*Math.sin(phase*Math.PI);a.body.rotation.z=.16*Math.sin(phase*Math.PI)}
  else if(a.u.action==='cast'&&since<.45){a.rightArm.rotation.x=-1.55*Math.sin(Math.min(1,since/.45)*Math.PI);a.leftArm.rotation.x=-.85;a.body.rotation.z=0}
  else if(a.u.action==='guard'&&since<.42){a.rightArm.rotation.x=-.85;a.leftArm.rotation.x=-1.1;a.body.rotation.x=-.16;}
  else if(a.u.action==='hurt'&&since<.30){a.body.rotation.z=.16*Math.sin(phase*Math.PI*2);a.body.position.y+=.10*Math.sin(phase*Math.PI)}
  else {a.body.rotation.z*=.65;a.body.rotation.x*=.70;}
  if(a.telegraph)a.telegraph.material.opacity=.42+.2*Math.sin(time*9);
  // Imported Warden shoulders and torso share one genuine public warning.
  // Once the real telegraph clears, the rig pose returns to the mixer output.
  a.wardenCharge=a.u.kind==='warden'&&a.u.hp>0?planWardenCharge(state?.bossWarning,state?.tick,reduced):null;
   // Retain only the most recent genuine authority-backed cast warning; a
   // subsequent cast must match its attackTick to animate release. This data
   // belongs to the disposable visual actor, never saved gameplay authority.
   const genuineThreat=state?.bossWarning;
   if(a.u.kind==='warden'&&a.u.hp>0&&a.wardenCharge?.threatPerformance&&
    Number.isSafeInteger(genuineThreat?.attackTick)&&genuineThreat.attackTick>state.tick)
    a.wardenPriorThreat={attackTick:genuineThreat.attackTick,
     shape:genuineThreat.shape,axis:genuineThreat.axis};
   a.wardenStrikePose=a.u.kind==='warden'&&a.u.hp>0?
    planWardenTrueStrikeRelease(a.wardenPriorThreat,a.u,since,reduced):null;
  a.wardenExposure=a.u.kind==='warden'&&a.u.hp>0?
   planWardenExposurePose(state?.bossRecovery,state?.guardianWard,Boolean(state?.bossWarning)):null;
  if(!a.authored)a.detail?.update(time,a.u.action||'idle');a.ground?.update(time,a.u.action||'idle',a.u.hp>0);a.defeatIntermission=Boolean(state?.phase==='intermission'&&a.u.faction==='party'&&a.u.hp===0);updateActor(a,rigPlayback.delta,since,reduced);
  // One shared read-only pivot brings the complete skinned rig, armour,
  // accessories and the procedural fallback through the SAME real hit beat.
  if(state?.phase==='intermission'&&a.u.faction==='party'&&a.u.hp===0){
   // Film the actual party's last legal cells with physical skinned bodies
   // through the real intermission; movement/AI and health remain untouched.
   const lastStand=planDefeatTableauPose(a.u,state.phase);
   a.impactPivot.position.set(lastStand.x,lastStand.y,lastStand.z);
   a.impactPivot.rotation.set(lastStand.pitch,0,lastStand.roll);
  }else if(a.damageBeat){
   // Preserve the short pre-contact (negative) presentation age. The HUD
   // already shows real HP loss immediately; only physical body recoil waits
   // for the source-skinned sword and the opt-in impact sound.
   const contactStep=a.damageBeat.age<0?
    planVisibleMeleeContactStep(frameInterval,a.damageBeat.contactAge??0):dt;
   if(a.damageBeat.age<0)a.damageBeat.contactAge=(a.damageBeat.contactAge??0)+contactStep;
   a.damageBeat.age=Math.min(5,(Number.isFinite(a.damageBeat.age)?a.damageBeat.age:0)+contactStep);
   const recoil=planDamageReaction(a.u.kind,a.damageBeat.damage,a.damageBeat.maxHp,a.damageBeat.age,a.damageBeat.fatal,reduced,
    resolveImpactSide(a.damageBeat.incoming,a.root.rotation.y));
   a.impactPivot.position.set(recoil.x,recoil.y,recoil.z);
   a.impactPivot.rotation.set(recoil.pitch,0,recoil.roll);
   if(a.damageBeat.fatal&&a.damageBeat.age>=DEATH_BEAT_DURATION)a.root.visible=false;
  }else{a.impactPivot.position.set(0,0,0);a.impactPivot.rotation.set(0,0,0);}
  // The actual public Warden warning, and only that warning, brings his
  // arms and torso into an escalating pre-strike silhouette. Imported skeleton
  // animations stay intact and take precedence when the real attack lands.
  if(a.u.kind==='warden'&&a.u.hp>0){
   const anticipation=a.wardenCharge,exposed=a.wardenExposure;
   if(a.authored&&a.visualPivot){
    a.visualPivot.position.y+=anticipation.lift-(exposed?.dip??0)+(a.wardenStrikePose?.rootLift??0);
    a.visualPivot.rotation.x+=anticipation.pitch+(exposed?.torsoPitch??0)+(a.wardenStrikePose?.rootPitch??0);
    a.visualPivot.rotation.z+=anticipation.coil??0;
   }else{
    a.body.rotation.x+=anticipation.pitch+(exposed?.torsoPitch??0)+(a.wardenStrikePose?.rootPitch??0);
    a.body.rotation.z+=anticipation.coil??0;
    a.leftArm.rotation.x+=anticipation.armRaise+(exposed?.shoulderPitch??0)+(a.wardenStrikePose?.shoulders?.left?.pitch??0);
    a.rightArm.rotation.x+=anticipation.armRaise+(exposed?.shoulderPitch??0)+(a.wardenStrikePose?.shoulders?.right?.pitch??0);
   }
  }
  const visualYaw=a.combatFacing?.yaw??(moving?planMovementFacing(a.root.position.x,a.root.position.z,a.at.x,a.at.z):null);
  if(visualYaw!==null)a.root.rotation.y=approachCharacterYaw(a.root.rotation.y,visualYaw,dt,reduced);
 }
 // One physically staged protection, derived from the real public turn.
 const oathguardPlan=planOathguardPose(state);
 const protectorActor=oathguardPlan&&actors.get(oathguardPlan.guardianId);
 const allyActor=oathguardPlan&&actors.get(oathguardPlan.allyId);
 oathguardAegis.visible=Boolean(protectorActor?.root.visible&&allyActor?.root.visible);
 if(oathguardAegis.visible){
  const from=protectorActor.root.position,to=allyActor.root.position;
  oathguardAegis.position.set((from.x+to.x)*.5,1.08,(from.z+to.z)*.5);
  const towardAlly=new THREE.Vector3().subVectors(to,from).setY(0).normalize();
  const towardViewer=new THREE.Vector3().subVectors(camera.position,oathguardAegis.position).setY(0).normalize();
  towardAlly.multiplyScalar(.60).addScaledVector(towardViewer,.40).normalize();
  oathguardAegis.rotation.set(-.12,Math.atan2(towardAlly.x,towardAlly.z),0);
  oathguardAegis.scale.setScalar(reduced?1:1+.018*Math.sin(time*4.4));
 }
 const impactProgress=oathguardImpactAge/.48;
 oathguardImpactRing.visible=oathguardAegis.visible&&!reduced&&impactProgress<1;
 if(oathguardImpactRing.visible){
  oathguardImpactRing.material.opacity=.43*(1-impactProgress);
  oathguardImpactRing.scale.setScalar(.72+impactProgress*.63);
 }
 // Pose every live rig before sampling its skinned weapon hand for effects.
 combatDirector.animate(frameInterval);
 soundstage?.advanceVisualFrame(frameInterval);
 if(world.userData.portal&&!reduced)world.userData.portal.rotation.y=time*.26;
 if(world.userData.court&&!reduced)world.userData.court.rotation.y=Math.sin(time*.3)*.035;
 world.userData.wardenRitual?.animate(time,dt);
 world.userData.wardenImpactScars?.animate(time);
 // Real boss lighting is recomputed from snapshot, not multiplied each frame:
 // no long-session energy drift or cosmetic fake exposure.
 const aliveWarden=state?.units.find(u=>u.kind==='warden'&&u.hp>0);
 const baseBossGlow=aliveWarden?(state?.bossRecovery?.remaining?1.9:state?.bossPhase==='ECLIPSE'?3.2:state?.bossPhase==='RUPTURE'?2.9:2.1):0;
 wardenSpot.intensity=baseBossGlow*(storyStage?.bossScale??1)*(reduced?1:1+.018*Math.sin(time*3.1));
 if(!reduced&&world.userData.hazardMeshes)for(const trap of world.userData.hazardMeshes.values()){
  if(trap.userData.active){trap.userData.ring.rotation.z=time*.4;trap.userData.charge.scale.y=.9+Math.sin(time*3+trap.position.x)*.14}
 }
 if(world.userData.dressing&&!reduced)world.userData.dressing.animate(time);
 if(world.userData.atmosphere&&!reduced)world.userData.atmosphere.update(time);
 if(world.userData.livingWorld&&!reduced)world.userData.livingWorld.update(time);
 // One bounded physical chamber light reflects genuine party/enemy combat and
 // confirmed HP loss, without adding navigation, authority or fake injuries.
 world.userData.chapterNaves?.animate(dt);
 // Camera composition must favour real readable characters over empty skyline.
 // Focus stays locked on the chosen AI protagonist and widens only if party
 // members truly diverge. These are 3D metre offsets, not CSS zoom tricks.
 const cameraType=cameraModes[cameraIndex]||'cinematic';
 const cinematicLens=cameraType==='cinematic'&&cinematicShot?planReadableExpeditionLens(cinematicShot,{width:w,height:h,reducedMotion:reduced}):null;
 const spread=state?.units.filter(u=>u.faction==='party'&&u.hp>0)
  .reduce((highest,u)=>Math.max(highest,Math.hypot((u.x-9)-target.x,(u.z-9)-target.z)),0)??0;
 const mobileShot=canvas.clientWidth<590;
 const margin=Math.min(2.8,Math.max(0,spread-1.7)*.28)+(mobileShot?1.4:0);
 const offsets=cameraType==='tactical'?[3.5,23.5,4.5]:
  cameraType==='chase'?[4.15+margin*.45,7.8+margin,5.1+margin*.55]:
  // This shot is authored around the actual combatants; never DOUBLE-zoom
  // for a wandering companion after the director has chosen its subjects.
  cinematicLens?cinematicLens.offsets:
  encounterFrame?[4.75+margin*.5,7.65+margin*.85,5.25+margin*.58]:
  [5.45+margin*.57,9.05+margin,6.2+margin*.68];
 const boss=state?.units.find(u=>u.kind==='warden'&&u.hp>0),bossDistance=boss&&state?.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=5);
 const shot=encounterTarget(target,boss,state?.map.length??19,Boolean(bossDistance&&cameraType==='cinematic'));
 const look=new THREE.Vector3(shot.x,0,shot.z);
 // Frame the actual encounter midpoint, not a fabricated nine-tile offset that pushes the boss and heroes offscreen.
 // encounterTarget already converted the boss grid coordinates to world space.
 const authoredCamera=planBoundaryCamera(look,state?.map?.length??19,offsets);
 // The real duel must be legible AFTER the physical boundary clamp. Evaluate
 // true hero/boss silhouettes and usable arena space, preserving real
 // telegraph coverage and all authoritative grid positions.
 const duelCamera=cameraType==='cinematic'&&cinematicShot?
  planBossDuelSightline(state,cinematicShot,look,offsets,{width:w,height:h,fov:cinematicLens?.fov??48,visualActors:actors}):null;
 // Keep multiple actual party bodies visible through a physical orbit when
 // no genuine Warden warning or boss duel owns the current camera.
 const vistaCamera=cameraType==='cinematic'&&!duelCamera&&cinematicShot?
  planPartyVistaSightline(state,look,offsets,{width:w,height:h,
   fov:cinematicLens?.fov??48,visualActors:actors,reducedMotion:reduced}):null;
 // Judge the actual head, armour and boots against the real camera-to-stone
 // ray, not the old centre-point unoccluded flag. The same physical cutaway
 // policy drives candidate grade and visible architecture in this frame.
 // Genuine animated GLB joints drive camera grading and the stone apertures.
 // A guessed static root is not evidence that a helmet, chest and boots show.
 const partySightlines=resolveRenderedSilhouetteSubjects(state,
  planCinematicSilhouetteRecess(state,planCombatSightlineExtension(state,
   planEncounterSightlines(state,target,Boolean(bossDistance)),cinematicShot?.mode)),actors)
  .map(subject=>{
   if(subject?.visibleActor!==true)return subject;
   const actor=[...actors.values()].find(a=>a?.u?.hp>0&&a.root.visible&&
    a.u.kind===subject.kind&&Math.hypot(a.root.position.x-subject.x,
     a.root.position.z-subject.z)<.008);
   if(!actor?.assetRoot)return subject;
   const native=liveNativeBodyPoints(actor);
   if(native.length>=3)return {...subject,bodyPoints:native.slice(0,8)};
   const bones=[
    actor.rigCranial?.bone,
    actor.rigMeleeBones?.find(m=>m.part==='spine')?.bone,
    actor.rigPelvisBone,
    actor.rigUpperArms?.find(m=>m.side==='left')?.bone,
    actor.rigUpperArms?.find(m=>m.side==='right')?.bone,
    actor.rigGaitBones?.find(m=>m.side==='left'&&m.part==='lower')?.bone,
    actor.rigGaitBones?.find(m=>m.side==='right'&&m.part==='lower')?.bone
   ];
   const bodyPoints=[];
   for(const bone of bones){
    if(!bone?.isBone)continue;
    bone.getWorldPosition(bodyPointSample);
    if([bodyPointSample.x,bodyPointSample.y,bodyPointSample.z].every(Number.isFinite))
     bodyPoints.push({x:bodyPointSample.x,y:bodyPointSample.y,z:bodyPointSample.z});
   }
   return bodyPoints.length>=3?{...subject,bodyPoints}:subject;
  });
 const basePlannedCamera=duelCamera??vistaCamera??authoredCamera;
 const occlusionCamera=cameraType==='cinematic'&&autoDirector?
  physicalCameraDirector.resolve(state,basePlannedCamera,{
   subjects:partySightlines,wallPositions:world.userData.wallPositions,
   wallHeights:world.userData.wallHeights,facades:world.userData.dressing?.occlusionFaces,
   facadeReveal:world.userData.dressing?.facadeReveal,
   propVolumes:world.userData.cameraPropVolumes,
   reveal:planPartyWallReveal,
   wallPad:storyStage?.wallPad??2.1,width:w,height:h,
   fov:cinematicLens?.fov??48,lookY:cinematicLens?.lookY??cinematicShot?.lookY??0,
   reducedMotion:reduced
  }):null;
 const plannedCamera=occlusionCamera??basePlannedCamera;
 // One lens update, no extra GPU passes. Measured actor scale takes priority
 // over distant party coverage; imminent real hazards trigger a wide overview.
 const wantedFov=cinematicLens?.fov??50;
 const nextFov=reduced?wantedFov:camera.fov+(wantedFov-camera.fov)*Math.min(1,cameraDt*5.2);
 if(Math.abs(camera.fov-nextFov)>.015){camera.fov=nextFov;camera.updateProjectionMatrix()}
 const cam=new THREE.Vector3(plannedCamera.position.x,plannedCamera.position.y,plannedCamera.position.z);
 // Avoid flying through walls on first frame before the cinematic camera settles.
 if(!camera.userData.dungeonInitialized){camera.position.copy(cam);camera.userData.dungeonInitialized=true;}
 else camera.position.lerp(cam,reduced?1:Math.min(1,cameraDt*(cinematicLens?.following??4.6)));
 // Body-height aiming makes armor and weapon contact legible, with eased
 // transitions across real scene states instead of neck-snapping camera cuts.
 // The group-vista director can centre the true party without moving any
 // authoritative character. Optical aim follows the same bounded shot as
 // the chosen camera orbit, avoiding the former off-screen companions.
 const viewedAim=plannedCamera.look??look;
 const desiredAim=new THREE.Vector3(viewedAim.x,cinematicLens?.lookY??cinematicShot?.lookY??0,viewedAim.z);
 if(!camera.userData.aimInitialized){cameraAim.copy(desiredAim);camera.userData.aimInitialized=true;}
 else cameraAim.lerp(desiredAim,reduced?1:Math.min(1,cameraDt*5.5));
 camera.lookAt(cameraAim);
 // The genuine visible Warden, nearest frontline hero and real danger cells
 // outrank a cinematic close-up that CROPS the encounter. Fit their current
 // Three.js skeletal/body coordinates AFTER the physical boundary orbit.
 // No simulated boss action, duplicated model or extra draw pass is involved.
 let criticalCameraFit=null;
 if(cameraType==='cinematic'&&cinematicShot&&
  ['contact','skirmish-approach','breach-warning','oathguard-cover',
   'warden-contact','warden-counter','warden-approach','warden-exposed','warden-warning','warden-release'].includes(cinematicShot.mode)){
  camera.updateMatrixWorld(true);
  const subjects=[];
  for(const id of cinematicShot.subjects.slice(0,3)){
   const actor=actors.get(id);
   if(!actor||actor.u.hp<=0||!actor.root.visible)continue;
   const native=liveNativeBodyPoints(actor);
   if(native.length>=3){
    // Frame real source-skinned helmet, boots, shoulders and weapon-side
    // silhouette. The genuine authoritative danger-cell fit remains below.
    for(const sourcePoint of native.slice(0,6)){
     const point=camera.worldToLocal(new THREE.Vector3(sourcePoint.x,sourcePoint.y,sourcePoint.z));
     subjects.push({x:point.x,y:point.y,z:point.z});
    }
   }else for(const y of [.08,actor.u.kind==='warden'?2.38:1.96]){
    const point=camera.worldToLocal(actor.root.localToWorld(new THREE.Vector3(0,y,0)));
    subjects.push({x:point.x,y:point.y,z:point.z});
   }
  }
  if(state?.bossWarning&&Array.isArray(state.bossWarning.cells)){
   const half=(state.map.length-1)/2;
   for(const cell of state.bossWarning.cells.slice(0,32)){
    if(!Number.isInteger(cell.x)||!Number.isInteger(cell.z)||
       cell.x<0||cell.z<0||cell.x>=state.map.length||
       cell.z>=state.map.length)continue;
    // Screen-fit ALL four corners of EVERY authentic threatened floor tile.
    // The old centre-only path also lost most of 23 true cells because the
    // fit planner had a 40-point limit. Never rescue one hero by cropping the
    // next actual Warden impact cell during a smoothed camera transition.
    for(const dx of [-.47,.47])for(const dz of [-.47,.47]){
     const point=camera.worldToLocal(new THREE.Vector3(
      cell.x-half+dx,.08,cell.z-half+dz));
     subjects.push({x:point.x,y:point.y,z:point.z});
    }
   }
  }
  criticalCameraFit=planCriticalSubjectFit(subjects,camera.aspect,wantedFov);
  if(criticalCameraFit.fov>camera.fov+.02){
   // A live critical threat must enter frame immediately; the authored lens
   // relaxes gradually after the attack, rather than wobbling per render.
   camera.fov=criticalCameraFit.fov;camera.updateProjectionMatrix();
  }
 }
 // The camera must settle before the cutaway is measured. Previous frames culled
 // props using stale view angles during cinematic shot switches.
 // Clear the real Warden-to-camera corridor during actual boss combat;
 // ordinary traversal retains the narrower party-only sightlines.
 const origin=state?.map?.length?(state.map.length-1)/2:9;
 world.userData.cutawaySubjectCount=partySightlines.length;
 world.userData.recessActors=partySightlines.filter(p=>p.silhouetteRecess===true).length;
 world.userData.recessCombatants=partySightlines.filter(p=>p.combatRecess===true).length;
 world.userData.bossCutawayActive=Boolean(bossDistance&&boss&&partySightlines.some(({x,z})=>x===boss.x-origin&&z===boss.z-origin));
 const renderedBodyView={look:cameraAim,fov:camera.fov,aspect:camera.aspect};
 // Cache actual authority warning tiles once per fixed simulation snapshot.
 // Empty immediately on strike release, recovery, defeat or floor restart.
 if(cachedWarningSnapshot!==state?.bossWarning){
  cachedWarningSnapshot=state?.bossWarning??null;
  activeWarningSightlinePoints=planWardenWarningSightlinePoints(cachedWarningSnapshot,state?.map?.length);
 }
 // Intersect ACTUAL original InstancedMesh geometry in the CURRENT
 // camera. The giant 390px central column persisted despite multiple 2D
 // box tests; accept only independent ray hits on physically nearer stone.
 const renderedForegroundStage=inspectRenderedForegroundStage(partySightlines);
 world.userData.renderedForegroundStageHits=renderedForegroundStage.rayHits;
 world.userData.renderedForegroundStageOwners=renderedForegroundStage.verifiedOwners;
 world.userData.renderedForegroundStageRetained=renderedForegroundStage.retainedOwners;
 world.userData.renderedForegroundStageNames=renderedForegroundStage.sourceNames;
 const physicalStage=actorOcclusionStage.resolve(worldFloor,camera,partySightlines,
  world.userData.walls,world.userData.dressing?.occluders?.[0],time);
 cutawayWalls(target,partySightlines,storyStage?.wallPad??2.1,renderedBodyView,physicalStage.walls,dt,renderedForegroundStage.roots);
 world.userData.baseWorldArchitecturalBatchWrites=
  (world.userData.baseWorldArchitecturalBatches?.sync().matrixWrites||0)+
  (world.userData.baseWorldArchitecturalBatchesAlt?.sync().matrixWrites||0);
 world.userData.dressing?.cutaway(partySightlines,camera.position,storyStage?.wallPad??2.1,
  renderedBodyView,physicalStage.facades,dt,reduced,activeWarningSightlinePoints,renderedForegroundStage.roots);
  world.userData.chapterNaves?.cutaway(partySightlines,camera.position,storyStage?.wallPad??2.1);
  world.userData.wardenRitual?.setSightlines(partySightlines,camera.position);
 let portraitAuthoredCleared=0,warningAuthoredCleared=0;
 if(world.userData.authoredProps?.group){
  for(const [i,prop] of world.userData.authoredProps.group.children.entries()){
   const portrait=planPortraitStageClearance(world.userData.authoredPropVolumes?.[i],partySightlines,camera.position,renderedBodyView);
   const blocked=sightlineClearance(prop.position.x,prop.position.z,partySightlines,camera.position,2.4)||
    planForegroundBodyClearance(world.userData.authoredPropVolumes?.[i],partySightlines,camera.position)||
    planProjectedBodyAperture(world.userData.authoredPropVolumes?.[i],partySightlines,camera.position,renderedBodyView)||portrait;
   const warningBlocked=planForegroundWarningClearance(world.userData.authoredPropVolumes?.[i],activeWarningSightlinePoints,camera.position);
   applyForegroundRecession(prop,blocked||warningBlocked,dt,reduced,world.userData.authoredPropVolumes?.[i]);
   if(portrait)portraitAuthoredCleared++;
   if(warningBlocked&&!blocked)warningAuthoredCleared++;
  }
 }

 world.userData.portraitStageAuthoredCleared=portraitAuthoredCleared;
 world.userData.wardenWarningAuthoredCleared=warningAuthoredCleared;
 if(shakeStrength>.008&&!reduced){camera.position.x+=Math.sin(time*57)*shakeStrength;camera.position.y+=Math.cos(time*43)*shakeStrength*.5;}
 partyGlow.position.set(target.x,2,target.z);
 const heroAt=leader?.root.position??target;
 const towardX=camera.position.x-heroAt.x,towardZ=camera.position.z-heroAt.z;
 const nearLength=Math.max(.01,Math.hypot(towardX,towardZ));
 heroKey.position.set(heroAt.x+towardX/nearLength*.85,2.75,heroAt.z+towardZ/nearLength*.85);
 heroKey.intensity=(leader?.u.action==='cast'?3.6:leader?.u.action==='attack'?3.1:2.65)*(cinematicLens?.keyScale??1);
 heroKey.intensity*=storyStage?.keyScale??1;
 ambient.intensity=storyStage?.ambient??1.75;
 moon.intensity=1.65*(storyStage?.moonScale??1);
 const litFloor=Number.isSafeInteger(state?.floor)&&state.floor>=1?state.floor:1;
 partyGlow.intensity=floorThemes[(litFloor-1)%floorThemes.length].partyIntensity*(storyStage?.partyScale??1);
 // Build legible real hero-versus-hostile volumetric silhouettes with THREE
 // existing light sources. All lighting follows the same genuine camera shot,
 // no fabricated contact cues, new point lights, shadows or render passes.
 if(encounterLighting?.mode==='duel'){
  const lightFollow=reduced?1:Math.min(1,cameraDt*8);
  const key=encounterLighting.heroKey,fill=encounterLighting.opponentFill;
  heroKey.position.lerp(lightStep.set(key.x,key.y,key.z),lightFollow);
  heroKey.intensity=key.intensity*(cinematicLens?.keyScale??1)*(storyStage?.keyScale??1)*
   (1+(encounterLighting.injury?.strength??0));
  heroKey.distance=key.distance;
  partyGlow.position.lerp(lightStep.set(fill.x,fill.y,fill.z),lightFollow);
  partyGlow.intensity=fill.intensity*(storyStage?.partyScale??1);
  partyGlow.distance=fill.distance;
  if(!aliveWarden&&encounterLighting.bossLight){
   const threat=encounterLighting.bossLight;
   wardenSpot.position.lerp(lightStep.set(threat.x,threat.y,threat.z),lightFollow);
   wardenSpot.intensity=threat.intensity;
   wardenSpot.distance=threat.distance;
   wardenSpot.color.set('#ad7766');
  }
 }else{
  heroKey.distance=6.8;partyGlow.distance=7.7;
  if(!aliveWarden){wardenSpot.intensity=0;wardenSpot.distance=9.5;}
 }
 // Select only actual present decorative world lights, after all genuine
 // stage animations and cutaways, without mutating core combat/hero lights.
 world.userData.softwareWorldLights?.update({x:cameraAim.x,z:cameraAim.z});
 const sceneCpuMs=performance.now()-frameCpuStart;
 renderer.info.reset();
 const submitCpuStart=performance.now();
 try{if(composer&&postFXEnabled){
  bloomPass.strength=innerWidth<680?.16:.30;
  const postFXFrameStart=performance.now();
  composer.render();
  bloomRenderMs=performance.now()-postFXFrameStart;
  // Trace-verified slow software WebGL can starve toggles for 10+ seconds.
  // Never mislabel direct rendering as bloom: actually reduce optional GPU work
  // after a measured heavy compositor frame, retaining native direct-render DPR.
  const stall=postFXStallAction(bloomRenderMs,bloomSlowStreak);
  bloomSlowStreak=stall.slowStreak;
  if(stall.disable){
   // A compositor that blocks the host browser for seconds is less useful
   // than an unadorned moving dungeon. Preserve scene and spectator truth.
   postFXEnabled=false;bloomAutoDisabled=true;postFXStatus='performance-fallback';
   fxButton.setAttribute('aria-pressed','false');
   fxButton.querySelector('span').textContent='DIRECT 3D';
   fxButton.title='Glow paused after measured slow WebGL rendering; direct 3D remains active';
  }
  const nextCap=adaptPostFXPixelCap(bloomPixelCap,performance.now()-postFXFrameStart);
  if(!stall.disable&&nextCap<bloomPixelCap){
   bloomPixelCap=nextCap;
   const budget=planPostFXBudget(w,h,renderer.getPixelRatio(),bloomPixelCap);
   composer.setPixelRatio(budget.pixelRatio);composer.setSize(w,h);postFXBudget=budget;bloomDownshifts++;
  }
 }else{
  const directFrameStart=performance.now();
  renderer.render(scene,camera);
  if(softwareWebGL){
   directRenderMs=performance.now()-directFrameStart;
   const adjustment=adaptDirectRenderPixelCap(directRenderPixelCap,directRenderMs,directSlowStreak);
   directSlowStreak=adjustment.slowStreak;
   if(adjustment.downshift){directRenderPixelCap=adjustment.maxPixels;directDownshifts++}
   // Real RAF delivery may stall in the compositor/encoder even when direct
   // scene drawing is fast. A reversible software-only fidelity trial can
   // reduce framebuffer and capture pressure without skipping any AI tick.
   const delivery=directDeliveryGovernor.observe({
    intervalMs:frameInterval*1000,renderMs:directRenderMs,
    pixelCap:directRenderPixelCap,viewportPixels:w*h,visible:!document.hidden
   });
   directDeliveryStatus=delivery.status;
   if(delivery.change){
    if(delivery.maxPixels<directRenderPixelCap)directDownshifts++;
    directRenderPixelCap=delivery.maxPixels;directDeliveryCapChanges++;
   }
  }
 }}
 catch(error){console.warn('[DUNGEON] post effect fault, restoring WebGL:',String(error));try{composer?.dispose()}catch{}composer=null;bloomPass=null;postFXStatus='fallback';postFXEnabled=false;fxButton.title='Glow unavailable: direct rendering remains active';fxButton.setAttribute('aria-pressed','false');fxButton.querySelector('span').textContent='DIRECT 3D';renderer.info.reset();renderer.render(scene,camera)}
 const submitCpuMs=performance.now()-submitCpuStart;
 const overlayCpuStart=performance.now();
 combatOverlay.render(state,actors,camera,time,focusedHeroId);
 renderPhaseProfiler.observe({sceneMs:sceneCpuMs,submitMs:submitCpuMs,overlayMs:performance.now()-overlayCpuStart});
 if(state){
  const observedState=state,observedTime=time;
  const diagnostics=window.__DUNGEON_RENDER_DIAGNOSTICS__={renderedState:{run:state.run,tick:state.tick,floor:state.floor,checksum:state.checksum},frame:renderer.info.render.frame,cultistTellCount:cultistTell.count,revenantTellCount:breachDiamond.count,oathguardVisible:oathguardAegis.visible,oathguardPhysicalPanels:oathguardAegis.children.filter(o=>o.isMesh).length,oathguardImpactVisible:oathguardImpactRing.visible,oathguardCompletedLaneVisible:oathguardEscapeMark.visible,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:cameraModes[cameraIndex],cameraSpread:spread,cameraMargin:margin,encounterFrame:encounterFrame??null,cinematicShot:cinematicShot??null,cinematicLens:cinematicLens??null,storyStage:storyStage??null,wardenExposure:[...actors.values()].find(a=>a.u.kind==='warden'&&a.u.hp>0)?.wardenExposure??null,criticalCameraFit,cameraFrameDt:cameraDt,cinematicAim:{x:cameraAim.x,y:cameraAim.y,z:cameraAim.z},duelSightline:duelCamera?.sightline??null,cameraRig:{mode:cameraType,desiredPosition:plannedCamera.position,actualPosition:{x:camera.position.x,y:camera.position.y,z:camera.position.z},turn:plannedCamera.turn,boundaryLimit:plannedCamera.boundaryLimit},focusedHeroId,autoDirector,cutawayWalls:world.userData.cutawayWalls??0,screenSpaceWallReveals:world.userData.screenSpaceWallReveals??0,wallMatrixWrites:world.userData.wallMatrixWrites??0,parapetMatrixWrites:world.userData.parapetMatrixWrites??0,cutawayNearbyWalls:world.userData.cutawayNearbyWalls??0,cutawaySubjects:world.userData.cutawaySubjectCount??0,realRigSightlineActors:partySightlines.filter(p=>p.bodyPoints?.length>=3).length,realRigSightlineSamples:partySightlines.reduce((n,p)=>n+(p.bodyPoints?.length||0),0),recessActors:world.userData.recessActors??0,recessCombatants:world.userData.recessCombatants??0,bossCutawayActive:world.userData.bossCutawayActive??false,cutawayParapets:world.userData.cutawayParapets??0,foundationBricks:world.userData.foundationBrickPositions?.length??0,clearedFoundationBricks:world.userData.clearedFoundationBricks??0,foundationMatrixWrites:world.userData.foundationMatrixWrites??0,wallProfiles:world.userData.wallProfileMetrics??null,wallSculpture:world.userData.wallSculpture??null,openWardenGate:world.userData.openWardenGate===true,chapterNaves:world.userData.chapterNaves?.metrics??null,stoneGrade:{biome:floorThemes[(state.floor-1)%floorThemes.length].biome,wallTint:stone.color.getHexString(),floorTint:floorMat.color.getHexString(),trimTint:stoneEdge.color.getHexString(),keyFill:moon.color.getHexString(),partyFill:partyGlow.color.getHexString(),partyIntensity:partyGlow.intensity,wallTextureMapped:Boolean(wallMasonryTexture&&stone.map===wallMasonryTexture)},wallMasonry:{size:wallMasonryTexture?.image?.width??0,mapped:Boolean(wallMasonryTexture&&stone.map===wallMasonryTexture),bump:Boolean(wallMasonryTexture&&stone.bumpMap===wallMasonryTexture),bumpScale:stone.bumpScale},hiddenForegroundProps:world.userData.hiddenForegroundProps??0,
 baseWorldArchitecturalBatches:{sourceDrawCalls:
  (world.userData.baseWorldArchitecturalBatches?.sourceDrawCalls||0)+
  (world.userData.baseWorldArchitecturalBatchesAlt?.sourceDrawCalls||0),
  drawCalls:(world.userData.baseWorldArchitecturalBatches?.drawCalls||0)+
   (world.userData.baseWorldArchitecturalBatchesAlt?.drawCalls||0),
  savedDrawCalls:(world.userData.baseWorldArchitecturalBatches?.savedDrawCalls||0)+
   (world.userData.baseWorldArchitecturalBatchesAlt?.savedDrawCalls||0),
  matrixWrites:world.userData.baseWorldArchitecturalBatchWrites||0},wardenWarningPhysicalClearance:{actualCells:activeWarningSightlinePoints.length,sourceProps:world.userData.wardenWarningForegroundCleared??0,dressing:world.userData.dressing?.metrics?.wardenWarningForegroundCleared??0,authored:world.userData.wardenWarningAuthoredCleared??0},portraitStageClearance:{props:world.userData.portraitStagePropsCleared??0,dressing:world.userData.dressing?.metrics?.portraitStagePropsCleared??0,authored:world.userData.portraitStageAuthoredCleared??0},renderedForegroundStage:{actualRayHits:world.userData.renderedForegroundStageHits??0,verifiedSourceOwners:world.userData.renderedForegroundStageOwners??0,retainedPhysicalOwners:world.userData.renderedForegroundStageRetained??0,sourceNames:world.userData.renderedForegroundStageNames??[],directSourceMeshes:world.userData.renderedStageDirectMeshes?.length??0,physicalSceneOnly:true},
 authoredProps:{loaded:world.userData.authoredProps?.group?.children.length??0,
  wallSeatedPlanned:world.userData.authoredProps?.wallSeatedPlanned??0,
  wallSeatedLoaded:world.userData.authoredProps?.group?.children.filter(p=>p.userData?.dungeonAuthoredWallMasonry).length??0,
  maxActualWallHeight:Math.max(0,...(world.userData.authoredProps?.group?.children||[]).map(p=>p.userData?.dungeonAuthoredWallMasonry?.actualHeight||0)),
  indexed:world.userData.authoredPropVolumes?.filter(Boolean).length??0,
  cameraVolumes:world.userData.cameraPropVolumes?.length??0,
  source:'true-loaded-ThreeJS-world-bounds',renderOnly:true},postFX:composer&&postFXEnabled?'bloom':'direct',postFXStatus,postFXBudget,bloomRenderMs,bloomDownshifts,postFXAutoDisabled:bloomAutoDisabled,frameDelivery:frameDeliveryReport,softwareWebGL,contextPreflight:renderContextPlan,actualContextAntialias,directRenderBudget:directBudget,directRenderMs,directDownshifts,directDeliveryBudget:{status:directDeliveryStatus,capChanges:directDeliveryCapChanges,...directDeliveryGovernor.stats()},surfaceResizes:{renderer:surfaceRendererResizes,dpr:surfaceDprChanges,composer:surfaceComposerResizes,camera:surfaceCameraUpdates,cssWidth:appliedSurfaceWidth,cssHeight:appliedSurfaceHeight,renderDpr:appliedSurfaceDpr,backingWidth:canvas.width,backingHeight:canvas.height},heroKeyIntensity:heroKey.intensity,guardianWard:Boolean(state.guardianWard),bossWarning:state.bossWarning?{shape:state.bossWarning.shape,axis:state.bossWarning.axis,attackTick:state.bossWarning.attackTick,cells:state.bossWarning.cells.length}:null,wardenStageClarity:world.userData.wardenStageClarity??null,wardenCourtPriority:world.userData.courtPriority?{
  ...world.userData.courtPriority,actualCourtRingOpacity:world.userData.courtGlow?.opacity??null,
  actualWardShieldOpacity:world.userData.courtShield?.material?.opacity??null,
  ritualDecorative:world.userData.wardenRitual?.metrics?.().decorativePriority??null}:null,
 wardBarrierVisible:Boolean(world.userData.courtShield?.visible),defendersRemaining:state.defendersRemaining??0,bossFramed:Boolean(bossDistance),cameraLook:{x:look.x,z:look.z},activeUnits:[...actors.values()].filter(x=>x.root.visible).length,
 lastStandBodies:[...actors.values()].filter(x=>x.root.visible&&x.u.faction==='party'&&x.u.hp===0&&state.phase==='intermission').length,characterDetails:[...actors.values()].reduce((sum,x)=>sum+(x.detail?.parts||0),0),combatFacingActors:[...actors.values()].filter(x=>x.combatFacing&&x.root.visible).length,alignedCombatActors:[...actors.values()].filter(x=>x.combatFacing&&x.root.visible&&Math.abs(shortestYawDelta(x.root.rotation.y,x.combatFacing.yaw))<.18).length,webgl:true,theme:state.theme,damageChoreography:{observedDamageBeats,observedFatalBeats,activeReactions:[...actors.values()].filter(a=>a.root.visible&&a.damageBeat&&!a.damageBeat.fatal&&a.damageBeat.age<DAMAGE_BEAT_DURATION).length,visibleFallen:[...actors.values()].filter(a=>a.root.visible&&a.damageBeat?.fatal&&a.damageBeat.age<DEATH_BEAT_DURATION).length,maxFallenPitch:Math.max(0,...[...actors.values()].filter(a=>a.root.visible&&a.damageBeat?.fatal).map(a=>Math.abs(a.impactPivot.rotation.x))),impactCameraHold:heldImpact?.mode??null},locomotion:{movingActors:[...actors.values()].filter(a=>(a.locomotionTilt||0)>.001).length,plantedFootfalls:[...actors.values()].reduce((count,a)=>count+(a.footstepIndex||0),0),timeBased:true},groundedActors:[...actors.values()].filter(x=>Boolean(x.ground)).length,authoredMotionPivots:[...actors.values()].filter(x=>x.authored&&x.visualPivot).length,authoredCombatPoseActors:[...actors.values()].filter(x=>x.authored&&['attack','cast','hurt'].includes(x.u.action)).length,authoredMotionMaxOffset:[...actors.values()].reduce((m,x)=>Math.max(m,x.visualPivot?.position.length()||0),0),authoredMotionPeak:[...actors.values()].reduce((m,x)=>Math.max(m,x.motionPeak||0),0),};  deferRenderDiagnostics(diagnostics,{
   renderPipeline:()=>renderPhaseProfiler.summary(),
   softwareWorldRasterTier:()=>world.userData.softwareWorldRasterTier??null,
   softwareWorldLights:()=>world.userData.softwareWorldLights?.stats()??null,
   staticDetailBatches:()=>({batches:world.userData.staticDetailBatches?.length||0,
    beforeDraws:(world.userData.staticDetailBatches||[]).reduce((n,b)=>n+b.instances,0),
    afterDraws:(world.userData.staticDetailBatches||[]).reduce((n,b)=>n+b.drawCalls,0),
    savedDraws:(world.userData.staticDetailBatches||[]).reduce((n,b)=>n+b.savedDraws,0)}),
   sourceCueBatch:()=>cueBatch.stats(),
   webglRendererName:()=>webglRendererName,
   cinematicContinuity:()=>combatShotContinuity.metrics(),
   cameraOcclusion:()=>physicalCameraDirector.metrics(),
   physicalActorStage:()=>actorOcclusionStage.metrics(),
   wardenRitual:()=>world.userData.wardenRitual?.metrics()??null,
   wardenImpactScars:()=>world.userData.wardenImpactScars?.metrics()??null,
   overlay:()=>combatOverlay.metrics(),
   soundstage:()=>soundstage?.stats()??null,
   combatStage:()=>combatDirector.stats(),
   composition:()=>inspectComposition(observedState),
   actorReadability:()=>inspectTrueCombatActorFrames(observedState,cinematicShot),
   visibility:()=>actualHeroVisibility(observedState,observedTime),
   combatStaging:()=>({separatedActors:crowdedStageActors,maxOffsetMeters:MAX_STAGE_OFFSET,
    projected:inspectBattlefieldCrowding(observedState,lastStagePositions,camera.position)}),
   authored3D:()=>assetStats(actors),
   groundSignals:()=>{const states=[...actors.values()].map(x=>x.ground?.getState?.()).filter(Boolean);
    return {subjects:states.length,shadows:states.filter(x=>x.shadowVisible).length,
     ritualSigils:states.filter(x=>x.sigilVisible).length,coronas:states.filter(x=>x.coronaVisible).length}},
   dressing:()=>world.userData.dressing?.metrics??null,
   atmosphere:()=>world.userData.atmosphere?.metrics??null,
   livingWorld:()=>world.userData.livingWorld?.metrics??null,
   floorRuins:()=>world.userData.floorRuins?.metrics??null,
   expeditionStonework:()=>world.userData.expeditionStonework?.metrics??null,
   vaultedGallery:()=>world.userData.vaultedGallery?.metrics()??null
  });
 }
}
async function poll(){try{const r=await fetch('/dungeon/state',{cache:'no-store'});if(!r.ok)throw Error('State '+r.status);const data=await r.json();if(data.tick!==lastTick||data.run!==state?.run){lastTick=data.tick;update(data)}}catch(e){errorAt++;if(errorAt>=3){$('recovery').hidden=false;$('status').textContent='VIEW DEGRADED — RETRYING';console.warn('Dungeon view recovery',String(e))}}finally{setTimeout(poll,190)}}
$('party').addEventListener('click',e=>{
 const node=e.target.closest('[data-hero-id]');if(!node)return;
 const unit=state?.units.find(u=>u.id===node.dataset.heroId&&u.faction==='party'&&u.hp>0);
 if(!unit)return;
 focusedHeroId=unit.id;autoDirector=false;$('director-toggle').setAttribute('aria-pressed','false');$('director-toggle').querySelector('span').textContent='Manual follow';$('focus-label').textContent='FOLLOWING '+(classMeta[unit.kind]?.name||unit.kind).toUpperCase();
 for(const el of document.querySelectorAll('.hero-card')){el.dataset.focused=String(el.dataset.heroId===focusedHeroId);el.setAttribute('aria-pressed',String(el.dataset.heroId===focusedHeroId))}
 if(window.__DUNGEON_RENDER_DIAGNOSTICS__){window.__DUNGEON_RENDER_DIAGNOSTICS__.autoDirector=autoDirector;window.__DUNGEON_RENDER_DIAGNOSTICS__.focusedHeroId=focusedHeroId;}
});
$('party').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const card=e.target.closest('[data-hero-id]');if(card){e.preventDefault();card.click()}}});
$('director-toggle').addEventListener('click',()=>{
 autoDirector=!autoDirector;
 $('director-toggle').setAttribute('aria-pressed',String(autoDirector));
 $('director-toggle').querySelector('span').textContent=autoDirector?'Director':'Manual follow';
 lastAutoSwitch=0;
 // A CPU WebGL frame can take >8 seconds. Expose real control state at the
 // instant the button changes, not after a stalled renderer's next frame.
 if(window.__DUNGEON_RENDER_DIAGNOSTICS__){window.__DUNGEON_RENDER_DIAGNOSTICS__.autoDirector=autoDirector;window.__DUNGEON_RENDER_DIAGNOSTICS__.focusedHeroId=focusedHeroId;}
});
const cameraModes=['cinematic','tactical','chase'];let cameraIndex=0;const viewButton=$('view-toggle');
viewButton.addEventListener('click',()=>{cameraIndex=(cameraIndex+1)%cameraModes.length;viewButton.querySelector('span').textContent=cameraModes[cameraIndex].toUpperCase();viewButton.setAttribute('aria-label','Camera: '+cameraModes[cameraIndex]+'; change view');});
document.body.dataset.reducedMotion=String(reduced);requestAnimationFrame(animate);poll();
