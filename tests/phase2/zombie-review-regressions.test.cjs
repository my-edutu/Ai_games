'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const{ZombieRuntime}=require('../../dist/games/ai-zombie-survival/src/runtime/run');
const{runZombieCampaign}=require('../../dist/games/ai-zombie-survival/src/runtime/headless');
const compact={width:24,height:16,dayTicks:2,nightTicks:3,resultTicks:2,maxDays:1,maxZombies:16,waveBaseSize:2,waveGrowthPerDay:0,zombieSpawnInterval:1,survivorDecisionInterval:1};
test('automatic restart seeds remain bounded and replay-identical across long operation',()=>{const a=ZombieRuntime.create(compact,'bounded-restart'),b=ZombieRuntime.create(compact,'bounded-restart');for(let index=0;index<1000;index++){a.restart();b.restart();assert.equal(a.seed,b.seed);assert.equal(a.stateChecksum(),b.stateChecksum());assert.ok(a.seed.length<=40,`restart seed grew to ${a.seed.length} characters`)}});
test('campaign rows stop at the first terminal result and never mix restarted games',()=>{const seeds=['row-0','row-1','row-2','row-3'];const report=runZombieCampaign({seeds,config:compact,ticks:200});assert.equal(report.totalResults,seeds.length);assert.equal(report.totalRestarts,0);for(const run of report.runs){assert.equal(run.results,1);assert.equal(run.restarts,0);assert.ok(run.executedTicks>0);assert.ok(run.executedTicks<=run.ticks)}});
