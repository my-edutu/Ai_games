# D04 — Actual combat cue → real WebGL receipt → original WebAudio source-start provenance

Date: 11 November 2026. Status: **isolated evidence instrumentation only; D04 physical realism NOT ACCEPTED**.

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting branch SHA for this increment: `cb099b0ac4c37c24fcc6641f3e9e48e15f28495c`. Frozen BEFORE reference: `281735d0910c6b2443648af976003d50412ee324`. Never merge main or Draft PR #49 from this work.

## Dominant observable defect

The previous authentic Chrome session did submit real WebGL and admit several D04 visuals; it also recorded real original audio/Opus. But the recorded source had no per-event wall/submit timestamp and no trace that the original noise/oscillator sources were actually started for a **specific authoritative event**. Merely seeing an audio track (possibly ambiance), an HP delta or an aggregate `audioAccepted` could not establish impact sound causality.

This increment adds two deliberately **different** bounded clocks, joined by immutable cue ID rather than subtracting incompatible origins:

1. `public/ai-dungeon/physical-combat-feedback.js` records injected monotonic `performance.now()` at each public, authority-derived cue observation. When `acknowledgePresentedFrame` is called **after the real WebGL renderer submits**, the existing bounded 64-entry receipts report `observedClockMs`, `submittedClockMs`, `observationToSubmissionMs`, and `renderSubmissionMs`. Invalid, missing or backwards monotonic clocks produce null timestamps; no negative measured latency. `sampleSynchronized:false` is explicit. Timestamp storage is limited to the existing 192 recent cue identities, cleared on scene reset/overflow.
2. `public/ai-dungeon/original-combat-foley.js` records the actual scheduling of all original `AudioBufferSourceNode` and oscillator `start()` calls **only after successful source startup**. The strict-production-only audit ring retains up to 32 records with cue ID, kind, recipe, scene/tick, `AudioContext.currentTime` in milliseconds, count of started sources and whether swing/impact identity was canonical. A false or duplicate action cannot fabricate a start. `flush()`, mute, reset and disposal clear the ring. It does not alter the sound recipe, context routing, density, resource cap, master gain, consent or staleness thresholds.
3. `tests/browser/dungeon-physical-feedback-preview.spec.cjs` persists `artifacts/dungeon-d04-real-cue-frame-foley-timeline.json` from the genuine seeded DungeonRuntime -> public state -> Three.js/WebGL -> opted-in soundstage test. The artifact keeps the observed HP delta, actual renderer receipts, bounded original `source.start()` records and identity matches, but labels independent clock domains and **does not** claim decoded PCM onset.

## Test-first, changes and evidence

- Test-first native contracts: `tests/foundation/dungeon-d04-snapshot-arrival-clock.test.cjs` covers actual HP to submitted-frame timestamp values, replayed frame deduplication, negative clock and mute fail-closed behavior; `tests/foundation/dungeon-d04-original-foley-cue-identity.test.cjs` covers strict original source-start identity, real `start()` call, duplicate rejection, muting, bounded history and long-lived event noise budgets.
- Implemented separately in the two opt-in D04 modules and authentic browser harness. No edits under `games/ai-dungeon/src`, character rigs, camera, global lighting, main or PR #49.
- GitHub Actions [43084875707](https://github.com/my-edutu/Ai_games/actions/runs/43084875707) **passed 104/104 native contracts, build and one authentic Chrome/Three.js browser test** on intermediate candidate `0884160efbbb787a4cc2c3927b07dbf4dc960225`. Its [authentic artifact 13886850846](https://github.com/my-edutu/Ai_games/actions/runs/43084875707/artifacts/13886850846) independently examined for the intermediate change:
  - Genuine seed `visual-room-art-18`, run/floor 1/1, HP decrease tick 3→4, checksum `92c5595b`, injured victim `enemy-1-0`.
  - At later authentic frame state: **34 renderer acknowledgements; 39 queued, 31 expired, 6 visual admissions, 4 audio admissions**, 2 stale sound drops. A different-length earlier run had 43 queued, 35 expired, 7 visuals, 41 WebGL receipts. These windows are **not** directly rate-comparable.
  - The four real, frame-gated `audio:true` receipts were tick 7 fatal damage (observation→submit 314 ms, render 20 ms), tick 22 damage (114 ms, 17 ms), tick 22 guard (114 ms, 17 ms), tick 24 damage (114 ms, 15 ms). These are **WebAudio-controller admissions only**, not proven audible attack samples. No original `source.start()` ring existed in the tested intermediate candidate.
  - Live WebGL+sound recording exists but diagnostic reports `sameWindowMovingAV:false` and `sampleSynchronized:false`. Source video/audio coexistence never identifies original foley samples in encoded output. The Chrome environment lacked general-purpose FFmpeg/FFprobe decoder in CI.
- Final candidate includes the additional `source.start()` audit and native/browser matching. **Do not claim its native/browser CI passed until the later candidate's workflow completes and artifact is examined.** Test-first red attempt was cancelled by branch CI concurrency; do not claim a witnessed red result.

## Behavior and resource review

No change to the hard 400 ms admission deadline, physical VFX pools (7, 104 slots, max 7 additional draw calls), eight original foley voices, one generated mono noise buffer (13,440 samples), 32 pending effects, 32 awaiting-a-frame or 64 retained controller receipts. The optional source start history is 32 entries and cleared by existing lifecycle. No additional rendered geometry, synth voice, buffers, GLBs, camera pose, scene lights, damage, AI rules, result semantics or network requests.

Security/privacy: aggregate identity is the ephemeral public authority cue ID, not a username; no secrets or external licensed audio. Existing reduced motion/flash, dedupe, consent/mute storage and frame-gated sound remain in force. Static unit tests and audio-context mocks are **not** genuine WebAudio/Opus or moving-combat acceptance. The browser test creates a real audio track but even a started original sound source cannot prove audible timing without PCM calibration and decoded frame PTS.

Rollback: revert this D04-only receipt, source-start, test and handoff increment on the isolated branch; never promote `?feedback=d04` until D10 final review.

## Remaining rejection gates

- Decode same-window original WebM/PCM and correlate the actual admitted cue IDs, true WebGL presented-frame timing, `AudioContext.currentTime` scheduling, decoded audio onset and physical contact. Prove not just ambient/noise energy.
- Replace wrist-derived blade ribbon with genuinely measured authored blade geometry and credible rig-local passage, without touching animation or character ownership.
- Match 3 camera views, 1440×900 and 390×844 **moving** footage on the same seed/run/floor, include real miss/block/dodge/projectile/spell/contact and Warden warning→release→recovery→earned counter→defeat/restart, ambiguous injury attribution cases, mute/reload, accessibility, recovery, and 20-minute resource soak.
- No borrowed unlicensed audio; no Diablo IV comparison score or production-ready claim.

**Acceptance remains FAILED / IN PROGRESS** despite the verified intermediate same-event frame-audio controller correlation. Genuine sample-level, first-frame physical combat realism is still unproven.
