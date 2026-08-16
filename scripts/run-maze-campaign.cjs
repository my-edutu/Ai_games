'use strict';
const { runMazeCampaign } = require('../dist/games/ai-maze-escape/src/testing/campaign.js');
const baseSeed = process.argv[2] || 'maze-phase2-reference';
const report = runMazeCampaign({ runsPerProfile: 5, profiles: ['tree','loops','chambers','layers','hunter'], baseSeed, maxTicks: 18000 });
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.technicalOutcomes || report.invalidContent || report.hiddenInformationViolations || report.escapes < 15 || report.patterns.length < 3) process.exitCode = 1;
