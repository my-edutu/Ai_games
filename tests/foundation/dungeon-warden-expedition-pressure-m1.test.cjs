'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,wardenPhase,planWardenRecovery,planDungeonRespite,assertDungeonState}=
 require('../../dist/games/ai-dungeon/src/index.js');

function duel(seed,phase){
 const game=DungeonRuntime.create(seed),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const unit of s.units)if(unit!==boss&&unit!==hero)unit.hp=0;
 boss.hp=Math.ceil(boss.maxHp*(phase==='SENTINEL'?1:phase==='RUPTURE'?.48:.2));
 Object.assign(hero,{x:boss.x+3,z:boss.z,hp:hero.maxHp});
 assert.equal(s.map[hero.z]?.[hero.x],'.','all movement occurs in the real open court');
 assert.equal(wardenPhase(boss),phase);
 s.tick=phase==='ECLIPSE'?8:5;
 assertDungeonState(s);
 return {game,s,boss,hero};
}

for(const phase of ['SENTINEL','RUPTURE']){
 test(phase+' Warden earns a lawful pursuit/contact turn between real impact, recovery and next fixed warning',()=>{
  const {game,s,boss,hero}=duel('m1-phase-pressure-'+phase,phase),copy=DungeonRuntime.restore(game.save());
  const start={x:boss.x,z:boss.z},observed=[];
  for(let i=0;i<3;i++){
   const next=game.step(),replay=copy.step();
   assert.equal(next.checksum,replay.checksum,'live phase campaign must deterministically replay');
   observed.push({tick:s.tick,action:boss.action,x:boss.x,z:boss.z,
    recovery:planWardenRecovery(s,boss)?.remaining??0});
  }
  assert.equal(observed[0].action,'cast','the real warned impact resolves first');
  assert.equal(observed[1].recovery,1,'unsealed boss pays a genuine, single vulnerable recovery turn');
  assert.ok(['move','attack'].includes(observed[2].action),
   'real boss must pressure living opponent before the next warning: '+JSON.stringify(observed));
  assert.equal(observed[2].recovery,0);
  assert.ok(Math.abs(boss.x-start.x)+Math.abs(boss.z-start.z)<=1,
   'a pursuing boss crosses at most one legal grid cell');
  assert.equal(s.map[boss.z][boss.x],'.');
  assert.ok(hero.hp>0,'an authentic threat does not require a forced kill');
  assertDungeonState(s);
 });
}

test('Eclipse preserves two genuine exposed counterattack beats and deterministic warning',()=>{
 const {game,s,boss}=duel('m1-final-phase-pressure','ECLIPSE'),mirror=DungeonRuntime.restore(game.save());
 const states=[];
 for(let i=0;i<3;i++){
  const next=game.step();
  assert.equal(next.checksum,mirror.step().checksum);
  states.push({action:boss.action,recovery:planWardenRecovery(s,boss)?.remaining??0});
 }
 assert.equal(states[0].action,'cast');
 assert.deepEqual(states.slice(1).map(v=>v.recovery),[2,1],
  'the final form must still expose two playable counter turns');
 assertDungeonState(s);
});

test('natural deeper-floor attrition preserves earned respite without instant full heal',()=>{
 assert.equal(planDungeonRespite(2),26);
 assert.equal(planDungeonRespite(3),13);
 assert.equal(planDungeonRespite(5),9);
 assert.equal(planDungeonRespite(20),6);
 for(const invalid of [0,-1,NaN,Infinity,1.25])assert.equal(planDungeonRespite(invalid),0);
 const game=DungeonRuntime.create('m1-deep-expedition-respite'),s=game.state;
 const ranger=s.units.find(u=>u.id==='ranger');
 s.floor=4;ranger.hp=35;
 for(const foe of s.units.filter(u=>u.faction==='enemy'))foe.hp=0;
 // The party has actually assembled at the cleared portal; a support hero
 // abandoned alone would correctly escort the distant leader instead.
 const vanguard=s.units.find(u=>u.id==='vanguard');
 Object.assign(vanguard,{x:s.exit.x+1,z:s.exit.z});
 assert.equal(s.map[vanguard.z][vanguard.x],'.');
 Object.assign(ranger,s.exit);
 const mirror=DungeonRuntime.restore(game.save()),next=game.step();
 assert.equal(next.checksum,mirror.step().checksum);
 assert.equal(next.floor,5,'only a physically occupied and genuinely cleared portal descends');
 assert.equal(next.units.find(u=>u.id==='ranger').hp,44,
  'floor-five respite is an earned nine HP, not the former flat 26 HP');
 assertDungeonState(game.state);
});
