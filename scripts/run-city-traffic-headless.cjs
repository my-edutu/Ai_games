'use strict';
const{runTrafficHeadless}=require('../dist/games/ai-city-traffic/src/index.js');const seed=process.argv[2]||'traffic-headless-reference';const report=runTrafficHeadless({width:5,height:4,profile:'mixed',runTicks:2400,spawnEveryTicks:2,maxVehicles:420},seed);process.stdout.write(`${JSON.stringify(report)}\n`);
