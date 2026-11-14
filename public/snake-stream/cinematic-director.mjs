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
  return 'follow';
}
