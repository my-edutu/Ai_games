'use strict';
const { createAntValidationBundle } = require('../dist/games/ai-ant-colony/src/release/validation.js');
const { scoreAntReadiness } = require('../dist/games/ai-ant-colony/src/release/score.js');

const sha = process.env.CANDIDATE_SOURCE_SHA || process.argv[2];
if (!sha) {
  console.error('CANDIDATE_SOURCE_SHA is required');
  process.exit(2);
}

const bundle = createAntValidationBundle(sha);
const score = scoreAntReadiness(bundle);
const pressure = bundle.campaign.scenarios.find(item => item.name === 'maximum-bounded-pressure');
const report = {
  schemaVersion: 1,
  candidateSourceSha: sha,
  softwareVerdict: bundle.softwareVerdict,
  readiness: bundle.readiness,
  score,
  campaign: {
    runs: bundle.campaign.baseline.length + bundle.campaign.pressure.length,
    profiles: bundle.campaign.baseline.map(item => item.profile),
    patternsObserved: bundle.campaign.patternsObserved,
    pressureAppliedEffects: pressure?.appliedEffects ?? 0,
    invariantFailures: bundle.campaign.totalInvariantFailures,
    illegalActions: bundle.campaign.totalIllegalActions,
    duplicateApplications: bundle.campaign.totalDuplicateApplications,
    populationBounded: bundle.campaign.populationBounded,
    reportChecksum: bundle.campaign.reportChecksum,
  },
  chaos: bundle.chaos,
  bundleChecksum: bundle.bundleChecksum,
};
process.stdout.write(`${JSON.stringify(report)}\n`);
if (bundle.softwareVerdict !== 'PASS' || bundle.readiness.verdict === 'FAIL') process.exitCode = 1;
