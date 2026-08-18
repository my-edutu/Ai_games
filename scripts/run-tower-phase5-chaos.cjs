'use strict';
const{runTowerPhase5Chaos}=require('../dist/games/infinite-tower-climb/src/operations/chaos.js');
const seed=process.argv[2]||'tower-phase5-chaos';
const report=runTowerPhase5Chaos(seed);
process.stdout.write(`${JSON.stringify(report,null,2)}\n`);
if(report.status!=='pass')process.exitCode=1;
