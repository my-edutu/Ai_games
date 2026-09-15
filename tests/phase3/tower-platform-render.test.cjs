'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {parseTowerConfig}=require('../../dist/games/infinite-tower-climb/src/config/schema.js');
const {generateTowerChunk,platformAtTick}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');

// Real generator, physical motion helper and public projection; no renderer mocks.
function fixture(tick,axis){
 const config=parseTowerConfig(),chunk=generateTowerChunk(config,'platform-render-regression',1);
 const moving=chunk.platforms.find(p=>p.kind==='moving');moving.motion={axis,range:35000,speed:2500,phase:0};
 return {config,chunks:[chunk],runId:'platform-render-regression',tick,floor:1,lifecycle:'running',
  player:{position:chunk.spawn,velocity:{x:0,y:0},halfWidth:9000,halfHeight:14000,facing:1,
   health:5,maxHealth:5,stamina:100,maxStamina:100,shieldCharges:0,state:'standing',score:0},
  enemies:[],projectiles:[],pickups:[],pendingUpgradeOffers:[],build:{upgradeIds:[]},
  ai:{mode:'climbing',intent:'Reach the next platform',confidence:1},stats:{maxHeight:chunk.spawn.y,floorsCleared:1}};
}
for(const axis of ['x','y'])for(const tick of [1,7,21,42,55])test(`tower public ${axis} platform matches physical transform at tick ${tick}`,()=>{
 const state=fixture(tick,axis),before=JSON.stringify(state),snapshot=createTowerRenderSnapshot(state);
 for(const original of state.chunks[0].platforms){
  const physical=platformAtTick(original,tick),shown=snapshot.platforms.find(p=>p.id===original.id);
  assert.equal(shown.x,physical.x);assert.equal(shown.y,physical.y);
 }
 assert.equal(JSON.stringify(state),before,'rendering must not modify authoritative geometry');
 assert.equal(Object.isFrozen(snapshot.platforms[0]),true);
 assert.deepEqual(snapshot,createTowerRenderSnapshot(state));
});
