#!/usr/bin/env node
'use strict';
const { BattleRoyaleRuntime, createBattleConfig } = require('../dist/games/ai-battle-royale/src/index.js');
const seed = process.argv[2] || 'battle-headless-demo';
const config = createBattleConfig();
const runtime = new BattleRoyaleRuntime(config, seed, `headless-${seed}`);
runtime.runToResult(config.maxTicks + 2);
process.stdout.write(`${JSON.stringify({ seed, tick: runtime.state.tick, checksum: runtime.checksum(), result: runtime.state.result }, null, 2)}\n`);
