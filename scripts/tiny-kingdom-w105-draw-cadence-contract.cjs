'use strict';
// W105 Phase 1 source-only safety contract; not live FPS/experience evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(script.length,1,'Single original playable script');
new vm.Script(script[0][1],{filename:'tiny-kingdom-inline-game.js'});
const start=html.indexOf('// W105: actual completed-draw cadence');
const end=html.indexOf('const FRAME_PROFILE_LIMIT=48,frameProfileSamples=[];',start);
assert(start>0&&end>start,'Real draw cadence implementation missing');
vm.runInNewContext(html.slice(start,end)+"\nconst assert=globalAssert;const day1=drawCadenceSceneKey(1,'active:town',390,844,.65);\nnoteDrawCompletion(10,day1);noteDrawCompletion(43,day1);noteDrawCompletion(78,day1);\nassert.equal(summarizeDrawCadence(drawCadenceSamples).p95Ms,35);\nconst day120=drawCadenceSceneKey(120,'active:town',390,844,.65);\nnoteDrawCompletion(100,day120);assert.equal(drawCadenceSamples.length,0);\nnoteDrawCompletion(140,day120,true);assert.equal(drawCadenceSamples.length,0);\nfor(let i=0;i<200;i++)noteDrawCompletion(200+i*16,day120);\nassert.equal(drawCadenceSamples.length,120);assert.equal(drawCadenceTotal,200);\nassert.equal(summarizeDrawCadence(drawCadenceSamples).p95Ms,16);\nassert.notEqual(day120,drawCadenceSceneKey(120,'active:town',1024,640,1));\nassert.throws(()=>drawCadenceSceneKey(NaN,'active:town',390,844,1));\n",{globalAssert:assert});
const hook=html.indexOf('noteDrawCompletion(frameProfileEnd,drawScenario,idleFrames>0)');
assert(hook>html.indexOf('endGpuFrameTimer(frameGpuQuery)'),'Only completed draws are timed');
assert(hook<html.indexOf('lastFrozenFrameKey=frozenViewKey',hook));
assert(html.includes('getFrameProfile,getDrawCadenceAudit,getGpuFrameTimerAudit'));
assert(html.includes('notGuaranteedCompositorPresent:true'));
assert(html.includes('notHardwareGpuTimer:true'));
console.log('W105 source contract PASS; browser and hardware FPS are NOT PROVEN');
