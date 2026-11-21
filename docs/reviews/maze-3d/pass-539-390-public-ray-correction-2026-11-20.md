# Pass539 — correct a real 390px Thornback occlusion regression (2026-11-20 UTC)

**Status: production correction candidate, NOT a verified new visual win.** Existing PR #53 remains open/draft. Do not merge, deploy or force-push.

## Exact source and independently inspected original image

Pass538 HEAD `26afae8af148b39dd8109a771dd917683d9f5976`, [native source-bound WebGL #44778892807](https://github.com/my-edutu/Ai_games/actions/runs/44778892807), **FAILED** the unchanged strict natural-autonomous-counter test. The public screen ray to **Thornback boots at 390×844** returned `inconclusive=true`; the test at `tests/browser/maze-review.spec.cjs:2359` correctly rejected it, without adjusting any NDC/ray tolerance. Eight other native review tests and the actual six-run-reset geometry test passed; this does not mean the visual suite passed.

The [original 87-file ZIP artifact](https://github.com/my-edutu/Ai_games/actions/runs/44778892807/artifacts/14652800265) SHA-256 is `95b04b7d520ea2a89d33151c7ae7d08cfdaec530a77c0b93f14260799369418e`. **40/40 written original PNG-to-JSON SHA-256 pairs matched**. The exact 390×844 earned image exists (SHA-256 `a3b9f545cadf79a58dcf3ebb82088684cf35f747e8b7fdd42df9339852f8034d`) but its sidecar was not written after the strict assertion failed. It cannot be described as a successful screenshot gate.

Direct full-frame critique: even though Pip and Thornback remain in-frame, public rooted vegetation/stone visually dominates the withdrawing six-leg body, hiding its pose and weakening the earned lantern counter. The attempted near-frontal camera swing from Pass538 worsened the public ray; source alignment numbers were NOT proof of a playable view. The fixed official Nintendo *Captain Toad* visual bar remains unmet.

## Smallest useful correction

Keep the previously **strict-ray-verified Pass537** publicly earned portrait contact/recoil lens, but cap the additional Pass538 camera orbit in actual 390px production to **6 degrees**. The helper retains deterministic geometry and stronger independent source tests; no actor, collision, AI, hidden route, reveal, UI, model scale or resource budget changes. No renderer allocations, synthetic encounter or screenshot crop.

The existing `tests/browser/maze-review.spec.cjs` original 6 physical body-anchor source rays, real WebGL full-frame screenshot, source provenance, 320/390/full-size ±0.95 NDC checks and six-run <100 geometry budget remain unchanged. New Pass539 source regression tests check the bounded *actual call* and refuse invalid turns, while preserving all Pass538 tests. If this angle still fails any ray, reject and iterate rather than changing thresholds.

**Next exact-HEAD gate:** re-run native Playwright WebGL including genuine seed-13 tick93→94 parry, original full images/sidecars for 320, 390, 844, 1280, pressure/key/gate/victory and six-run geometry; check whole-repo status; compare to official reference. Independent worker/Ultracode access is blocked by disconnected coding-workspace tunnel, so no fresh-context critic endorsement is claimed.
