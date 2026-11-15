# D04 — Genuine six-view HP deadline split (2026-11-15)

**Status:** IN PROGRESS / NOT AUDIOVISUALLY ACCEPTED. Isolated D04 branch only. Frozen comparison: `281735d0910c6b2443648af976003d50412ee324`. Legacy `/dungeon` remains default; the experiment still requires `?feedback=d04`.

## Actual Chrome evidence inspected

[Completed Chrome workflow 43671371988](https://github.com/my-edutu/Ai_games/actions/runs/43671371988) ran on `a0d22263002c04c3d558660d9ffa64d7e4150bcb` (before these corrections). Its native contracts and production build passed, but strict authentic HP presentation **failed** `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` (six other browser tests passed). The original [47.5 MB GitHub evidence artifact](https://github.com/my-edutu/Ai_games/actions/runs/43671371988/artifacts/14145331611) contains the real WebM files and read-only diagnostics.

I independently extracted and decoded **six original VP8+Opus WebM recordings** from the artifact with FFmpeg/FFprobe. They are real canvas+opted-in-soundstage captures, **not** Blender renderings, synthetic audio auditions, real-time fluent action, or confirmed audible contact. Encoded video has only 10–16 frames per camera and gaps of 3.05–4.57 seconds. The desktop 1440×900 *viewport* recordings were actually encoded at 587×339 (tactical/chase) or 688×397 (cinematic), so do not label them 1440p original video. The 390×844 mobile viewport clips encoded 390×523. Opus decoded to 48 kHz nonzero PCM for each stream, 10.7–19.0 seconds per file; energy does **not** establish sync to HP impact.

All six genuine camera/viewport sessions had 12 shared immutable public states and five shared real HP-loss ticks (4, 6, 7, 10, 11). None was a drawable HP receipt in **all** six views. From direct inspection of the per-frame authentic D04 receipt IDs, ages and authority victims:

| Actual viewpoint | Same-frame drawable HP ticks | Documented >400ms HP misses | Unverified HP ticks |
| --- | ---: | ---: | ---: |
| 1440×900 cinematic | 2 | 3 | 0 |
| 1440×900 tactical | 2 | 3 | 0 |
| 1440×900 chase | 2 | 2 | 1 |
| 390×844 cinematic | 0 | 4 | 1 |
| 390×844 tactical | 0 | 5 | 0 |
| 390×844 chase | 1 | 3 | 1 |

For genuine tick 4, the three desktop modes and mobile chase had **one** timely, drawable HP receipt each (222ms, 210ms, 310ms, 378ms); mobile cinematic and tactical instead reported rejected late receipts (2,219ms and 410ms). This is a **partial submission witness**, not proof of rendered readable body contact or encoded video/PCM onset. Do not turn this table into a realism score, 100% pass, or D04-specific performance causation.

The separate strict trial's HP receipt was `stale-frame`, with 2,263ms observation-to-submission latency, 3ms measured D04 visual emission and 2,024ms measured renderer call. These are sampled CPU phases only, not GPU completion or conclusive renderer-ownership attribution. Existing legacy comparisons also exhibited severe stalls.

## This review-only implementation

Starting from branch `8f86ef5a1fe774353554246a1365fd757cc2ff27`:

1. [RED contract commit](https://github.com/my-edutu/Ai_games/commit/6b0190794a22d518f4bde490393be83f76493f7e) requires each genuine six-view HP tick to be categorized without inflating aggregate six-view success. [RED workflow](https://github.com/my-edutu/Ai_games/actions/runs/43675393829) confirmed 362 passed, 1 expected failure because the per-view field did not exist.
2. [Source correction](https://github.com/my-edutu/Ai_games/commit/7bca298a667b43ac5108e373dfe2638e29f9cb2a) adds bounded `hpImpactByView` with individually checked `drawableHpLossTicks`, `deadlineMissHpLossTicks` and `unverifiedHpLossTicks`. It accepts late classification only from canonical real HP victim+tick identity with genuine >400ms measured age (or measured pre-frame expiry); forged stale labels or borrowed prior ticks cannot pass. Existing `matchedDrawableHpLossTicks` remains the strict all-six aggregate.
3. Only D04 evidence comparator and foundation test code changed; no impact audio timing, user consent, scene renderer, graphics, cameras, character rigs, authority or resource budgets changed. The 400ms cap is deliberately **not** extended. Test execution and authentic new-head browser footage must be assessed separately after CI completes.

**Separate review gates:** The logic is evidence conservative; it does not demonstrate that real impact art is visually readable. No real matched Warden full phase, miss/block/dodge/projectile/spell footage, PCM-to-contact sample alignment, 20-minute cleanup, or low-end stall remediation is accepted. Preserve the eight-voice, seven-pool, 104-instance, 32-awaiting, 64-receipt, mute/opt-in and reduced-motion/flash protections. Do not merge main or Draft PR #49.

**Next dominant weakness:** repeat genuine playback on this head and inspect the per-view split. The 390px cinematic/tactical actual HP contact misses and multi-second WebGL submissions demand a paired renderer-owner investigation; D04 alone cannot safely solve them by late injury playback.
