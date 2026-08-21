import { createHmac } from 'node:crypto';
import type { InfluenceEffectId } from '../state/types';

export type BattleAudienceProvider = 'youtube' | 'twitch' | 'test';
export type BattleModerationStatus = 'pass' | 'reject' | 'unavailable';

export interface BattleProviderVoteInput {
  provider: BattleAudienceProvider;
  eventId: string;
  subject: string;
  displayName?: string;
  optionId: InfluenceEffectId;
  entitlementWeight: number;
  occurredTick: number;
  receivedTick: number;
  authenticated: boolean;
  moderation: BattleModerationStatus;
  regionAllowed: boolean;
  identitySalt: string;
}

export interface BattleAudienceInput {
  schemaVersion: 1;
  provider: BattleAudienceProvider;
  providerEventId: string;
  idempotencyKey: string;
  viewerToken: string;
  authenticated: boolean;
  moderation: BattleModerationStatus;
  regionAllowed: boolean;
  occurredTick: number;
  receivedTick: number;
  kind: 'vote';
  optionId: InfluenceEffectId;
  entitlementWeight: number;
}

export interface BattleGatewayOptions {
  maxEventAgeTicks: number;
  maxFutureTicks: number;
  perViewerWindowTicks: number;
  perViewerLimit: number;
  globalWindowTicks: number;
  globalLimit: number;
  maxSeen: number;
}

export type BattleGatewayRejectReason =
  | 'schema'
  | 'provider'
  | 'authentication'
  | 'moderation-unavailable'
  | 'moderation-reject'
  | 'region'
  | 'event-id'
  | 'idempotency-key'
  | 'viewer-token'
  | 'tick'
  | 'future'
  | 'stale'
  | 'kind'
  | 'effect'
  | 'entitlement-weight'
  | 'duplicate'
  | 'viewer-rate'
  | 'global-rate';

export type BattleGatewayDecision =
  | { status: 'accepted'; reason: 'accepted'; input: Readonly<BattleAudienceInput> }
  | { status: 'rejected'; reason: BattleGatewayRejectReason };

const DEFAULTS: BattleGatewayOptions = {
  maxEventAgeTicks: 120,
  maxFutureTicks: 5,
  perViewerWindowTicks: 60,
  perViewerLimit: 4,
  globalWindowTicks: 60,
  globalLimit: 240,
  maxSeen: 4_096,
};

const TOKEN = /^[A-Za-z0-9_-]{8,64}$/;
const ID = /^[A-Za-z0-9:_-]{3,96}$/;
const EFFECTS = new Set<InfluenceEffectId>(['supply-rain', 'zone-hold', 'medic-mist', 'radar-pulse', 'theme-shift']);

function isEffectId(value: unknown): value is InfluenceEffectId {
  return typeof value === 'string' && EFFECTS.has(value as InfluenceEffectId);
}

export function normalizeBattleProviderVote(input: BattleProviderVoteInput): BattleAudienceInput {
  if (!input.identitySalt || input.identitySalt.length < 16) throw new RangeError('identitySalt');
  const digest = createHmac('sha256', input.identitySalt)
    .update(`${input.provider}:${input.subject}`)
    .digest('hex')
    .slice(0, 24);
  return {
    schemaVersion: 1,
    provider: input.provider,
    providerEventId: input.eventId,
    idempotencyKey: `${input.provider}:${input.eventId}`,
    viewerToken: `viewer_${digest}`,
    authenticated: input.authenticated,
    moderation: input.moderation,
    regionAllowed: input.regionAllowed,
    occurredTick: input.occurredTick,
    receivedTick: input.receivedTick,
    kind: 'vote',
    optionId: input.optionId,
    entitlementWeight: input.entitlementWeight,
  };
}

export class BattleAudienceGateway {
  private readonly options: BattleGatewayOptions;
  private readonly seen = new Set<string>();
  private readonly seenOrder: string[] = [];
  private readonly viewerTicks = new Map<string, number[]>();
  private globalTicks: number[] = [];

  constructor(options: Partial<BattleGatewayOptions> = {}) {
    this.options = { ...DEFAULTS, ...options };
    for (const value of Object.values(this.options)) {
      if (!Number.isInteger(value) || value < 1) throw new RangeError('gateway-options');
    }
  }

  private reject(reason: BattleGatewayRejectReason): BattleGatewayDecision {
    return { status: 'rejected', reason };
  }

  accept(value: BattleAudienceInput): BattleGatewayDecision {
    if (!value || value.schemaVersion !== 1) return this.reject('schema');
    if (!['youtube', 'twitch', 'test'].includes(value.provider)) return this.reject('provider');
    if (!value.authenticated) return this.reject('authentication');
    if (value.moderation === 'unavailable') return this.reject('moderation-unavailable');
    if (value.moderation !== 'pass') return this.reject('moderation-reject');
    if (!value.regionAllowed) return this.reject('region');
    if (!ID.test(value.providerEventId)) return this.reject('event-id');
    if (!ID.test(value.idempotencyKey)) return this.reject('idempotency-key');
    if (!TOKEN.test(value.viewerToken)) return this.reject('viewer-token');
    if (!Number.isInteger(value.occurredTick) || !Number.isInteger(value.receivedTick) || value.occurredTick < 0 || value.receivedTick < 0) return this.reject('tick');
    if (value.occurredTick > value.receivedTick + this.options.maxFutureTicks) return this.reject('future');
    if (value.receivedTick - value.occurredTick > this.options.maxEventAgeTicks) return this.reject('stale');
    if (value.kind !== 'vote') return this.reject('kind');
    if (!isEffectId(value.optionId)) return this.reject('effect');
    if (!Number.isInteger(value.entitlementWeight) || value.entitlementWeight < 1 || value.entitlementWeight > 2) return this.reject('entitlement-weight');

    const eventKey = `event:${value.provider}:${value.providerEventId}`;
    if (this.seen.has(value.idempotencyKey) || this.seen.has(eventKey)) return this.reject('duplicate');

    const viewerCutoff = value.receivedTick - this.options.perViewerWindowTicks;
    const viewer = (this.viewerTicks.get(value.viewerToken) ?? []).filter((tick) => tick > viewerCutoff);
    if (viewer.length >= this.options.perViewerLimit) return this.reject('viewer-rate');

    const globalCutoff = value.receivedTick - this.options.globalWindowTicks;
    this.globalTicks = this.globalTicks.filter((tick) => tick > globalCutoff);
    if (this.globalTicks.length >= this.options.globalLimit) return this.reject('global-rate');

    viewer.push(value.receivedTick);
    this.viewerTicks.delete(value.viewerToken);
    this.viewerTicks.set(value.viewerToken, viewer);
    while (this.viewerTicks.size > this.options.maxSeen) {
      const oldest = this.viewerTicks.keys().next().value as string | undefined;
      if (!oldest) break;
      this.viewerTicks.delete(oldest);
    }

    this.globalTicks.push(value.receivedTick);
    for (const key of [value.idempotencyKey, eventKey]) {
      this.seen.add(key);
      this.seenOrder.push(key);
    }
    while (this.seenOrder.length > this.options.maxSeen) {
      const oldest = this.seenOrder.shift();
      if (oldest) this.seen.delete(oldest);
    }

    return { status: 'accepted', reason: 'accepted', input: Object.freeze({ ...value }) };
  }

  snapshot() {
    return Object.freeze({
      seenCount: this.seen.size,
      viewerBucketCount: this.viewerTicks.size,
      globalEventCount: this.globalTicks.length,
      limits: Object.freeze({ ...this.options }),
    });
  }
}
