'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');

function airborne(){
  const runtime=TowerRuntime.create({maxTicks:3500,noProgressTicks:1800},'real-flight-clearance');
  const s=structuredClone(runtime.state);
  const target=s.chunks[0].platforms.find(platform=>platform.id.endsWith(':p3'));
  assert.ok(target,'generated authoritative destination exists');
  target.x=340000;target.width=115000;
  s.ai.targetPlatformId=target.id;s.ai.recentHeights=[];
  s.player.position={x:target.x-300000,
    y:target.y+target.height+s.player.halfHeight+60000};
  s.player.velocity={x:9000,y:9000};
  s.player.grounded=false;s.player.groundedPlatformId=undefined;
  s.player.facing=-1;s.player.state='airborne';
  s.player.health=s.player.maxHealth;
  s.player.stamina=s.player.maxStamina;s.player.dashCooldown=0;
  s.enemies=[];s.projectiles=[];s.pickups=[];s.chunks[0].hazards=[];
  return {s,target};
}
function decision(s){return chooseTowerAction(s,createTowerObservation(s))}

test('distant safe takeoff can boost FORWARD despite a stale opposite facing',()=>{
  const {s,target}=airborne(),original=structuredClone(s);
  const d=decision(s);
  assert.equal(d.action.dash,true);
  assert.equal(d.action.move,1,'physics must orient the same tick dash toward the real destination');
  assert.match(d.intent.summary,/boosting/i);
  assert.equal(d.intent.targetPlatformId,target.id);
  const actual=stepTowerPhysics(s,d.action);
  assert.equal(actual.integrityFailure,undefined);
  assert.equal(actual.state.player.facing,1);
  assert.equal(actual.state.player.velocity.x,s.config.dashSpeed);
  assert.ok(actual.state.player.position.x>s.player.position.x);
  assert.equal(actual.state.stats.dashes,s.stats.dashes+1);
  assert.deepEqual(s,original,'the planner does not alter real simulation state');
});

test('an opposing horizontal momentum must be reversed before a committed boost',()=>{
  const {s}=airborne();
  s.player.velocity.x=-9000;
  const d=decision(s);
  assert.equal(d.action.dash,false);
  assert.equal(d.action.move,1);
  assert.equal(d.intent.mode,'settling-landing','countersteering is a genuine controlled-landing action');
});

test('not enough actual source stamina means no fictitious air boost',()=>{
  const {s}=airborne();
  s.player.stamina=Math.max(0,s.build.dashCost-1);
  const d=decision(s);
  assert.equal(d.action.dash,false);
  assert.equal(d.action.move,0,'normal air steering can coast when already moving at target speed');
});

test('near the real collision-safe deck edge, avoid a midpoint-triggered overshoot boost',()=>{
  const {s,target}=airborne();
  s.player.position.x=target.x-110000;
  const d=decision(s);
  assert.equal(d.action.dash,false);
  assert.equal(d.intent.targetPlatformId,target.id);
  const old=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
  assert.equal(old.action.dash,true,'historical-v1 policy remains frozen');
});

test('active hazard intersecting a landed body redirects an actual flight to a clear lane',()=>{
  const {s,target}=airborne();
  const center=target.x+target.width/2,top=target.y+target.height;
  s.player.position.x=center;s.player.position.y=top+s.player.halfHeight+60000;
  s.player.velocity={x:0,y:-5000};s.player.dashCooldown=8;
  const ordinary=decision(s);
  assert.equal(ordinary.action.move,0,'without a hazard the player is inside the deck lane');
  s.chunks[0].hazards=[{id:'observed-landing-spikes',kind:'spikes',
    x:center-16000,y:top,width:32000,height:9000,
    activeFromTick:0,activeEvery:40,activeFor:40,damage:1}];
  const safe=decision(s);
  assert.equal(safe.action.move,-1,'choose the nearest presently safe lane');
  assert.equal(safe.action.dash,false);
  assert.match(safe.intent.summary,/clear landing lane/i);
  assert.equal(safe.intent.targetPlatformId,target.id);
  assert.equal(s.player.position.x,center,'hazard planning is presentation/decision only');
});

test('inactive hazards and genuinely blocked decks never invent a clear landing lane',()=>{
  const {s,target}=airborne();
  const center=target.x+target.width/2,top=target.y+target.height;
  s.player.position.x=center;s.player.position.y=top+s.player.halfHeight+60000;
  s.player.velocity={x:0,y:-5000};s.player.dashCooldown=8;
  s.chunks[0].hazards=[{id:'future-hazard',kind:'spikes',
    x:center-16000,y:top,width:32000,height:9000,
    activeFromTick:s.tick+20,activeEvery:40,activeFor:40,damage:1}];
  assert.equal(decision(s).action.move,0);
  s.chunks[0].hazards[0].activeFromTick=0;
  s.chunks[0].hazards[0].x=target.x;
  s.chunks[0].hazards[0].width=target.width;
  const d=decision(s);
  assert.equal(d.action.move,0,'no safe opening exists, so no fake steering solution');
  assert.equal(d.intent.mode,'air-control');
  assert.deepEqual(decision(s),d,'the same immutable observation always yields the same action');
});

test('braking out of real spikes exposes the same clear-lane source intent to 3D route feedback',()=>{
  const {s,target}=airborne(),center=target.x+target.width/2;
  const top=target.y+target.height;
  s.player.position.x=center;s.player.position.y=top+s.player.halfHeight+60000;
  s.player.velocity={x:9000,y:-5000};s.player.dashCooldown=8;
  s.chunks[0].hazards=[{id:'active-spikes',kind:'spikes',
    x:center-16000,y:top,width:32000,height:9000,
    activeFromTick:0,activeEvery:40,activeFor:40,damage:1}];
  const d=decision(s);
  assert.equal(d.action.move,-1);
  assert.equal(d.action.dash,false);
  assert.equal(d.intent.mode,'settling-landing');
  assert.equal(d.intent.summary,'Braking into a clear landing lane');
  assert.equal(d.intent.targetPlatformId,target.id);
});

test('earned midair jump rescues an otherwise unreachable live landing without inventing future platforms',()=>{
  const {s,target}=airborne();
  s.player.position.x=target.x-108000;
  s.player.position.y=target.y+target.height+s.player.halfHeight+9000;
  s.player.velocity={x:900,y:-7800};
  s.player.jumpCharges=1;
  s.player.dashCooldown=8;
  const original=structuredClone(s),obs=createTowerObservation(s);
  assert.equal(obs.player.jumpCharges,1,'earned jump availability must be exposed to the present-state planner');
  const d=chooseTowerAction(s,obs);
  assert.equal(d.action.jump,true,'use the real remaining jump before missing the collision-supported landing');
  assert.equal(d.action.dash,false);
  assert.equal(d.intent.targetPlatformId,target.id);
  assert.match(d.intent.summary,/earned air recovery/i);
  assert.deepEqual(s,original,'planner cannot consume the jump or mutate source authority');
  const actual=stepTowerPhysics(s,d.action);
  assert.equal(actual.integrityFailure,undefined);
  assert.equal(actual.state.player.jumpCharges,0);
  assert.ok(actual.state.player.velocity.y>0);
  assert.equal(actual.state.stats.jumps,s.stats.jumps+1);
  const legacy=chooseTowerAction(s,obs,{tactical:false});
  assert.equal(legacy.action.jump,false,'frozen historical-v1 policy cannot gain a new air recovery');
});

test('air recovery never fabricates a jump charge or spends one when an ordinary landing is reachable',()=>{
  const {s,target}=airborne();
  s.player.position.x=target.x-108000;
  s.player.position.y=target.y+target.height+s.player.halfHeight+9000;
  s.player.velocity={x:900,y:-7800};
  s.player.jumpCharges=0;
  s.player.dashCooldown=8;
  assert.equal(decision(s).action.jump,false,'an exhausted midair jump must stay exhausted');
  s.player.jumpCharges=1;
  s.player.position.x=target.x+22000;
  s.player.velocity.x=0;
  assert.equal(decision(s).action.jump,false,'existing safe landing must not spend a charge');
  const again=decision(s);
  assert.deepEqual(again,decision(s),'source-identical recovery decisions remain deterministic');
});

test('physical air boost is reserved for a journey that present acceleration cannot cover in its current flight',()=>{
  const {s,target}=airborne();
  s.player.position.x=target.x-130000;
  s.player.position.y=target.y+target.height+s.player.halfHeight+30000;
  s.player.velocity={x:0,y:4000};
  s.player.dashCooldown=0;s.player.stamina=s.player.maxStamina;
  const d=decision(s);
  assert.equal(d.action.dash,true,'the unfinished short flight needs a source-directed boost');
  assert.equal(d.action.move,1);
  s.player.velocity.x=-9000;
  assert.equal(decision(s).action.dash,false,'do not boost against actual opposite momentum');
});

test('approaching a visible hazardous deck keeps source-aware clear-lane control instead of a premature panic reversal',()=>{
  const {s,target}=airborne(),center=target.x+target.width/2,top=target.y+target.height;
  s.player.position={x:center,y:top+s.player.halfHeight+30000};
  s.player.velocity={x:0,y:-5000};s.player.dashCooldown=8;
  s.chunks[0].hazards=[{id:'present-spikes',kind:'spikes',x:center-16000,y:top,
    width:32000,height:9000,activeFromTick:0,activeEvery:40,activeFor:40,damage:1}];
  const original=structuredClone(s);
  const early=decision(s);
  assert.equal(early.intent.mode,'air-control');
  assert.match(early.intent.summary,/clear landing lane/i);
  assert.equal(early.intent.targetPlatformId,target.id);
  assert.equal(early.action.move,-1,'real current safe lane is to the left');
  assert.deepEqual(s,original,'danger steering must not alter source hazard or player');
  s.player.position.y=top+s.player.halfHeight+1000;
  const imminent=decision(s);
  assert.equal(imminent.intent.mode,'evading-hazard','a real body overlap takes immediate safety precedence');
  const legacy=chooseTowerAction(original,createTowerObservation(original),{tactical:false});
  assert.equal(legacy.intent.mode,'evading-hazard','historical replay keeps prior hazard reflex');
});
