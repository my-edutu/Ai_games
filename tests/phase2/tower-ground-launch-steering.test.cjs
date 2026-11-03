'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
function grounded({dx=3000,vx=8500}={}){
 const r=TowerRuntime.create({maxTicks:3500,noProgressTicks:1800},'source-ground-launch');
 const s=structuredClone(r.state),support=s.chunks[0].platforms[0],target=s.chunks[0].platforms[1];
 const destination=target.x+target.width/2;
 s.player.position={x:destination-dx,y:support.y+support.height+s.player.halfHeight};
 s.player.velocity={x:vx,y:0};s.player.grounded=true;
 s.player.groundedPlatformId=support.id;s.player.state='standing';
 s.player.health=s.player.maxHealth;
 s.enemies=[];s.projectiles=[];s.chunks[0].hazards=[];s.pickups=[];
 s.ai.recentHeights=[];s.ai.targetPlatformId=target.id;
 return {s,support,target};
}
test('tactical grounded climber brakes before a close takeoff rather than leaping with excess speed',()=>{
 const {s,target}=grounded();
 const original=structuredClone(s);
 const d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'settling-launch');
 assert.equal(d.action.jump,false);
 assert.equal(d.action.move,0,'ground friction decelerates faster than opposite thrust');
 assert.equal(d.intent.targetPlatformId,target.id);
 const stepped=stepTowerPhysics(s,d.action);
 assert.equal(stepped.integrityFailure,undefined);
 assert.equal(stepped.state.player.grounded,true);
 assert.ok(stepped.state.player.velocity.x<s.player.velocity.x);
 assert.deepEqual(s,original,'planning never mutates physics or replay state');
 const legacy=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
 assert.equal(legacy.action.jump,true,'historical-v1 preserves its original immediate takeoff');
});
test('a calm climber commits to the real jump from its current safe launch point',()=>{
 const {s,target}=grounded({dx:3000,vx:0});
 const d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'jumping');
 assert.equal(d.action.jump,true);
 assert.equal(d.intent.targetPlatformId,target.id);
});
test('grounded approach decelerates near the launch target and keeps its feet on the deck',()=>{
 const {s}=grounded({dx:24000,vx:9000});
 const d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'settling-launch');
 assert.equal(d.action.jump,false);
 const out=stepTowerPhysics(s,d.action);
 assert.equal(out.state.player.grounded,true);
 assert.ok(out.state.player.velocity.x<9000);
});
test('when a real ground step would cross the support margin, takeoff beats walking off an edge',()=>{
 const {s,support,target}=grounded({dx:3000,vx:9000});
 s.player.position.x=support.x+support.width-s.player.halfWidth-4500;
 s.player.velocity.x=9000;
 const d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.action.jump,true);
 assert.equal(d.intent.mode,'jumping');
 assert.equal(d.intent.targetPlatformId,target.id);
});
test('replaying an unchanged grounded observation always chooses the same authoritative action',()=>{
 const {s}=grounded({dx:41000,vx:6500}),obs=createTowerObservation(s);
 const first=chooseTowerAction(s,obs);
 assert.deepEqual(chooseTowerAction(s,obs),first);
 assert.equal(s.player.grounded,true);
});


test('actual source-step launch breaks integer deadband without fake motion or legacy rewrite',()=>{
 const r=TowerRuntime.create({launchFloor:2,maxTicks:3500,noProgressTicks:2200},
   'tower-incident-rescue:storm:1',{policy:'autonomous'});
 const s=structuredClone(r.state);
 const support=s.chunks[0].platforms.find(p=>p.id==='f2:p1');
 const target=s.chunks[0].platforms.find(p=>p.id==='f2:p2');
 assert.ok(support&&target);
 const desired=support.x+s.player.halfWidth+6000;
 s.player.position={x:desired+12007,y:support.y+support.height+s.player.halfHeight};
 s.player.velocity={x:0,y:0};s.player.grounded=true;
 s.player.groundedPlatformId=support.id;s.player.state='standing';
 s.ai.targetPlatformId=target.id;s.ai.recentHeights=[];
 s.enemies=[];s.projectiles=[];s.chunks[0].hazards=[];s.pickups=[];
 const obs=createTowerObservation(s),before=structuredClone(obs);
 const decision=chooseTowerAction(s,obs);
 assert.equal(decision.action.move,-1,'must physically cross launch-window deadband');
 assert.equal(decision.action.jump,false,'no premature or invented jump');
 assert.equal(decision.intent.targetPlatformId,target.id);
 const physical=stepTowerPhysics(s,decision.action);
 assert.equal(physical.integrityFailure,undefined);
 assert.ok(physical.state.player.position.x<s.player.position.x);
 const next=chooseTowerAction(physical.state,createTowerObservation(physical.state));
 assert.equal(next.action.jump,true,'new source position now permits real jumping');
 assert.equal(next.intent.targetPlatformId,target.id);
 assert.deepEqual(obs,before,'decision cannot mutate replay observation');
 const legacy=chooseTowerAction(s,obs,{tactical:false});
 assert.equal(legacy.action.jump,false,'archived v1 launch remains unchanged');
});
