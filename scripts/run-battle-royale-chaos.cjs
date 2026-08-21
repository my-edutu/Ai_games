'use strict';
const { runBattleRoyalePhase5Chaos } = require('../dist/games/ai-battle-royale/src/index.js');
const seed = process.env.BATTLE_CHAOS_SEED || process.argv[2] || 'battle-phase5-ci';
const report = runBattleRoyalePhase5Chaos(seed);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') process.exitCode = 1;
