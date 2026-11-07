# Pass62 — genuine native Follow-camera physical silhouette correction (2026-11-02 UTC)

## Fixed benchmark and honest verdict

**NOT PASSED.** Primary comparator remains actual [Nintendo Captain Toad: Treasure Tracker gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/); Luigi's Mansion 3 and ASTRO BOT are supporting references only. The new live 3D output genuinely corrects a model crop; it still lacks Nintendo's staged action, readable expressive actors, varied authored physical puzzle moments and density of meaningful, visually distinct spaces. Test counts do not establish the visual bar.

## Rejected real output — do not hide a crop by lowering thresholds

Pre-fix exact source `0b681b0c084fb55124f9617c72dad1c491b71030` added strict projected real-mesh-envelope in-frame assertions. [Original native WebGL run 41372537936 FAILED](https://github.com/my-edutu/Ai_games/actions/runs/41372537936); [dated original diagnostic/image artifact 13110340504](https://github.com/my-edutu/Ai_games/actions/runs/41372537936/artifacts/13110340504) exposes genuine **390×844 Follow** screenshot at **2026-11-02T01:28:17.236Z** where **Thornback's rightmost physical silhouette is x=+1.0038925 NDC** (over the +1 viewport edge and the unchanged +.95 in-frame gate). The guardian's projected center alone had passed the older check. The old shot's Pip physical left edge was x=-.7660784, so it was not a missing-character / fake-actor issue. The 3/4 successful browser tests do not excuse the actual failure.

## Source correction and independent image-hash verification

[Actual code commit e0be79c](https://github.com/my-edutu/Ai_games/commit/e0be79c1e830bbd3a51fb987efc014025241e3a2) uses **only genuinely disclosed public Pip and Thornback 3D positions** to center the pair according to unequal *physical* model envelopes, then uses unequal modeled width reserves (Pip 1.10 world units, Thornback 1.80) and .94 NDC clearance in the smooth camera-width calculation. The camera pans/zooms only. It never moves an actor, synthesizes a guardian, probes unseen map cells, alters deterministic simulation, or leaks hidden AI state. Landscape, terminal, absent-guardian, invalid-position and reduced-motion boundaries remain; strict pure regressions added. The precise existing **physical in-frame** browser check was **not weakened or removed**. The HUD remains original full-stage `data-ux-revision=4` with no text dashboards or obscuring footer.

[Exact-code focused visual workflow 41373765475 SUCCESS](https://github.com/my-edutu/Ai_games/actions/runs/41373765475); [original 14-PNG + dated source/image SHA artifact 13110228983](https://github.com/my-edutu/Ai_games/actions/runs/41373765475/artifacts/13110228983). I downloaded and independently recomputed **14/14 PNG SHA-256 hashes** against their exact UTC JSON sidecars (all match), then inspected real native 390 and 320 Follow WebGL images. Unscaled same public seeded **tick 13** (genuine camera toggle, not a synthetic actor) and every screen's real 44×44 presentation controls remain.

| Native actual Follow capture | Full guardian model bounds (NDC) | Full Pip model bounds (NDC) | Real framing |
| --- | --- | --- | --- |
| 390×844, 2026-11-02T01:43:01.144Z, PNG SHA `f5a7a208e681688c32ac4c6502ceaea97d12c90152ce807fe7e32128be2f0dff` | left +.10548, right **+.83552** | left **-.86996**, right -.45077 | 1/1 guardian and Pip full envelopes clear ±.95 |
| 320×740, 2026-11-02T01:43:05.754Z | left +.10548, right **+.83552** | left **-.86996**, right -.45077 | full real models, full screen and 44px actions |
| 844×390 and 1280×900, 2026-11-02 01:43 UTC | both original characters fully in frame | full model | wider authored shots retained |

On a native same-seed/same-mode old→new **390×844 source A/B**, physical guardian right edge improved **1.00389 → .83552**, with Pip retaining physical coverage and margin. Actual rendered RGB difference over 12 across any channel is **55.45% of native 390×844 pixels**, compared to the *failing 0b681b0 source screenshot*. This is a major **camera composition** correction, not a claim of new world-detail richness or Nintendo parity. The 14 original screenshots are source- and date-bound; no CSS mockups, scaled acceptance, or guessed motions. Native 320 hero and Thornback still occupy modest visual area: expressive character acting and bespoke staged terrain interactions remain largest art gaps.

## Verification boundaries and next independent critique

Focused original WebGL browser tests and code source checks passed. The **separate full monorepo CI 41373765388** was still running on the exact art-source commit at this review; do not claim all CI passed. CPU-throttled SwiftShader rendering is evidence of WebGL pixels, **not a hardware GPU throughput or FPS finding**.

I directly inspected the actual full-resolution frames and the fixed Nintendo gameplay reference, but **a separately fresh-context critic, blind A/B and Ultracode were unavailable**: shared workspace tunnel reported `Tunnel-client has not been seen for 300 seconds`. This is **an unblinded lead review**, not an independently certified Gauntlet win. Next split: (1) independent unblind/blind source-match screenshot critic when worker access returns; (2) separately judge physically authored stage action and diverse original visual locations; (3) separately judge Pip/Thornback readability and real reactive animations, including portraits. Never relax privacy/framing/44px/in-frame checks. Preserve open draft PR; **do not merge or deploy**.
