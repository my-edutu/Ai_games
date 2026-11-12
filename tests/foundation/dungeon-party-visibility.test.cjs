'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const policyPath=path.join(root,'public/ai-dungeon/party-visibility-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(policyPath,'utf8')).toString('base64'));

test('the live camera opens a bounded waist-high pocket beside living heroes without deleting room boundaries',async()=>{
 const {planPartyWallReveal}=await load();
 const subjects=[{x:0,z:0}],camera={x:6,z:0};
 assert.equal(planPartyWallReveal(3,0,subjects,camera),'sightline','camera-to-hero ray must still fully clear');
 assert.equal(planPartyWallReveal(0,2.4,subjects,camera),'nearby','side wall near a hero is low, not an opaque roof');
 assert.equal(planPartyWallReveal(-1.2,-1.2,subjects,camera),'none','Gothic rear backdrop remains tall beyond the body clearance');
 assert.equal(planPartyWallReveal(0,3.5,subjects,camera),'none','distant room boundaries retain full height');
 assert.equal(planPartyWallReveal(-6,5,subjects,camera),'none','no global map transparency');
});

test('cutaway input is deterministic, finite, five-subject bounded and cannot mutate authority or camera',async()=>{
 const {planPartyWallReveal}=await load();
 const subjects=Object.freeze([{x:0,z:0},...Array.from({length:7},(_,i)=>Object.freeze({x:99+i,z:99+i}))]);
 const camera=Object.freeze({x:6,z:0});
 const first=planPartyWallReveal(0,2.4,subjects,camera);
 assert.equal(first,'nearby');
 assert.equal(planPartyWallReveal(0,2.4,subjects,camera),first);
 assert.equal(planPartyWallReveal(105,105,subjects,camera),'none','sixth+ subject must not unbound renderer work');
 assert.equal(planPartyWallReveal(Infinity,0,subjects,camera),'none');
 assert.equal(planPartyWallReveal(0,0,subjects,{x:NaN,z:1}),'none');
 assert.equal(planPartyWallReveal(0,0,[],camera),'none');
 assert.equal(planPartyWallReveal(0,0,[{x:'0',z:0}],camera),'none');
 assert.equal(planPartyWallReveal(0,-10,subjects,camera,999),'none','padding clamps to safe max without removing more distant space');
 const code=fs.readFileSync(policyPath,'utf8');
 assert.doesNotMatch(code,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|localStorage|requestAnimationFrame/);
});

test('base walls, weathered masonry and real browser share the same render-only clearance planner',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const config=fs.readFileSync(path.join(root,'tests/browser/dungeon.playwright.config.cjs'),'utf8');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.ok(app.includes("from '/dungeon/party-visibility-plan.js'"));
 assert.ok(environment.includes("from '/dungeon/party-visibility-plan.js'"));
 assert.match(app,/cutawayNearbyWalls:/);
 assert.match(environment,/planPartyWallReveal\(/);
 assert.ok(server.includes("['/dungeon/party-visibility-plan.js','party-visibility-plan.js']"));
 assert.ok(config.includes("'dungeon-party-visibility.spec.cjs'"));
 assert.ok(pkg.scripts['dungeon:test'].includes('dungeon-party-visibility.test.cjs'));
});

test('reused cosmetic cutaway cache uploads a wall only after its visibility band changes',async()=>{
 const {createCutawayBandCache,shouldUploadCutawayBand}=await load();
 const cache=createCutawayBandCache(3);
 assert.ok(cache instanceof Uint8Array);
 assert.deepEqual([...cache],[255,255,255],'unknown initial GPU state must upload once');
 assert.equal(shouldUploadCutawayBand(cache,0,0),true);
 assert.equal(shouldUploadCutawayBand(cache,0,0),false,'steady 3D room must not rewrite identical matrices');
 assert.equal(shouldUploadCutawayBand(cache,0,2),true,'camera entering sightline must update');
 assert.equal(shouldUploadCutawayBand(cache,0,1),true,'nearby masonry height is distinct');
 assert.equal(shouldUploadCutawayBand(cache,0,0),true,'leaving cutaway restores wall height');
 assert.equal(shouldUploadCutawayBand(cache,1,0),true,'other instances retain independent state');
 assert.equal(shouldUploadCutawayBand(cache,0,0),false);
 assert.deepEqual([...cache],[0,0,255]);
 assert.equal(shouldUploadCutawayBand(cache,-1,1),false);
 assert.equal(shouldUploadCutawayBand(cache,3,1),false);
 assert.equal(shouldUploadCutawayBand(cache,1,255),false);
 assert.equal(shouldUploadCutawayBand(cache,1,NaN),false);
 assert.deepEqual([...cache],[0,0,255],'rejected inputs cannot poison valid cache');
 assert.equal(createCutawayBandCache(-1),null);
 assert.equal(createCutawayBandCache(16385),null,'unbounded cosmetic allocations are forbidden');
});

test('actual masonry and dressing only write changing GPU instance transforms while still testing each hero sightline',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/shouldUploadCutawayBand\(wallBands,/);
 assert.match(app,/shouldUploadCutawayBand\(parapetBands,/);
 assert.match(app,/if\(wallMatrixWrites\)mesh\.instanceMatrix\.needsUpdate=true/);
 assert.match(app,/wallMatrixWrites:/,'real WebGL diagnostics must publish actual writes');
 assert.match(environment,/shouldUploadCutawayBand\(facadeBands,/);
 assert.match(environment,/if\(facadeMatrixWrites\)facadeMesh\.instanceMatrix\.needsUpdate=true/);
 assert.match(environment,/if\(weatheredChanged\)/,'shared stone detail must stop redundant GPU uploads');
 assert.match(environment,/matrixWrites:/,'live browser can review true dressing work');
});

test('camera-facing nearby masonry now reveals full actor weapons but preserves distant room boundaries',async()=>{
 const text=fs.readFileSync(path.join(root,'public/ai-dungeon/cutaway-floor-plan.js'),'utf8');
 const {planCutawayWallTransform}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
 assert.ok(planCutawayWallTransform('nearby',2.6).height<=.48);
 assert.equal(planCutawayWallTransform('sightline',2.6).height,.13);
 assert.equal(planCutawayWallTransform('none',2.6).height,2.6);
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(environment,/reveal==='nearby'\?\.43/);
 assert.match(environment,/reveal==='nearby'\?\.23/);
});

test('real group camera clears only the foreground wedge in front of living characters',async()=>{
 const {planPartyWallReveal}=await load();
 const camera={x:6,z:0},subjects=[{x:0,z:0}];
 assert.equal(planPartyWallReveal(1,2.5,subjects,camera),'sightline',
  'near-front masonry must not obscure a companion at body height');
 assert.equal(planPartyWallReveal(-1,2.5,subjects,camera),'none',
  'stone beyond the camera-side pocket remains fully visible behind the hero');
 assert.equal(planPartyWallReveal(1,3.7,subjects,camera),'none',
  'a full distant wall remains visible to establish architecture');
});
test('true living-party centroid and source masonry inform a bounded cinematic camera without changing game state',async()=>{
 const filename=path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js');
 const code=fs.readFileSync(filename,'utf8');
 const {planPartyVistaSightline}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const n=19,units=[{id:'v',kind:'vanguard',faction:'party',hp:5,x:9,z:9},
  {id:'r',kind:'ranger',faction:'party',hp:5,x:8,z:10},
  {id:'m',kind:'mystic',faction:'party',hp:5,x:8,z:9}];
 const state=Object.freeze({phase:'exploring',map:Array(n).fill('.'),
  units:units.map(u=>Object.freeze(u))});
 const baseline=JSON.stringify(state),inputLook=Object.freeze({x:0,z:0});
 const params={width:390,height:844,fov:48};
 const shot=planPartyVistaSightline(state,inputLook,[5,8,5],params);
 assert.ok(shot,'an actual clustered three-hero party must receive its own camera shot');
 assert.ok(shot.look.x<-.2&&shot.look.x>-.9,'party may recenter but not abandon Vanguard');
 assert.ok(Math.abs(shot.look.z)<1.3);
 assert.ok(shot.position&&Number.isFinite(shot.position.x)&&Number.isFinite(shot.position.z));
 assert.ok(shot.sightline.foregroundWalls>=0);
 assert.ok(shot.sightline.candidateCount<=17);
 assert.deepEqual(planPartyVistaSightline(state,inputLook,[5,8,5],params),shot,
  'scene framing is deterministic and does not need random visual staging');
 assert.equal(JSON.stringify(state),baseline,'camera cannot mutate actual game snapshots');
 assert.match(fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8'),
  /const viewedAim=plannedCamera\.look\?\?look/);
});


test('real-camera acting-space is a shallow physical stone removal, not wall deletion or a new battle',async()=>{
 const {planPartyWallReveal}=await load();
 const hero=Object.freeze({x:0,z:0,silhouetteRecess:true});
 const contact=Object.freeze({x:0,z:0,silhouetteRecess:true,combatRecess:true});
 const cam=Object.freeze({x:6,z:0});
 assert.equal(planPartyWallReveal(0,2.5,[hero],cam),'sightline');
 assert.equal(planPartyWallReveal(0,2.8,[hero],cam),'none',
  'ordinary traversal preserves distant room masonry beyond the actor-shaped wedge');
 assert.equal(planPartyWallReveal(0,2.8,[contact],cam),'sightline',
  'a real battle grants more physical clearance around contact silhouettes');
 assert.equal(planPartyWallReveal(-2.9,1.8,[contact],cam),'none',
  'walls behind the actors still define a bounded dungeon');
 assert.equal(planPartyWallReveal(1,5,[contact],cam),'none',
  'distant walls cannot disappear to flatter a close combat shot');
 assert.equal(planPartyWallReveal(0,2.5,[{x:0,z:0}],cam),'nearby',
  'unmarked scene behavior remains backward-compatible');
});

test('physical character-scale stage respects genuine travel and live melee contact without deleting the Gothic room',async()=>{
 const {planPartyWallReveal}=await load();
 const hero=Object.freeze({x:0,z:0,silhouetteRecess:true});
 const combat=Object.freeze({x:0,z:0,silhouetteRecess:true,combatRecess:true});
 const camera=Object.freeze({x:6,z:0});
 assert.equal(planPartyWallReveal(-2.3,1.2,[hero],camera),'none');
 assert.equal(planPartyWallReveal(-2.3,1.2,[combat],camera),'none',
  'rear Gothic arcade retains full adult architectural height');
 assert.equal(planPartyWallReveal(-2.8,1.8,[combat],camera),'none');
 assert.equal(planPartyWallReveal(0,3.6,[combat],camera),'none');
 assert.equal(planPartyWallReveal(0,2.8,[hero],camera),'none');
 const dressing=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const floorPlan=fs.readFileSync(path.join(root,'public/ai-dungeon/cutaway-floor-plan.js'),'utf8');
 assert.match(dressing,/reveal==='nearby'\?\.43/);
 assert.match(dressing,/reveal==='nearby'\?\.23/);
 assert.match(floorPlan,/height:\.43,footprint:\.84/);
 assert.match(floorPlan,/height:\.13,footprint:\.32/);
});

test('an actual combat stage clears frontal weapon contact while retaining architectural depth behind each hero',async()=>{
 const {planPartyWallReveal}=await load();
 const subject=Object.freeze({x:0,z:0,silhouetteRecess:true,combatRecess:true});
 const right=Object.freeze({x:6,z:0}),left=Object.freeze({x:-6,z:0});
 const front={x:2.1,z:.4},rear={x:-2.1,z:.4};
 assert.equal(planPartyWallReveal(front.x,front.z,[subject],right),'sightline',
  'foreground Warden contact needs a clear physical camera-side acting space');
 assert.equal(planPartyWallReveal(rear.x,rear.z,[subject],right),'none',
  'rear Gothic masonry remains full-height, not a waist-high miniature wall');
 assert.equal(planPartyWallReveal(front.x,front.z,[subject],left),'none',
  'moving the REAL camera reverses which half of the cathedral remains intact');
 assert.equal(planPartyWallReveal(rear.x,rear.z,[subject],left),'sightline');
 assert.equal(planPartyWallReveal(-5,.4,[subject],right),'none',
  'distant room boundaries must remain full height');
 const second=Object.freeze({x:-3,z:0,silhouetteRecess:true});
 assert.equal(planPartyWallReveal(-2.1,.4,[subject,second],right),'sightline',
  'a second REAL hero may require a sightline even through the first hero\'s rear arcade');
 assert.deepEqual(subject,{x:0,z:0,silhouetteRecess:true,combatRecess:true});
 assert.deepEqual(second,{x:-3,z:0,silhouetteRecess:true});
});

test('native full-body scene clears the actual near-side Gothic face but keeps the rear stone nave',async()=>{
 const {planPartyWallReveal}=await load();
 const camera=Object.freeze({x:6,z:0});
 const hero=Object.freeze({x:0,z:0,silhouetteRecess:true});
 const wardenDuel=Object.freeze({x:0,z:0,silhouetteRecess:true,combatRecess:true});
 // A source-skinned hero's face is close to BOTH sides of a .51m-thick
 // impassable facade. The previous front-only test missed its rear shoulder
 // and left an opaque panel across the actual Chromium Vanguard's chest.
 assert.equal(planPartyWallReveal(-.52,0,[hero],camera),'sightline',
  'a half-cell back-face cannot stand across the camera-facing shoulders');
 assert.equal(planPartyWallReveal(-.68,.55,[hero],camera),'sightline',
  'an adjacent corner fascia must give the animated sword an acting pocket');
 assert.equal(planPartyWallReveal(-.85,.45,[wardenDuel],camera),'sightline',
  'the genuine Warden counter gets more full-body clearance');
 assert.equal(planPartyWallReveal(-1,0,[hero],camera),'none',
  'rear wall core stays a full-height Gothic backdrop after the immediate shoulder clearance');
 assert.equal(planPartyWallReveal(-2.9,.3,[wardenDuel],camera),'none',
  'do not erase the rear cathedral to flatter one hero');
 assert.equal(planPartyWallReveal(0,3.7,[wardenDuel],camera),'none',
  'distant sidelong architecture stays fully physical');
 assert.equal(planPartyWallReveal(-.62,0,[{x:0,z:0}],camera),'nearby',
  'generic unmarked subjects cannot manufacture the larger actor pocket');
 assert.equal(planPartyWallReveal(-.52,0,[hero],camera),
  planPartyWallReveal(-.52,0,[hero],camera));
 assert.deepEqual(hero,{x:0,z:0,silhouetteRecess:true},
  'the render policy must not mutate the public game snapshot');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const dressing=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const nave=fs.readFileSync(path.join(root,'public/ai-dungeon/chapter-nave.js'),'utf8');
 assert.match(app,/cutawayWalls\(target,partySightlines,/);
 assert.match(dressing,/planPartyWallReveal\(face\[0\],face\[2\],eyes,camera,wallPad,face\[4\]\)/);
 assert.match(nave,/planPartyWallReveal\(p\.x,p\.z,eyes,camera,pad\)/);
});

test('real Gothic weathering is fitted to the near ruin rather than erased or floating above it',()=>{
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const floor=fs.readFileSync(path.join(root,'public/ai-dungeon/cutaway-floor-plan.js'),'utf8');
 assert.match(env,/blockedBand=reveal==='sightline'\?2:reveal==='nearby'\?1:0/);
 assert.match(env,/const hidden=band===2,ruin=band===1/);
 assert.match(env,/Math\.min\(\.37,item\.y\*\.14\)/);
 assert.match(env,/const obscures=.*==='sightline'/);
 assert.match(floor,/height:\.43,footprint:\.84/);
});

test('M1 camera-height body rays expose real obscuring stone without erasing distant architecture',async()=>{
 const {planPartyWallReveal,planCameraBodyOcclusion}=await load();
 const combat=Object.freeze({x:0,z:0,silhouetteRecess:true,combatRecess:true});
 const camera=Object.freeze({x:7,y:2.2,z:0});
 assert.equal(planCameraBodyOcclusion(4.5,0,[combat],camera,2.6),true,
  'the foreground block physically intersects the camera-to-torso line');
 assert.equal(planPartyWallReveal(4.5,0,[combat],camera,2.1,2.6),'sightline',
  'the old flattened camera wedge missed an actually obscuring wall');
 assert.equal(planCameraBodyOcclusion(4.5,0,[combat],camera,.4),false,
  'a lower foundation cannot intercept a chest or upper-body ray');
 assert.equal(planPartyWallReveal(4.5,0,[combat],camera,2.1,.4),'none',
  'already-lowered masonry cannot erase another part of the nave');
 assert.equal(planPartyWallReveal(-4.5,0,[combat],camera),'none',
  'back wall must survive the real three-dimensional sightline');
 assert.equal(planPartyWallReveal(4.5,2,[combat],camera),'none',
  'off-axis stone retains original Gothic depth');
 assert.equal(planPartyWallReveal(4.5,0,[combat],{...camera,y:12}),'none',
  'a high camera whose rays clear the masonry should not erase it');
 assert.equal(planCameraBodyOcclusion(4.5,0,[{x:0,z:0}],camera,2.6),false,
  'unmarked cosmetic subjects are not licensed to extend physical clearance');
});
test('M1 anatomical stone clearance has finite read-only budgets, and source renderers share height',async()=>{
 const {planCameraBodyOcclusion}=await load();
 const real=Object.freeze({x:0,z:0,silhouetteRecess:true});
 const camera=Object.freeze({x:7,y:2.2,z:0});
 const snapshot=JSON.stringify({real,camera});
 assert.equal(planCameraBodyOcclusion(4.5,0,[real],camera,2.6),true);
 assert.equal(planCameraBodyOcclusion(4.5,0,[real],camera,2.6),true);
 assert.equal(planCameraBodyOcclusion(4.5,0,[real],{x:7,z:0},2.6),false);
 assert.equal(planCameraBodyOcclusion(NaN,0,[real],camera,2.6),false);
 assert.equal(planCameraBodyOcclusion(4.5,0,[real],camera,Infinity),false);
 assert.equal(planCameraBodyOcclusion(4.5,0,[{x:Infinity,z:0,silhouetteRecess:true}],camera,2.6),false);
 const blank=Object.freeze({x:0,z:0});
 assert.equal(planCameraBodyOcclusion(4.5,0,[blank,blank,blank,blank,blank,real],camera,2.6),false);
 assert.equal(JSON.stringify({real,camera}),snapshot);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const dressing=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/wallPad,world\.userData\.wallHeights\?\.\[i\]/);
 assert.match(dressing,/wallPad,face\[4\]/);
 assert.match(app,/fullBodyHeroes,partiallyVisibleHeroes,fullBodyBosses,bodySamples/);
});

test('native armour shoulder sightlines expose real near stone but keep a distant Gothic room',async()=>{
 const {planCameraBodyOcclusion,planPartyWallReveal}=await load();
 const hero=Object.freeze({x:0,z:0,silhouetteRecess:true}),camera=Object.freeze({x:7,y:2.2,z:0});
 const original=JSON.stringify({hero,camera});
 assert.equal(planCameraBodyOcclusion(4.4,.6,[hero],camera,2.6),true);
 assert.equal(planPartyWallReveal(4.4,.6,[hero],camera,2.1,2.6),'sightline');
 assert.equal(planCameraBodyOcclusion(4.4,.6,[{x:0,z:0}],camera,2.6),false);
 assert.equal(planPartyWallReveal(5.1,.6,[hero],camera,2.1,2.6),'none');
 assert.equal(planCameraBodyOcclusion(4.4,.6,[hero],{...camera,y:15},2.6),false);
 assert.equal(JSON.stringify({hero,camera}),original);
});


test('native full-body travel stays visible through physical stone even without a combat close-up',async()=>{
 const {planPartyWallReveal,planCameraBodyOcclusion}=await load();
 const hero=Object.freeze({x:0,z:0,visibleActor:true});
 const camera=Object.freeze({x:7,y:2.2,z:0});
 const undecorated=Object.freeze({x:0,z:0});
 assert.equal(planCameraBodyOcclusion(4.5,0,[hero],camera,2.6),true,
  'the real visible adult body is physically hidden by a foreground wall');
 assert.equal(planPartyWallReveal(4.5,0,[hero],camera,2.1,2.6),'sightline',
  'normal travel must not leave a real hero beneath an opaque 3D wall');
 assert.equal(planCameraBodyOcclusion(4.5,0,[undecorated],camera,2.6),false,
  'arbitrary scene coordinates cannot manufacture character sightlines');
 assert.equal(planPartyWallReveal(4.5,0,[undecorated],camera,2.1,2.6),'sightline',
  'legacy scenic wedge remains separate from physically privileged visible actors');
 assert.equal(planPartyWallReveal(4.5,0,[hero],camera,2.1,.4),'none',
  'already lowered ruins must not open the rest of the nave');
 assert.equal(planPartyWallReveal(-4.5,0,[hero],camera),'none',
  'the rear Gothic cathedral remains present');
 assert.deepEqual(hero,{x:0,z:0,visibleActor:true});
});

test('only real living, visible Three.js actor roots can request travel-time body sightlines',async()=>{
 const {resolveRenderedSilhouetteSubjects}=await load();
 const state={map:Array(19).fill('.'.repeat(19)),units:[
  {id:'v',x:9,z:9,hp:75},{id:'fallen',x:10,z:9,hp:0}]};
 const pts=Object.freeze([{x:0,z:0},{x:1,z:0},{x:7,z:7}]);
 const actors=new Map([['v',{root:{visible:true,position:{x:.18,z:-.12}}}],
  ['fallen',{root:{visible:true,position:{x:1,z:0}}}]]);
 const actual=resolveRenderedSilhouetteSubjects(state,pts,actors);
 assert.equal(actual[0].visibleActor,true);
 assert.equal(actual[0].x,.18);assert.equal(actual[0].z,-.12);
 assert.equal(actual[1].visibleActor,undefined,'defeated actors must not carve the stage');
 assert.equal(actual[2].visibleActor,undefined,'unmatched scenic subject is not an actor');
 actors.get('v').root.visible=false;
 assert.equal(resolveRenderedSilhouetteSubjects(state,pts,actors)[0].visibleActor,undefined);
 assert.deepEqual(state.units[0],{id:'v',x:9,z:9,hp:75});
 assert.equal(pts[0].visibleActor,undefined);
});

test('the real 3D actor uses a foreground pocket but preserves its full cathedral rear wall',async()=>{
 const {planPartyWallReveal,planCameraBodyOcclusion}=await load();
 const subject=Object.freeze({x:0,z:0,silhouetteRecess:true,visibleActor:true});
 const cam=Object.freeze({x:7,y:2.2,z:0});
 assert.equal(planPartyWallReveal(-2.2,0,[subject],cam,2.1,2.6),'none');
 assert.equal(planPartyWallReveal(-.52,0,[subject],cam,2.1,2.6),'sightline');
 assert.equal(planCameraBodyOcclusion(4.5,0,[subject],cam,2.6),true);
 assert.equal(planPartyWallReveal(4.5,0,[subject],cam,2.1,2.6),'sightline');
 assert.equal(planPartyWallReveal(4.5,0,[subject],{...cam,y:12},2.1,2.6),'none');
 assert.deepEqual(subject,{x:0,z:0,silhouetteRecess:true,visibleActor:true});
});

test('genuine close wall cutaway exposes a real skinned fighter but retains the Gothic rear',async()=>{
 const {planPartyWallReveal:r}=await load();
 const hero=Object.freeze({x:0,z:0,visibleActor:true});
 const camera=Object.freeze({x:6,y:5.8,z:1});
 const original=JSON.stringify({hero,camera});
 assert.equal(r(.62,.34,[hero],camera,2.1,2.9),'sightline',
  'real torso and sword clearance must not rely on an approximate synthetic centre ray');
 assert.equal(r(-1.9,.34,[hero],camera,2.1,2.9),'none',
  'full-height rear chapel masonry must survive the presentation pocket');
 assert.equal(r(.62,.34,[hero],camera,2.1,.43),'sightline',
  '43cm parapets can still conceal planted boots and must fully recess in the direct ray');
 assert.equal(r(.62,.34,[hero],{...camera,y:15},2.1,2.9),'sightline',
  'even high sightlines can be blocked at the planted foot');
 assert.equal(JSON.stringify({hero,camera}),original);
});

test('all legal living party rigs remain in the physical view when the director omits them',async()=>{
 const {resolveRenderedSilhouetteSubjects}=await load();
 const state={map:Array(19).fill('.'.repeat(19)),units:[
  {id:'v',faction:'party',kind:'vanguard',x:9,z:9,hp:50},
  {id:'r',faction:'party',kind:'ranger',x:10,z:9,hp:50,action:'attack'},
  {id:'m',faction:'party',kind:'mystic',x:9,z:10,hp:50},
  {id:'fallen',faction:'party',kind:'vanguard',x:8,z:9,hp:0},
  {id:'ghost',faction:'party',kind:'ranger',x:11,z:9,hp:25}]};
 const actors=new Map([
  ['v',{root:{visible:true,position:{x:.16,z:0}}}],
  ['r',{root:{visible:true,position:{x:1.1,z:-.08}}}],
  ['m',{root:{visible:true,position:{x:0,z:1.12}}}],
  ['fallen',{root:{visible:true,position:{x:-1,z:0}}}],
  ['ghost',{root:{visible:false,position:{x:2,z:0}}}]]);
 const points=Object.freeze([{x:0,z:0}]), original=JSON.stringify(state);
 const out=resolveRenderedSilhouetteSubjects(state,points,actors);
 assert.equal(out.length,3);
 assert.deepEqual(out.map(p=>p.visibleActor),[true,true,true]);
 assert.deepEqual(out.map(p=>[p.x,p.z]),[[.16,0],[1.1,-.08],[0,1.12]]);
 assert.equal(out[1].combatRecess,true);
 assert.equal(out[2].silhouetteRecess,true);
 assert.equal(JSON.stringify(state),original,'authoritative snapshot must never change');
 assert.deepEqual(points,[{x:0,z:0}]);
});

test('a true moving rendered body stays privileged between two legal cardinal cells',async()=>{
 const {resolveRenderedSilhouetteSubjects}=await load();
 const map=Array(19).fill('.'.repeat(19));
 const state={map,units:[{id:'v',faction:'party',kind:'vanguard',hp:50,x:9,z:9}]};
 const actors=new Map([['v',{root:{visible:true,position:{x:-.74,z:.02}}}]]);
 const original=JSON.stringify(state);
 const moved=resolveRenderedSilhouetteSubjects(state,[{x:0,z:0}],actors);
 assert.equal(moved[0].visibleActor,true,'an actor traversing its real previous cell retains 3D sightlines');
 assert.equal(moved[0].x,-.74);
 // Walls, diagonal interpolation, teleports and dead people never earn a pocket.
 state.map[9]=state.map[9].slice(0,8)+'#'+state.map[9].slice(9);
 assert.equal(resolveRenderedSilhouetteSubjects(state,[{x:0,z:0}],actors)[0].visibleActor,undefined);
 state.map[9]='.'.repeat(19);actors.get('v').root.position={x:-.72,z:.62};
 assert.equal(resolveRenderedSilhouetteSubjects(state,[{x:0,z:0}],actors)[0].visibleActor,undefined);
 actors.get('v').root.position={x:-2,z:0};
 assert.equal(resolveRenderedSilhouetteSubjects(state,[{x:0,z:0}],actors)[0].visibleActor,undefined);
 assert.equal(JSON.stringify(state.units),JSON.stringify(JSON.parse(original).units));
});

test('the actual opaque facade is physically removed only when it cuts a moving adult figure',async()=>{
 const {planLiveFacadeBodyReveal}=await load();
 const face=[2.5,1.55,0,.84,3.05,.82],camera={x:5,y:3.7,z:0};
 const actual={x:0,z:0,visibleActor:true};
 const original=JSON.stringify([face,camera,actual]);
 assert.equal(planLiveFacadeBodyReveal(face,[actual],camera),true);
 assert.equal(planLiveFacadeBodyReveal(face,[{x:0,z:0}],camera),false,'synthetic marker cannot clear a wall');
 assert.equal(planLiveFacadeBodyReveal(face,[{x:0,z:0,visibleActor:false}],camera),false);
 assert.equal(planLiveFacadeBodyReveal([-2,1.55,0,.84,3.05,.82],[actual],camera),false,'rear Gothic stone remains');
 assert.equal(planLiveFacadeBodyReveal([7.5,1.55,0,.84,3.05,.82],[actual],camera),false,'stone beyond camera remains');
 assert.deepEqual([face,camera,actual],JSON.parse(original));
});

test('a nearby waist-high real ruin remains when it no longer intersects the skinned chest or boots',async()=>{
 const {planLiveFacadeBodyReveal}=await load();
 const face=[2.5,1.55,0,.84,3.05,.82],camera={x:5,y:3.7,z:0};
 const real=[{x:0,z:0,visibleActor:true}];
 assert.equal(planLiveFacadeBodyReveal(face,real,camera,'none'),true);
 assert.equal(planLiveFacadeBodyReveal(face,real,camera,'nearby'),false,
  '43cm background retains its geometry if the actual ray clears');
 assert.equal(planLiveFacadeBodyReveal(face,real,camera,'sightline'),false);
});

test('M1 high cinematic 3D camera retains REAL full-body fighting aperture without opening rear nave',async()=>{
 const {planPartyWallReveal}=await load();
 const camera=Object.freeze({x:6,y:10.2,z:0});
 const actor=Object.freeze({x:0,z:0,visibleActor:true,silhouetteRecess:true});
 const fighting=Object.freeze({x:0,z:0,visibleActor:true,silhouetteRecess:true,combatRecess:true});
 // Prior 8.5m cap + visibleActor early-continue silently reduced real skinned
 // heroes to ankle-obscuring 43cm parapets, as seen in Nov 5 Chromium pixels.
 for(const subject of [actor,fighting]){
  assert.equal(planPartyWallReveal(1.5,1.35,[subject],camera,2.1,.43),'sightline',
   'front shoulder/boot room must be physically clear at actual high-oblique camera height');
  assert.equal(planPartyWallReveal(-1.7,.4,[subject],camera),'none',
   'genuine rear nave stays tall');
  assert.equal(planPartyWallReveal(0,3.8,[subject],camera),'none',
   'distant side walls must stay intact');
 }
 assert.equal(planPartyWallReveal(1.5,1.35,[{x:0,z:0}],camera,2.1,.43),'sightline',
  'pre-existing verified cinematic scenic staging is retained separately from living actors');
 assert.deepEqual(actor,{x:0,z:0,visibleActor:true,silhouetteRecess:true});
});

test('M1 real bodies retain combat shoulder clearance across camera-angle and motion continuity',async()=>{
 const {planPartyWallReveal}=await load();
 const camera=Object.freeze({x:4.6,y:9.1,z:4.6});
 const hero=Object.freeze({x:.32,z:-.1,visibleActor:true,silhouetteRecess:true,combatRecess:true});
 assert.equal(planPartyWallReveal(1.5,1.55,[hero],camera,2.1,2.6),'sightline',
  'animated authentic combat rig must not be surrounded by a half-height masonry cage');
 assert.equal(planPartyWallReveal(-1.3,-1.5,[hero],camera,2.1,2.6),'none',
  'rear walls remain rich Gothic architecture');
 assert.equal(planPartyWallReveal(5,4,[hero],camera,2.1,2.6),'none',
  'far camera-side stone remains solid');
 assert.equal(planPartyWallReveal(1.5,1.55,[{x:.32,z:-.1,visibleActor:true}],camera,2.1,2.6),'sightline',
  'an actual validated but temporarily unmarked skinned actor must also be readable');
});

test('M1 living wandering hero retains feet and sword lane through nearest ruins without cinematic flags',async()=>{
 const {planPartyWallReveal}=await load();
 const highCamera={x:6,y:10.2,z:0},wandering={x:0,z:0,visibleActor:true};
 assert.equal(planPartyWallReveal(1.36,.65,[wandering],highCamera,2.1,.43),'sightline',
  'real idle exploration retains leg/boot clearance, not just a marked battle shot');
 assert.equal(planPartyWallReveal(2.5,1.75,[wandering],highCamera,2.1,.43),'none',
  'further scenic low ruins survive as textured spatial depth');
 assert.equal(planPartyWallReveal(-1.36,-.65,[wandering],highCamera,2.1,.43),'none',
  'living actor cannot flatten the rear nave');
 assert.equal(planPartyWallReveal(1.36,.65,[{x:0,z:0,visibleActor:false}],highCamera,2.1,.43),'sightline',
  'previous cinematic background staging stays intact and is not reclassified as a live rig');
});


test('whole-body projection rejects rear Gothic stone and fictional living figures',async()=>{
 const {planProjectedBodyAperture:aperture}=await load();
 const camera=Object.freeze({x:7,y:7,z:7});
 const view=Object.freeze({look:{x:0,y:1,z:0},fov:48,aspect:1440/832});
 const actor=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true});
 const front=Object.freeze([1,0,1,2,2.6,2]),rear=Object.freeze([-3,0,-3,-2,2.6,-2]);
 const original=JSON.stringify([camera,view,actor,front,rear]);
 assert.equal(aperture(front,[actor],camera,view),true);
 assert.equal(aperture(rear,[actor],camera,view),false);
 assert.equal(aperture(front,[{x:0,z:0}],camera,view),false);
 assert.equal(aperture(front,Array(6).fill(actor),camera,view),false);
 assert.equal(aperture([0,0,0,100,2,1],[actor],camera,view),false);
 assert.equal(aperture(front,[actor],camera,{...view,fov:NaN}),false);
 assert.equal(JSON.stringify([camera,view,actor,front,rear]),original);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8'),
  env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/screenSpaceWallReveals/);
 assert.match(app,/renderedBodyView=\{look:cameraAim,fov:camera\.fov,aspect:camera\.aspect\}/);
 assert.match(app,/planProjectedBodyAperture\(world\.userData\.authoredPropVolumes/);
 assert.match(env,/screenSpaceClearedFacades/);
});

test('five scenic shot slots cannot starve real party bodies from camera and stone clearance',async()=>{
 const {resolveRenderedSilhouetteSubjects}=await load();
 const map=Array(19).fill('.'.repeat(19));
 const units=[
  {id:'v',faction:'party',kind:'vanguard',x:9,z:9,hp:75},
  {id:'r',faction:'party',kind:'ranger',x:10,z:9,hp:55,action:'attack'},
  {id:'m',faction:'party',kind:'mystic',x:9,z:10,hp:40}
 ];
 const state=Object.freeze({map,units:units.map(u=>Object.freeze(u))});
 const actors=new Map([
  ['v',{root:{visible:true,position:{x:.1,z:0}}}],
  ['r',{root:{visible:true,position:{x:1,z:.1}}}],
  ['m',{root:{visible:true,position:{x:.08,z:1}}}]
 ]);
 const scenic=Object.freeze(Array.from({length:5},(_,i)=>Object.freeze({x:7+i,z:-6+i})));
 const original=JSON.stringify(state);
 const out=resolveRenderedSilhouetteSubjects(state,scenic,actors);
 assert.equal(out.length,5,'camera/cutaway remains bounded to five');
 assert.deepEqual(out.slice(0,2),scenic.slice(0,2),'primary scene focus survives');
 assert.deepEqual(out.slice(2).map(p=>p.kind),['mystic','ranger','vanguard'],
  'only secondary unverified stage marks are replaced by genuine bodies');
 assert.ok(out.slice(2).every(p=>p.visibleActor===true),'all three skinned heroes receive physical cutaway');
 assert.ok(out.some(p=>p.kind==='ranger'&&p.combatRecess===true));
 actors.get('r').root.visible=false;
 const hidden=resolveRenderedSilhouetteSubjects(state,scenic,actors);
 assert.equal(hidden.filter(p=>p.visibleActor===true).length,2,
  'an invisible root cannot displace a scenic marker or earn transparency');
 assert.equal(JSON.stringify(state),original);
 assert.deepEqual(scenic,Array.from({length:5},(_,i)=>({x:7+i,z:-6+i})));
});


test('the real high-angle close-combat camera clears the near flank and weapon lane but retains rear Gothic mass',async()=>{
 const {planPartyWallReveal:reveal}=await load();
 const camera=Object.freeze({x:7,y:10,z:2});
 const fighter=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true,combatRecess:true});
 assert.equal(reveal(2.55,1.10,[fighter],camera,2.1,2.65),'sightline',
  'the actual near-flank figure must be readable at this real 3D camera height');
 assert.equal(reveal(-3.5,-1,[fighter],camera,2.1,2.65),'none',
  'distant Gothic rear architecture remains full-height');
 assert.equal(reveal(5.8,4.1,[fighter],camera,2.1,2.65),'none',
  'the next room must never be flattened for a hero close-up');
});


test('portrait camera clears only significant actual foreground props across the living combat acting lane',async()=>{
 const {planPortraitStageClearance}=await load();
 const camera=Object.freeze({x:0,y:5,z:8});
 const view=Object.freeze({look:{x:0,y:1,z:0},fov:48,aspect:390/844});
 const combat=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true,combatRecess:true});
 const front=Object.freeze([-.18,0,2.45,.18,2.35,2.85]);
 assert.equal(planPortraitStageClearance(front,[combat],camera,view),true,
  'a tall close foreground pillar must not hide a living fighter on a narrow phone');
 assert.equal(planPortraitStageClearance(front,[{...combat,combatRecess:false}],camera,view),false,
  'ordinary travel retains the architectural landmark outside actual combat');
 assert.equal(planPortraitStageClearance(front,[{...combat,visibleActor:false}],camera,view),false,
  'a scenic marker cannot erase a physically rendered stone column');
 assert.equal(planPortraitStageClearance(front,[combat],camera,{...view,aspect:1440/832}),false,
  'desktop keeps its wider environmental composition');
 assert.equal(planPortraitStageClearance([-.18,0,-2.85,.18,2.35,-2.45],[combat],camera,view),false,
  'rear stone stays as the true depth backdrop of the encounter');
 assert.equal(planPortraitStageClearance([3.75,0,2.45,4.1,2.35,2.85],[combat],camera,view),false,
  'side architecture away from the fighter keeps a distinctive scene');
 assert.equal(planPortraitStageClearance([-.01,0,2.45,.01,.08,2.5],[combat],camera,view),false,
  'a minuscule stage fitting cannot be removed as a giant prop');
 assert.equal(planPortraitStageClearance(front,[combat],camera,view),true);
 assert.deepEqual(combat,{x:0,z:0,kind:'vanguard',visibleActor:true,combatRecess:true});
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/portraitStageClearance:\{props:/);
 assert.match(app,/planPortraitStageClearance\(world\.userData\.authoredPropVolumes/);
 assert.match(env,/planPortraitStageClearance\(foregroundVolumes\[i\]/);
 assert.match(app,/planPortraitStageClearance\(world\.userData\.foregroundPropVolumes/);
 assert.doesNotMatch(app,/\\n  world\.userData\.portraitStage/);
});

test('organic portrait approach clears a dominating close pillar without erasing modest travel landmarks or rear masonry',async()=>{
 const {planPortraitStageClearance}=await load();
 const camera=Object.freeze({x:0,y:5,z:8});
 const portrait=Object.freeze({look:{x:0,y:1,z:0},fov:48,aspect:390/844});
 const actor=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true,combatRecess:false});
 // This is the actual failure class in Nov 6 genuine 390px browser footage:
 // a broad right-hand pillar hides the upcoming play space while the hero's
 // skull/chest rays remain clear and no authored attack has fired yet.
 const large=Object.freeze([.6,0,2.45,1.1,2.6,2.85]);
 const modest=Object.freeze([-.18,0,2.45,.18,2.35,2.85]);
 const rear=Object.freeze([-.55,0,-2.85,.55,2.6,-2.45]);
 const distantSide=Object.freeze([3.75,0,2.45,4.1,2.6,2.85]);
 const original=JSON.stringify([camera,portrait,actor,large,modest,rear,distantSide]);
 assert.equal(planPortraitStageClearance(large,[actor],camera,portrait),true,
  'the oversized real foreground stage blocker must clear during organic approach, not only after a hit');
 assert.equal(planPortraitStageClearance(modest,[actor],camera,portrait),false,
  'ordinary small props keep the dungeon authored and recognizably physical');
 assert.equal(planPortraitStageClearance(rear,[actor],camera,portrait),false,
  'far/rear carved architecture never disappears');
 assert.equal(planPortraitStageClearance(distantSide,[actor],camera,portrait),false,
  'unrelated side scenery must not disappear');
 assert.equal(planPortraitStageClearance(large,[{...actor,visibleActor:false}],camera,portrait),false,
  'a simulated scenic marker does not authorize cutaway');
 assert.equal(planPortraitStageClearance(large,[actor],camera,{...portrait,aspect:1440/832}),false,
  'desktop camera keeps the original physical composition');
 assert.equal(planPortraitStageClearance(large,Array(6).fill(actor),camera,portrait),false,
  'the per-frame actor budget is never lifted');
 assert.equal(JSON.stringify([camera,portrait,actor,large,modest,rear,distantSide]),original,
  'render composition cannot mutate source state');
 const physicalCamera=fs.readFileSync(path.join(root,'public/ai-dungeon/physical-camera-director.js'),'utf8');
 assert.match(physicalCamera,/planPortraitStageClearance\(box,eyes,cam,view\)/,
  'camera scoring must agree with actual rendered foreground removal');
});

test('original physical foreground recedes below stone and returns without one-frame geometry pop',async()=>{
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/foreground-recession.js'),'utf8');
 const {applyForegroundRecession}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 const g={position:{x:4,y:1,z:2},visible:true,userData:{}},box=[3,0,1,5,2.5,3];
 assert.equal(applyForegroundRecession(g,true,.04,false,box),true);
 assert.equal(g.visible,false);
 assert.ok(g.position.y<0);
 applyForegroundRecession(g,false,.05,false,box);
 assert.ok(g.visible&&g.position.y<1&&g.position.y> -2);
 for(let i=0;i<5;i++)applyForegroundRecession(g,false,.05,false,box);
 assert.equal(g.position.y,1);
 assert.equal(g.position.x,4);
 assert.equal(g.position.z,2);
 for(let i=0;i<3;i++)applyForegroundRecession(g,true,.05,false,box);
 assert.equal(g.visible,false);
 applyForegroundRecession(g,false,.05,true,box);
 assert.equal(g.position.y,1);
 applyForegroundRecession(g,true,.05,true,box);
 assert.equal(g.visible,false);
 assert.equal(applyForegroundRecession(null,true,.05),false);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/applyForegroundRecession\(group,hidden\|\|portrait\|\|danger,frameDt,reduced/);
 assert.match(app,/applyForegroundRecession\(prop,blocked\|\|warningBlocked,dt,reduced/);
 assert.match(env,/applyForegroundRecession\(group,blocked\|\|portrait\|\|warningBlocked,frameDt,reducedMotion/);
 assert.ok(server.includes("['/dungeon/foreground-recession.js','foreground-recession.js']"));
});


test('M1 portrait protects live source-skinned actors against a genuine lens-near Gothic column missed by distant-actor filters',async()=>{
 const {planPortraitStageClearance}=await load();
 const cam=Object.freeze({x:0,y:1.5,z:2.8});
 const phone=Object.freeze({look:{x:0,y:1,z:0},fov:50,aspect:390/844});
 const fighter=Object.freeze({x:0,z:-6,kind:'vanguard',visibleActor:true,combatRecess:false});
 // A tall, original WORLD-SPACE pillar 30cm in front of the actual lens.
 // The actor stands >7.1m beyond its origin: old actor-radius checks miss
 // this obstruction, leaving a real camera-centre Gothic monolith on screen.
 const lensPillar=Object.freeze([-.42,0,2.1,.42,2.8,2.5]);
 const farPillar=Object.freeze([-.42,0,1.0,.42,2.8,1.4]);
 const sidePillar=Object.freeze([3.2,0,2.1,4,2.8,2.5]);
 const lowRubble=Object.freeze([-.42,0,2.1,.42,.46,2.5]);
 const behindActor=Object.freeze([-.42,0,-8.2,.42,2.8,-7.8]);
 const before=JSON.stringify({cam,phone,fighter,lensPillar});
 assert.equal(planPortraitStageClearance(lensPillar,[fighter],cam,phone),true,
  'the true camera-to-body rays must clear a giant lens-near column during ordinary play');
 assert.equal(planPortraitStageClearance(farPillar,[fighter],cam,phone),false,
  'the lens rescue never removes ordinary stone outside its short clearance');
 assert.equal(planPortraitStageClearance(sidePillar,[fighter],cam,phone),false,
  'wide side architecture cannot borrow a living actor cutaway');
 assert.equal(planPortraitStageClearance(lowRubble,[fighter],cam,phone),false,
  'low original ruin relief stays rendered and physically readable');
 assert.equal(planPortraitStageClearance(behindActor,[fighter],cam,phone),false,
  'authentic background architecture behind the fighter must be preserved');
 assert.equal(planPortraitStageClearance(lensPillar,[{...fighter,visibleActor:false}],cam,phone),false,
  'an invented scenic marker may not destroy original architecture');
 assert.equal(planPortraitStageClearance(lensPillar,[fighter],cam,{...phone,aspect:1440/832}),false,
  'wide desktop framing retains its architectural depth');
 assert.equal(planPortraitStageClearance(lensPillar,Array(6).fill(fighter),cam,phone),false,
  'more than five actor claims fail closed rather than scaling workload');
 assert.equal(planPortraitStageClearance(lensPillar,[fighter],{...cam,x:NaN},phone),false);
 assert.equal(JSON.stringify({cam,phone,fighter,lensPillar}),before,'planner is immutable');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const env=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/planPortraitStageClearance\(world\.userData\.authoredPropVolumes/);
 assert.match(app,/planPortraitStageClearance\(world\.userData\.foregroundPropVolumes/);
 assert.match(env,/planPortraitStageClearance\(foregroundVolumes\[i\]/);
});


test('M1 genuine high-oblique portrait shot clears a dominant foreground column even when its 3D box is far beneath the camera lens',async()=>{
 const {planPortraitStageClearance}=await load();
 const camera=Object.freeze({x:0,y:8,z:9});
 const portrait=Object.freeze({look:{x:0,y:1,z:0},fov:48,aspect:390/844});
 const actor=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true,combatRecess:false});
 // Real 3D original stone at the near half of the stage, taller than the
 // fighter but physically well below an 8m-high cinematic camera lens.
 const giant=Object.freeze([-.45,0,2.6,.45,2.75,3.4]);
 const low=Object.freeze([-.45,0,2.6,.45,.58,3.4]);
 const modest=Object.freeze([-.18,0,2.6,.18,2.35,3.4]);
 const back=Object.freeze([-.45,0,-3.4,.45,2.75,-2.6]);
 const far=Object.freeze([-.45,0,8.2,.45,2.75,8.8]);
 assert.equal(planPortraitStageClearance(giant,[actor],camera,portrait),true,
  'a >half-width and >half-height near-stage screen blocker must not dominate the live phone camera');
 assert.equal(planPortraitStageClearance(low,[actor],camera,portrait),false,'low world detail is preserved');
 assert.equal(planPortraitStageClearance(modest,[actor],camera,portrait),false,'small decorative silhouette is retained');
 assert.equal(planPortraitStageClearance(back,[actor],camera,portrait),false,'real rear 3D stone stays intact');
 assert.equal(planPortraitStageClearance(far,[actor],camera,portrait),false,'near-plane unrelated scenery stays intact');
 assert.equal(planPortraitStageClearance(giant,[{...actor,visibleActor:false}],camera,portrait),false,
  'only real visible skinned source bodies can earn a foreground clear');
 assert.equal(planPortraitStageClearance(giant,[actor],camera,{...portrait,aspect:1440/900}),false,
  'real 1440px desktop keeps its full original nave depth');
});
