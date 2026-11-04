'use strict';
// Real autonomous movement during the SAME published trap charge that drives
// the 3D shutter stage; not a CI-based whole-game Gauntlet quality verdict.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');

function imminent(){
  const runtime=TowerRuntime.create({maxTicks:4000,noProgressTicks:1500},
    'tower-hazard-source-counterplay',{policy:'autonomous'});
  const s=structuredClone(runtime.state),p=s.player;
  const deck=[...s.chunks[0].platforms].sort((a,b)=>b.width-a.width)[0];
  assert.ok(deck && deck.width>75000,'real source-generated wide support');
  const top=deck.y+deck.height,center=deck.x+deck.width/2;
  p.position={x:center,y:top+p.halfHeight};
  p.velocity={x:0,y:0};p.facing=1;p.grounded=true;
  p.groundedPlatformId=deck.id;p.state='standing';p.health=p.maxHealth;
  s.enemies=[];s.projectiles=[];s.pickups=[];
  s.ai.targetPlatformId=undefined;s.ai.recentHeights=[];
  s.chunks[0].hazards=[{id:'observed-hot-vent',kind:'heat',
    x:center-17000,y:top,width:34000,height:12000,
    activeFromTick:12,activeEvery:80,activeFor:18,damage:1}];
  return {s,p,deck,top,center};
}
function live(s){
  return chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
}
test('live pilot sees the same genuine 20Hz charge as the physical 3D stage, not a private oracle',()=>{
  const {s}=imminent(),before=structuredClone(s);
  s.tick=4;
  const observed=createTowerObservation(s,{includeHazardWindup:true});
  const rendered=createTowerRenderSnapshot(s,{includeWindupTicks:true});
  assert.equal(observed.hazards[0].chargeTicksRemaining,8);
  assert.equal(observed.hazards[0].chargeTicksRemaining,
    rendered.hazards[0].chargeTicksRemaining);
  assert.equal(createTowerObservation(s).hazards[0].chargeTicksRemaining,undefined,
    'historical shape stays unchanged by default');
  assert.equal(createTowerRenderSnapshot(s).hazards[0].chargeTicksRemaining,undefined);
  assert.deepEqual(s,{...before,tick:4},'observation and rendering never mutate gameplay authority');
});
test('visible 12-tick charge produces retreat, then a physically earned last-chance jump',()=>{
  const {s}=imminent(),unchanged=structuredClone(s);
  const first=live(s);
  assert.equal(first.intent.mode,'evading-hazard',
    'already visible 12-tick shutter charge should give the actual climber time to react');
  assert.equal(first.action.move,-1,'equal deck exits use deterministic tie-breaking');
  assert.equal(first.action.jump,false,'early warning is for steering, not an unearned leap');
  s.tick=4;
  const early=live(s);
  assert.equal(early.intent.mode,'evading-hazard');
  assert.equal(early.action.move,-1);
  assert.equal(early.action.jump,false);
  assert.match(early.intent.summary,/charging hazard/i);
  s.tick=9;
  const late=live(s);
  assert.equal(late.action.jump,true,'real 3-tick charge requires an earned evasive jump');
  assert.equal(late.action.move,-1);
  assert.deepEqual(late,live(s),'same source yields same autonomous action');
  assert.equal(s.player.position.x,unchanged.player.position.x,'decision does not teleport the climber');
  s.tick=12;
  assert.equal(live(s).intent.mode,'evading-hazard','active trap retains original priority');
});
test('no warning on a remote floor or missing support; historical policy stays unchanged',()=>{
  const {s,p}=imminent();s.tick=4;
  const legacy=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
  assert.notEqual(legacy.intent.mode,'evading-hazard',
    'historical-v1 never receives a tactical windup');
  s.chunks[0].hazards[0].y+=150000;
  assert.notEqual(live(s).intent.mode,'evading-hazard','remote trap does not steal ascent');
  s.chunks[0].hazards[0].y-=150000;
  p.grounded=false;p.groundedPlatformId=undefined;
  assert.notEqual(live(s).intent.mode,'evading-hazard',
    'unsupported player cannot be forced into a fake ground retreat');
});
test('source charge respects real deck edges, rather than walking the climber off a ledge',()=>{
  const {s,p,deck,top}=imminent();
  p.position.x=deck.x+p.halfWidth+5000;
  const h=s.chunks[0].hazards[0];
  h.x=p.position.x+8000;h.width=18000;h.y=top;
  s.tick=4;
  const result=live(s);
  assert.equal(result.intent.mode,'evading-hazard');
  assert.notEqual(result.action.move,-1,'inward collision-safe brake outranks running off edge');
  assert.equal(result.action.jump,false);
});
test('descending into an imminently charging landing takes a genuinely clear lane',()=>{
  const {s,p,deck,top,center}=imminent();
  p.grounded=false;p.groundedPlatformId=undefined;p.state='airborne';
  p.position={x:center,y:top+p.halfHeight+60000};
  p.velocity={x:0,y:-5000};p.dashCooldown=8;p.jumpCharges=0;
  s.ai.targetPlatformId=deck.id;
  s.tick=4; // charge=8, too early to mislabel a future landing
  const ordinary=live(s);
  assert.equal(ordinary.action.move,0,'distant arming does not hijack air control');
  s.tick=7; // charge=5, public immediate physical pressure
  const warned=live(s);
  assert.equal(warned.action.move,-1,'present collision geometry has a clear left lane');
  assert.equal(warned.action.jump,false,'do not invent another jump charge');
  assert.match(warned.intent.summary,/clear landing lane/i);
  const legacy=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
  assert.equal(legacy.action.move,0,'historical source trajectory remains unchanged');
});

test('the autonomous climber commits to an observed exit with real on-deck momentum, not a decorative hazard midpoint',()=>{
  const {s,p,center}=imminent();
  s.tick=6; // six genuinely published ticks to activation
  p.velocity.x=s.config.maxRunSpeed;
  const directed=live(s);
  assert.equal(directed.intent.mode,'evading-hazard');
  assert.equal(directed.action.move,1,
    'an already rightward climber should not reverse into an equally distant left route');
  assert.equal(directed.action.jump,true,
    'when neither body-clear exit fits the remaining physics window, earn a timely leap');
  assert.deepEqual(directed,live(s),'fixed-step choices must be repeatable');
  assert.equal(p.position.x,center,'policy does not teleport or force a safe outcome');
});
test('full-width live shutter charge has no fictional safe deck exit and forces an ordinary early leap',()=>{
  const {s,p,deck}=imminent();
  const hazard=s.chunks[0].hazards[0];
  hazard.x=deck.x;
  hazard.width=deck.width;
  s.tick=6;
  const before=structuredClone(s);
  const result=live(s);
  assert.equal(result.intent.mode,'evading-hazard');
  assert.equal(result.action.jump,true,'a witnessed blocked deck must be tackled before the last 0.15 seconds');
  assert.equal(result.action.dash,false);
  assert.deepEqual(s,before,'failed escape must not change collision or authority');
  p.grounded=false;p.groundedPlatformId=undefined;
  assert.notEqual(live(s).intent.mode,'evading-hazard',
    'the grounded emergency cannot grant a fake second jump in mid-air');
});
