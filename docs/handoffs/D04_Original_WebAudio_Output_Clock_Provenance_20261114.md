# D04 — Optional original-foley WebAudio output-clock provenance (14 November 2026)

**Status:** Reviewable D04-only observation improvement, **not sample-synchronized** and **not audiovisually accepted**.

- Repository: `my-edutu/Ai_games`; branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Baseline HEAD when inspected: `53a54cf6cddc3db6ac6c2f3327648fc3c4103a75`.
- Frozen BEFORE is `281735d0910c6b2443648af976003d50412ee324`; it is used for comparison only.
- Test-first RED commit: `e516bedb65289efd864232f770948ab6e1aa2b08`; [RED run](https://github.com/my-edutu/Ai_games/actions/runs/43588147952) **334 tests, 332 passed, 2 expected failures**. Authentic browser job skipped because contracts failed.
- Implementation commit: `d33cb8c0244c952896ec24de92719346b4b3bd0e`; [GREEN CI and genuine Chrome job](https://github.com/my-edutu/Ai_games/actions/runs/43588302506). Its final verdict must be read from Actions; at writing, the job was queued.

## Dominant instrumentation weakness addressed

The D04 original WebAudio source audit had `scheduledContextMs` and immutable scene/cue/tick identities, but could not report even an approximate output timestamp on the host performance clock. The genuine WebGL frame receipts use a separate performance clock. Naively subtracting a WebAudio `currentTime` from a frame's `performance.now()` would fabricate source-to-frame alignment.

The original-foley engine now **optionally** samples `AudioContext.getOutputTimestamp()` after successful source scheduling and records `estimatedOutputPerformanceMs`. This is a carefully bounded projection using `performanceTime + (scheduledContextSeconds - contextTime)*1000`. Both clock fields and the scheduled time must be nonnegative and finite, and the context timestamp must be no more than one second from the scheduled cue. Unsupported, stale, invalid, or throwing clocks produce `null` rather than fabricated evidence; foley still starts normally. The receipt continues to state `sampleSynchronized:false`. In particular, `estimatedOutputPerformanceMs` is **not** a decoded/played PCM onset, hardware delivery time, or mapped video PTS. Do not claim a successful A/V synchronization test from this estimate.

One bounded optional clock query occurs only after a successful original cue's source scheduling. There is **no** new WebGL effect, queue, buffer, WebAudio voice, persistent listener, timer, or authority mutation. The ≤8 voice limit, one 13,440-sample seeded mono buffer, existing seven visual pools/102 slots/seven draws, 32 pending/32 awaiting/64 receipts, mute/opt-in, reduced-motion/flash, source deduplication, scene cleanup and 400ms submission deadline are unchanged. Legacy spectator remains default; use only `?feedback=d04` for the preview. No license-dependent audio is used.

## Test and review boundaries

New native contracts require a valid timestamp to produce precisely `1020`ms for a scheduled `7`s context time mapped through context `6.98`s/performance `1000`ms; and invalid/unsupported/throwing timestamp sources to yield `null` **without muting sound or changing voice limits**. These pass/fail contracts are independent of actual decoded output and are intentionally labeled as such. The Native GREEN/build/browser status should be updated only after a completed Actions verdict.

The last completed pre-change [genuine Chrome run](https://github.com/my-edutu/Ai_games/actions/runs/43584230815) had successful contracts/build and five diagnostic browser trials but strict failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Previous genuine desktop/mobile VP8+Opus had sparse delivered frames and multi-second WebGL render calls, including in legacy mode. Their real game origin does **not** demonstrate three moving camera views, meaningful synchronized contact audio, or completed 20-minute cleanup soak.

**Next dominant work:** first verify the post-change CI and real Chrome verdict. Then capture a common calibrated performance-to-audio clock and actual decoded WebM video PTS/PCM attacks with genuinely matched seed/run/floor/tick/checksum, three viewing angles, desktop 1440×900 and 390×844, miss/block/dodge, arrow/spell, Warden warning/release/recovery/earned counter, and real HP losses. Do not weaken the 400ms deadline or attribute software-WebGL renderer-phase stalls to D04 without controlled evidence.

**Specification review:** no forbidden files or authoritative rule changes; no implied attacker/contact. **Quality review:** improves clock provenance observability but not rendering performance, PCM timing, or physical impact perception. **Rollback:** revert just the original-foley source commit on the isolated branch if real-browser output timestamp probing causes regressions.
