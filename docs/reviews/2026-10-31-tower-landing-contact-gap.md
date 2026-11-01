# Infinite Tower Climb — Gauntlet 30: grounded landing recovery after slow rendering

**Scope:** existing draft PR #58, exact parent `08f4c0e67c3ecf980c6415ba3b542a24804c8aa1`. **Status: SELF-REVIEW only.** The independent critic/Ultracode shared-workspace tunnel was unavailable (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`), so no independent review is invented.

## Actual pre-edit evidence inspected

The source-pinned Tower Landing Evidence workflow [41220733713](https://github.com/my-edutu/Ai_games/actions/runs/41220733713) completed SUCCESS. Its downloaded original artifact `13049861959` includes real Three/WebGL screenshots in 960×600 desktop and 390×844 portrait. The climber and route are visible, but these are held images, not sustained motion.

The source-pinned Tower Continuous Motion workflow [41220733758](https://github.com/my-edutu/Ai_games/actions/runs/41220733758) completed SUCCESS. Downloaded artifact `13050046516` (guardian) and `13050285604` (climb), inspecting real GPU canvas PNGs, browser WebM and machine-readable motion JSON. Every capture states parent `08f4c0e`, with 13 sampled states and five distinct captured canvas hashes per viewport, no reported GL/context failures. Last-reported software-renderer submitted-frame interval p95: guardian desktop 1352ms and portrait 684.3ms; climb desktop 2460.6ms and portrait 1271.3ms. **These are not hardware FPS or compositor-presented-frame rates.** Broad [Autonomous Games CI 41220737974](https://github.com/my-edutu/Ai_games/actions/runs/41220737974) was **CANCELLED**, not successful.

## One independently testable visual-contact failure

The model animation wrapper clamps the per-callback dt to 100ms, which is appropriate for gait stability. But landed compression lasts only 200ms and currently increments `landingAge` with that same capped dt. When an authoritative `airborne`→`standing` edge is followed by a second 500ms scene-rendering gap, the next image still retains an old bent-knee landing squat despite the genuine contact having ended. This is particularly consequential when actual captured submissions are hundreds or thousands of milliseconds apart.

**Implementation:** retain the full compression for the *first* observed genuine standing sample. For a subsequent still-standing sample after a presentation-clock gap greater than 200ms, catch up the landing-recovery age by that real observed gap. Normal 60Hz timing, skinned-rig geometry and transforms, death/hurt/attack logic, collision-owned root, physics, simulation, AI, RNG and replay stay unchanged.

## TDD and local verification

- **RED before implementation:** a new test against the real articulated/skinned climber failed as expected because the old landing squat remained after a second half-second interval (1 failure / 2 new tests).
- **GREEN after implementation:** both new tests **2/2 PASS**, including both reduced-motion variants for long gaps and unchanged 60Hz contact timing.
- Full character-rig test file **16/16 PASS**; complete Tower Phase 3 **113/113 PASS**; `npm run build` **PASS**; `node scripts/serve-tower-stream.cjs --self-test` **ok:true**, including authority/replay/privacy/recovery/restart.
- The new tests assert a changed knee pose and **actual skinned-leg vertices**, not just an internal age counter. Root ownership stays with the host.
- The local host served `/tower` with HTTP 200; local Chromium `page.goto` failed with `ERR_BLOCKED_BY_ADMINISTRATOR`. **No new-commit GPU capture or visual-quality PASS** is claimed from this run.

## Independent gates and rollback

**Self-review, specification:** only authoritative contact and real elapsed presentation time affect the visual pose; the original first-frame contact is not skipped. No new contact events, gameplay rewards or positions are fabricated.

**Self-review, quality:** the fix prevents a stale bent-knee pose under slow frames but does not make frames smooth, introduce hand-to-ledge IK, solve missing sampled actions or close the commercial quality gap. On severely stalled devices the recovery can still appear sudden; a new-source full-speed video must be inspected.

**Rollback:** revert the single conditional `contactDelta` block, tests and ledger entry. **Next:** download and inspect source-matched new-head Tower Landing/Continuous Motion screenshots and WebM, specifically an authentic landing edge and delayed recovery; then verify real-device performance, accessible UI, complete-action footage and independent Jusant/ASTRO BOT comparison.

**Overall GAUNTLET 90: NOT ACHIEVED.** Draft PR retained; no merge, force-push or deployment.
