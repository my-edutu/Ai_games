# Infinite Tower Climb — Gauntlet 37: genuine ledge-contact evidence

**Parent:** 6e35f25f93b74d80fd25a01285e350efceb6c148. **Review:** SELF-REVIEW ONLY; coding-worker tunnel returned NOT_FOUND.

## One selected failure

Inspected actual G36 source-bound GPU Landing artifact **13061644329**, workflow **41253015116**: stone-ready desktop/portrait pictures and no render errors, but neither includes the authentic near-ledge pose. G36 dedicated Landing, Combat **41253015364**, Guardian **41253015121**, Realism **41253015183**, Motion **41253015260** completed SUCCESS. Broad catalogue CI **41253018919** FAILED three unrelated Tiny Kingdom assertions (two outdated shader version checks and one duplicate-tint count); Tower browser cases passed. This failure is not hidden.

Production scene now reports actual post-IK animated fingertip/world target/error, or explicit absence. New tests require seeded authentic ascent (maximum 2500 simulation ticks), decoded stone and source-bound real screenshots at desktop and portrait, with hard geometry assertion and persistent evidence even when assertion fails. A held still does not establish normal-speed animation or FPS. No gameplay, AI, physics, deterministic random stream, network snapshot, renderer draw call, character art or lighting changed. Existing landing screenshots do not establish successful ledge contact.

**Static RED:** original G36 source lacks measured fingertip diagnostics. **GREEN and GPU:** full new-source CI and actual new PNG inspection pending at implementation commit. Node/Three actual-rig fixture and new Playwright scenario authored, not falsely reported as executed. Independent visual review, complete motion, accessible UI, intended-device sustained FPS and stability remain OPEN. Gauntlet 90 NOT ACHIEVED.

**Next:** inspect new exact-commit real-ascent images and JSON; if missing/penetrating, correct actual reach geometry and transition before extra art. Preserve official Jusant and ASTRO BOT bars. PR #58 stays draft, no merge, force-push or deploy.

## Exact-head CI failure and same-iteration repair

[New G37 run 41258001432](https://github.com/my-edutu/Ai_games/actions/runs/41258001432) **FAILED** before Playwright because a prior static integration regex expected the formerly inline `ledgeTarget: ledgeContact ? pointFor(...)`; the new source hoists that unmodified real-platform point into a variable shared by pose and diagnostic. **6/7** focused tests passed, including the actual rig test; the one structural assertion failed. The same-iteration repair changes `tower-ledge-geometry-contact.test.cjs` to explicitly verify both `const ledgeTarget = ledgeContact ? pointFor(...)` and `ledgeTarget,` in the production pose, preserving stronger source-truth and not weakening geometry limits. New CI GPU evidence is still PENDING until exact commit verification; do not claim a pass yet.
