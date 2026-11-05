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
