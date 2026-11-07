'use strict';
// A source-earned physical gateway must not relocate the climber from the
// right-hand bronze exit to the far-left floor-nine spawn in a single 20Hz
// tick. This is a real gameplay continuity contract, not a camera illusion.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {guardianArenaClearanceX}=require(
  '../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const action={move:0,jump:false,dash:false,attack:false,ability:false};

function earnedExit() {
  const runtime=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8,
    maxTicks:3500,noProgressTicks:1800},'real-gateway-floor-nine-continuity',
    {policy:'autonomous'});
  const current=runtime.state.chunks.find(c=>c.floor===8);
  const cap=current.platforms.find(p=>p.id==='f8:cap');
  const guardian=runtime.state.enemies.find(e=>e.floor===8&&e.kind==='guardian');
  assert.ok(cap&&guardian);
  const player=runtime.state.player;
  guardian.health=0;guardian.active=false;
  runtime.state.projectiles=[];
  current.hazards=[];
  runtime.state.pickups=[];
  player.position={x:guardianArenaClearanceX(cap,player.halfWidth)-2500,
    y:cap.y+cap.height+player.halfHeight};
  player.grounded=true;player.groundedPlatformId=cap.id;
  player.velocity={x:4500,y:0};player.facing=1;player.state='standing';
  return {runtime,cap};
}

test('earned physical cap crossing arrives on floor nine at the same world X and keeps a real rightward stride',()=>{
  const {runtime,cap}=earnedExit();
  const result=runtime.step({...action,move:1});
  assert.equal(result.floor,9,'real physics must first clear the earned gate');
  const complete=runtime.drainEvents().find(e=>e.type==='floor-complete');
  assert.ok(complete?.data?.guardianPassage);
  const crossingX=complete.data.guardianPassage.crossingX;
  assert.ok(crossingX>=guardianArenaClearanceX(cap,result.player.halfWidth));
  assert.equal(result.player.position.x,crossingX,
    'changing floors cannot silently teleport hero across the world width');
  assert.ok(result.player.position.x>result.config.worldWidth/2,
    'the tested source exit is on the physically rightward side');
  assert.equal(result.player.checkpoint.x,crossingX);
  assert.equal(result.player.velocity.x,Math.min(
    result.config.maxRunSpeed,4500+result.config.moveAcceleration),
    'earned walk should not abruptly discard its safe horizontal momentum');
  const next=result.chunks.find(c=>c.floor===9);
  const ground=next.platforms.find(p=>p.id==='f9:ground');
  assert.ok(ground);
  assert.equal(result.player.position.y-result.player.halfHeight,
    ground.y+ground.height,'arrival body must stand on actual next-floor geometry');
  assert.equal(result.player.grounded,true);
  assert.equal(result.player.groundedPlatformId,ground.id);
  assert.equal(complete.data.gatewayArrivalX,crossingX,
    'floor-change source event must identify actual arrival position');
});

test('ordinary non-guardian floor progression retains frozen spawn and zero horizontal motion',()=>{
  const runtime=TowerRuntime.create({maxTicks:3500,noProgressTicks:1800,
    guardianArenaHazards:false,guardianSecondWind:false},'ordinary-next-floor');
  const first=runtime.state.chunks[0];
  runtime.state.player.position.y=first.exitY+30000;
  runtime.state.player.position.x=330000;
  runtime.state.player.velocity={x:7000,y:0};
  const result=runtime.step(action);
  assert.equal(result.floor,1);
  const next=result.chunks.find(c=>c.floor===1);
  assert.equal(result.player.position.x,next.spawn.x);
  assert.equal(result.player.velocity.x,0);
  assert.equal(result.player.grounded,false);
  assert.equal(result.player.groundedPlatformId,undefined);
  assert.equal(runtime.drainEvents().find(e=>e.type==='floor-complete')?.data?.gatewayArrivalX,
    undefined,'ordinary floor completion never invents a guardian passage');
});

test('a missing or still-living guardian cannot activate next-floor continuity',()=>{
  for(const kind of ['missing','living']){
    const {runtime}=earnedExit();
    const guardian=runtime.state.enemies.find(e=>e.kind==='guardian');
    if(kind==='missing')runtime.state.enemies=[];
    else{guardian.active=true;guardian.health=4;}
    const result=runtime.step({...action,move:1});
    assert.equal(result.floor,8,kind+' guardian cannot award an exit');
    assert.equal(runtime.drainEvents().filter(e=>e.type==='floor-complete').length,0);
  }
});
