# Phase 03 — Character, Outfits and Animation

## Status

`IN PROGRESS — TDD RED corpus authored before production implementation`

## Purpose

Give Tayo a professional, original and respectful presentation identity without allowing character art, garment geometry or animation to alter Phase 2 gameplay truth.

## Scope

Phase 3 owns:

- presentation-domain Tayo character contract;
- four equal-collision outfit families;
- semantic animation-state resolver;
- deterministic tick-derived pose phase;
- critical landmark/silhouette rules;
- reduced-motion semantic parity;
- deterministic vector preview/model evidence;
- outfit/animation authority-isolation regressions.

## Required outfit families

- Yoruba-inspired agbada + fila;
- Igbo-inspired isi agu + red-cap styling;
- Hausa-inspired baban-riga/kaftan + embroidered-cap styling;
- contemporary Lagos streetwear.

All are original stylized designs. They do not encode ethnic behaviour, statistics, difficulty, reward multipliers, collision changes or audience entitlement advantages.

## Acceptance criteria

- Exactly four launch outfit families have stable IDs, distinct respectful silhouette/style notes and bounded decorative extents.
- Every outfit uses the same authoritative collision profile and has zero mechanical modifiers.
- Head, hands, hips/body direction and both feet remain presentation-readable in critical poses.
- Animation state covers idle/locomotion/takeoff/air/landing/slide/vault/hit/recovery/failure/celebration and has explicit precedence.
- Animation/pose phase derives from authoritative tick/public snapshot, not render frame delta, wall clock or ambient randomness.
- Same authoritative tick produces the same semantic frame under 30/60/120 presentation sampling.
- Reduced-motion preserves critical posture/state meaning while reducing cycling/amplitude.
- Presentation output is reconstructible after renderer restart and isolated from mutable authority.
- Phase 2 and Phase 1 deterministic regressions remain green.
- Three 22-skill review/improvement passes have no unresolved stop-ship, P1 or P2 finding in Phase 3 scope.

## Explicit non-goals

Final Three.js meshes/materials, runtime cloth physics, final camera, Mainland Morning world, Lagos traffic/hazards, final audio/VFX/HUD/mobile UI, AI/autoplay, viewer interaction and production readiness remain later-phase work.

## Gate

No aggregate visual score can override a costume/animation silhouette or authority-isolation stop-ship.
