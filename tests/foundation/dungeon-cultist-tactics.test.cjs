'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState}=require('../../dist/games/ai-dungeon/src/index.js');
test('a threatened cultist makes a genuine legal deterministic retreat to regain a ranged lane',()=>{
 const game=DungeonRuntime.create('cultist-legitimate-flank-m1'),s=game.state;
 const hero=s.units.find(u=>u.id==='vanguard');
 const caster=s.units.find(u=>u.kind==='cultist');
 assert.ok(hero&&caster);
 const cells=[];
 for(let z=2;z<s.map.length-2;z++)for(let x=2;x<s.map.length-2;x++){
  if(s.map[z][x-1]==='.'&&s.map[z][x]==='.'&&s.map[z][x+1]==='.'&&
   !s.traps.some(t=>t.x===x&&t.z===z||t.x===x-1&&t.z===z||t.x===x+1&&t.z===z))
    cells.push({x,z});
 }
 assert.ok(cells.length>0,'seeded map has at least one clear three-cell casting lane');
 const p=cells[0];
 for(const u of s.units)if(u!==hero&&u!==caster)u.hp=0;
 hero.x=p.x-1;hero.z=p.z;hero.hp=hero.maxHp;hero.attack=0;
 caster.x=p.x;caster.z=p.z;caster.hp=caster.maxHp;
 s.tick=2;
 const from={x:caster.x,z:caster.z},saved=game.save();
 const original=game.step();
 assert.equal(original.tick,3);
 assert.equal(caster.action,'move','real autonomous enemy AI must visibly retreat rather than exchange blows');
 assert.ok(Math.abs(caster.x-hero.x)+Math.abs(caster.z-hero.z)>=2);
 assert.ok(caster.x!==from.x||caster.z!==from.z);
 assert.equal(s.map[caster.z][caster.x],'.');
 assert.equal(original.intent,'Shadow caster disengaging to regain a spell lane');
 assertDungeonState(s);
 const replay=DungeonRuntime.restore(saved);
 assert.deepEqual(replay.step(),original,'rewound real authority must choose the identical legal tactic');
 for(let i=0;i<40;i++)assert.equal(game.step().checksum,replay.step().checksum,'no hidden tactical randomness');
});
