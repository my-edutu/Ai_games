# Infinite Tower Climb — physical-depth grounding continuation

**Branch:** `feat/tower-transformation-gauntlet-20261101` (draft PR #68)
**Baseline:** `1731b380851162741761c5569e2bc152a0869ca9` — frozen, unchanged.

## Systemic issue addressed

Existing original skinned climbing, camera tracking, authored ledges, guardian encounters, source-bound route intent and touchdown audio provide several cues but no continuous, *under-the-climber* indication of the actual surface depth during long jumps. A broad route marker is a destination, not physical support. This continuation adds a compact, world-occluded footprint to connect ordinary ground movement, observed airborne height and genuinely moving platforms with the existing touchdown halo and opt-in sound. It does not mark an unsafe prediction as a secure landing.

## Real playable change

- Find the **currently observed** deck immediately under the authoritative player feet by finite platform geometry, horizontal overlap and vertical clearance. Never use AI future positions or a previous moving deck's location.
- Place one original, procedural soft physical footprint on the actual 3D deck. Ground contact is firm; the footprint spreads and fades as the *real observed vertical gap* grows. One shared quad, no texture download, independent particles or frame-time randomness. Depth-test against real masonry, keep low tier and reduced-motion compatibility.
- Terminal/dead/stale/no-surface frames have no footprint; new runs clear its identity. Existing fixed-step simulation, replay checksums, health, autonomous route, collision, sound policies and outcome remain unchanged.

## Scope and required acceptance

Source-level contracts cover overlapping support, current moving-deck location, airborne clearance, bogus targets, terminal/restart isolation and material resource ownership. **They are technical guardrails, not an experience score.** No browser, normal-speed matched before/after source video, fresh-context independent blind reviews or real-device frame-time p50/p95/p99 was available in this execution; all experiential gates remain **NOT EVALUATED**. The biggest risk is whether this shadow is visible and helpful rather than cluttered in real desktop/portrait gameplay, alongside the still unresolved original 50ms baseline result frame. Inspect video and remove or redesign if five independent critics find no substantial experience improvement.

Do not shift the frozen baseline, force-push, merge or deploy. Keep the same transformation open.
