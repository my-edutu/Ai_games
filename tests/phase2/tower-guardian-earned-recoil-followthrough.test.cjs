'use strict';
// Actual source-authoritative guardian counter safety, NOT a quality vote.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const idle={move:0,jump:false,dash:false,attack:false,ability:false};
const rng=()=>NamedRng.fromSeed('guardian-physical-recoil');
function duel(flags={guardianSecondWind:true,guardianArenaHazards:true}){
 const state=structuredClone(TowerRuntime.create({launchFloor:10,maxTicks:5000,
   noProgressTicks:2000,...flags},'source-recoil-counter').state);
 const cap=state.chunks.find(c=>c.floor===state.floor).platforms.at(-1);
 const boss=state.enemies.find(e=>e.kind==='guardian'&&e.active);
 assert.ok(cap&&boss);
 for(const chunk of state.chunks)chunk.hazards=[];
 state.enemies=[boss];state.projectiles=[];state.pickups=[];
 const p=state.player;
 p.position={x:cap.x+Math.floor(cap.width*.40),y:cap.y+cap.height+p.halfHeight};
 p.grounded=true;p.groundedPlatformId=cap.id;p.velocity={x:0,y:0};
 p.facing=1;p.attackCooldown=0;p.health=p.maxHealth;
 boss.position={x:p.position.x+27000,y:p.position.y};
 boss.patrolMinX=p.position.x-80000;boss.patrolMaxX=p.position.x+110000;
 boss.health=4;boss.maxHealth=8;boss.guardUntilTick=state.tick+18;
 boss.telegraphUntilTick=state.tick+5;boss.cooldown=20;
 return state;
}
test('legal melee counter breaks source armor, recoils the live body and replays identically',()=>{
 const state=duel(),frozen=structuredClone(state);
 const decision=chooseTowerAction(state,createTowerObservation(state));
 assert.equal(decision.action.attack,true);
 const a=stepTowerCombat(state,decision.action,rng()),b=stepTowerCombat(state,decision.action,rng());
 assert.deepEqual(a,b);assert.deepEqual(state,frozen,'no input mutation');
 const boss=a.state.enemies[0];
 assert.equal(boss.health,3,'only the legal range-checked melee did damage');
 assert.equal(boss.guardUntilTick,state.tick);
 assert.equal(boss.staggerUntilTick,state.tick+14);
 assert.equal(boss.telegraphUntilTick,0);
 assert.ok(boss.position.x>state.enemies[0].position.x,'real collider moved');
 assert.ok(boss.velocity.x>0&&boss.velocity.x<7200,'fixed-step deceleration');
 assert.ok(a.events.some(e=>e.type==='guardian-windup-interrupted'&&
   e.data.counter==='melee'&&e.data.guardBroken&&e.data.physicalRecoil));
 assert.equal(createTowerRenderSnapshot(a.state,{includeWindupTicks:true})
   .enemies[0].staggerTicksRemaining,14);
 assert.equal(createTowerObservation(a.state).enemies[0].staggerTicksRemaining,14);
});
test('real recoil stays bounded, and the autonomous pilot follows through only on a ready strike',()=>{
 let r=stepTowerCombat(duel(),{...idle,attack:true},rng());
 let x=r.state.enemies[0].position.x;
 for(let i=0;i<7;i++){
  const source=structuredClone(r.state);source.tick++;
  r=stepTowerCombat(source,idle,rng());
  assert.ok(r.state.enemies[0].position.x>=x,'no reversed imaginary recoil');
  x=r.state.enemies[0].position.x;
  assert.ok(x<=r.state.enemies[0].patrolMaxX,'existing physical support');
 }
 const next=structuredClone(r.state),p=next.player,boss=next.enemies[0];
 next.tick++;p.attackCooldown=0;p.position.x=boss.position.x-35000;
 p.position.y=boss.position.y;p.facing=1;p.grounded=true;
 p.velocity={x:0,y:0};
 const obs=createTowerObservation(next);
 assert.ok(obs.enemies[0].staggerTicksRemaining>0);
 const choice=chooseTowerAction(next,obs);
 assert.equal(choice.action.attack,true);
 assert.match(choice.intent.summary,/recoil/i);
});
test('missed, blocked and unflagged guardian hits do not invent recoil',()=>{
 const old=duel({guardianSecondWind:true});
 const legacy=stepTowerCombat(old,{...idle,attack:true},rng()).state.enemies[0];
 assert.equal(legacy.velocity.x,0);assert.equal(legacy.staggerUntilTick,undefined);
 const blocked=duel();blocked.enemies[0].telegraphUntilTick=0;
 const shield=stepTowerCombat(blocked,{...idle,attack:true},rng()).state.enemies[0];
 assert.equal(shield.health,4);assert.equal(shield.velocity.x,0);
 assert.equal(shield.guardUntilTick,blocked.enemies[0].guardUntilTick);
 const missed=duel();missed.player.facing=-1;
 const out=stepTowerCombat(missed,{...idle,attack:true},rng()).state.enemies[0];
 assert.equal(out.health,4);assert.equal(out.velocity.x,0);
});

test('source-earned cap counter opens a real contact-safe punish window, then restores pressure',()=>{
  const state=duel(),boss=state.enemies[0];
  state.player.invulnerableTicks=0;
  assert.ok(Math.abs(state.player.position.x-boss.position.x)<
    state.player.halfWidth+boss.halfWidth,'initial real bodies genuinely overlap');
  const counter=stepTowerCombat(state,{...idle,attack:true},rng());
  assert.equal(counter.state.enemies[0].health,3);
  assert.equal(counter.state.player.health,state.player.health,
    'the interrupted, recoiling guardian cannot still inflict its contact attack on the earned counter tick');
  assert.equal(counter.events.some(e=>e.type==='player-damage'),false);
  const follow=structuredClone(counter.state),target=follow.enemies[0];
  follow.tick++;follow.player.attackCooldown=0;follow.player.invulnerableTicks=0;
  follow.player.facing=1;follow.player.position.x=target.position.x-20000;
  follow.player.position.y=target.position.y;target.velocity.x=0;
  const punished=stepTowerCombat(follow,{...idle,attack:true},rng());
  assert.equal(punished.state.enemies[0].health,2,
    'only a second ordinary range-checked, cooldown-ready melee strike damages');
  assert.ok(punished.events.some(e=>e.type==='melee-hit'));
  assert.equal(punished.state.enemies[0].guardUntilTick<=punished.state.tick,true,
    'an earned exposed core cannot instantly re-arm armor before its source stagger resolves');
  assert.equal(punished.state.player.health,follow.player.health,
    'a recoiling guardian cannot make an unavoidable body-contact counterattack');
  const recovered=structuredClone(punished.state);
  recovered.tick=state.tick+14;recovered.player.attackCooldown=0;
  recovered.player.invulnerableTicks=0;recovered.player.facing=1;
  recovered.player.position.x=recovered.enemies[0].position.x-20000;
  recovered.player.position.y=recovered.enemies[0].position.y;
  recovered.enemies[0].cooldown=20;recovered.enemies[0].telegraphUntilTick=0;
  const resumed=stepTowerCombat(recovered,{...idle,attack:true},rng());
  assert.equal(resumed.state.enemies[0].health,1);
  assert.ok(resumed.state.enemies[0].guardUntilTick>resumed.state.tick,
    'second-wind armor returns when the physically earned stagger is over');
  assert.ok(resumed.events.some(e=>e.type==='player-damage'),
    'the dangerous guardian contact attack resumes, so the mechanic is not invulnerability');
  assert.deepEqual(stepTowerCombat(recovered,{...idle,attack:true},rng()),resumed,
    'exposure, recovery and contact events reproduce exactly from the same source');
});
test('only the fully opted-in living guardian may lose contact pressure while staggered',()=>{
  const old=duel({guardianSecondWind:true}),p=old.player,guardian=old.enemies[0];
  p.invulnerableTicks=0;guardian.staggerUntilTick=old.tick+14;guardian.telegraphUntilTick=0;
  guardian.guardUntilTick=old.tick;
  const historical=stepTowerCombat(old,idle,rng());
  assert.ok(historical.events.some(e=>e.type==='player-damage'),
    'an unflagged guardian retains historical contact lethality');
  const cap=duel();
  cap.player.invulnerableTicks=0;cap.enemies[0].staggerUntilTick=cap.tick;
  cap.enemies[0].telegraphUntilTick=0;cap.enemies[0].guardUntilTick=cap.tick;
  const expired=stepTowerCombat(cap,idle,rng());
  assert.ok(expired.events.some(e=>e.type==='player-damage'),
    'expired source stun cannot suppress the ordinary body attack');
});
