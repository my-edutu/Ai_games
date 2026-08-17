'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const{runZombieHeadless,runZombieCampaign}=require('../../dist/games/ai-zombie-survival/src/runtime/headless');
const{zombieManifest}=require('../../dist/games/ai-zombie-survival/src/manifest');
const config={width:24,height:16,dayTicks:3,nightTicks:4,resultTicks:2,maxDays:2,maxZombies:64};
test('headless runner executes production rules deterministically with bounded summary',()=>{const a=runZombieHeadless({seed:'headless',config,ticks:60}),b=runZombieHeadless({seed:'headless',config,ticks:60});assert.deepEqual(a,b);assert.equal(a.ticks,60);assert.ok(a.results>=1);assert.ok(a.restarts>=1);assert.equal(typeof a.finalChecksum,'string');assert.ok(a.retainedEvents<=2000)});
test('campaign uses the declared seed corpus and preserves one summary per seed',()=>{const report=runZombieCampaign({seeds:['a','b','c'],config,ticks:40});assert.deepEqual(report.seeds,['a','b','c']);assert.equal(report.runs.length,3);assert.equal(report.divergences,0);assert.ok(report.totalResults>=3)});
test('manifest exposes stable identity, versions, tick rate and runtime entry point',()=>{assert.equal(zombieManifest.gameId,'ai-zombie-survival');assert.equal(zombieManifest.gameVersion,'0.2.0');assert.equal(zombieManifest.deterministicVersion,'zombie-v3');assert.equal(zombieManifest.tickRate,10);assert.equal(zombieManifest.runtimeExport,'ZombieRuntime');assert.ok(Object.isFrozen(zombieManifest))});
