import { checksum } from '../../../../packages/replay/src/index';
import type { createTowerValidationBundle } from './validation';

export interface TowerScoreCategory {
  score: number;
  max: number;
  status: 'pass' | 'blocked' | 'fail';
  summary: string;
}

export type TowerValidationBundle = ReturnType<typeof createTowerValidationBundle>;

export function scoreTowerReadiness(bundle: TowerValidationBundle) {
  const noIntegrity = bundle.integrity.invalidContent === 0
    && bundle.integrity.replayDivergences === 0
    && bundle.integrity.duplicateEffects === 0
    && bundle.integrity.unauthorizedControls === 0
    && bundle.integrity.privateExposures === 0
    && bundle.campaign.totalInvariantFailures === 0
    && bundle.campaign.totalDuplicateApplications === 0
    && bundle.campaign.deterministicRerunReady;
  const deterministicIntegrity: TowerScoreCategory = {
    score: noIntegrity ? 18 : 0,
    max: 18,
    status: noIntegrity ? 'pass' : 'fail',
    summary: noIntegrity ? 'Fixed-point authority, replay and campaign invariants pass.' : 'Authoritative integrity or deterministic replay failed.',
  };
  const gameplayPass = bundle.campaign.baseline.totalRuns > 0
    && bundle.campaign.baseline.technicalOutcomes === 0
    && bundle.campaign.baseline.invalidContent === 0
    && bundle.campaign.baseline.replayDivergences === 0;
  const autonomousGameplay: TowerScoreCategory = {
    score: gameplayPass ? 14 : 0,
    max: 14,
    status: gameplayPass ? 'pass' : 'fail',
    summary: gameplayPass ? 'All launch themes execute autonomously with typed outcomes.' : 'Autonomous Tower campaign is technically invalid or incomplete.',
  };
  const physicsPass = bundle.integrity.invalidContent === 0 && bundle.integrity.privateExposures === 0;
  const physicsContentFairness: TowerScoreCategory = {
    score: physicsPass ? 12 : 0,
    max: 12,
    status: physicsPass ? 'pass' : 'fail',
    summary: physicsPass ? 'Generated routes, fixed-point physics and public-state boundaries remain valid.' : 'Tower physics, generation or privacy integrity failed.',
  };
  const broadcastPass = bundle.softwareVerdict === 'PASS';
  const broadcastAccessibility: TowerScoreCategory = {
    score: broadcastPass ? 10 : 0,
    max: 10,
    status: broadcastPass ? 'pass' : 'fail',
    summary: broadcastPass ? 'Responsive Canvas, captions, accessibility and output-recovery checks pass.' : 'Broadcast implementation has blocking software findings.',
  };
  const audiencePass = bundle.campaign.totalDuplicateApplications === 0
    && bundle.campaign.scenarios.every(item => item.prohibitedTerminalEffects === 0)
    && bundle.campaign.pressure.some(item => item.applied > 0);
  const audienceSafety: TowerScoreCategory = {
    score: audiencePass ? 10 : 0,
    max: 10,
    status: audiencePass ? 'pass' : 'fail',
    summary: audiencePass ? 'Audience effects remain bounded, consequential and exactly once.' : 'Audience pressure violated fairness or idempotency.',
  };
  const recoveryPass = bundle.chaos.status === 'pass'
    && bundle.chaos.recovery.restored
    && bundle.chaos.integrity.replayDivergences === 0
    && bundle.chaos.integrity.duplicateApplications === 0
    && bundle.chaos.integrity.privateExposures === 0
    && bundle.chaos.integrity.unauthorizedControls === 0;
  const durabilityRecovery: TowerScoreCategory = {
    score: recoveryPass ? 14 : 0,
    max: 14,
    status: recoveryPass ? 'pass' : 'fail',
    summary: recoveryPass ? 'Durable reconstruction, fencing, fail-closed ordering and output protection pass.' : 'Recovery or durable authority failed.',
  };
  const operationsPass = bundle.drills.implementationStatus === 'pass'
    && bundle.chaos.drills.status === 'pass'
    && bundle.chaos.drills.drills.length >= 12;
  const operationsDrills: TowerScoreCategory = {
    score: operationsPass ? 10 : 0,
    max: 10,
    status: operationsPass ? 'pass' : 'fail',
    summary: operationsPass ? 'Operational implementation drills and chaos gates pass.' : 'Operational implementation drill coverage is incomplete.',
  };
  let external = 0;
  if (bundle.capacity.productionReferenceSatisfied) external += 2;
  if (bundle.providers.status === 'pass') external += 2;
  if (bundle.safety.status === 'pass') external += 2;
  if (bundle.endurance.status === 'pass') external += 2;
  if (bundle.drills.productionStatus === 'pass') external += 1;
  if (bundle.canary.status === 'eligible') external += 2;
  if (bundle.independentReview.status === 'pass'
    && bundle.independentReview.source === 'external-signed'
    && bundle.independentReview.candidateChecksum === bundle.manifest.checksum) external += 1;
  const productionEvidence: TowerScoreCategory = {
    score: external,
    max: 12,
    status: external === 12 ? 'pass' : 'blocked',
    summary: external === 12 ? 'Every production-reference and independent evidence gate passes.' : 'Real provider, independent, elapsed endurance/canary or witnessed-production evidence remains incomplete.',
  };
  const categories = { deterministicIntegrity, autonomousGameplay, physicsContentFairness, broadcastAccessibility, audienceSafety, durabilityRecovery, operationsDrills, productionEvidence };
  let score = Object.values(categories).reduce((sum, item) => sum + item.score, 0);
  if (bundle.readiness.verdict === 'FAIL') score = Math.min(score, 59);
  else if (bundle.readiness.verdict === 'BLOCKED') score = Math.min(score, 89);
  const grade = bundle.readiness.verdict === 'FAIL'
    ? 'Integrity Blocked'
    : bundle.readiness.verdict === 'PASS'
      ? 'Production Ready'
      : score >= 85
        ? 'Production Candidate'
        : score >= 75
          ? 'Operational Beta'
          : score >= 60
            ? 'Engineering Beta'
            : 'Not Ready';
  const base = {
    score,
    grade,
    verdict: bundle.readiness.verdict,
    highestTruthfulReadiness: bundle.readiness.highestTruthfulReadiness,
    productionReady: bundle.readiness.productionReady,
    categories,
    blockers: [...bundle.readiness.blockers],
    failures: [...bundle.readiness.failures],
  };
  return { ...base, scoreChecksum: checksum(base) };
}
