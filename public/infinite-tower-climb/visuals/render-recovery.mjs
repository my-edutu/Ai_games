// A bounded response to JavaScript/renderer submission faults, distinct from
// WebGL context loss. Presentation never pauses the authoritative expedition.
export const TOWER_RENDER_RESET_DELAYS_MS = Object.freeze([250, 750, 1800]);

export function towerRenderFaultDecision(consecutiveFailures, attempts, nowMs) {
  if (!Number.isSafeInteger(consecutiveFailures) || consecutiveFailures < 1 ||
      !Number.isSafeInteger(attempts) || attempts < 0 ||
      !Number.isFinite(nowMs) || nowMs < 0) {
    return { state: 'failed', attempts: Math.max(0, attempts || 0), retryAt: null };
  }
  if (consecutiveFailures === 1) {
    return { state: 'live', attempts, retryAt: null };
  }
  if (attempts >= TOWER_RENDER_RESET_DELAYS_MS.length) {
    return { state: 'failed', attempts, retryAt: null };
  }
  return {
    state: 'retrying',
    attempts: attempts + 1,
    retryAt: nowMs + TOWER_RENDER_RESET_DELAYS_MS[attempts],
  };
}

export function towerRenderRetryReady(state, retryAt, nowMs) {
  return state === 'retrying' && Number.isFinite(retryAt) &&
    Number.isFinite(nowMs) && nowMs >= retryAt;
}
