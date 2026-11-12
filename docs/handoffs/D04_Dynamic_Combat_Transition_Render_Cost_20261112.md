# D04 — Dynamic real-Dungeon combat-transition renderer cost (12 November 2026)

**IN PROGRESS / EVIDENCE DIAGNOSTIC ONLY / NO PRODUCTION TRANSFORMATION.**

## Branch and scope

- Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`; development started at `73a7094a41dd09daef68a298e0a9ea0f3e960a18`.
- Frozen historical BEFORE: `281735d0910c6b2443648af976003d50412ee324`. The new control is **current** legacy `/dungeon`, not this frozen historical build.
- Normal spectator route unchanged. D04 stays strictly behind `?feedback=d04`. Do not merge main or Draft PR #49.
- The experiment owns **only** `tests/browser/dungeon-d04-{dynamic-render-pair,real-dynamic-render-pair.spec}.cjs`, its foundation contract, the D04-only Playwright configuration and workflow, and this handoff. No edits to `games/ai-dungeon/src`, rigs, cameras, global renderer, lighting, original foley or feedback runtime.

## Dominant problem from authentic prior evidence

[Previous actual Chrome run 43166571891](https://github.com/my-edutu/Ai_games/actions/runs/43166571891) revealed 29 expired out of 36 queued cues, zero original combat-audio admissions, and an actual tick-6 HP loss waiting 2,657ms for presentation, including 2,585ms in the renderer call. The six-frame **fixed** post-HP snapshot cost comparison did not reproduce a consistent D04-specific tail. We need moving, **same-authority-state** transitions before attributing the stalls to retained D04 GPU work. No stale-sound deadline extensions or invented hit effects are permissible.

## Added executable evidence

1. `tests/foundation/dungeon-d04-dynamic-render-pair.test.cjs` declares nine test-first contracts: genuine matched transitions with real HP-loss manifest, missing/stale/mismatched state, duplicate-stage exclusion, non-monotonic frame identities, camera/viewport/source mismatch, missing HP evidence, independent effect budget violations, retained 2-second outliers, and invalid clocks. First RED [Actions 43176090982](https://github.com/my-edutu/Ai_games/actions/runs/43176090982) failed on absent comparator module; it is **not** an in-game regression.
2. `tests/browser/dungeon-d04-dynamic-render-pair.cjs` is a read-only strict classifier. It requires sequential public-state checksums, preserved scene/view/viewport/seed, monotonic real renderer frame IDs, a matched actual HP-loss stage, and at least four matched transitions before producing render distributions. It **never** chooses one of two readings for a duplicate stage or pairs an unrelated tick. It exposes 7-draw-call and 104-instance budget breaches instead of silently removing those frames. Classification is `MATCHED_DYNAMIC_RENDER_DIAGNOSTIC_ONLY`, `INSUFFICIENT_MATCHED_DYNAMIC_FRAMES`, `INSUFFICIENT_DYNAMIC_AUTHORITY` or `D04_VISUAL_BUDGET_VIOLATION`. Never an accepted A/V or causation result.
3. `tests/browser/dungeon-d04-real-dynamic-render-pair.spec.cjs` supplies successive, **actual** `DungeonRuntime.step()` public snapshots from seeded combat to the untouched spectator's `/dungeon/state` endpoint. Its witness includes only confirmed consecutive HP decreases, not inferred victims or attacker names. It observes actual post-WebGL diagnostic frames and draw calls across sequential transitions on **1440×900** and **390×844**, on separate serial legacy/D04 pages. It captures real static supporting images and a bounded raw JSON trail, including missing-stage reasons.
4. `tests/browser/dungeon-d04.playwright.config.cjs` opts the new spec into the isolated real-browser Chrome job. `.github/workflows/dungeon-d04-foley-identity.yml` opts the new node contracts and files into the isolated branch workflow.

The comparison samples **read-only app** `directRenderMs`, not GPU-fence time. A separate per-state route-poll observation interval includes scheduling and network overhead. Neither is an absolute contact/audible sample clock. Sequential pages create possible software-WebGL warmup, thermal and camera-settling bias. No two browsers, extra rendering passes, fabricated playback, synthetic 2D frames, or encoder load are injected into the timing trial.

## Reproduction, acceptance and evidence distinction

```sh
npm ci
node --test tests/foundation/dungeon-d04-dynamic-render-pair.test.cjs
node --test tests/foundation/dungeon-d04-render-cost-pair.test.cjs
npm run build
npm run dungeon:assets:strict
D04_BROWSER_CHANNEL=chrome npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Saved when actual Chrome completes: `artifacts/dungeon-d04-dynamic-render-pair-evidence.json` and four supporting real-game stills. A passing Playwright test proves that actual software-WebGL observation ran; only the machine-readable verdict establishes whether sufficient **matched** dynamic evidence exists. A passing foundation contract alone does not establish a moving-video or audio result.

**Verified in this increment:** the test-first missing-implementation RED job above; native contracts of the corrected candidate passed in [Actions 43176435574](https://github.com/my-edutu/Ai_games/actions/runs/43176435574) at initial inspection. The Chrome job was queued at that inspection; **do not label this candidate's authentic browser evidence verified until the job and artifact are inspected**.

## Independent reviews

**Specification:** no authoritative gameplay, camera/rig/lighting, app production, sound consent, mute, 400ms deadline, effect scheduling, or pool changes. Default spectator remains the legacy route; no new media/audio source or licensing obligation.

**Quality/performance:** the diagnostic adds only CI test code, and therefore no runtime drawing, audio voice, retained GPU resource or scene listener. It can increase isolated CI time and may yield `INSUFFICIENT` on slow runners. Outliers and missing frames are retained, not trimmed. The test must not be used to assert faster D04 or audiovisual contact synchronization.

## Rollback and next dominant defect

Revert only the new D04 dynamic comparator, foundation suite, browser spec, isolated CI/config entries and this handoff on the D04 branch; no production runtime rollback is needed.

If actual dynamic transitions consistently implicate D04 effect density, profile the existing seven D04-owned GPU pools and reject needless transparency/overdraw without suppressing truthful Warden hazards. If both legacy and D04 stall, hand the **measured** renderer problem to the separate owner; do not rewrite shared renderer policy from this branch.

Still unaccepted: three-viewpoint moving A/V footage at desktop and 390px; Warden warning/release/recovery/counter/defeat; miss/block/dodge/projectile/spell comparisons; measured true blade-tip contact; decoded original PCM sample alignment; low-end/reduced-motion/flash recovery; and the 20-minute effect/resource soak. No Diablo-IV parity claim.
