'use strict';
const {runFloorsHeadless}=require('../dist/games/ai-vs-1000-floors/src/testing/headless.js');
function arg(name,fallback){const prefix=`--${name}=`;const value=process.argv.slice(2).find(item=>item.startsWith(prefix));return value?value.slice(prefix.length):fallback}
const options={seedPrefix:arg('seed','floors-headless'),runs:Number(arg('runs','10')),maxTicks:Number(arg('maxTicks','50000')),config:{baseEnemyBudget:Number(arg('baseEnemyBudget','0')),maxEnemyBudget:Number(arg('maxEnemyBudget','1')),maxTicksPerFloor:Number(arg('maxTicksPerFloor','100'))}};
const started=process.hrtime.bigint();const report=runFloorsHeadless(options);const elapsedMs=Number(process.hrtime.bigint()-started)/1e6;
process.stdout.write(JSON.stringify({...report,elapsedMs:Number(elapsedMs.toFixed(3)),ticksPerSecond:elapsedMs>0?Number((report.totalTicks/(elapsedMs/1000)).toFixed(1)):0},null,2)+'\n');
if(report.invariantFailures||report.replayFailures||report.generatorInvalid)process.exitCode=1;
