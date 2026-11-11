// Authoritative source stays on the original 20Hz host. This policy only
// reduces the EXTRA client-side idle delay after successful HTTP delivery.
// No new overlapping fetch, local simulation, replay clock or fake tick.
export const TOWER_STATE_POLL_INTERVAL_MS = 100;
export const TOWER_STATE_POLL_MIN_YIELD_MS = 16;

export function nextTowerStatePollDelay({
  startedAtMs, completedAtMs, failures = 0,
  intervalMs = TOWER_STATE_POLL_INTERVAL_MS,
} = {}) {
  if (!Number.isSafeInteger(failures) || failures < 0)
    throw new RangeError('failures must be a non-negative integer');
  if (failures) return Math.min(3000, 400 * failures);
  if (!Number.isFinite(intervalMs) || intervalMs < TOWER_STATE_POLL_MIN_YIELD_MS)
    throw new RangeError('invalid state poll cadence');
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(completedAtMs) ||
      completedAtMs < startedAtMs) return intervalMs;
  // Legacy behaviour unnecessarily waited another full 100ms AFTER every
  // response and browser-side JSON/scene update. A slow 150ms delivery thus
  // sampled the real source every >=250ms. Target a bounded 100ms
  // START-to-START cadence, yielding at least one compositor opportunity
  // after an overrun. A stalled host gets no synthetic frames or backlog.
  const spentMs = completedAtMs - startedAtMs;
  return Math.max(TOWER_STATE_POLL_MIN_YIELD_MS,
    Math.min(intervalMs, intervalMs - spentMs));
}
