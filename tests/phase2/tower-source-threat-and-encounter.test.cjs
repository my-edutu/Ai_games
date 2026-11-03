'use strict';
// The live autonomous combat lens and actual 3D actor camera must represent
// source-reachable threats. Engineering contracts are NOT a quality PASS.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function runningDuel(){
  const runtime=TowerRuntime.create({maxTicks:2500,noProgressTicks:1200},
    'source-threat-action-truth',{policy:'autonomous'});
  const s=structuredClone(runtime.state),p=s.player;
  const deck=s.chunks[0].platforms.find(d=>d.width>60000)||s.chunks[0].platforms[0];
  p.position={x:deck.x+deck.width/2,y:deck.y+deck.height+p.halfHeight};
  p.grounded=true;p.groundedPlatformId=deck.id;
  p.velocity={x:0,y:0};p.facing=1;p.health=p.maxHealth;
  s.projectiles=[];s.enemies=[];s.chunks[0].hazards=[];s.pickups=[];
  s.ai.recentHeights=[];
  return {runtime,s,p,deck};
}
function incoming(s,p,height=0){
  s.projectiles=[{id:'observed-shot',owner:'enemy',floor:s.floor,
    position:{x:p.position.x-24000,y:p.position.y+height},
    velocity:{x:12000,y:0},halfWidth:5000,halfHeight:3500,
    damage:1,ttl:9,active:true,hitIds:[]}];
}

test('live fighter refuses a harmless cross-height shot while frozen historical reflex is unchanged',()=>{
  const {s,p}=runningDuel();
  incoming(s,p,s.player.halfHeight+3500+2000);
  const before=JSON.stringify(s);
  const live=chooseTowerAction(s,createTowerObservation(s));
  const historical=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
  assert.notEqual(live.intent.mode,'evading-projectile');
  assert.equal(live.action.jump!==true||live.intent.mode!=='evading-projectile',true);
  assert.equal(historical.intent.mode,'evading-projectile');
  assert.equal(JSON.stringify(s),before,'no authority or replay mutation');
});

test('an actual incoming centreline bolt still causes a safe physical dodge',()=>{
  const {s,p}=runningDuel();
  incoming(s,p);
  const live=chooseTowerAction(s,createTowerObservation(s));
  assert.equal(live.intent.mode,'evading-projectile');
  assert.equal(live.action.jump,true);
  assert.equal(live.action.move,1);
  s.projectiles[0].velocity.x=-12000;
  assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,
    'evading-projectile','receding bolt is not an approaching hit');
});

test('real shooter windup on a different firing level does not hijack the climb',()=>{
  const {s,p}=runningDuel();
  const shooter={id:'real-source-shooter',kind:'shooter',floor:s.floor,
    position:{x:p.position.x+80000,y:p.position.y+26000},
    velocity:{x:0,y:0},halfWidth:9000,halfHeight:14000,health:3,
    maxHealth:3,facing:-1,patrolMinX:0,patrolMaxX:s.config.worldWidth,
    cooldown:0,telegraphUntilTick:s.tick+7,active:true,damage:1};
  s.enemies=[shooter];
  assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'bracing-telegraph');
  shooter.position.y=p.position.y;
  assert.equal(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'bracing-telegraph');
  shooter.telegraphUntilTick=s.tick+2;
  assert.equal(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'evading-telegraph');
});

test('a physically unreachable narrow melee target cannot endlessly steal route authority',()=>{
  const {s,p}=runningDuel();
  s.enemies=[{id:'upper-ledge-sentinel',kind:'sentinel',floor:s.floor,
    position:{x:p.position.x+25000,y:p.position.y+33500},
    velocity:{x:0,y:0},halfWidth:7000,halfHeight:6000,health:2,
    maxHealth:2,facing:-1,patrolMinX:0,patrolMaxX:s.config.worldWidth,
    cooldown:0,telegraphUntilTick:0,active:true,damage:1}];
  const observation=createTowerObservation(s);
  const live=chooseTowerAction(s,observation);
  const legacy=chooseTowerAction(s,observation,{tactical:false});
  assert.notEqual(live.intent.mode,'engaging-enemy');
  assert.equal(live.action.attack,false);
  assert.equal(legacy.intent.mode,'engaging-enemy',
    'frozen historical auto-pursuit remains checksum-compatible');
  s.enemies[0].position.y=p.position.y;
  assert.equal(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'engaging-enemy');
});
