'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helper=import('../../public/infinite-tower-climb/visuals/source-submitted-doorway-cadence.mjs');

test('old gateway spends real bounded returned-render intervals, not only clamped RAF dt',async()=>{
  const {sourceReturnedGatewayDisplayDt:step}=await helper;
  let last=null, earned=0;
  for(let i=0;i<16;i++){
    const completed=1000+i*100;
    const d=step(.016,last,completed);
    assert.ok(d>=.016 && d<=.1+1e-12);
    earned+=d;last=completed;
  }
  assert.ok(earned>1.2,
    '16 actual 100ms WebGL returns must earn a complete original 1.22s paint lease');
  assert.ok(earned<1.6,
    'never credit unreturned wall time');
  assert.equal(step(.016,null,1000),.016,
    'first completed render cannot claim an unseen preceding interval');
});

test('multi-second blocked renderer is worth only one capped returned interval',async()=>{
  const {sourceReturnedGatewayDisplayDt:step}=await helper;
  assert.equal(step(.016,1000,11000),.1);
  assert.equal(step(.5,1000,11000),.1);
  assert.equal(step(.04,5000,5010),.04);
  assert.equal(step(0,5000,5000),0);
  assert.equal(step(.016,5000,4900),.016);
  assert.equal(step(.016,undefined,7000),.016);
  assert.equal(step(.016,NaN,7000),.016);
  assert.equal(step(-1,5000,5050),.05);
});

test('the same returned-frame clock is committed only to original-source owners',()=>{
  const world=fs.readFileSync(path.join(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/function noteFrameSubmitted\(snapshot, options=\{\}, renderedDt=0\)/);
  assert.match(world,/completedReturnMs=performance\.now\(\)/);
  assert.match(world,/renderedDt,held\.lastCompletedReturnMs,completedReturnMs/);
  assert.match(world,/held\.visibleSeconds=Math\.min\(3,held\.visibleSeconds\+returnedGatewayStep\)/);
  assert.match(world,/renderedDt,bearingHandoff\.lastCompletedReturnMs,completedReturnMs/);
  assert.match(world,/retireEarnedCap\(\)/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|state)\s*=/);
});
