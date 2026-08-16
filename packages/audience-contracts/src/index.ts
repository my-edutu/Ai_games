export type AudienceProvider = 'twitch' | 'youtube' | 'fixture';
export type AudienceInputKind = 'vote' | 'support' | 'membership' | 'gift' | 'moderation' | 'reversal';
export type EntitlementBand = 'none' | 'supporter' | 'premium' | 'gift';
export type AuthorizationMode = 'oauth-user' | 'service-account' | 'fixture';

export interface AudienceInput {
  schemaVersion: 1;
  provider: AudienceProvider;
  providerEventId: string;
  occurredAtMs: number;
  receivedAtMs: number;
  channelRef: string;
  viewerRef: string | null;
  displayName: string | null;
  kind: AudienceInputKind;
  fixedToken: string | null;
  entitlementBand: EntitlementBand;
  entitlementWeight: 1 | 2 | 3;
  rawDigest: string;
  reversalOf: string | null;
  idempotencyKey: string;
}

export interface AdapterContext {
  channelRef: string;
  receivedAtMs: number;
  identitySecret: string;
  fixedTokens: Record<string, string>;
  maxEventAgeMs: number;
  authenticatedClient: boolean;
  authorizationMode: AuthorizationMode;
}

export interface TwitchWebhookHeaders {
  messageId: string;
  messageTimestamp: string;
  messageSignature: string;
  messageType: string;
}

export interface NormalizedSupportPolicy {
  band: EntitlementBand;
  weight: 1 | 2 | 3;
}

export interface ProviderFixtureManifest {
  provider: AudienceProvider;
  eventType: string;
  version: string;
  capturedAt: string;
  authoritativeEligible: boolean;
}
