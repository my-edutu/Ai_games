'use strict';
// P0 source-owned 150ms dash landing-safety contract. Tests deliberately
// exercise deterministic observed geometry, not a frame/screenshot quality win.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {observedDashArrivalSafe}=require('../../dist/games/infinite-tower-climb/src/ai/dash-arrival.js');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function envelope(overrides={}){
  return {positionX:100000,halfWidth:9000,direction:1,
    laneLeft:180000,laneRight:200000,
    landingTicks:15,airAcceleration:900,maxRunSpeed:9000,
    dashSpeed:17000,...overrides};
}
test('a committed three-step dash cannot overrun the observed narrow touchdown lane even under full braking',()=>{
  assert.equal(observedDashArrivalSafe(envelope()),false);
  assert.equal(observedDashArrivalSafe(envelope({laneRight:250000})),true);
});
test('the opposite-direction commitment obeys the same whole-body edge protection',()=>{
  assert.equal(observedDashArrivalSafe(envelope({positionX:300000,direction:-1,
    laneLeft:200000,laneRight:250000})),false);
  assert.equal(observedDashArrivalSafe(envelope({positionX:300000,direction:-1,
    laneLeft:165000,laneRight:250000})),true);
});
test('do not launch a three-step dash when descent reaches a deck before its release and recovery',()=>{
  assert.equal(observedDashArrivalSafe(envelope({landingTicks:2})),false);
  assert.equal(observedDashArrivalSafe(envelope({landingTicks:3})),false);
  assert.equal(observedDashArrivalSafe(envelope({landingTicks:4,laneRight:250000})),true);
});
test('live autonomous route with an overshoot-prone narrow hazard lane declines a boost, retaining gameplay authority',()=>{
  const runtime=TowerRuntime.create({maxTicks:3500,noProgressTicks:1800,
    guardianSecondWind:true,guardianArenaHazards:true},
    'tower-committed-dash-clearance',{policy:'autonomous'});
  const s=structuredClone(runtime.state);
  const target=s.chunks[0].platforms.find(platform=>platform.id.endsWith(':p3'));
  assert.ok(target);
  target.x=175000;target.width=115000;
  const top=target.y+target.height;
  s.player.position={x:target.x-120000,y:top+s.player.halfHeight+30000};
  s.player.velocity={x:0,y:4000};
  s.player.grounded=false;s.player.groundedPlatformId=undefined;
  s.player.state='airborne';s.player.dashCooldown=0;
  s.player.stamina=s.player.maxStamina;
  s.ai.targetPlatformId=target.id;s.ai.recentHeights=[];
  s.enemies=[];s.projectiles=[];s.pickups=[];
  s.chunks[0].hazards=[{id:'real-narrow-clearance',kind:'spikes',
    x:target.x+25000,y:top,width:70000,height:9000,
    activeFromTick:0,activeEvery:40,activeFor:40,damage:1}];
  const before=structuredClone(s);
  const planned=chooseTowerAction(s,createTowerObservation(s));
  assert.equal(planned.action.dash,false,
    'a physically unsafe impulsive boost is not needed to earn a real landing');
  assert.deepEqual(s,before,'source planning must never mutate gameplay');
});
