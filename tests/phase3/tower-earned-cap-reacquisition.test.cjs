'use strict';
// Original fixed-step pilot and source observations: recovery of the earned
// guardian cap is navigation, never a scripted floor-nine passage or a
// transformation quality vote. Requires npm run build before node --test.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {nextTowerEarnedCapHop,buildTowerPlatformGraph}=
  require('../../dist/games/infinite-tower-climb/src/ai/graph.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

function episode() {
  const state=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
    'tower-transformation-capture-v1',{policy:'autonomous'}).state;
  const chunk=state.chunks.find(c=>c.floor===8);
  const cap=chunk.platforms.find(p=>p.id==='f8:cap');
  const lower=chunk.platforms.find(p=>p.id==='f8:p6');
  const guardian=state.enemies.find(e=>e.floor===8&&e.kind==='guardian');
  assert.ok(cap&&lower&&guardian,'fixture must use authentic generated guardian platforms/enemy');
  guardian.active=false;
  guardian.health=0;
  state.enemies=[guardian];
  state.projectiles=[];
  state.pickups=[];
  chunk.hazards=[];
  state.ai.targetPlatformId='f8:p2'; // The pre-fight autonomous target has gone stale.
  return {state,cap,lower,guardian};
}
function choose(state){
  const observed=createTowerObservation(state,{includeHazardWindup:true});
  // Route-search telemetry may legitimately advance in non-recovery cases;
  // test physical body immutability separately in the earned-cap case.
  return chooseTowerAction(state,observed,{tactical:true});
}

test('a source-defeated guardian redirects airborne pilot to the genuine cap instead of stale route',()=>{
  const {state,cap}=episode();
  state.player.position={x:cap.x+40000,y:cap.y+cap.height+state.player.halfHeight+28000};
  state.player.velocity={x:-3800,y:-4000};
  state.player.grounded=false;
  state.player.groundedPlatformId=undefined;
  state.player.jumpCharges=0;
  const before={...state.player.position};
  const d=choose(state);
  assert.equal(d.intent.targetPlatformId,cap.id);
  assert.match(d.intent.summary,/guardian cap|guardian deck|guardian-cap|exit cap/);
  assert.equal(d.action.attack,false);
  assert.equal(d.action.ability,false);
  assert.deepEqual(state.player.position,before);
  const stepped=stepTowerPhysics(state,d.action).state;
  assert.equal(stepped.floor,8,'no invented floor advancement');
  assert.notDeepEqual(stepped.player.position,before,'real fixed-step velocity moves the body');
});

test('after a real victory, a nearby lower deck yields an ordinary source-legal cap launch',()=>{
  const {state,cap,lower}=episode();
  state.player.position={x:lower.x+Math.floor(lower.width/2),
    y:lower.y+lower.height+state.player.halfHeight};
  state.player.velocity={x:0,y:0};
  state.player.grounded=true;
  state.player.groundedPlatformId=lower.id;
  const decision=choose(state);
  assert.equal(decision.intent.targetPlatformId,cap.id);
  assert.ok(['jumping','aligning','settling-launch'].includes(decision.intent.mode));
  assert.equal(decision.action.dash,false);
  assert.equal(state.player.groundedPlatformId,lower.id,'no invented teleport');
});


test('a real post-defeat fall BELOW the cap plane reacquires an interceptable lower shelf',()=>{
  const {state,cap}=episode();
  const shelf=state.chunks[0].platforms.find(p=>p.id==='f8:p6');
  assert.ok(shelf);
  // The player's real soles have fallen through the one-way cap. Simply
  // targeting the old cap at this point would falsely promise a landing.
  const capTop=cap.y+cap.height,shelfTop=shelf.y+shelf.height;
  assert.ok(shelfTop<capTop-20000);
  state.player.position={x:shelf.x+Math.floor(shelf.width/2),
    y:capTop-6000+state.player.halfHeight};
  state.player.velocity={x:0,y:-5000};
  state.player.grounded=false;
  state.player.groundedPlatformId=undefined;
  state.ai.targetPlatformId='f8:p2'; // Stale combat target, not a safe landing.
  const before={...state.player.position},decision=choose(state);
  assert.equal(decision.intent.targetPlatformId,shelf.id,
    'descending actor should reacquire actual reachable shelf, not the stale lower fight target');
  assert.match(decision.intent.summary,/real return deck|reachable return deck|reachable clear return lane/);
  assert.equal(decision.action.jump,false,'no invented mid-air recovery jump');
  assert.equal(decision.action.dash,false,'fall steering never grants a free dash');
  assert.equal(decision.action.ability,false);
  assert.equal(decision.action.attack,false);
  assert.deepEqual(state.player.position,before,'policy cannot teleport');
  const next=stepTowerPhysics(state,decision.action).state;
  assert.equal(next.floor,8);
  assert.ok(next.player.position.y<before.y,'source gravity still moves the falling hero');
});

test('falling return shelf must be physically interceptable, not merely on the upward graph',()=>{
  const {state,cap}=episode();
  const shelf=state.chunks[0].platforms.find(p=>p.id==='f8:p6');
  // Force ALL return ledges into a far-left fixture. The guardian cap itself
  // stays authentic, but this falling body cannot intercept any lower shelf
  // before gravity passes their tops, even with maximum legal air steering.
  for(const deck of state.chunks[0].platforms)if(deck.id!==cap.id){
    deck.x=12000;deck.width=80000;
  }
  state.player.position={x:state.config.worldWidth-state.player.halfWidth,
    y:cap.y+cap.height-6000+state.player.halfHeight};
  state.player.velocity={x:0,y:-12000};
  state.player.grounded=false;state.player.groundedPlatformId=undefined;
  state.ai.targetPlatformId='f8:p2';
  const observed=createTowerObservation(state,{includeHazardWindup:true});
  // At this downward speed and far offset, the actual lower landing is
  // outside the remaining bounded air-control travel, even if the planner
  // knows it can be jumped FROM once safely standing on it.
  assert.ok(shelf.x+shelf.width+60000<state.player.position.x);
  const choice=chooseTowerAction(state,observed,{tactical:true});
  assert.notEqual(choice.intent.targetPlatformId,shelf.id,
    'no made-up post-victory shelf when physical interception is impossible');
  assert.doesNotMatch(choice.intent.summary,/reachable return deck|real return deck/);
});

test('living guardian, unflagged replay and a missed airborne collision plane cannot claim cleared-cap recovery',()=>{
  const {state,cap,guardian}=episode();
  state.player.position={x:cap.x+15000,
    y:cap.y+cap.height+state.player.halfHeight+12000};
  state.player.velocity={x:0,y:-4000};
  state.player.grounded=false;
  state.player.groundedPlatformId=undefined;
  guardian.active=true;
  guardian.health=guardian.maxHealth;
  assert.doesNotMatch(choose(state).intent.summary,/cleared guardian cap|earned guardian exit|guardian-cap landing/);
  guardian.active=false;
  guardian.health=0;
  state.config={...state.config,guardianArenaHazards:false};
  assert.doesNotMatch(choose(state).intent.summary,/cleared guardian cap|earned guardian exit|guardian-cap landing/);
  state.config={...state.config,guardianArenaHazards:true};
  state.player.position.y=cap.y+cap.height+state.player.halfHeight-10000;
  assert.doesNotMatch(choose(state).intent.summary,/cleared guardian cap|earned guardian exit|guardian-cap landing/);
});

test('far beneath the cap follows ordinary intermediate route, and grounded cap keeps physical crossing rule',()=>{
  const {state,cap}=episode();
  const ground=state.chunks[0].platforms.find(p=>p.id==='f8:ground');
  state.player.position={x:ground.x+42000,
    y:ground.y+ground.height+state.player.halfHeight};
  state.player.velocity={x:0,y:0};
  state.player.grounded=true;
  state.player.groundedPlatformId=ground.id;
  const ordinary=choose(state);
  assert.notEqual(ordinary.intent.targetPlatformId,cap.id,
    'a many-floor gap cannot be reclaimed by an impossible one-step jump');
  state.player.position={x:cap.x+25000,
    y:cap.y+cap.height+state.player.halfHeight};
  state.player.groundedPlatformId=cap.id;
  const passage=choose(state);
  assert.equal(passage.intent.targetPlatformId,cap.id);
  assert.match(passage.intent.summary,/Crossing the earned physical guardian passage/);
  assert.equal(passage.action.jump,false);
});

test('genuine post-guardian fall from a mid-tower deck climbs an observed multi-hop route',()=>{
  const {state,cap}=episode();
  const mid=state.chunks[0].platforms.find(p=>p.id==='f8:p3');
  assert.ok(mid);
  state.player.position={x:mid.x+Math.floor(mid.width/2),
    y:mid.y+mid.height+state.player.halfHeight};
  state.player.velocity={x:0,y:0};
  state.player.grounded=true;
  state.player.groundedPlatformId=mid.id;
  const observation=createTowerObservation(state,{includeHazardWindup:true});
  const before=JSON.stringify(observation);
  const graph=buildTowerPlatformGraph(observation,state.config);
  const nodes=new Map(graph.map(p=>[p.id,p]));
  let current=mid.id;
  const route=[];
  for(let i=0;i<graph.length&&current!==cap.id;i++){
    const next=nextTowerEarnedCapHop(observation,state.config,current,cap.id);
    assert.ok(next,'a real upward route should be available from '+current);
    assert.ok(nodes.get(current).neighbors.includes(next.id),
      'each selected launch must satisfy the real movement envelope');
    assert.ok(next.y+next.height>nodes.get(current).y+nodes.get(current).height);
    route.push(next.id);current=next.id;
  }
  assert.equal(current,cap.id);
  assert.ok(route.length>=2,'a mid-tower knockback cannot jump straight to the cap');
  const decision=choose(state);
  assert.equal(decision.intent.targetPlatformId,route[0],
    'the controller should take the first earned real platform hop, not stale p2');
  assert.equal(decision.action.dash,false);
  assert.equal(decision.action.ability,false);
  assert.match(decision.intent.summary,/guardian exit|guardian cap/);
  assert.equal(JSON.stringify(observation),before,'route reads immutable observation');
  assert.deepEqual(nextTowerEarnedCapHop(observation,state.config,mid.id,cap.id),
    nextTowerEarnedCapHop(observation,state.config,mid.id,cap.id));
});

test('guardian cap route refuses invented edges and preserves historical policy',()=>{
  const {state,cap}=episode();
  const mid=state.chunks[0].platforms.find(p=>p.id==='f8:p3');
  state.player.position={x:mid.x+mid.width/2,
    y:mid.y+mid.height+state.player.halfHeight};
  state.player.grounded=true;state.player.groundedPlatformId=mid.id;
  const observation=createTowerObservation(state,{includeHazardWindup:true});
  const unreachable={...observation,platforms:observation.platforms.map(p=>
    p.id===cap.id?{...p,x:5000000}:p)};
  assert.equal(nextTowerEarnedCapHop(unreachable,state.config,mid.id,cap.id),
    undefined,'no fictional cap jump beyond physics');
  assert.equal(nextTowerEarnedCapHop(observation,state.config,'missing',cap.id),
    undefined,'a ghost support cannot generate a route');
  state.config={...state.config,guardianArenaHazards:false};
  const legacy=choose(state);
  assert.doesNotMatch(legacy.intent.summary,/Rebuilding the physical ascent route/);
});

test('the pilot does not invent a clear lower shelf through unavoidable upper one-way collision',()=>{
  const {state,cap}=episode();
  const upper=state.chunks[0].platforms.find(p=>p.id==='f8:p6');
  const lower=state.chunks[0].platforms.find(p=>p.id==='f8:p5');
  assert.ok(upper&&lower);
  // Keep a real upward return edge while making the lower shelf physically
  // interceptable in the same observed air corridor. Source physics still
  // decides both the initial landing and the subsequent jumps.
  lower.x=upper.x;lower.width=upper.width;
  const upperTop=upper.y+upper.height;
  state.chunks[0].hazards.push({
    id:'f8:rescue-shutter',kind:'crusher',x:upper.x,
    y:upperTop,width:upper.width,height:12000,
    activeFromTick:state.tick+2,activeEvery:72,activeFor:9,damage:1
  });
  state.player.position={x:upper.x+Math.floor(upper.width/2),
    y:cap.y+cap.height-6000+state.player.halfHeight};
  state.player.velocity={x:0,y:-5000};
  state.player.grounded=false;
  state.player.groundedPlatformId=undefined;
  state.player.jumpCharges=0;
  const observation=createTowerObservation(state,{includeHazardWindup:true});
  const jaw=observation.hazards.find(h=>h.id==='f8:rescue-shutter');
  assert.ok(jaw&&!jaw.active&&jaw.chargeTicksRemaining>0&&jaw.chargeTicksRemaining<=6,
    'real source-published crusher countdown must be imminent, not future knowledge');
  assert.ok(nextTowerEarnedCapHop(observation,state.config,lower.id,cap.id),
    'the lower alternate must still lead back to the authentic guardian cap');
  const before=JSON.stringify(state.player),decision=chooseTowerAction(state,observation,{tactical:true});
  assert.equal(decision.intent.targetPlatformId,upper.id,
    'the upper physical platform intercepts ALL legal fall trajectories before the lower shelf');
  assert.match(decision.intent.summary,/no presently clear landing/,
    'unsafe unavoidable collision must not be presented as a safe return');
  assert.equal(decision.action.jump,false);
  assert.equal(decision.action.dash,false);
  assert.equal(decision.action.attack,false);
  assert.equal(decision.action.ability,false);
  assert.equal(JSON.stringify(state.player),before,
    'policy only asks for ordinary source air control and never teleports');
  const next=stepTowerPhysics(state,decision.action).state;
  assert.ok(next.player.position.y<state.player.position.y,
    'the actual 20Hz source physics still owns descent');
});

test('when every reachable return shelf has no observed clear lane, the pilot reports risk rather than inventing safe touchdown',()=>{
  const {state,cap}=episode();
  const shelves=state.chunks[0].platforms.filter(p=>p.id!==cap.id);
  state.player.position={x:cap.x+Math.floor(cap.width/2),
    y:cap.y+cap.height-6000+state.player.halfHeight};
  state.player.velocity={x:0,y:-5000};
  state.player.grounded=false;state.player.groundedPlatformId=undefined;
  state.player.jumpCharges=0;
  // A wide active body would preempt the emergency policy before it can
  // select the shelf; use the genuinely published two-tick warning instead.
  for(const platform of shelves){
    state.chunks[0].hazards.push({
      id:platform.id+':warning',kind:'crusher',x:platform.x,
      y:platform.y+platform.height,width:platform.width,height:12000,
      activeFromTick:state.tick+2,activeEvery:72,activeFor:9,damage:1
    });
  }
  const observed=createTowerObservation(state,{includeHazardWindup:true});
  const decision=chooseTowerAction(state,observed,{tactical:true});
  if(/reachable return shelf/.test(decision.intent.summary)){
    assert.match(decision.intent.summary,/no presently clear landing/,
      'unsafe last-resort target may not be called safe');
    assert.equal(decision.action.jump,false);
  }else{
    assert.doesNotMatch(decision.intent.summary,/clear return lane|clear physical return deck/,
      'if no physical shelf is interceptable, do not fabricate a safe route');
  }
});

test('an imminent partial crusher preserves a physics-reachable clear upper lane and brakes lateral drift',()=>{
  const {state,cap}=episode();
  const upper=state.chunks[0].platforms.find(p=>p.id==='f8:p6');
  assert.ok(upper);
  const center=upper.x+Math.floor(upper.width/2);
  state.chunks[0].hazards.push({
    id:'f8:partial-warning',kind:'crusher',x:center-7000,
    y:upper.y+upper.height,width:14000,height:12000,
    activeFromTick:state.tick+2,activeEvery:72,activeFor:9,damage:1
  });
  state.player.position={x:center-24000,
    y:cap.y+cap.height-6000+state.player.halfHeight};
  state.player.velocity={x:2000,y:-5000};
  state.player.grounded=false;state.player.groundedPlatformId=undefined;
  const before=JSON.stringify(state.player);
  const observed=createTowerObservation(state,{includeHazardWindup:true});
  const d=chooseTowerAction(state,observed,{tactical:true});
  assert.equal(d.intent.targetPlatformId,upper.id);
  assert.match(d.intent.summary,/reachable clear return lane|clear physical return deck/);
  assert.equal(d.action.move,-1,'brake real rightward velocity before it carries the body into the crusher');
  assert.equal(d.action.jump,false);assert.equal(d.action.dash,false);
  assert.equal(JSON.stringify(state.player),before);
});

test('an authentic rising counter-vault beneath the cleared one-way cap stays on the earned route',()=>{
  const {state,cap}=episode();
  const capTop=cap.y+cap.height;
  state.player.position={x:cap.x+Math.floor(cap.width/2),
    y:capTop-6000+state.player.halfHeight};
  state.player.velocity={x:0,y:state.config.jumpImpulse};
  state.player.grounded=false;state.player.groundedPlatformId=undefined;
  state.player.jumpCharges=0;
  const before={...state.player.position},decision=choose(state);
  assert.equal(decision.intent.targetPlatformId,cap.id,
    'the real current jump apex can clear the cap, so no stale combat target');
  assert.match(decision.intent.summary,/rising counter-vault/);
  assert.equal(decision.action.jump,false,'no free midair jump');
  assert.equal(decision.action.dash,false,'no artificial dash');
  assert.equal(decision.action.attack,false);
  assert.deepEqual(state.player.position,before,'no teleport or game-state mutation');
  const next=stepTowerPhysics(state,decision.action).state;
  assert.equal(next.floor,8);
  assert.ok(next.player.position.y>before.y,'source 20Hz upward momentum remains real');
});

test('a low-energy upward recovery uses the next observable lower deck, not an impossible cap flight',()=>{
  const {state,cap,lower}=episode();
  const capTop=cap.y+cap.height;
  state.player.position={x:lower.x+Math.floor(lower.width/2),
    y:capTop-12000+state.player.halfHeight};
  state.player.velocity={x:0,y:1000};
  state.player.grounded=false;state.player.groundedPlatformId=undefined;
  state.player.jumpCharges=0;
  const observation=createTowerObservation(state,{includeHazardWindup:true});
  const decision=chooseTowerAction(state,observation,{tactical:true});
  assert.equal(decision.intent.targetPlatformId,lower.id,
    'the shallow upward arc cannot regain the cap but can physically settle on p6');
  assert.match(decision.intent.summary,/rising return/);
  assert.equal(decision.action.jump,false);
  assert.equal(decision.action.dash,false);
  assert.equal(state.floor,8,'no made-up floor-nine victory');
});

test('a living guardian and an unflagged pilot cannot use defeated-guardian rising recovery',()=>{
  const {state,cap,guardian}=episode();
  state.player.position={x:cap.x+cap.width/2,
    y:cap.y+cap.height-6000+state.player.halfHeight};
  state.player.velocity={x:0,y:state.config.jumpImpulse};
  state.player.grounded=false;state.player.groundedPlatformId=undefined;
  guardian.active=true;guardian.health=guardian.maxHealth;
  assert.doesNotMatch(choose(state).intent.summary,/rising counter-vault|legal rising return/);
  guardian.active=false;guardian.health=0;
  state.config={...state.config,guardianSecondWind:false};
  assert.doesNotMatch(choose(state).intent.summary,/rising counter-vault|legal rising return/);
});
