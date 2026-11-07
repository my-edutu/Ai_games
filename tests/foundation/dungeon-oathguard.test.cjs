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

// One integrated true-combat scene: real legal tile handoff, authentic dodge,
// replay parity and unchanged floor authority (no new immunity or save data).
test('Vanguard clears an occupied safe stone for a real Warden escape and replay stays identical',()=>{
 const {planOathguardClearLane,planWardenEvasionStep,planWardenStrike}=
  require('../../dist/games/ai-dungeon/src/index.js');
 const game=DungeonRuntime.create('m1-oathguard-real-escape'),s=game.state;
 s.map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
 s.map[8]=s.map[8].slice(0,11)+'#'+s.map[8].slice(12);
 s.tick=10;s.traps=[];
 const boss=s.units.find(u=>u.kind==='warden'),guardian=s.units.find(u=>u.id==='vanguard'),
  ranger=s.units.find(u=>u.id==='ranger'),mystic=s.units.find(u=>u.id==='mystic');
 for(const foe of s.units.filter(u=>u.faction==='enemy'&&u!==boss))foe.hp=0;
 Object.assign(boss,{x:10,z:10,hp:Math.ceil(boss.maxHp*.48),cooldown:1});
 Object.assign(guardian,{x:9,z:8,hp:guardian.maxHp});
 Object.assign(ranger,{x:10,z:8,hp:ranger.maxHp});
 Object.assign(mystic,{x:15,z:15});
 assertDungeonState(s);
 const staged={...s,tick:11},warning=planWardenStrike(staged,boss);
 assert.equal(warning.warning,true);assert.equal(warning.attackTick,12);
 assert.equal(planWardenEvasionStep(staged,ranger,warning),null,
  'the real Vanguard currently obstructs the only legal escape stone');
 const plan=planOathguardClearLane(staged,guardian);
 assert.equal(plan.allyId,'ranger');
 assert.equal(Math.abs(plan.x-guardian.x)+Math.abs(plan.z-guardian.z),1);
 const mirror=DungeonRuntime.restore(game.save()),out=game.step();
 assert.equal(out.checksum,mirror.step().checksum,'authority/replay safety gate');
 assert.equal(guardian.action,'move');assert.equal(guardian.targetId,'ranger');
 assert.equal(ranger.action,'move');assert.equal(ranger.x,9);assert.equal(ranger.z,8);
 assert.ok(out.events.some(e=>e.kind==='cover-advance'&&e.tick===11));
 assert.ok(out.events.some(e=>e.kind==='evade'&&e.tick===11));
 assertDungeonState(s);
});
test('Vanguard does not block a free escape or manufacture an approach without a Warden warning',()=>{
 const {planOathguardClearLane}=require('../../dist/games/ai-dungeon/src/index.js');
 const map=Array.from({length:19},()=>'.'.repeat(19));
 const g={id:'vanguard',kind:'vanguard',faction:'party',hp:100,maxHp:100,x:9,z:8};
 const ranger={id:'ranger',kind:'ranger',faction:'party',hp:60,maxHp:70,x:10,z:8};
 const boss={id:'warden',kind:'warden',faction:'enemy',hp:45,maxHp:100,x:10,z:10};
 const s={map,tick:11,units:[g,ranger,boss],traps:[]};
 assert.equal(planOathguardClearLane(s,g),null,'a naturally safe ally needs no tile handoff');
 assert.equal(planOathguardClearLane({...s,tick:8},g),null);
 assert.equal(planOathguardClearLane({...s,units:[g,ranger,{...boss,hp:0}]},g),null);
 assert.equal(planOathguardClearLane({...s,units:[{...g,hp:0},ranger,boss]},{...g,hp:0}),null);
});
