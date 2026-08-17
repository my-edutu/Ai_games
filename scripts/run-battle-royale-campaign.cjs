#!/usr/bin/env node
'use strict';
const { createBattleConfig, runBattleCampaign } = require('../dist/games/ai-battle-royale/src/index.js');
const runs = Math.max(1, Math.min(1000, Number(process.argv[2] || 200)));
const config = createBattleConfig({ maxTicks: 720, zoneFirstShrinkTick: 65, zoneShrinkInterval: 55, noProgressTicks: 110 });
const seeds = Array.from({ length: runs }, (_, index) => `battle-campaign-${index}`);
process.stdout.write(`${JSON.stringify(runBattleCampaign(config, seeds), null, 2)}\n`);
