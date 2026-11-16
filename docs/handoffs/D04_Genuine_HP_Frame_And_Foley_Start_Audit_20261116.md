# D04 — Genuine HP frame delivery versus original WebAudio start (2026-11-16)

**Status: incremental D04-only forensic implementation; physical impact/audio synchronization NOT ACCEPTED.**
Do not merge, deploy, modify main or PR #49. Legacy /dungeon remains default; D04 is opt-in only via ?feedback=d04. Frozen BEFORE comparison 281735d0910c6b2443648af976003d50412ee324 unchanged.

## Authentic observed contrast that motivated the correction

The latest completed genuine Chrome run [43915406404](https://github.com/my-edutu/Ai_games/actions/runs/43915406404), [original artifact 14253445091](https://github.com/my-edutu/Ai_games/actions/runs/43915406404/artifacts/14253445091), captured the real seeded DungeonRuntime public HP transitions and live Three.js/WebGL + opted-in original WebAudio state. Contracts succeeded (406/406) and 6/7 browser tests succeeded. Strict visual acceptance correctly FAILED.

Its bounded real receipts differentiate two adjacent-tick injury opportunities:

- **Tick 4, victim enemy-1-0:** HP loss genuinely occurred, an injury was admitted to the retained pool, but WebGL submission happened **2608ms** after observation (of which **2296ms** was the measured renderer-call interval). The decision was **stale-frame**. No original impact sound was authorized.
- **Tick 7, same victim fatal HP loss:** the genuine post-WebGL receipt had **frameId 16**, **140ms** observation-to-submission, **16ms** measured renderer interval, retained visual marked **drawable at submission**, decision **delivered**, original sound admission true. This is **one timely genuine post-WebGL *metadata* witness**, not independently decoded visible contact.
- The corresponding original procedural WebAudio source.start telemetry identified that exact fatal cue and reported two scheduled sound sources at **AudioContext 5811ms**, with an **estimated** performance clock of **15864ms**. The renderer receipt clock was **15829ms**. This clock estimate is NOT a decoded/recorded PCM onset and may not be subtracted from the original WebM PTS as if they share a calibrated origin.

The primary opted-in VP8/Opus WebM exists and is genuine but sparse, with no independent moving-pixel or decoded contact/onset verification at tick 7. The separate PCM WAV contains original real audio, not independently aligned to the tick-7 image. Six matched three-direction (cinematic/tactical/chase) desktop/390px captures still contain **five HP-loss ticks with zero events universally confirmed drawable across all six views**. The single tick-7 metadata witness does not contradict that six-view strict failure.

## Isolated test-first implementation

- [Regression commit 02e1cf7](https://github.com/my-edutu/Ai_games/commit/02e1cf77b995bea45c38d61af2d69839828cf893): two additional synthetic, explicitly non-gameplay native contracts: distinguish stale 2608ms injury from timely 140ms fatal injury without claiming PCM, and reject forged attacker/source identity, missing frame, duplicate cue receipt, inconsistent clocks and sound recipe.
- [Read-only classifier 56cf64d](https://github.com/my-edutu/Ai_games/commit/56cf64d75ebba50692a08490ddb2692ec10b65d5): new tests/browser/dungeon-d04-impact-submission-witness.cjs. Only counts victim-only canonical HP receipts, one unique timely drawable submitted frame <=400ms, and independently identity-matched original source.start telemetry. Max 64 receipts and 32 source starts, no audio/video playback or production controller changes. Returns **audibleImpactVerified=false**, **pixelMotionVerified=false**, **sampleSynchronized=false** without exception.
- [Real-preview integration e6911d5](https://github.com/my-edutu/Ai_games/commit/e6911d5fc9e6551774ab481834219c217b8323d0): the existing genuine Dungeon Chrome test now writes and attaches dungeon-d04-genuine-impact-submission-witness.json from its authentic source, preserving its existing strict negative acceptance assertion.

The RED test was committed before the helper existed, but an executed RED native-run verdict is not available. An isolated V8 execution of the **exact branch helper source**, with the same witness and forged/duplicate fixtures, passed. **The new-head GitHub native/build and browser results are not yet confirmed.** Earlier 406/406 cannot be transferred to the new head.

## Boundaries and quality gate

No modifications to games/ai-dungeon/src, legacy default, rigs, camera, lights, WebGL renderer or other sessions' branches. No changes to the existing seven retained VFX pools (102 instances, <=7 draw calls), 8 original WebAudio voices, <=19,200-sample generated noise resource, consent/mute, 400ms deadline, reduced motion/flash, deduplication, restart cleanup or canonical authority HP proof. No third-party music or sound assets. The witness is **diagnostic only** and cannot alter the source's decision to deliver or drop a physical effect or original sound.

**Specification review:** Canonical victim-only cue identity, fresh post-WebGL acknowledgement, truthful sound-source label and bounded read-only reporting. The strict genuine browser assertion is unchanged.

**Quality review:** A true single-view frame receipt alone does not establish a visible injury silhouette, audible PCM onset, or cinematic quality. Misinterpreting this as completed combat realism would be incorrect. The full six-view matched moving footage, independent original PCM onset calibration, Warden warning/release/recovery/earned counter, miss, block, dodge, arrow, spell and 20-minute cleanup soak remain unaccepted.

**Dominant next weakness:** multi-second WebGL renderer-call intervals (also observed in legacy) make genuine HP injuries miss the original 400ms cue/audio deadline. Root-cause renderer investigation belongs to the separate integration/renderer owner, not to forbidden D04 authority/game files. Continue matched moving-frame and PCM review while preserving original casualty causality; do NOT extend the deadline or invent impact on expired frames.

**Rollback:** revert these four D04-only commits on the isolated branch after review; never merge or revert via main or PR #49.
