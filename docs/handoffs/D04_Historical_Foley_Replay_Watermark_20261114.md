# D04 — Historical original-foley replay beyond bounded cue-ID memory (14 November 2026)

**Status: test-first source correction committed and 322/322 native checks plus production build passed. Genuine Chrome moving-frame/audio acceptance is NOT established.**

## Scope and provenance

- Repository: `my-edutu/Ai_games`. Only writable branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting branch head: `7966020aa7c009fdfda715183e785698efd7044f`. Frozen independent BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
- Test-first RED commit: [d0df236](https://github.com/my-edutu/Ai_games/commit/d0df236da0954a7773af75f8d9096343634b1a39). Source correction: [efc8eb7](https://github.com/my-edutu/Ai_games/commit/efc8eb73eade21f92a34ef91d805bb3c5491d067).
- Only source/test paths changed: `public/ai-dungeon/original-combat-foley.js` and `tests/foundation/dungeon-d04-foley-cue-idempotency.test.cjs`. This file is documentation only. No main, PR #49, authoritative `games/ai-dungeon/src`, rigs, camera, lighting or other session branch edits.
- Audited `AGENTS.md`, D04 real-preview acceptance, audio/VFX/QA/performance skills, pinned pre-281735d Dungeon README/authoritative public-state types, the current original foley and the prior genuine Chrome job. This is not a claim to have run local coding-tunnel gameplay: its tunnel endpoint was disconnected.

## Source-level defect and the exact correction

Before this change, the original sound engine correctly deduplicated accepted event IDs while they were in a 128-entry set. After more than 128 genuine cue IDs, a once-accepted sword swing fell out of that ring. A later replay of its original run/floor/tick/actor ID could emit another whoosh if cooldowns had elapsed, even though no new public action had occurred. Old independently witnessed HP loss could likewise produce another acoustic hit.

The foley source now retains **one scene key and one monotonic highest canonical verified tick**, in addition to the unchanged 128-ID bounded cache. It refuses an old strictly canonical public swing or HP injury witness more than **five authority ticks behind the highest successfully scheduled witness**; this matches the independent D04 planner's existing `PHYSICAL_FEEDBACK_MAX_TICK_GAP=5`. Bounded (up-to-five-tick) out-of-order witnesses remain eligible. It refuses a different scene key until the standard scene reset clears the watermark. No new sound events, external assets, timers, buffers, audio connections, voices or per-sample operations are introduced.

The watermark advances **only after all WebAudio sources have been scheduled successfully**. Allocation, start or device failure never upgrades stale/future events, advances the clock or consumes a new one-shot ID. Explicit mute, reset, floor/run transition and disposal invoke the existing flush and remove the watermark. The change does not determine contact or damage: only the prior immutable authority proof can make whoosh or HP impact; actorId remains null for HP-only injury.

## Evidence

- [RED GitHub Actions run 43559782793](https://github.com/my-edutu/Ai_games/actions/runs/43559782793): native tests actually executed, **320 passed / 2 failed** at two exact new regression assertions. Both old-source failures returned `true` for a cue expected to be rejected (old swing ID replay after cache eviction, and a six-tick-old HP injury). The third injected WebAudio allocation test passed.
- [GREEN GitHub Actions run 43559880751](https://github.com/my-edutu/Ai_games/actions/runs/43559880751): **322 passed / 0 failed**, and `npm run build` succeeded on source commit `efc8eb7`. The separate genuine-browser `real-preview` job was still in progress at this inspection; its final verdict and new media are **unverified** here.
- The previous completed [real Chromium Dungeon job 43555218755](https://github.com/my-edutu/Ai_games/actions/runs/43555218755) passed five browser diagnostics but **failed** strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. On genuine continuous legacy/D04 pairs, its slow-phase diagnostics included 2,334ms desktop and 3,086ms mobile renderer calls; D04 visual advance measured 0ms on those particular worst samples. This is CPU-phase observation, not GPU completion or proof of which subsystem causes the stalls.
- Historical decoded desktop/390px WebM contact sheets show real top-down Dungeon movement but sparse frames; independently synchronized original PCM on real moving contact is **not proven**. Source-level fake WebAudio fixtures cannot prove audible audio, browser-rendered samples or an 8-voice render-quantum peak.

## Safety/resource/rollback review

- Eight registered active foley voices, the existing single 13,440-sample seeded mono buffer, 128 retained cue IDs, 32 start receipts, per-victim/per-swing density limits and short envelopes are unchanged.
- Source changes remain inside D04's explicit `?feedback=d04` experiment; legacy `/dungeon` remains default and the consent/mute path is unchanged.
- The five-tick cutoff is intentionally scoped to **successfully played, strictly canonical swing/HP cues**. It is not a substitute for the controller's authority snapshots, 400ms frame-submission deadline or general Warden-event dedupe, and it is not an audiovisual parity claim.
- Revert only `efc8eb7` on the isolated branch if independent integration reveals an invalidly suppressed public witness. Keep the regression tests for follow-up review.

## Next dominant weakness and acceptance gaps

The genuine Chrome test is still failing real HP-impact visual submission under multi-second WebGL frame stalls; no cause has been attributed uniquely to D04, and stale audio must remain rejected. The priority is to inspect the newest completed real job, isolate renderer-phase failures with matched legacy/D04 receipts and build continuous genuine desktop/mobile three-direction moving evidence. Still missing: full Warden warning/release/recovery/earned counter, genuine miss/block/dodge/projectile/spell/contact-to-PCM onset analysis, opt-in/mute/reload, low-end and reduced-flash/motion evidence, and 20-minute effect/audio resource soak. Do not relax the hard 400ms deadline or another session's source ownership to manufacture a pass.
