# Master Frontend & Game Experience Review Standard

Use this review for every player-facing or stream-facing game surface in the catalogue before declaring a frontend phase complete.

## Objective

Make the game immediately understandable, visually distinctive, accessible, responsive, performant, and entertaining without allowing presentation to obscure or mutate authoritative gameplay.

## Review loop

1. Identify the fantasy, protagonist, primary objective, progress unit, immediate danger, next milestone, audience opportunity, and emotional rhythm.
2. Test the first 3, 5, and 10 seconds: a new viewer should understand what the game is, what is trying to happen, current progress, current danger, and why the next moment matters.
3. Classify every persistent visual element as primary gameplay, secondary gameplay, contextual, audience, accessibility, decorative, or operator-only. Remove or demote anything that competes with gameplay.
4. Build a semantic color system with explicit roles for background, surface, text, muted text, progress/success, warning, danger, audience influence, focus, and system/recovery states. Never rely on color alone for critical meaning.
5. Establish a typography hierarchy for primary progress, danger, milestone, AI intent, secondary metrics, captions, and controls. Verify compressed mobile viewing.
6. Maximize the gameplay viewport. Prefer contextual cards and progressive disclosure over permanent dashboards.
7. Review world readability: protagonist, allies, enemies, hazards, resources, objectives, routes, territories, interactables, and decisive environmental change must remain distinguishable through shape, spacing, scale, motion, outline, and value.
8. Review character/entity quality for silhouette, personality, role, expression, state, and environmental integration. Replace placeholder-feeling presentation when it can be improved within performance budgets.
9. Review anticipation, impact, recovery, transitions, camera behavior, particles, celebration, failure, and milestone feedback. Spectacle must never hide gameplay truth.
10. Review audio semantics: calm, progress, anticipation, danger, crisis, recovery, success, failure, and audience acknowledgement. Critical meaning must remain available when muted.
11. Present AI intent only through bounded public summaries: goal, current action, obstacle, risk, confidence, and plan-change reason. Never expose chain-of-thought or private debugging.
12. Keep audience interactions subordinate to gameplay, show their bounded consequence clearly, and prevent acknowledgement storms from overwhelming danger/result information.
13. Explicitly design loading, countdown, normal play, quiet progress, danger, crisis, milestone, audience choice, recovery, result, record, replay, intermission, reconnect, provider degradation, quarantine, and maintenance states.
14. Verify at 1920×1080, 1366×768, narrow landscape, and phone-sized viewing. Check overflow, clipping, card collision, captions, safe zones, and world visibility.
15. Verify contrast, focus visibility, semantic controls, reduced motion, reduced flash, caption/visual equivalents, color-independent meaning, and accessible status messaging.
16. Audit DOM/canvas/SVG complexity, animations, listeners, timers, particle count, expensive filters, layout thrashing, and memory lifecycle. Cosmetic degradation happens before critical gameplay cues.
17. Classify findings as P0–P3. P0/P1 findings must be fixed before the frontend phase passes.
18. Re-run frontend and gameplay regression checks, then perform a second critique pass.

## Semantic color contract

Each surface defines at least these roles in its own visual identity:

- `--color-bg`
- `--color-surface`
- `--color-text`
- `--color-muted`
- `--color-progress`
- `--color-warning`
- `--color-danger`
- `--color-focus`

The exact colors differ by game. Shared quality does not mean shared skin.

## Completion gate

A game passes when the fantasy is recognizable immediately; objective, progress, and danger are legible within ten seconds; gameplay dominates the frame; semantic color and typography are coherent; phone-sized viewing remains understandable; entities are distinguishable; important actions have readable audiovisual feedback; quiet and intense moments have contrast; audience UI is meaningful but subordinate; accessibility preserves critical meaning; performance remains bounded; presentation does not alter authoritative state; relevant frontend tests pass; and no P0/P1 frontend finding remains.
