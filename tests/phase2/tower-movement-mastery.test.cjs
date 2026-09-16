'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const{stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');

function state(seed='movement-mastery'){
  return structuredClone(TowerRuntime.create({},seed,{policy:'idle-test'}).state);
}
function act(extra={}){return{move:0,jump:false,wallJump:false,dash:false,attack:false,ability:false,...extra}}

test('wall jump requires a same-tick solid wall contact',()=>{
  const s=state('wall-jump-none');
  s.player.grounded=false;s.player.groundedPlatformId=undefined;s.player.velocity={x:0,y:0};
  const out=stepTowerPhysics(s,act({wallJump:true,move:1}));
  assert.notEqual(out.state.player.state,'wall-jumping');
  assert.equal(out.state.stats.wallJumps,0);
});

test('wall jump deterministically launches away from a solid wall',()=>{
  const s=state('wall-jump-solid'),p=s.player,c=s.config,ch=s.chunks[0],wallX=210000;
  ch.platforms.push({id:'test:wall',kind:'solid',x:wallX,y:p.position.y-70000,width:14000,height:140000});
  p.position={x:wallX-p.halfWidth-1,y:p.position.y+30000};p.velocity={x:5000,y:0};p.grounded=false;p.groundedPlatformId=undefined;
  const a=stepTowerPhysics(s,act({wallJump:true,move:1})),b=stepTowerPhysics(structuredClone(s),act({wallJump:true,move:1}));
  assert.deepEqual(a,b);
  assert.equal(a.state.player.state,'wall-jumping');
  assert.ok(a.state.player.velocity.x<0,'must launch away from wall');
  assert.ok(a.state.player.velocity.y>0,'must launch upward');
  assert.equal(a.state.stats.wallJumps,1);
});

test('mantle snaps a near-edge airborne player to a legal solid platform top',()=>{
  const s=state('mantle-edge'),p=s.player,ch=s.chunks[0],platform={id:'test:mantle',kind:'solid',x:180000,y:p.position.y+42000,width:100000,height:18000};
  ch.platforms.push(platform);
  const top=platform.y+platform.height;
  p.position={x:platform.x-p.halfWidth-1,y:top-p.halfHeight+6000};p.velocity={x:6000,y:-1500};p.grounded=false;p.groundedPlatformId=undefined;
  const out=stepTowerPhysics(s,act({move:1}));
  assert.equal(out.state.player.state,'mantling');
  assert.equal(out.state.player.grounded,true);
  assert.equal(out.state.player.groundedPlatformId,platform.id);
  assert.equal(out.state.player.position.y,top+p.halfHeight);
  assert.ok(out.state.player.position.x>=platform.x+p.halfWidth);
  assert.equal(out.state.stats.mantles,1);
});

test('oneway platform sides cannot be abused for wall jump or mantle',()=>{
  const s=state('oneway-no-wall'),p=s.player,ch=s.chunks[0],platform={id:'test:oneway-wall',kind:'oneway',x:190000,y:p.position.y+30000,width:90000,height:18000};
  ch.platforms.push(platform);p.position={x:platform.x-p.halfWidth-1,y:platform.y+platform.height-p.halfHeight+4000};p.velocity={x:6000,y:0};p.grounded=false;p.groundedPlatformId=undefined;
  const out=stepTowerPhysics(s,act({move:1,wallJump:true}));
  assert.notEqual(out.state.player.state,'wall-jumping');assert.notEqual(out.state.player.state,'mantling');
  assert.equal(out.state.stats.wallJumps,0);assert.equal(out.state.stats.mantles,0);
});
