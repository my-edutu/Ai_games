'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function encounter(){
 const runtime=TowerRuntime.create({maxTicks:1800,noProgressTicks:800},'counterplay-source');
 const s=structuredClone(runtime.state), p=s.player;
 const support=s.chunks[0].platforms.find(q=>q.width>60000)||s.chunks[0].platforms[0];
 p.position={x:support.x+support.width/2,y:support.y+support.height+p.halfHeight};
 p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=support.id;p.facing=1;
 s.enemies=[{id:'visible-shooter',kind:'shooter',floor:s.floor,position:{x:p.position.x+80000,y:p.position.y},
 velocity:{x:0,y:0},halfWidth:9000,halfHeight:14000,health:3,maxHealth:3,facing:-1,
 patrolMinX:0,patrolMaxX:s.config.worldWidth,cooldown:0,telegraphUntilTick:s.tick+2,active:true,damage:1}];
 return s;
}
test('real imminent aimed telegraph triggers a support-safe jump rather than blindly ascending',()=>{
 const s=encounter(), d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.intent.mode,'evading-telegraph');assert.equal(d.action.jump,true);assert.equal(d.action.move,0);
});
test('future, backward and ungrounded attacks cannot fabricate a dodge',()=>{
 for(const edit of [s=>s.enemies[0].telegraphUntilTick=s.tick+8,s=>s.enemies[0].facing=1,
 s=>s.player.grounded=false,s=>s.player.position.x=s.chunks[0].platforms.find(p=>p.id===s.player.groundedPlatformId).x+1000]){
  const s=encounter();edit(s);
  assert.notEqual(chooseTowerAction(s,createTowerObservation(s)).intent.mode,'evading-telegraph');
 }
});
test('real pulse-shot upgrade fires only when ready, aligned and inside sightline',()=>{
 const s=encounter(), e=s.enemies[0];e.position.x=s.player.position.x+25000;e.telegraphUntilTick=0;
 s.build.upgradeIds.push('pulse-shot');s.player.abilityCooldown=0;
 let d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.action.attack,true);assert.equal(d.action.ability,true);
 s.player.abilityCooldown=10;d=chooseTowerAction(s,createTowerObservation(s));assert.equal(d.action.ability,false);
 s.player.abilityCooldown=0;s.player.facing=-1;d=chooseTowerAction(s,createTowerObservation(s));
 assert.equal(d.action.ability,false);
});
