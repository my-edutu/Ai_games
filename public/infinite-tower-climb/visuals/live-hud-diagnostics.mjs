// A scene's forensic diagnostics intentionally traverse real world geometry,
// camera witnesses and source event histories. Their cost belongs to an
// explicit evidence probe, NEVER to the ordinary per-frame HUD or poll loop.
// Return the live source/render liveness subset only; preserve the existing
// full window.__TOWER_RENDER_DIAGNOSTICS__ inspection endpoint separately.
export function createTowerLiveHudDiagnostics(view, audio, request, phase) {
  const live = view?.hudDiagnostics?.() ?? { frames: 0, renderer: 'unavailable' };
  return {
    ...live,
    ...(audio?.diagnostics?.() ?? {}),
    requestsInFlight: request ? 1 : 0,
    ...(phase ? { presentedPhase: phase.diagnostics() } : {})
  };
}
