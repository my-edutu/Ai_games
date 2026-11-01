'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime,shortestPath,assertDungeonState,wardenSealActive,damageThroughWardenSeal}=require('../../dist/games/ai-dungeon/src/index.js');

test('the Warden keeps genuine nearby oathbound defenders with legal unique tiles',()=>{
 const game=DungeonRuntime.create('court-guard-seed-1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),guards=s.units.filter(u=>u.id.startsWith('oathbound-'));
 assert.equal(guards.length,2);
 assert.ok(guards.every(u=>u.hp>0&&u.faction==='enemy'&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=2));
 assert.notEqual(guards[0].x+guards[0].z*19,guards[1].x+guards[1].z*19);
 assert.ok(wardenSealActive(s));assertDungeonState(s);
 assert.deepEqual(DungeonRuntime.restore(game.save()).publicState(),game.publicState());
});

test('binding guards protect the Sentinel; later phases and cleared guards release real damage',()=>{
 const game=DungeonRuntime.create('binding-guard-damage-1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),guard=s.units.find(u=>u.kind==='revenant');
 assert.ok(boss&&guard&&guard.hp>0);
 assert.equal(wardenSealActive(s),true);
 assert.equal(damageThroughWardenSeal(s,boss,22),6,'the guarded boss takes genuine reduced damage, never invulnerability');
 guard.hp=0;
 for(const u of s.units)if(u.faction==='enemy'&&u.kind!=='warden')u.hp=0;
 assert.equal(wardenSealActive(s),false);
 assert.equal(damageThroughWardenSeal(s,boss,22),16);
 boss.hp=Math.floor(boss.maxHp*.4);
 assert.equal(damageThroughWardenSeal(s,boss,22),22,'the rupture phase has no secret shield');
 assert.equal(damageThroughWardenSeal(s,s.units.find(u=>u.kind==='vanguard'),22),22);
 assertDungeonState(s);
});
test('the last real defender defeat creates one truthful seal-break event and visible state',()=>{
 const game=DungeonRuntime.create('binding-guard-break-2'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 const guard=s.units.find(u=>u.kind==='revenant');
 const step=shortestPath(s.map,hero,boss)[0];assert.ok(step);
 for(const u of s.units)if(u.faction==='enemy'&&u.kind!=='warden')u.hp=0;
 guard.hp=1;guard.x=step.x;guard.z=step.z;
 assert.equal(wardenSealActive(s),true);
 const tickBefore=s.tick,bossBefore=boss.hp,view=game.step();
 assert.equal(guard.hp,0);
 assert.equal(boss.hp,bossBefore);
 assert.equal(view.guardianWard,false);
 assert.equal(view.defendersRemaining,0);
 assert.ok(view.events.some(e=>e.kind==='unseal'&&e.tick===tickBefore+1),'visible transition is grounded in the last defender death');
 const next=game.step();
 assert.equal(next.events.filter(e=>e.kind==='unseal').length,1,'no looping fake milestone on subsequent ticks');
 assert.deepEqual(DungeonRuntime.restore(game.save()).publicState(),game.publicState());
});
test('living reinforcements prevent an unearned floor exit after defeating the Warden',()=>{
 const game=DungeonRuntime.create('binding-guard-portal-3'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),guard=s.units.find(u=>u.kind==='revenant');
 const hero=s.units.find(u=>u.id==='vanguard');assert.ok(boss&&guard&&hero);
 for(const unit of s.units){if(unit.faction==='enemy')unit.hp=0;if(unit.faction==='party'&&unit!==hero)unit.hp=0;}
 guard.hp=guard.maxHp;guard.x=1;guard.z=1;
 hero.x=s.exit.x;hero.z=s.exit.z;
 const before=s.floor,waiting=game.step();
 assert.equal(waiting.floor,before,'portal requires the actual remaining threat to be defeated');
 assert.equal(waiting.defendersRemaining,1);
 guard.hp=0;hero.x=s.exit.x;hero.z=s.exit.z;
 const descended=game.step();
 assert.equal(descended.floor,before+1);
 assertDungeonState(game.state);
});
test('authoritative ward, focused pursuit and real presentation are wired without mutating save schema',()=>{
 const game=DungeonRuntime.create('binding-guard-replay-4'),s=game.state;
 assert.equal(s.schemaVersion,1);assert.equal(game.save().version,'0.4.0');
 const restored=DungeonRuntime.restore(game.save());
 for(let tick=0;tick<140;tick++)assert.equal(game.step().checksum,restored.step().checksum);
 const root=path.resolve(__dirname,'../..'),app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const sound=fs.readFileSync(path.join(root,'public/ai-dungeon/soundstage-plan.js'),'utf8');
 assert.ok(app.includes('courtShield.visible=Boolean(s.guardianWard)'));
 assert.ok(app.includes('s.defendersRemaining'));
 assert.ok(sound.includes("unseal:'unseal'"));
 assert.equal(typeof game.publicState().guardianWard,'boolean');
 assert.ok(Number.isInteger(game.publicState().defendersRemaining));
});
