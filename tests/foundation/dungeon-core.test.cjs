'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,assertDungeonState,shortestPath,MAP_SIZE}=require('../../dist/games/ai-dungeon/src/index.js');
test('seeded generation guarantees valid reachable dungeons across 30 seeds',()=>{
 for(let i=0;i<30;i++){const game=DungeonRuntime.create('reachability-'+i),s=game.state;
  assertDungeonState(s);assert.equal(s.map.length,MAP_SIZE);
  assert.ok(shortestPath(s.map,{x:1,z:1},s.exit).length>0);
  assert.ok(s.units.some(u=>u.kind==='warden'));
 }
});
test('same seed leads to identical state through 220 autonomous ticks',()=>{
 const a=DungeonRuntime.create('replay-corpus-9'),b=DungeonRuntime.create('replay-corpus-9');
 for(let i=0;i<220;i++){a.step();b.step();assert.deepEqual(a.save(),b.save())}
});
test('snapshot restore continues with identical outcomes and rejects corruption',()=>{
 const a=DungeonRuntime.create('restore-17');for(let i=0;i<75;i++)a.step();
 const snapshot=a.save(),b=DungeonRuntime.restore(snapshot);
 for(let i=0;i<150;i++){a.step();b.step();assert.equal(a.save().signature,b.save().signature)}
 const broken=structuredClone(snapshot);broken.state.gold=1_000_000;
 assert.throws(()=>DungeonRuntime.restore(broken),/checksum mismatch/);
});
test('public data is bounded and privacy safe under stress',()=>{
 const game=DungeonRuntime.create('release-qa');
 for(let i=0;i<1800;i++){
  const s=game.step();if(i%20===0){assertDungeonState(game.state);assert.ok(s.events.length<=9);assert.ok(s.units.length<=18);assert.ok(s.relics.length<=6)}
 }
 const view=game.publicState();
 assert.equal(view.seed,undefined);assert.equal(view.rng,undefined);
 assert.ok(!JSON.stringify(view).includes('release-qa'));
 assert.ok(view.run>=1&&view.floor>=1);
});

test('boss announces the real three-beat footprint and hits only heroes still on marked stone',()=>{
 const game=DungeonRuntime.create('boss-telegraph-fixture');
 const s=game.state,boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 const path=shortestPath(s.map,{x:1,z:1},s.exit);
 assert.ok(boss&&hero&&path.length>2);
 const adjacent=path[path.length-2];hero.x=adjacent.x;hero.z=adjacent.z;s.tick=2;
 const first=game.step(),warning=first.events.find(e=>e.kind==='telegraph'&&e.tick===3);
 assert.ok(warning,'the 3-step nova must warn at the start of its real escape horizon');
 assert.equal(first.bossWarning?.turnsUntilImpact,3);
 const footprint=first.bossWarning.cells.map(p=>p.x+','+p.z).sort();
 for(let remaining=2;remaining>=1;remaining--){
  const next=game.step();
  assert.equal(next.bossWarning?.turnsUntilImpact,remaining);
  assert.deepEqual(next.bossWarning.cells.map(p=>p.x+','+p.z).sort(),footprint,
   'the real warned tiles must not slide under autonomous feet');
 }
 const hp=hero.hp,impact=game.step();
 const strike=impact.events.find(e=>/The Warden nova shockwave struck/.test(e.text));
 assert.ok(strike,'a warning must resolve to the real authority-controlled nova');
 const marked=footprint.includes(hero.x+','+hero.z);
 if(marked)assert.ok(hero.hp<hp||hero.guardTick===s.tick,'remaining on a marked tile has a real cost');
 else assert.equal(hero.hp,hp,'a successful legal three-beat dodge must avoid nova damage');
 assertDungeonState(s);
});
test('autonomous unit actions are exposed as bounded, public animation semantics',()=>{
 const game=DungeonRuntime.create('character-motion-probe');
 let observedMovement=false,observedAttack=false;
 for(let i=0;i<240;i++){const view=game.step();
  for(const unit of view.units){
   if(unit.action==='move')observedMovement=true;
   if(unit.action==='attack'||unit.action==='cast')observedAttack=true;
   assert.ok(['idle','move','attack','cast','hurt','guard'].includes(unit.action));
   assert.equal(unit.actionTick,view.tick);
  }
 }
 assert.equal(observedMovement,true);assert.equal(observedAttack,true);
});

test('procedural chambers diversify geometry and guarantee a spacious boss courtyard',()=>{
 for(let i=0;i<40;i++){const game=DungeonRuntime.create('sanctuary-'+i),s=game.state;
  let openNear=0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const x=s.exit.x+dx,z=s.exit.z+dz;if(x>0&&x<MAP_SIZE-1&&z>0&&z<MAP_SIZE-1&&s.map[z][x]==='.')openNear++}
  assert.ok(openNear>=4,'Warden courtyard must be wider than a corridor');
  const rooms=s.map.join('\\n').match(/\.\.\./g)||[];
  assert.ok(rooms.length>=3,'sanctuary rooms should introduce wider floor plans');
  assertDungeonState(s);
 }
});

test('interactive traps are deterministic and can hurt or be disarmed by autonomous heroes',()=>{
 const game=DungeonRuntime.create('trap-interaction-fixture'),s=game.state;
 assert.ok(s.traps.length>=2);
 const vanguard=s.units.find(u=>u.id==='vanguard'),boss=s.units.find(u=>u.kind==='warden');
 const next=shortestPath(s.map,vanguard,boss)[0];assert.ok(next);
 const trap=s.traps[0];trap.x=next.x;trap.z=next.z;trap.active=true;
 const before=vanguard.hp;const t=game.step();
 // Better autonomous footwork may now deliberately avoid the visible hazard.
 // If it occupies the tile it must actually be hurt; otherwise the trap lives.
 if(vanguard.x===trap.x&&vanguard.z===trap.z){
  assert.ok(vanguard.hp<before);
  assert.equal(trap.active,false);assert.equal(trap.cooldown,11);
  assert.ok(t.events.some(e=>e.kind==='trap'));
 }else assert.equal(trap.active,true,'avoided hazards cannot fire through empty floor');
 const restore=DungeonRuntime.restore(game.save());assert.deepEqual(restore.publicState(),game.publicState());
 // A deliberate hold-on-hazard fixture proves damage still works when no
 // sidestep occurs. It does not rewrite authority or bypass the real step.
 const forced=DungeonRuntime.create('trap-occupied-contact-fixture'),forcedState=forced.state;
 const fighter=forcedState.units.find(u=>u.id==='vanguard'),guardian=forcedState.units.find(u=>u.kind==='warden');
 for(const u of forcedState.units)if(u!==fighter&&u!==guardian)u.hp=0;
 guardian.x=2;guardian.z=1;
 const hazard=forcedState.traps[0];hazard.x=fighter.x;hazard.z=fighter.z;hazard.active=true;
 const fighterHp=fighter.hp,impact=forced.step();
 assert.ok(fighter.hp<fighterHp);
 assert.equal(hazard.active,false);assert.equal(hazard.cooldown,11);
 assert.ok(impact.events.some(e=>e.kind==='trap'));
 assertDungeonState(forcedState);
 const other=DungeonRuntime.create('trap-disarm-fixture'),q=other.state,ranger=q.units.find(u=>u.kind==='ranger');
 const qtrap=q.traps[0];ranger.x=qtrap.x;ranger.z=qtrap.z;q.tick=3;
 other.step();
 assert.equal(qtrap.disarmed,true,'ranger must choose to disable a nearby trap');
 assert.ok(q.events.some(e=>e.kind==='disarm'));
});

test('authored CC0 model manifest is pinned, bounded and path-safe',()=>{
 const manifest=require('../../games/ai-dungeon/assets/manifest.json');
 assert.equal(manifest.license,'CC0-1.0');
 assert.match(manifest.revision,/^[a-f0-9]{40}$/);
 assert.ok(manifest.assets.filter(a=>a.target.endsWith('.glb')).length>=6);
 for(const file of manifest.assets){
  assert.match(file.target,/^(player|enemy|environment)\/[\w-]+\.(glb|png)$/);
  assert.match(file.blobSha,/^[a-f0-9]{40}$/);
  assert.ok(file.size>0&&file.size<8*1024*1024);
  assert.ok(file.sourcePath.startsWith('assets/'));
 }
});

test('unattended host writes atomic verified checkpoints and resumes the exact expedition',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const {createHost}=require('../../scripts/serve-dungeon-stream.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'edutu-dungeon-'));
 const stateFile=path.join(dir,'checkpoint.json');
 try{
  const a=createHost('durability-fixture',{stateFile});
  for(let i=0;i<37;i++)a.tick();
  a.flush();
  assert.ok(fs.statSync(stateFile).size>2000);
  assert.equal(fs.statSync(stateFile).mode&0o777,0o600);
  const before=a.game.save(),b=createHost('durability-fixture',{stateFile});
  assert.equal(b.status().restored,true);assert.equal(b.status().checkpointTick,37);
  assert.deepEqual(before,b.game.save());
  for(let i=0;i<40;i++){a.tick();b.tick();assert.equal(a.game.publicState().checksum,b.game.publicState().checksum)}
  assert.throws(()=>createHost('wrong-seed',{stateFile}),/seed mismatch/);
  const corrupted=JSON.parse(fs.readFileSync(stateFile,'utf8'));corrupted.state.gold+=999;
  fs.writeFileSync(stateFile,JSON.stringify(corrupted));
  assert.throws(()=>createHost('durability-fixture',{stateFile}),/checksum mismatch/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('autonomous Warden warning causes a tangible defensive response instead of unavoidable damage',()=>{
 const game=DungeonRuntime.create('defensive-ai-gauntlet'),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 // Authoritative telegraph was emitted on tick 4; tick 5 is the reaction turn,
 // and tick 6 is the attack. Both are under actual game rules.
 hero.x=boss.x;hero.z=boss.z;s.tick=4;
 const before=hero.hp;
 const reaction=game.step();
 assert.ok(hero.action==='guard'||hero.action==='move');
 assert.ok(reaction.events.some(e=>e.kind==='guard'||e.kind==='evade'));
 const wasGuarding=hero.guardTick===s.tick+1;
 game.step();
 if(wasGuarding)assert.ok(hero.hp>=before-20,'guard absorbs majority of Warden shockwave');
 assertDungeonState(s);
});

test('true boss contact exposes the actual victim ID for audiovisual impact',()=>{
 const game=DungeonRuntime.create('true-target-melee-candidate'),s=game.state;
 const hero=s.units.find(u=>u.id==='vanguard'),boss=s.units.find(u=>u.kind==='warden');
 for(const foe of s.units.filter(u=>u.faction==='enemy'&&u.id!==boss.id))foe.hp=0;
 const path=shortestPath(s.map,{x:1,z:1},boss);assert.ok(path.length>2);
 hero.x=path[path.length-2].x;hero.z=path[path.length-2].z;
 const hp=boss.hp,view=game.step();
 assert.equal(hero.targetId,boss.id);assert.ok(boss.hp<hp);
 assert.equal(view.units.find(u=>u.id===hero.id).targetId,boss.id);
 assert.deepEqual(DungeonRuntime.restore(game.save()).publicState(),game.publicState());
});
test('nearby minions become actual expedition fights before the distant Warden',()=>{
 const game=DungeonRuntime.create('tactical-interception-candidate'),s=game.state;
 const hero=s.units.find(u=>u.id==='vanguard'),boss=s.units.find(u=>u.kind==='warden');
 const path=shortestPath(s.map,hero,boss);assert.ok(path.length>8);
 const minion=s.units.find(u=>u.kind==='revenant');assert.ok(minion);
 for(const foe of s.units.filter(u=>u.faction==='enemy'&&u!==boss&&u!==minion))foe.hp=0;
 minion.x=path[3].x;minion.z=path[3].z;
 let observed=false;
 const initialMinionHp=minion.hp;
 for(let i=0;i<18;i++){
  game.step();
  if(minion.hp<initialMinionHp||s.units.some(u=>u.faction==='party'&&u.targetId===minion.id)){
   observed=true;break;
  }
 }
 assert.equal(observed,true,'the actual party should engage and weaken the local minion before the distant Warden');
 assertDungeonState(s);
});

test('the real autonomous expedition starts with readable separate protagonists and a multi-lane Warden arena',()=>{
 for(let i=0;i<30;i++){
  const game=DungeonRuntime.create('wide-stage-entrance-'+i),s=game.state;
  const heroes=s.units.filter(u=>u.faction==='party');
  assert.equal(new Set(heroes.map(u=>u.x+','+u.z)).size,3,'distinct legal start poses are real simulation tiles');
  for(const hero of heroes)assert.equal(s.map[hero.z][hero.x],'.');
  for(let z=1;z<=4;z++)for(let x=1;x<=4;x++)
   assert.equal(s.map[z][x],'.','entrance must provide a clear, traversable first confrontation stage');
  assert.ok(s.exit.x>=4&&s.exit.x<MAP_SIZE-4&&s.exit.z>=4&&s.exit.z<MAP_SIZE-4,
   'guardian court must not be clipped into a boundary wall');
  let openCourt=0;
  for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++)
   openCourt+=Number(s.map[s.exit.z+dz][s.exit.x+dx]==='.');
  assert.equal(openCourt,49,'authored final stage must be an actually open seven-tile courtyard');
  assert.ok(shortestPath(s.map,{x:1,z:1},s.exit).length>=12);
  assertDungeonState(s);
  assert.deepEqual(DungeonRuntime.restore(game.save()).publicState(),game.publicState());
 }
});

test('real tactical squad routing avoids ally cells while locating a legal firing lane',()=>{
 const {planTacticalStep,planTacticalDisengage}=require('../../dist/games/ai-dungeon/src/index.js');
 const map=Array.from({length:MAP_SIZE},(_,z)=>z===0||z===MAP_SIZE-1?'#'.repeat(MAP_SIZE):'#'+'.'.repeat(MAP_SIZE-2)+'#');
 const ranger={id:'r',kind:'ranger',faction:'party',x:3,z:5,hp:70,maxHp:70,attack:15,cooldown:0};
 const vanguard={...ranger,id:'v',kind:'vanguard',x:4,z:5};
 const foe={...ranger,id:'e',kind:'revenant',faction:'enemy',x:7,z:5};
 const s={map,units:[ranger,vanguard,foe],traps:[],tick:2};
 const before=JSON.stringify(s),move=planTacticalStep(s,ranger,foe,'engage');
 assert.ok(move&&Math.abs(move.x-ranger.x)+Math.abs(move.z-ranger.z)===1);
 assert.notDeepEqual(move,{x:vanguard.x,z:vanguard.z});
 assert.notDeepEqual(move,{x:foe.x,z:foe.z});
 assert.deepEqual(planTacticalStep(s,ranger,foe,'engage'),move);
 assert.equal(JSON.stringify(s),before,'planner must not mutate an authority snapshot');
 const blade={...foe,id:'blade',x:3,z:4};s.units.push(blade);
 const evade=planTacticalDisengage(s,ranger,blade);
 assert.ok(evade&&Math.abs(evade.x-ranger.x)+Math.abs(evade.z-ranger.z)===1);
 assert.ok(Math.abs(evade.x-blade.x)+Math.abs(evade.z-blade.z)>=2);
 assert.equal(planTacticalStep(s,ranger,{x:0,z:0},'engage'),null,'do not path to a solid wall');
});
test('real autonomous fight and traversal keep every living actor in distinct legal world cells',()=>{
 const game=DungeonRuntime.create('physical-autonomous-party-M1');
 let moved=0,fought=0;
 for(let i=0;i<480;i++){
  const before=new Map(game.state.units.filter(u=>u.hp>0).map(u=>[u.id,{x:u.x,z:u.z}]));
  game.step();
  const s=game.state,living=s.units.filter(u=>u.hp>0);
  assert.equal(new Set(living.map(u=>u.x+','+u.z)).size,living.length,'no living actor may occupy another at tick '+s.tick);
  for(const u of living){
   assert.equal(s.map[u.z]?.[u.x],'.');
   const from=before.get(u.id);
   if(from&&(from.x!==u.x||from.z!==u.z))moved++;
   if(u.action==='attack'||u.action==='cast')fought++;
  }
  assertDungeonState(s);
 }
 assert.ok(moved>20&&fought>0,'the squad must continue travelling and actually fighting');
});

test('real Mystic healing spends finite focus instead of granting infinite emergency saves',()=>{
 const game=DungeonRuntime.create('mystic-healing-resolve-M1'),s=game.state;
 const mystic=s.units.find(u=>u.kind==='mystic'),hero=s.units.find(u=>u.id==='vanguard');
 const ranger=s.units.find(u=>u.id==='ranger');
 assert.equal(mystic.focus,5);assert.equal(mystic.maxFocus,5);
 for(const foe of s.units.filter(u=>u.faction==='enemy'))foe.hp=0;
 // Stable, actual adjacent heal contact: walls north/west, occupied walkable
 // east/south. Repose only between artificial clock cycles to isolate the
 // finite resource contract, not during a simulated game step.
 s.map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
 s.map[3]=s.map[3].slice(0,4)+'#'+s.map[3].slice(5);
 s.map[4]=s.map[4].slice(0,3)+'#'+s.map[4].slice(4);
 s.exit={x:16,z:16};s.traps=[];s.relics=[];
 const holdLane=()=>{
  Object.assign(hero,{x:4,z:4,hp:5});
  Object.assign(ranger,{x:5,z:4});
  Object.assign(mystic,{x:4,z:5});
 };
 for(let i=0;i<5;i++){
  s.tick=i*3+2;holdLane();
  const view=game.step();
  assert.equal(mystic.focus,4-i,'authentic heals consume finite real focus');
  assert.ok(view.events.some(e=>e.tick===view.tick&&e.kind==='healing'));
 }
 s.tick=17;holdLane();
 const exhausted=game.step();
 assert.equal(mystic.focus,0);
 assert.equal(hero.hp,5,'the sixth emergency cannot secretly heal without focus');
 assert.ok(!exhausted.events.some(e=>e.tick===exhausted.tick&&e.kind==='healing'));
 assertDungeonState(s);
 assert.deepEqual(DungeonRuntime.restore(game.save()).publicState(),game.publicState());
});
test('an authentic relic on the living Mystic restores exactly one spent healing focus',()=>{
 const game=DungeonRuntime.create('mystic-relic-recharge-M1'),s=game.state;
 const mystic=s.units.find(u=>u.kind==='mystic'),hero=s.units.find(u=>u.id==='vanguard');
 for(const foe of s.units.filter(u=>u.faction==='enemy'))foe.hp=0;
 mystic.focus=1;hero.hp=5;s.tick=2;
 assert.ok(s.relics.length);
 s.relics[0].x=mystic.x;s.relics[0].z=mystic.z;
 const view=game.step();
 assert.equal(mystic.focus,1,'one earned true relic replaces the single healing charge spent this turn');
 assert.ok(view.events.some(e=>e.tick===view.tick&&e.kind==='healing'));
 assert.ok(view.events.some(e=>e.tick===view.tick&&e.kind==='loot'));
 assertDungeonState(s);
});


test('shadow cultists mark a real tile and a threatened support hero autonomously sidesteps before damage',()=>{
 const game=DungeonRuntime.create('shadow-hex-counterplay'),s=game.state;
 const caster=s.units.find(u=>u.kind==='cultist'),mystic=s.units.find(u=>u.kind==='mystic');
 assert.ok(caster&&mystic);
 for(const foe of s.units.filter(u=>u.faction==='enemy'&&u!==caster))foe.hp=0;
 caster.x=s.exit.x;caster.z=s.exit.z;
 mystic.x=s.exit.x+2;mystic.z=s.exit.z;
 s.tick=3;
 const mark=game.step().cultistWarnings;
 assert.equal(mark.length,1,'a live caster must commit a real impact tile');
 assert.equal(mark[0].targetId,mystic.id);
 assert.equal(mark[0].x,mystic.x);assert.equal(mark[0].z,mystic.z);
 assert.ok(s.events.some(e=>e.kind==='telegraph'&&e.text.includes('SHADOW HEX')));
 const saved=game.save(),copy=DungeonRuntime.restore(saved);
 const beforeHp=mystic.hp;
 game.step();copy.step();
 assert.deepEqual(game.save(),copy.save(),'reaction, impact and replay must match exactly');
 assert.ok(mystic.x!==mark[0].x||mystic.z!==mark[0].z,'support agent must leave marked ground when a legal safe tile exists');
 assert.equal(mystic.hp,beforeHp,'real dodges must prevent the locked hit');
 assert.ok(s.events.some(e=>e.kind==='evade'&&e.text.includes('shadow hex')));
 assert.equal(game.publicState().cultistWarnings.length,0);
 assertDungeonState(s);
});
test('a genuine party attack interrupts a channelled shadow hex before it can resolve',()=>{
 const game=DungeonRuntime.create('shadow-hex-interrupt'),s=game.state;
 const caster=s.units.find(u=>u.kind==='cultist'),mystic=s.units.find(u=>u.kind==='mystic');
 const vanguard=s.units.find(u=>u.kind==='vanguard');
 for(const foe of s.units.filter(u=>u.faction==='enemy'&&u!==caster))foe.hp=0;
 caster.x=s.exit.x;caster.z=s.exit.z;
 mystic.x=s.exit.x+2;mystic.z=s.exit.z;
 s.tick=3;game.step();
 assert.ok(caster.channelUntilTick!==undefined);
 caster.hp=5;vanguard.x=caster.x-1;vanguard.z=caster.z;
 const beforeHp=mystic.hp;game.step();
 assert.equal(caster.hp,0);
 assert.equal(caster.channelUntilTick,undefined);
 assert.ok(s.events.some(e=>e.kind==='interrupt'),'real melee contact must cancel the pending attack');
 assert.equal(mystic.hp,beforeHp,'an interrupted cultist cannot deal phantom damage');
 assertDungeonState(s);
});

test('gauntlet seed 11 cannot stall a living expedition indefinitely after clearing the approach',()=>{
 const game=DungeonRuntime.create('gauntlet-corpus-v1-11'),trace=[];
 for(let i=0;i<900;i++){
  const view=game.step();
  if([300,450,600,750,899].includes(i)){
   const boss=game.state.units.find(u=>u.kind==='warden');
   trace.push({tick:view.tick,floor:view.floor,run:view.run,phase:view.phase,
    boss:boss&&{hp:boss.hp,x:boss.x,z:boss.z,action:boss.action},
    party:game.state.units.filter(u=>u.faction==='party').map(u=>({id:u.id,hp:u.hp,x:u.x,z:u.z,action:u.action,targetId:u.targetId})),
    defenders:game.state.units.filter(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0).length,
    intent:view.intent});
  }
 }
 assert.ok(game.state.floor>1||game.state.run>1,
  '900-tick deadlock in real campaign seed 11: '+JSON.stringify(trace));
 assertDungeonState(game.state);
});

test('squad right-of-way resolves a real one-tile passage without teleportation or ghost overlap',()=>{
 const game=DungeonRuntime.create('right-of-way-physical-fixture'),s=game.state;
 s.map=Array.from({length:MAP_SIZE},(_,z)=>z===1?'#'+'.'.repeat(MAP_SIZE-2)+'#':'#'.repeat(MAP_SIZE));
 s.exit={x:17,z:1};s.relics=[];s.traps=[];s.tick=1;
 for(const u of s.units)if(u.faction==='enemy'&&u.kind!=='warden'){
  u.hp=0;u.x=16;u.z=1;
 }
 const boss=s.units.find(u=>u.kind==='warden');Object.assign(boss,{x:17,z:1});
 const leader=s.units.find(u=>u.id==='vanguard');Object.assign(leader,{x:3,z:1});
 const ranger=s.units.find(u=>u.id==='ranger');Object.assign(ranger,{x:4,z:1});
 const mystic=s.units.find(u=>u.id==='mystic');Object.assign(mystic,{x:2,z:1});
 assert.equal(s.rulesVersion,2,'new expeditions use the explicit new rules contract');
 assertDungeonState(s);
 const mirror=DungeonRuntime.restore(game.save());
 let rangerProgress=false,leaderProgress=false;
 for(let i=0;i<12;i++){
  const before=game.state.units.filter(u=>u.hp>0).map(u=>({id:u.id,x:u.x,z:u.z}));
  const view=game.step();
  assert.equal(view.checksum,mirror.step().checksum,'physical route decision must survive a signed replay');
  const units=game.state.units.filter(u=>u.hp>0);
  assert.equal(new Set(units.map(u=>u.x+','+u.z)).size,units.length,'no living collisions');
  for(const u of units){
   const old=before.find(p=>p.id===u.id);
   assert.ok(!old||Math.abs(u.x-old.x)+Math.abs(u.z-old.z)<=1,'no free extra movement');
  }
  rangerProgress ||= ranger.x>4;leaderProgress ||= leader.x>3;
 }
 assert.ok(rangerProgress&&leaderProgress,'front-line blocker must yield so both heroes progress in the same real corridor');
 assertDungeonState(game.state);
});

test('legacy v0.5.0 signed runs retain legacy AI until an explicit new-run migration',()=>{
 const {checksum}=require('../../dist/packages/replay/src/index.js');
 const fresh=DungeonRuntime.create('rules-compatibility-expedition');
 const legacy=fresh.save();delete legacy.state.rulesVersion;legacy.version='0.5.0';
 legacy.signature=checksum({seed:legacy.seed,rng:legacy.rng,state:legacy.state});
 const restored=DungeonRuntime.restore(legacy),mirror=DungeonRuntime.restore(legacy);
 assert.equal(restored.state.rulesVersion,undefined,'old run must not silently switch tactical outcomes');
 for(let i=0;i<36;i++)assert.equal(restored.step().checksum,mirror.step().checksum);
 assert.equal(restored.save().version,'0.6.0');
 assert.equal(restored.state.rulesVersion,undefined);
 const expired=restored.save();expired.version='0.4.0';
 assert.throws(()=>DungeonRuntime.restore(expired),/Unsupported dungeon gameplay version/);
 const damaged=structuredClone(legacy);damaged.state.gold++;
 assert.throws(()=>DungeonRuntime.restore(damaged),/checksum mismatch/);
 // An explicitly new run is the first safe rules boundary, never an in-fight retrofit.
 restored.state.phase='intermission';restored.state.intermission=1;
 const next=restored.step();
 assert.equal(next.run,2);assert.equal(restored.state.rulesVersion,2);
 assert.equal(DungeonRuntime.restore(restored.save()).state.rulesVersion,2);
});

const {wardenSealActive}=require('../../dist/games/ai-dungeon/src/index.js');
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
 // Warden retaliation may overwrite the hero's final animation action; the
 // real boss HP loss and attacker's target ID remain authoritative.
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

function mysticDistanceFixture(rules=2,{wall=false,near=false}={}){
 const game=DungeonRuntime.create('mystic-legal-heal-lane'),s=game.state;
 s.map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
 s.exit={x:16,z:16};s.relics=[];s.traps=[];s.tick=2;
 for(const enemy of s.units.filter(u=>u.faction==='enemy'))enemy.hp=0;
 const healer=s.units.find(u=>u.id==='mystic');
 const target=s.units.find(u=>u.id==='vanguard');
 const ranger=s.units.find(u=>u.id==='ranger');
 Object.assign(healer,{x:3,z:3,hp:healer.maxHp,focus:3,maxFocus:5});
 Object.assign(target,{x:near?5:11,z:3,hp:9});
 Object.assign(ranger,{x:2,z:2,hp:ranger.maxHp});
 if(wall)s.map[3]=s.map[3].slice(0,4)+'#'+s.map[3].slice(5);
 if(rules===1)delete s.rulesVersion;
 assertDungeonState(s);
 return {game,s,healer,target};
}

test('v2 Mystic cannot heal a gravely wounded ally across distant rooms; must move one legal tile toward a real heal lane',()=>{
 const {game,s,healer,target}=mysticDistanceFixture();
 const previous={focus:healer.focus,hp:target.hp,x:healer.x,z:healer.z};
 const mirror=DungeonRuntime.restore(game.save());
 const result=game.step();
 assert.equal(result.checksum,mirror.step().checksum);
 assert.equal(target.hp,previous.hp,'distant healing must not teleport through the dungeon');
 assert.equal(healer.focus,previous.focus,'no charges spent for an out-of-range heal');
 assert.equal(Math.abs(healer.x-previous.x)+Math.abs(healer.z-previous.z),1,'healer should spend one honest repositioning step');
 assert.equal(healer.action,'move');
 assertDungeonState(s);
});

test('v2 urgent heal requires an actual unobstructed three-cell healing lane',()=>{
 const blocked=mysticDistanceFixture(2,{near:true,wall:true});
 const hp=blocked.target.hp,focus=blocked.healer.focus;
 const mirror=DungeonRuntime.restore(blocked.game.save());
 const result=blocked.game.step();
 assert.equal(result.checksum,mirror.step().checksum);
 assert.equal(blocked.target.hp,hp,'heal cannot pass through solid stone');
 assert.equal(blocked.healer.focus,focus,'blocked spells cannot consume a charge or restore HP');
 assertDungeonState(blocked.s);
 const clear=mysticDistanceFixture(2,{near:true});
 const before=clear.target.hp,f=clear.healer.focus;
 const next=clear.game.step();
 assert.ok(clear.target.hp>before,'genuine nearby clear lane should resolve a real heal');
 assert.equal(clear.healer.focus,f-1);
 assert.ok(next.events.some(e=>e.tick===next.tick&&e.kind==='healing'));
});

test('legacy restored Mystic retains old in-run healing rules while v2 restricts reach',()=>{
 const {game,s,healer,target}=mysticDistanceFixture(1);
 const saved=game.save(),oldHp=target.hp,oldFocus=healer.focus;
 const replay=DungeonRuntime.restore(saved);
 game.step();replay.step();
 assert.ok(target.hp>oldHp,'signed legacy run must not change decisions mid-expedition');
 assert.equal(healer.focus,oldFocus-1);
 assert.equal(s.rulesVersion,undefined);
 assert.deepEqual(game.save(),replay.save());
});

function provisionedPortalFixture({gold=82,rangerHp=2,legacy=false}={}){
 const game=DungeonRuntime.create('v2-earned-respite-supplies'),s=game.state;
 const vanguard=s.units.find(u=>u.id==='vanguard');
 const ranger=s.units.find(u=>u.id==='ranger');
 for(const foe of s.units.filter(u=>u.faction==='enemy'))foe.hp=0;
 Object.assign(vanguard,{x:s.exit.x+1,z:s.exit.z,hp:vanguard.maxHp});
 Object.assign(ranger,{x:s.exit.x,z:s.exit.z,hp:rangerHp});
 s.relics=[];s.gold=gold;s.tick=3;
 if(legacy)delete s.rulesVersion;
 assertDungeonState(s);
 return {game,s,ranger};
}

test('earned gold becomes one real bounded automatic medical supply decision at a cleared portal',()=>{
 const {game,ranger}=provisionedPortalFixture();
 const saved=game.save(),mirror=DungeonRuntime.restore(saved);
 const view=game.step();
 assert.equal(view.checksum,mirror.step().checksum);
 assert.equal(view.floor,2);
 assert.equal(view.rulesVersion,2);
 assert.equal(view.gold,22,'60 actually earned gold must be deducted from the signed expedition');
 assert.equal(view.units.find(u=>u.id==='ranger').hp,50,
  'actual 26 HP respite plus 22 paid HP, not a free full heal');
 assert.ok(view.events.some(e=>e.tick===view.tick&&e.kind==='provision'&&e.text.includes('ranger')),
  'the choice and its cost must be visible in actual authoritative events');
 assertDungeonState(game.state);
});

test('expedition supplies cannot be fabricated when gold is short or no health is needed',()=>{
 for(const settings of [{gold:59,rangerHp:2},{gold:82,rangerHp:65}]){
  const {game}=provisionedPortalFixture(settings),start=game.state.gold;
  const view=game.step();
  assert.equal(view.floor,2);
  assert.equal(view.gold,start);
  assert.ok(!view.events.some(e=>e.tick===view.tick&&e.kind==='provision'));
  assertDungeonState(game.state);
 }
});

test('legacy signed expeditions retain their unspent-gold semantics across a normal floor',()=>{
 const {game}=provisionedPortalFixture({legacy:true});
 const copy=DungeonRuntime.restore(game.save()),view=game.step();
 assert.equal(view.checksum,copy.step().checksum);
 assert.equal(view.rulesVersion,1);
 assert.equal(view.floor,2);
 assert.equal(view.gold,82);
 assert.equal(view.units.find(u=>u.id==='ranger').hp,28);
 assert.ok(!view.events.some(e=>e.kind==='provision'));
});

test('session-7 declared holdout campaign records genuine new-rule tactical decisions and replay across eight seeds',()=>{
 const seeds=Array.from({length:8},(_,i)=>'dungeon-s7-holdout-v2-'+i);
 const totals={seeds:seeds.length,ticksPerSeed:600,floorAdvances:0,restarts:0,
  warningEvents:0,healingEvents:0,interruptEvents:0,provisionEvents:0,
  evadeEvents:0,formationEvents:0,legalMovementTicks:0};
 const runs=[];
 for(const seed of seeds){
  const game=DungeonRuntime.create(seed),mirror=DungeonRuntime.create(seed);
  let lastFloor=1,lastRun=1,localMoves=0,localWarnings=0;
  for(let i=0;i<600;i++){
   const previous=new Map(game.state.units.filter(u=>u.hp>0).map(u=>
    [u.id,{x:u.x,z:u.z}]));
   const beforeFloor=game.state.floor,beforeRun=game.state.run;
   const result=game.step(),replay=mirror.step();
   assert.equal(result.rulesVersion,2,'holdout trials must evaluate the new rules only');
   assert.equal(result.checksum,replay.checksum,'seed '+seed+' tick '+result.tick);
   if(result.floor===beforeFloor&&result.run===beforeRun){
    const living=result.units.filter(u=>u.hp>0);
    assert.equal(new Set(living.map(u=>u.x+','+u.z)).size,living.length,
     'living combatants cannot occupy the same real tile in '+seed+' tick '+result.tick);
    for(const u of living){
     const p=previous.get(u.id);
     if(!p)continue;
     const moved=Math.abs(p.x-u.x)+Math.abs(p.z-u.z);
     assert.ok(moved<=1,'no off-grid teleport '+seed+' '+u.id+' at '+result.tick);
     if(moved===1){localMoves++;totals.legalMovementTicks++;}
    }
   }
   totals.floorAdvances+=result.floor!==lastFloor&&result.floor>lastFloor?1:0;
   totals.restarts+=result.run-lastRun;
   lastFloor=result.floor;lastRun=result.run;
   for(const e of result.events.filter(e=>e.tick===result.tick)){
    if(e.kind==='telegraph'){totals.warningEvents++;localWarnings++;}
    if(e.kind==='healing')totals.healingEvents++;
    if(e.kind==='interrupt')totals.interruptEvents++;
    if(e.kind==='provision')totals.provisionEvents++;
    if(e.kind==='evade')totals.evadeEvents++;
    if(e.kind==='formation')totals.formationEvents++;
   }
   if(i%120===0){
    assertDungeonState(game.state);
    assert.deepEqual(DungeonRuntime.restore(game.save()).save(),game.save());
   }
  }
  runs.push({seed,floor:lastFloor,run:lastRun,legalMovementTicks:localMoves,
   warningEvents:localWarnings});
 }
 assert.ok(totals.legalMovementTicks>0&&totals.warningEvents>0,
  'a genuine seed cohort must include movement and Warden or elite warnings');
 console.log('DUNGEON_S7_HOLDOUT_TRACE '+JSON.stringify({totals,runs}));
});

test('public replay checksum distinguishes identical positions running different deterministic rule versions',()=>{
 const {checksum}=require('../../dist/packages/replay/src/index.js');
 const next=DungeonRuntime.create('v2-public-checksum-rule-contract');
 const previous=next.save();
 delete previous.state.rulesVersion;
 previous.version='0.5.0';
 previous.signature=checksum({seed:previous.seed,rng:previous.rng,state:previous.state});
 const legacy=DungeonRuntime.restore(previous),v2=DungeonRuntime.restore(next.save());
 assert.equal(legacy.state.rulesVersion,undefined);
 assert.equal(v2.state.rulesVersion,2);
 const a=v2.publicState(),b=legacy.publicState();
 assert.equal(a.tick,b.tick);
 assert.deepEqual(a.units,b.units,'initial world and bodies are intentionally identical');
 assert.notEqual(a.checksum,b.checksum,
  'different authoritative rules must never publish identical replay identity');
 assert.equal(legacy.publicState().checksum,b.checksum,'older public checksums remain stable');
 for(let i=0;i<24;i++){
  const latest=DungeonRuntime.restore(v2.save());
  assert.equal(v2.step().checksum,latest.step().checksum);
 }
});
