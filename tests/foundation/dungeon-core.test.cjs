'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState,shortestPath,MAP_SIZE}=require('../../dist/games/ai-dungeon/src/index.js');
test('seeded generation guarantees valid reachable dungeons across 30 seeds',()=>{
 for(let i=0;i<30;i++){const game=DungeonRuntime.create('reachability-'+i),s=game.state;
  assertDungeonState(s);assert.equal(s.map.length,MAP_SIZE);
  assert.ok(shortestPath(s.map,{x:1,z:1},s.exit).length>0);
  assert.ok(s.units.some(u=>u.kind==='warden'));
 }
});
test('same seed leads to identical state through 220 autonomous ticks',()=>{
 const a=DungeonRuntime.create('replay-corpus-9'),b=DungeonRuntime.create('replay-corpus-9');
 for(let i=0;i<220;i++){a.step();b.step();assert.deepEqual(a.save(),b.save())}
});
test('snapshot restore continues with identical outcomes and rejects corruption',()=>{
 const a=DungeonRuntime.create('restore-17');for(let i=0;i<75;i++)a.step();
 const snapshot=a.save(),b=DungeonRuntime.restore(snapshot);
 for(let i=0;i<150;i++){a.step();b.step();assert.equal(a.save().signature,b.save().signature)}
 const broken=structuredClone(snapshot);broken.state.gold=1_000_000;
 assert.throws(()=>DungeonRuntime.restore(broken),/checksum mismatch/);
});
test('public data is bounded and privacy safe under stress',()=>{
 const game=DungeonRuntime.create('release-qa');
 for(let i=0;i<1800;i++){
  const s=game.step();if(i%20===0){assertDungeonState(game.state);assert.ok(s.events.length<=9);assert.ok(s.units.length<=18);assert.ok(s.relics.length<=6)}
 }
 const view=game.publicState();
 assert.equal(view.seed,undefined);assert.equal(view.rng,undefined);
 assert.ok(!JSON.stringify(view).includes('release-qa'));
 assert.ok(view.run>=1&&view.floor>=1);
});
