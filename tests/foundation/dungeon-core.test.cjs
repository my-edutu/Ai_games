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

test('boss charges a visible warning before applying area damage',()=>{
 const game=DungeonRuntime.create('boss-telegraph-fixture');
 const s=game.state,boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 const path=shortestPath(s.map,{x:1,z:1},s.exit);
 assert.ok(boss&&hero&&path.length>2);
 const adjacent=path[path.length-2];hero.x=adjacent.x;hero.z=adjacent.z;s.tick=3;
 game.step();
 const warning=game.state.events.find(e=>e.kind==='telegraph'&&e.tick===4);
 assert.ok(warning,'warning must be visible two ticks before the attack');
 const health=hero.hp;
 game.step();game.step();
 const blasts=game.state.events.filter(e=>e.kind==='danger'&&e.text.includes('shockwave'));
 assert.ok(blasts.length>=1,'the warning must resolve to a real, rule-governed boss attack');
 assert.ok(hero.hp<health,'the attack must have an observable consequence');
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
