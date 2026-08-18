'use strict';
const { runAntColonyPhase5Chaos } = require('../dist/games/ai-ant-colony/src/operations/chaos.js');
const report = runAntColonyPhase5Chaos(process.argv[2] || 'ant-phase5-chaos');
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.status !== 'pass') process.exitCode = 1;
