'use strict';
const { runBattleRoyalePhase5Chaos } = require('../dist/games/ai-battle-royale/src/index.js');
const report = runBattleRoyalePhase5Chaos(process.env.BATTLE_CHAOS_SEED || 'battle-phase5-ci');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') process.exitCode = 1;
