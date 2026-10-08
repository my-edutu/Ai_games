'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/volumetric-core.js'),'utf8');
const create=new Function(source.replace('export function','function')+';return createVolumetricCore;')();
test('real 3-axis autonomous climber traverses over 80 floors with bounded state',()=>{
  const sim=create();let minZ=Infinity,maxZ=-Infinity,platformMax=0;
  for(let i=0;i<7200;i++){
    const snapshot=sim.step(1/60);
    minZ=Math.min(minZ,snapshot.player.z);maxZ=Math.max(maxZ,snapshot.player.z);
    platformMax=Math.max(platformMax,snapshot.platforms.length);
    assert.ok(Number.isFinite(snapshot.player.x+snapshot.player.y+snapshot.player.z));
    assert.equal(snapshot.dimensionality,3);
  }
  const result=sim.snapshot();
  assert.ok(result.highestReached>=80,'AI must actually ascend in the simulated world');
  assert.ok(maxZ-minZ>8,'depth axis must be actively traversed');
  assert.ok(platformMax<=24,'streamed world geometry must stay bounded');
  assert.ok(result.player.deaths<4,'route planner should be able to land');
});
test('3-axis navigation is deterministic for the same seed and fixed tick sequence',()=>{
  const a=create(719),b=create(719);
  for(let i=0;i<4200;i++){a.step(1/60);b.step(1/60);}
  assert.deepEqual(a.snapshot(),b.snapshot());
  assert.throws(()=>a.step(.5),RangeError);
  assert.throws(()=>a.step(0),RangeError);
});
