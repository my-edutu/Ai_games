'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function airborneDuel(){
  const runtime=TowerRuntime.create({maxTicks:4000,noProgressTicks:2000},
    'authentic-airborne-duel-v1',{policy:'autonomous'});
  const state=structuredClone(runtime.state),player=state.player;
  const target=state.chunks[0].platforms.find(platform=>platform.kind==='moving')
    || state.chunks[0].platforms[2];
  assert.ok(target,'a real generated landing platform is required');
  state.ai.targetPlatformId=target.id;
  state.ai.recentHeights=[];
  player.position={x:target.x+target.width/2-12000,
    y:target.y+target.height+player.halfHeight+44000};
  player.velocity={x:2500,y:-4500};
  player.grounded=false;player.groundedPlatformId=undefined;
  player.attackCooldown=0;player.abilityCooldown=0;
  state.enemies=[];state.projectiles=[];state.chunks[0].hazards=[];
  const withoutEnemy=chooseTowerAction(state,createTowerObservation(state));
  assert.ok(['air-control','settling-landing'].includes(withoutEnemy.intent.mode),
    'real flight may be advancing or physically counterbraking');
  assert.equal(withoutEnemy.action.dash,false);
  assert.equal(withoutEnemy.action.jump,false);
  const direction=withoutEnemy.action.move||1;
  player.facing=direction;
  state.build.upgradeIds.push('pulse-shot');
  return {runtime,state,target,direction};
}
function addObservedEnemy(state,kind,distance,dy=0){
  const player=state.player;
  // A real-shaped same-floor body: source combat and immutable observation
  // retain full authority over damage and projectile travel.
  const enemy={id:'observed-air-target',kind,floor:state.floor,
    position:{x:player.position.x+player.facing*distance,y:player.position.y+dy},
    velocity:{x:0,y:0},halfWidth:9000,halfHeight:14000,
    health:3,maxHealth:3,facing:-player.facing,
    patrolMinX:0,patrolMaxX:state.config.worldWidth,
    cooldown:30,telegraphUntilTick:0,active:true,damage:1};
  state.enemies=[enemy];
  return enemy;
}

test('an observed close airborne opponent cannot steal landing steering; real melee and pulse may coexist',()=>{
  const {runtime,state}=airborneDuel();
  const route=chooseTowerAction(state,createTowerObservation(state));
  addObservedEnemy(state,'shooter',20000);
  const original=JSON.stringify(state);
  const result=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(result.intent.mode,route.intent.mode,
    'combat may not steal even the authentic landing/settling animation mode');
  for(const key of ['move','jump','dash'])
    assert.equal(result.action[key],route.action[key],key+' remains owned by the source landing controller');
  assert.equal(result.action.attack,true,'only a genuinely reachable opponent can be struck');
  assert.equal(result.action.ability,true,'earned pulse uses the real collision lane');
  assert.equal(JSON.stringify(state),original,'AI must never edit the source');
  runtime.state=state;
  const before=state.stats.projectilesFired;
  runtime.step();
  assert.equal(runtime.state.stats.projectilesFired,before+1,
    'the actual authoritative combat step emits the airborne projectile');
});

test('airborne projectile attack can accompany a real landing decision without fabricating melee range',()=>{
  const {state}=airborneDuel();
  const route=chooseTowerAction(state,createTowerObservation(state));
  addObservedEnemy(state,'shooter',95000);
  const result=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(result.intent.mode,route.intent.mode,
    'combat may not steal even the authentic landing/settling animation mode');
  assert.equal(result.action.move,route.action.move);
  assert.equal(result.action.attack,false);
  assert.equal(result.action.ability,true);
});

test('wrong-height, unearned and cooldown-blocked airborne shots preserve landing authority',()=>{
  const {state}=airborneDuel();
  const route=chooseTowerAction(state,createTowerObservation(state));
  const enemy=addObservedEnemy(state,'shooter',65000,70000);
  let result=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(result.action.ability,false,'never waste a shot off its source projectile height');
  enemy.position.y=state.player.position.y;
  state.player.abilityCooldown=8;
  result=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(result.action.ability,false);
  state.player.abilityCooldown=0;
  state.build.upgradeIds=[];
  result=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(result.action.ability,false);
  assert.equal(result.action.move,route.action.move);
});

test('historical tactical:false air combat remains untouched for frozen replay recordings',()=>{
  const {state}=airborneDuel();
  addObservedEnemy(state,'sentinel',20000);
  const legacy=chooseTowerAction(state,createTowerObservation(state),{tactical:false});
  assert.equal(legacy.intent.mode,'engaging-enemy',
    'old source policy keeps its existing near-enemy combat priority');
});
