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
 const {planCombatStage}=await mod();
 const blocked=floor();blocked[3]='...#...';
 const units=Array.from({length:28},(_,i)=>u('actor-'+i,'revenant','enemy',3,3));
 assert.equal(Object.keys(planCombatStage({tick:7,map:blocked,units})).length,0);
 const valid=planCombatStage({tick:7,map:floor(),units});
 assert.ok(Object.keys(valid).length<=18);
 for(const p of Object.values(valid))assert.ok(Math.abs(p.dx)<=.2751&&Math.abs(p.dz)<=.2751);
 assert.equal(Object.keys(planCombatStage(null)).length,0);
});
test('real rendered actors and real authority-based combat effects share the staging plan',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const combat=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/const stagePositions=planCombatStage\(s\)/);
 assert.match(app,/stagePoint\(stagePositions,u\)/);
 assert.match(combat,/stagePositions=planCombatStage\(s\)/);
 assert.match(combat,/stagedArcFrame\(/);
 assert.match(combat,/from:stagePoint\(stagePositions,u\)/);
 assert.ok(host.includes("['/dungeon/combat-staging-plan.js','combat-staging-plan.js']"));
});
test('cranial model diagnostics report every genuine actor instead of silently truncating at eight',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/rigCranialRatios:authored\.filter\(.+?\.slice\(0,18\)/);
});
