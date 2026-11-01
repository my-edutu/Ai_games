# Infinite Tower Climb — Gauntlet 44: world-anchored boot stance

Date: 2026-11-01. Scope: PR #58, branch `codex/infinite-tower-climb-3d-gauntlet`.
Parent exact head: `4a27b3c6453068a70be18e187bdb7288a439f984`; actual GPU before source: `f741b8547b02560af998c4bdd2e9af158144d2bc`.

## Selected one failure, evidence before editing

Read AGENTS.md, game GAUNTLET.md, current progress and PR review thread; inspected the actual downloaded 32 desktop/portrait GPU PNGs from [Tower Ledge run 41277710614](https://github.com/my-edutu/Ai_games/actions/runs/41277710614), artifact `13071663489`, source marker `f741b85`, especially authentic grip/release/crossing ticks 298–303 and real landing 318. The climber remains unconvincingly weighted while passing the top slab. Inspection of the *shipped* animation then found a narrower reproducible failure: both ordinary airborne gait and the cosmetic upper-deck push-off choose the forward boot using `reachSide`, a value that changes with **camera azimuth**, not actual facing. The same physics snapshot could visibly switch which leg drives the vault merely because the camera moves from front to rear. The view-dependent arm still supports silhouette readability; feet cannot use that rule.

The last broad [Autonomous Games CI 41277714596](https://github.com/my-edutu/Ai_games/actions/runs/41277714596) ended **cancelled**; even though numerous job steps succeeded, no full-suite PASS is claimed.

## Exact implementation and TDD

Changed only `public/infinite-tower-climb/visuals/characters.mjs` and the actual skinned-rig regression in `tests/phase3/tower-ledge-geometry-contact.test.cjs`: use stable authoritative `facing` (or velocity fallback) for the physical front/back boot during ordinary ascent **and** the ledge push-off; retain camera-aware reaching hands and the exact source-driven fingertip solver. No movement path, stage geometry, AI, collision, replay state, run token, RNG, graphics resource or additional draw is changed. View/quality changes cannot reverse the boot stance.

**RED**, on extracted exact preceding source: `node --test tests/phase3/tower-ledge-geometry-contact.test.cjs` → 12/13 PASS, 1/13 FAIL on camera-flipped real `-1-hip` with facing -1 and no mantle. **GREEN**, after the production correction: same focused suite 13/13 PASS (both facing signs, both camera angles and three independently checked ascent/mantle poses). `npm run build` PASS; five affected suites 35/35 PASS; `node scripts/serve-tower-stream.cjs --self-test` PASS with `authorityStable/browserAssets/boundedSource/snapshotPrivacySafe/recoveryVerified/restartObserved=true`, final tick 600, checksum `7725eefc`. Local tests use the actual extracted pinned source and locked `node_modules` from Realism artifact `13071049663`; the parent changes since the source marker were **documentation only** (compare `f741b85..4a27b3c`).

## Separate self-review (not independent)

Specification: **PASS for world-stable lower-limb pose**, as the new test compares skinned hip/knee/ankle quaternions across opposing camera azimuths at identical immutable snapshots. Quality: **PENDING actual new-source GPU comparison**; the old sequence is evidence of the gap, not proof of this edit's rendered effect. This small stabilization cannot by itself establish authentic weight-bearing foot contact, convincing full-body mantle, continuous normal-speed polish or a Jusant/ASTRO BOT win. Independent critic and Ultracode were not available in this execution; this is explicitly SELF-REVIEW only.

No merge, deployment or force push. After source-bound Ledge CI completes, download the actual new screenshot artifact and compare equal-tick images from both viewports; do not treat stills as sustained hardware FPS. Next independently judgeable priority: a truly deck-relative physical boot/weight transfer across ticks 299–301 without fabricating authoritative landing, then complete-motion, blind reference, accessibility, device FPS and soak verification. Overall GAUNTLET gate: **FAIL / OPEN**.
