'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/character-motion-plan.js');
async function motion(){
 const js=fs.readFileSync(source,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
const allKinds=['vanguard','ranger','mystic','revenant','cultist','warden'];
const allActions=['idle','move','attack','cast','hurt','guard'];
test('original authored motion is bounded, finite and neutral under reduced motion',async()=>{
 const {planAuthoredMotion}=await motion();
 for(const kind of allKinds)for(const action of allActions)for(const age of [0,.05,.12,.19,.27,.42,.8,5,-1,NaN,Infinity]){
  const pose=planAuthoredMotion(kind,action,age,false);
  for(const key of ['x','y','z','pitch','roll'])assert.ok(Number.isFinite(pose[key]),kind+':'+action+':'+key);
  assert.ok(Math.abs(pose.x)<=.06&&pose.y>=-.07&&pose.y<=.10&&pose.z>=-.20&&pose.z<=.07);
  assert.ok(Math.abs(pose.pitch)<=.24&&Math.abs(pose.roll)<=.22);
  assert.deepEqual(planAuthoredMotion(kind,action,age,true),{x:0,y:0,z:0,pitch:0,roll:0});
 }
});
test('real attack action has separate anticipation, forward strike and settled recovery',async()=>{
 const {planAuthoredMotion}=await motion();
 const windup=planAuthoredMotion('vanguard','attack',.11);
 const impact=planAuthoredMotion('vanguard','attack',.25);
 const finish=planAuthoredMotion('vanguard','attack',.60);
 assert.ok(windup.z>.035&&windup.pitch>.05,'visible wind-up moves backwards');
 assert.ok(impact.z<-.09&&impact.pitch<-.08,'strike is a legible forward impulse');
 assert.deepEqual(finish,{x:0,y:0,z:0,pitch:0,roll:0},'no pose drift after action');
 assert.ok(Math.abs(planAuthoredMotion('ranger','attack',.25).z)<Math.abs(impact.z),'ranged attacker should not collide with a wall');
});
test('cast, hurt, guard, locomotion and boss motion remain distinct and never translate the true actor',async()=>{
 const {planAuthoredMotion}=await motion();
 const cast=planAuthoredMotion('mystic','cast',.22),hurt=planAuthoredMotion('revenant','hurt',.17),guard=planAuthoredMotion('vanguard','guard',.2);
 assert.ok(cast.y>.035&&Math.abs(cast.z)<.055,'casting rises instead of charging into a foe');
 assert.ok(Math.abs(hurt.roll)>.07&&hurt.z>.015,'damage is a recoil rather than a new attack');
 assert.ok(guard.y<-.02&&guard.pitch>.03,'guard braces and stays grounded');
 assert.ok(Math.abs(planAuthoredMotion('ranger','move',.34).y)<.06);
 assert.ok(Math.abs(planAuthoredMotion('warden','attack',.25).z)<=.17,'boss lunge still fits its occupied tile');
 assert.deepEqual(planAuthoredMotion('vanguard','idle',0),{x:0,y:0,z:0,pitch:0,roll:0});
});
test('motion envelope uses only read-only action and elapsed time; no RNG or renderer dependency',async()=>{
 const {planAuthoredMotion}=await motion();
 const before=Object.freeze({kind:'cultist',action:'cast',elapsed:.25});
 const a=planAuthoredMotion(before.kind,before.action,before.elapsed);
 const b=planAuthoredMotion(before.kind,before.action,before.elapsed);
 assert.deepEqual(a,b);assert.equal(before.elapsed,.25);
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/Math\.random|performance\.now|requestAnimationFrame|fetch\(/);
});
test('a delayed WebGL frame cannot silently skip the first authored attack poses',async()=>{
 const {advancePresentationActionAge,planAuthoredMotion}=await motion();
 let age=0;
 // Browser software WebGL may render only a few frames even when a second
 // of wall-clock time passes; the first visible strike must still be staged.
 for(const wallClockGap of [2.5,3,4,.8,.3]){
  age=advancePresentationActionAge(age,Math.min(.05,wallClockGap));
 }
 assert.ok(age>=.24&&age<=.251);
 assert.ok(planAuthoredMotion('vanguard','attack',age).z<-.08);
 assert.equal(advancePresentationActionAge(0,Infinity),0);
 assert.equal(advancePresentationActionAge(0,-1),0);
 assert.equal(advancePresentationActionAge(Infinity,.05),.05);
 assert.equal(advancePresentationActionAge(5,.05),5);
});
test('actual render loop uses bounded visual action age for one-shot authored strikes',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/advancePresentationActionAge\(since,dt\)/);
 assert.match(app,/a\.visualActionAge=0/);
 assert.match(app,/a\.visualActionAge\?\?0/);
 assert.match(app,/updateActor\(a,dt,since,reduced\)/);
});
test('the real authored GLB renderer stages the rig through an isolated pivot, not authoritative coordinates',()=>{
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(assets,/import \{planAuthoredMotion\} from '\/dungeon\/character-motion-plan\.js'/);
 assert.match(assets,/actor\.visualPivot/);
 assert.match(assets,/planAuthoredMotion\(actor\.u\.kind,actor\.u\.action/);
 assert.match(app,/updateActor\(a,dt,since,reduced\)/);
 assert.ok(server.includes("['/dungeon/character-motion-plan.js','character-motion-plan.js']"));
});

test('weighted GLB pivot staging makes authentic adjacent strikes anticipate, commit and recover',async()=>{
 const {planContactBodyLanguage:plan}=await motion();
 const neutral={x:0,y:0,z:0,pitch:0,yaw:0,roll:0};
 for(const kind of ['vanguard','revenant','warden']){
  const current={targetId:'real-foe',distance:1,reducedMotion:false};
  const wind=plan(kind,'attack',.11,current),strike=plan(kind,'attack',.25,current);
  assert.ok(wind.z>.005&&wind.pitch>0);
  assert.ok(strike.z<-.035&&strike.pitch<-.02);
  assert.deepEqual(plan(kind,'attack',.63,current),neutral);
  for(const age of [0,.02,.07,.11,.16,.24,.29,.35,.48,.61,.8])
   assert.ok(Object.values(plan(kind,'attack',age,current)).every(Number.isFinite));
  assert.ok(Math.abs(strike.z)<.1&&Math.abs(strike.yaw)<.13);
  for(const missing of [{targetId:null,distance:1},{targetId:'foe',distance:2},{targetId:'foe',distance:1,reducedMotion:true}])
   assert.deepEqual(plan(kind,'attack',.25,missing),neutral);
 }
 assert.deepEqual(plan('ranger','attack',.25,{targetId:'foe',distance:1}),neutral);
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(assets,/planContactBodyLanguage\(actor\.u\.kind/);
 assert.match(assets,/actor\.visualPivot\.position\.set\(pose\.x\+contact\.x/);
});
