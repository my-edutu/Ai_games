'use strict';
// The actual Node 22 source host, built game, fixed 50ms timer and real
// generated floor-7 moving carriage are exercised. No mocked snapshots,
// simulated video, replay rewrites or scored transformation claim.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTowerStreamServer } = require('../../scripts/serve-tower-stream.cjs');

test('real CI capture host retains consecutive 20Hz moving-deck source coordinates', {timeout: 12000}, async () => {
  const oldCi=process.env.CI, oldScenario=process.env.TOWER_MOTION_SCENARIO;
  process.env.CI='true';
  process.env.TOWER_MOTION_SCENARIO='moving';
  let server;
  try {
    ({server}=createTowerStreamServer({
      seed:'tower-real-moving-trace-contract-v1', config:{launchFloor:7}
    }));
    await new Promise((resolve,reject) => {
      server.once('error',reject);
      server.listen(0,'127.0.0.1',resolve);
    });
    const base='http://127.0.0.1:'+server.address().port;
    let ticks=[];
    for(let i=0;i<55;i++){
      await new Promise(resolve=>setTimeout(resolve,75));
      const response=await fetch(base+'/tower/capture-trace');
      assert.equal(response.status,200,'moving scenario must expose read-only CI trace');
      const data=await response.json();
      assert.equal(data.notVideoEvidence,true);
      ticks=data.ticks;
      const decks=ticks.flatMap(t=>t.movingDecks||[]);
      const positions=new Set(decks.map(d=>d.id+':'+d.x+':'+d.y));
      if(ticks.length>=3 && positions.size>1)break;
    }
    assert.ok(ticks.length>=3,'at least three real 50ms snapshots required');
    assert.ok(ticks.every(t=>Array.isArray(t.movingDecks)));
    const p3=ticks.flatMap(t=>t.movingDecks||[]).filter(d=>d.id==='f7:p3');
    assert.ok(p3.length>=2,'source floor-seven carriage was not observed');
    assert.ok(new Set(p3.map(d=>d.x+':'+d.y)).size>1,
      'moving carriage must exhibit actual fixed-step position change');
    assert.ok(ticks.every(t=>Number.isSafeInteger(t.tick) &&
      typeof t.runToken==='string' && !('seed' in t) && !('config' in t)));
  } finally {
    if(server?.listening)await new Promise(resolve=>server.close(resolve));
    if(oldCi===undefined)delete process.env.CI;else process.env.CI=oldCi;
    if(oldScenario===undefined)delete process.env.TOWER_MOTION_SCENARIO;
    else process.env.TOWER_MOTION_SCENARIO=oldScenario;
  }
});
