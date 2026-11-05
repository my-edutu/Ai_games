'use strict';
// Source-authored autonomous combat envelope for the real guardian-cap arena.
// These are safety checks, not full-motion evidence or experience scores.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

function capDuel(){
  const run=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
    'tower-transformation-capture-v1',{policy:'autonomous'});
  const source=structuredClone(run.state);
  const cap=source.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const guardian=source.enemies.find(e=>e.kind==='guardian');
  const shutter=source.chunks[0].hazards.find(h=>h.id==='f8:guardian-shutter');
  assert.ok(cap&&guardian&&shutter,'real published cap, living guardian and shutter');
  source.tick=shutter.activeFromTick+shutter.activeFor+25;
  source.enemies=[guardian];source.projectiles=[];source.pickups=[];
  const player=source.player;
  player.position={x:cap.x+Math.floor(cap.width*.45),
    y:cap.y+cap.height+player.halfHeight};
  player.velocity={x:0,y:0};player.facing=1;
  player.grounded=true;player.groundedPlatformId=cap.id;
  player.state='standing';player.health=player.maxHealth;
  guardian.position={x:player.position.x+42000,y:player.position.y};
  guardian.facing=-1;guardian.cooldown=25;
  guardian.telegraphUntilTick=0;
  guardian.guardUntilTick=0;
  return {source,player,guardian,cap};
}

test('the live climber makes space before contact enters the next melee cooldown, then spends a real hit',()=>{
  const {source,player,guardian}=capDuel();
  player.attackCooldown=9;
  const frozen=structuredClone(source);
  const choice=chooseTowerAction(source,createTowerObservation(source,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'engaging-enemy');
  assert.equal(choice.action.move,-1,
    'present 42k guardian distance will close during nine 20Hz cooldown ticks; do not idle into body contact');
  assert.equal(choice.action.attack,false);
  assert.deepEqual(source,frozen,'observed combat does not mutate simulation or RNG');
  player.attackCooldown=0;
  const ready=chooseTowerAction(source,createTowerObservation(source,{includeHazardWindup:true}));
  assert.equal(ready.action.move,0,'maintain a face-on collision-checked strike at actual melee range');
  assert.equal(ready.action.attack,true,'retreat must not replace an earned available hit');
  guardian.position.x=player.position.x+62000;
  player.attackCooldown=9;
  const distant=chooseTowerAction(source,createTowerObservation(source,{includeHazardWindup:true}));
  assert.equal(distant.action.move,1,'do not perpetually retreat from a distant cap guardian');
});

test('the forward-looking duel envelope cannot force a fall from a real cap edge or rewrite the legacy policy',()=>{
  const {source,player,guardian,cap}=capDuel();
  player.position.x=cap.x+player.halfWidth+6100;
  guardian.position.x=player.position.x+42000;
  player.attackCooldown=9;
  const guarded=chooseTowerAction(source,createTowerObservation(source,{includeHazardWindup:true}));
  assert.notEqual(guarded.action.move,-1,'preserve actual supporting edge against preemptive retreat');
  const legacy=structuredClone(source);
  legacy.config={...source.config,guardianArenaHazards:false};
  const historical=chooseTowerAction(legacy,createTowerObservation(legacy,{includeHazardWindup:true}));
  assert.equal(historical.action.move,0,'unflagged guardian duel retains its original idle-at-reach timing');
});
