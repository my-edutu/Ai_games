# D04 — Restore authentic browser verification without runner apt DNS (11 November 2026)

**State: isolated, unmerged, not realism-accepted.** This work starts at `a7355c9b5b17ef3646bfd49077bb1bffa8313081`, stays exclusively on `feat/dungeon-d04-combat-feedback-realism-20261108`, and preserves the frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`.

## Dominant verified blocker

[Real-preview job 130572354812, run 43035229445](https://github.com/my-edutu/Ai_games/actions/runs/43035229445) **did not execute the actual Dungeon browser test** after the previous parser fix. Native contracts (78) and production build were green, but `npx playwright install --with-deps chromium` attempted to fetch optional font packages from Ubuntu mirrors and failed because the runner could not resolve `azure.archive.ubuntu.com`. This was a dependency-download outage, **not an observed Dungeon WebGL, combat or sound failure**. There was no new real-game A/V capture in that run.

## Independently reviewable changes

1. Added `tests/foundation/dungeon-d04-host-chrome-ci.test.cjs`: a test-first contract that checks the isolated workflow avoids `--with-deps`, explicitly identifies the Chrome executable, selects the host browser only in D04 CI, keeps the ordinary browser unchanged, and preserves rendering flags and viewport.
2. Registered the contract in `.github/workflows/dungeon-d04-foley-identity.yml`.
3. Added an explicit `D04_BROWSER_CHANNEL=chrome` switch to **only** `tests/browser/dungeon-d04.playwright.config.cjs`; absent/unrecognized values retain the existing Playwright Chromium configuration.
4. Replaced network-dependent Playwright apt installation with a preflight `command -v google-chrome && google-chrome --version` and explicit `D04_BROWSER_CHANNEL: chrome` on the isolated real-preview job. The runner's installed browser must exist or fail clearly; no unproven fallback claims.

Commits: `e2465855`, `4f94cf4a`, `5d542414`, `b7f49553`. The test-only intermediate runs were cancelled automatically by the workflow's existing concurrency rule before red assertions completed. Do **not** claim a verified CI red run from those cancellations.

## Validation and evidence boundaries

At this handoff, [new D04 CI run 43044488142](https://github.com/my-edutu/Ai_games/actions/runs/43044488142) completed native contracts and build successfully; the authentic browser job had not yet reported its final result. Any green or failed browser outcome must be read from that run's job logs/artifacts rather than inferred from this commit. This is an **environmental unblock**, not proof of physically synchronized original sound or moving gameplay A/V. If the hosted Chrome binary or its dependencies are absent, the new preflight will fail explicitly. Host Chrome may not match the prior Playwright-bundled Chromium version: preserve browser version in actual verification logs and judge comparisons on matched render conditions.

An earlier attached real-browser preview screenshot and independently recorded gameplay VP8 show stylized crowded melee presentation; they do not provide sample-aligned impact/contact evidence. Delayed WebGL readback, mute-event diagnosis and same-window recorder remain experimentally unverified for this new head.

## Scope, risk and next realism acceptance

No main/PR #49 changes; no `games/ai-dungeon/src`, rig, camera, lighting or production audio/visual runtime edits. No new sound assets, unlicensed audio, authority mutations, speculative damage or attacker identification. The legacy spectator remains default, D04 remains `?feedback=d04`, and visual/audio pool, mute, accessibility, cleanup and receipt contracts are untouched.

Next: inspect real-preview logs, decoded moving VP8 and original Opus in the **same authenticated window**, then correlate actual HP delta, original sound sample onset and submitted frames. Require 1440×900 and 390×844, three-viewpoint matched moving trials, Warden warning/release/recovery/earned counter, miss/block/dodge/projectile/spell/confirmed injury and 20-minute soak. The largest visual defect after capture is the known wrist-proxy ribbon rather than observed blade-tip contact; do not claim Diablo-IV parity. Roll back the four D04 commits if necessary; no other branch requires recovery.
