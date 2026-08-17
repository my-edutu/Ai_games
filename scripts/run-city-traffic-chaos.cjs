'use strict';
const{runTrafficChaosSuite}=require('../dist/games/ai-city-traffic/src/index.js');const seed=process.argv[2]||'traffic-phase5-chaos';const report=runTrafficChaosSuite(seed,{ticks:5000});process.stdout.write(`${JSON.stringify(report)}\n`);process.exitCode=report.ok?0:1;
