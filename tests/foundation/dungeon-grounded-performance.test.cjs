'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const file=path.join(root,'public/ai-dungeon/expedition-locomotion-plan.js');
async function planner(){
 return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
}
test('only genuine visual travel plays moving legs; teleports and stale authority move idle',async()=>{
 const {planGroundedAnimation:p}=await planner();
 const moving=p('vanguard','move',.12,1/60,.23,0,0);
 assert.equal(moving.clipAction,'move');
 assert.ok(moving.weight>.3&&moving.clipSpeed>=.6&&moving.clipSpeed<=1.35);
 for(const still of [p('vanguard','move',0,.05,0,0,.8),
  p('vanguard','move',.1,.016,0,0,.8,{teleport:true}),
  p('vanguard','move',.1,.016,0,0,.8,{reducedMotion:true}),
  p('vanguard','move',.1,.016,0,0,.8,{alive:false}),
  p('vanguard','move',9,.016,0,0,.8)]){
  assert.equal(still.clipAction,'idle');assert.equal(still.bodyLift,0);
 }
});
test('real attacks casts hurt and guard have precedence over walking presentation',async()=>{
 const {planGroundedAnimation:p}=await planner();
 for(const action of ['attack','cast','hurt','guard']){
  const pose=p('ranger',action,.13,.016,.18,1,.8);
  assert.equal(pose.clipAction,action);assert.equal(pose.moving,false);
 }
 assert.equal(p('ranger','idle',.1,.016,.2,1,0).clipAction,'move');
});
test('planted stride parity alternates genuine left/right foot weight',async()=>{
 const {planGroundedAnimation:p,STRIDE_METRES}=await planner();
 const left=p('ranger','move',.1,.04,STRIDE_METRES/2,0,.6);
 const right=p('ranger','move',.1,.04,STRIDE_METRES/2,1,.6);
 assert.ok(left.bodyRoll>0&&right.bodyRoll<0);
 assert.ok(left.bodyLift<0&&right.bodyLift<0);
 assert.equal(left.footPhase,.25);assert.equal(right.footPhase,.75);
});
test('all roles/actions remain deterministic and bounded with malformed frame data',async()=>{
 const {planGroundedAnimation:p}=await planner();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const action of ['idle','move','attack','cast','hurt','guard'])
   for(const travel of [0,.01,.12,.3,.54,NaN,-1,Infinity])
    for(const delta of [0,.016,.05,2,Infinity]){
     const a=p(kind,action,travel,delta,.21,3,.6),b=p(kind,action,travel,delta,.21,3,.6);
     assert.deepEqual(a,b);
     for(const key of ['clipSpeed','footPhase','bodyLift','bodyPitch','bodyRoll','weight','speed'])
      assert.ok(Number.isFinite(a[key]),kind+':'+action+':'+key);
     assert.ok(a.clipSpeed>=.6&&a.clipSpeed<=1.35);
     assert.ok(Math.abs(a.bodyLift)<=.025&&Math.abs(a.bodyPitch)<=.061&&Math.abs(a.bodyRoll)<=.022);
    }
 assert.notEqual(p('ranger','move',.1,.04,.12,0,.5).clipSpeed,
  p('warden','move',.1,.04,.12,0,.5).clipSpeed);
 assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Math\.random|Date\.now|performance\.now|fetch\(/);
});
test('actual renderer binds grounded clip, pelvis and procedural legs to the same footfall',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(app,/a\.groundedPerformance=planGroundedAnimation/);
 assert.match(app,/a\.footstepIndex\?\?0/);
 assert.match(app,/a\.ground\?\.stamp/);
 assert.match(model,/groundedPerformance\?\.clipAction/);
 assert.match(model,/setEffectiveTimeScale\(clipSpeed\)/);
 assert.match(model,/ground\?\.bodyLift/);
 assert.match(model,/groundedTravelActors:/);
});
