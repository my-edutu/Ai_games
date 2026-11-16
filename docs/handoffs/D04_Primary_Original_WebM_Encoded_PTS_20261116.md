# D04 — Original primary WebGL WebM packet witness (2026-11-16)

**Status:** Native RED/GREEN demonstrated; corrected-head genuine browser playback remains pending. This is a read-only evidence reliability increment, **not** verified combat audiovisual synchronization or a physical-realism acceptance pass.

## Observed defect and authentic evidence

The completed genuine Dungeon Chrome workflow [43905010790](https://github.com/my-edutu/Ai_games/actions/runs/43905010790) exercised seeded real DungeonRuntime state, existing Three.js WebGL output, actual opt-in, and an original canvas + soundstage recording. Native contracts passed 405/405; six real browser tests passed and the strict feedback acceptance failed. Six matched cinematic/tactical/chase desktop/mobile captures shared 12 authority ticks and five true HP-loss ticks, but **zero HP-loss ticks were universally proven drawable** across the six views. A recorded VP8/Opus file, WebGL receipt or audio waveform does not prove visible injury or synchronized original sound.

The previous post-capture Chrome video element reported `BROWSER_DECODE_UNVERIFIED` on the primary original WebM; metadata did not load even with the muted retry. Yet independent **read-only ffprobe** inspection of the unchanged original `dungeon-d04-real-canvas-original-sound.webm` from [authentic artifact 14246138567](https://github.com/my-edutu/Ai_games/actions/runs/43905010790/artifacts/14246138567) found both VP8 and Opus tracks and exactly **two actual encoded video packet PTS: 2.995s and 3.950s**. Independent FFmpeg decoded two different frame hashes. A separate bounded EBML inspection confirmed the 1,000,000ns TimestampScale and the same two packet times. Thus this is also a **sparse encoded frame yield**, not just a browser-metadata parsing error. It is not proof those frames contain contact.

Six other genuine viewpoint recordings yielded 10–15 VP8 packets per viewpoint; recordings alone do not establish visual hit timing, independent decoded PCM contact onset, or acceptable frame cadence. Across the preceding strict session, some renderer-call intervals lasted multiple seconds; D04 per-effect visual CPU readings alone do not establish the stall's underlying cause.

## Test-first correction and isolated implementation

- **RED** [commit 19be2e6](https://github.com/my-edutu/Ai_games/commit/19be2e6b3f35282db72912291ab2e80018455462), [CI 43915076549](https://github.com/my-edutu/Ai_games/actions/runs/43915076549): new primary-recorder fixture failed as intended. **405 passed, 1 failed**. The fixture uses *synthetic EBML*, never impersonating genuine Dungeon media.
- **GREEN** [commit a12cc4e](https://github.com/my-edutu/Ai_games/commit/a12cc4ea8270c6cf241d3b6a2cee1ed531ba63d3): D04 forensic EBML parser accepts the independently authenticated, consented primary `real-canvas-plus-opted-in-soundstage` recording as a second legal packet source, in addition to the existing serial real-WebGL readback. Primary gate checks VP8/Opus MIME, live opt-in soundstage, bounded length/recording window, zero frame-request failures and bounded observed/requested frame counts.
- **Browser wiring** [commit 38fffc8](https://github.com/my-edutu/Ai_games/commit/38fffc846254aa6ef061250db10209b67bcc55c8): when the serial WebM has no valid EBML packet proof, inspect the **already captured** authentic primary WebM and attach the source plus packet timing classification. No new recorder, seek-loop extension, audio output, canvas draw, arbitrary attacker, contact effect, source asset, or renderer change.
- **Corrected native CI** [workflow 43915406404](https://github.com/my-edutu/Ai_games/actions/runs/43915406404): **406/406 tests passed**, TypeScript production build succeeded. At handoff writing, the real-preview browser job remained in progress; do not transfer prior real evidence as a corrected-head playback pass.

The classifier requires a monotone per-submission receipt witness before reporting an encoded packet scarcity class, and cannot exceed requested frame counts. It deliberately returns `SPARSE_ENCODED_VIDEO_PTS_UNALIGNED`, `ONE_ENCODED_VIDEO_FRAME_UNALIGNED`, or `ENCODED_FRAME_TIMING_UNVERIFIED` rather than a visible-impact or synchronized-audio pass. An invalid pump, missing consent, duplicated/reversed receipt, corrupt EBML, nonmonotone PTS, missing original sound track or overbudget input fails closed.

## Scope, specification review and quality review

**Files:** `tests/foundation/dungeon-d04-webm-pts-proof.test.cjs`, `tests/browser/dungeon-d04-webm-pts-proof.cjs`, `tests/browser/dungeon-physical-feedback-preview.spec.cjs`, and this handoff. No authority, game source, rig, camera, global lighting, live VFX/audio, or workflow edits. The seven retained pools (102 reserved instances), seven-draw-call cap, 8-voice cap, audio opt-in/mute and 400ms sound deadline remain unchanged. The frozen BEFORE comparison at `281735d0910c6b2443648af976003d50412ee324` and default legacy spectator are untouched.

**Specification:** Original track identity and provenance are admitted only as **packet-level** evidence; event HP-loss causality, sound start eligibility, accessibility and frame gates are unaffected. No false attribution, sound or hit is created.

**Quality:** Packet parsing confirms that there can be very few actual encoded frames despite genuine renderer receipts and requested canvas frames; it does *not* prove which stage dropped frames. The fallback cannot repair software-WebGL submission delays or encoded perceptual injury quality. Genuine browser moving visual/PCM review still required. Roll back these D04-owned commits on the isolated branch only; never merge or revert through main or PR #49.

## Next dominant blocker

Collect the corrected-head browser packet report and matched clips from cinematic, tactical and chase viewpoints at 1440×900 and 390×844, then independently compare *decoded* contact pixels, real HP-loss receipts and original PCM samples on a bounded common timeline. Genuine timely HP injury visibility remains the leading unmet gate; multi-second renderer-call stalls need renderer-owner investigation outside protected D04 source boundaries. Warden warning/release/recovery/earned counter, miss, guard, dodge, arrow, spell, ambiguous attribution, restart and 20-minute soak are still unaccepted.

Legacy `/dungeon` remains default. Experimental D04 continues only with `?feedback=d04` until a dedicated integration review.
