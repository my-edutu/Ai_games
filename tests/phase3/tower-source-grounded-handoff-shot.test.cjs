'use strict';
// Source-authentic post-guardian Floor8→9 camera continuity. This test does
// not claim native-video timing, visibility or device-performance acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const helper=import('../../public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs');
const coordinates=import('../../public/infinite-tower-climb/visuals/coordinates.mjs');
const roof=3224000,base=2880000,width=480000,exitX=304896;
async function fixtures(){
 const {pointFor}=await coordinates;
 const oldGate=pointFor(exitX,roof+20000,base,width,27.78);
 const inset=27.78-25;
 const arch=[oldGate.x-inset*Math.sin(oldGate.angle),oldGate.y+.6,
   oldGate.z-inset*Math.cos(oldGate.angle)];
 const source={lifecycle:'running',stale:false,runToken:'original-run-8-9',
   floor:9,tick:451,chunkBaseY:base,worldWidth:width,
   player:{x:324296,y:roof+14000,halfHeight:14000,health:5,
     grounded:true,groundedPlatformId:'f9:ground',state:'standing'}};
 const stage={sourceBound:true,active:true,stage:'handoff',
   runToken:source.runToken,floor:9,sourceTick:451,
   ageSeconds:1.05,durationSeconds:2.9,innerDoorAssemblyVisible:true,
   continuousGroundedHandoff:true,focusPosition:arch};
 return {source,stage};
}
test('real grounded successor keeps one continuous safe doorway shot at desktop and portrait without changing source',async()=>{
 const {observedGroundedHandoffShot}=await helper;
 const {source,stage}=await fixtures();
 const untouched=JSON.stringify([source,stage]);
 const desk=observedGroundedHandoffShot(source,stage,960/600);
 const phone=observedGroundedHandoffShot(source,stage,390/844);
 assert.equal(desk.groundedHandoff,true);
 assert.equal(phone.groundedHandoff,true);
 assert.equal(desk.sourceTick,source.tick);
 assert.ok(phone.radius>desk.radius && desk.radius>=30);
 assert.ok(phone.focusWeight>.1&&phone.focusWeight<=.36);
 assert.equal(JSON.stringify([source,stage]),untouched);
});
test('absent guardian proof, other run, other floor, stale source, unsupported body or distant arch cannot claim crossing',async()=>{
 const {observedGroundedHandoffShot}=await helper;
 const {source:s,stage:g}=await fixtures();
 const cases=[
  [{...s,stale:true},g],[{...s,lifecycle:'result'},g],
  [{...s,runToken:'another'},g],[{...s,floor:10},g],
  [{...s,tick:450},g],[{...s,tick:600},g],
  [{...s,player:{...s.player,health:0}},g],
  [{...s,player:{...s.player,grounded:false}},g],
  [{...s,player:{...s.player,state:'airborne'}},g],
  [{...s,player:{...s.player,groundedPlatformId:'f9:p2'}},g],
  [{...s,player:{...s.player,x:80000}},g],
  [{...s,player:{...s.player,y:s.player.y+95000}},g],
  [s,{...g,stage:'earned-open'}],[s,{...g,continuousGroundedHandoff:false}],
  [s,{...g,innerDoorAssemblyVisible:false}],
  [s,{...g,runToken:'other'}],[s,{...g,floor:8}],
  [s,{...g,ageSeconds:3}],[s,{...g,active:false}],
  [s,{...g,focusPosition:[NaN,0,0]}],
 ];
 for (const [a,b] of cases)assert.equal(observedGroundedHandoffShot(a,b,390/844),null);
 assert.equal(observedGroundedHandoffShot(s,g,0),null);
 assert.equal(observedGroundedHandoffShot(s,g,390/844,1.5),null);
});
test('source-age and new-floor walking distance fade the existing shot rather than extending a fake cinematic',async()=>{
 const {observedGroundedHandoffShot}=await helper;
 const {source:s,stage:g}=await fixtures();
 const first=observedGroundedHandoffShot(s,g,390/844);
 const later=observedGroundedHandoffShot({...s,tick:465,player:{...s.player,x:340296}},
   {...g,ageSeconds:2.15},390/844);
 assert.ok(later===null || later.focusWeight<first.focusWeight);
 assert.equal(observedGroundedHandoffShot({...s,tick:474}, {...g,ageSeconds:2.9},390/844),null);
});

test('authentic early Floor9 jump keeps the real doorway shot without inventing ground',async()=>{
 const {observedAirborneHandoffShot,observedGroundedHandoffShot}=await helper;
 const {source:s,stage:g}=await fixtures();
 const jump={...s,tick:452,player:{...s.player,x:s.player.x+7200,
   y:s.player.y+8000,grounded:false,groundedPlatformId:null,
   state:'airborne',vy:12000}};
 const before=JSON.stringify([jump,g]);
 const phone=observedAirborneHandoffShot(jump,g,390/844);
 const desktop=observedAirborneHandoffShot(jump,g,960/600);
 assert.ok(phone?.airborneHandoff && desktop?.airborneHandoff);
 assert.ok(phone.radius>desktop.radius);
 assert.ok(phone.focusWeight>0 && phone.focusWeight<=.24);
 assert.equal(observedGroundedHandoffShot(jump,g,390/844),null);
 assert.equal(JSON.stringify([jump,g]),before);
 for(const [source,stage] of [
  [{...jump,stale:true},g],[{...jump,runToken:'other'},g],
  [{...jump,floor:10},g],[{...jump,tick:477},g],
  [{...jump,player:{...jump.player,x:jump.player.x+160000}},g],
  [{...jump,player:{...jump.player,y:jump.player.y+95000}},g],
  [{...jump,player:{...jump.player,state:'standing'}},g],
  [{...jump,player:{...jump.player,health:0}},g],
  [{...jump,player:{...jump.player,vy:NaN}},g],
  [jump,{...g,innerDoorAssemblyVisible:false}],
  [jump,{...g,continuousGroundedHandoff:false}],
  [jump,{...g,runToken:'other'}],
  [jump,{...g,stage:'earned-open'}],[jump,{...g,ageSeconds:3}]
 ])assert.equal(observedAirborneHandoffShot(source,stage,390/844),null);
});
test('production camera and source-authenticated gateway rescue both continue across a legitimate new-floor handoff',()=>{
 const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 assert.match(scene,/observedGroundedHandoffShot\(snapshot, passage\.diagnostics\(\),/);
 assert.match(scene,/observedAirborneHandoffShot\(snapshot, passage\.diagnostics\(\),/);
 assert.match(scene,/airborneHandoffEscort > \.04/);
 assert.match(scene,/sourceEarnedWalk \|\| sourceAirborneWalk \|\| sourceLastStand \|\|/);
 assert.match(scene,/const groundedHandoffEscort =/);
 assert.match(scene,/sourceGroundedHandoffShot\.sourceTick === snapshot\.tick/);
 assert.match(scene,/groundedHandoffEscort > \.04 && !options\.reducedMotion/);
 assert.match(scene,/\(sourceAirborneWalk\?\.approach \?\? 0\) > \.16 \|\|\s*groundedHandoffEscort > \.04 \|\| airborneHandoffEscort > \.04/);
 assert.match(scene,/earnedStage\.stage === 'handoff' &&/);
 assert.match(scene,/!!sourceGroundedHandoffShot \|\| !!sourceAirborneHandoffShot/);
 assert.match(scene,/safeEarnedGatewayDollyRadius\(destination,/);
 assert.match(scene,/towerCoreSightlineClear\(camera\.position,/);
});
