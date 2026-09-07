'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {
  NamedRng,
  parseMarbleConfig,
  createMarbleRoster,
  generateMarbleArena,
  validateMarbleArena
}=require('../../dist/games/marble-survival/src/index.js');

test('configuration rejects unsafe physical and tournament bounds',()=>{
  const config=parseMarbleConfig({});
  assert.equal(config.rosterSize,32);
  assert.equal(config.tickRate,60);
  assert.deepEqual(config.roundQuotas,[16,8,4,2,1]);
  assert.throws(()=>parseMarbleConfig({rosterSize:1}),/rosterSize/);
  assert.throws(()=>parseMarbleConfig({marbleRadius:0}),/marbleRadius/);
  assert.throws(()=>parseMarbleConfig({maxContactsPerTick:4}),/maxContactsPerTick/);
  assert.throws(()=>parseMarbleConfig({roundQuotas:[16,9,4,2,1]}),/roundQuotas/);
});

test('same seed produces the same unique personality roster',()=>{
  const config=parseMarbleConfig({rosterSize:32});
  const a=createMarbleRoster(config,NamedRng.fromSeed('roster-seed'));
  const b=createMarbleRoster(config,NamedRng.fromSeed('roster-seed'));
  assert.deepEqual(a,b);
  assert.equal(new Set(a.map(m=>m.id)).size,32);
  assert.equal(new Set(a.map(m=>m.number)).size,32);
  assert.equal(new Set(a.map(m=>m.name)).size,32);
  assert.deepEqual(new Set(a.map(m=>m.archetype)),new Set(['navigator','sprinter','bruiser','survivor']));
  for(const marble of a){
    assert.ok(marble.traits.acceleration>=12&&marble.traits.acceleration<=36);
    assert.ok(marble.traits.topSpeed>=150&&marble.traits.topSpeed<=360);
    assert.ok(['dots','chevron','ring','split'].includes(marble.pattern));
  }
});

test('constructive arenas are deterministic, valid, bounded, and preserve safe lanes',()=>{
  const config=parseMarbleConfig({rosterSize:32});
  for(let roundIndex=0;roundIndex<5;roundIndex++){
    const a=generateMarbleArena(config,roundIndex,NamedRng.fromSeed(`arena-${roundIndex}`));
    const b=generateMarbleArena(config,roundIndex,NamedRng.fromSeed(`arena-${roundIndex}`));
    assert.deepEqual(a,b);
    const report=validateMarbleArena(a,config);
    assert.equal(report.valid,true,JSON.stringify(report.issues));
    assert.equal(a.spawnPoints.length,config.rosterSize);
    assert.ok(a.finishY>config.marbleRadius);
    assert.ok(a.finishY<a.spawnY);
    assert.ok(a.features.colliderCount<=config.maxColliders);
    assert.ok(a.features.expectedContactLoad<=config.maxContactsPerTick);
    assert.ok(a.safeLanes.length>=2);
    for(const spawn of a.spawnPoints){
      assert.ok(spawn.x>=config.marbleRadius&&spawn.x<=a.width-config.marbleRadius);
      assert.ok(spawn.y>=config.marbleRadius&&spawn.y<=a.height-config.marbleRadius);
    }
  }
});

test('arena validator reports typed overlap and budget failures instead of a vague boolean',()=>{
  const config=parseMarbleConfig({rosterSize:4});
  const arena=generateMarbleArena(config,0,NamedRng.fromSeed('invalid-probe'));
  const broken=structuredClone(arena);
  broken.spawnPoints[1]=structuredClone(broken.spawnPoints[0]);
  broken.obstacles.push(...Array.from({length:config.maxColliders+1},(_,index)=>({
    id:`overflow-${index}`,kind:'block',x:1000,y:1000,width:400,height:400
  })));
  const report=validateMarbleArena(broken,config);
  assert.equal(report.valid,false);
  assert.ok(report.issues.some(issue=>issue.code==='spawn-overlap'));
  assert.ok(report.issues.some(issue=>issue.code==='collider-budget'));
});
