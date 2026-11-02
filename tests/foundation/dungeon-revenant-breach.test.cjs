'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState}=require('../../dist/games/ai-dungeon/src/index.js');
test('live revenant locks a genuine strike tile; autonomous reaction and signed replay agree',()=>{
 const game=DungeonRuntime.create('m1-revenant-threat'),s=game.state;
 const hero=s.units.find(u=>u.id==='vanguard'),rev=s.units.find(u=>u.kind==='revenant');
 assert.ok(hero&&rev);for(const u of s.units)if(u!==hero&&u!==rev)u.hp=0;
 hero.x=1;hero.z=1;hero.hp=hero.maxHp;rev.x=3;rev.z=1;rev.cooldown=0;rev.hp=rev.maxHp;s.tick=4;
 assertDungeonState(s);const hp=hero.hp,warning=game.step();
 assert.ok(warning.events.some(e=>e.kind==='telegraph'&&e.text.includes('REVENANT BREACH')));
 assert.equal(warning.revenantWarnings.length,1);
 assert.equal(warning.revenantWarnings[0].sourceId,rev.id);
 assert.equal(warning.revenantWarnings[0].impactTick,6);
 const replay=DungeonRuntime.restore(game.save()),next=game.step();
 assert.deepEqual(next,replay.step());assert.equal(rev.breachUntilTick,undefined);
 if(hero.action==='move')assert.equal(hero.hp,hp,'the locked tile cannot follow a legal dodge');
 else assert.ok(hero.hp<hp,'even a guard costs health');
 assertDungeonState(s);
});
test('cornered vanguard braces rather than inventing a sidestep through allies',()=>{
 const game=DungeonRuntime.create('m1-revenant-blocked'),s=game.state;
 const hero=s.units.find(u=>u.id==='vanguard'),ranger=s.units.find(u=>u.id==='ranger'),
 mystic=s.units.find(u=>u.id==='mystic'),rev=s.units.find(u=>u.kind==='revenant');
 for(const u of s.units)if(![hero,ranger,mystic,rev].includes(u))u.hp=0;
 hero.x=1;hero.z=1;ranger.x=1;ranger.z=2;mystic.x=2;mystic.z=2;rev.x=2;rev.z=1;
 hero.attack=0;ranger.attack=0;mystic.attack=0;s.tick=5;
 rev.breachUntilTick=6;rev.breachTargetId=hero.id;rev.breachX=1;rev.breachZ=1;
 const hp=hero.hp;assertDungeonState(s);
 const outcome=game.step();
 assert.equal(hero.x,1);assert.equal(hero.z,1);assert.equal(hero.action,'guard');
 assert.ok(hero.hp<hp&&hp-hero.hp<=15);
 assert.ok(outcome.events.some(e=>e.kind==='breach'&&e.text.includes('held')));
});
