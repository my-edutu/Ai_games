'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState,planOathguardIntercept}=require('../../dist/games/ai-dungeon/src/index.js');

function corneredDuel(seed='m1-oathguard-episode'){
 const game=DungeonRuntime.create(seed),s=game.state;
 const guardian=s.units.find(u=>u.id==='vanguard'),ally=s.units.find(u=>u.id==='ranger');
 const mystic=s.units.find(u=>u.id==='mystic'),cultist=s.units.find(u=>u.kind==='cultist');
 for(const u of s.units)if(u.faction==='enemy')u.hp=0;
 guardian.x=1;guardian.z=1;guardian.hp=guardian.maxHp;
 ally.x=1;ally.z=2;ally.hp=ally.maxHp;ally.attack=0;
 mystic.x=2;mystic.z=2;mystic.attack=0;
 cultist.x=1;cultist.z=4;cultist.hp=cultist.maxHp;cultist.attack=0;
 cultist.channelUntilTick=6;cultist.channelTargetId=ally.id;
 cultist.channelX=ally.x;cultist.channelZ=ally.z;s.tick=5;
 s.traps=[{id:'corner-hazard',x:1,z:3,kind:'ember',active:true,cooldown:0,disarmed:false,triggers:0}];
 assertDungeonState(s);return {game,s,guardian,ally};
}
test('pinned ranger receives costly real Oathguard cover and replay agrees',()=>{
 const {game,s,guardian,ally}=corneredDuel();
 const h=guardian.hp,a=ally.hp;
 assert.deepEqual(planOathguardIntercept({...s,tick:6},guardian),{allyId:ally.id,threat:'SHADOW HEX'});
 const twin=DungeonRuntime.restore(game.save()),result=game.step();
 assert.deepEqual(result,twin.step());
 assert.equal(guardian.action,'guard');assert.equal(guardian.targetId,ally.id);
 assert.ok(guardian.hp<h,'guardian paid real HP');
 assert.ok(ally.hp<a,'cover does not confer immunity');
 assert.ok(result.events.some(e=>e.kind==='cover'&&e.text.includes('intercepted')));
 assertDungeonState(s);
});
test('lawful dodge takes priority over automatic shielding',()=>{
 const {game,s,guardian,ally}=corneredDuel('m1-oathguard-free-flank');
 s.traps=[];assert.equal(planOathguardIntercept({...s,tick:6},guardian),null);
 const h=guardian.hp,result=game.step();
 assert.equal(guardian.hp,h);
 assert.equal(ally.action,'move');assert.notEqual(ally.z,2);
 assert.ok(result.events.some(e=>e.kind==='evade'));
});
test('no protection from remote or defeated vanguard',()=>{
 const {s,guardian,ally}=corneredDuel('m1-oathguard-distance');
 ally.x=3;ally.z=2;assert.equal(planOathguardIntercept({...s,tick:6},guardian),null);
 guardian.hp=0;assert.equal(planOathguardIntercept({...s,tick:6},guardian),null);
});
