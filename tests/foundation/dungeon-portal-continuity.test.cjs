'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState}=require('../../dist/games/ai-dungeon/src/index.js');

// Real signed runtime state: every enemy is already dead. A nonleader
// physically reaches the one-cell portal before the Vanguard can.
test('a living ally occupying the cleared portal advances the real squad instead of trapping its leader',()=>{
 const game=DungeonRuntime.create('portal-party-rendezvous'),s=game.state,exit=s.exit;
 for(const foe of s.units.filter(u=>u.faction==='enemy'))foe.hp=0;
 const around=[[1,0],[0,1],[-1,0],[0,-1]]
  .map(([dx,dz])=>({x:exit.x+dx,z:exit.z+dz}))
  .filter(p=>s.map[p.z]?.[p.x]==='.');
 assert.ok(around.length>=2);
 const vanguard=s.units.find(u=>u.id==='vanguard'),ranger=s.units.find(u=>u.id==='ranger'),mystic=s.units.find(u=>u.id==='mystic');
 Object.assign(vanguard,around[0]);Object.assign(ranger,exit);Object.assign(mystic,around[1]);
 assert.notDeepEqual({x:vanguard.x,z:vanguard.z},exit);
 assertDungeonState(s);
 const twin=DungeonRuntime.restore(game.save());
 const next=game.step(),same=twin.step();
 assert.deepEqual(next,same,'the portal ruling is identical across saved replay');
 assert.equal(next.floor,2,'actual completed encounters and a real portal occupant open the next floor');
 assert.equal(next.phase,'exploring');
 assert.ok(next.events.some(e=>e.kind==='floor'&&e.text.includes('FLOOR 2')));
});
test('portal cannot advance with living hostiles, or when no surviving hero stands on it',()=>{
 const game=DungeonRuntime.create('portal-safety-guards'),s=game.state;
 const exit=s.exit,ranger=s.units.find(u=>u.id==='ranger');
 Object.assign(ranger,exit);
 assert.equal(game.step().floor,1,'live Warden prevents a premature descent');
 const safe=DungeonRuntime.create('portal-safety-guards'),q=safe.state;
 for(const enemy of q.units.filter(u=>u.faction==='enemy'))enemy.hp=0;
 assert.equal(safe.step().floor,1,'unoccupied portal cannot advance');
});
test('an entirely autonomous real campaign naturally traverses, fights, kills the Warden, descends, loses and restarts',()=>{
 const game=DungeonRuntime.create('gauntlet-corpus-v1-0'),mirror=DungeonRuntime.restore(game.save());
 const seen=new Set();let highest=1,lastFloor=1,lastRun=1,firstDefeat=null,firstRestart=null;
 for(let i=0;i<2500;i++){
  const current=game.step(),duplicate=mirror.step();
  assert.equal(current.checksum,duplicate.checksum,'deterministic replay diverged at tick '+i);
  if(current.units.some(u=>u.faction==='party'&&u.action==='move'))seen.add('traversal');
  if(current.units.some(u=>u.faction==='party'&&(u.action==='attack'||u.action==='cast')))seen.add('combat');
  if(current.events.some(e=>e.tick===current.tick&&e.kind==='kill'&&e.text.includes('WARDEN DEFEATED')))seen.add('boss');
  if(current.floor>lastFloor)seen.add('floor');
  if(current.phase==='intermission'&&!firstDefeat){firstDefeat=i+1;seen.add('defeat');}
  if(current.run>lastRun&&!firstRestart){firstRestart=i+1;seen.add('restart');}
  highest=Math.max(highest,current.floor);lastFloor=current.floor;lastRun=current.run;
 }
 const summary=()=>({run:game.state.run,floor:game.state.floor,tick:game.state.tick,phase:game.state.phase,
  intent:game.state.intent,exit:game.state.exit,
  units:game.state.units.filter(u=>u.hp>0).map(u=>({id:u.id,kind:u.kind,faction:u.faction,
   x:u.x,z:u.z,hp:u.hp,action:u.action,target:u.targetId})),
  kills:game.state.kills,events:game.state.events.slice(-5)});
 assert.deepEqual([...seen].sort(),['boss','combat','defeat','floor','restart','traversal'],
  'organic adventure stages absent; final authoritative state: '+JSON.stringify(summary()));
 assert.ok(highest>3,'the real run must progress beyond the first cinematic encounter');
 assert.ok(firstRestart>firstDefeat,'a genuine defeat precedes autonomous restart');
});
