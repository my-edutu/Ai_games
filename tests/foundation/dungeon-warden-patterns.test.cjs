'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,planWardenStrike,assertDungeonState}=require('../../dist/games/ai-dungeon/src/index.js');
const key=p=>p.x+','+p.z;
test('real phase attacks have three distinct safe and dangerous footprints',()=>{
 const game=DungeonRuntime.create('three-warden-patterns-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden');assert.ok(boss);
 for(const [fraction,shape,max] of [[1,'NOVA',25],[.48,'RIFT_CROSS',17],[.2,'ECLIPSE_SWEEP',9]]){
  boss.hp=Math.ceil(boss.maxHp*fraction);s.tick=4;
  const threat=planWardenStrike(s,boss);
  assert.equal(threat.shape,shape);
  assert.ok(threat.cells.length>=5&&threat.cells.length<=max);
  assert.equal(new Set(threat.cells.map(key)).size,threat.cells.length);
  assert.ok(threat.cells.every(p=>s.map[p.z][p.x]==='.'));
  assert.ok(threat.cells.some(p=>key(p)===key(boss)));
 }
});
test('Eclipse warning, reaction and actual strike agree on orientation and tiles',()=>{
 const game=DungeonRuntime.create('warden-warning-fixed-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden');boss.hp=Math.ceil(boss.maxHp*.2);
 const plan=[];
 for(const tick of [2,3,4]){s.tick=tick;plan.push(planWardenStrike(s,boss))}
 assert.equal(plan[0].warning,true);assert.equal(plan[1].warning,true);assert.equal(plan[2].warning,false);
 assert.deepEqual(plan[0].cells,plan[1].cells);assert.deepEqual(plan[1].cells,plan[2].cells);
 s.tick=6;assert.notEqual(planWardenStrike(s,boss).axis,plan[0].axis);
});
test('a hero genuinely steps off a Rupture cross and avoids the real following attack',()=>{
 const game=DungeonRuntime.create('warden-real-flank-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const unit of s.units)if(unit.faction==='enemy'&&unit!==boss||unit.faction==='party'&&unit!==hero)unit.hp=0;
 boss.hp=Math.ceil(boss.maxHp*.5);hero.x=boss.x+2;hero.z=boss.z;hero.hp=hero.maxHp;s.tick=4;
 const before=game.publicState().bossWarning;
 assert.equal(before.shape,'RIFT_CROSS');
 assert.ok(before.cells.some(p=>key(p)===key(hero)));
 const from=key(hero),hp=hero.hp,saved=game.save(),next=game.step();
 assert.equal(hero.action,'move');assert.notEqual(key(hero),from);
 assert.ok(!next.bossWarning.cells.some(p=>key(p)===key(hero)));
 assert.ok(next.events.some(e=>e.kind==='evade'));
 game.step();assert.equal(hero.action,'guard','a true dodge holds its safe position through the impact turn');
 assert.equal(hero.hp,hp,'strike must not secretly damage a safe tile');
 const replay=DungeonRuntime.restore(saved);replay.step();replay.step();
 for(let n=0;n<25;n++)assert.equal(game.step().checksum,replay.step().checksum);
 assertDungeonState(game.state);
});
test('no legal adjacent safe tile causes a real guard with damage mitigation',()=>{
 const game=DungeonRuntime.create('warden-nova-guard-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const u of s.units)if(u.faction==='enemy'&&u!==boss||u.faction==='party'&&u!==hero)u.hp=0;
 boss.hp=boss.maxHp;hero.x=boss.x;hero.z=boss.z;s.tick=4;
 const hp=hero.hp,view=game.step();assert.equal(hero.action,'guard');
 assert.equal(hero.guardTick,s.tick+1);assert.ok(view.events.some(e=>e.kind==='guard'));
 game.step();assert.ok(hero.hp<hp&&hero.hp>=hp-8);
 assertDungeonState(game.state);
});
