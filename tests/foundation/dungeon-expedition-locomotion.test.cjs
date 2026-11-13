'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function load(){
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/expedition-locomotion-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('real stage travel follows authority smoothly independent of render refresh rate',async()=>{
 const {planExpeditionStep}=await load();
 function advance(dt,frames){let x=0;for(let i=0;i<frames;i++)x=planExpeditionStep(x,0,1,0,dt).x;return x;}
 const fast=advance(1/60,60),slow=advance(1/15,15);
 assert.ok(fast>.985&&slow>.985,'both frame rates reach the same real grid destination');
 const next=planExpeditionStep(0,0,1,0,1/60);
 assert.ok(next.travel>.03&&next.travel<.2,'no sudden tile teleport in ordinary rendering');
 assert.ok(next.leanPitch>0&&next.leanPitch<=.09);
});
test('floor changes, stalls, invalid input and reduced motion do not fabricate walking',async()=>{
 const {planExpeditionStep,MAX_VISUAL_STEP_METRES}=await load();
 assert.deepEqual(planExpeditionStep(0,0,9,0,.016).travel,0);
 assert.equal(planExpeditionStep(0,0,9,0,.016).teleport,true);
 assert.equal(planExpeditionStep(0,0,1,0,.016,{reducedMotion:true}).travel,0);
 assert.equal(planExpeditionStep(0,0,1,0,99).travel<=MAX_VISUAL_STEP_METRES,true);
 assert.equal(planExpeditionStep(0,0,1,0,NaN).travel,0);
 assert.equal(planExpeditionStep(0,0,NaN,1,.01).teleport,true);
});
test('feet and sound are planted only on actual accumulated displacement',async()=>{
 const {advanceExpeditionFootfall,STRIDE_METRES}=await load();
 let total=0,planted=0;
 for(let i=0;i<8;i++){const step=advanceExpeditionFootfall(total,.14);total=step.accumulator;planted+=Number(step.plant);}
 assert.equal(planted,2);
 assert.ok(total>=0&&total<STRIDE_METRES);
 for(const opts of [{alive:false},{teleport:true},{reducedMotion:true}]){
  const step=advanceExpeditionFootfall(.52,.2,opts);
  assert.equal(step.plant,false);assert.equal(step.accumulator,0);
 }
});
test('spectator integration stages body lean, planted visible footprints and opt-in actual audio only',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const projection=fs.readFileSync(path.join(root,'public/ai-dungeon/contact-projection.js'),'utf8');
 const sound=fs.readFileSync(path.join(root,'public/ai-dungeon/soundstage.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(app.includes('planExpeditionStep(')&&app.includes('advanceExpeditionFootfall('));
 assert.ok(app.includes('a.ground?.stamp(')&&app.includes('soundstage?.footstep()'));
 assert.ok(model.includes('actor.locomotionTilt'));
 assert.ok(projection.includes('stamp(t,side)'));
 assert.ok(sound.includes('footstep(){return emit('));
 assert.ok(server.includes("['/dungeon/expedition-locomotion-plan.js','expedition-locomotion-plan.js']"));
 for(const forbidden of ['Math.random','Date.now','fetch(']){
  const src=fs.readFileSync(path.join(root,'public/ai-dungeon/expedition-locomotion-plan.js'),'utf8');
  assert.equal(src.includes(forbidden),false);
 }
});
