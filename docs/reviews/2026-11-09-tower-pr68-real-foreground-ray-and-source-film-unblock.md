# Infinite Tower Climb PR68 — P0 foreground ray failure and original capture regression recovery
Date: 2026-11-09
Branch: `feat/tower-transformation-gauntlet-20261101` (OPEN DRAFT PR #68)
Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged)
Actual renderer correction: `f3427a2dc257697d57f27ad391e6589442fbf8bd`
Source-bound test recovery: `cee5361e1303d4bc5d92d5df44affc2ee0518c0f`
Stage: P0 EVIDENCE + GAME-LOOP TRUTH — OPEN
Transformation assessor: **NOT EVALUATED**. Zero independent looks/feels/plays reviews; no supported-device measurements.

## First-pass specification and experience audit

The prior original Node/Three.js quality workflow [42595128133](https://github.com/my-edutu/Ai_games/actions/runs/42595128133) completed with **1,237 passed and 36 failed among 1,273 assertions**, a **technical failure, not a quality rating**. It revealed an actual production-path renderer exception in `public/infinite-tower-climb/visuals/world.mjs`: first-pass local `rayBoundsRejects` and `rayNarrowphaseChecks` were referenced by the *second* stacked-clockwork compositing pass without being carried in the retained per-assembly decision. A real camera with clockwork visibility enabled could encounter `ReferenceError` before material opacity/depth was applied. This directly blocks reliable playable WebGL footage; render recovery attempts cannot make the source logic correct.

Commit `f3427a2d` carries both first-pass counters into each of the four existing pending decorative decisions and destructures them in the second pass. The ray tests and bounded geometry/depth policy remain intact; authoritative player, moving decks, guardian, hazard, seal collision, source-driven gateway and fixed-step run are untouched. A real-world Three.js test now checks four source-tick records and `raySamples = rayBoundsRejects + rayNarrowphaseChecks`. **This is a meaningful runtime correctness repair, NOT evidence of higher FPS or prettier gameplay.**

The same original logs showed duplicated fixture setup failures: copied `scene-hierarchy.mjs` was linked to its real `guardian-shot-stage.mjs` but not its newly imported real `guardian-passage.mjs`. Five source-backed Three.js suites could not even load. Those ESM test fixtures now resolve both real unchanged production modules rather than stubbing scenery. Additional tests were updated to honor the actual source-authored `guardianExitX`, genuine locked-versus-defeated cap distinction, and existing original `live.webm` file variable.

Exact-source follow-up [42602161907](https://github.com/my-edutu/Ai_games/actions/runs/42602161907) at `f3427a2d` finished **1,267 passed, six failed** (out of 1,273). This narrows but does not clear CI. The six revealed tests asserting retired camera source text or historical physical gate placement; one post-machining aperture no longer intersects a test ray, and two evidence contracts are stricter than old expectations. Commit `cee5361e` repairs those *tests only*, preserving the source constraint that no current guardian defeat means no open gate and that a split/retrograde source episode is rejected rather than passed. The current source-sha quality run for `cee5361e` must be judged on its actual completed result, not assumed green.

## Evidence and remaining omissions

- Frozen source baseline remains exactly `1731b380851162741761c5569e2bc152a0869ca9`; PR58/main remain untouched.
- Earlier nine-job capture [42593395530](https://github.com/my-edutu/Ai_games/actions/runs/42593395530), on old `9ececaa1`, had a **successful original same-run guardian/crusher→restart and moving-platform source precheck**, but its 3D geometry preflight failed and eight baseline/candidate recording jobs failed before Chromium. No new native WebM was produced.
- Previous authentic older portrait [42426089449, artifact 13594459833](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833) shows huge foreground clockwork blocking climber and guardian around native 16.5–18 seconds. Its renderer SHA `e0fe7729` predates the above fixes; it cannot certify today's visibility or camera.
- The code-level counter fix is confirmed by committed GitHub readback, not by original local Node/browser execution: the approved development tunnel returned `Tunnel-client has not been seen for 300 seconds`. GitHub Actions is the executable testing environment.
- No new exact-current-source 60+ second matched 960×600/390×844 baseline/candidate normal-speed films; no native WebM PTS-to-authoritative source-tick visual audit; no 3,200-tick end-to-end run confirmed on the current SHA. No hardware frame-time p50/p95/p99, peak memory or accessibility device result. LOOKS 0/5, FEELS 0/5, PLAYS 0/5. **NOT EVALUATED**.

## Second-pass engineering review

Determinism and save/replay: all modified shipping code is presentational ray accounting; no simulation timing, movement, collisions, AI, source event order, persistence or replay schema modified.

Performance and memory: the existing four bounded assembly decisions, broadphase, per-frame retained buffers and draw budgets remain. Two numeric fields per decision are retained; actual renderer performance, memory and device FPS are *not measured*. Technical CI remains a veto, never a quality score.

UX and audiovisual: an actual camera visibility exception may freeze a guardian or traversal scene; fixing it restores the intended existing protection pathway rather than claiming accepted sightlines or better sound. Prior portrait occlusion still needs a new genuine full-motion review. No HUD/audio changes.

Accessibility, security, privacy and reliability: changed test contracts preserve reduced-motion source-based fade (do not invent opacity when actual hollow geometry is clear), reject absent/live guardian unlocks and retrograde source episodes, and bind original video to unchanged source/byte provenance. No personal information or external dependencies added; no privacy regression asserted without testing. On persistent rendering exception the existing bounded recovery and honest failure state still apply.

Rollout and rollback: draft-only non-force GitHub commits; no deployment or PR merge. A reviewer can revert the isolated `f3427a2d` + `cee5361e` changes on this branch after preserving later concurrent work, but must not rewrite the frozen PR58 base or force-update history.

## Highest-impact next action

1. Finish exact `cee5361e` original Node/Three.js CI. Resolve any genuine remaining blockers without weakening render/collision/source-truth contracts.
2. Trigger the established **eight** matched baseline/candidate films plus one actual guardian-source ledge job from a capture-request change. The capture workflow pins its **own trigger commit SHA**; do not substitute the implementation commit in film provenance.
3. Independently inspect normal-speed original WebM for ascent, moving deck, guardian/crusher victory, real *grounded* cap/gateway crossing, floor-nine onward, outcome/restart in both viewports, then calibrate native WebM times against original 20Hz source events. Keep P0 open if any link is missing.
4. From those clips choose the single largest remaining *actual experience* defect (historic foreground wheel is not proof it persists). Return to gameplay/camera/world work rather than polishing tests. Require 5 truly independent randomized full-motion critics for each LOOKS, FEELS and PLAYS and measured real-device guardrails before ever marking verified.

**Boundary:** only Infinite Tower Climb and PR68. No other games edited, no original baseline rewrite, no PR58 changes, no merge, no deploy, no force-push, no draft conversion.
