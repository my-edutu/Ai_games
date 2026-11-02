'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,planWardenStrike,planWardenEvasionStep}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs'),path=require('node:path');
const tell=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/warden-tell-plan.js'),'utf8')).toString('base64'));
function arena(){
 const map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
 const boss={id:'warden',kind:'warden',faction:'enemy',x:9,z:9,hp:294,maxHp:294,attack:20,cooldown:0};
 const hero={id:'vanguard',kind:'vanguard',faction:'party',x:10,z:9,hp:120,maxHp:120,attack:20,cooldown:0};
 return {map,boss,hero,units:[hero,boss],traps:[],tick:3};
}
test('three-beat nova announces the SAME exact 3-tile footprint and has a genuine 3-turn escape path',()=>{
 const s=arena(),strike=planWardenStrike(s,s.boss);
 assert.equal(strike.warning,true);assert.equal(strike.attackTick,6);
 assert.equal(strike.turnsUntilImpact,3);assert.equal(strike.shape,'NOVA');
 for(let beat=3;beat>=1;beat--){
  const next=planWardenEvasionStep(s,s.hero,planWardenStrike(s,s.boss));
  assert.ok(next,'each warned beat must provide a real route to clear stone');
  assert.equal(Math.abs(next.x-s.hero.x)+Math.abs(next.z-s.hero.z),1,
   'every response is one real legal footstep, never a teleport');
  assert.equal(s.map[next.z][next.x],'.');
  s.hero.x=next.x;s.hero.z=next.z;s.tick++;
 }
 assert.equal(s.tick,6);assert.equal(strike.cells.some(p=>p.x===s.hero.x&&p.z===s.hero.z),false);
});
test('honest position planner never bypasses walls, occupied tiles or traps and never pretends unreachable is safe',()=>{
 const s=arena(),strike=planWardenStrike(s,s.boss);
 s.traps.push({id:'lava',x:11,z:9,active:true,disarmed:false,kind:'ember',cooldown:0,triggers:0});
 const next=planWardenEvasionStep(s,s.hero,strike);
 assert.ok(next);assert.notDeepEqual(next,{x:11,z:9});
 assert.equal(s.map[next.z][next.x],'.');
 s.map=Array.from({length:19},(_,z)=>z===9?'##########.########':'#'.repeat(19));
 assert.equal(planWardenEvasionStep(s,s.hero,strike),null,'cannot fabricate a free retreat through collision');
});
test('real authority warning gives the Vanguard advance warning and stable replay with legal movement',()=>{
 const game=DungeonRuntime.create('warden-three-beat-2026'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 for(const u of s.units)if(u!==boss&&u!==hero)u.hp=0;
 const path=[{x:boss.x+1,z:boss.z},{x:boss.x-1,z:boss.z},{x:boss.x,z:boss.z+1},{x:boss.x,z:boss.z-1}];
 const adjacent=path.find(p=>s.map[p.z]?.[p.x]==='.');assert.ok(adjacent);
 hero.x=adjacent.x;hero.z=adjacent.z;s.tick=2;
 const checkpoint=game.save(),t3=game.step();
 assert.equal(t3.bossWarning?.turnsUntilImpact,3);
 assert.ok(t3.events.some(e=>e.kind==='telegraph'&&e.tick===3),'the first real warning comes at the start of escape horizon');
 assert.ok(['move','guard'].includes(hero.action));
 const replay=DungeonRuntime.restore(checkpoint);assert.equal(replay.step().checksum,t3.checksum);
 for(let i=0;i<28;i++)assert.equal(game.step().checksum,replay.step().checksum);
});
test('physical 3D tell synchronizes visible warning countdown to authority and reduced-motion',async()=>{
 const {planWardenTellStage}=await tell();
 assert.deepEqual(planWardenTellStage({shape:'NOVA',turnsUntilImpact:3,warning:true},false),
  {shape:'NOVA',progress:1/3,emboss:.018,glow:.24,warning:true,ornamentScale:.7});
 const a=planWardenTellStage({shape:'RIFT_CROSS',turnsUntilImpact:1,warning:true},true);
 assert.ok(a.emboss>0&&a.emboss<.08);assert.equal(a.glow,.48);
 assert.equal(planWardenTellStage({shape:'NOVA',turnsUntilImpact:0,warning:false},false).warning,false);
});

test('a healthy real Vanguard holds the marked frontline for a nearby ally while solo and wounded tanks dodge',()=>{
 const create=(seed)=>{const g=DungeonRuntime.create(seed),s=g.state,boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard'),ranger=s.units.find(u=>u.id==='ranger');
  for(const u of s.units)if(u!==boss&&u!==hero&&u!==ranger)u.hp=0;
  Object.assign(hero,{x:boss.x+1,z:boss.z});Object.assign(ranger,{x:boss.x+2,z:boss.z});
  assert.equal(s.map[hero.z][hero.x],'.');assert.equal(s.map[ranger.z][ranger.x],'.');s.tick=2;
  return {g,s,hero,ranger};
 };
 const front=create('vanguard-frontline-stage-0'),start={x:front.hero.x,z:front.hero.z};
 let t=front.g.step();assert.equal(t.bossWarning?.turnsUntilImpact,3);
 assert.deepEqual({x:front.hero.x,z:front.hero.z},start);
 assert.equal(front.hero.action,'guard','the healthy tank deliberately pays the action cost of holding the line');
 assert.equal(front.hero.guardTick,front.s.tick+1);
 const replay=DungeonRuntime.restore(front.g.save());
 for(let i=0;i<5;i++)assert.equal(front.g.step().checksum,replay.step().checksum);
 const solo=create('vanguard-frontline-stage-0');solo.ranger.hp=0;
 t=solo.g.step();assert.equal(t.bossWarning?.turnsUntilImpact,3);
 assert.equal(solo.hero.action,'move','without a living ally the same tank must escape');
 const wounded=create('vanguard-frontline-stage-0');wounded.hero.hp=Math.ceil(wounded.hero.maxHp*.42);
 wounded.g.step();assert.equal(wounded.hero.action,'move','the wounded tank must preserve its actual life');
});
