'use strict';
const { runMazeHeadless } = require('../dist/games/ai-maze-escape/src/testing/headless.js');
const seed = process.argv[2] || 'maze-headless-reference';
const summary = runMazeHeadless({ width: 17, height: 11, profile: 'loops', level: 1, maxTicks: 10000 }, seed);
process.stdout.write(`${JSON.stringify(summary)}\n`);
if (summary.result !== 'escape') process.exitCode = 1;
