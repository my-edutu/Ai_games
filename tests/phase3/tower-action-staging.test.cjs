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
