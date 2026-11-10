# Infinite Tower Climb PR68 — P0 real duel lens and authentic source footage (2026-11-10)

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH OPEN. **Leading independent assessor: NOT EVALUATED.** Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged. PR68 remains draft and based on PR58; never merge, deploy or force-push.

## Verified original gameplay defect

Retrieved complete original compressed WebMs from [10-job capture 42802266846](https://github.com/my-edutu/Ai_games/actions/runs/42802266846): [candidate guardian](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13755854596), [baseline guardian](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13756513832). Confirmed both original portrait 390×844 (candidate 73.08 seconds; baseline 71.32 seconds) and desktop 960×600 (candidate 72.60 seconds; baseline 71.48 seconds). Compared genuine native frames at 12,14,16,18,20,22,24,26 seconds. The candidate portrait and desktop guardian fight around 12–24s separates an often miniature hero and boss behind visually dominant bronze rails, cyan vertical lock conductors and protruding clockwork. The frozen baseline gives a relatively clearer actor size/combat relationship. By 26s candidate shows floor nine.

The [pair manifest](https://github.com/my-edutu/Ai_games/actions/runs/42802266846/artifacts/13756739756) explicitly says 16 original recordings, 8/8 calibrated native timebases, zero provenance or source-story defects, but `fullMotionPaired=false`. We inspected authentic sampled frames; we **did not** certify uninterrupted causal pixels or complete motion quality.

## Cohesive production-path change

At [`97eb67e8`](https://github.com/my-edutu/Ai_games/commit/97eb67e9283e6f4bfb7b4decaef8a04f58bc0119), actual `public/infinite-tower-climb/visuals/scene.mjs`:
- added a lens-quality contract for **both real projected NDC body heights**, favoring the *smaller* combatant instead of only the hero or colorful gate;
- rejects tightly framed shots if real projected hero or guardian full-body bounds are unsafe, and preserves physical tower core and any already-visible committed airborne landing;
- tests additional bounded exterior shoulder orbits and a restrained 0.91× portrait lens only when live two-body scale is insufficient; keeps hysteresis so minor score differences cannot cause repeated orbit whips;
- changes no combat HP, guardian AI, crushers, route, collision, grounded gate, floor-nine authority, fixed-step time, assets, HUD, extra GPU passes, or manual controls.

The new real-snapshot regression and synthetic body-shape tests are in `tests/phase3/tower-guardian-contact-framing.test.cjs`. Source/test syntax parsing passed before push, but no local working Node22+Three runtime was available. [First exact-code quality 42818007909](https://github.com/my-edutu/Ai_games/actions/runs/42818007909) failed 1/1315: invalid guardian NDC input still earned a small hero-only score (4.32), exposing a genuine contract weakness. Fix [`0d1759fa`](https://github.com/my-edutu/Ai_games/commit/0d1759fafed4fb28820109fa17b0b946f9cbe61c) returns zero when either body is absent/invalid. **The corrected full CI is not yet claimed passing.**

## Separate specification / quality review

Specification: accepted as an ungraded P0 implementation attempt: source-only snapshots, no predicted impact or false unlock, fully constrained and safely reversible. **Acceptance not passed:** real moving 390×844 footage must show readable hero/guardian/telegraph/crusher and a physically clear earned crossing all at matched source events.

Quality risks: lens scoring adds several CPU candidate projections only during a live guardian; current supported-device p50/p95/p99 memory is unmeasured. Additional tight shots may still face cyan passage, crowd the 390px mobile view or lose physical landing visibility. Existing guarded crop/core checks reduce but do not eliminate those visual risks. Observe actual camera stability and video, do not accept test count as a quality preference.

**Evidence plan:** new request commit triggers immutable-source candidate vs unchanged baseline, low graphics tier, seed `tower-transformation-capture-v1`, normal-speed ≥60s ascent/moving/guardian/outcome desktop and portrait. Inspect full-motion source-event-neighbor frames, especially ticks for HP zero, crusher pressure, grounded floor8→9, terminal/restart. Require hardware and real randomized fresh-context independent LOOKS/FEELS/PLAYS (0/5 each) before any passing verdict. No technical build or self-assessment can replace these gates.

**Next primary action:** inspect and correct any remaining major physically authored guardian arena obstruction or two-combatant shot instability. Do not move to P1 without an authenticated and visually legible P0 cycle.
