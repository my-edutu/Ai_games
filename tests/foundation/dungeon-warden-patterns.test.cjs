'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,planWardenStrike,planWardenEvasionStep,planWardenHuntTarget,planTacticalStep,assertDungeonState}=require('../../dist/games/ai-dungeon/src/index.js');
const key=p=>p.x+','+p.z;
test('real phase attacks have three distinct safe and dangerous footprints',()=>{
 const game=DungeonRuntime.create('three-warden-patterns-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden');assert.ok(boss);
 for(const [fraction,shape,max] of [[1,'NOVA',25],[.48,'RIFT_CROSS',17],[.2,'ECLIPSE_SWEEP',27]]){
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
 for(const tick of [6,7,8,9]){s.tick=tick;plan.push(planWardenStrike(s,boss))}
 assert.deepEqual(plan.map(p=>p.warning),[true,true,true,false]);
 assert.deepEqual(plan[0].cells,plan[1].cells);assert.deepEqual(plan[1].cells,plan[2].cells);assert.deepEqual(plan[2].cells,plan[3].cells);
 s.tick=15;assert.notEqual(planWardenStrike(s,boss).axis,plan[0].axis);
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

test('Eclipse final act raises three true lanes and a legal three-beat escape, without teleport',()=>{
 const game=DungeonRuntime.create('eclipse-pressure-tactics-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 assert.ok(boss&&hero);boss.hp=Math.ceil(boss.maxHp*.2);
 for(const u of s.units)if(u!==boss&&u!==hero)u.hp=0;
 hero.x=boss.x+1;hero.z=boss.z;s.tick=6;
 const strike=planWardenStrike(s,boss);
 assert.equal(strike.shape,'ECLIPSE_SWEEP');assert.equal(strike.turnsUntilImpact,3);
 assert.ok(strike.cells.length>=18&&strike.cells.length<=27);
 assert.ok(strike.cells.some(p=>p.x===boss.x+1&&p.z===hero.z));
 assert.ok(strike.cells.some(p=>p.x===boss.x-1&&p.z===hero.z));
 const initial={x:hero.x,z:hero.z};let moves=0;
 for(const beat of [3,2,1]){
  const live=planWardenStrike(s,boss);assert.equal(live.turnsUntilImpact,beat);
  if(live.cells.some(p=>p.x===hero.x&&p.z===hero.z)){
   const next=planWardenEvasionStep(s,hero,live);assert.ok(next);
   assert.equal(Math.abs(next.x-hero.x)+Math.abs(next.z-hero.z),1);
   assert.equal(s.map[next.z][next.x],'.');hero.x=next.x;hero.z=next.z;moves++;
  }
  s.tick++;
 }
 assert.ok(moves>=2,'three-column curtain requires successive lawful footfalls from the centre');
 assert.equal(s.tick,9);assert.equal(planWardenStrike(s,boss).warning,false);
 assert.equal(strike.cells.some(p=>p.x===hero.x&&p.z===hero.z),false);
 assert.notDeepEqual({x:hero.x,z:hero.z},initial);
 assertDungeonState(s);
});

test('a living hero never voluntarily walks back into the final Warden curtain after genuine evasion',()=>{
 const game=DungeonRuntime.create('eclipse-counterplay-stays-safe-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 assert.ok(boss&&hero);boss.hp=Math.ceil(boss.maxHp*.20);
 for(const u of s.units)if(u!==boss&&u!==hero)u.hp=0;
 hero.x=boss.x+1;hero.z=boss.z;s.tick=5;
 const initialHp=hero.hp,checkpoint=game.save(),states=[];
 for(let i=0;i<4;i++){
  const snap=game.step();states.push(snap.checksum);
  const strike=planWardenStrike(s,boss);
  if(i>=1&&i<=2&&strike.warning){
   const alreadySafe=!strike.cells.some(p=>p.x===hero.x&&p.z===hero.z);
   if(alreadySafe){
    const next=planTacticalStep(s,hero,boss,'engage');
    if(next)assert.equal(strike.cells.some(p=>p.x===next.x&&p.z===next.z),false,
     'the real attack-lane planner must preserve the earned clear stone');
   }
  }
 }
 assert.equal(s.tick,9);
 assert.equal(hero.hp,initialHp,'a legal two-turn escape survives the fully sourced final strike');
 const replay=DungeonRuntime.restore(checkpoint);
 assert.deepEqual(states,Array.from({length:4},()=>replay.step().checksum));
 assertDungeonState(s);
});

test('Eclipse is a living nine-beat boss duel, not an eternal warn/cast/recover treadmill',()=>{
 const game=DungeonRuntime.create('eclipse-autonomous-pace-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 assert.ok(boss&&hero);
 for(const other of s.units)if(other!==boss&&other!==hero)other.hp=0;
 boss.hp=Math.ceil(boss.maxHp*.29);
 // A distant but legal court position: no fake player action or boss teleport.
 const court=[[3,0],[-3,0],[0,3],[0,-3]]
  .map(([dx,dz])=>({x:boss.x+dx,z:boss.z+dz}))
  .find(p=>s.map[p.z]?.[p.x]==='.');
 assert.ok(court);Object.assign(hero,court);hero.attack=1;hero.hp=hero.maxHp;s.tick=8;
 const saved=game.save(),replay=DungeonRuntime.restore(saved);
 const actions=[],positions=[];
 for(let tick=9;tick<=17;tick++){
  const actual=game.step(),same=replay.step();
  assert.equal(actual.tick,tick);assert.equal(actual.checksum,same.checksum,'live boss phase replay divergence');
  actions.push({tick,action:boss.action});
  positions.push({tick,x:boss.x,z:boss.z});
 }
 const active=actions.filter(a=>a.tick>=12&&a.tick<=14&&['move','attack'].includes(a.action));
 assert.ok(active.length>=1,'Eclipse must actually pursue or fight between genuine cast, recovery and warning: '+JSON.stringify(actions));
 for(let i=1;i<positions.length;i++){
  const before=positions[i-1],after=positions[i],d=Math.abs(before.x-after.x)+Math.abs(before.z-after.z);
  assert.ok(d<=1,'Eclipse may only travel one legal grid step each tick');
 }
 assert.equal(planWardenStrike(s,boss).turnsUntilImpact,1,'three fixed source-backed warning turns close the cycle');
 assertDungeonState(s);
});

test('Eclipse Warden chooses a genuinely nearby vulnerable backliner, never a phantom target',()=>{
 const game=DungeonRuntime.create('eclipse-hunt-target-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),v=s.units.find(u=>u.id==='vanguard');
 const ranger=s.units.find(u=>u.id==='ranger'),mystic=s.units.find(u=>u.id==='mystic');
 boss.hp=Math.ceil(boss.maxHp*.20);
 Object.assign(v,{x:boss.x+2,z:boss.z,hp:v.maxHp});
 Object.assign(ranger,{x:boss.x,z:boss.z+2,hp:Math.floor(ranger.maxHp*.55)});
 Object.assign(mystic,{x:1,z:2,hp:mystic.maxHp});
 assert.equal(s.map[v.z][v.x],'.');assert.equal(s.map[ranger.z][ranger.x],'.');
 assert.equal(planWardenHuntTarget(s,boss)?.id,'ranger','equidistant ranged ally draws fair visible pressure');
 ranger.hp=0;
 assert.equal(planWardenHuntTarget(s,boss)?.id,'vanguard','dead heroes never draw attacks');
 boss.hp=0;
 assert.equal(planWardenHuntTarget(s,boss),null,'a dead Warden never plans pursuit');
});

test('final Warden takes one lawful movement step on an odd non-warning turn',()=>{
 const game=DungeonRuntime.create('eclipse-hunt-contact-M1'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const other of s.units)if(other!==boss&&other!==hero)other.hp=0;
 boss.hp=Math.ceil(boss.maxHp*.29);
 hero.x=boss.x+3;hero.z=boss.z;hero.hp=hero.maxHp;
 assert.equal(s.map[hero.z][hero.x],'.');
 s.tick=12;const original={x:boss.x,z:boss.z},saved=game.save(),mirror=DungeonRuntime.restore(saved);
 const view=game.step(),replayed=mirror.step();
 assert.equal(view.checksum,replayed.checksum,'actual autonomous pursuit must replay from a signed checkpoint');
 assert.equal(view.tick,13);
 assert.equal(boss.action,'move','Warden must pursue on a genuine odd free turn, not idle through the gap');
 assert.equal(Math.abs(boss.x-original.x)+Math.abs(boss.z-original.z),1,'one legal grid step only');
 assert.equal(s.map[boss.z][boss.x],'.');
 assert.equal(boss.targetId,hero.id,'animation faces the actual pursued hero');
 assert.ok(view.events.some(e=>e.kind==='pursuit'),'the live journal observes real movement rather than a fake encounter');
 assertDungeonState(s);
});
