# Pass538 — earned wide-portrait physical pair reveal (2026-11-20 UTC)

**Status: source candidate, NOT a rendered pass or Nintendo win.** PR #53 stays draft and open. Production base SHA `e816368bbbc27309e25b850d1436b9c0c9d83f65` was checked as current PR HEAD before editing. No merge/deploy/force push.

## Exact source-grounded criticism / biggest visible gap

Pass537's original WebGL run [#44769013186](https://github.com/my-edutu/Ai_games/actions/runs/44769013186) succeeded on `e816368bbbc27309e25b850d1436b9c0c9d83f65`; the untouched [original artifact](https://github.com/my-edutu/Ai_games/actions/runs/44769013186/artifacts/14647221181) ZIP digest is `650067a6281afc34697c22ee9e903e57edb26e9ddf0b37454fb1ca87795a0d02`. Independently checked **42/42 PNG versus JSON imageSha256 sidecars**, plus all **three** actual before/mid/after gate PNG hashes on 2026-11-20. The 390×844 authentic seed-13 tick-94 image `natural-guardian-recoil-earned-390.png` SHA-256 is `7cceeeb918f027a85f50b0d42ffa2d2ea7f1f6bdf5e6b71ef6a94e14c1afab58`; 320×740 `natural-guardian-recoil-earned-mobile-320.png` SHA-256 `b79ccbcfa41ee7066d2a1e4a83823407fc5ceea9b93548f34cd6047aa6f2349f`.

**Rejected against the actual [official Captain Toad reference](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/).** Though both full 390px actor envelopes fit ±0.95 NDC, Pip sits left and Thornback's connected facial/recoil performance is lost in side-on masonry, outboard vegetation and shell. The 320px shot reveals substantially more frontal expression. Source-debug occlusion probes report actors technically unobstructed; this is a **composition and silhouette failure**, not permission to erase colliders or call it a win.

## Single independently judgeable production unit

After a real witnessed same-run lantern parry, retain the already verified physical hit camera through phase 0.24; from 0.24–0.68, the **same live Follow camera** eases toward a 15-degree actor-pair angle for 390-class portrait only. This extra reveal happens **after the original filmed-impact continuity blend** so the new stage can actually expose Thornback's face. Preserve existing 320px reveal, actor pose/authority, sealed walls, world materials, privacy, reduced motion, all viewports and strict ±0.95 fitter/44px HUD. No new Three.js resources or camera instance.

**Approval gate:** new exact-HEAD native Playwright WebGL run with unaltered 390/320/844/1280 captures, timestamp + PNG SHA matches, before/after viewer comparison (including real key, gate, guardian, pressure and victory), same six-reset <100 budget, and whole CI. If frontal shot reveals private geometry, clips actors or fails to improve full-frame encounter, reject/iterate; never soften thresholds. Independent fresh-context critic unavailable while workspace tunnel is disconnected; no independent approval claimed.

**Source/test ownership:** `public/ai-maze-escape/guardian-duel-camera.mjs`, `scene.js`, new `tests/phase3/maze-3d-earned-wide-contact-538.test.cjs`. Documented with the production changes in the same commit, no trailing docs-only CI head.
