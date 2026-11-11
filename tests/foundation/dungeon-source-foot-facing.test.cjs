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
