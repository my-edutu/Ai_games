'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  stepMarblePhysics,
  applyTournamentRules,
  createMarblePresentationSnapshot,
  marbleStateChecksum,
  createMarbleSnapshot,
  restoreMarbleSnapshot,
} = require('../../dist/games/marble-survival/src/index.js');

const PIT = Object.freeze({ id:'reactor-well',kind:'pit',x:10_000,y:7_000,width:2_000,height:2_000 });
const STILL = Object.freeze({marbleId:0,steerX:0,steerY:0,boostPermille:1000,intent:'holding-line',confidence:'high'});

function prepare(seed,kind='pit') {
  const runtime=MarbleRuntime.create({
    rosterSize:2,roundQuotas:[1,1,1,1,1],roundIntroTicks:0,
    frictionPermille:1000,
  },seed);
  const state=structuredClone(runtime.state);
  state.arena.obstacles=[];
  state.arena.bumpers=[];
  state.arena.sweepers=[];
  state.arena.windZones=[];
  state.arena.ramps=[];
  state.arena.hazards=[{...PIT,kind}];
  state.marbles[0].position={x:11_000,y:8_000};
  state.marbles[0].velocity={x:0,y:0};
  state.marbles[0].elevation=0;
  state.marbles[0].verticalVelocity=0;
  state.marbles[0].grounded=true;
  state.marbles[0].shieldCharges=0;
  state.marbles[0].recoveryUntilTick=-1;
  state.marbles[1].position={x:6_000,y:12_000};
  state.marbles[1].velocity={x:0,y:0};
  state.marbles[1].shieldCharges=0;
  return state;
}

function advance(state) {
  const stepped=stepMarblePhysics(state,[STILL]);
  assert.equal(stepped.integrityIssue,undefined);
  return applyTournamentRules(stepped.state,stepped.contacts);
}

test('pit descent visibly crosses y=0 and does not instantly eliminate on entry',()=>{
  let state=prepare('real-pit-fall');
  const elevations=[];
  let fallEvents=0;
  for(let i=0;i<6;i++){
    const result=advance(state);
    fallEvents+=result.events.filter(event=>event.type==='marble-pit-falling').length;
    state=result.state;
    const marble=state.marbles[0];
    assert.equal(marble.status,'active','falling must remain visible until the reactor catches the competitor');
    assert.equal(marble.grounded,false);
    elevations.push(marble.elevation);
    assert.ok(!result.events.some(event=>event.type==='marble-eliminated'));
  }
  assert.equal(elevations[0],0);
  assert.ok(elevations[1]<0,'the first follow-up tick must show a real negative elevation');
  assert.ok(elevations.every((x,i)=>i===0||x<=elevations[i-1]),'pit gravity must move the ball downward');
  assert.equal(fallEvents,1,'an actual first descent should be announced exactly once');
  const publicState=createMarblePresentationSnapshot(state,[]);
  assert.ok(publicState.marbles[0].elevation<0,'real descent must reach spectators, not only the internal solver');
});

test('pit eliminates at terminal depth and emits original pit authority cause',()=>{
  let state=prepare('real-pit-terminal');
  let eliminationEvent=null;
  for(let i=0;i<30;i++){
    const result=advance(state);
    state=result.state;
    eliminationEvent=result.events.find(e=>e.type==='marble-eliminated')||null;
    if(eliminationEvent)break;
  }
  assert.ok(eliminationEvent,'marble must eventually be eliminated after falling');
  assert.equal(eliminationEvent.data.hazardId,'reactor-well');
  assert.equal(eliminationEvent.data.cause,'pit');
  assert.ok(state.marbles[0].elevation<=-500);
  assert.equal(state.marbles[0].status,'eliminated');
});

test('airborne marble really flies above a pit and reaches the other side',()=>{
  let state=prepare('pit-overpass');
  state.marbles[0].elevation=1300;
  state.marbles[0].grounded=false;
  state.marbles[0].verticalVelocity=180;
  state.marbles[0].velocity={x:300,y:0};
  const result=advance(state);
  assert.equal(result.state.marbles[0].status,'active');
  assert.ok(result.state.marbles[0].elevation>1300);
  assert.ok(!result.events.some(e=>e.type==='marble-eliminated'));
  assert.ok(!result.events.some(e=>e.type==='marble-pit-falling'),'flying above the pit must not announce a fall');
});

test('shield can rescue descending marble without teleporting or inventing a second authority outcome',()=>{
  let state=prepare('shielded-pit-fall');
  state.marbles[0].shieldCharges=1;
  let recoveries=0;
  for(let tick=0;tick<8;tick++){
    const result=advance(state);
    state=result.state;
    recoveries+=result.events.filter(e=>e.type==='shield-recovery').length;
    assert.equal(state.marbles[0].status,'active');
    assert.ok(state.marbles[0].elevation>=-900);
  }
  assert.equal(recoveries,1,'shield rescue is a bounded one-off physical intervention');
  assert.equal(state.marbles[0].shieldCharges,0);
});

test('traditional kill-zone remains immediate and unchanged by 3D pit geometry',()=>{
  const state=prepare('old-kill-zone','kill-zone');
  const result=advance(state);
  assert.ok(result.events.some(e=>e.type==='marble-eliminated'&&e.data.cause==='kill-zone'));
});

test('two independently simulated 3D descents produce byte-identical authoritative checksums',()=>{
  let first=prepare('pit-repeatability');
  let second=structuredClone(first);
  for(let tick=0;tick<18;tick++){
    const a=advance(first),b=advance(second);
    assert.equal(marbleStateChecksum(a.state),marbleStateChecksum(b.state),'tick '+tick);
    assert.deepEqual(a.events,b.events,'tick '+tick);
    first=a.state;second=b.state;
    if(first.lifecycle!=='active')break;
  }
});

test('the new descent event reaches the public stream without leaking internal seed or authority',()=>{
  let state=prepare('pit-public-event');
  let events=[];
  for(let i=0;i<4;i++){
    const result=advance(state);
    state=result.state;
    events.push(...result.events);
  }
  const falling=events.find(e=>e.type==='marble-pit-falling');
  assert.ok(falling);
  const visible=createMarblePresentationSnapshot(state,events.map((event,seq)=>({...event,seq})));
  const published=visible.events.find(event=>event.type==='marble-pit-falling');
  assert.ok(published);
  assert.deepEqual(Object.keys(published.data).sort(),['depth','hazardId','marbleId']);
  assert.equal(published.data.hazardId,'reactor-well');
});

test('v4 mid-fall checkpoints replay exactly and reject impossible negative altitudes',()=>{
  const seed='pit-checkpoint-replay';
  const rt=MarbleRuntime.create({
    rosterSize:2,roundQuotas:[1,1,1,1,1],roundIntroTicks:0,frictionPermille:1000,
  },seed);
  rt.state=prepare(seed);
  for(let i=0;i<6;i++)rt.state=advance(rt.state).state;
  assert.ok(rt.state.marbles[0].elevation<0);
  const saved=createMarbleSnapshot(rt);
  assert.equal(saved.deterministicVersion,'marble-physics-v4');
  const restored=restoreMarbleSnapshot(saved);
  assert.equal(marbleStateChecksum(restored.state),marbleStateChecksum(rt.state));

  const invalid=structuredClone(rt.state);
  invalid.marbles[0].position={x:3_000,y:3_000};
  rt.state=invalid;
  const forged=createMarbleSnapshot(rt);
  assert.throws(
    ()=>restoreMarbleSnapshot(forged),
    error=>error&&error.code==='state',
    'negative altitude outside a real pit is an invalid saved state',
  );
});
