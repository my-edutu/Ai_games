/**
 * Cinematic-first broadcast, without sacrificing the faithful full-board
 * spectator view or accessibility. An ordinary, unconfigured livestream
 * should actually introduce the living hero rather than continuously show
 * the most distant engineering overview. No stored preference, inferred AI
 * intent, scene mutation or extra renderer pass. Query overrides retain the
 * true wide overview for recording, audit, players and automation evidence.
 * Reduced motion must start in a stable wide view even with a cinematic URL.
 */
export function selectInitialSpectatorCamera(query = '', reducedMotion = false) {
  const params = query instanceof URLSearchParams
    ? query : new URLSearchParams(typeof query === 'string' ? query.replace(/^\?/, '') : '');
  const requested = params.get('camera');
  // Reduced motion disables *automatic cinematic editing*, not an explicitly
  // requested stable follow/detail shot. The actual renderer cuts directly to
  // that real public camera pose without interpolating or moving authority.
  // Preserve the stable full-board opening unless the spectator opted in.
  if (requested === null || requested === 'cinematic') return reducedMotion ? 'overview' : 'cinematic';
  return ['overview', 'follow', 'detail'].includes(requested) ? requested : 'overview';
}

/**
 * The viewer's camera button is an explicit manual takeover, even when
 * cinematic direction was chosen automatically. Preserve the established
 * accessible follow -> detail -> overview cycle; never consume the first
 * click merely to exit director mode. Unknown modes fail to wide overview.
 * This does not alter the pure autonomous shot selection or game authority.
 */
export function nextManualSpectatorCamera(currentMode) {
  if (currentMode === 'cinematic' || currentMode === 'overview') return 'follow';
  if (currentMode === 'follow') return 'detail';
  return 'overview';
}

/** Resolve the *same* true camera shot for the renderer and responsive overview. */
export function resolveSpectatorShot(cameraMode, snapshot, reducedMotion = false) {
  if (cameraMode === 'cinematic') return selectCinematicShot(snapshot, { reducedMotion });
  return ['overview', 'follow', 'detail'].includes(cameraMode) ? cameraMode : 'overview';
}

/**
 * T1/T3 full-experience camera director. This is a PURE, optional spectator
 * composition of the already-public authoritative snake. It cannot make a
 * gameplay decision, anticipate a private AI path, synthesize an eat/danger
 * event or teleport a visual segment between unconnected portal exits.
 *
 * One continuous 160-movement-step sequence (~20 seconds at 8 steps/s):
 *    intimate real head → wide garden reveal → travelling hero →
 *    attentive real head → wide garden reveal.
 * The actual host simulation, captions, minimap and audio stay authoritative.
 * No new canvas, texture, GPU pass, shader or clock-driven mock gameplay.
 */
export function selectCinematicShot(snapshot, { reducedMotion = false } = {}) {
  if (!snapshot || reducedMotion || snapshot.lifecycle !== 'running'
      || !Number.isInteger(snapshot.movementStep) || snapshot.movementStep < 0
      || !Number.isInteger(snapshot.width) || snapshot.width < 2
      || !Array.isArray(snapshot.snake) || snapshot.snake.length < 2
      || snapshot.dangerLevel >= 2
      || (Number.isFinite(snapshot.goal) && snapshot.goal > 0
        && Number.isFinite(snapshot.length) && snapshot.length >= snapshot.goal)) {
    return 'overview';
  }
  // The real head and neck must be contiguous. A head emerging from a portal
  // has no invented interpolation or misleading hero sweep across the board.
  const head = snapshot.snake[0]?.cell;
  const neck = snapshot.snake[1]?.cell;
  if (!Number.isInteger(head) || !Number.isInteger(neck)
      || head < 0 || neck < 0 || head === neck
      || Math.abs(head % snapshot.width - neck % snapshot.width)
       + Math.abs(Math.floor(head / snapshot.width) - Math.floor(neck / snapshot.width)) !== 1) {
    return 'overview';
  }
  const phase = snapshot.movementStep % 160;
  if (phase < 24 || phase >= 104 && phase < 128) return 'detail';
  if (phase < 56 || phase >= 128) return 'overview';
  // The real public fruit is a legitimate cinematic focal cue only when the
  // snake is already in a hero-follow interval AND visibly travelling toward
  // that current fruit. Never infer a hidden AI route or manufacture an eat.
  // Keeping the two whole-board editorial intervals prevents a flood of
  // close-camera edits on a GPU that is already starved by view changes.
  const fruit = snapshot.food?.cell;
  if (Number.isInteger(fruit) && fruit >= 0 && fruit < snapshot.width * snapshot.height) {
    const hx = head % snapshot.width, hz = Math.floor(head / snapshot.width);
    const nx = neck % snapshot.width, nz = Math.floor(neck / snapshot.width);
    const fx = fruit % snapshot.width - hx, fz = Math.floor(fruit / snapshot.width) - hz;
    const forward = fx * (hx - nx) + fz * (hz - nz);
    const distance = Math.abs(fx) + Math.abs(fz);
    if (distance >= 1 && distance <= 2 && forward > 0) return 'detail';
  }
  return 'follow';
}


/**
 * GPU-completed-shot cinematic pacing. The public game, HUD, snake movement,
 * water and danger cues continue normally; only *automatic* editorial camera
 * cuts are delayed when real completed WebGL fences show severe starvation.
 * Hold a truthful existing pose long enough for the complete landscape to
 * settle and its bounded HDR/depth cache to become reusable. A maximum dwell
 * prevents a frozen cinematic storyboard if the GPU never completes another
 * full scene. Explicit camera controls and safety transitions always win.
 *
 * This is NOT an FPS test, physical display-present certificate, or render
 * submission counter. No fake gameplay, future AI state, wall-clock simulation
 * or hidden data enters the camera choice.
 */
export function createGpuEvidencedCinematicDirector({ minimumDwellMs = 8000,
  maximumDwellMs = 16000, requiredCompletedViews = 2 } = {}) {
  if (!Number.isFinite(minimumDwellMs) || minimumDwellMs < 0 ||
      !Number.isFinite(maximumDwellMs) || maximumDwellMs <= minimumDwellMs ||
      !Number.isInteger(requiredCompletedViews) || requiredCompletedViews < 1)
    throw new RangeError('Cinematic dwell requires bounded, ordered positive thresholds');
  let held = null, runToken = null, started = 0, completedAtEdit = 0;
  function reset() { held = null; runToken = null; started = 0; completedAtEdit = 0; }
  function resolve({ mode, snapshot, reducedMotion = false, nowMs, queue } = {}) {
    const desired = resolveSpectatorShot(mode, snapshot, reducedMotion);
    const head = snapshot?.snake?.[0]?.cell, neck = snapshot?.snake?.[1]?.cell;
    const width = snapshot?.width;
    const portalBreak = Number.isInteger(head) && Number.isInteger(neck) &&
      Number.isInteger(width) && width > 1 &&
      (Math.abs(head % width - neck % width) +
       Math.abs(Math.floor(head / width) - Math.floor(neck / width)) !== 1);
    // Never hold an old angle through a real event, discontinuous portal,
    // restart, reduced motion or explicit manual full-board request.
    if (mode !== 'cinematic' || reducedMotion || !snapshot ||
        snapshot.lifecycle !== 'running' || snapshot.dangerLevel >= 2 ||
        portalBreak || (Number.isFinite(snapshot.goal) && snapshot.goal > 0 &&
          Number.isFinite(snapshot.length) && snapshot.length >= snapshot.goal)) {
      reset(); return desired;
    }
    const pressure = queue?.supported === true && queue.failed === false &&
      // A stale historic GPU fence may stay slow after all work has drained.
      // Never treat that old latency as evidence of *current* queue pressure.
      Number.isInteger(queue.pending) && queue.pending > 0 &&
      Number.isInteger(queue.completed) && queue.completed >= 0 &&
      Number.isInteger(queue.skipped) && queue.skipped >= 16 &&
      Number.isFinite(queue.lastObservedLatencyMs) && queue.lastObservedLatencyMs >= 120;
    if (!pressure || !Number.isFinite(nowMs)) {
      reset(); return desired; // normal/unsupported GPUs retain original edits
    }
    if (held === null || runToken !== snapshot.runToken || nowMs < started) {
      held = desired; runToken = snapshot.runToken; started = nowMs;
      completedAtEdit = queue.completed; return held;
    }
    if (desired === held) return held;
    const elapsed = nowMs - started;
    if (elapsed < minimumDwellMs ||
        (elapsed < maximumDwellMs && queue.completed - completedAtEdit < requiredCompletedViews))
      return held;
    held = desired; started = nowMs; completedAtEdit = queue.completed;
    return held;
  }
  return { resolve, reset };
}
