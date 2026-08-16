import type { AudienceInput } from '../../audience-contracts/src/index';
import { sanitizeDisplayName } from './identity';

export interface GatewayContext {
  nowMs: number;
  moderationAvailable: boolean;
  auditAvailable: boolean;
  entitlementVerified: boolean;
  publicNamesEnabled: boolean;
  sanctionedViewerRefs: ReadonlySet<string>;
}

export type ServiceGateReason =
  | 'sanctioned'
  | 'moderation-unavailable'
  | 'audit-unavailable'
  | 'entitlement-unverified';

export function isPaidEligible(input: AudienceInput): boolean {
  return input.kind === 'support' || input.kind === 'membership' || input.kind === 'gift';
}

export function evaluateServiceGate(input: AudienceInput, context: GatewayContext): ServiceGateReason | null {
  if (input.viewerRef && context.sanctionedViewerRefs.has(input.viewerRef)) return 'sanctioned';
  if (!isPaidEligible(input)) return null;
  if (!context.moderationAvailable) return 'moderation-unavailable';
  if (!context.auditAvailable) return 'audit-unavailable';
  if (!context.entitlementVerified) return 'entitlement-unverified';
  return null;
}

export function publicDisplayName(input: AudienceInput, context: GatewayContext): string | null {
  if (!context.publicNamesEnabled || !context.moderationAvailable) return null;
  if (input.viewerRef && context.sanctionedViewerRefs.has(input.viewerRef)) return null;
  return sanitizeDisplayName(input.displayName);
}
