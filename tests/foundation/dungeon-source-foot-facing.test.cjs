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
