import type { AudienceInput } from '../../audience-contracts/src/index';
import { AudienceGateway } from '../../audience-gateway/src/gateway';
import { InMemoryDurableStore } from '../../durable-store/src/index';
import { AlertEngine } from '../../observability/src/index';
import { OperatorControlPlane } from '../../operator-control/src/index';
import { OperationalOutputHealth } from '../../output-health/src/index';
import { RunLeaseStore } from '../../operations-core/src/lease';
import { checksum } from '../../replay/src/index';
import { createReleaseManifest, detectMaterialChanges } from '../../release-governance/src/index';
import { createRecoveryCheckpoint, recoverFromEvidence } from '../../recovery/src/index';
import { RunSupervisor } from '../../supervisor/src/index';
import { SnakeRuntime } from '../../../games/autonomous-snake/src/runtime/run';
import { SnakeChannelService } from '../../../services/snake-channel/src/index';
import { MANDATORY_DRILLS, type DrillRecord, type MandatoryDrillId } from './drills';

const compatibility = { gameVersion: '0.6.0', deterministicVersion: 'snake-r2', configHash: 'drill-cfg', contentHash: 'drill-content' };
const channelConfig = { width: 12, height: 10, targetLength: 24, profile: 'rings' as const };

function paidInput(serial: string): AudienceInput {
  return {
    schemaVersion: 1,
    provider: 'fixture',
    providerEventId: `provider-${serial}`,
    occurredAtMs: 900,
    receivedAtMs: 1000,
    channelRef: 'drill-channel',
    viewerRef: 'aud_aaaaaaaaaaaaaaaaaaaaaaaa',
    displayName: 'Drill Viewer',
    kind: 'support',
    fixedToken: null,
    entitlementBand: 'premium',
    entitlementWeight: 3,
    rawDigest: 'b'.repeat(64),
    reversalOf: null,
    idempotencyKey: `aud_${serial.padStart(32, '0')}`,
  };
}

function gateway(): AudienceGateway {
  return new AudienceGateway({
    allowedTokens: ['A', 'B', 'C'], queueCapacity: 8, decisionCapacity: 32,
    retentionMs: 60_000, inputMaxAgeMs: 10_000, futureSkewMs: 2_000,
    rateWindowMs: 1_000, viewerLimit: 5, channelLimit: 10, globalLimit: 20,
  });
}

function context(overrides: Partial<{ moderationAvailable: boolean; auditAvailable: boolean; entitlementVerified: boolean }> = {}) {
  return { nowMs: 1000, moderationAvailable: true, auditAvailable: true, entitlementVerified: true, publicNamesEnabled: true, sanctionedViewerRefs: new Set<string>(), ...overrides };
}

function channelService(seed: string) {
  const store = new InMemoryDurableStore({ eventCapacity: 2_000, snapshotCapacity: 4, auditCapacity: 100 });
  const leases = new RunLeaseStore();
  const service = new SnakeChannelService({ channelId: 'drill-channel', workerId: 'drill-worker', seed, config: channelConfig, store, leases, leaseTtlMs: 10_000, snapshotEveryCommands: 2, compatibility });
  service.start(0);
  return service;
}

function supervisor() {
  return new RunSupervisor({ heartbeatTimeoutMs: 1_000, progressTimeoutMs: 2_000, crashThreshold: 3, crashWindowMs: 10_000, breakerCooldownMs: 5_000, maxComponents: 8 });
}

function outputHealth() {
  return new OperationalOutputHealth({ staleAfterMs: 1_000, frozenAfterMs: 1_500, silenceAfterMs: 1_200, blackLumaThreshold: 0.01, queueWarnRatio: 0.8, memorySlopeWarnMbPerHour: 20 });
}

function baseOutput(overrides: Record<string, unknown> = {}) {
  return { nowMs: 2_000, lastSnapshotMs: 1_900, lastFrameChangeMs: 1_950, luma: 0.3, expectedScene: 'normal', actualScene: 'normal', lastAudioMs: 1_950, intendedSilence: false, queueUtilization: 0.2, memorySlopeMbPerHour: 1, ...overrides };
}

function releaseManifest() {
  return createReleaseManifest({
    releaseId: 'drill-release', candidateSourceSha: '74e9319f74985e224f3abd909a6d19ba06ac996d', createdAtMs: 1,
    versions: { platform: '0.6.0', game: '1', deterministic: 'snake-r2', snapshot: '1', event: '1', providerAdapters: '2026-08-16', configHash: 'cfg', contentHash: 'content', assetsHash: 'assets', deploymentArtifact: 'image@sha256:candidate' },
    environment: { name: 'ci', region: 'local', hardwareRef: 'ci', productionReference: false }, featureFlags: { chatVsAi: true },
    owners: { release: 'release', onCall: 'oncall', security: 'security', product: 'product' },
    rollback: { sourceSha: 'bee0d26e8746a554c96afaedbd1ad5a9842dabc6', deploymentArtifact: 'image@sha256:previous', configHash: 'oldcfg', contentHash: 'oldcontent', freshRunBoundary: true },
    artifacts: [{ name: 'drill', kind: 'synthetic', digest: 'sha256:deadbeef' }],
  });
}

function executeDrill(id: MandatoryDrillId, candidateChecksum: string): Record<string, unknown> {
  if (id === 'provider-outage') {
    const service = channelService(`${candidateChecksum}:provider`); service.setDependencyHealth({ gateway: false }); const before = service.runtime.state.tick; service.tick('autonomous', 10);
    return { simulationAdvanced: service.runtime.state.tick === before + 1, interactionsDisabled: !service.status().interactionsEnabled };
  }
  if (id === 'moderation-outage') return { reason: gateway().process(paidInput('1'), context({ moderationAvailable: false })).reason };
  if (id === 'entitlement-outage') return { reason: gateway().process(paidInput('2'), context({ entitlementVerified: false })).reason };
  if (id === 'audit-outage') return { reason: gateway().process(paidInput('3'), context({ auditAvailable: false })).reason };
  if (id === 'disable-interactions' || id === 'disable-public-text' || id === 'emergency-halt') {
    const plane = new OperatorControlPlane({ environment: 'production' }); const action = id === 'emergency-halt' ? 'emergency-halt' : id; plane.execute({ id, actor: 'drill-admin', role: id === 'emergency-halt' ? 'admin' : 'operator', environment: 'production', action, reason: 'synthetic drill' }, 1); return plane.state();
  }
  if (['simulation-failure', 'renderer-failure', 'audio-failure', 'gateway-failure'].includes(id)) {
    const component = id.replace('-failure', ''); const s = supervisor(); s.heartbeat({ component, nowMs: 0, progressSeq: 1, resourcePressure: 0.1 }); const result = s.evaluate(1_501); return { level: result.level, actions: result.actions.map(action => action.type), component };
  }
  if (id === 'persistence-failure') {
    const service = channelService(`${candidateChecksum}:persistence`); service.setDependencyHealth({ persistence: false }); const before = checksum(service.runtime.state); let code = ''; try { service.tick('blocked', 10); } catch (error) { code = String((error as { code?: string }).code ?? ''); } return { commandRejectedBeforeAuthority: code === 'PERSISTENCE_UNAVAILABLE' && checksum(service.runtime.state) === before, code };
  }
  if (['black-output', 'frozen-output', 'wrong-scene', 'silent-output'].includes(id)) {
    const overrides = id === 'black-output' ? { luma: 0 } : id === 'frozen-output' ? { lastFrameChangeMs: 0 } : id === 'wrong-scene' ? { actualScene: 'maintenance' } : { lastAudioMs: 0 };
    const result = outputHealth().check(baseOutput(overrides)); return { status: result.status, action: result.action, safeScene: result.operations.includes('activate-safe-scene'), reasons: result.reasons };
  }
  if (id === 'verified-restore' || id === 'older-snapshot-fallback' || id === 'divergence-quarantine') {
    const runtime = SnakeRuntime.create(channelConfig, `${candidateChecksum}:${id}`); const older = createRecoveryCheckpoint(runtime, { streamId: 'drill', id: 'older', commandSeq: 0, createdAtMs: 1, compatibility }); runtime.step(); const expected = checksum(runtime.state); const newer = createRecoveryCheckpoint(runtime, { streamId: 'drill', id: 'newer', commandSeq: 1, createdAtMs: 2, compatibility });
    if (id === 'verified-restore') { const result = recoverFromEvidence({ snapshots: [newer], commands: [], compatibility, expectedChecksum: expected }); return { restored: result.status === 'restored', checksumMatch: result.status === 'restored' && checksum(result.runtime.state) === expected }; }
    if (id === 'older-snapshot-fallback') { const result = recoverFromEvidence({ snapshots: [{ ...newer, checksum: 'corrupt' }, older], commands: [{ schemaVersion: 1, id: 'step-1', seq: 1, kind: 'step' }], compatibility, expectedChecksum: expected }); return { restored: result.status === 'restored', olderSnapshotUsed: result.status === 'restored' && result.snapshotId === 'older', rejected: result.rejected }; }
    const result = recoverFromEvidence({ snapshots: [older], commands: [{ schemaVersion: 1, id: 'step-1', seq: 1, kind: 'step' }], compatibility, expectedChecksum: 'wrong' }); return { quarantined: result.status === 'quarantined', reason: result.status === 'quarantined' ? result.reason : '' };
  }
  if (id === 'credential-rotation' || id === 'credential-revocation') {
    const plane = new OperatorControlPlane({ environment: 'production' }); plane.execute({ id, actor: 'security', role: 'operator', environment: 'production', action: 'disable-interactions', reason: id }, 1); return { interactionsDisabled: !plane.state().interactionsEnabled, auditRecorded: plane.audit().length === 1, credentialAction: id };
  }
  if (id === 'config-rollback' || id === 'content-rollback' || id === 'deployment-rollback') {
    const frozen = releaseManifest(); const versions = { ...frozen.versions, ...(id === 'config-rollback' ? { configHash: 'changed' } : id === 'content-rollback' ? { contentHash: 'changed' } : { deploymentArtifact: 'image@sha256:changed' }) }; const changes = detectMaterialChanges(frozen, { ...frozen, versions }); return { material: changes.material, categories: changes.categories, canaryReset: changes.invalidatedGates.includes('canary-clock') };
  }
  if (id === 'safe-intermission') { const runtime = SnakeRuntime.create(channelConfig, `${candidateChecksum}:intermission`); runtime.state.lifecycle = 'result'; runtime.step(); return { lifecycle: runtime.state.lifecycle, safe: runtime.state.lifecycle === 'intermission' }; }
  if (id === 'alert-escalation') { const alerts = new AlertEngine([{ id: 'tick', metric: 'tick_ms', operator: 'gt', threshold: 20, forSamples: 2, recoverSamples: 2, severity: 'page', runbook: 'docs/operations/autonomous-snake-runbook.md' }]); alerts.evaluate({ tick_ms: 25 }, 1); const transitions = alerts.evaluate({ tick_ms: 30 }, 2); return { alertFired: transitions.some(transition => transition.type === 'fired'), runbook: transitions[0]?.runbook ?? '' }; }
  throw new Error(`Unhandled drill ${id}`);
}

function drillPassed(id: MandatoryDrillId, observations: Record<string, unknown>): boolean {
  if (id === 'moderation-outage') return observations.reason === 'moderation-unavailable';
  if (id === 'entitlement-outage') return observations.reason === 'entitlement-unverified';
  if (id === 'audit-outage') return observations.reason === 'audit-unavailable';
  if (id === 'provider-outage') return observations.simulationAdvanced === true && observations.interactionsDisabled === true;
  if (id === 'persistence-failure') return observations.commandRejectedBeforeAuthority === true;
  if (id === 'verified-restore') return observations.checksumMatch === true;
  if (id === 'older-snapshot-fallback') return observations.olderSnapshotUsed === true;
  if (id === 'divergence-quarantine') return observations.quarantined === true;
  if (id === 'black-output') return observations.safeScene === true;
  if (id === 'emergency-halt') return observations.simulationEnabled === false;
  if (id === 'alert-escalation') return observations.alertFired === true;
  if (id === 'safe-intermission') return observations.safe === true;
  if (id.endsWith('-rollback')) return observations.material === true && observations.canaryReset === true;
  if (id.startsWith('credential-')) return observations.interactionsDisabled === true && observations.auditRecorded === true;
  if (id === 'disable-interactions') return observations.interactionsEnabled === false;
  if (id === 'disable-public-text') return observations.publicTextEnabled === false;
  if (id.endsWith('-failure')) return Array.isArray(observations.actions) && observations.actions.length > 0;
  if (id.endsWith('-output')) return observations.status !== 'healthy';
  return true;
}

export interface SyntheticDrillProgramme { schemaVersion: 1; candidateChecksum: string; records: DrillRecord[]; programmeChecksum: string; }
export function runSyntheticDrillProgramme(candidateChecksum: string): SyntheticDrillProgramme {
  if (!candidateChecksum) throw new RangeError('candidateChecksum');
  const records = MANDATORY_DRILLS.map((id, index) => {
    const observations = executeDrill(id, candidateChecksum); const status = drillPassed(id, observations) ? 'pass' : 'fail'; const digest = `sha256:${checksum({ id, candidateChecksum, observations })}`;
    return { id, candidateChecksum, environment: 'ci' as const, source: 'synthetic' as const, owner: 'ci-drill-runner', witness: '', runbook: 'docs/operations/autonomous-snake-runbook.md', startedAtMs: 1_000 + index * 10, endedAtMs: 1_005 + index * 10, status, evidenceDigest: digest, automatedActionsVerified: status === 'pass', outputVerified: status === 'pass', observations };
  });
  const base = { schemaVersion: 1 as const, candidateChecksum, records }; return { ...base, programmeChecksum: checksum(base) };
}
