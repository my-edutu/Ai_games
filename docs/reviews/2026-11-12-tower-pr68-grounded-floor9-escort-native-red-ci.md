# PR68 P0 — Grounded Floor9 visual escort and original native-film CI recovery (2026-11-12)

## Scope, source and prohibitions
- Branch: `feat/tower-transformation-gauntlet-20261101`; based on open draft PR58 branch, not merged; latest reviewed code `685b779ca7b7a5405065bdec676bb9bceb10c7fe`.
- Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged). PR68 stays draft. No deploy, force push, PR58 rewrite or other game edits.
- Applicable authorities: AGENTS.md, `games/infinite-tower-climb/GAUNTLET.md`, transformation design dated 2026-11-01; platformer-experience-review, game-feel-vfx and simulation-qa.
- Active gate: **P0 OPEN / NOT EVALUATED**. Engineering CI is veto, never a visual score.

## Actual prior evidence and largest systematic defect
- Exact original 10-job [capture 43129188636](https://github.com/my-edutu/Ai_games/actions/runs/43129188636) at candidate `400522603b3812d50f47fd25d1a7a92de4df7ddb`: authentic ledge plus **all 8 original 70–73s WebMs succeeded**, but calibrated A/B event-pair job failed with **0/2 guardian event-to-native-raster**. The baseline source did not witness candidate's real guardian defeat/physical passage, so those beats are not comparable and cannot be fabricated.
- Reviewed original native candidate/baseline desktop/portrait danger footage at normal timestamps 8, 12, 16, 20, 23–27, 30, 36, 45 and 65 seconds (sampling is diagnostic, **not** complete unbroken-motion acceptance). Browser source tick451 completed Floor9, but drawn HUD/scene registered about **+1.796s desktop / +1.955s portrait** after candidate calibrated source clock. A source event is not a painted video pixel.
- Main visual flaw: after an actual guardian/cap crossing, the handoff camera had been added, but **the gated gateway visual rescue was impossible on Floor9** because its only enable signals were old-floor source walk progress / old airborne approach; these become zero or null on handoff. The engine could therefore abandon the same grounded doorway despite carrying the original arch.

## Changes implemented at `685b779ca7b7a5405065bdec676bb9bceb10c7fe`
1. `scene.mjs`: connect only source-tick-matched, actually grounded Floor9 `observedGroundedHandoffShot` to the *existing* torso/door/core-safe visual escort, plus a bounded continuous camera response. No synthetic movement, teleport, second camera, source animation clock or extra draw objects.
2. `guardian-gateway-framing.mjs`: refuse unsupported/stated-airborne successor bodies and more than **4.5m** difference between feet and grounded inner arch (previous loose 8m threshold admitted a 9.5m fabricated elevation in regression).
3. Correct preexisting stale test assumptions and a VM fixture missing the new source variable. Specific falsification remains: unsupported deck, wrong floor/run/tick, distant arch, lifted body, stale source, dead character, reduced motion and invalid projection must never earn this camera.

## Test-first and quality truth
- Existing [exact-source quality 43129026580](https://github.com/my-edutu/Ai_games/actions/runs/43129026580) genuinely failed **3** tests: `tower-causal-playthrough` stale gate source regexp; `tower-source-grounded-handoff-shot` 9.5m floating body incorrectly admitted; `tower-gateway-walk-lens` new source variable missing in VM fixture. **These were verified red before the code change.**
- [After-code quality 43136163583](https://github.com/my-edutu/Ai_games/actions/runs/43136163583) was queued at authoring. No green or frame time asserted before a completed job.
- New capture is triggered through the existing original fixed-seed, fixed-tier, frozen-baseline workflow by this exact source-pinned capture-request change. No native footage of the change or actual hardware performance was available at this commit.

## Two independent review passes
**Specification:** No mutation of fixed-step simulation, collider, AI, guardian victory or floor outcome; passive state-camera bridge only on true source tick + real supported successor. Frozen baseline intact.

**Experience/quality:** The current candidate remains visually crowded by bronze machinery and still has **0/2 strict native source-event alignment**. This repair may improve the same-door continuity; that remains a hypothesis pending actual 1x desktop and portrait film. The 4.5m guard is a safety change, not an interaction upgrade. Validate full body, doorway, warning, next landing, flicker and actual physical passage before retaining; roll back this new scoped camera branch non-force if new footage worsens crop/route. No independent reviewer votes or supported-device frame-time p50/p95/p99/memory.

## Next highest-impact step
Inspect completed exact-source CI and 9-job original capture, review the entire 1x ascent, moving-deck, guardian/crusher and outcome/restart sequence in both sizes. Align actual source tick, browser received, Three submitted, and decoded painted native frame. If two-view source/native mismatch or continuous gateway visibility fails, remain P0 and fix largest measured visual/timing cause, not test count or cosmetic style. Only after genuine acceptance attempt P1.
