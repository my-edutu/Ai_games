'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function encounter(){
 const runtime=TowerRuntime.create({maxTicks:1800,noProgressTicks:800},'counterplay-source');
 const s=structuredClone(runtime.state), p=s.player;
 const support=s.chunks[0].platforms.find(q=>q.width>60000)||s.chunks[0].platforms[0];
 p.position={x:support.x+support.width/2,y:support.y+support.height+p.halfHeight};
 p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=support.id;p.facing=1;
 s.enemies=[{id:'visible-shooter',kind:'shooter',floor:s.floor,position:{x:p.position.x+80000,y:p.position.y},
 velocity:{x:0,y:0},halfWidth:9000,halfHeight:14000,health:3,maxHealth:3,facing:-1,
 patrolMinX:0,patrolMaxX:s.config.worldWidth,cooldown:0,telegraphUntilTick:s.tick+2,active:true,damage:1}];
 return s;
}
test('real imminent aimed telegraph triggers a support-safe jump rather than blindly ascending',()=>{
 const s=encounter(), d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'evading-telegraph');assert.equal(d.action.jump,true);assert.equal(d.action.move,0);
});
test('future, backward and ungrounded attacks cannot fabricate a dodge',()=>{
 for(const edit of [s=>s.enemies[0].telegraphUntilTick=s.tick+8,s=>s.enemies[0].facing=1,
 s=>s.player.grounded=false,s=>s.player.position.x=s.chunks[0].platforms.find(p=>p.id===s.player.groundedPlatformId).x+1000]){
  const s=encounter();edit(s);
  assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'evading-telegraph');
 }
});
test('real pulse-shot upgrade fires only when ready, aligned and inside sightline',()=>{
 const s=encounter(), e=s.enemies[0];e.position.x=s.player.position.x+25000;e.telegraphUntilTick=0;
 s.build.upgradeIds.push('pulse-shot');s.player.abilityCooldown=0;
 let d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.action.attack,true);assert.equal(d.action.ability,true);
 s.player.abilityCooldown=10;d=chooseTowerAction(s,createTowerObservation(s));assert.equal(d.action.ability,false);
 s.player.abilityCooldown=0;s.player.facing=-1;d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.action.ability,false);
});


test('wounded climber visibly chooses a real reachable health pickup before the next leap',()=>{
 const s=encounter(),support=s.chunks[0].platforms.find(p=>p.id===s.player.groundedPlatformId);
 s.enemies=[];s.projectiles=[];s.chunks[0].hazards=[];
 s.player.health=Math.max(1,s.player.maxHealth-2);
 s.player.position.x=support.x+16000;
 const pickup={id:'f0:health-detour',kind:'health',floor:s.floor,
   position:{x:support.x+support.width-16000,y:support.y+support.height+8000},
   value:1,collected:false};
 s.pickups=[pickup];
 let d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'collecting-resource');
 assert.equal(d.action.move,1);
 assert.equal(d.action.jump,false);
 assert.equal(d.intent.targetPlatformId,support.id);
 assert.equal(d.intent.fallbackUsed,false);
 // Frozen legacy policy never silently gains a new decision branch.
 d=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
 assert.notEqual(d.intent.mode,'collecting-resource');
 // The health strategy must not steer a healed climber off its route.
 s.player.health=s.player.maxHealth;
 d=chooseTowerAction(s,createTowerObservation(s));
 assert.notEqual(d.intent.mode,'collecting-resource');
});

test('resource intent is blocked if the real item is beyond support or off-level',()=>{
 const s=encounter(),support=s.chunks[0].platforms.find(p=>p.id===s.player.groundedPlatformId);
 s.enemies=[];s.projectiles=[];s.chunks[0].hazards=[];
 s.player.health=Math.max(1,s.player.maxHealth-2);
 s.player.position.x=support.x+16000;
 s.pickups=[{id:'f0:unsafe-health',kind:'health',floor:s.floor,
   position:{x:support.x+support.width+40000,y:support.y+support.height+8000},
   value:1,collected:false}];
 assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'collecting-resource');
 s.pickups[0].position.x=support.x+support.width-16000;
 s.pickups[0].position.y+=80000;
 assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'collecting-resource');
});

// These counterplay tests exercise actual observed support, threats and the
// shipped decision policy; the frozen historical mode stays unmodified.
test('live defensive AI leaps inward rather than fleeing off the ledge from an incoming shot',()=>{
 const s=encounter(),support=s.chunks[0].platforms.find(q=>q.id===s.player.groundedPlatformId);
 s.enemies=[];s.chunks[0].hazards=[];
 s.player.position.x=support.x+support.width-s.player.halfWidth-5000;
 s.player.velocity.x=0;
 s.projectiles=[{id:'real-inbound',owner:'enemy',floor:s.floor,position:{x:s.player.position.x-24000,y:s.player.position.y},
  velocity:{x:12000,y:0},halfWidth:5000,halfHeight:3500,damage:1,ttl:9,active:true,hitIds:[]}];
 const obs=createTowerObservation(s),live=chooseTowerAction(s,obs),legacy=chooseTowerAction(s,obs,{tactical:false});
 assert.equal(live.intent.mode,'evading-projectile');
 assert.equal(live.action.jump,true);
 assert.equal(live.action.move,-1);
 assert.equal(legacy.action.move,1,'historical-v1 remains frozen');
});
test('active close hazard does not force a tactical step into open air',()=>{
 const s=encounter(),support=s.chunks[0].platforms.find(q=>q.id===s.player.groundedPlatformId);
 s.enemies=[];s.projectiles=[];
 s.player.position.x=support.x+support.width-s.player.halfWidth-5000;s.player.velocity.x=0;
 s.chunks[0].hazards=[{id:'edge-danger',kind:'spikes',x:s.player.position.x-20000,y:s.player.position.y-15000,
 width:19000,height:10000,activeFromTick:0,activeEvery:10,activeFor:10,damage:1}];
 const obs=createTowerObservation(s);
 const live=chooseTowerAction(s,obs),legacy=chooseTowerAction(s,obs,{tactical:false});
 assert.equal(live.intent.mode,'evading-hazard');assert.equal(live.action.jump,true);
 assert.equal(live.action.move,-1);assert.equal(legacy.action.move,1);
});
test('open supported lane retains the useful outward shot-avoidance response',()=>{
 const s=encounter();s.enemies=[];s.chunks[0].hazards=[];
 s.projectiles=[{id:'open-shot',owner:'enemy',floor:s.floor,position:{x:s.player.position.x-24000,y:s.player.position.y},
 velocity:{x:12000,y:0},halfWidth:5000,halfHeight:3500,damage:1,ttl:9,active:true,hitIds:[]}];
 const live=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(live.intent.mode,'evading-projectile');assert.equal(live.action.move,1);
});

test('the autonomous climber visibly braces for a genuine early shooter charge then leaps at release',()=>{
 const s=encounter();
 s.enemies[0].telegraphUntilTick=s.tick+7;
 let decision=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(decision.intent.mode,'bracing-telegraph');
 assert.equal(decision.action.jump,false);
 assert.equal(decision.action.attack,false);
 assert.equal(decision.action.move,0,'hold safe footing when the incoming shot is still distant');
 assert.notEqual(chooseTowerAction(s,createTowerObservation(s),{tactical:false}).intent.mode,'bracing-telegraph',
  'frozen historical policy must preserve earlier replay decisions');
 s.enemies[0].telegraphUntilTick=s.tick+2;
 decision=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(decision.intent.mode,'evading-telegraph');
 assert.equal(decision.action.jump,true);
 s.enemies[0].telegraphUntilTick=0;
 decision=chooseTowerAction(s,createTowerObservation(s));
 assert.notEqual(decision.intent.mode,'bracing-telegraph');
 assert.notEqual(decision.intent.mode,'evading-telegraph');
});

test('early warning does not grant clairvoyant fire direction or unsafe unsupported footing',()=>{
 for(const invalid of [s=>s.enemies[0].facing=1,s=>s.player.grounded=false,
  s=>s.player.position.x=s.chunks[0].platforms.find(p=>p.id===s.player.groundedPlatformId).x+1000,
  s=>s.enemies[0].position.y+=180000]){
  const s=encounter();s.enemies[0].telegraphUntilTick=s.tick+6;invalid(s);
  assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'bracing-telegraph');
 }
});

test('the public immutable snapshot exposes only an observed finite enemy windup countdown',()=>{
 const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
 const s=encounter();s.enemies[0].telegraphUntilTick=s.tick+7;
 const legacy=createTowerRenderSnapshot(s);
 assert.equal(Object.hasOwn(legacy.enemies[0],'telegraphTicksRemaining'),false,'legacy checksum contract unchanged');
 const open=createTowerRenderSnapshot(s,{includeWindupTicks:true});
 assert.equal(open.enemies[0].telegraph,true);
 assert.equal(open.enemies[0].telegraphTicksRemaining,7);
 assert.ok(Object.isFrozen(open.enemies[0]));
 s.enemies[0].telegraphUntilTick=s.tick+2;
 assert.equal(createTowerRenderSnapshot(s,{includeWindupTicks:true}).enemies[0].telegraphTicksRemaining,2);
 s.enemies[0].telegraphUntilTick=0;
 assert.equal(createTowerRenderSnapshot(s,{includeWindupTicks:true}).enemies[0].telegraphTicksRemaining,0);
});
