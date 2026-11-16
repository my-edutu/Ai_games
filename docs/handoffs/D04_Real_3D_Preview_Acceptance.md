# D04 — Physical Combat Realism Preview: Acceptance and Rejection Gates

Status: **IN PROGRESS / NOT TRANSFORMED / NOT PRODUCTION READY**

Frozen inspection base: \`c51342c0253435325d6a46e4d9f02b337a2ad138\`. 
Isolated review branch: \`feat/dungeon-d04-combat-feedback-realism-20261108\`.
Comparison milestone BEFORE stays pinned at \`281735d0910c6b2443648af976003d50412ee324\`.
Do not merge into main or PR #49 until evidence-led review is satisfied.

## What is installed on this branch

- **Normal /dungeon**: previously established legacy director and soundstage unchanged in behavior.
- **/dungeon?feedback=d04**: opt-in experiment with read-only snapshot planner, seven retained GPU pools, new procedural physical foley, and renderer-submission acknowledgment.
- The experimental spectator routes all new foley into the existing capture-capable soundstage FX bus, suppresses duplicate old combat cues, preserves ambient, traversal, utility and reward audio.
- Only real public action transitions may create swing/release cues. A swing **never** certifies damage. Only consecutive actual HP loss may make injury VFX. No text-parsed attacker or fictitious target.
- Audio remains off until a fresh click; mute stops pending voices, stores muted preference, never automatically unmutes after reload. Motion/flash have restrained alternatives.

## Run the exact reproduction

From a worktree checked out on the isolated branch:

\`\`\`sh
npm ci
npm run build
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
\`\`\`

Open \`http://localhost:4181/dungeon\` for the known spectator and \`http://localhost:4181/dungeon?feedback=d04\` for the preview, using \`npm run dungeon:stream\` once the model assets are present.

**Initial frozen handoff (historical only):** detached tests passed 25/25 at branch creation; the shared coding tunnel was disconnected then and genuine browser playback had not yet run. This is superseded by the dated exact-head CI evidence below. The original independent audition WAV was never gameplay audiovisual synchronization evidence.

## Exact-head browser acceptance review — 16 November 2026

**Review target:** isolated branch commit \`92c95f262044a3204b333a59ae21b365e6a2c099\`; frozen BEFORE remains \`281735d0910c6b2443648af976003d50412ee324\`.
**Source:** [GitHub Actions run 43947176376](https://github.com/my-edutu/Ai_games/actions/runs/43947176376) and its [64-file real-game evidence artifact](https://github.com/my-edutu/Ai_games/actions/runs/43947176376/artifacts/14267886937), produced 2026-11-16. The \`contracts\` job passed **410/410 native tests** and \`npm run build\`. The authentic Chrome 157 WebGL job passed **6/7 browser tests** but correctly failed the strict actual-damage admission gate.

### Dominant measured acceptance blocker — browser rendering, NOT a VFX sound-deadline waiver

- **Original, actual DungeonRuntime witness:** seed \`visual-room-art-18\`, run/floor \`1:1\`, adjacent ticks **3→4**, victim count **1**, authenticated checksum \`92c5595b\`. Its exact anonymous damage cue reported **\`stale-frame\`** after **1,302 ms** between source observation and submission. Thus **0/1** selected HP victims had a timely drawable cue; the browser gate returned \`AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED\`. Do **not** replace this RED verdict with later unrelated accepted cues.
- Across a separate genuine continuing HP receipt audit: **11** distinct injury receipts, **2** drawable/timely at tick **37**, with **2** original \`source.start()\` matches, and **9** stale or unsubmitted. Those two successes are scheduling/retained-draw witnesses, **not** independently decoded visible blade contact or aligned PCM onset.
- Matched original-authority six-view evidence: **3 existing viewpoints × 1440×900 and 390×844**, **12 matched ticks**, **5 matched HP-loss ticks**, **0** visually drawable HP-loss ticks **across every viewpoint**. This independent trial is not rescued by the later two receipts from another recording.
- Genuine continuous-preview phase receipts include a desktop frame with **3,778 ms** from D04 visual-advance start through WebGL submission, of which **3,768 ms** was measured around \`renderer.render()\`, with **0 ms** recorded in the D04 visual pass. A separate 390px frame measured **3,199 ms** to submission, **3,193 ms** in \`renderer.render()\`, **0 ms** in the D04 visual pass. These are **measured main-thread phase intervals**, not proof of GPU completion, a specific shader/asset cause, or D04 being universally free.
- The actual combined WebM had consented original sound and requested-frame receipts; the serial same-window A/V readback contained **6** parsed video packet PTS values (1,043–3,824 ms), but no qualified moving decoded pixels. The authentic **5.5 s / 44.1 kHz mono PCM** has energy without proven physical-contact onset. On this runner, optional \`ffmpeg\`/\`ffprobe\` system decoders were absent and Chromium's muted decoder could not decode video metadata. **Actual audiovisual sample synchronization remains UNVERIFIED.**

### Independent artifact decode cross-check (same exact-head recording)

A separate read-only review **after** the runner completed used local \`ffprobe\` and \`ffmpeg\` on the unchanged 48,343,212-byte Actions artifact ZIP (SHA-256 \`a6bc9bca497ce72a060ee8d8c06d3fd4b0379ed8d2b8b8e0cb1d16c88e40f492\`). Unlike the CI runner, this reviewer had local decoders. With \`ffmpeg -i FILE -map 0:v:0 -vf scale=24:16 -frames:v 64 -f framemd5 pipe:1\`, actual decoded thumbnails were:

| Exact file in linked Actions artifact | Decoded VP8 frames | Distinct 24x16 decoded pixel hashes |
|---|---:|---:|
| \`dungeon-d04-real-canvas-original-sound.webm\` | 6 | 6 |
| \`dungeon-d04-real-webgl-readback-original-sound-UNVERIFIED.webm\` | 6 | 6 |
| \`dungeon-d04-real-webgl-receipt-readback-video-only.webm\` | 1 | 1 |
| \`dungeon-d04-real-webgl-serial-video-only.webm\` | 3 | 3 |
| \`dungeon-d04-live-authority-on-desktop1440-sixview-cinematic-unaligned.webm\` | 14 | 14 |
| \`dungeon-d04-live-authority-on-mobile390-sixview-unaligned.webm\` | 16 | 16 |

The authentic same-window readback's six decoded video frame PTS values are **1,043 / 1,625 / 2,190 / 2,729 / 3,272 / 3,824 ms**. Thus **moving encoded original Dungeon pictures do exist** in the captured media; the CI's \`UNAVAILABLE\` was specifically a decoder limitation, not proof that all footage was static. This upgrades the narrow **decoded-moving-pixels transport** claim only. It **does not** show the first tick-4 injury (still stale at 1,302 ms), prove a visible sword–victim contact, match physical contact to an Opus/PCM onset, or reverse the strict red browser acceptance result. A future test must carry the authenticated event clock into the SAME decoded media window before making any synchronization claim.

### Exact perf-owner handoff (outside D04 edit ownership)

Keep D04 cue causality, scene/one-shot dedup, WebAudio opt-in, 400 ms limit, existing seven pools and fixed draw limits unchanged. The game rendering/performance owner—not this D04 worker—should profile the existing \`renderer.render()\` boundary on authenticated continuous combat frames, compare identical seed/run/floor/tick/checksum in legacy and \`?feedback=d04\` with and without MediaRecorder, and isolate blocking compilation/uploads/driver or readback paths **without guessing which is responsible**. Use already emitted \`slowSubmissionPhase\` frame IDs and the paired desktop/mobile artifacts; record wall-time sections immediately around existing render and frame submission, real GL/canvas configuration and first-frame versus steady-state stages. The observed long renderer intervals are present in legacy comparisons too; do not attribute them to the D04 retained pools without matched proof.

**Exit criterion before D04 can claim genuine real-hit feedback:** fresh same-head Chrome captures must show the **exact selected adjacent HP victim** timely and drawable on a submitted frame within the unchanged 400 ms cutoff, and decoded moving contact pixels must be checked against real original-bus sample onset. Repeat matched six viewpoints and all Warden/miss/block/dodge/arrow/spell scenarios, then a full 20-minute cleanup soak. A working WebM recorder, one timestamped \`source.start()\`, a screenshot, or 410 passing tests do not substitute for these gates.

**Ownership guard:** no change to main, Draft PR #49, \`games/ai-dungeon/src\`, protected character rigs, camera, global light or other owner branches. The legacy spectator remains the default; D04 stays isolated behind \`?feedback=d04\`.


## Mandatory authentic LOOK / FEEL / SOUND trials

Record SAME authoritative (seed/run/floor/tick/checksum), three camera directions and actual movement, without altering authority or substituting screenshots:
1. Entry to ordinary chamber, long traversal and real footfalls.
2. Genuine sword attempt that **misses**: visible gesture and whoosh, **zero** injury fragments or successful-hit sound.
3. Genuine adjacent sword contact with real HP loss; after-image, target fragment, vibration/acoustic onset and damaged-actor pose compared frame-by-frame.
4. Block, one-cell dodge, cultist cast, ranger arrow and a real interrupt. No fake target or duplicated audio.
5. Warden warning, release, recovery and **earned** counterattack, followed by decisive Warden defeat and run restart. Warning floor cells stay readable, no ghost emitter or sound after restart.
6. 1440×900 and 390×844. Show world-first combat readability, not HUD mockups. Inspect visuals from multiple camera positions and in moving footage.
7. Two distinct cases with **simultaneous incoming threats** and one ambiguous health loss: no arbitrary attacker identification.
8. Audio opt-in, mute/reload, low-end render stalls, reduced-motion + reduced-flash, WebGL recovery, browser background/foreground and 20-minute effect density/cleanup run.

Capture **both tracks** from the actual canvas+original opt-in sound bus. Attach original WebM and extracted PCM/WAV when supported. If codec, device or frame delivery is absent, label audiovisual evidence **UNVERIFIED**, not passing. Audio waveform energy alone does not prove synchronization. Compare a bounded common clock to actual frame submission and audible samples.

## Hard budgets and acceptance criteria

| Contract | Required proof |
|---|---|
| 7 retained visual pools, 104 or fewer reserved instances | Inspect genuine WebGL draw submission and pool stats |
| Maximum 7 new VFX draw calls | Count actual effects during dense combat |
| 8 or fewer live foley voices, one 19,200-sample-or-smaller mono generated noise buffer | Browser audio telemetry and voice cleanup |
| 32 pending effects, 32 audio-awaiting-frame, 64 receipts | Saturation/eviction test and restart |
| No audio before opted-in gesture or unsubmitted effect | Real button interaction, frame receipt and A/V playback inspection |
| No false injury, wrong attacker or distant projectile target | Compare with actual authority HP, actor targetId, map collision/range |
| Complete cleanup after run/floor change, mute, WebGL loss/recovery | Scene/audio node counts after stress |
| Genuine improved readability and physicality versus frozen baseline | Matched BEFORE/AFTER clips, mobile/desktop, fresh independent blind critique |

## Fail-fast realism review

Reject if the blade looks like a floating neon crescent, effects appear at grid-centre detached from the rig, whoosh arrives long after blade passage, strike and damage clocks diverge, frequent hits overwhelm foreground actors, the Warden becomes visually unreadable, or software-WebGL performance collapses. Existing 3D character anatomy, choreography, environment and camera have independent owner sessions; do not silently “fix” them in D04. D10 may only replace default after verifying compatibility and removing old overlapping systems.

**Do not claim the Diablo IV/No Rest for the Wicked/Path of Exile 2 bar, integrated transformation, or production readiness based on the 25 green unit tests, one WAV audition or a single screenshot.**

## 16 November 2026 — D04 before-render stale impact correction

The [exact-head Chrome run 43957415467](https://github.com/my-edutu/Ai_games/actions/runs/43957415467) on `e110dc620f89a22c75b769d1b7a4ce1560963aa6` passed its 410 native contracts and 6/7 browser tests, but **failed** the selected real injury gate: observed HP loss (seed `visual-room-art-18`, tick 3→4) reached WebGL after **2,084ms** (`stale-frame`): 362ms to D04 visual advance, 6ms visual emission, 1,716ms thereafter including 1,668ms inside WebGL. Only **1/13** later real injury receipts was timely drawable with an original WebAudio source.start match. Original six-viewpoint capture remained **0/5** matched HP-loss ticks drawable across all views. Neither renderer receipts nor source.start establish decoded PCM synchronization.

A D04-only `retireStaleBeforeRender()` safety barrier now retires authenticated cues already older than the unchanged **400ms** deadline before the WebGL draw begins. This prevents an avoidable visual-only ghost impact even where the post-WebGL sound rejection already worked. Still-live Warden warning tiles are preserved without old sound. It scans the existing maximum 32 waiting receipts with one clock sample and adds no pools, audio voices or draw calls. Three native regression cases cover timely, expired and muted states. **Actual render() stalls are not fixed by this barrier**, and new exact-head browser verification remains required before asserting improvement or acceptance. Main, PR #49, legacy default, actor rigs/camera/lights and authoritative rules are unchanged.
