'use strict';
const{runMazePhase5Chaos}=require('../dist/games/ai-maze-escape/src/operations/chaos.js');
const report=runMazePhase5Chaos(process.argv[2]||'maze-phase5-chaos');
process.stdout.write(`${JSON.stringify(report)}\n`);
if(report.status!=='pass')process.exitCode=1;
