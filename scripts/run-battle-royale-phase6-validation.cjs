'use strict';
const { createBattleValidationBundle } = require('../dist/games/ai-battle-royale/src/release/validation.js');
const candidate = process.env.CANDIDATE_SOURCE_SHA || process.argv[2] || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const bundle = createBattleValidationBundle(candidate);
process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
if (bundle.softwareVerdict === 'FAIL') process.exitCode = 1;
