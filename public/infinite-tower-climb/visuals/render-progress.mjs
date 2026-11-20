// Renderer submission liveness only. A returned render call is not proof of GPU
// completion or a composited/presented image; those need separate output probes.
export function createRenderProgress() {
  const staleAfterMs = 3000;
  let expected = false, visible = true, submittedSinceReset = false;
  let idleSince = 0, lastSubmitted = null, submittedFrames = 0, sampleAnchor = null;
  const intervals = [];
  // This ring joins real browser HTTP acceptance to returned Three.js render
  // calls by original source token/tick/floor/phase. No pixels are inferred:
  // renderer-return is NOT Chromium compositor presentation or WebM evidence.
  const sourceTransitions = [];
  let lastAcceptedSourcePhase = null, lastSubmittedSourcePhase = null;
  function observeSourcePhase(phase, snapshot, atWallMs, renderWork = null) {
    if (!snapshot || !Number.isSafeInteger(snapshot.tick) ||
        !Number.isSafeInteger(snapshot.floor) ||
        typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
        typeof snapshot.lifecycle !== 'string' || !Number.isFinite(atWallMs))
      return;
    const key = snapshot.runToken + ':' + snapshot.floor + ':' + snapshot.lifecycle;
    if (phase === 'browser-accepted') {
      if (key === lastAcceptedSourcePhase) return;
      lastAcceptedSourcePhase = key;
    } else {
      if (key === lastSubmittedSourcePhase) return;
      lastSubmittedSourcePhase = key;
    }
    // Actual CPU scene + world rebuild versus renderer.render() return.
    // These clocks partition a successful submitted browser frame only; they
    // do not measure compositor paint, physical GPU completion or native WebM.
    const cost = value => Number.isFinite(value) && value >= 0 && value <= 120000
      ? Math.round(value * 10) / 10 : null;
    // A first Floor9 trace is attributable only after a returned render on
    // the same source snapshot. Keep it separate from hardware GPU metrics:
    // these are browser main-thread performance.now() partitions only.
    const coldStages = phase === 'renderer-submitted' &&
      snapshot.floor === 9 && snapshot.lifecycle === 'running' &&
      renderWork?.firstF9MainThread
        ? { sceneSetup: cost(renderWork.firstF9MainThread.sceneSetupMs),
            worldUpdate: cost(renderWork.firstF9MainThread.worldUpdateMs),
            heroThreat: cost(renderWork.firstF9MainThread.heroThreatMs),
            cameraLighting: cost(renderWork.firstF9MainThread.cameraLightingMs) }
        : null;
    const renderWorkMs = phase === 'renderer-submitted' && renderWork
      ? { sceneUpdate: cost(renderWork.sceneUpdateMs),
          rendererReturn: cost(renderWork.rendererReturnMs),
          worldRebuild: cost(renderWork.worldRebuildMs),
          total: cost(renderWork.totalSubmissionMs),
          ...(coldStages ? { firstF9MainThread: coldStages } : {}) } : null;
    sourceTransitions.push({
      phase, runToken: snapshot.runToken, tick: snapshot.tick,
      floor: snapshot.floor, lifecycle: snapshot.lifecycle,
      atWallMs, ...(renderWorkMs ? { renderWorkMs } : {}),
    });
    if (sourceTransitions.length > 64) sourceTransitions.shift();
  }
  function received(snapshot, now, atWallMs = Date.now()) {
    expectFrame(now);
    observeSourcePhase('browser-accepted', snapshot, atWallMs);
  }

  function expectFrame(now) {
    if (expected) return;
    expected = true; idleSince = now;
  }
  function submitted(snapshot, now, atWallMs = Date.now(), renderWork = null) {
    expectFrame(now);
    submittedFrames++;
    observeSourcePhase('renderer-submitted', snapshot, atWallMs, renderWork);
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
    lastAcceptedSourcePhase = null; lastSubmittedSourcePhase = null;
  }
  // Constant-work HUD state. Do not sort frame-time samples or copy up to 64
  // raw source/renderer events merely to refresh the ordinary live overlay.
  // The full diagnostics() path below is intentionally retained for explicit,
  // source-pinned capture and engineering inspection.
  function liveness(now) {
    const visibleIdleMs = expected && visible ? Math.max(0, now - idleSince) : 0;
    const state = !expected ? 'waiting' : !visible ? 'hidden'
      : visibleIdleMs >= staleAfterMs ? 'stalled' : submittedSinceReset ? 'current' : 'starting';
    return { state, visibleIdleMs: Math.round(visibleIdleMs),
      staleAfterMs, submittedFrames,
      lastSubmitted: lastSubmitted ? { ...lastSubmitted } : null };
  }
  function diagnostics(now) {
    const live = liveness(now);
    const sorted = [...intervals].sort((a, b) => a - b);
    const percentile = fraction => sorted.length ? +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))].toFixed(1) : null;
    return { ...live,
      frameMs: { p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), max: percentile(1), samples: sorted.length },
      sourceTransitions: sourceTransitions.map(entry => ({ ...entry })),
      sourceTransitionProof: 'browser-acceptance-and-renderer-return-only-NOT-native-video' };
  }
  return { expectFrame, received, submitted, setVisible, reset, liveness, diagnostics };
}
