'use strict';
// The opt-in guardian escape is a playable cap traverse, never an invented
// win, forced teleport, replay rewrite or a positive quality vote.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {guardianArenaExitX,guardianArenaClearanceX,guardianArenaSealHeight}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
function arena(overrides={}){
  const runtime=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8,...overrides},
    'earned-physical-cap-passage',{policy:'autonomous'});
  const state=structuredClone(runtime.state),cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const guardian=state.enemies.find(e=>e.kind==='guardian');
  assert.ok(cap&&guardian);
  const p=state.player;
  p.position={x:cap.x+24000,y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=cap.id;p.facing=1;
  guardian.health=0;guardian.active=false;
  state.projectiles=[];state.chunks[0].hazards=[];state.pickups=[];
  runtime.state=state;
  return {runtime,state,cap};
}
test('living upper-cap guardian physically seals the authored walkway until genuine defeat',()=>{
test('source reachability terminates on real cap support for a short climber, not a fictional earlier exit', () => {
  const { analyzeTowerReachability } = require('../../dist/games/infinite-tower-climb/src/generation/solver.js');
  for (const enabled of [true, false]) {
    const { runtime, cap } = arena({ playerHalfHeight: 5000, guardianArenaHazards: enabled });
    const chunk = runtime.state.chunks[0];
    const route = analyzeTowerReachability(chunk, runtime.state.config);
    assert.equal(route.routePlatformIds?.at(-1), cap.id,
      'a supported cap is a reachable exit; the route cannot stop at p5 or p6');
    assert.ok(cap.y + cap.height + runtime.state.player.halfHeight < chunk.exitY,
      'this configuration genuinely needs either a cap jump or earned horizontal exit');
    assert.ok(route.reachablePlatformIds.includes(cap.id));
  }
});

  const {runtime,cap}=arena();
  const guardian=runtime.state.enemies.find(e=>e.kind==='guardian');
  guardian.active=true;guardian.health=4;
  const plane=guardianArenaExitX(cap),p=runtime.state.player;
  const stop=plane-p.halfWidth;
  p.position.x=stop-1200;
  p.velocity.x=5000;
  const locked=runtime.step({move:1});
  assert.equal(locked.floor,8);
  assert.equal(locked.player.position.x,stop,
    'ordinary horizontal physics cannot run through the visibly locked cap seal');
  assert.equal(locked.player.velocity.x,0,'sealed doorway dissipates forward momentum');
  assert.ok(runtime.drainEvents().some(e=>e.type==='contact-wall'&&
    e.data?.entityId==='f8:guardian-seal'),
    'real collision must produce a source contact, not an imaginary HUD warning');
  assert.equal(locked.player.groundedPlatformId,cap.id);

  // Authoritative defeat opens the SAME collision lane; movement still must
  // clear the full trailing edge at ordinary fixed-step speed.
  const fallen=runtime.state.enemies.find(e=>e.kind==='guardian');
  fallen.active=false;fallen.health=0;
  let passage;
  for(let tick=0;tick<24;tick++){
    const before=runtime.state.player.position.x;
    const after=runtime.step({move:1});
    if(after.floor===9){passage={before,after};break;}
  }
  assert.ok(passage,'ordinary post-defeat walking must reach floor nine');
  assert.ok(passage.before>=stop,'exit followed the physical seal release');
  const event=runtime.drainEvents().find(e=>e.type==='floor-complete');
  assert.ok(event?.data?.guardianPassage);
  assert.ok(event.data.guardianPassage.crossingX>=
    guardianArenaClearanceX(cap,p.halfWidth));
});

test('sealed guardian collision holds a jump but does not modify historical physics',()=>{
  const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
  const active=arena();
  const boss=active.runtime.state.enemies.find(e=>e.kind==='guardian');
  boss.active=true;boss.health=4;
  const plane=guardianArenaExitX(active.cap),p=active.runtime.state.player;
  const stop=plane-p.halfWidth;
  p.position.x=stop-1200;p.position.y+=25000;
  p.velocity.x=5000;p.velocity.y=2000;
  p.grounded=false;p.groundedPlatformId=undefined;
  const movement={move:1,jump:false,dash:false,attack:false,ability:false};
  const flight=stepTowerPhysics(active.runtime.state,movement);
  assert.equal(flight.state.player.position.x,stop,
    'jumping through the near-cap guardian lock cannot bypass the seal');
  assert.ok(flight.contacts.some(e=>e.kind==='wall'&&
    e.entityId==='f8:guardian-seal'));
  const legacy=arena({guardianArenaHazards:false});
  const old=legacy.runtime.state.player;
  old.position.x=stop-1200;old.velocity.x=5000;
  legacy.runtime.state.enemies.find(e=>e.kind==='guardian').active=true;
  legacy.runtime.state.enemies.find(e=>e.kind==='guardian').health=4;
  const original=stepTowerPhysics(legacy.runtime.state,movement);
  assert.ok(original.state.player.position.x>stop,
    'frozen unflagged source physics must never receive the new seal collider');
  assert.ok(!original.contacts.some(e=>e.entityId==='f8:guardian-seal'));
});

test('source-bound locked guardian doorway shares its exact physical cap plane',async()=>{
  const {observedLockedGuardianCap}=await import(pathToFileURL(path.resolve(
    __dirname,'../../public/infinite-tower-climb/visuals/guardian-passage.mjs')).href);
  const {createTowerRenderSnapshot}=require(
    '../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
  const {runtime,cap}=arena();
  const guardian=runtime.state.enemies.find(e=>e.kind==='guardian');
  guardian.active=true;guardian.health=4;
  const live=createTowerRenderSnapshot(runtime.state);
  const sealed=observedLockedGuardianCap(live);
  assert.ok(sealed,'real living opt-in guardian must display its cap seal');
  assert.equal(live.guardianExitX,guardianArenaExitX(cap));
  assert.equal(sealed.cap.id,cap.id);
  assert.equal(sealed.guardian.id,guardian.id);
  assert.equal(observedLockedGuardianCap({
    ...live,guardianExitX:undefined
  }),null,'old unflagged snapshots never acquire a fictional cap collider');
  assert.equal(observedLockedGuardianCap({
    ...live,guardianExitX:live.guardianExitX+1
  }),null,'a renderer cannot shift the lock away from authoritative rules');
  assert.equal(observedLockedGuardianCap({
    ...live,enemies:[{...live.enemies.find(e=>e.kind==='guardian'),
      active:false,health:0}]
  }),null,'only a still-living source guardian keeps bronze leaves shut');
  assert.equal(observedLockedGuardianCap({
    ...live,enemies:[]
  }),null,'missing guardian cannot create a permanent invisible wall');
});

test('guardian seal stops an actual dash at a swept physical threshold',()=>{
  const {runtime,cap}=arena();
  const guardian=runtime.state.enemies.find(e=>e.kind==='guardian');
  guardian.active=true;guardian.health=5;
  const stop=guardianArenaExitX(cap)-runtime.state.player.halfWidth;
  runtime.state.player.position.x=stop-200;
  runtime.state.player.velocity.x=1000;
  runtime.state.player.dashCooldown=0;
  runtime.state.player.stamina=runtime.state.player.maxStamina;
  const next=runtime.step({move:1,dash:true});
  assert.equal(next.player.position.x,stop,'dash cannot tunnel through locked gate');
  assert.equal(next.floor,8);
  assert.ok(runtime.drainEvents().some(e=>
    e.type==='contact-wall'&&e.data?.entityId==='f8:guardian-seal'));
});

test('earned gate cannot teleport a hero standing anywhere above exitY',()=>{
  const {runtime,cap}=arena();
  const start=runtime.state.player.position.x;
  const step=runtime.step({move:1});
  assert.equal(step.floor,8);
  assert.ok(step.player.position.x>start&&step.player.position.x<guardianArenaExitX(cap));
  assert.equal(step.stats.floorsCleared,0);
  const absent=runtime.drainEvents().filter(e=>e.type==='floor-complete');
  assert.equal(absent.length,0);
  const plane=guardianArenaExitX(cap);
  const clearance=guardianArenaClearanceX(cap,runtime.state.player.halfWidth);
  assert.equal(clearance,plane+runtime.state.player.halfWidth+4000);
  for(const x of [plane-18000,plane,clearance-1]){
    runtime.state.player.position.x=x;
    runtime.state.player.velocity.x=0;
    const stillOnCap=runtime.step({move:0});
    assert.equal(stillOnCap.floor,8,
      'a center touching the gate is NOT proof the whole body passed through');
    assert.equal(stillOnCap.stats.floorsCleared,0);
  }
  runtime.state.player.position.x=clearance;
  runtime.state.player.velocity.x=0;
  const win=runtime.step({move:0});
  assert.equal(win.floor,9);
  assert.equal(win.stats.floorsCleared,1);
  const event=runtime.drainEvents().find(e=>e.type==='floor-complete');
  assert.deepEqual(event.data.guardianPassage,{
    fromFloor:8,capId:cap.id,guardianId:'f8:guardian',
    exitX:guardianArenaExitX(cap),clearanceX:clearance,
    crossingX:clearance,groundedPlatformId:cap.id
  });
});
test('missing defeated guardian cannot bypass the physically locked cap',()=>{
  const {runtime,cap}=arena();
  runtime.state.player.position.x=guardianArenaClearanceX(cap,runtime.state.player.halfWidth);
  runtime.state.enemies=[];
  const blocked=runtime.step({move:0});
  assert.equal(blocked.floor,8);
  assert.equal(blocked.stats.floorsCleared,0);
  assert.equal(runtime.drainEvents().filter(e=>e.type==='floor-complete').length,0);
});
test('full-body guardian clearance is always inside the real platform footprint',()=>{
  const {state,cap}=arena();
  const clearance=guardianArenaClearanceX(cap,state.player.halfWidth);
  assert.ok(clearance>guardianArenaExitX(cap)+state.player.halfWidth);
  assert.ok(clearance+state.player.halfWidth<cap.x+cap.width);
  assert.throws(()=>guardianArenaClearanceX(cap,NaN),RangeError);
});

test('live tactical climber elects a deterministic source-observed actual exit walk',()=>{
  const {state,cap}=arena();
  const before=JSON.stringify(state);
  const input=createTowerObservation(state,{includeHazardWindup:true});
  const decision=chooseTowerAction(state,input);
  assert.equal(decision.intent.mode,'aligning');
  assert.equal(decision.action.move,1);
  assert.equal(decision.action.jump,false);
  assert.equal(decision.intent.targetPlatformId,cap.id);
  assert.match(decision.intent.summary,/physical guardian passage/);
  assert.equal(JSON.stringify(state),before);
  assert.deepEqual(decision,chooseTowerAction(state,input));
  // The door's center cannot be a stop zone: the pilot must keep walking
  // while its trailing edge remains in FRONT of the actual bronze arch.
  state.player.position.x=guardianArenaExitX(cap)+state.player.halfWidth;
  state.player.velocity.x=0;
  const almost=createTowerObservation(state,{includeHazardWindup:true});
  assert.equal(chooseTowerAction(state,almost).action.move,1);
});

test('autonomous guardian victory requires a grounded real full-silhouette crossing',()=>{
  const {runtime,cap}=arena();
  const clearance=guardianArenaClearanceX(cap,runtime.state.player.halfWidth);
  let floorChange=null;
  for(let i=0;i<100;i++){
    const prior=runtime.state;
    const observed=runtime.step();
    if(observed.floor===9){floorChange={prior,observed};break;}
  }
  assert.ok(floorChange,'autonomous source policy must actually complete the earned walk');
  assert.ok(floorChange.prior.player.grounded);
  assert.equal(floorChange.prior.player.groundedPlatformId,cap.id);
  // The action's fixed-step physics crosses the plane before authority
  // advances. No timed victory, camera pose, or 3D mesh causes this event.
  const events=runtime.drainEvents().filter(event=>event.type==='floor-complete');
  assert.equal(events.length,1);
  assert.equal(events[0].data.floor,9);
  assert.ok(events[0].data.guardianPassage?.crossingX>=clearance);
  assert.equal(events[0].data.guardianPassage?.groundedPlatformId,cap.id);
  assert.ok(clearance>guardianArenaExitX(cap));
});
test('historical gates, non-guardian floors and airborne players do not receive a free source exit',()=>{
  const {runtime,cap}=arena({guardianArenaHazards:false});
  const old=runtime.step({move:0});
  assert.equal(old.floor,9,'unflagged legacy remains immediate');
  const {runtime:live}=arena();
  live.state.player.position.x=guardianArenaExitX(cap);
  live.state.player.grounded=false;
  live.state.player.groundedPlatformId=undefined;
  live.state.player.position.y+=9000;
  live.state.player.velocity.y=6000;
  const jump=live.step({move:0});
  assert.equal(jump.floor,8,'the portal requires real cap contact');
});
test('a real post-defeat clearance has a stable 3D gate anchor and passage source',async()=>{
  const coords=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const passage=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/guardian-passage.mjs')).href);
  const {state,cap}=arena();
  const snapshot={platforms:state.chunks[0].platforms,enemies:[{
    kind:'guardian',active:false,health:0,halfHeight:18000,
    y:cap.y+cap.height+18000,x:cap.x+cap.width/2}]};
  assert.equal(coords.guardianGateAnchorX(snapshot,cap),guardianArenaExitX(cap));
  assert.equal(passage.observedGuardianPassage({
    runToken:'same',tick:100,floor:8,lifecycle:'running',enemies:snapshot.enemies
  },{runToken:'same',tick:101,floor:9,lifecycle:'running'}),true);
  assert.equal(passage.observedGuardianPassage({
    runToken:'same',tick:100,floor:8,lifecycle:'running',
    enemies:[{kind:'guardian',active:false,health:1}]
  },{runToken:'same',tick:101,floor:9,lifecycle:'running'}),false);
});

test('defeated guardian opens the source-authentic 3D doorway before earned floor exit', async () => {
  const passage=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/guardian-passage.mjs')).href);
  const {state,cap}=arena();
  const base={
    runToken:'observed-cap-clearance',tick:121,floor:8,lifecycle:'running',
    chunkBaseY:state.chunks[0].baseY,worldWidth:state.config.worldWidth,
    player:{health:2},platforms:[cap],guardianExitX:guardianArenaExitX(cap),
    enemies:[{id:'f8:boss',kind:'guardian',active:false,health:0,
      x:cap.x+cap.width/2,y:cap.y+cap.height+18000,halfHeight:18000}],
  };
  const unlock=passage.observedUnlockedGuardianCap(base);
  assert.equal(unlock.cap.id,cap.id);
  assert.equal(unlock.guardianId,'f8:boss');
  assert.equal(unlock.floor,8,'the guardian is dead but the floor remains active');
  assert.equal(passage.observedUnlockedGuardianCap({
    ...base,enemies:[{...base.enemies[0],active:true,health:1}]
  }),null,'a living guardian cannot display an unearned open gate');
  assert.equal(passage.observedUnlockedGuardianCap({...base,player:{health:0}}),
    null,'a dead climber cannot trigger the living clearance stage');
  assert.equal(passage.observedUnlockedGuardianCap({
    ...base,platforms:[{...cap,width:NaN}]
  }),null,'invalid scene geometry cannot create a fictional gate');
  assert.equal(passage.observedUnlockedGuardianCap({...base,lifecycle:'result'}),
    null,'a result screen cannot resurrect an old portal');
  assert.equal(passage.observedUnlockedGuardianCap({
    ...base,enemies:[{...base.enemies[0],active:false,health:1}]
  }),null,'inactivity alone is not a witnessed guardian defeat');
  assert.deepEqual(passage.observedUnlockedGuardianCap(base),unlock,
    'same immutable source snapshot creates a deterministic stage');
});

test('short supported climber can earn floor nine while its real cap center is below the old vertical exitY', () => {
  // The legal minimum player half-height is 5,000. The cap top is only
  // 16,000 below chunk ceiling, whereas exitY is 8,000 below ceiling.
  // A physically grounded 5,000-high center remains 3,000 below exitY:
  // an unconditional Y gate made whole-body doorway clearance impossible.
  const { runtime, cap } = arena({ playerHalfHeight: 5000 });
  const p = runtime.state.player;
  const clearance = guardianArenaClearanceX(cap, p.halfWidth);
  assert.ok(cap.y + cap.height + p.halfHeight < runtime.state.chunks[0].exitY,
    'reproduce a source-supported yet vertically unreachable legitimate exit');
  p.position.x = clearance - 1000;
  const before = runtime.step({ move: 0 });
  assert.equal(before.floor, 8, 'standing short of the actual trailing-edge clearance never wins');
  assert.equal(before.player.groundedPlatformId, cap.id);
  runtime.state.player.position.x = clearance;
  runtime.state.player.velocity.x = 0;
  const after = runtime.step({ move: 0 });
  assert.equal(after.floor, 9, 'grounded physical crossing must advance independently of actor height');
  const event = runtime.drainEvents().find(e => e.type === 'floor-complete');
  assert.equal(event?.data?.guardianPassage?.capId, cap.id);
  assert.equal(event?.data?.guardianPassage?.crossingX, clearance);
  assert.equal(event?.data?.guardianPassage?.groundedPlatformId, cap.id);
});

test('short-rig physical exit never bypasses living, missing or airborne guardian gate', () => {
  const clearanceOf = data => guardianArenaClearanceX(data.cap, data.runtime.state.player.halfWidth);
  const alive = arena({ playerHalfHeight: 5000 });
  alive.runtime.state.player.position.x = clearanceOf(alive);
  const guardian = alive.runtime.state.enemies.find(e => e.kind === 'guardian');
  guardian.active = true;
  guardian.health = 4;
  assert.equal(alive.runtime.step({ move: 0 }).floor, 8,
    'a living guardian must still lock the low-centered cap');
  const absent = arena({ playerHalfHeight: 5000 });
  absent.runtime.state.player.position.x = clearanceOf(absent);
  absent.runtime.state.enemies = [];
  assert.equal(absent.runtime.step({ move: 0 }).floor, 8,
    'an absent guardian is not a defeated guardian');
  const airborne = arena({ playerHalfHeight: 5000 });
  const p = airborne.runtime.state.player;
  p.position.x = clearanceOf(airborne);
  p.position.y += 50000;
  p.velocity.y = 2000;
  p.grounded = false;
  p.groundedPlatformId = undefined;
  assert.equal(airborne.runtime.step({ move: 0 }).floor, 8,
    'even an above-exitY body cannot win before source-grounded passage');
  const legacy = arena({ playerHalfHeight: 5000, guardianArenaHazards: false });
  legacy.runtime.state.player.position.x = clearanceOf(legacy);
  assert.ok(legacy.runtime.state.player.position.y < legacy.runtime.state.chunks[0].exitY);
  assert.equal(legacy.runtime.step({ move: 0 }).floor, 8,
    'the frozen unflagged vertical exit requirement is not changed');
});

test('living guardian seal blocks diagonal rising and falling crossings on the SAME fixed tick', () => {
  const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
  for (const phase of ['rising','falling']) {
    const {runtime,cap}=arena();
    const guardian=runtime.state.enemies.find(e=>e.kind==='guardian');
    guardian.active=true;guardian.health=4;
    const p=runtime.state.player,top=cap.y+cap.height;
    const stop=guardianArenaExitX(cap)-p.halfWidth;
    p.position.x=stop-1200;
    p.velocity.x=6000;
    p.grounded=false;p.groundedPlatformId=undefined;
    if (phase==='rising') {
      // The previous Y is BELOW the visible lattice, but the same jump
      // reaches its volume while the front edge crosses the lock plane.
      p.position.y=top-p.halfHeight-800;
      p.velocity.y=0;p.jumpCharges=1;
    } else {
      // The previous Y is ABOVE its top, and a genuine falling fixed tick
      // intersects the same obstacle from above.
      p.position.y=top+140000+p.halfHeight+800;
      p.velocity.y=-20000;
    }
    const out=stepTowerPhysics(runtime.state,{
      move:1,jump:phase==='rising',dash:false,attack:false,ability:false
    });
    assert.equal(out.state.player.position.x,stop,
      phase+' cannot phase across the guardian seal between Y samples');
    assert.equal(out.state.player.velocity.x,0);
    assert.ok(out.contacts.some(c=>c.kind==='wall'&&
      c.entityId==='f8:guardian-seal'),phase+' must be a real source contact');
  }
});

test('living gate resolves partial overlap but never teleports a fully far-side climber', () => {
  const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
  const {runtime,cap}=arena();
  const boss=runtime.state.enemies.find(e=>e.kind==='guardian');
  boss.active=true;boss.health=5;
  const p=runtime.state.player,plane=guardianArenaExitX(cap);
  const stop=plane-p.halfWidth;
  p.position.x=stop+3500;p.velocity.x=6000;
  const advance={move:1,jump:false,dash:false,attack:false,ability:false};
  const contained=stepTowerPhysics(runtime.state,advance);
  assert.equal(contained.state.player.position.x,stop,
    'an overlap cannot advance through a still-solid threshold');
  assert.ok(contained.contacts.some(c=>c.entityId==='f8:guardian-seal'));
  p.position.x=plane+p.halfWidth+2000;
  const farSide=stepTowerPhysics(runtime.state,advance);
  assert.ok(farSide.state.player.position.x>plane+p.halfWidth,
    'the collider must not teleport an already far-side state backwards');
});

test('swept guardian lock does not invent a below-cap wall or rewrite legacy jump physics', () => {
  const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
  for (const legacy of [false,true]) {
    const {runtime,cap}=arena(legacy?{guardianArenaHazards:false}:{});
    const boss=runtime.state.enemies.find(e=>e.kind==='guardian');
    boss.active=true;boss.health=4;
    const p=runtime.state.player,stop=guardianArenaExitX(cap)-p.halfWidth;
    p.position.x=stop-1200;p.velocity.x=6000;
    p.grounded=false;p.groundedPlatformId=undefined;
    p.position.y=cap.y+cap.height-p.halfHeight-800;
    p.velocity.y=0;p.jumpCharges=1;
    const result=stepTowerPhysics(runtime.state,{
      move:1,jump:false,dash:false,attack:false,ability:false
    });
    if (legacy) {
      assert.ok(result.state.player.position.x>stop,
        'historical opt-out never acquires the new guardian collider');
    } else {
      // Without a jump the body remains WELL below the visual lock volume:
      // lower route movement must not be stopped by a fictitious full-tower wall.
      assert.ok(result.state.player.position.x>stop,
        'an under-cap, non-rising path must remain physically traversable');
    }
    assert.ok(!result.contacts.some(c=>c.entityId==='f8:guardian-seal'));
  }
});

test('real maximum double-jump cannot vault a still-living guardian energy gate',()=>{
  const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
  let {runtime,cap}=arena();
  const guardian=runtime.state.enemies.find(e=>e.kind==='guardian');
  guardian.active=true;guardian.health=4;
  const stop=guardianArenaExitX(cap)-runtime.state.player.halfWidth;
  runtime.state.player.position.x=stop-1200;
  let state=runtime.state,secondJump=false,highestHead=-Infinity;
  for(let i=0;i<42;i++){
    const leap=i===0||(!secondJump&&!state.player.grounded&&state.player.velocity.y<=0);
    if(leap&&i>0)secondJump=true;
    const out=stepTowerPhysics(state,{move:0,jump:leap,dash:false,attack:false,ability:false});
    state=out.state;state.tick++;
    highestHead=Math.max(highestHead,state.player.position.y+state.player.halfHeight);
  }
  assert.ok(secondJump,'the test must use the real airborne second jump');
  const capTop=cap.y+cap.height;
  assert.ok(highestHead>capTop+140000,
    'the former fixed-size seal was genuinely vaultable');
  assert.ok(highestHead<capTop+guardianArenaSealHeight(state.config),
    'new source-authoritative seal must cover the actual maximum jump envelope');
  // An already-airborne climber at its source-observed apex cannot cross
  // with an ordinary run/dash: collision and visual seal height agree.
  state.player.position.y=highestHead-state.player.halfHeight;
  state.player.position.x=stop-1200;
  state.player.velocity.x=6500;
  const blocked=stepTowerPhysics(state,{move:1,jump:false,dash:false,attack:false,ability:false});
  assert.equal(blocked.state.player.position.x,stop);
  assert.ok(blocked.contacts.some(c=>c.entityId==='f8:guardian-seal'));
  const snapshot=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js')
    .createTowerRenderSnapshot(state);
  assert.equal(snapshot.guardianSealHeight,guardianArenaSealHeight(state.config));
  const legacy=arena({guardianArenaHazards:false});
  assert.equal(require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js')
    .createTowerRenderSnapshot(legacy.runtime.state).guardianSealHeight,undefined);
});

test('guardian seal scales safely with the full legal jump configuration',()=>{
  const normal=arena();
  const high=arena({jumpImpulse:40000,gravity:100,playerHalfHeight:40000});
  const sourceHeight=guardianArenaSealHeight(normal.runtime.state.config);
  assert.ok(sourceHeight>140000);
  assert.ok(guardianArenaSealHeight(high.runtime.state.config)>sourceHeight);
  assert.ok(Number.isSafeInteger(guardianArenaSealHeight(high.runtime.state.config)));
});
