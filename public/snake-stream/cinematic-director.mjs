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
