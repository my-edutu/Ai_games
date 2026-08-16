import { CanaryController } from '../../canary-control/src/index';
import { checksum } from '../../replay/src/index';
import {
  assessTraceability,
  createReleaseManifest,
  type RequirementDefinition,
  type RequirementEvidence,
} from '../../release-governance/src/index';
import { assessReadiness } from '../../readiness-assessor/src/index';
import { assessProviderEvidence, assessSafetyAttestations } from './attestations';
import { evaluateCapacity } from './capacity';
import { runFinalCampaign } from './campaign';
import { assessDrillProgramme } from './drills';
import { runSyntheticDrillProgramme } from './drill-runner';
import { assessEndurance } from './endurance';

const DAY = 24 * 60 * 60 * 1_000;

function invalidSha(): Error {
  const error = new Error('candidate source must be a full Git commit SHA');
  Object.assign(error, { code: 'INVALID_CANDIDATE_SHA' });
  return error;
}

export function createCurrentValidationBundle(candidateSourceSha: string) {
  if (!/^[a-f0-9]{40}$/i.test(candidateSourceSha)) throw invalidSha();

  const manifest = createReleaseManifest({
    releaseId: `autonomous-snake-${candidateSourceSha.slice(0, 12)}`,
    candidateSourceSha,
    createdAtMs: 0,
    versions: {
      platform: '0.6.0', game: 'snake-1.0.0-rc1', deterministic: 'snake-r2', snapshot: '1', event: '1',
      providerAdapters: '2026-08-16', configHash: 'checksum:70686173', contentHash: 'checksum:636f6e74',
      assetsHash: 'checksum:61737365', deploymentArtifact: `source@${candidateSourceSha}`,
    },
    environment: { name: 'github-actions', region: 'hosted', hardwareRef: 'ubuntu-24.04-ci', productionReference: false },
    featureFlags: { chatVsAi: true, publicText: true, quality: 'ci-reference' },
    owners: { release: 'release-owner', onCall: 'on-call-owner', security: 'security-owner', product: 'product-owner' },
    rollback: {
      sourceSha: '74e9319f74985e224f3abd909a6d19ba06ac996d', deploymentArtifact: 'source@phase5',
      configHash: 'checksum:6f6c6463', contentHash: 'checksum:6f6c646f', freshRunBoundary: true,
    },
    artifacts: [
      { name: 'phase5-operations', kind: 'primary-ci-evidence', digest: 'sha256:1007c478bc533afa094e610545a6b6c9c7c31eaa5a4a661411227bd58810df79' },
      { name: 'phase3-capture', kind: 'browser-capture', digest: 'sha256:6e89985c37f9330cb892beb056a6f87d3cdaa949eb9265d586480b1fdb98fe18' },
    ],
  });

  const requirements: RequirementDefinition[] = [
    { id: 'FR-SNK-DET-001', phase: 1, level: 'MUST', owner: 'simulation' },
    { id: 'FR-SNK-AI-001', phase: 2, level: 'MUST', owner: 'gameplay' },
    { id: 'FR-SNK-UX-001', phase: 3, level: 'MUST', owner: 'presentation' },
    { id: 'FR-SNK-INT-001', phase: 4, level: 'MUST', owner: 'interaction' },
    { id: 'FR-SNK-OPS-001', phase: 5, level: 'MUST', owner: 'operations' },
    { id: 'FR-SNK-REL-001', phase: 6, level: 'MUST', owner: 'release' },
  ];
  const evidence: RequirementEvidence[] = requirements.map((requirement, index) => ({
    requirementId: requirement.id, status: 'pass', sourceSha: candidateSourceSha, releaseChecksum: manifest.checksum,
    digest: `sha256:${(0xabc00000 + index).toString(16)}`, collectedAtMs: index + 1, owner: requirement.owner,
  }));
  const traceability = assessTraceability(requirements, evidence, { release: manifest, nowMs: 10 });

  const campaign = runFinalCampaign({
    seed: `phase6:${candidateSourceSha.slice(0, 12)}`, runsPerScenario: 25, maxTicks: 500,
    width: 18, height: 16, targetLength: 45, profiles: ['open', 'corridors', 'rings', 'chambers', 'portals'], hazardCount: 2,
  });

  const capacity = evaluateCapacity({
    source: { kind: 'ci-reference', attested: true },
    samples: [
      { atMs: 0, tickMs: 4, aiMs: 2, renderMs: 8, snapshotMs: 12, restoreMs: 30, queueRatio: 0.2, memoryMb: 100 },
      { atMs: 3_600_000, tickMs: 5, aiMs: 2.5, renderMs: 9, snapshotMs: 13, restoreMs: 32, queueRatio: 0.3, memoryMb: 102 },
      { atMs: 7_200_000, tickMs: 6, aiMs: 3, renderMs: 10, snapshotMs: 14, restoreMs: 34, queueRatio: 0.4, memoryMb: 104 },
    ],
    budgets: { tickP99Ms: 10, aiP99Ms: 6, renderP99Ms: 16.7, snapshotP99Ms: 30, restoreP99Ms: 100, queueMaxRatio: 0.8, memorySlopeMbPerHour: 5, minHeadroomRatio: 0.2 },
  });

  const endurance = assessEndurance({
    candidateChecksum: manifest.checksum, source: 'synthetic', realElapsed: false,
    startedAtMs: 0, endedAtMs: 1_000 * 3_600_000, samples: 1_001,
    resourceSlopes: { memoryMbPerHour: 1, handlesPerHour: 0, queuePerHour: 0 },
    limits: { memoryMbPerHour: 5, handlesPerHour: 1, queuePerHour: 1 },
    duplicateEffects: 0, replayDivergences: 0, unresolvedOutputFailures: 0, manualCommonRecoveries: 0,
    privateExposures: 0, crashLoops: 0, evidenceDigest: 'sha256:abcdef12',
  }, 72, { expectedCandidateChecksum: manifest.checksum });

  const providers = assessProviderEvidence([
    { provider: 'youtube', candidateChecksum: manifest.checksum, environment: 'fixture', credentialed: false, productionEquivalent: false, source: 'ci', collectedAtMs: 1, expiresAtMs: 10_000, evidenceDigest: 'sha256:11111111', checks: { authentication: true, reconnect: true, duplicates: true, reversal: true, outage: true, rateLimit: true } },
    { provider: 'twitch', candidateChecksum: manifest.checksum, environment: 'fixture', credentialed: false, productionEquivalent: false, source: 'ci', collectedAtMs: 1, expiresAtMs: 10_000, evidenceDigest: 'sha256:22222222', checks: { authentication: true, reconnect: true, duplicates: true, reversal: true, outage: true, rateLimit: true } },
  ], { expectedCandidateChecksum: manifest.checksum, nowMs: 100, requiredProviders: ['youtube', 'twitch'] });

  const safetyKinds = ['security', 'privacy', 'moderation', 'accessibility', 'audiovisual', 'assets', 'supply-chain'];
  const safety = assessSafetyAttestations(safetyKinds.map((kind, index) => ({
    kind, candidateChecksum: manifest.checksum, environment: 'ci' as const, source: 'ci' as const, status: 'pass' as const,
    collectedAtMs: 1, expiresAtMs: 10_000, evidenceDigest: `sha256:${(0x33333333 + index).toString(16)}`,
    reviewer: 'ci-review', blockingFindings: 0, details: { implementationChecked: true },
  })), { expectedCandidateChecksum: manifest.checksum, nowMs: 100, requiredKinds: safetyKinds });

  const drillProgramme = runSyntheticDrillProgramme(manifest.checksum);
  const drills = assessDrillProgramme(drillProgramme.records, { expectedCandidateChecksum: manifest.checksum });

  const canaryController = new CanaryController({
    candidateChecksum: manifest.checksum, requiredDurationMs: 7 * DAY, maxSampleGapMs: DAY + 1,
    maxErrorRate: 0.02, minUptimeRatio: 0.999, maxBadOutputSeconds: 30, maxMemorySlopeMbPerHour: 5, minSamples: 8,
  });
  canaryController.start({ startedAtMs: 0, environment: 'ci', source: 'synthetic', realElapsed: false, attestationDigest: 'sha256:44444444' });
  for (let day = 0; day <= 7; day++) canaryController.ingest({
    candidateChecksum: manifest.checksum, atMs: day * DAY, errorRate: 0.001, uptimeRatio: 0.9999,
    badOutputSeconds: 0, memorySlopeMbPerHour: 1, replayDivergences: 0, duplicateEffects: 0,
    privateExposures: 0, unauthorizedControls: 0, unsafeModerationFailures: 0, crashLoops: 0,
    restoreFailures: 0, recordCorruptions: 0, platformPolicyBreaches: 0,
    evidenceDigest: `sha256:${(0x55555555 + day).toString(16)}`,
  });
  const canary = canaryController.evaluate(7 * DAY);

  const readiness = assessReadiness({
    manifest, traceability, campaign, capacity, endurance, providers, safety, drills, canary,
    independentReview: { status: 'missing', candidateChecksum: '', reviewer: '', source: 'none', evidenceDigest: '', openP0: 0, openP1: 0, acceptedP2: [] },
    findings: { openP0: 0, openP1: 0, acceptedP2: [] },
  });

  const base = { schemaVersion: 1 as const, manifest, requirements, evidence, traceability, campaign, capacity, endurance, providers, safety, drillProgramme, drills, canary, readiness };
  return { ...base, bundleChecksum: checksum(base) };
}
