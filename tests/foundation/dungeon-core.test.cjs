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

test('boss charges a visible warning before applying area damage',()=>{
 const game=DungeonRuntime.create('boss-telegraph-fixture');
 const s=game.state,boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 const path=shortestPath(s.map,{x:1,z:1},s.exit);
 assert.ok(boss&&hero&&path.length>2);
 const adjacent=path[path.length-2];hero.x=adjacent.x;hero.z=adjacent.z;s.tick=3;
 game.step();
 const warning=game.state.events.find(e=>e.kind==='telegraph'&&e.tick===4);
 assert.ok(warning,'warning must be visible two ticks before the attack');
 const health=hero.hp;
 game.step();game.step();
 const blasts=game.state.events.filter(e=>e.kind==='danger'&&e.text.includes('shockwave'));
 assert.ok(blasts.length>=1,'the warning must resolve to a real, rule-governed boss attack');
 assert.ok(hero.hp<health,'the attack must have an observable consequence');
});
test('autonomous unit actions are exposed as bounded, public animation semantics',()=>{
 const game=DungeonRuntime.create('character-motion-probe');
 let observedMovement=false,observedAttack=false;
 for(let i=0;i<240;i++){const view=game.step();
  for(const unit of view.units){
   if(unit.action==='move')observedMovement=true;
   if(unit.action==='attack'||unit.action==='cast')observedAttack=true;
   assert.ok(['idle','move','attack','cast','hurt'].includes(unit.action));
   assert.equal(unit.actionTick,view.tick);
  }
 }
 assert.equal(observedMovement,true);assert.equal(observedAttack,true);
});

test('procedural chambers diversify geometry and guarantee a spacious boss courtyard',()=>{
 for(let i=0;i<40;i++){const game=DungeonRuntime.create('sanctuary-'+i),s=game.state;
  let openNear=0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const x=s.exit.x+dx,z=s.exit.z+dz;if(x>0&&x<MAP_SIZE-1&&z>0&&z<MAP_SIZE-1&&s.map[z][x]==='.')openNear++}
  assert.ok(openNear>=4,'Warden courtyard must be wider than a corridor');
  const rooms=s.map.join('\\n').match(/\.\.\./g)||[];
  assert.ok(rooms.length>=3,'sanctuary rooms should introduce wider floor plans');
  assertDungeonState(s);
 }
});

test('interactive traps are deterministic and can hurt or be disarmed by autonomous heroes',()=>{
 const game=DungeonRuntime.create('trap-interaction-fixture'),s=game.state;
 assert.ok(s.traps.length>=2);
 const vanguard=s.units.find(u=>u.id==='vanguard'),boss=s.units.find(u=>u.kind==='warden');
 const next=shortestPath(s.map,vanguard,boss)[0];assert.ok(next);
 const trap=s.traps[0];trap.x=next.x;trap.z=next.z;trap.active=true;
 const before=vanguard.hp;const t=game.step();
 assert.ok(vanguard.hp<before,'armed trap must affect a real entering hero');
 assert.equal(trap.active,false);assert.equal(trap.cooldown,11);
 assert.ok(t.events.some(e=>e.kind==='trap'));
 const restore=DungeonRuntime.restore(game.save());assert.deepEqual(restore.publicState(),game.publicState());
 const other=DungeonRuntime.create('trap-disarm-fixture'),q=other.state,ranger=q.units.find(u=>u.kind==='ranger');
 const qtrap=q.traps[0];ranger.x=qtrap.x;ranger.z=qtrap.z;q.tick=3;
 other.step();
 assert.equal(qtrap.disarmed,true,'ranger must choose to disable a nearby trap');
 assert.ok(q.events.some(e=>e.kind==='disarm'));
});
