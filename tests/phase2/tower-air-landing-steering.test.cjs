'use strict';
// Real autonomous AI decisions, not a visual-quality or replay PASS.
const test=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function approaching({offset=20000,vx=9000,moving=false}={}){
 const runtime=TowerRuntime.create({launchFloor:moving?1:0,maxTicks:3500,noProgressTicks:1800},'controlled-air-landing');
 const s=structuredClone(runtime.state);
 const target=s.chunks[0].platforms.find(p=>p.id.endsWith(':p3'));
 assert.ok(target);
 assert.equal(target.kind,moving?'moving':'oneway','use the actual generated moving deck');
 const center=target.x+target.width/2;
 s.player.position={x:center-offset,y:target.y+target.height+50000};
 s.player.velocity={x:vx,y:6000};
 s.player.grounded=false;s.player.groundedPlatformId=undefined;
 s.player.dashCooldown=7;
 s.player.health=s.player.maxHealth;
 s.ai.targetPlatformId=target.id;
 s.ai.recentHeights=[];
 s.enemies=[];s.projectiles=[];s.chunks[0].hazards=[];s.pickups=[];
 return {s,target};
}
test('a fast climber actively brakes on approach instead of overshooting its real platform',()=>{
 const {s,target}=approaching();
 const before=structuredClone(s);
 const decision=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(decision.intent.mode,'settling-landing');
 assert.equal(decision.action.move,-1);
 assert.equal(decision.action.jump,false);
 assert.equal(decision.action.dash,false);
 assert.equal(decision.intent.targetPlatformId,target.id);
 assert.deepEqual(s,before,'planning cannot mutate authoritative state');
 const legacy=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
 assert.equal(legacy.intent.mode,'air-control');
 assert.equal(legacy.action.move,1,'historical-v1 retains old steering');
});
test('far from a landing, tactical air control still pursues the destination',()=>{
 const {s}=approaching({offset:145000,vx:9000});
 const d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'air-control');
 assert.ok(d.action.move>=0);
});
test('a calm climber already within a real landing band does not jitter',()=>{
 const {s}=approaching({offset:4500,vx:0});
 const d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.action.move,0);
 assert.equal(d.action.dash,false);
});
test('moving deck uses its current observed position and explicitly names a real braking choice',()=>{
 const {s,target}=approaching({offset:18000,vx:9000,moving:true});
 const original=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(original.intent.mode,'settling-landing');
 assert.match(original.intent.summary,/moving deck/i);
 assert.equal(original.intent.targetPlatformId,target.id);
 // A new source tick and the same deck at a different observed x changes
 // feedback without hidden target guesses or changes to platform physics.
 target.x+=85000;
 const shifted=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(shifted.intent.mode,'air-control');
 assert.equal(shifted.action.move,0,'a far, fast approach coasts instead of reversing');
 assert.equal(shifted.intent.targetPlatformId,target.id);
});
test('repeated identical observations yield an identical decision and no inferred landing',()=>{
 const {s}=approaching({offset:24000,vx:8000});
 const obs=createTowerObservation(s),first=chooseTowerAction(s,obs);
 assert.deepEqual(chooseTowerAction(s,obs),first);
 assert.equal(s.player.grounded,false);
 assert.equal(s.stats.jumps,0);
});
