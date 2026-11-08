'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState,wardenSealActive}=require('../../dist/games/ai-dungeon/src/index.js');

// Real authority tick fixture: the Vanguard and Warden share an open fighting
// lane, but one living seal defender stands well beyond any legal weapon range.
function contactFixture(rules=2,guardAdjacent=false){
 const game=DungeonRuntime.create('m1-v2-target-contact'),s=game.state;
 s.map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
 s.exit={x:10,z:8};s.relics=[];s.traps=[];s.tick=1;
 const vanguard=s.units.find(u=>u.id==='vanguard');
 const ranger=s.units.find(u=>u.id==='ranger');
 const mystic=s.units.find(u=>u.id==='mystic');
 const boss=s.units.find(u=>u.kind==='warden');
 const defender=s.units.find(u=>u.kind!=='warden'&&u.faction==='enemy');
 for(const enemy of s.units.filter(u=>u.faction==='enemy'&&u!==boss&&u!==defender))
  enemy.hp=0;
 Object.assign(vanguard,{x:9,z:8,hp:vanguard.maxHp});
 Object.assign(ranger,{x:2,z:2,hp:ranger.maxHp});
 Object.assign(mystic,{x:3,z:2,hp:mystic.maxHp});
 Object.assign(boss,{x:10,z:8});
 Object.assign(defender,{x:guardAdjacent?9:15,z:guardAdjacent?9:15,hp:defender.maxHp});
 if(rules===1)delete s.rulesVersion;
 assert.equal(wardenSealActive(s),true);
 assertDungeonState(s);
 return {game,s,vanguard,boss,defender};
}

test('v2 attacks a physically adjacent sealed Warden rather than ignoring real contact because of a remote living defender',()=>{
 const {game,vanguard,boss,defender}=contactFixture();
 const oldBoss=boss.hp,oldGuard=defender.hp,mirror=DungeonRuntime.restore(game.save());
 const result=game.step();
 assert.equal(result.rulesVersion,2);
 assert.ok(boss.hp<oldBoss,'the nearby Warden must receive REAL seal-reduced damage');
 assert.equal(defender.hp,oldGuard,'a distant binding defender cannot be attacked through stone');
 assert.equal(vanguard.targetId,boss.id);
 assert.equal(vanguard.action,'attack');
 assert.equal(result.checksum,mirror.step().checksum,'v2 choice must replay deterministically');
 assertDungeonState(game.state);
});

test('a genuinely reachable nearby binding guard still takes priority over the sealed Warden',()=>{
 const {game,vanguard,boss,defender}=contactFixture(2,true);
 const bossBefore=boss.hp,guardBefore=defender.hp;
 game.step();
 assert.ok(defender.hp<guardBefore);
 assert.equal(boss.hp,bossBefore,'do not bypass the binding guard when it is actually within a legal melee lane');
 assert.equal(vanguard.targetId,defender.id);
 assertDungeonState(game.state);
});

test('restored legacy behavior does not silently acquire v2 opportunistic boss targeting mid-run',()=>{
 const {game,boss}=contactFixture(1);
 const before=boss.hp,save=game.save(),legacy=DungeonRuntime.restore(save);
 game.step();legacy.step();
 assert.equal(boss.hp,before,'the 0.5.0 tactics continue for the original run');
 assert.equal(game.state.rulesVersion,undefined);
 assert.deepEqual(game.save(),legacy.save(),'legacy rules and RNG are replay-stable');
});
