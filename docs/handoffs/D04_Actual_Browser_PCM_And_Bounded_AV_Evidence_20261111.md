# D04 — Actual Dungeon browser PCM and bounded A/V evidence (2026-11-11)

**Status: IN PROGRESS; REAL-GAME PCM VERIFIED; COMBINED WEBM / A-V SYNC UNVERIFIED.**
D04 stays opt-in `?feedback=d04`; the legacy spectator remains default.
This handoff changes no authority, rig, camera, lighting, main branch or Draft PR #49.

## Evidence-based defect selection

The previously passing real Dungeon/Three.js browser run
[42959278676](https://github.com/my-edutu/Ai_games/actions/runs/42959278676)
produced a real WebGL gameplay screenshot and a Playwright **video-only**
WebM. It contained no original WebAudio track, so a valid render submission
was not adequate evidence that physical combat cues sounded in step.

The independent soundstage already exposes a true opted-in live PCM capture
and media stream. This increment wires both into the existing D04 *real*
Playwright preview. Its recorder takes `#world.captureStream(24)` and the
active, explicitly consented `soundstage.captureStream()`, starts before a
genuine seeded `DungeonRuntime.step()` HP-delta transition, and separately
captures 5.5 seconds of the soundstage's actual WebAudio PCM via the existing
bounded live processor. No procedural stand-in or borrowed sound is injected.

The pure `assessD04Capture` contract requires the real video/audio source,
actual audio and video tracks, recorded WebM bytes, non-silent live PCM,
progressing real WebGL submission count, and bounded capture duration/bytes.
Unsupported or empty captures are **UNVERIFIED**, not passed. Even a valid
WebM+PCM is explicitly **UNALIGNED** until sample timing is independently
measured. The helper stores genuine files and JSON diagnostic manifests under
`artifacts/` so passing Playwright test attachments cannot disappear.

## Test-first, native CI, and observed real browser

- Test-first contract `0cdb64c`; bounded recorder and conservative classifier
  `393e992`, browser attachment `3289497`.
- Passing-test artifact retention was initially missing; new durability tests
  `56f441c`, helper `5a0049c`, integration `0c7a832`, workflow `06b39c2`.
- Run [42960894739](https://github.com/my-edutu/Ai_games/actions/runs/42960894739)
  detected an actual 1-of-34 failure: a literal backslash-n appended to JSON.
  Fixed in `756f5bb`; no rerun-until-green concealment.
- Latest [GitHub Actions 42961023699](https://github.com/my-edutu/Ai_games/actions/runs/42961023699)
  on `756f5bb81face46e1a7cbf7efcb44e676f7c4a53` succeeded:
  **34/34 native Node tests**, build, strict SHA-verified CC0 GLB download,
  real headless Chromium/Three.js Playwright **1/1 smoke**.
- [Authentic CI artifact 13828828792](https://github.com/my-edutu/Ai_games/actions/runs/42961023699/artifacts/13828828792)
  includes the current full gameplay screenshot, passing-test Playwright VP8
  **video-only** WebM, `dungeon-d04-live-av-evidence.json`, and a **real
  recorded mono 16-bit original soundstage PCM WAV**.
  Manifest: opt-in succeeded; actual WebGL receipt counter advanced **1 → 4**.
  PCM `RECORDED`, 44,100 Hz, 242,550 frames, **5.5 seconds**,
  485,144 bytes, observed peak **0.01379**, RMS **0.00731**.
  These are recording properties, **not** quality scores or proof of combat-
  transient timing. The live PCM includes the actual original soundstage mix
  and cannot alone distinguish D04 whoosh from ambience.
- Crucially, headless SwiftShader returned **0 bytes** from the combined
  canvas+audio `MediaRecorder` after 8.58 seconds despite obtaining one
  canvas-video and one opted-in audio track. Assessment correctly records
  `UNVERIFIED`, `combinedVideoAudio:false`,
  `liveOriginalPcm:true`, `renderFramesAdvanced:true`,
  `sampleSynchronized:false`. A video-only Playwright capture plus
  independently recorded actual PCM must NOT be mislabeled a synchronized
  audiovisual recording.

## Scope and impact

Changed only D04-specific browser tests, evidence verifier, new Node contracts
and its isolated GitHub Actions workflow; the authoritative gameplay modules,
rigs, camera, lighting and production sound/VFX modules are unchanged.
No additional runtime resource pools, voices, noise samples or startup paths.
Source ceilings remain 7 retained visual pools / 102 reserved instances,
8 original foley voices, a 13,440-sample seeded noise buffer and D04-specific
pending/receipt bounds. These ceilings still need an actual 20-minute soak.

**Review gates still OPEN:** native blade-tip motion instead of wrist proxy;
sample-aligned WebM + PCM; matched frozen BEFORE vs D04 AFTER three camera
directions, 1440×900 and 390×844; misses, blocks, dodges, arrow, spell,
HP-confirmed contact and Warden warning/release/recovery/earned counter;
soak, audio device restart and performance captures. The current browser
capture is a **real game smoke**, not Diablo-IV parity, impact synchrony
acceptance, or production readiness.

**Next bounded task:** overcome 0-byte headless combined MediaRecorder without
fabricating frames or sounds; instrument actual browser frame times and sound
sample timestamps. Only then compare precisely matched combat sequences and
evaluate real sword-tip geometry when its authored rig is accessible.

### Reproduction

```sh
npm ci
node --test tests/foundation/dungeon-d04-av-capture-evidence.test.cjs
npm run build
npm run dungeon:assets:strict
npx playwright install --with-deps chromium
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
