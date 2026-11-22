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

// W360: pausing a living software-rendered town must immediately stop
// every pending cooperative authoritative tick without deleting earned debt.
// Otherwise a slow CPU may advance a whole day while the viewer inspects a
// citizen, changes the camera or presses the pause/speed controls.
const pauseStart=html.indexOf('// W360: immediate, non-dropping simulation pause');
const pauseEnd=html.indexOf('function scheduleSoftwareDebtDrain()',pauseStart);
assert(pauseStart>0&&pauseEnd>pauseStart,'W360 simulation speed gate present');
vm.runInNewContext(
 'let speed=1,accumulator=3.5,lastFrozenFrameKey="frame",resets=0;'+
 'function resetSoftwareDebtDrain(){resets++;}'+
 html.slice(pauseStart,pauseEnd)+
 '\nconst assert=globalAssert;'+
 'assert.equal(setSimulationSpeed(0),0);'+
 'assert.equal(resets,1);'+
 'assert.equal(accumulator,3.5,"paused authoritative debt must be preserved");'+
 'assert.equal(lastFrozenFrameKey,null);'+
 'assert.equal(setSimulationSpeed(2),2);'+
 'assert.equal(resets,1);'+
 'assert.equal(accumulator,3.5);'+
 'assert.throws(()=>setSimulationSpeed(-1));'+
 'assert.throws(()=>setSimulationSpeed(NaN));'+
 'assert.equal(speed,2);',
 {globalAssert:assert}
);
assert(html.includes('||speed===0||simulationCatchupQueued'),
 'queued software catch-up must not begin when playback is paused');
assert(html.includes('if(frozen||speed===0||accumulator<FIXED_STEP)return;'),
 'already scheduled software catch-up must not advance paused authority');
assert(html.includes('gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!frozen&&speed>0){'),
 'a render during speed=0 may draw camera only, never debit accrued ticks');
assert(html.includes('setSpeed:setSimulationSpeed'),
 'browser and touch controls must use immediate pause semantics');

console.log('W105 source contract PASS; browser and hardware FPS are NOT PROVEN');
