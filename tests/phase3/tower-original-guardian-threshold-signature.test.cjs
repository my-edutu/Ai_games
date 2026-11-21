'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const plan=import('../../public/infinite-tower-climb/visuals/source-original-guardian-threshold-signature.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const exitX=cap.x+Math.floor(cap.width*.76);

test('original F8 HP-gated opening has one fully open, visually legible structural silhouette',async()=>{
 const {sourceOriginalGuardianThresholdSignature}=await plan;
 const sig=sourceOriginalGuardianThresholdSignature({platform:cap,worldWidth:480000,guardianExitX:exitX});
 assert.ok(sig);
 assert.equal(sig.oldCapId,'f8:cap');
 assert.equal(sig.thresholdX,exitX);
 assert.equal(sig.nonColliding,true);
 assert.equal(sig.sourceBound,true);
 assert.equal(sig.members.length,11);
 const names=new Set(sig.members.map(s=>s.name));
 assert.equal(names.size,sig.members.length,'no duplicate structural components');
 assert.ok([...names].some(x=>x.includes('crown')));
 assert.ok([...names].some(x=>x.includes('shoulder')));
 for(const member of sig.members){
  assert.ok(['bronze','edge'].includes(member.material));
  assert.ok(member.from.length===3&&member.to.length===3);
  assert.ok([...member.from,...member.to,member.radius].every(Number.isFinite));
  assert.ok(member.radius>0&&member.radius<=.2);
  if(Math.min(member.from[1],member.to[1])<4.9){
   const minX=Math.min(Math.abs(member.from[0]),Math.abs(member.to[0]));
   assert.ok(minX>=3.55,'leave the real adult-body gate lane clear at hero height');
  }
 }
 assert.ok(sig.members.some(m=>m.name==='original-portal-crown'&&m.from[1]>=6.9),'readable high keystone crown');
});

test('never author a victory portal for another floor or unsupported cap geometry',async()=>{
 const {sourceOriginalGuardianThresholdSignature:make}=await plan;
 const valid={platform:cap,worldWidth:480000,guardianExitX:exitX};
 for(const mutation of [
  {platform:{...cap,id:'f9:cap'}},
  {platform:{...cap,width:0}},
  {platform:{...cap,x:600000}},
  {worldWidth:0},{worldWidth:300000},
  {guardianExitX:exitX-1},{guardianExitX:NaN}
 ])assert.equal(make({...valid,...mutation}),null);
});

test('the same physical F8 original frame must be inherited at F9, with real roof guide but no duplicate gate or collision',()=>{
 const source=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
 assert.match(source,/sourceOriginalGuardianThresholdSignature\(\{\s*platform:p,worldWidth:width,/);
 assert.match(source,/SourceOriginalGuardianHPGateThresholdSignature/);
 assert.match(source,/originalThresholdSignature\.members/);
 assert.match(source,/const inheritedCanopy=sharedPhysicalRoof/);
 assert.match(source,/const joinedRoofSpans=sharedPhysicalRoof/);
 assert.match(source,/SourceEarnedActualFloorNineRouteTrace/);
 assert.doesNotMatch(source,/platforms\.set\(['"]SourceOriginalGuardianHPGateThresholdSignature/);
});
