# D04 — Same-frame drawable HP evidence across six authentic views (2026-11-15)

**Status:** IN PROGRESS / NOT AUDIOVISUALLY ACCEPTED / NOT PRODUCTION READY.

**Isolated branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Before milestone:** `281735d0910c6b2443648af976003d50412ee324`. Start of this increment: `b5d5582c933367608100b48b66a86172b4c91706`. No changes to main, Draft PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting or other session branches. Legacy `/dungeon` remains default; `?feedback=d04` remains opt-in.

## Confirmed authentic browser evidence BEFORE this increment

The preceding six-view real Chrome workflow [43666527651](https://github.com/my-edutu/Ai_games/actions/runs/43666527651) **completed**. Its selected native contracts were **359/359 passed**, and the TypeScript production build passed. The original Dungeon Chrome/browser portion finished **6 passed, 1 failed**. All six independently recorded original WebM runs covered cinematic/tactical/chase at 1440×900 and 390×844, with **12 consecutive real `DungeonRuntime.step()` states and real WebGL frame acknowledgments per view**, 12 matched public states, and **5 shared genuine HP-loss state ticks**. This was explicitly **frame-paced, not realtime**.

The final strict original HP-contact visual test still failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. In that trial, measured slow main-thread/WebGL phase examples reached 2,485ms desktop (2,482ms renderer) and 2,989ms mobile (2,985ms renderer). Those are sampled CPU phases; they do not prove GPU completion, causation by D04, video-pixel visibility or sample-aligned sound. Six recorded original audio tracks and frame acknowledgments are not by themselves decoded moving combat or aligned PCM onset. The original [47.9MB compressed evidence artifact](https://github.com/my-edutu/Ai_games/actions/runs/43666527651/artifacts/14143390822) retains original runs and debug evidence; new playback on this latest branch is **unverified**.

## Dominant defect and D04-only implementation

A different classifier, `injuryReceipt` in `tests/browser/dungeon-d04-live-authority-pair.cjs`, could credit an HP cue as a visible injury from `visual===true` and `decision==='delivered'`, even when `visualDrawableAtSubmission===false` (sound-only) or the bounded receipt was from an older actual frame. The six-view comparator reported matching HP-loss public states but did not independently report any matching **drawable** injury across all six views.

Test-first contracts were committed separately, followed by corrections:

- `tests/foundation/dungeon-d04-live-authority-pair.test.cjs`: rejects hidden/sound-only HP art, previous-frame receipt reuse, and missing/wrong D04 frame serial; accepts genuine muted visual-only submission. Requires that all six views witness their own matching drawable injury before `matchedDrawableHpLossTicks` becomes positive.
- `tests/browser/dungeon-d04-live-authority-pair.cjs`: HP art evidence must have `visualDrawableAtSubmission===true`, matching authority tick and **the identical acknowledged D04 frame ID**, a valid original observation/submission clock within the existing 400ms limit, and either actually delivered sound or a genuine silent `visual-only-submitted` receipt. Six-view classifier reports a separate `matchedDrawableHpLossTicks` while preserving `matchedHpLossTicks` to distinguish public HP states from drawable visuals. The counter is **not proof of encoded pixels or original PCM alignment**.
- `public/ai-dungeon/physical-combat-feedback.js`: read-only `stats().lastPresentedFrameId` exposes the existing controller's actual submission identity; no new timer, gameplay rule, queue, audio node, voice, or retained effect.
- `tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs`: samples that precise ID separately from `renderer.info.render.frame` and reports the new metric in the genuine browser diagnostics. Three camera modes and two viewport sizes remain unchanged.

All changes are review-only source/tests, with no added drawing budgets. Original generated sounds, 8-voice cap, 7 pools and <=104 reserved instances, <=32 waiting-frame cues, WebAudio click opt-in/mute, accessibility, cleanup, deduplication, and the 400ms deadline remain unchanged.

## Verification boundary and remaining acceptance

The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. The checked-out local Node/Playwright suite therefore **could not run** in this increment. GitHub connector read-back confirmed all four edited files include their source guards, and GitHub comparison was used to verify the protected-file boundary. Separate test contracts were committed before the corrections, but no independently observed native RED/GREEN test execution or browser pass is claimed on this new head. The preceding `359/359` and six-view genuine Chrome evidence apply **only to preceding commit `b5d5582`**, not this increment.

**Next dominant weakness:** the strict real-game HP impact still sometimes misses the genuine 400ms submission window because of multi-second renderer stalls (including legacy). Collect a new completed authentic Chrome artifact for this head, inspect its `matchedDrawableHpLossTicks` against public `matchedHpLossTicks`, decode original moving WebM/PCM across all six views, then isolate the renderer-owner issue without extending the deadline or forging source/damage. Warden warning/release/recovery/earned counter, miss/block/dodge/arrow/spell/impact sequences and the 20-minute cleanup soak remain unaccepted.
