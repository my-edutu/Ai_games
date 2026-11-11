'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');

async function load(){
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/native-rig-deformation-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const foot=(x,z)=>({heel:[x,-.02,z-.13],toe:[x,-.02,z+.13]});
const original=(x,z,yaw=0)=>({
 id:'vanguard',kind:'vanguard',mode:'move',sourceInstanceId:'original-cloned-rig',
 sourceActionSample:{clipName:'Walking_A',time:.12,duration:1.0416666},
 rootWorld:[x,0,z],rootYaw:yaw,
 footJointWorld:{left:[x-.18,.08,z],right:[x+.18,.08,z]},
 sourceSolePatchWorld:{left:foot(x-.18,z),right:foot(x+.18,z)}
});
const metadata={visible:true,teleport:false,beforeFrame:8,afterFrame:9,
 beforeTick:3,afterTick:3,floorEvidence:'authored-cube-floor-top',floorTopY:-.02};

test('original moving source-rig facing is evaluated against true world travel, without calling unlabeled extrema anatomical toes',async()=>{
 const {auditOriginalSourceFootFacing:audit}=await load();
 assert.equal(typeof audit,'function');
 const before=original(-8,-8,0),after=original(-8,-8.10,0);
 const result=audit(before,after,metadata);
 assert.equal(result.comparable,true);
 assert.equal(result.classification,'source-facing-aligned');
 assert.ok(result.forwardAlignment>.99);
 assert.equal(result.sourceClip,'Walking_A');
 assert.equal(result.footEnds.left.forwardExtreme,'heel');
 assert.equal(result.footEnds.left.rearwardExtreme,'toe');
 assert.equal(result.anatomicalToeVerified,false);
 assert.equal(result.provenFootPlant,false);
 assert.equal(result.ikAccepted,false);
});

test('original licensed foot-facing trace exposes sideways/backwards movement without rewriting authority or bone poses',async()=>{
 const {auditOriginalSourceFootFacing:audit}=await load();
 const east=original(-7.9,-8,0);
 const side=audit(original(-8,-8,0),east,metadata);
 assert.equal(side.comparable,true);
 assert.equal(side.classification,'source-facing-lags-world-travel');
 assert.ok(Math.abs(side.forwardAlignment)<.01);
 const reversed=audit(original(-8,-8,0),original(-8,-7.90,0),metadata);
 assert.equal(reversed.classification,'source-facing-lags-world-travel');
 assert.ok(reversed.forwardAlignment<-.99);
});

test('never invent original orientation from sparse, clipped, unrelated or invalid source observations',async()=>{
 const {auditOriginalSourceFootFacing:audit}=await load();
 const a=original(-8,-8),b=original(-8,-8.10);
 const reject=(before,after,meta)=>{const r=audit(before,after,meta);assert.equal(r.comparable,false);assert.equal(r.ikAccepted,false);assert.equal(r.provenFootPlant,false)};
 reject(a,b,{...metadata,afterFrame:10});
 reject(a,b,{...metadata,afterTick:4});
 reject(a,{...b,sourceInstanceId:'replacement'},metadata);
 reject(a,{...b,rootYaw:NaN},metadata);
 reject(a,{...b,sourceSolePatchWorld:{left:null,right:null}},metadata);
 reject(a,{...b,sourceActionSample:{clipName:'Idle',time:.1,duration:1}},metadata);
 reject(a,{...b,rootWorld:[-8,0,-16]},metadata);
 reject(a,b,{...metadata,teleport:true});
 reject(a,b,{...metadata,floorEvidence:'guessed'});
});

test('original Walking_A keeps true travel heading through the last 70mm of a licensed step',async()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8');
 const {planMovementFacing,planOriginalSourceWalkNearArrivalFacing,approachCharacterYaw,shortestYawDelta}=
  await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const north={
  sourceRig:true,sourceClipName:'Walking_A',mode:'move',
  groundedMoving:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,hasCombatFacing:false,
  previousX:-8,previousZ:-7.12,currentX:-8,currentZ:-7.03514902944,
  targetX:-8,targetZ:-7
 };
 // Verified 390px original rig: it visibly travelled 85mm and then 28mm
 // with its source yaw frozen at -0.85rad. The legacy distance<70mm gate
 // drops the target BEFORE the actual imported-clip movement stops.
 assert.equal(planMovementFacing(north.currentX,north.currentZ,north.targetX,north.targetZ),null);
 const heading=planOriginalSourceWalkNearArrivalFacing(north);
 assert.equal(Number.isFinite(heading),true);
 assert.ok(Math.abs(shortestYawDelta(heading,Math.PI))<.00001);
 const before=-.85;
 const once=approachCharacterYaw(before,heading,.05);
 assert.ok(Math.abs(shortestYawDelta(once,heading))<
  Math.abs(shortestYawDelta(before,heading))-.3,
  'real northbound shoe travel should no longer preserve a sideways/backward facing root');
 const tail=planOriginalSourceWalkNearArrivalFacing({...north,
  previousZ:-7.03514902944,currentZ:-7.00724744967});
 assert.ok(Math.abs(shortestYawDelta(tail,heading))<.00001,
  'second authentic 28mm adjacent shoe frame keeps facing its actual direction');
 const east=planOriginalSourceWalkNearArrivalFacing({...north,
  previousX:-8,previousZ:-7,currentX:-7.95,currentZ:-7,targetX:-7.94,targetZ:-7});
 assert.ok(Math.abs(shortestYawDelta(east,-Math.PI/2))<.00001);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planOriginalSourceWalkNearArrivalFacing/);
 assert.match(app,/a\.combatFacing\?\.yaw/,'real combat facing must keep priority');
});

test('near-arrival source turn never invents direction from idle, combat, hidden, dead or teleport frames',async()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8');
 const {planOriginalSourceWalkNearArrivalFacing:heading}=
  await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const sample={sourceRig:true,sourceClipName:'Walking_A',mode:'move',
  groundedMoving:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,hasCombatFacing:false,
  previousX:-8,previousZ:-7.12,currentX:-8,currentZ:-7.035,
  targetX:-8,targetZ:-7};
 assert.ok(Number.isFinite(heading(sample)));
 for(const mutation of [
  {sourceRig:false},{sourceClipName:'Idle'},{sourceClipName:'Attack_A'},
  {mode:'idle'},{mode:'attack'},{groundedMoving:false},
  {alive:false},{visible:false},{teleport:true},{reducedMotion:true},
  {hasCombatFacing:true},{previousX:Infinity},{currentZ:NaN},
  {targetZ:-8},{previousZ:-7.035},{currentZ:-5.5},
  {previousZ:-7.04,currentZ:-7.035}
 ])assert.equal(heading({...sample,...mutation}),null,
  'unwitnessed/unauthorized source heading must preserve legacy facing: '+JSON.stringify(mutation));
});

test('licensed walking source finishes a witnessed final turn only through a live outgoing Walking_A crossfade',async()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8');
 const {advanceOriginalSourceWalkTurnRelease:advance,shortestYawDelta,approachCharacterYaw}=
  await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 assert.equal(typeof advance,'function');
 // Exact original 390px witnessed source: final world step ended near [-8,-7]
 // after changing yaw from -.85 to -1.70; legitimate north heading is PI.
 const live={
  sourceRig:true,sourceClipName:'Walking_A',sourceWalkExit:false,
  mode:'move',groundedMoving:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,hasCombatFacing:false,
  currentX:-8,currentZ:-7,targetX:-8,targetZ:-7,
  observedWalkYaw:Math.PI,rootYaw:-1.7,frameInterval:.04
 };
 const first=advance(null,live);
 assert.ok(Math.abs(shortestYawDelta(first.heading,Math.PI))<1e-6);
 assert.ok(first.memory);
 let yaw=approachCharacterYaw(-1.7,first.heading,.04);
 const outgoing={...live,sourceClipName:'Idle',sourceWalkExit:true,
  mode:'idle',groundedMoving:false,observedWalkYaw:null};
 const release=advance(first.memory,{...outgoing,rootYaw:yaw});
 assert.ok(release.memory&&release.heading!==null,
  'the legally outgoing source Walking_A still owns the feet during a short facing completion');
 const next=approachCharacterYaw(yaw,release.heading,.04);
 assert.ok(Math.abs(shortestYawDelta(next,Math.PI))<
  Math.abs(shortestYawDelta(yaw,Math.PI))-.1);
 let current=release,age=0;
 for(let i=0;i<10&&current.memory;i++){
  age+=.04;
  current=advance(current.memory,{...outgoing,rootYaw:next});
 }
 assert.equal(current.heading,null,'turn memory has a strictly bounded visible lifetime');
 assert.equal(current.memory,null);
});

test('actual original mobile Walking_A 9–70mm last approach seeds legally witnessed finishing turn',async()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8');
 const {advanceOriginalSourceWalkTurnRelease:advance,shortestYawDelta}=
  await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 // Real source rAF on 11 Nov, 390px, tick 2, frames 28->29:
 // legal final ~45mm northbound approach turns -.850 -> -1.275rad,
 // then 7mm at -1.7rad: old <=9mm witness gate dropped the
 // first heading and left the actual Walking_A body sideways.
 const sample={sourceRig:true,sourceClipName:'Walking_A',sourceWalkExit:false,
  mode:'move',groundedMoving:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,hasCombatFacing:false,currentX:-8,currentZ:-7.035,
  targetX:-8,targetZ:-7,observedWalkYaw:Math.PI,
  rootYaw:-1.275,frameInterval:.04};
 const witnessed=advance(null,sample);
 assert.ok(witnessed.memory,'observed source 45mm step inside 70mm heading dead zone must seed a bounded final-turn witness');
 assert.ok(Math.abs(shortestYawDelta(witnessed.heading,Math.PI))<1e-6);
 const micro=advance(witnessed.memory,{...sample,currentZ:-7.007,
  rootYaw:-1.7,observedWalkYaw:null});
 assert.ok(micro.memory&&Math.abs(shortestYawDelta(micro.heading,Math.PI))<1e-6,
  'original 7mm final step must inherit only that genuinely observed direction');
 const outgoing=advance(micro.memory,{...sample,mode:'idle',groundedMoving:false,
  sourceClipName:'Idle',sourceWalkExit:true,currentZ:-7,
  rootYaw:-2.04,observedWalkYaw:null});
 assert.ok(outgoing.memory,'existing outgoing Walking_A may finish its bounded angular release');
 for(const mutation of [{currentZ:-7.075},{mode:'idle',groundedMoving:false},
  {sourceClipName:'Idle'},{sourceWalkExit:true,sourceClipName:'Idle',
  mode:'idle',groundedMoving:false,observedWalkYaw:null},{hasCombatFacing:true},
  {teleport:true},{reducedMotion:true}]){
  assert.deepEqual(advance(null,{...sample,...mutation}),{heading:null,memory:null},
   'unwitnessed, interrupted or outside-near-zone stance must never invent a turn');
 }
});

test('the final source turn cannot survive new targets, combat, evasions, missing rigs, reduced motion or false outgoing clips',async()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8');
 const {advanceOriginalSourceWalkTurnRelease:advance}=
  await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const sample={sourceRig:true,sourceClipName:'Walking_A',
  sourceWalkExit:false,mode:'move',groundedMoving:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  hasCombatFacing:false,currentX:-8,currentZ:-7,targetX:-8,targetZ:-7,
  observedWalkYaw:Math.PI,rootYaw:-1.7,frameInterval:.025};
 const witness=advance(null,sample);
 assert.ok(witness.memory);
 const candidate={...sample,mode:'idle',groundedMoving:false,
  sourceClipName:'Idle',sourceWalkExit:true,observedWalkYaw:null};
 for(const mutation of [
  {sourceRig:false},{sourceWalkExit:false},{sourceClipName:'Attack_A'},
  {mode:'attack'},{mode:'hurt'},{mode:'evade'},
  {groundedMoving:true},{alive:false},{visible:false},
  {teleport:true},{reducedMotion:true},{hasCombatFacing:true},
  {targetX:-7},{currentZ:-7.10},{rootYaw:NaN},
  {frameInterval:NaN},{frameInterval:.5}
 ]){
  const result=advance(witness.memory,{...candidate,...mutation});
  assert.deepEqual(result,{heading:null,memory:null},JSON.stringify(mutation));
 }
 assert.deepEqual(advance(null,candidate),{heading:null,memory:null});
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/advanceOriginalSourceWalkTurnRelease/);
 assert.match(app,/walkArrivalPendingAction/);
});

test('real source Walking_A turn spends observed visible time rather than capped software-WebGL clock',async()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/facing-plan.js'),'utf8');
 const {approachOriginalSourceWalkYaw:turn,approachCharacterYaw:legacy,shortestYawDelta:delta}=
  await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.equal(typeof turn,'function');
 const walking={originalWalking:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,hasCombatFacing:false};
 // 11 Nov original mobile source GLB frames: one real Walking_A frame advanced
 // about 95mm in a throttled delivery while the source root yaw advanced only
 // the old 50ms cap (.425rad). Retain 8.5rad/s, cap sparse-frame progress to
 // 75ms, and preserve the actual -PI target through the legitimate final step.
 const from=-.85,target=-Math.PI;
 const old=legacy(from,target,.05,false);
 const actual=turn(from,target,.05,.095,walking);
 assert.ok(Math.abs(delta(from,actual))>.425+.12,
  'source rig should not lose its legal visual turn because WebGL delivered slowly');
 assert.ok(Math.abs(delta(from,actual))<=8.5*.075+1e-8,
  'no large one-frame source body spin on long frames');
 assert.ok(Math.abs(delta(actual,target))<Math.abs(delta(old,target))-.12);
 const ordinary=turn(from,target,.016,.016,walking);
 assert.ok(Math.abs(delta(ordinary,legacy(from,target,.016,false)))<1e-9,
  'normal 60Hz original clip facing is unchanged');
 const capped=turn(from,target,.05,.5,walking);
 assert.ok(Math.abs(delta(capped,actual))<1e-9,
  'a 500ms frame may not spin through an entire imported-clip stride');
 for(const change of [{originalWalking:false},{alive:false},{visible:false},
  {teleport:true},{reducedMotion:true},{interrupted:true},
  {hasCombatFacing:true}]){
  const state={...walking,...change};
  const result=turn(from,target,.05,.095,state);
  assert.equal(result,legacy(from,target,.05,state.reducedMotion),
   'non-source, reduced-motion or interrupted actor retains existing source-neutral yaw');
 }
 assert.equal(turn(from,NaN,.05,.095,walking),from,'invalid target never fabricates a turn');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/approachOriginalSourceWalkYaw/);
 assert.match(app,/hasCombatFacing:Boolean\(a\.combatFacing\)/);
});
