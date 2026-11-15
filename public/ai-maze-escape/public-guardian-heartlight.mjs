// Original public-encounter render weighting only, never AI/danger authority.
// The caller must supply a CURRENT reciprocal open-lane sighting and an
// existing, actually visible connected Thornback signal-heart mesh.
// Missing or non-finite evidence emits absolutely no theatrical light.
const clamp = n => Math.max(0, Math.min(1, n));
export function publicGuardianHeartLightCue(strength, beat, reducedMotion = false) {
  if (!Number.isFinite(strength) || strength <= .35 || !Number.isFinite(beat)) return 0;
  const visible = clamp((strength - .35) / .35);
  if (reducedMotion) return visible * .57; // steady, truthful visible warning
  const witnessed = clamp(beat);
  const planted = clamp((witnessed - .17) / .36);
  const released = clamp((witnessed - .70) / .25);
  return visible * (.22 + .78 * planted * (1 - .8 * released));
}
