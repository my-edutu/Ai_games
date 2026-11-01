# Infinite Tower Climb — Gauntlet 37: genuine ledge-contact evidence

**Parent:** 6e35f25f93b74d80fd25a01285e350efceb6c148. **Review:** SELF-REVIEW ONLY; coding-worker tunnel returned NOT_FOUND.

## One selected failure

Inspected actual G36 source-bound GPU Landing artifact **13061644329**, workflow **41253015116**: stone-ready desktop/portrait pictures and no render errors, but neither includes the authentic near-ledge pose. G36 dedicated Landing, Combat **41253015364**, Guardian **41253015121**, Realism **41253015183**, Motion **41253015260** completed SUCCESS. Broad catalogue CI **41253018919** FAILED three unrelated Tiny Kingdom assertions (two outdated shader version checks and one duplicate-tint count); Tower browser cases passed. This failure is not hidden.

Production scene now reports actual post-IK animated fingertip/world target/error, or explicit absence. New tests require seeded authentic ascent (maximum 2500 simulation ticks), decoded stone and source-bound real screenshots at desktop and portrait, with hard geometry assertion and persistent evidence even when assertion fails. A held still does not establish normal-speed animation or FPS. No gameplay, AI, physics, deterministic random stream, network snapshot, renderer draw call, character art or lighting changed. Existing landing screenshots do not establish successful ledge contact.

**Static RED:** original G36 source lacks measured fingertip diagnostics. **GREEN and GPU:** full new-source CI and actual new PNG inspection pending at implementation commit. Node/Three actual-rig fixture and new Playwright scenario authored, not falsely reported as executed. Independent visual review, complete motion, accessible UI, intended-device sustained FPS and stability remain OPEN. Gauntlet 90 NOT ACHIEVED.

**Next:** inspect new exact-commit real-ascent images and JSON; if missing/penetrating, correct actual reach geometry and transition before extra art. Preserve official Jusant and ASTRO BOT bars. PR #58 stays draft, no merge, force-push or deploy.

## Exact-head CI failure and same-iteration repair

[New G37 run 41258001432](https://github.com/my-edutu/Ai_games/actions/runs/41258001432) **FAILED** before Playwright because a prior static integration regex expected the formerly inline `ledgeTarget: ledgeContact ? pointFor(...)`; the new source hoists that unmodified real-platform point into a variable shared by pose and diagnostic. **6/7** focused tests passed, including the actual rig test; the one structural assertion failed. The same-iteration repair changes `tower-ledge-geometry-contact.test.cjs` to explicitly verify both `const ledgeTarget = ledgeContact ? pointFor(...)` and `ledgeTarget,` in the production pose, preserving stronger source-truth and not weakening geometry limits. New CI GPU evidence is still PENDING until exact commit verification; do not claim a pass yet.

**CI trigger coverage repair:** include `tests/phase3/tower-ledge-geometry-contact.test.cjs` in the dedicated workflow's `push.paths`; changes to that key regression now rerun the full real-skeleton/Playwright evidence workflow on the repaired head.

## Actual corrected-head GPU result — scoped PASS, visual FAIL

The first workflow [41258001432](https://github.com/my-edutu/Ai_games/actions/runs/41258001432) **failed 6/7** a brittle prior inline matcher, and the corrected regression plus trigger change were committed, not hidden. On exact repaired head **6f254cde11256230146dfcda415c3bfb48fce2ad**, [Tower Ledge Contact Evidence CI 41258255654](https://github.com/my-edutu/Ai_games/actions/runs/41258255654) **SUCCEEDED**: TypeScript build, **7/7** Node/Three/geometry tests, **2/2** real desktop/portrait Playwright screenshots. Downloaded the real ZIP artifact **13064146030**, source-sha.txt matches repaired head; inspected `artifacts/tower-ledge-contact/desktop.png`, `portrait.png`, and both JSON diagnostics.

The genuine seeded authority encounter is **tick 298, public checksum `13941b9e`, deck `f1:p1`**, public platform point (124350, 420000). Both captured viewports report `target=[-12.639681641483733,6,21.569386824894654]`, actual post-pose skeleton `fingertip` equals that point, `errorWorld=0`, `renderErrors=0`, `errors=[]`. Stone readiness and browser screenshot assertions passed. **This proves only actual posed bone targeting and capture integrity on a held authentic frame.**

**Mandatory negative real-pixel review:** in the inspected desktop image the climber's head/body is partially inside the upper stone landing deck and the contact hand is obscured; in portrait the helmet visibly protrudes above the slab while the torso and legs are underneath. The skeleton can reach the mathematical platform top while *the remainder of the body intersects visible masonry*, which fails the core Jusant-inspired convincing handhold/approach quality gate. **Physical contact appearance: FAIL (self-reviewed).** There is no independent critic connected; no independent visual verdict is claimed. This view is not a full-motion capture and is not GPU hardware FPS. The submitted new-source motion/realism workflows and broad CI had not completed at this evidence entry.

**Next Gauntlet priority:** independently address that precise one-way platform 3D crossing silhouette and hand/helmet occlusion at tick 298, while preserving authentic climbing intent and 2D authoritative collision. Compare source-bound screenshots and actual continuous ascent without claiming held stills prove animation; keep performance/accessibility/soak and commercial bar OPEN.
