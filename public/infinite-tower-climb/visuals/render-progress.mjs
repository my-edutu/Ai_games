// Renderer submission liveness only. A returned render call is not proof of GPU
// completion or a composited/presented image; those need separate output probes.
export function createRenderProgress() {
  const staleAfterMs = 3000;
  let expected = false, visible = true, submittedSinceReset = false;
  let idleSince = 0, lastSubmitted = null, submittedFrames = 0, sampleAnchor = null;
  const intervals = [];

  function expectFrame(now) {
    if (expected) return;
    expected = true; idleSince = now;
  }
  function submitted(snapshot, now) {
    expectFrame(now);
    submittedFrames++;
    const interval = sampleAnchor === null ? null : now - sampleAnchor;
    // Warmup is explicit; real visible stalls stay in the bounded distribution.
    if (visible && submittedFrames > 8 && Number.isFinite(interval) && interval > 0) {
      intervals.push(interval);
      if (intervals.length > 240) intervals.shift();
    }
    sampleAnchor = visible ? now : null;
    lastSubmitted = { tick: snapshot.tick, floor: snapshot.floor, runToken: snapshot.runToken, atMs: now };
    submittedSinceReset = true; idleSince = now;
  }
  function setVisible(next, now) {
    if (visible === next) return;
    visible = next;
    sampleAnchor = null;
    if (visible) idleSince = now;
  }
  function reset(now) {
    idleSince = now; submittedSinceReset = false; sampleAnchor = null;
  }
  function diagnostics(now) {
    const visibleIdleMs = expected && visible ? Math.max(0, now - idleSince) : 0;
    const state = !expected ? 'waiting' : !visible ? 'hidden'
      : visibleIdleMs >= staleAfterMs ? 'stalled' : submittedSinceReset ? 'current' : 'starting';
    const sorted = [...intervals].sort((a, b) => a - b);
    const percentile = fraction => sorted.length ? +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))].toFixed(1) : null;
    return { state, visibleIdleMs: Math.round(visibleIdleMs), staleAfterMs, submittedFrames,
      frameMs: { p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), max: percentile(1), samples: sorted.length },
      lastSubmitted: lastSubmitted ? { ...lastSubmitted } : null };
  }
  return { expectFrame, submitted, setVisible, reset, diagnostics };
}
