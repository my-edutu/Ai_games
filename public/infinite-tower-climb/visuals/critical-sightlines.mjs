// Current-camera decorative visibility is a view of authoritative source facts.
// This contract only chooses WHICH true targets need sightline protection.
// It never invents hazards, predicts landings or alters combat/physics state.
export function sourceCriticalSightlinePriorities({
  live = false, observedLanding = false, observedHazard = false,
  earnedGateway = false, airborneGateway = false,
} = {}) {
  const running = live === true;
  const arrival = running && observedLanding === true;
  const hazard = running && observedHazard === true;
  // An imminent source-observed trap retains priority over a cleared gate.
  // Crucially, a visible genuine landing and a real trap can BOTH be kept in
  // sight. Earlier code discarded one simply because it reused one vector.
  const gate = running && earnedGateway === true && !hazard &&
    (!arrival || airborneGateway === true);
  return { arrival, hazard, gate };
}
