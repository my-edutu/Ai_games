'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const ant=require('../../dist/games/ai-ant-colony/src/index.js');

const SOAK_TICKS=5000;
const config={
  width:64,height:40,surfaceRow:9,targetPopulation:180,initialWorkers:48,maxAnts:360,
  tickRate:10,intermissionTicks:35,strategyInterval:20,dayLengthTicks:500,seasonLengthTicks:2000,
  initialFood:180,initialWater:140,queenHealth:100,broodInterval:38,eggHatchTicks:24,
  larvaTicks:30,pupaTicks:26,foodPatchCount:12,foodRegrowInterval:60,foodRegrowAmount:4,
  predatorCap:5,predatorSpawnInterval:260,predatorDamage:5,soldierDamage:16,
  antMetabolismInterval:28,stuckRecoveryTicks:8,pheromoneDecay:1,pheromoneDeposit:14,
  tunnelCapacity:8,noProgressTicks:5000,profile:'forest'
};

test('5000-tick accelerated soak stays deterministic, bounded and presentation-safe',()=>{
  const a=ant.AntColonyRuntime.create(config,'ant-long-soak');
  const b=ant.AntColonyRuntime.create(config,'ant-long-soak');
  let maxAnts=0,maxPredators=0,maxEventBurst=0,maxSnapshotBytes=0,restarts=0;
  let previousRun=a.state.runIndex;

  for(let tick=0;tick<SOAK_TICKS;tick++){
    a.step();
    b.step();
    assert.equal(ant.stateChecksum(a.state),ant.stateChecksum(b.state),`determinism diverged at soak tick ${tick}`);
    maxAnts=Math.max(maxAnts,a.state.ants.length);
    maxPredators=Math.max(maxPredators,a.state.predators.length);
    assert.ok(a.state.ants.length<=a.config.maxAnts,'ant population exceeded configured cap');
    assert.ok(a.state.predators.length<=a.config.predatorCap,'predator population exceeded configured cap');
    if(a.state.runIndex!==previousRun){restarts++;previousRun=a.state.runIndex}

    const eventsA=a.drainEvents();
    const eventsB=b.drainEvents();
    assert.deepEqual(eventsA,eventsB,`event stream diverged at soak tick ${tick}`);
    maxEventBurst=Math.max(maxEventBurst,eventsA.length);

    if(tick%100===0||tick===SOAK_TICKS-1){
      const frame=ant.createAntRenderSnapshot(a.state,eventsA);
      const encoded=JSON.stringify(frame);
      maxSnapshotBytes=Math.max(maxSnapshotBytes,Buffer.byteLength(encoded));
      assert.equal(frame.ants.length,a.state.ants.length);
      assert.equal(frame.predators.length,a.state.predators.length);
      assert.equal(encoded.includes('"seed"'),false);
      assert.equal(encoded.includes('appliedIds'),false);
      assert.equal(encoded.includes('lastCell'),false);
      assert.equal(encoded.includes('scheduledTick'),false);
      assert.ok(Buffer.byteLength(encoded)<2_000_000,'public snapshot grew beyond bounded stream budget');
    }
  }

  assert.equal(ant.stateChecksum(a.state),ant.stateChecksum(b.state));
  assert.ok(maxAnts<=config.maxAnts);
  assert.ok(maxPredators<=config.predatorCap);
  assert.ok(maxEventBurst<10_000);
  assert.ok(maxSnapshotBytes>0);
  process.stdout.write(`${JSON.stringify({kind:'ant-long-session-soak',ticks:SOAK_TICKS,simulatedSeconds:SOAK_TICKS/config.tickRate,maxAnts,maxPredators,maxEventBurst,maxSnapshotBytes,restarts,finalRunIndex:a.state.runIndex,finalTick:a.state.tick})}\n`);
});
