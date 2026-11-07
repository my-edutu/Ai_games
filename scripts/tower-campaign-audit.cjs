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
      const m = ep.markers;
      if (ep.firstFloor !== 8 || typeof ep.runId !== 'string' || !ep.runId ||
        !m || !REQUIRED.every(key => m[key] &&
          Number.isSafeInteger(m[key].tick) && m[key].tick >= 0 &&
          Number.isSafeInteger(m[key].floor)))
        { issues.push(name + ': incomplete or unrelated claimed same-run markers'); continue; }
      // The source campaign witness now requires actual living-guardian
      // crusher pressure followed by defeat, earned cap walking, crossing,
      // real floor-nine movement and a playable result. A forged/reordered
      // marker array must never produce a green source-episode audit.
      const beforeRestart = REQUIRED.slice(0, -1);
      if (beforeRestart.some((key, i) => i > 0 &&
        m[key].tick < m[beforeRestart[i - 1]].tick))
        issues.push(name + ': out-of-order same-run gameplay milestones');
      const lowerFloor = ['liveGuardian', 'crusherPressureSurvived',
        'guardianDefeated', 'groundedEarnedWalk', 'advancedOnCap'];
      if (lowerFloor.some(key => m[key].floor !== 8) ||
          m.earnedFloorNine.floor !== 9 ||
          ['floorNineContinues', 'sourceResult', 'intermission']
            .some(key => m[key].floor < 9) || m.restarted.floor !== 8)
        issues.push(name + ': source milestones assigned to the wrong floor');
      if (m.crusherPressureSurvived.hazardId !== 'f8:guardian-shutter' ||
          !Number.isSafeInteger(m.crusherPressureSurvived.warningTicks) ||
          m.crusherPressureSurvived.warningTicks < 0 ||
          m.crusherPressureSurvived.warningTicks > 12 ||
          m.crusherPressureSurvived.tick > m.guardianDefeated.tick)
        issues.push(name + ': crusher not witnessed before guardian defeat');
      if (!Number.isSafeInteger(m.groundedEarnedWalk.x) ||
          !Number.isSafeInteger(m.advancedOnCap.x) ||
          m.advancedOnCap.x <= m.groundedEarnedWalk.x ||
          m.groundedEarnedWalk.capId !== 'f8:cap')
        issues.push(name + ': missing genuine forward cap walking');
      if (m.earnedFloorNine.capId !== 'f8:cap' ||
          m.earnedFloorNine.guardianId !== 'f8:guardian' ||
          !Number.isSafeInteger(m.earnedFloorNine.clearanceX) ||
          !Number.isSafeInteger(m.earnedFloorNine.observedActualCrossingX) ||
          m.earnedFloorNine.observedActualCrossingX <
            m.earnedFloorNine.clearanceX)
        issues.push(name + ': missing physically earned guardian gateway clearance');
      if (m.sourceResult.kind !== 'game' ||
          typeof m.restarted.nextRunId !== 'string' ||
          !m.restarted.nextRunId ||
          m.restarted.nextRunId === ep.runId)
        issues.push(name + ': no legitimate game outcome and distinct restarted run');
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
