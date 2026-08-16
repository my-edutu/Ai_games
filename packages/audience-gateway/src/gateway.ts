import type { AudienceInput } from '../../audience-contracts/src/index';
import { BoundedDecisionStore } from './dedupe';
import { sha256Hex } from './identity';
import {
  evaluateServiceGate,
  publicDisplayName,
  type GatewayContext,
} from './moderation';
import { FixedWindowRateLimiter } from './rate-limit';

export type GatewayReason =
  | 'accepted'
  | 'duplicate'
  | 'invalid-token'
  | 'late'
  | 'rate-limited'
  | 'sanctioned'
  | 'moderation-unavailable'
  | 'audit-unavailable'
  | 'entitlement-unverified'
  | 'queue-full'
  | 'reversal-recorded'
  | 'unknown-reversal';

export interface GatewayDecision {
  decisionId: string;
  inputIdempotencyKey: string;
  status: 'accepted' | 'rejected' | 'duplicate' | 'reversed';
  reason: GatewayReason;
  publicDisplayName: string | null;
  audienceInput?: Readonly<AudienceInput>;
}

export interface GatewayOptions {
  allowedTokens: string[];
  queueCapacity: number;
  decisionCapacity: number;
  retentionMs: number;
  inputMaxAgeMs: number;
  futureSkewMs: number;
  rateWindowMs: number;
  viewerLimit: number;
  channelLimit: number;
  globalLimit: number;
}

export interface GatewayDecisionSummary {
  decisionId: string;
  status: GatewayDecision['status'];
  reason: GatewayReason;
  recordedAtMs: number;
}

export interface GatewaySnapshot {
  schemaVersion: 1;
  queueLength: number;
  queueCapacity: number;
  dedupeEntries: number;
  rateEntries: number;
  reversalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  recentDecisions: GatewayDecisionSummary[];
}

function providerEventKey(input: AudienceInput): string {
  return `${input.provider}\u001f${input.channelRef}\u001f${input.providerEventId}`;
}

function clampWeight(value: number): 1 | 2 | 3 {
  const bounded = Math.max(1, Math.min(3, Math.round(Number(value) || 1)));
  return bounded as 1 | 2 | 3;
}

function freezeInput(input: AudienceInput, context: GatewayContext): Readonly<AudienceInput> {
  return Object.freeze({
    ...input,
    displayName: publicDisplayName(input, context),
    entitlementWeight: clampWeight(input.entitlementWeight),
  });
}

function freezeDecision(decision: GatewayDecision): GatewayDecision {
  return Object.freeze({ ...decision });
}

export class AudienceGateway {
  private readonly allowedTokens: ReadonlySet<string>;
  private readonly decisions: BoundedDecisionStore<GatewayDecision>;
  private readonly limiter: FixedWindowRateLimiter;
  private readonly queue: Readonly<AudienceInput>[] = [];
  private reversalCount = 0;
  private acceptedCount = 0;
  private rejectedCount = 0;
  private duplicateCount = 0;

  constructor(private readonly options: GatewayOptions) {
    this.validateOptions(options);
    this.allowedTokens = new Set(options.allowedTokens);
    this.decisions = new BoundedDecisionStore(options.decisionCapacity, options.retentionMs);
    this.limiter = new FixedWindowRateLimiter({
      windowMs: options.rateWindowMs,
      viewerLimit: options.viewerLimit,
      channelLimit: options.channelLimit,
      globalLimit: options.globalLimit,
    });
  }

  process(input: AudienceInput, context: GatewayContext): GatewayDecision {
    this.assertInput(input);
    this.assertContext(context);
    if (input.kind === 'reversal') return this.reverse(input, context);
    this.prune(context.nowMs);

    const existing = this.decisions.find(input.idempotencyKey, providerEventKey(input));
    if (existing) {
      this.duplicateCount++;
      return existing;
    }

    const ageReason = this.ageReason(input, context.nowMs);
    if (ageReason) return this.reject(input, ageReason, context.nowMs);

    if (!this.validToken(input)) return this.reject(input, 'invalid-token', context.nowMs);

    const serviceReason = evaluateServiceGate(input, context);
    if (serviceReason) return this.reject(input, serviceReason, context.nowMs);

    if (this.queue.length >= this.options.queueCapacity) return this.reject(input, 'queue-full', context.nowMs);

    if (!this.limiter.consume({ viewerRef: input.viewerRef, channelRef: input.channelRef }, context.nowMs)) {
      return this.reject(input, 'rate-limited', context.nowMs);
    }

    const normalized = freezeInput(input, context);
    const decision = this.makeDecision(normalized, 'accepted', 'accepted', context.nowMs, normalized.displayName);
    this.queue.push(normalized);
    this.acceptedCount++;
    return decision;
  }

  reverse(input: AudienceInput, context: GatewayContext): GatewayDecision {
    this.assertInput(input);
    this.assertContext(context);
    this.prune(context.nowMs);

    const existing = this.decisions.find(input.idempotencyKey, providerEventKey(input));
    if (existing) {
      this.duplicateCount++;
      return existing;
    }

    const ageReason = this.ageReason(input, context.nowMs);
    if (ageReason) return this.reject(input, ageReason, context.nowMs);
    if (input.kind !== 'reversal' || !input.reversalOf) return this.reject(input, 'unknown-reversal', context.nowMs);

    const original = this.decisions.getByIdempotencyKey(input.reversalOf);
    if (!original || original.status !== 'accepted' || !original.audienceInput) {
      return this.reject(input, 'unknown-reversal', context.nowMs);
    }
    if (!context.auditAvailable) return this.reject(input, 'audit-unavailable', context.nowMs);
    if (!context.moderationAvailable) return this.reject(input, 'moderation-unavailable', context.nowMs);
    if (this.queue.length >= this.options.queueCapacity) return this.reject(input, 'queue-full', context.nowMs);

    const normalized = freezeInput({ ...input, fixedToken: null, entitlementWeight: 1 }, { ...context, publicNamesEnabled: false });
    const decision = this.makeDecision(normalized, 'reversed', 'reversal-recorded', context.nowMs, null);
    this.queue.push(normalized);
    this.reversalCount++;
    return decision;
  }

  drainAccepted(limit: number): Readonly<AudienceInput>[] {
    if (!Number.isInteger(limit) || limit < 0) throw new RangeError('limit');
    return this.queue.splice(0, Math.min(limit, this.queue.length));
  }

  decisionFor(idempotencyKey: string): GatewayDecision | undefined {
    return this.decisions.getByIdempotencyKey(idempotencyKey);
  }

  snapshot(): GatewaySnapshot {
    return {
      schemaVersion: 1,
      queueLength: this.queue.length,
      queueCapacity: this.options.queueCapacity,
      dedupeEntries: this.decisions.size(),
      rateEntries: this.limiter.entryCount(),
      reversalCount: this.reversalCount,
      acceptedCount: this.acceptedCount,
      rejectedCount: this.rejectedCount,
      duplicateCount: this.duplicateCount,
      recentDecisions: this.decisions.recent().map(record => ({
        decisionId: record.decision.decisionId,
        status: record.decision.status,
        reason: record.decision.reason,
        recordedAtMs: record.recordedAtMs,
      })),
    };
  }

  private reject(input: AudienceInput, reason: Exclude<GatewayReason, 'accepted' | 'duplicate' | 'reversal-recorded'>, nowMs: number): GatewayDecision {
    this.rejectedCount++;
    return this.makeDecision(input, 'rejected', reason, nowMs, null);
  }

  private makeDecision(
    input: AudienceInput | Readonly<AudienceInput>,
    status: GatewayDecision['status'],
    reason: GatewayReason,
    nowMs: number,
    displayName: string | null,
  ): GatewayDecision {
    const decision = freezeDecision({
      decisionId: `gwd_${sha256Hex(`${input.idempotencyKey}\u001f${status}\u001f${reason}`).slice(0, 24)}`,
      inputIdempotencyKey: input.idempotencyKey,
      status,
      reason,
      publicDisplayName: displayName,
      audienceInput: status === 'accepted' || status === 'reversed' ? input : undefined,
    });
    this.decisions.put({
      decision,
      idempotencyKey: input.idempotencyKey,
      providerEventKey: providerEventKey(input),
      recordedAtMs: nowMs,
    });
    return decision;
  }

  private validToken(input: AudienceInput): boolean {
    if (input.kind === 'vote') return input.fixedToken !== null && this.allowedTokens.has(input.fixedToken);
    return input.fixedToken === null || this.allowedTokens.has(input.fixedToken);
  }

  private ageReason(input: AudienceInput, nowMs: number): 'late' | null {
    const ageMs = nowMs - input.receivedAtMs;
    if (ageMs > this.options.inputMaxAgeMs || ageMs < -this.options.futureSkewMs) return 'late';
    return null;
  }

  private prune(nowMs: number): void {
    this.decisions.prune(nowMs);
    this.limiter.prune(nowMs);
  }

  private assertInput(input: AudienceInput): void {
    if (!input || input.schemaVersion !== 1 || !input.idempotencyKey || !input.providerEventId || !input.channelRef) {
      throw new TypeError('invalid AudienceInput');
    }
  }

  private assertContext(context: GatewayContext): void {
    if (!context || !Number.isFinite(context.nowMs) || !(context.sanctionedViewerRefs instanceof Set)) {
      throw new TypeError('invalid GatewayContext');
    }
  }

  private validateOptions(options: GatewayOptions): void {
    if (!Array.isArray(options.allowedTokens) || options.allowedTokens.length < 1) throw new RangeError('allowedTokens');
    if (new Set(options.allowedTokens).size !== options.allowedTokens.length) throw new RangeError('allowedTokens');
    for (const [key, value] of Object.entries(options)) {
      if (key === 'allowedTokens') continue;
      if (!Number.isInteger(value) || value < 1) throw new RangeError(key);
    }
  }
}
