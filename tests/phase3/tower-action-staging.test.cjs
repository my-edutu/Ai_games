const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const stage = import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/action-staging.mjs')).href);
const frame = () => ({
  lifecycle:'running',runToken:'s1',tick:45,floor:3,chunkBaseY:1080000,
  worldWidth:490000,player:{x:240000,y:1280000,health:5,attacking:false},
  enemies:[],hazards:[],intent:{mode:'aligning',targetPlatformId:'f3:platform2'},
});
test('light director uses only current live source subjects, never a phantom encounter',async()=>{
  const { observedActionStage } = await stage;
  const s=frame(), deck={id:'f3:platform2',x:210000,y:1300000,width:65000,height:8000};
  assert.deepEqual(observedActionStage(s,deck),{kind:'landing',x:240000,y:1308000,sourceTick:45,sourceId:deck.id});
  assert.equal(observedActionStage({...s,lifecycle:'result'},deck),null);
  assert.equal(observedActionStage({...s,player:{...s.player,health:0}},deck),null);
  assert.equal(observedActionStage({...s,tick:Infinity},deck),null);
  assert.equal(observedActionStage({...s,runToken:''},deck),null);
  assert.equal(observedActionStage({...s,intent:{mode:'aligning',targetPlatformId:'other'}},deck)?.kind,'climber');
});
test('true source guardian and trap take light priority without faking collisions or future danger',async()=>{
  const { observedActionStage }=await stage; const s=frame();
  const guardian={id:'guardian',kind:'guardian',active:true,
    x:260000,y:1280000,health:6,maxHealth:8,telegraph:false};
  const hazard={id:'shutter',x:220000,y:1260000,width:28000,height:9000,
    active:true,chargeTicksRemaining:0};
  s.enemies=[guardian];s.hazards=[hazard];
  assert.equal(observedActionStage(s)?.kind,'guardian');
  s.enemies=[{...guardian,health:8,telegraph:false}];
  assert.equal(observedActionStage(s)?.kind,'hazard');
  s.hazards=[{...hazard,active:false,chargeTicksRemaining:9}];
  assert.equal(observedActionStage(s)?.kind,'climber');
  s.intent.mode='evading-hazard';
  assert.equal(observedActionStage(s)?.kind,'hazard');
  s.hazards=[{...hazard,x:1000,active:true,chargeTicksRemaining:0}];
  assert.equal(observedActionStage(s)?.kind,'climber');
});


test('physical near-contact shutter takes urgent 3D light priority over guardian without phantom hits',async()=>{
  const { observedActionStage }=await stage;
  const base=frame(), snap={...base,
    player:{...base.player,halfWidth:9000,halfHeight:14000},
    intent:{mode:'evading-hazard'},
    enemies:[{id:'live-guardian',kind:'guardian',active:true,
      x:260000,y:1280000,health:6,maxHealth:8,telegraph:true}],
    hazards:[{id:'contact-shutter',x:226000,y:1273000,width:28000,
      height:9000,active:true,chargeTicksRemaining:0}]};
  const before=JSON.stringify(snap);
  assert.deepEqual(observedActionStage(snap),{kind:'hazard',x:240000,
    y:1277500,sourceTick:45,sourceId:'contact-shutter'});
  assert.equal(JSON.stringify(snap),before,'light direction may not mutate authoritative snapshots');
  assert.equal(observedActionStage({...snap,hazards:[{...snap.hazards[0],x:50000}]}).kind,'guardian');
  const inactive={...snap,hazards:[{...snap.hazards[0],active:false,chargeTicksRemaining:11}]};
  assert.equal(observedActionStage(inactive).kind,'guardian','early warnings cannot override a fight');
  assert.equal(observedActionStage({...inactive,hazards:[{...inactive.hazards[0],chargeTicksRemaining:5}]}).kind,'hazard');
  assert.equal(observedActionStage({...inactive,intent:{mode:'aligning'},hazards:[{...inactive.hazards[0],chargeTicksRemaining:5}]}).kind,'guardian');
  assert.equal(observedActionStage({...snap,stale:true}),null);
  assert.equal(observedActionStage({...snap,player:{...snap.player,health:0}}),null);
});

test('earned guardian defeat lights the exact physical gate, never a phantom victory',async()=>{
  const {observedActionStage}=await stage;
  const f=frame();
  const cap={id:'f3:cap',x:210000,y:1300000,width:65000,height:8000};
  const fallen={id:'f3:guardian',kind:'guardian',active:false,health:0,
    maxHealth:8,x:221000,y:1325000,halfHeight:18000};
  const snapshot={...f,platforms:[cap],enemies:[fallen],
    intent:{mode:'aligning',targetPlatformId:'f3:cap'}};
  const original=JSON.stringify(snapshot);
  const actual=observedActionStage(snapshot,cap);
  assert.equal(actual?.kind,'earned-gate');
  assert.equal(actual.sourceId,'f3:cap');
  assert.equal(actual.sourceTick,45);
  assert.equal(JSON.stringify(snapshot),original,'source snapshot must remain immutable');
  assert.notEqual(observedActionStage({...snapshot,
    enemies:[{...fallen,health:1,active:true}]},cap)?.kind,'earned-gate',
    'living guardian cannot claim that gate has been earned');
  assert.notEqual(observedActionStage({...snapshot,
    platforms:[{...cap,id:'f3:wrong'}]},cap)?.kind,'earned-gate',
    'unknown cap cannot trigger victory light');
  assert.notEqual(observedActionStage({...snapshot,lifecycle:'intermission'},cap)?.kind,'earned-gate');
  const shutter={id:'near-shutter',x:230000,y:1275000,width:23000,height:13000,
    active:true,chargeTicksRemaining:0};
  assert.equal(observedActionStage({...snapshot,hazards:[shutter],
    player:{...snapshot.player,halfWidth:9000,halfHeight:14000}},cap)?.kind,'hazard',
    'imminent collision must outrank celebratory exit illumination');
});
