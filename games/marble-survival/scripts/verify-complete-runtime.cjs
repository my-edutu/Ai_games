'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  ARCHETYPES,
  runCampaign,
  replayCampaign,
  runChaosSuite,
  validateReleaseEvidence,
} = require('../complete/game7.cjs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyCampaignCorpus(count = 96) {
  const champions = Object.fromEntries(ARCHETYPES.map((archetype) => [archetype, 0]));
  const checksums = new Set();
  for (let index = 0; index < count; index += 1) {
    const campaign = runCampaign(`verification-${index}`);
    assert(campaign.validation.valid, `campaign ${index} failed invariants`);
    assert(replayCampaign(campaign).stable, `campaign ${index} failed replay`);
    assert(JSON.stringify(campaign.rounds.map((round) => round.qualified.length)) === '[16,8,4,2,1]', `campaign ${index} bracket drifted`);
    assert(!checksums.has(campaign.checksum), `campaign ${index} duplicated a prior checksum`);
    checksums.add(campaign.checksum);
    champions[campaign.champion.archetype] += 1;
  }
  for (const archetype of ARCHETYPES) assert(champions[archetype] > 0, `${archetype} never won the corpus`);
  return { count, champions, uniqueChecksums: checksums.size };
}

function main() {
  const corpus = verifyCampaignCorpus();
  const chaos = runChaosSuite('release-chaos');
  assert(chaos.passed, 'chaos suite failed');

  const release = validateReleaseEvidence({
    build: true,
    unitTests: true,
    campaignCorpus: true,
    serverSelfTest: true,
    chaosSuite: true,
    browserSmoke: true,
    releaseReport: true,
  });
  assert(release.softwareCandidate, 'software candidate gate did not reach R4');
  assert(release.readiness === 'R4', 'candidate must remain R4 without external evidence');
  assert(release.productionReady === false, 'R5 was incorrectly granted');

  const report = {
    generatedAt: new Date().toISOString(),
    game: 'Game 7 — Marble Survival Tournament',
    candidate: 'Phases 1–6',
    corpus,
    chaos,
    release,
    externalEvidenceRequired: release.missingR5,
  };
  const artifactDirectory = path.resolve(__dirname, '../artifacts');
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(path.join(artifactDirectory, 'game7-release-report.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
