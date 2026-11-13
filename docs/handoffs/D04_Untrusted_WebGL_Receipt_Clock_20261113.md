# D04 — Do not authorize original foley from an untrusted WebGL receipt clock

**13 November 2026 — isolated D04 safety increment; not audiovisual realism acceptance.**

- Repo/branch: `my-edutu/Ai_games` / `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting inspected head: `3a3a9ee23e957e4c15d033c1f375db8d2030747e`.
- Frozen BEFORE comparison remains `281735d0910c6b2443648af976003d50412ee324`.
- Scope: `public/ai-dungeon/physical-combat-feedback.js` and two D04-only native contract files, plus this note. No authoritative `games/ai-dungeon/src`, main, PR #49, character, animation, camera, global lighting or other-session edits.

## Defect and causal boundary

The actual opt-in D04 spectator supplies a monotonic clock. `acknowledgePresentedFrame()` samples it only AFTER a genuine WebGL submission. If that configured clock suddenly becomes invalid, throws or regresses at receipt time, `observedWallClock()` returns `null`. Previously, `acknowledgePresentedFrame()` silently fell back to `observedSeconds-item.at`, the older rAF interval. A 16ms interval could have been recorded **before** expensive scene/render submission; it says nothing about an unmeasured 700ms stall before acknowledgement. Thus a verified HP injury could incorrectly schedule original impact sound after an unverified, potentially stale physical contact. This is a **source-level failure mode**; existing authentic browser recordings do not prove the clock actually regressed.

The fix requires a valid observation-to-submission wall-clock age whenever an explicit clock function was supplied. A failed receipt is classified `unverified-frame`, denied original sound, recorded as a truthful receipt with no submitted timestamp, and its retained effect is retired through the established cleanup mechanism. There is no fake attribution or extension to the original 400ms deadline. Injected adapters that **never supplied a clock** retain the existing raw-frame gate; the normal legacy non-submission mode remains unchanged. The actual browser remains `?feedback=d04` opt-in.

## Test-first proof and proportional checks

1. [RED test-only commit `202060d`](https://github.com/my-edutu/Ai_games/commit/202060dcb8a71be40f1ca73b34bad144ac3b46bc): [Actions 43422769171](https://github.com/my-edutu/Ai_games/actions/runs/43422769171) completed **275/277** native, two expected failures (actual 1 vs expected 0) for backwards receipt clock and lost post-visual receipt clock.
2. [Fix `46eeee4`](https://github.com/my-edutu/Ai_games/commit/46eeee465339e2dbbcff65ac0d9e528f680e0514): added the receipt-age proof gate in the D04 controller. [Actions 43422898075](https://github.com/my-edutu/Ai_games/actions/runs/43422898075) reached **276/277**: both new regressions now pass, but one earlier test asserted the obsolete classification `stale-frame` for a configured `NaN` clock. Its rejected/no-sound behavior did not change.
3. [Contract clarification `25ee727`](https://github.com/my-edutu/Ai_games/commit/25ee727e09d5c1d0987823b375160c114acb7b82): distinguishes an **explicitly configured but untrusted clock** (`unverified-frame`) from a **clockless injected adapter** (`stale-frame` after a true long raw interval, `delivered` when truly timely). Includes no-sound, retired-slot, truthful-timestamp and replay non-delivery assertions. [Actions 43423038243](https://github.com/my-edutu/Ai_games/actions/runs/43423038243) passed **278/278 native tests, 0 failures, and production build** (contracts job).
4. That same run's genuine Chrome `real-preview` job was **still in progress** at the checkpoint for this note. Do not describe it as passing or as real-game audiovisual synchronization. Real source `source.start` / WebGL receipt telemetry are not audible PCM onset or encoded contact PTS.

## Independent real-game observations (pre-change only)

Previous genuine [Chrome run 43415761597](https://github.com/my-edutu/Ai_games/actions/runs/43415761597) passed five browser diagnostics but **failed** strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Earlier real WebMs decode as 11 desktop VP8 frames (maximum 3.063s gap) and 10 mobile VP8 frames (3.375s gap), with Opus audio. These are authentic yet sparse, unaligned recordings, **not** post-change demonstration, three-viewpoint quality evidence or sample-synchronized sound. Multi-second WebGL stalls were observed also in legacy; there is no proof this D04 gate caused or fixed them.

## Safety, budgets, and review gate

Seven retained D04 visual pools / 102 instances / max seven new draw calls; eight live foley voices; 32 pending, 32 awaiting receipt and 64 receipt limits; the 400ms deadline; click-only WebAudio activation and persisted mute; reduced-motion/reduced-flash variants; unique HP victim evidence, no inferred attacker, dedupe, floor/run cancellation and scene cleanup all remain unchanged. The change adds no geometry, audio assets, audio nodes, or unbounded state. Source-level correctness does not establish browser-level physical realism.

**Next dominant weakness:** acquire/diagnose real active-combat WebGL frame-delivery stalls with paired per-phase legacy/D04 measurements, then complete matched moving clips from three viewpoints at 1440x900 and 390x844, Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/actual impact, original decoded PCM/video onset, and 20-minute cleanup soak. No parity with high-end ARPGs or integration acceptance is claimed.

**Rollback:** revert controller fix `46eeee4` on this isolated branch only after retaining the two red/green contract records. Do not merge to main or Draft PR #49 without the dedicated review.
