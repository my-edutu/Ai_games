'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const mod=async()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-staging-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
};
const u=(id,kind,faction,x=3,z=3,hp=40)=>({id,kind,faction,x,z,hp,action:'idle',actionTick:7});
const floor=()=>Array.from({length:7},()=>'.'.repeat(7));
test('three genuine co-located party actors receive distinct bounded within-tile visible poses',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod(),units=[u('ranger','ranger','party'),u('vanguard','vanguard','party'),u('mystic','mystic','party')];
 const state=Object.freeze({tick:7,map:floor(),units});
 const original=JSON.stringify(state),poses=planCombatStage(state);
 assert.equal(Object.keys(poses).length,3);
 const points=Object.values(poses);
 assert.ok(points.every(p=>p.crowded&&Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.0001));
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)
  assert.ok(Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z)>.35);
 assert.equal(JSON.stringify(state),original,'staging must never affect authoritative movement/combat');
 assert.deepEqual(planCombatStage({...state,units:[...units].reverse()}),poses,'stable across snapshot iteration order');
});
test('solo characters remain centred; same-tick killed targets retain their true contact location',async()=>{
 const {planCombatStage,stagePoint}=await mod();
 const hero=u('hero','vanguard','party',1,1),enemy=u('enemy','cultist','enemy',1,1,0);
 enemy.action='hurt';enemy.actionTick=7;
 const s={tick:7,map:floor(),units:[hero,enemy]};
 let points=planCombatStage(s);assert.ok(points.hero.crowded&&points.enemy.crowded);
 assert.notDeepEqual(stagePoint(points,hero),stagePoint(points,enemy));
 enemy.actionTick=6;points=planCombatStage(s);
 assert.equal(points.hero.x,1);assert.equal(points.hero.z,1);
 assert.equal(Object.hasOwn(points,'enemy'),false);
 assert.deepEqual(stagePoint(points,{id:'stranger',x:4,z:4}),{x:4,z:4,dx:0,dz:0,crowded:false});
 assert.equal(stagePoint(points,null),null);
});
test('living Warden confrontations produce an original readable inside-cell dueling line, not authority dodges',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 const boss=u('warden','warden','enemy',4,3,200);
 const hero=u('vanguard','vanguard','party',3,3,100);
 const ranger=u('ranger','ranger','party',3,4,80);
 const far=u('mystic','mystic','party',1,1,70);
 const s={tick:7,map:floor(),units:[boss,hero,ranger,far]};
 const frozen=JSON.stringify(s),plan=planCombatStage(s);
 assert.equal(plan.warden.x,4);
 assert.equal(plan.warden.z,3,'the boss always holds its actual map tile centre');
 assert.ok(plan.vanguard.dx<-.18&&plan.vanguard.dz===0,'the real melee hero stands back to show the opponent');
 assert.ok(plan.ranger.dx<0&&plan.ranger.dz>0,'a second defender remains visible on its own real tile');
 assert.equal(plan.mystic.x,1);
 assert.equal(plan.mystic.z,1,'distant allies do not shuffle for a fake duel');
 assert.ok(Object.values(plan).every(p=>Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.001));
 assert.equal(JSON.stringify(s),frozen,'staging may never touch the simulation or attack reach');
 boss.hp=0;
 const after=planCombatStage(s);
 assert.equal(after.vanguard.x,3);
 assert.equal(after.vanguard.z,3,'after the real Warden dies, cosmetic retreat clears immediately');
});

test('invalid, blocked and oversized snapshots cannot create off-grid or unbounded visual actors',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 const blocked=floor();blocked[3]='...#...';
 const units=Array.from({length:28},(_,i)=>u('actor-'+i,'revenant','enemy',3,3));
 assert.equal(Object.keys(planCombatStage({tick:7,map:blocked,units})).length,0);
 const valid=planCombatStage({tick:7,map:floor(),units});
 assert.ok(Object.keys(valid).length<=18);
 for(const p of Object.values(valid))assert.ok(Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.0001);
 assert.equal(Object.keys(planCombatStage(null)).length,0);
});
test('real rendered actors and real authority-based combat effects share the staging plan',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const combat=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/const stagePositions=planCombatStage\(s,camera\.position\)/);
 assert.match(app,/stagePoint\(stagePositions,u\)/);
 assert.match(combat,/stagePositions=planCombatStage\(s,viewPosition\)/);
 assert.match(combat,/stagedArcFrame\(/);
 assert.match(combat,/from:stagePoint\(stagePositions,u\)/);
 assert.ok(host.includes("['/dungeon/combat-staging-plan.js','combat-staging-plan.js']"));
});
test('cranial model diagnostics report every genuine actor instead of silently truncating at eight',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/rigCranialRatios:authored\.filter\(.+?\.slice\(0,18\)/);
});

// One real legal cell can hold the whole party at spawn. The spectator must
// resolve their silhouettes against the CURRENT camera while all grid data
// remains identical, and the actual attack effects must share those offsets.
test('three overlapping real heroes form a legible camera-facing line entirely within one legal tile',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 const units=[u('vanguard','vanguard','party'),u('ranger','ranger','party'),u('mystic','mystic','party')];
 const s={tick:7,map:floor(),units},original=JSON.stringify(s);
 for(const view of [{x:6,z:8},{x:-6,z:5},{x:0,z:-7}]){
  const pose=planCombatStage(s,view),line=units.map(unit=>pose[unit.id]);
  const forward={x:view.x-0,z:view.z-0},length=Math.hypot(forward.x,forward.z);
  const right={x:forward.z/length,z:-forward.x/length};
  const projected=line.map(p=>p.dx*right.x+p.dz*right.z).sort((a,b)=>a-b);
  assert.ok(projected[2]-projected[0]>=.75,"actual camera view must separate crowded silhouettes");
  assert.ok(projected[1]-projected[0]>=.32&&projected[2]-projected[1]>=.32);
  for(const p of line){assert.ok(Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.0001);assert.ok(Math.abs(p.dx)<.45&&Math.abs(p.dz)<.45);}
  assert.deepEqual(planCombatStage({...s,units:units.slice().reverse()},view),pose);
 }
 assert.equal(JSON.stringify(s),original);
});
test('rig characters and truth-locked blade origins consume exactly the same camera-staged public snapshot',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const combat=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 assert.match(app,/const stagePositions=planCombatStage\(s,camera\.position\)/);
 assert.match(app,/combatDirector\.accept\(s,camera\.position\)/);
 assert.match(combat,/function accept\(s,viewPosition=null\)/);
 assert.match(combat,/stagePositions=planCombatStage\(s,viewPosition\)/);
});

test('earned Warden recovery opens a real two-body counter lane without moving either legal grid position',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 const boss=u('warden','warden','enemy',4,3,200);
 const vanguard=u('vanguard','vanguard','party',3,3,100);
 const s={tick:7,map:floor(),units:[boss,vanguard],bossRecovery:{remaining:3},guardianWard:false,bossWarning:null};
 const original=JSON.stringify(s),open=planCombatStage(s,{x:2,z:4});
 assert.ok(open.warden.dx>.35,'the vulnerable boss should visibly recoil away from a real melee hero');
 assert.ok(open.vanguard.dx<-.18,'the hero still occupies a clearly readable near-side legal cell');
 assert.ok(open.warden.x-open.vanguard.x>1.55,'the true counter opens a visually readable physical lane');
 assert.ok(Object.values(open).every(p=>Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.001));
 assert.equal(JSON.stringify(s),original,'recoil must not change game state, RNG, hp, collision or attacks');
 assert.equal(planCombatStage({...s,bossWarning:{attackTick:8,cells:[{x:3,z:3}]}}).warden.dx,0,
  'imminent real lethal warning must keep boss centered on its actual marked tile');
 assert.equal(planCombatStage({...s,guardianWard:true}).warden.dx,0,'sealed Warden cannot recoil');
 assert.equal(planCombatStage({...s,bossRecovery:{remaining:0}}).warden.dx,0,'no fake recoveries');
 assert.equal(planCombatStage({...s,bossRecovery:{remaining:7}}).warden.dx,0,'out-of-range recovery is invalid');
 assert.equal(planCombatStage({...s,units:[boss]}).warden.dx,0,'a boss with no living hero cannot move for the camera');
});

test('four and six legal co-located combatants separate into reproducible camera-oriented ensembles',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 for(const count of [4,6]){
  const units=Array.from({length:count},(_,i)=>u('co'+i,i%2?'cultist':'vanguard',i%2?'enemy':'party',3,3));
  const state={tick:7,map:floor(),units},before=JSON.stringify(state);
  const front=planCombatStage(state,{x:6,z:4}),side=planCombatStage(state,{x:4,z:6});
  assert.deepEqual(front,planCombatStage({...state,units:units.slice().reverse()},{x:6,z:4}));
  assert.notDeepEqual(front,side);
  const points=Object.values(front);
  assert.ok(points.every(p=>p.crowded&&Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.0001));
  assert.ok(points.every(p=>Math.hypot(p.dx,p.dz)>=.34),'no central toy-like overlap');
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)
   assert.ok(Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z)>.22);
  assert.equal(JSON.stringify(state),before,'no authoritative collision or attack change');
 }
});


// M1 original camera-facing frontline: heroes face real enemies as a visual
// ensemble without fake movement, invented combat or crossed cell boundaries.
test('true crowded mixed-faction combat stages a nearer hero rank with separated silhouettes',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 for(const n of [4,5,6]){
  const units=Array.from({length:n},(_,i)=>u('clash'+i,i<Math.ceil(n/2)?'vanguard':'cultist',i<Math.ceil(n/2)?'party':'enemy',3,3));
  const snapshot={tick:7,map:floor(),units},frozen=JSON.stringify(snapshot);
  const view={x:7,z:3},poses=planCombatStage(snapshot,view);
  const heroes=units.filter(actor=>actor.faction==='party').map(actor=>poses[actor.id]);
  const enemies=units.filter(actor=>actor.faction==='enemy').map(actor=>poses[actor.id]);
  assert.ok(heroes.every(p=>Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.001));
  assert.ok(enemies.every(p=>Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.001));
  assert.ok(heroes.reduce((sum,p)=>sum+p.dx,0)/heroes.length>
   enemies.reduce((sum,p)=>sum+p.dx,0)/enemies.length,'legible near-to-far front line');
  for(const a of Object.values(poses))for(const b of Object.values(poses)){
   if(a!==b)assert.ok(Math.hypot(a.dx-b.dx,a.dz-b.dz)>.22,'actual unit bodies stay visually separated');
  }
  assert.equal(JSON.stringify(snapshot),frozen);
  assert.deepEqual(poses,planCombatStage({...snapshot,units:units.toReversed()},view));
 }
});

test('real cardinal cross-cell melee skirmishes do not stack opposing rigs in camera space',async()=>{
 const {planCombatStage,MAX_STAGE_OFFSET}=await mod();
 const hero=u('hero','vanguard','party',3,3,80),foe=u('foe','cultist','enemy',4,3,60);
 const state={tick:7,map:floor(),units:[foe,hero]},before=JSON.stringify(state);
 const camera={x:7,z:0},pose=planCombatStage(state,camera);
 const right={x:0,z:-1};
 const gap=Math.abs((pose.foe.x-pose.hero.x)*right.x+(pose.foe.z-pose.hero.z)*right.z);
 assert.ok(gap>.48,'true adjacent enemies should project as distinct combat silhouettes');
 assert.ok(pose.hero.crowded&&pose.foe.crowded);
 for(const [unit,point] of [[hero,pose.hero],[foe,pose.foe]]){
  assert.ok(Math.hypot(point.dx,point.dz)<=MAX_STAGE_OFFSET+.0001);
  assert.ok(Math.abs(point.x-unit.x)<.45&&Math.abs(point.z-unit.z)<.45);
 }
 assert.deepEqual(pose,planCombatStage({...state,units:[hero,foe]},camera),
  'no snapshot iteration order affects true contact visuals');
 assert.equal(JSON.stringify(state),before,'spectator staging does not touch AI combat or replay');
 const noCamera=planCombatStage(state);
 assert.deepEqual([noCamera.hero.dx,noCamera.hero.dz,noCamera.foe.dx,noCamera.foe.dz],[0,0,0,0],
  'a camera-free authoritative snapshot must not invent movement');
});

test('actual Warden warning and exposed boss choreography outrank cross-cell camera separation',async()=>{
 const {planCombatStage}=await mod();
 const hero=u('hero','vanguard','party',3,3,80),foe=u('foe','cultist','enemy',4,4,60);
 const warden=u('warden','warden','enemy',5,4,150);
 const state={tick:7,map:floor(),units:[hero,foe,warden],
  bossWarning:{attackTick:8,cells:[{x:3,z:3}]}};
 const poses=planCombatStage(state,{x:7,z:7});
 assert.deepEqual([poses.hero.dx,poses.hero.dz,poses.foe.dx,poses.foe.dz,poses.warden.dx,poses.warden.dz],
  [0,0,0,0,0,0],'general crowd correction cannot distort boss telegraphs');
});

test('a still-living but geographically distant Warden does not silence ordinary cross-cell skirmish staging',async()=>{
 const {planCombatStage}=await mod();
 const party=u('hero','vanguard','party',3,3,80),cultist=u('cultist','cultist','enemy',4,3,80);
 const distantBoss=u('warden','warden','enemy',0,0,200);
 const state={tick:7,map:floor(),units:[party,cultist,distantBoss]};
 const staged=planCombatStage(state,{x:7,z:0});
 assert.ok(staged.hero.crowded&&staged.cultist.crowded,
  'the distant unopened floor boss cannot disable legitimate corridor combat staging');
 assert.deepEqual([staged.warden.dx,staged.warden.dz],[0,0],
  'the Warden retains its own exact authoritative location');
});


test('a complete cross-cell party battle reduces projected silhouette interference without moving any legal cell',async()=>{
 const {planCombatStage,inspectBattlefieldCrowding,MAX_STAGE_OFFSET}=await mod();
 const units=[u('h1','vanguard','party',3,3),u('h2','ranger','party',3,4),
  u('h3','mystic','party',3,5),u('e1','revenant','enemy',4,3),
  u('e2','cultist','enemy',4,4),u('e3','cultist','enemy',4,5)];
 const state={tick:7,map:floor(),units},view={x:7,z:4},frozen=JSON.stringify(state);
 const original=Object.fromEntries(units.map(a=>[a.id,{x:a.x,z:a.z,dx:0,dz:0,crowded:false}]));
 const prior=inspectBattlefieldCrowding(state,original,view);
 const afterStage=planCombatStage(state,view),after=inspectBattlefieldCrowding(state,afterStage,view);
 assert.ok(prior.comparedPairs>=4);
 assert.ok(after.summedDeficit<prior.summedDeficit,'camera-visible crowding has reduced');
 assert.ok(Object.values(afterStage).every(p=>Math.hypot(p.dx,p.dz)<=MAX_STAGE_OFFSET+.0001));
 assert.deepEqual(afterStage,planCombatStage({...state,units:units.toReversed()},view));
 assert.equal(JSON.stringify(state),frozen,'AI, damage, positions and replay are never modified');
});
test('boss warnings and nearby Warden retain their authoritative visual choreography',async()=>{
 const {planCombatStage,inspectBattlefieldCrowding}=await mod();
 const units=[u('hero','vanguard','party',3,3),u('foe','cultist','enemy',4,3),u('warden','warden','enemy',5,3,200)];
 const s={tick:7,map:floor(),units},view={x:7,z:3};
 const warning={...s,bossWarning:{attackTick:8,cells:[{x:3,z:3}]}};
 assert.deepEqual(inspectBattlefieldCrowding(warning,planCombatStage(warning,view),view),
  {comparedPairs:0,overlaps:0,summedDeficit:0});
 const stage=planCombatStage(s,view);
 assert.ok(stage.hero.dx<-.18, 'pre-existing lawful Warden duel hero retreat remains active');
 assert.deepEqual([stage.foe.dx,stage.foe.dz,stage.warden.dx,stage.warden.dz],[0,0,0,0],
  'general cross-cell blocking cannot displace the Warden or neighboring court guards');
 assert.ok(Math.hypot(stage.hero.dx,stage.hero.dz)<=.441);
});
