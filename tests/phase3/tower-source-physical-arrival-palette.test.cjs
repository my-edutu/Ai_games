const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=()=>import(pathToFileURL(path.resolve('public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs')).href);
const good=()=>{
 const cap={id:'f8:cap',x:200000,y:6000,width:140000,height:500};
 const exitX=cap.x+Math.floor(cap.width*.76);
 return {floor:9,theme:'void',runToken:'earned-run',tick:452,lifecycle:'running',
  player:{x:324296,y:10000,halfWidth:2000,halfHeight:3500,
    health:90,grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0},
  platforms:[{id:'f9:ground',x:300000,y:6000,width:140000,height:500}],
  lastGuardianCrossing:{runToken:'earned-run',sourceTick:451,
    fromFloor:8,toFloor:9,cap,exitX,crossingX:324296,
    halfWidth:2000,halfHeight:3500,
    guardian:{kind:'guardian',active:false,health:0}}};
};
test('the actual F8 original sill enters the F9 world in the same warm material family, then physically reveals void',async()=>{
 const {observedSourcePhysicalArrivalPalette:sample}=await load();
 const s=good(),near=sample(s);
 assert.equal(near.kind,'recorded-source-zero-hp');
 assert.equal(near.oldWeight,1);
 s.tick=480;s.player.x+=45000;s.player.grounded=false;
 s.player.groundedPlatformId=null;s.player.state='airborne';s.player.vy=500;
 assert.ok(sample(s).oldWeight>0 && sample(s).oldWeight<1);
 s.player.x=414296;s.tick=501;
 assert.equal(sample(s).oldWeight,0);
});
test('wrong run, undefeated guardian, wrong roof, fake contact and stale crossing never tint F9',async()=>{
 const {observedSourcePhysicalArrivalPalette:sample}=await load();
 for(const mutate of [
   s=>{s.runToken='other-run';},
   s=>{s.lastGuardianCrossing.guardian.active=true;},
   s=>{s.lastGuardianCrossing.guardian.health=1;},
   s=>{s.lastGuardianCrossing.cap.height=999;},
   s=>{s.lastGuardianCrossing.exitX=1;},
   s=>{s.player.health=0;},
   s=>{s.player.x=300000;},
   s=>{s.player.groundedPlatformId='invented-platform';},
   s=>{s.tick=530;},
   s=>{s.floor=8;},
   s=>{s.theme='clockwork';},
 ]){const s=good();mutate(s);assert.equal(sample(s),null,JSON.stringify(s));}
});
test('live original GPU witness may bridge a delayed immutable record, never arbitrary absent wins',async()=>{
 const {observedSourcePhysicalArrivalPalette:sample}=await load();
 const s=good();s.lastGuardianCrossing=null;
 assert.equal(sample(s),null);
 assert.equal(sample({...s,runToken:'wrong'},{}),null);
});
