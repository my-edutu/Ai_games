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
 assert.doesNotMatch(code,/Math\\.random|performance\\.now|requestAnimationFrame|fetch\\(/);
});
test('the real authored GLB renderer stages the rig through an isolated pivot, not authoritative coordinates',()=>{
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(assets,/import \\{planAuthoredMotion\\} from '\\/dungeon\\/character-motion-plan\\.js'/);
 assert.match(assets,/actor\\.visualPivot/);
 assert.match(assets,/planAuthoredMotion\\(actor\\.u\\.kind,actor\\.u\\.action/);
 assert.match(app,/updateActor\\(a,dt,since,reduced\\)/);
 assert.ok(server.includes("['/dungeon/character-motion-plan.js','character-motion-plan.js']"));
});
