#!/usr/bin/env node
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,
  parseEscapeRoomConfig,
  runEscapeCampaign,
} = require('../dist/games/ai-escape-room/src/index.js');

const summary = runEscapeCampaign({
  baseConfig: parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG, puzzleDepth:7, objectCount:36, decoyCount:5, hazardCount:1, maxTicks:1400, noProgressTicks:240}),
  seeds: ['release-a','release-b','release-c','release-d'],
  themes: ['cipher-vault','clockwork-study','chromatic-lab','archive-zero'],
  difficulties: [2,7,12,18],
  maxRuns: 64,
});
process.stdout.write(`${JSON.stringify(summary)}\n`);
