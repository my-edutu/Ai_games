'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/ground-signal-plan.js');
const load=async()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

test('idle, movement, weapon strikes and damage keep only grounded contact shadows; magic/guard cues are event-limited',async()=>{
 const {planGroundSignal}=await load();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  for(const action of ['idle','move','attack','hurt']){
   const style=planGroundSignal(kind,action,true);
   assert.deepEqual(style,{shadowVisible:true,sigilVisible:false,coronaVisible:false,sigilOpacity:0,coronaOpacity:0,spin:false},kind+':'+action);
  }
  const casting=planGroundSignal(kind,'cast',true);
  assert.equal(casting.shadowVisible,true);
  assert.equal(casting.sigilVisible,true);
  assert.equal(casting.coronaVisible,true);
  assert.ok(casting.sigilOpacity>0&&casting.sigilOpacity<=.42);
  assert.ok(casting.coronaOpacity>0&&casting.coronaOpacity<=.18);
  assert.equal(casting.spin,true);
  const guarding=planGroundSignal(kind,'guard',true);
  assert.equal(guarding.sigilVisible,true);
  assert.equal(guarding.coronaVisible,false);
  assert.ok(guarding.sigilOpacity>0&&guarding.sigilOpacity<=.3);
  for(const action of ['cast','guard','attack','idle']){
   const dead=planGroundSignal(kind,action,false);
   assert.deepEqual(dead,{shadowVisible:false,sigilVisible:false,coronaVisible:false,sigilOpacity:0,coronaOpacity:0,spin:false});
  }
 }
});

test('reduced-motion cues stay static and test outcomes are pure, bounded and deterministic',async()=>{
 const {planGroundSignal}=await load();
 const still=planGroundSignal('mystic','cast',true,true);
 assert.equal(still.sigilVisible,true,'do not erase a real ritual from accessibility');
 assert.equal(still.coronaVisible,false);
 assert.equal(still.spin,false);
 assert.equal(still.coronaOpacity,0);
 assert.deepEqual(planGroundSignal('warden','cast',true,true),planGroundSignal('warden','cast',true,true));
 for(const value of [null,undefined,'unknown',{},NaN])assert.equal(planGroundSignal(value,'idle',true).sigilVisible,false);
 const src=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|requestAnimationFrame/);
});

test('the real WebGL spectator uses the semantic plan and exposes bounded rendered ring counts',()=>{
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const projection=fs.readFileSync(path.join(root,'public/ai-dungeon/contact-projection.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.ok(host.includes("['/dungeon/ground-signal-plan.js','ground-signal-plan.js']"));
 assert.match(projection,/planGroundSignal\(/);
 assert.match(projection,/getState:/);
 assert.match(app,/groundSignals:/);
 assert.doesNotMatch(projection,/Math\.random|Date\.now|performance\.now/);
});
