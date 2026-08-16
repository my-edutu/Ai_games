import type { AudienceProvider } from '../../audience-contracts/src/index';
import { AudienceAdapterError } from './errors';

declare const require: (id: string) => any;
const crypto = require('node:crypto') as {
  createHash(algorithm: string): { update(value: string): any; digest(encoding: 'hex'): string };
  createHmac(algorithm: string, key: string): { update(value: string): any; digest(encoding: 'hex'): string };
};

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hmacSha256Hex(secret: string, value: string): string {
  if (typeof secret !== 'string' || secret.length < 10) {
    throw new AudienceAdapterError('INVALID_SECRET', 'identity secret must contain at least 10 characters');
  }
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function tokenizeViewer(
  provider: AudienceProvider,
  channelRef: string,
  providerViewerId: string,
  secret: string,
): string {
  if (!providerViewerId || !channelRef) throw new AudienceAdapterError('INVALID_CONTEXT', 'viewer and channel are required');
  return `aud_${hmacSha256Hex(secret, `${provider}\u001f${channelRef}\u001f${providerViewerId}`).slice(0, 24)}`;
}

export function sanitizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const withoutTags = value.replace(/<[^>]*>/g, '');
  const normalized = withoutTags
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return null;
  return normalized.slice(0, 40);
}

export function normalizeFixedToken(value: unknown, fixedTokens: Record<string, string>): string | null {
  if (typeof value !== 'string' || value.length > 80) return null;
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const match = /^(?:!vote\s+)?([A-Za-z0-9_-]{1,16})$/i.exec(normalized);
  if (!match) return null;
  const key = match[1].toUpperCase();
  const entries = Object.entries(fixedTokens);
  const found = entries.find(([candidate]) => candidate.toUpperCase() === key);
  return found?.[1] ?? null;
}

export function makeIdempotencyKey(
  provider: AudienceProvider,
  channelRef: string,
  providerEventId: string,
  kind: string,
): string {
  return `aud_${sha256Hex(`${provider}\u001f${channelRef}\u001f${providerEventId}\u001f${kind}`).slice(0, 32)}`;
}
