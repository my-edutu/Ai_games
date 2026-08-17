import type { BattleState } from '../state/types';

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (key === 'checksum' || key === 'finalChecksum') continue;
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) result[key] = stableValue(child);
    }
    return result;
  }
  return value;
}

export function stableStringify(value: unknown): string { return JSON.stringify(stableValue(value)); }
export function fnv1aHex(input: string): string {
  let hash = 2_166_136_261 >>> 0;
  for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16_777_619) >>> 0; }
  return hash.toString(16).padStart(8, '0');
}
export function battleChecksum(state: BattleState): string { return fnv1aHex(stableStringify(state)); }
