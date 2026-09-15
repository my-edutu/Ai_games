# Phase 03 — Character, Outfits and Animation

## Status

`VERIFIED — deterministic presentation-domain character/outfit/animation scope`

## Purpose

Give Tayo a professional, original and respectful presentation identity without allowing character art, garment geometry or animation to alter Phase 2 gameplay truth.

## Scope completed

- presentation-domain Tayo character contract;
- four equal-collision outfit families;
- semantic animation-state resolver with explicit precedence;
- deterministic tick-derived pose phase;
- critical landmark/silhouette rules;
- reduced-motion semantic parity;
- deterministic vector preview/model evidence;
- renderer-restart reconstruction;
- outfit/animation authority-isolation regressions.

## Outfit families

- Yoruba-inspired agbada + fila;
- Igbo-inspired isi agu + red-cap styling;
- Hausa-inspired baban-riga/kaftan + embroidered-cap styling;
- contemporary Lagos streetwear.

All are original stylized designs. They encode no ethnic behaviour, statistics, difficulty, reward multiplier, collision change or audience entitlement advantage.

## Acceptance criteria

- [x] Exactly four launch outfit families have stable IDs, distinct respectful silhouette/style notes and bounded decorative extents.
- [x] Every outfit uses the same authoritative collision profile and has zero mechanical modifiers.
- [x] Head, hands, hips/body direction and both feet remain presentation-readable in critical poses.
- [x] Animation state covers idle/locomotion/takeoff/air/landing/slide/vault/hit/recovery/failure/celebration with explicit precedence.
- [x] Animation/pose phase derives from authoritative tick/public snapshot, not render frame delta, wall clock or ambient randomness.
- [x] Same authoritative tick produces the same semantic frame under 30/60/120 presentation sampling.
- [x] Reduced motion preserves critical posture/state meaning while reducing cyclic amplitude.
- [x] Presentation output is reconstructible after renderer restart and isolated from mutable authority.
- [x] Invalid renderer-facing direction fails closed rather than inventing state.
- [x] Phase 2 and Phase 1 deterministic regressions remain green.
- [x] Three 22-skill review/improvement passes have no unresolved stop-ship, P1 or P2 finding in Phase 3 scope.

## Verification record

Candidate `3fc5de87942b0b045065af86132d613fae44fecc` passed dedicated workflow run `34946027452` and full catalogue run `34946027458`.

Dedicated evidence:

- Phase 3 tests: 21/21 PASS;
- Phase 2 regressions: 28/28 PASS;
- Phase 1 regressions: 20/20 PASS;
- authority checksum unchanged: `99551477dc3d2389`;
- 30/60/120 cadence parity: PASS;
- JSON renderer-restart reconstruction: PASS;
- 48 deterministic previews;
- p99 presentation generation: `0.012885 ms`;
- worst presentation generation: `0.422446 ms`;
- artifact `10387805177`, digest `sha256:a02b5dd5f355ca2060c382fef908ad837d9b590aed1daa5e394872c620b6f9bf`.

See `evidence/eko-run/phase3/` for results, the 22-skill experience review and all three review passes.

## Explicit non-goals

Final Three.js meshes/materials, runtime cloth physics, final camera, Mainland Morning world, Lagos traffic/hazards, final audio/VFX/HUD/mobile UI, AI/autoplay, viewer interaction and production readiness remain later-phase work.

## Gate decision

**PASS — Phase 3 character/outfit/animation presentation contract.** Later phases must revalidate silhouette and outfit readability against actual scenery, lighting, traffic, crowds, rain and performance tiers.