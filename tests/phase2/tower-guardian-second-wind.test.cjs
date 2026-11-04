'use strict';
// Authored game second-wind engineering safety; never Gauntlet quality votes.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
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
  // The first winding charge was genuinely initiated at eight ticks. Losing
  // HP halfway through cannot accelerate THAT already-committed projectile.
  const charging=stepTowerCombat(encounter(true,8),idle,NamedRng.fromSeed('mid-charge')).state;
  assert.equal(charging.enemies[0].telegraphDurationTicks,8);
  charging.enemies[0].health=4;charging.tick+=1;
  assert.equal(duration(charging),8,'public camera must reflect actual active charge, not new HP');
  assert.equal(JSON.stringify(charging).includes('telegraphDurationTicks'),true);
});
test('a real wounded guardian raises physical armor between melee strikes while its charge and ranged counters stay fair',()=>{
  const rng=()=>NamedRng.fromSeed('guardian-guard-actual-source');
  const state=encounter(true,5),boss=state.enemies[0],p=state.player;
  p.position.x=boss.position.x-30000;p.position.y=boss.position.y;
  p.facing=1;p.attackCooldown=0;p.invulnerableTicks=20;
  boss.facing=-1;boss.patrolMinX=boss.position.x-80000;
  boss.patrolMaxX=boss.position.x+80000;boss.cooldown=20;
  state.build.attackDamage=1;
  const input=JSON.stringify(state);
  const first=stepTowerCombat(state,{...idle,attack:true},rng());
  assert.equal(JSON.stringify(state),input,'input and historical replay authority are immutable');
  const opened=first.state.enemies[0];
  assert.equal(opened.health,4);
  assert.equal(opened.guardUntilTick,state.tick+22);
  assert.ok(first.events.some(e=>e.type==='melee-hit'));
  const shielded=structuredClone(first.state);
  shielded.tick+=1;shielded.player.attackCooldown=0;
  const blocked=stepTowerCombat(shielded,{...idle,attack:true},rng());
  assert.equal(blocked.state.enemies[0].health,4);
  assert.ok(blocked.events.some(e=>e.type==='guardian-shield-block'));
  assert.equal(blocked.events.some(e=>e.type==='melee-hit'),false);
  assert.equal(blocked.state.stats.damageDealt,first.state.stats.damageDealt);
  const projection=createTowerRenderSnapshot(blocked.state,{includeWindupTicks:true});
  assert.ok(projection.enemies[0].guardTicksRemaining>0);
  assert.equal(createTowerRenderSnapshot(blocked.state).enemies[0].guardTicksRemaining,undefined);
  assert.ok(createTowerObservation(blocked.state).enemies[0].guardTicksRemaining>0);
  const winding=structuredClone(blocked.state);
  winding.tick+=1;winding.player.attackCooldown=0;
  winding.enemies[0].telegraphUntilTick=winding.tick+3;
  const punished=stepTowerCombat(winding,{...idle,attack:true},rng());
  assert.equal(punished.state.enemies[0].health,3,
    'a real charge exposes the core despite an unexpired shield timer');
  const legacy=encounter(false,5),old=legacy.enemies[0];
  legacy.player.position.x=old.position.x-30000;legacy.player.position.y=old.position.y;
  legacy.player.facing=1;legacy.player.attackCooldown=0;
  old.cooldown=20;old.patrolMinX=old.position.x-80000;
  old.patrolMaxX=old.position.x+80000;
  const oldCombat=stepTowerCombat(legacy,{...idle,attack:true},rng());
  assert.equal(oldCombat.state.enemies[0].guardUntilTick,undefined);
  assert.equal(createTowerObservation(oldCombat.state).enemies[0].guardTicksRemaining,undefined);
  assert.deepEqual(stepTowerCombat(structuredClone(state),{...idle,attack:true},rng()),first);
});
test('live autonomous duel reads an observed guarded core and saves the melee cooldown',()=>{
  const state=encounter(true,4),boss=state.enemies[0],p=state.player;
  const chunk=state.chunks.find(x=>x.floor===state.floor);
  const cap=chunk.platforms[chunk.platforms.length-1];
  p.position={x:cap.x+cap.width/2,y:cap.y+cap.height+p.halfHeight};
  p.grounded=true;p.groundedPlatformId=cap.id;p.facing=1;p.attackCooldown=0;
  boss.position.x=p.position.x+27000;boss.position.y=p.position.y;
  boss.guardUntilTick=state.tick+18;boss.telegraphUntilTick=0;
  const selected=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(selected.action.attack,false,'the source-observed raised shield is not an invisible hit oracle');
  assert.match(selected.intent.summary,/shield|guardian/i);
  boss.telegraphUntilTick=state.tick+3;
  const opening=chooseTowerAction(state,createTowerObservation(state));
  assert.notEqual(opening.intent.mode,'waiting');
});

test('source shield forces an actual supported-deck spacing decision rather than frozen melee',()=>{
  const state=encounter(true,4),boss=state.enemies[0],p=state.player;
  const floor=state.chunks.find(c=>c.floor===state.floor);
  const cap=floor.platforms.find(x=>x.id===`f${state.floor}:cap`);
  assert.ok(cap,'guardian must belong to the genuine source cap');
  floor.hazards=[];
  p.position={x:cap.x+cap.width/2,y:cap.y+cap.height+p.halfHeight};
  p.grounded=true;p.groundedPlatformId=cap.id;p.facing=1;
  p.velocity={x:0,y:0};p.health=p.maxHealth;p.attackCooldown=0;p.abilityCooldown=0;
  boss.position={x:p.position.x+27000,y:p.position.y};
  boss.guardUntilTick=state.tick+18;boss.telegraphUntilTick=0;
  const before=JSON.stringify(state);
  const guarded=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(JSON.stringify(state),before,'decision cannot mutate authority');
  assert.equal(guarded.intent.mode,'bracing-guardian-shield');
  assert.equal(guarded.action.move,-1,'create physical room from current guardian');
  assert.equal(guarded.action.attack,false,'do not spend a blocked melee cooldown');
  assert.equal(guarded.action.ability,false,'do not invent an unearned pulse');
  assert.equal(guarded.action.jump,false,'the brace does not abandon safe support');
  assert.equal(guarded.action.dash,false,'no free dodge or stamina burn');
  const held=structuredClone(state);
  held.player.position.x=cap.x+held.player.halfWidth+6500;
  held.enemies[0].position.x=held.player.position.x+27000;
  const edge=chooseTowerAction(held,createTowerObservation(held));
  assert.equal(edge.action.move,0,'edge safety cancels a dangerous retreat');
  assert.equal(edge.intent.mode,'bracing-guardian-shield');
});
test('the real shield spacing ends when exposed; earned pulse is never suppressed',()=>{
  const state=encounter(true,4),boss=state.enemies[0],p=state.player;
  const floor=state.chunks.find(c=>c.floor===state.floor);
  const cap=floor.platforms.find(x=>x.id===`f${state.floor}:cap`);
  floor.hazards=[];
  p.position={x:cap.x+cap.width/2,y:cap.y+cap.height+p.halfHeight};
  p.grounded=true;p.groundedPlatformId=cap.id;p.facing=1;p.velocity={x:0,y:0};
  p.health=p.maxHealth;p.attackCooldown=0;p.abilityCooldown=0;
  boss.position={x:p.position.x+27000,y:p.position.y};
  boss.guardUntilTick=state.tick+18;boss.telegraphUntilTick=0;
  const ranged=structuredClone(state);
  ranged.build.upgradeIds.push('pulse-shot');
  const ready=chooseTowerAction(ranged,createTowerObservation(ranged));
  assert.notEqual(ready.intent.mode,'bracing-guardian-shield');
  assert.equal(ready.action.ability,true,'genuine earned shot remains a counterplay option');
  const winding=structuredClone(state);
  winding.enemies[0].telegraphUntilTick=winding.tick+5;
  const opened=chooseTowerAction(winding,createTowerObservation(winding));
  assert.notEqual(opened.intent.mode,'bracing-guardian-shield',
    'an actually observed hostile charge creates a different open-core decision');
  const expired=structuredClone(state);
  expired.enemies[0].guardUntilTick=expired.tick;
  const engaged=chooseTowerAction(expired,createTowerObservation(expired));
  assert.notEqual(engaged.intent.mode,'bracing-guardian-shield');
  const historical=structuredClone(state);
  delete historical.config.guardianSecondWind;
  const old=chooseTowerAction(historical,createTowerObservation(historical));
  assert.notEqual(old.intent.mode,'bracing-guardian-shield','frozen replay policy never opts in');
});

test('shield spacing never freezes a distant encounter or crosses an observed live spike',()=>{
  const state=encounter(true,4),boss=state.enemies[0],p=state.player;
  const floor=state.chunks.find(c=>c.floor===state.floor);
  const cap=floor.platforms.find(x=>x.id===`f${state.floor}:cap`);
  p.position={x:cap.x+cap.width/2,y:cap.y+cap.height+p.halfHeight};
  p.grounded=true;p.groundedPlatformId=cap.id;p.facing=1;
  p.velocity={x:0,y:0};p.health=p.maxHealth;
  boss.position={x:p.position.x+125000,y:p.position.y};
  boss.guardUntilTick=state.tick+18;boss.telegraphUntilTick=0;
  const distant=chooseTowerAction(state,createTowerObservation(state));
  assert.notEqual(distant.intent.mode,'bracing-guardian-shield',
    'a far shield cannot stall a viable ascent or approach');
  boss.position.x=p.position.x+27000;
  floor.hazards.push({
    id:'guard-spacing-danger',kind:'spikes',x:p.position.x-20000,
    y:p.position.y-p.halfHeight-1000,width:20000,height:25000,
    activeFromTick:0,activeEvery:20,activeFor:20,damage:1
  });
  const guarded=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(guarded.intent.mode,'evading-hazard',
    'a real immediate hazard must outrank the guardian shield tableau');
  assert.notEqual(guarded.action.move,-1,
    'never retreat toward a presently active spike to make a cinematic pose');
  assert.equal(guarded.action.attack,false);
});
