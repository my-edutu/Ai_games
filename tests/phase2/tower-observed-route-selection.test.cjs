'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseTowerConfig}=require('../../dist/games/infinite-tower-climb/src/config/schema.js');
const {nextTowerPlatform,nextTowerTacticalPlatform}=require('../../dist/games/infinite-tower-climb/src/ai/graph.js');
const config=parseTowerConfig();
function fixture(){
  const platforms=[
    {id:'f0:start',kind:'solid',x:120000,y:0,width:110000,height:12000},
    {id:'f0:danger',kind:'solid',x:120000,y:35000,width:110000,height:12000},
    {id:'f0:clear',kind:'solid',x:250000,y:37000,width:110000,height:12000},
    {id:'f0:cap',kind:'solid',x:185000,y:112000,width:130000,height:12000},
  ];
  return {schemaVersion:1,tick:40,floor:0,theme:'ruins',height:0,
    player:{position:{x:175000,y:26000},velocity:{x:0,y:0},grounded:true,
      groundedPlatformId:'f0:start',facing:1,health:8,maxHealth:8,stamina:10,
      shieldCharges:0,attackCooldown:0,abilityCooldown:0,dashCooldown:0,jumpCharges:0},
    platforms,hazards:[],enemies:[],projectiles:[],pickups:[],upgradeOffers:[],
    buildIds:[],recentHeights:[]};
}
const route=(obs,prior)=>nextTowerTacticalPlatform(obs,config,'f0:start',prior,9000,14000);
test('ordinary safe ascent retains the first reachable legacy deck and cannot alter observation',()=>{
  const o=fixture(),frozen=structuredClone(o);
  assert.equal(nextTowerPlatform(o,config,'f0:start').id,'f0:danger');
  assert.equal(route(o).id,'f0:danger');
  assert.deepEqual(o,frozen);
});
test('real active spikes covering the first landing cause a connected alternate route to cap',()=>{
  const o=fixture(),first=o.platforms[1];
  o.hazards=[{id:'live-spikes',kind:'spikes',x:first.x,y:first.y+first.height,
    width:first.width,height:12000,active:true}];
  assert.equal(route(o).id,'f0:clear');
  assert.equal(route(o,'f0:clear').id,'f0:clear');
  o.hazards[0].active=false;
  assert.equal(route(o,'f0:clear').id,'f0:clear','committed clear path must not oscillate');
  assert.equal(route(o).id,'f0:danger','inactive future danger cannot hijack the route');
});
test('a physically overlapping living enemy blocks a landing; remote or defeated enemies do not',()=>{
  const o=fixture(),n=o.platforms[1],top=n.y+n.height;
  o.enemies=[{id:'enemy',kind:'sentinel',position:{x:n.x+n.width/2,y:top+14000},
    halfWidth:80000,halfHeight:14000,health:3,active:true,facing:1,telegraphUntilTick:0}];
  assert.equal(route(o).id,'f0:clear');
  o.enemies[0].active=false;
  assert.equal(route(o).id,'f0:danger');
  o.enemies[0].active=true;o.enemies[0].position.y+=180000;
  assert.equal(route(o).id,'f0:danger');
});
test('a real visible health pickup can steer an injured climber toward a clear side route',()=>{
  const o=fixture(),safe=o.platforms[2];
  o.player.health=2;
  o.pickups=[{id:'aid',kind:'health',position:{x:safe.x+safe.width/2,
    y:safe.y+safe.height+14000},value:2}];
  assert.equal(route(o).id,'f0:clear');
  o.player.health=8;
  assert.equal(route(o).id,'f0:danger');
  o.player.health=2;o.pickups=[];
  assert.equal(route(o).id,'f0:danger','health cannot be invented');
});
test('when every observed next deck is blocked, retain physical route without invented guarantees',()=>{
  const o=fixture();
  o.hazards=o.platforms.slice(1,3).map(p=>({id:'spikes:'+p.id,kind:'spikes',
    x:p.x,y:p.y+p.height,width:p.width,height:12000,active:true}));
  assert.equal(route(o).id,'f0:danger');
  assert.deepEqual(route(o),route(o),'deterministic same-observation result');
});
