import { checksum } from '../../../../packages/replay/src/index';
import type { createAntValidationBundle } from './validation';

export interface AntScoreCategory {
  score: number;
  max: number;
  status: 'pass' | 'blocked' | 'fail';
  summary: string;
}

export type AntValidationBundle = ReturnType<typeof createAntValidationBundle>;

export function scoreAntReadiness(bundle: AntValidationBundle) {
  const noIntegrity = bundle.integrity.invariantFailures === 0
    && bundle.integrity.illegalActions === 0
    && bundle.integrity.replayDivergences === 0
    && bundle.integrity.duplicateEffects === 0
    && bundle.integrity.unauthorizedControls === 0
    && bundle.integrity.privateExposures === 0
    && bundle.campaign.totalInvariantFailures === 0
    && bundle.campaign.totalDuplicateApplications === 0
    && bundle.campaign.deterministicRerunReady;
  const deterministicIntegrity: AntScoreCategory = {
    score: noIntegrity ? 18 : 0,
    max: 18,
    status: noIntegrity ? 'pass' : 'fail',
    summary: noIntegrity
      ? 'Deterministic authority, replay, invariants and exactly-once effects pass.'
      : 'Authoritative integrity, deterministic replay or effect idempotency failed.',
  };

  const gameplayPass = bundle.campaign.populationBounded
    && bundle.campaign.baseline.length === 4
    && bundle.campaign.baseline.every(item => item.technicalOutcomes === 0 && item.populationBounded);
  const autonomousEcosystem: AntScoreCategory = {
    score: gameplayPass ? 14 : 0,
    max: 14,
    status: gameplayPass ? 'pass' : 'fail',
    summary: gameplayPass
      ? 'All ecosystem profiles execute autonomously with bounded populations and legitimate outcomes.'
      : 'Autonomous ecosystem coverage, bounds or outcome integrity is incomplete.',
  };

  const privacyPass = bundle.integrity.privateExposures === 0;
  const privacyBoundary: AntScoreCategory = {
    score: privacyPass ? 12 : 0,
    max: 12,
    status: privacyPass ? 'pass' : 'fail',
    summary: privacyPass
      ? 'Public snapshots and release evidence preserve private authority boundaries.'
      : 'Private authority or viewer information was exposed.',
  };

  const broadcastPass = bundle.softwareVerdict === 'PASS';
  const broadcastAccessibility: AntScoreCategory = {
    score: broadcastPass ? 10 : 0,
    max: 10,
    status: broadcastPass ? 'pass' : 'fail',
    summary: broadcastPass
      ? 'Responsive Canvas, captions, accessibility and recovery software gates pass.'
      : 'Broadcast implementation has blocking software findings.',
  };

  const pressureScenario = bundle.campaign.scenarios.find(item => item.name === 'maximum-bounded-pressure');
  const audiencePass = bundle.campaign.totalDuplicateApplications === 0
    && bundle.campaign.scenarios.every(item => item.prohibitedTerminalEffects === 0)
    && (pressureScenario?.appliedEffects ?? 0) > 0;
  const audienceSafety: AntScoreCategory = {
    score: audiencePass ? 10 : 0,
    max: 10,
    status: audiencePass ? 'pass' : 'fail',
    summary: audiencePass
      ? 'Bounded audience effects are consequential, non-terminal and exactly once.'
      : 'Audience influence violated consequence, fairness or idempotency requirements.',
  };

  const recoveryPass = bundle.chaos.status === 'pass'
    && bundle.chaos.recoveryVerified
    && bundle.chaos.oldWriterFenced
    && bundle.chaos.integrityFailures === 0;
  const durabilityRecovery: AntScoreCategory = {
    score: recoveryPass ? 14 : 0,
    max: 14,
    status: recoveryPass ? 'pass' : 'fail',
    summary: recoveryPass
      ? 'Durable reconstruction, fencing, fallback and output protection pass.'
      : 'Recovery, durable authority or stale-writer fencing failed.',
  };

  const operationsPass = bundle.drills.implementationStatus === 'pass'
    && bundle.chaos.drillsCompleted >= 12;
  const operationsDrills: AntScoreCategory = {
    score: operationsPass ? 10 : 0,
    max: 10,
    status: operationsPass ? 'pass' : 'fail',
    summary: operationsPass
      ? 'Implementation drills, safe scenes, alerts and chaos gates pass.'
      : 'Operational implementation drill coverage is incomplete.',
  };

  let external = 0;
  if (bundle.capacity.productionReferenceSatisfied) external += 2;
  if (bundle.providers.status === 'pass') external += 2;
  if (bundle.safety.status === 'pass') external += 2;
  if (bundle.endurance.status === 'pass') external += 2;
  if (bundle.drills.productionStatus === 'pass') external += 1;
  if (bundle.canary.status === 'eligible') external += 2;
  if (
    bundle.independentReview.status === 'pass'
    && bundle.independentReview.source === 'external-signed'
    && bundle.independentReview.candidateChecksum === bundle.manifest.checksum
  ) external += 1;
  const productionEvidence: AntScoreCategory = {
    score: external,
    max: 12,
    status: external === 12 ? 'pass' : 'blocked',
    summary: external === 12
      ? 'Every production-reference and independent evidence gate passes.'
      : 'Real provider, external review, elapsed endurance/canary or witnessed-production evidence remains incomplete.',
  };

  const categories = {
    deterministicIntegrity,
    autonomousEcosystem,
    privacyBoundary,
    broadcastAccessibility,
    audienceSafety,
    durabilityRecovery,
    operationsDrills,
    productionEvidence,
  };
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
