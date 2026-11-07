// A camera-fit window only around the real source-observed airborne
// landing lane. No collision, AI choice, gameplay state, geometry or timer
// is ever changed here. The full deck remains in the physical 3D world.
export function observedLandingShotSpan(snapshot, deck, landingX) {
  const player = snapshot?.player, intent = snapshot?.intent;
  const mode = typeof intent?.mode === 'string'
    ? intent.mode.replace(/^oracle-/, '') : '';
  const declared = (mode === 'air-control' && [
    'Steering for a clear landing lane',
    'Boosting toward a distant safe landing',
    'Using earned air recovery to reach observed landing',
  ].includes(intent?.summary)) ||
    (mode === 'settling-landing' &&
      intent?.summary === 'Braking into a clear landing lane');
  if (snapshot?.stale || snapshot?.lifecycle !== 'running' ||
      player?.state !== 'airborne' || !(player?.health > 0) ||
      intent?.targetPlatformId !== deck?.id || !declared ||
      ![landingX, deck?.x, deck?.width, player?.halfWidth]
        .every(Number.isFinite) || deck.width <= 0 || player.halfWidth <= 0 ||
      !Number.isSafeInteger(snapshot.tick) ||
      deck.width < Math.max(140000, player.halfWidth * 10) ||
      landingX < deck.x || landingX > deck.x + deck.width) return null;
  // Retain a substantial, physically present landing/braking region, rather
  // than framing the entire remotely visible 280k-wide cap as a hard bound.
  // The caller has already chosen landingX via observedSourceLandingX.
  const margin = Math.min(deck.width * .33,
    Math.max(player.halfWidth * 2.6, Math.min(46000, deck.width * .18)));
  const left = Math.max(deck.x, landingX - margin);
  const right = Math.min(deck.x + deck.width, landingX + margin);
  if (!(right - left >= player.halfWidth * 2)) return null;
  return { left, right, x: landingX, sourceTick: snapshot.tick };
}
