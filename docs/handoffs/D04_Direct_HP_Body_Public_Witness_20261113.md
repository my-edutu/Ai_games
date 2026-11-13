# D04 — Validate directly drawn HP victim against live public authority (13 November 2026)

**Scope: D04 source-level test-first correction only. NOT real-game audiovisual acceptance.**

- Repository: `my-edutu/Ai_games`; branch `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting head: `673c4fda479a1bd257c0bb4cd619ab9ee8cb1798`.
- Frozen legacy BEFORE stays `281735d0910c6b2443648af976003d50412ee324`.
- Regression commits: [c8d9379](https://github.com/my-edutu/Ai_games/commit/c8d937964048facfbbeab6111a11b9f3db3a255a) then [d370908](https://github.com/my-edutu/Ai_games/commit/d3709087714580c4b957e0cda363a7ab9b91df9b) (fixed the test's exact five-fragment severity expectation).
- Implementation: [161a299](https://github.com/my-edutu/Ai_games/commit/161a2995931c121de734b6a83a814d0178738acd).
- RED verification: [GitHub Actions run 43415225909](https://github.com/my-edutu/Ai_games/actions/runs/43415225909) completed with **275/276** native checks passing. The new test genuinely failed because a visible actor at the correct root still emitted HP fragments from an expired public snapshot tick (expected false, received true). Other native tests passed. An earlier, test-calibration-only workflow was cancelled and is not proof.
- GREEN verification: [GitHub Actions run 43415402823](https://github.com/my-edutu/Ai_games/actions/runs/43415402823) began after the implementation. **Check its completed job results before claiming native, build or genuine-browser success.** The coding tunnel was disconnected, so this write used the authenticated GitHub connector; no local browser claim is made.

## What was wrong

The current D04 renderer already checked the unique current public victim for (a) unloaded models and (b) characters interpolating toward their authoritative cell. But the fastest path, where `sampleActor()` returned an apparently drawable body at the right location, immediately returned that body's anchor **without checking** the current public tick, run/floor, unique victim ID, HP or actor/public data agreement. A reused or stale GLB body could therefore receive visually localized damage chips from another tick even though the renderer's other two anchor paths would refuse. The HP-loss cue itself remained public-authority based, so this is a false *localization*, not evidence of an invented attacker.

In `public/ai-dungeon/physical-feedback-visuals.js`, only that directly sampled hit-body fast path now confirms the current snapshot's exact run/floor/tick, unique public target within 256 units, legal public cell and HP, and matching actor identity, cell, HP, kind and faction. Missing, duplicated, malformed or contradictory evidence fails closed. Static injected stages without the live snapshot getter keep their existing API. The other two HP anchor paths retain their established behavior. Tests also assert rejected cues leave zero hit-pool instances and a valid same-tick injury still emits its original five fragments.

## Safety and budgets

No authorititative gameplay changes, camera, character rigs, animation, global lighting, default spectator route, shader, geometry, pooled resources, timers, audio nodes or soundstage edits. One bounded 256-public-unit witness scan runs **only for an already admitted, directly sampled genuine HP cue**, not per frame. Existing 7 visual pools / 102 instances / maximum 7 D04 draws, 8 foley voices, 32 pending, 32 audio-awaiting-frame, 64 receipts, WebAudio click opt-in and mute persistence, reduced-motion/flash, deduplication, receipt deadlines and 400ms maximum age are unchanged. No new third-party audio or attacker inference.

Rollback, if this rejects legitimate drawn impacts in real game playback: revert only implementation commit `161a2995931c121de734b6a83a814d0178738acd` on this branch after preserving regression evidence. Do not merge into main or Draft PR #49.

## Genuine browser evidence versus native proof

The prior full [Chrome run 43406997287](https://github.com/my-edutu/Ai_games/actions/runs/43406997287) was real DungeonRuntime -> public state -> Three.js WebGL -> opted-in original soundstage, **not a standalone procedural audio audition**. It passed its pre-change native contracts/build but **failed** strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` with real seeded tick 3 -> 4, checksum `92c5595b`, and a verified HP decrease for `enemy-1-0`. Its source/receipt timeline reports:

- Original damage observation 7,116ms; frame submission 8,816ms: **1,700ms** (400ms limit).
- Measured 386ms between observation and D04 visual pass, ~0ms in that pass, and 1,314ms between visual pass and WebGL receipt; render submission itself reported 1,267ms. These are single-trace phases, not an optimization benchmark.
- D04 initially admitted a visual, but correctly withheld impact audio as `stale-frame`. Strict test did not count it as timely visible impact. A later genuine tick-7 fatal injury recorded a scheduled sound at the controller; it does **not** certify decoded audible PCM/video sync.
- Prior continuous desktop and mobile Chrome captures are unaligned, with large frame gaps. Matched three moving directions, clean 390px sustained hits, full Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/impact comparison, original decoded A/V synchronization, and 20-minute cleanup soak are **not verified**.

**Next dominant blocker:** actual active-combat WebGL frame delivery stalls, apparently downstream of D04's tiny per-frame visual pass in this trace, but also seen in legacy mode. Do not extend the 400ms sound gate or claim the new direct-anchor safety rule fixes submission latency. Acquire paired browser render-phase telemetry and synchronized evidence before any readiness upgrade. Legacy spectator remains default; `?feedback=d04` remains opt-in.

## Corrected test-first verification (same isolated branch)

- **RED confirmed:** [43415225909](https://github.com/my-edutu/Ai_games/actions/runs/43415225909) = 275/276, failure specifically `a once-witnessed injury cannot be painted on a later drawable body`, expected `false` versus actual `true`.
- **Implementation and test calibration:** [161a299](https://github.com/my-edutu/Ai_games/commit/161a2995931c121de734b6a83a814d0178738acd) correctly rejected that stale tick and the remaining invalid identity/HP cases. The immediate [43415402823](https://github.com/my-edutu/Ai_games/actions/runs/43415402823) remained red, **not** because of source behavior: the regression's final positive case accidentally reused the preceding deliberately malformed `NaN`-HP snapshot. Do not label this as a successful green run.
- **Test fixture corrected:** [d56f9e3](https://github.com/my-edutu/Ai_games/commit/d56f9e32cb006bacd0e60ac341fdf72e6bc29fd4) restores a legitimate same-tick snapshot before its final positive assertion; it never weakens any invalid-case rejection.
- **GREEN confirmed:** [43415761597](https://github.com/my-edutu/Ai_games/actions/runs/43415761597), `contracts` job completed with **276/276** native checks passing, **0 failures**, and `npm run build` passed.
- The real Chrome `real-preview` job in that same run was **queued** at this evidence checkpoint. No new-head moving-viewpoint, encoded video, audible PCM synchronization or strict visual acceptance is claimed here. Its result must be separately inspected.

No protected or other-session files were changed. This correction is a source-level safety gate, not a performance victory.
