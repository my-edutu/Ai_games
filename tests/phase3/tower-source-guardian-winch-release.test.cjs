'use strict';
// Deterministic 20Hz origin gate: guardian HP0 is earned but the clockwork
// counterweights must physically finish pulling before Floor9 can be entered.
// These safety tests are NOT a native-film pass or an independent critic.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot');
const {guardianArenaExitX}=require('../../dist/games/infinite-tower-climb/src/generation/chunks');
const cfg={launchFloor:8,guardianInterval:8,guardianArenaHazards:true,
  guardianSecondWind:true,guardianGateActuationTicks:28,upgradeInterval:4,
  maxTicks:1600,noProgressTicks:1200};
function realCapFixture(){
 const runtime=TowerRuntime.create(cfg,'physical-bronze-winch');
 const st=runtime.state,cap=st.chunks.find(c=>c.floor===8).platforms.find(p=>p.id==='f8:cap');
 const guardian=st.enemies.find(e=>e.kind==='guardian'&&e.floor===8);
 assert.ok(cap&&guardian);
 guardian.health=1;guardian.maxHealth=8;guardian.active=true;
 guardian.guardUntilTick=0;guardian.staggerUntilTick=0;guardian.telegraphUntilTick=0;
 const roof=cap.y+cap.height,gate=guardianArenaExitX(cap);
 st.player.position={x:gate-st.player.halfWidth-14000,
   y:roof+st.player.halfHeight};
 st.player.grounded=true;st.player.groundedPlatformId=cap.id;
 st.player.velocity={x:0,y:0};st.player.facing=1;
 st.player.attackCooldown=0;st.player.health=st.player.maxHealth;
 guardian.position={x:st.player.position.x+18000,y:st.player.position.y};
 guardian.facing=-1;guardian.patrolMinX=guardian.position.x;
 guardian.patrolMaxX=guardian.position.x;
 return {runtime,cap,guardianId:guardian.id};
}
test('actual lethal hit starts winch, then source wall prevents an instant synthetic floor award',()=>{
 const {runtime,cap,guardianId}=realCapFixture();
 const first=runtime.step({move:0,attack:true});
 assert.equal(first.enemies.find(e=>e.id===guardianId).active,false,
   'a real combat hit, not manual health editing, must kill the guardian');
 assert.deepEqual(first.guardianGateActuation,
   {floor:8,guardianId,defeatTick:0,openAtTick:28});
 assert.equal(first.floor,8);
 assert.equal(createTowerRenderSnapshot(first).guardianGateActuation.openAtTick,28);
 const gate=guardianArenaExitX(cap);
 for(let i=0;i<27;i++){
   const state=runtime.step({move:1,dash:false,jump:false,attack:false,ability:false});
   assert.equal(state.floor,8,'the source cannot load Floor9 while a real bronze lock is still pulling');
   assert.ok(state.player.position.x<=gate-state.player.halfWidth,
     'swept physical collision stops the body at the source gate plane');
 }
 assert.equal(runtime.state.tick,28);
 for(let i=0;i<35&&runtime.state.floor===8;i++)
   runtime.step({move:1,jump:false,dash:false,attack:false,ability:false});
 assert.equal(runtime.state.floor,9,'ordinary physics walks through once the winch finishes');
 assert.equal(runtime.state.guardianGateActuation,undefined,'crossing releases old source owner');
 assert.equal(runtime.state.lastGuardianCrossing?.guardian.health<=0,true);
 assert.ok(runtime.state.lastGuardianCrossing?.sourceTick>=28);
});
test('unflagged historic replay keeps its original public snapshot and no mechanical epoch',()=>{
 const old=TowerRuntime.create({...cfg,guardianGateActuationTicks:undefined},
   'physical-bronze-winch-legacy');
 assert.equal(old.state.guardianGateActuation,undefined);
 assert.equal(createTowerRenderSnapshot(old.state).guardianGateActuation,undefined);
});
test('shipped source, collision, real wing/weight poses and original seal agree on one deadline',()=>{
 const root=path.resolve(__dirname,'../..');
 const world=fs.readFileSync(path.join(root,
   'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 const passage=fs.readFileSync(path.join(root,
   'public/infinite-tower-climb/visuals/guardian-passage.mjs'),'utf8');
 const physics=fs.readFileSync(path.join(root,
   'games/infinite-tower-climb/src/physics/step.ts'),'utf8');
 assert.match(world,/winchProgress/);
 assert.match(world,/gate\.unlocked=unlocked&&\(!genuineWinch\|\|winchProgress>=1\)/);
 assert.match(passage,/winch\.openAtTick>winch\.defeatTick/);
 assert.match(physics,/sourceWinchClosed\|\|state\.enemies/);
});
