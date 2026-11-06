'use strict';
// Original fixed-step pilot and source observations: recovery of the earned
// guardian cap is navigation, never a scripted floor-nine passage or a
// transformation quality vote. Requires npm run build before node --test.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

function episode() {
  const state=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
    'tower-transformation-capture-v1',{policy:'autonomous'}).state;
  const chunk=state.chunks.find(c=>c.floor===8);
  const cap=chunk.platforms.find(p=>p.id==='f8:cap');
  const lower=chunk.platforms.find(p=>p.id==='f8:p6');
  const guardian=state.enemies.find(e=>e.floor===8&&e.kind==='guardian');
  assert.ok(cap&&lower&&guardian,'fixture must use authentic generated guardian platforms/enemy');
  guardian.active=false;
  guardian.health=0;
  state.enemies=[guardian];
  state.projectiles=[];
  state.pickups=[];
  chunk.hazards=[];
  state.ai.targetPlatformId='f8:p2'; // The pre-fight autonomous target has gone stale.
  return {state,cap,lower,guardian};
}
function choose(state){
  const observed=createTowerObservation(state,{includeHazardWindup:true});
  const unchanged=JSON.stringify([state,observed]);
  const decision=chooseTowerAction(state,observed,{tactical:true});
  assert.equal(JSON.stringify([state,observed]),unchanged,'a decision may not mutate game truth');
  return decision;
}

test('a source-defeated guardian redirects airborne pilot to the genuine cap instead of stale route',()=>{
  const {state,cap}=episode();
  state.player.position={x:cap.x+40000,y:cap.y+cap.height+state.player.halfHeight+28000};
  state.player.velocity={x:-3800,y:-4000};
  state.player.grounded=false;
  state.player.groundedPlatformId=undefined;
  state.player.jumpCharges=0;
  const before={...state.player.position};
  const d=choose(state);
  assert.equal(d.intent.targetPlatformId,cap.id);
  assert.match(d.intent.summary,/guardian cap|guardian deck|exit cap/);
  assert.equal(d.action.attack,false);
  assert.equal(d.action.ability,false);
  assert.deepEqual(state.player.position,before);
  const stepped=stepTowerPhysics(state,d.action).state;
  assert.equal(stepped.floor,8,'no invented floor advancement');
  assert.notDeepEqual(stepped.player.position,before,'real fixed-step velocity moves the body');
});

test('after a real victory, a nearby lower deck yields an ordinary source-legal cap launch',()=>{
  const {state,cap,lower}=episode();
  state.player.position={x:lower.x+Math.floor(lower.width/2),
    y:lower.y+lower.height+state.player.halfHeight};
  state.player.velocity={x:0,y:0};
  state.player.grounded=true;
  state.player.groundedPlatformId=lower.id;
  const decision=choose(state);
  assert.equal(decision.intent.targetPlatformId,cap.id);
  assert.ok(['jumping','aligning','settling-launch'].includes(decision.intent.mode));
  assert.equal(decision.action.dash,false);
  assert.equal(state.player.groundedPlatformId,lower.id,'no invented teleport');
});

test('living guardian, unflagged replay and a missed airborne collision plane cannot claim cleared-cap recovery',()=>{
  const {state,cap,guardian}=episode();
  state.player.position={x:cap.x+15000,
    y:cap.y+cap.height+state.player.halfHeight+12000};
  state.player.velocity={x:0,y:-4000};
  state.player.grounded=false;
  state.player.groundedPlatformId=undefined;
  guardian.active=true;
  guardian.health=guardian.maxHealth;
  assert.doesNotMatch(choose(state).intent.summary,/cleared guardian cap|earned guardian exit|guardian-cap landing/);
  guardian.active=false;
  guardian.health=0;
  state.config={...state.config,guardianArenaHazards:false};
  assert.doesNotMatch(choose(state).intent.summary,/cleared guardian cap|earned guardian exit|guardian-cap landing/);
  state.config={...state.config,guardianArenaHazards:true};
  state.player.position.y=cap.y+cap.height+state.player.halfHeight-10000;
  assert.doesNotMatch(choose(state).intent.summary,/cleared guardian cap|earned guardian exit|guardian-cap landing/);
});

test('far beneath the cap follows ordinary intermediate route, and grounded cap keeps physical crossing rule',()=>{
  const {state,cap}=episode();
  const ground=state.chunks[0].platforms.find(p=>p.id==='f8:ground');
  state.player.position={x:ground.x+42000,
    y:ground.y+ground.height+state.player.halfHeight};
  state.player.velocity={x:0,y:0};
  state.player.grounded=true;
  state.player.groundedPlatformId=ground.id;
  const ordinary=choose(state);
  assert.notEqual(ordinary.intent.targetPlatformId,cap.id,
    'a many-floor gap cannot be reclaimed by an impossible one-step jump');
  state.player.position={x:cap.x+25000,
    y:cap.y+cap.height+state.player.halfHeight};
  state.player.groundedPlatformId=cap.id;
  const passage=choose(state);
  assert.equal(passage.intent.targetPlatformId,cap.id);
  assert.match(passage.intent.summary,/Crossing the earned physical guardian passage/);
  assert.equal(passage.action.jump,false);
});
