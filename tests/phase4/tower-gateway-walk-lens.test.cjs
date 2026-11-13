'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const modulePromise = import(pathToFileURL(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs')).href);
function caseFor(x) {
  const source={runToken:'episode-8',floor:8,tick:111,lifecycle:'running',
    worldWidth:480000,player:{x,y:342000,halfHeight:12000,
      state:'standing',health:4,grounded:true,groundedPlatformId:'f8:cap'}};
  const earned={runToken:'episode-8',floor:8,guardianId:'f8:guardian',
    cap:{id:'f8:cap',x:240000,y:310000,width:240000,height:20000}};
  return {source,earned};
}
test('earned grounded walk tightens the physical doorway lens',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(360000);
  const far=lens(source,earned,390/844);
  assert.ok(far?.radius>30);
  assert.equal(far.exitX,422400);
  source.player.x=403000;
  const close=lens(source,earned,390/844);
  assert.ok(close.radius<far.radius);
  assert.ok(close.focusWeight>far.focusWeight);
  assert.ok(close.radius>=30 && close.radius<=67);
});
test('rejects distant, airborne, displaced or dead climber',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(280000);
  assert.equal(lens(source,earned,390/844),null);
  source.player.x=410000;source.player.y+=13000;
  assert.equal(lens(source,earned,390/844),null);
  source.player.y-=13000;source.player.state='airborne';source.player.grounded=false;
  assert.equal(lens(source,earned,390/844),null);
  source.player.state='standing';source.player.grounded=true;source.player.health=0;
  assert.equal(lens(source,earned,390/844),null);
});
test('does not retain previous-run, stale, result or wrong-floor doorway',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(410000);
  assert.equal(lens({...source,stale:true},earned,390/844),null);
  assert.equal(lens({...source,runToken:'next'},earned,390/844),null);
  assert.equal(lens({...source,lifecycle:'result'},earned,390/844),null);
  assert.equal(lens(source,{...earned,cap:{...earned.cap,id:'f9:cap'}},390/844),null);
});
test('portrait budgets, zoom preference and bad projection do not force lens',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(408000);
  const portrait=lens(source,earned,390/844),desktop=lens(source,earned,960/600);
  assert.ok(portrait.radius>desktop.radius);
  assert.ok(portrait.focusWeight>desktop.focusWeight);
  assert.equal(lens(source,earned,NaN),null);
  assert.equal(lens(source,earned,390/844,0),null);
  assert.equal(lens(source,earned,390/844,1.25),null);
});
test('injured-but-physically-footed hero retains doorway lens; unsupported or wrong-deck hero cannot',async()=>{
  const {observedGroundedGatewayShot:lens}=await modulePromise;
  const {source,earned}=caseFor(405000);
  source.player.state='hurt';
  assert.ok(lens(source,earned,390/844),'recoil should not erase the actual grounded exit');
  source.player.grounded=false;
  assert.equal(lens(source,earned,390/844),null);
  source.player.grounded=true;source.player.groundedPlatformId='f8:p6';
  assert.equal(lens(source,earned,390/844),null);
});

test('earned walk dolly approaches both silhouettes without going through the solid clockwork core',async()=>{
  const {safeEarnedGatewayDollyRadius}=await modulePromise;
  const camera={x:0,y:28,z:70}, actor={x:0,y:4,z:25}, gate={x:1,y:5,z:25};
  const unobstructed=safeEarnedGatewayDollyRadius(camera,44,actor,gate);
  assert.ok(unobstructed<=44.01 && unobstructed>=44);
  // An opposite-side target is behind the opaque core: do not make the
  // gameplay hero larger at the cost of hiding the earned real doorway.
  const occluded=safeEarnedGatewayDollyRadius(
    {x:70,y:28,z:0},44,{x:-25,y:4,z:0},{x:-25,y:5,z:2});
  assert.equal(occluded,70);
});
test('no unsafe or malformed earned-camera radius can enter the 3D lens',async()=>{
  const {safeEarnedGatewayDollyRadius}=await modulePromise;
  const camera={x:0,y:28,z:70},actor={x:0,y:4,z:25},gate={x:1,y:5,z:25};
  assert.equal(safeEarnedGatewayDollyRadius(camera,90,actor,gate),70);
  assert.equal(safeEarnedGatewayDollyRadius(camera,44,actor,gate,-1),null);
  assert.equal(safeEarnedGatewayDollyRadius({...camera,z:NaN},44,actor,gate),null);
  assert.equal(safeEarnedGatewayDollyRadius(camera,44,{...actor,x:NaN},gate),null);
  assert.equal(safeEarnedGatewayDollyRadius(camera,0,actor,gate),null);
});


test('guardian final-health camera stays on the REAL locked cap during the last playable aerial exchange',async()=>{
  const {observedLiveGuardianLastStandShot:lens}=await modulePromise;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const source={runToken:'episode-8',floor:8,tick:430,lifecycle:'running',
    player:{x:285000,y:3238000,halfHeight:14000,state:'airborne',
      health:5,grounded:false}};
  const lock={runToken:'episode-8',floor:8,cap,
    guardian:{kind:'guardian',active:true,health:1,maxHealth:8}};
  const portrait=lens(source,lock,390/844);
  const desktop=lens(source,lock,960/600);
  assert.ok(portrait?.radius>=30 && portrait?.radius<=59);
  assert.ok(desktop?.radius>0 && portrait.radius>desktop.radius,
    'one physical final duel, responsive lens budget');
  assert.ok(portrait.focusWeight>.1,'start framing the REAL still-locked doorway before the short source-earned crossing');
  assert.equal(portrait.exitX,304896);
  const approaching=lens({...source,player:{...source.player,x:301000}},lock,390/844);
  assert.ok(approaching.radius<portrait.radius,'actual closer source position increases readable hero scale');
});
test('final duel camera cannot invent a kill or frame another floor or remote unsupported body',async()=>{
  const {observedLiveGuardianLastStandShot:lens}=await modulePromise;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const source={runToken:'episode-8',floor:8,tick:430,lifecycle:'running',
    player:{x:285000,y:3238000,halfHeight:14000,state:'airborne',
      health:5,grounded:false}};
  const lock={runToken:'episode-8',floor:8,cap,
    guardian:{active:true,health:1,maxHealth:8}};
  const attempt=(s=source,l=lock)=>lens(s,l,390/844);
  assert.ok(attempt());
  assert.equal(attempt(source,{...lock,guardian:{...lock.guardian,health:4}}),null,
    'the 4-HP normal fight cannot trigger a final stand lens');
  assert.equal(attempt(source,{...lock,guardian:{...lock.guardian,health:0,active:false}}),null,
    'defeat uses its separate source-earned doorway lens');
  assert.equal(attempt({...source,runToken:'another-run'}),null);
  assert.equal(attempt({...source,floor:9}),null);
  assert.equal(attempt({...source,stale:true}),null);
  assert.equal(attempt({...source,lifecycle:'result'}),null);
  assert.equal(attempt({...source,player:{...source.player,health:0}}),null);
  assert.equal(attempt({...source,player:{...source.player,y:3400000}}),null,
    'an airborne actor high above the real cap cannot trigger a fake close view');
  assert.equal(attempt({...source,player:{...source.player,grounded:true,groundedPlatformId:'f8:p6'}}),null,
    'only source cap support admits grounded final stand');
  assert.equal(attempt({...source,player:{...source.player,x:45000}}),null,
    'only actual near-door travel may tighten the camera');
  assert.equal(lens(source,lock,NaN),null);
  assert.equal(lens(source,lock,390/844,1.25),null);
});
test('source-lived last stand stages the camera before the REAL gate unlock, with no extra authoritative scene',()=>{
  const fs=require('node:fs');
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/observedLockedGuardianCap\(snapshot\)/);
  assert.match(scene,/observedLiveGuardianLastStandShot\(snapshot, liveLastStand, camera\.aspect, zoom\)/);
  // Evaluate the submitted lens-selection policy: an earned walking camera,
  // then its physically source-qualified AIRBORNE continuation, then the
  // still-locked living guardian last stand. No standalone cosmetic gate.
  const lensSource=scene.match(/\bconst realCapLens\s*=\s*([^;]+);/);
  const stageSource=scene.match(/\bconst realCapStage\s*=\s*([\s\S]*?);/);
  assert.ok(lensSource&&stageSource,'the real scene must select both shot and stage');
  const select=(sourceEarnedWalk,sourceAirborneWalk,sourceLastStand,sourceGroundedHandoffShot=null,sourceAirborneHandoffShot=null,coldArchLens=null)=>{
    const context={sourceEarnedWalk,sourceAirborneWalk,sourceLastStand,sourceGroundedHandoffShot,sourceAirborneHandoffShot,
      coldArchLens,earnedPassageStage:{id:'true-cap'},passage:{diagnostics:()=>({id:'locked-cap'})}};
    return {
      lens:vm.runInNewContext('('+lensSource[1]+')',context,{timeout:50}),
      stage:vm.runInNewContext('('+stageSource[1]+')',context,{timeout:50}),
    };
  };
  assert.equal(select(null,null,null).lens,null,'no authority -> no invented shot');
  assert.equal(select(null,null,'live-guardian').stage.id,'locked-cap',
    'living guardian still uses the real still-locked encounter');
  assert.equal(select(null,'earned-airborne','live-guardian').lens,'earned-airborne');
  assert.equal(select(null,'earned-airborne','live-guardian').stage.id,'true-cap',
    'real cap airborne traversal uses the same genuinely earned door');
  assert.equal(select('earned-grounded','earned-airborne','live-guardian').lens,'earned-grounded',
    'physical grounded crossing remains first priority');
  assert.equal(select('earned-grounded',null,null).stage.id,'true-cap');
  assert.equal(select(null,null,null,'grounded-handoff').lens,'grounded-handoff',
    'real next-floor support must not erase the retained gateway lens');
  assert.equal(select(null,null,null,'grounded-handoff').stage.id,'locked-cap',
    'the source-owned passage, never an invented floor-8 exit, owns the handoff');
  assert.equal(select(null,null,null,null,'airborne-handoff').lens,'airborne-handoff',
    'real source-owned near-gateway Floor9 takeoff must retain the old physical exit');
  assert.equal(select(null,null,null,null,'airborne-handoff').stage.id,'locked-cap',
    'next-floor airborne lens inherits original gateway stage, not a fake new gate');
  const originalArchLens={coldOriginalArch:true,gateway:[1,2,3],focusWeight:.25};
  assert.equal(select(null,null,null,null,null,originalArchLens).lens,originalArchLens,
    'actual retained original arch owns the post-render camera only if prior source shots end');
  assert.deepEqual(Array.from(select(null,null,null,null,null,originalArchLens).stage.focusPosition),
    originalArchLens.gateway,
    'original source-authenticated physical gateway, not the expired cosmetic cue, anchors the gaze');
  assert.equal(select(null,null,null,'grounded-handoff',null,originalArchLens).lens,'grounded-handoff',
    'actual nearby supported handoff outranks the delayed GPU fallback');
  assert.match(scene,/safeEarnedGatewayDollyRadius\(destination,/);
  assert.match(scene,/towerCoreSightlineClear\(camera\.position,/);
});
