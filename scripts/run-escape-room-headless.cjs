#!/usr/bin/env node
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,
  parseEscapeRoomConfig,
  runEscapeHeadless,
} = require('../dist/games/ai-escape-room/src/index.js');

const seed = process.argv.find(arg => arg.startsWith('--seed='))?.slice(7) ?? 'escape-room-headless-v1';
const summary = runEscapeHeadless({
  config: parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG, puzzleDepth: 8, objectCount: 32, decoyCount: 5, hazardCount: 2, maxTicks: 1200}),
  seed,
  runId: `headless-${seed}`,
});
process.stdout.write(`${JSON.stringify(summary)}\n`);
