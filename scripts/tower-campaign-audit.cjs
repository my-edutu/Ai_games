'use strict';
// Source-only integrity evidence for two unmodified, deterministic 3,200-tick
// campaigns. This is not a video, controller, device, or experience verdict.
const fs = require('node:fs');
const path = require('node:path');
const REQUIRED = Object.freeze([
  'liveGuardian', 'crusherPressureSurvived', 'guardianDefeated',
  'groundedEarnedWalk', 'advancedOnCap', 'earnedFloorNine',
  'floorNineContinues', 'sourceResult', 'intermission', 'restarted',
]);
function auditTowerCampaigns(a, b, candidateSha) {
  const issues = [];
  if (typeof candidateSha !== 'string' || !/^[a-f0-9]{40}$/.test(candidateSha))
    issues.push('candidate SHA is not immutable 40-character lowercase hex');
  for (const [name, run] of [['replicaA', a], ['replicaB', b]]) {
    if (!run || run.kind !== 'source-only-guardian-campaign' ||
      run.steps !== 3200 || run.fixedStepHz !== 20 || run.launchFloor !== 8)
      issues.push(name + ': wrong source campaign configuration');
    const chain = run?.causalEpisodeProof;
    if (!chain || chain.kind !== 'unmodified-fixed-step-source-episode-chain' ||
      !Array.isArray(chain.episodes) || typeof chain.fullSourceChainObserved !== 'boolean') {
      issues.push(name + ': missing authentic causal episode witness');
      continue;
    }
    const completed = chain.episodes.filter(ep => ep?.completeSourceChain === true);
    if (chain.fullSourceChainObserved !== (completed.length > 0))
      issues.push(name + ': claimed source chain disagrees with episode markers');
    for (const ep of completed) {
      if (ep.firstFloor !== 8 || typeof ep.runId !== 'string' || !ep.runId ||
        !ep.markers || !REQUIRED.every(key => ep.markers[key] &&
          Number.isSafeInteger(ep.markers[key].tick)))
        issues.push(name + ': incomplete or unrelated claimed same-run markers');
    }
  }
  const exactReplay = JSON.stringify(a) === JSON.stringify(b);
  if (!exactReplay) issues.push('two unchanged source campaigns diverged');
  const complete = issues.length === 0 && a.causalEpisodeProof.fullSourceChainObserved === true;
  const status = issues.length ? 'INVALID_OR_NONDETERMINISTIC_SOURCE_EVIDENCE' :
    complete ? 'COMPLETE_SOURCE_EPISODE_ONLY' : 'SOURCE_EPISODE_INCOMPLETE';
  return {schemaVersion: 1, candidateSha, source: 'two separate, original fixed-step TowerRuntime campaigns',
    checkedConfig: {launchFloor: 8, steps: 3200, fixedStepHz: 20},
    deterministicExactReplay: exactReplay, fullSameRunSourceChainObserved: complete,
    requiredEpisodeMarkers: [...REQUIRED],
    actualEpisodes: Array.isArray(a?.causalEpisodeProof?.episodes)
      ? a.causalEpisodeProof.episodes.map(ep => ({episode: ep.episode, firstFloor: ep.firstFloor,
        completeSourceChain: ep.completeSourceChain === true, firstMissing: ep.firstMissing ?? null})) : [],
    issues, sourceEvidenceStatus: status, transformationVerdict: 'NOT EVALUATED',
    limitations: 'The authoritative headless chain cannot establish camera framing, rendered WebM visibility, graphics, mobile controls, device performance or independent reviewer preferences.'};
}
if (require.main === module) {
  const [one, two, output, candidateSha] = process.argv.slice(2);
  if (!one || !two || !output || !candidateSha) {
    process.stderr.write('Usage: node scripts/tower-campaign-audit.cjs <run1.json> <run2.json> <audit.json> <candidateSHA>\n');
    process.exitCode = 2;
  } else {
    try {
      const report = auditTowerCampaigns(
        JSON.parse(fs.readFileSync(one, 'utf8')),
        JSON.parse(fs.readFileSync(two, 'utf8')), candidateSha);
      fs.mkdirSync(path.dirname(output), {recursive: true});
      fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
      process.stdout.write(report.sourceEvidenceStatus + '; quality NOT EVALUATED; audit: ' + output + '\n');
      if (report.sourceEvidenceStatus !== 'COMPLETE_SOURCE_EPISODE_ONLY') process.exitCode = 1;
    } catch (err) {
      process.stderr.write('Source evidence could not be audited: ' + err.message + '\n');
      process.exitCode = 2;
    }
  }
}
module.exports = {REQUIRED, auditTowerCampaigns};
