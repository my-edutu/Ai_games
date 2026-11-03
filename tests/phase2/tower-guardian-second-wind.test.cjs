'use strict';
// Authored game second-wind engineering safety; never Gauntlet quality votes.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const idle={move:0,jump:false,dash:false,attack:false,ability:false};
function encounter(optIn,health=8){
  const runtime=TowerRuntime.create({launchFloor:10,maxTicks:5000,noProgressTicks:2000,...(optIn?{guardianSecondWind:true}:{})},'second-wind-v1');
  const s=structuredClone(runtime.state),boss=s.enemies.find(e=>e.kind==='guardian');assert.ok(boss);
  s.enemies=[boss];s.projectiles=[];s.pickups=[];
  s.player.position={x:boss.position.x+62000,y:boss.position.y};
  s.player.velocity={x:0,y:0};s.player.invulnerableTicks=0;
  boss.health=health;boss.maxHealth=8;boss.cooldown=0;boss.telegraphUntilTick=0;boss.staggerUntilTick=0;
  return s;
}
test('actual source guardian charges faster only below half HP, then recovers longer',()=>{
  const full=encounter(true,8),wounded=encounter(true,4),legacy=encounter(false,4);
  const before=JSON.stringify(wounded),rng=()=>NamedRng.fromSeed('second-wind');
  const a=stepTowerCombat(full,idle,rng()).state,b=stepTowerCombat(wounded,idle,rng()).state;
  const old=stepTowerCombat(legacy,idle,rng()).state;
  assert.equal(a.enemies[0].telegraphUntilTick-full.tick,8);
  assert.equal(b.enemies[0].telegraphUntilTick-wounded.tick,6);
  assert.equal(old.enemies[0].telegraphUntilTick-legacy.tick,8);
  assert.equal(JSON.stringify(wounded),before);
  const fire=structuredClone(b);fire.tick=fire.enemies[0].telegraphUntilTick;
  const result=stepTowerCombat(fire,idle,rng());
  assert.ok(result.events.some(e=>e.type==='projectile-fired'&&e.data.owner==='enemy'));
  assert.equal(result.state.enemies[0].cooldown,40);
  const oldFire=structuredClone(old);oldFire.tick=oldFire.enemies[0].telegraphUntilTick;
  assert.equal(stepTowerCombat(oldFire,idle,rng()).state.enemies[0].cooldown,28);
});
test('source-projected second-wind duration is opt-in; replay and old public schema stay stable',()=>{
  const fast=encounter(true,4),full=encounter(true,8),historic=encounter(false,4);
  const duration=s=>createTowerRenderSnapshot(s,{includeWindupTicks:true})
    .enemies.find(e=>e.kind==='guardian').telegraphTotalTicks;
  assert.equal(duration(fast),6);assert.equal(duration(full),8);assert.equal(duration(historic),undefined);
  assert.equal(createTowerRenderSnapshot(fast).enemies.find(e=>e.kind==='guardian').telegraphTotalTicks,undefined);
  const run=()=>stepTowerCombat(structuredClone(fast),idle,NamedRng.fromSeed('replay'));
  assert.deepEqual(run(),run());
  assert.equal(historic.config.guardianSecondWind,undefined);
});