# AI Dungeon — Session 8: unified camera / foreground visibility handoff

**Review status:** CANDIDATE IMPLEMENTED; **MOTION ACCEPTANCE NOT ACHIEVED**.  
**Isolated draft:** [PR #69](https://github.com/my-edutu/Ai_games/pull/69), `feat/dungeon-unified-adventure-camera-20261108`.  
**Development source:** `f6bbfb3eb5f7b18a5b0e5d786d354724896883cb`; pinned G088 baseline `281735d0910c6b2443648af976003d50412ee324`.  
**No main changes, merge, deployment, authoritative simulation edit or HUD/character/architecture replacement.**

## 1. Exact changes

1. New pure module `adventure-camera-director.js`: single, bounded, read-only state machine for manual (0) → journey (10) → portal (35) → approach (45) → combat (60) → recovery (72) → earned counter (80) → defeat (90) → real cast release (95) → imminent Warden warning (100). The ordering denotes priorities, **not** synthetic gameplay modes or forced events.
2. Existing shot continuity and real-body/scene physical-occlusion planners now run beneath this coordinator. Only *automatic cinematic* framing can use an alternative physical orbit. Tactical, chase, manual-follow and reduced-motion modes cannot be stolen by the cinematographer.
3. Warning entry opens FOV immediately and accelerates physical pan / aim within a bounded step; release receives restrained urgency, recovery narrows gradually; authority-backed warning cells remain in the existing final critical-subject fit gate.
4. Floor/run and manual handover clear stale continuity and orbit caches. The state machine retains constant-size mode/counter state and never writes `DungeonRuntime`, damage, units, pathfinding or save formats.
5. Foreground recession has been **redesigned conditionally** from genuine parent motion evidence. With real render-frame separation over 250 ms, the existing living-body cutaway resolves in one frame instead of slowly dropping / raising original stone over multiple seconds. At normal frame delivery its original eased behavior remains; reduced motion is immediate. Exact measured selection is exposed as `foregroundRecessionPolicy`. The source geometry and physical scene remain intact.

## 2. Real earlier motion reviewed — not candidate-after proof

Inspected the **2026-11-08 00:03 UTC parent-source** real `DungeonRuntime.step()` → Chromium WebGL browser capture artifacts from [workflow 42427983542](https://github.com/my-edutu/Ai_games/actions/runs/42427983542), source `c51342c0253435325d6a46e4d9f02b337a2ad138`, at desktop and mobile viewports.

- [Desktop source footage artifact](https://github.com/my-edutu/Ai_games/actions/runs/42427983542/artifacts/13596960613): 378 decoded image frames, video timestamps 2.608–570.711 seconds, median video-frame separation 1.681 seconds, 95th percentile 4.005 seconds.
- [Mobile source footage artifact](https://github.com/my-edutu/Ai_games/actions/runs/42427983542/artifacts/13596249181): 253 decoded frames, timestamps 0.057–511.327 seconds, median separation 1.644 seconds, 95th percentile 5.784 seconds.
- Both video files **end prematurely** in the decoder and originate from an unsuccessful full-journey workflow. They document **sparse recorded frame delivery, not measured GPU or renderer FPS**, and are **not** sufficient to certify a smooth camera or a recession transition.
- Genuine sequence review shows busy Warden court columns and a very wide ↔ close shot rhythm. A single foreground visibility-ray score fails to explain the real player experience; a 0.25-second stone return rendered across multiple multi-second frames is unacceptable. This evidence motivates the conditional instant-cutaway policy but **does not prove the new policy's visual quality**.

## 3. Real simulated sequence (not a rendered film)

The test `dungeon-adventure-camera-sequence.test.cjs` uses **unmodified production DungeonRuntime.step** (no staged teleport, healing, damage, warnings or scripted death), real `planEncounterFrame`, real `planCinematicShot` and the new coordinator.

Four declared seeds: `gauntlet-corpus-v1-0`, `camera-warden-1`, `camera-warden-2`, `camera-warden-3`. **5,600 genuine authority ticks** total, covering journey, combat, approach, warning, real cast release, recovered exposure, earned counter, floor progress, and natural defeat in two seeds. The snapshots remain unchanged; explicit checks reject fake or stale warning/release/counter and accidental camera control in manual and tactical modes.

Local **exact-source reconstruction**: prior GitHub Actions review-workspace archive plus the parent source's one-commit renderer-preflight delta and this isolated branch's camera/test changes. Local file hashes were checked against GitHub for all edited camera/environment/source files.

- `npm run build` — **PASS**
- `npm run dungeon:test` — **341 / 341 PASS**
- `node --test tests/foundation/dungeon-*.test.cjs` — **551 / 551 PASS**
- Original two legacy *source-pattern* assertions after the director refactor were adapted within app integration and no foundational test was deleted or weakened.

These are **local Node results**, not GitHub CI approval. No new child-branch GitHub Actions run was available at time of handoff.

## 4. Remaining mandatory acceptance

**NOT APPROVED:** after-change full-game Chromium/WebGL motion capture could not be executed in the container: even a local development server was rejected by Chromium with `net::ERR_BLOCKED_BY_ADMINISTRATOR`; the interactive coding tunnel was unavailable. Prior screenshots/video are **source-only**. Do not claim a new moving WebGL, foreground recession comparison, manual camera UI or mobile 390px capture is verified.

Run a matched *authentic* before/after recorded replay from the same seed and tick stream on the **final rebased PR #69 code**, desktop 1440×832 and mobile 390×844, including (a) entry/traversal, (b) normal contact, (c) complete Warden warning cells, (d) true strike, (e) genuine recovery/counter, (f) all-party defeat, (g) natural restart and (h) manual follow/tactical/chase view. Observe actual canvas frames, not overlaid HUD/ray test. Reject visible stone popping, giant stone rising, cropped warning cells, long dead-air camera pans, sword/body crops, collision-through-walls, subject-hunting/whip-pans and any stolen manual view. Report frame/capture cadence separately.

**Parallel integration:** PR #49 continued changing while the Session 8 branch was developed; PR #69 currently reports non-mergeable. Reconcile only its camera integration against the latest parent **after** other ownership sessions stabilize. Never force push, merge, modify main or overwrite their work.

**Decision:** keep the fast normal-frame recession **only as an experimental fallback**, reject slow multi-second visual sinking/rising for sparse frame delivery, and withhold production acceptance until matching moving WebGL evidence verifies both cases.


## Session 8 continuation — full danger footprint, physical camera path and urgent coverage (8 November 2026)

**Candidate source:** \`feat/dungeon-unified-adventure-camera-20261108\`, isolated Draft [PR #69](https://github.com/my-edutu/Ai_games/pull/69). All new camera integration was copied to GitHub and **every changed file matched the locally tested workspace content**, verified using per-file deterministic FNV-1a 64-bit checksums. No merge, production deploy or authoritative code change.

### New production-path work

1. **Real danger-footprint camera:** \`adventure-threat-framing.js\` consumes the exact current public Warden boss warning (legal shape, attack tick, full cell set), living boss and closest living defender. A capped 43-view deterministic sweep frames the **entire inclusive cell rectangle and body head/feet**, not the old first 32 cell centres. It can adjust aim, radius, height and FOV within physical map limits. Reports actual required angle, cap, covered/uncovered and tested viewpoint count. A warning that cannot fit in a 390px lens remains explicitly \`capped/unframeable\`, not falsely passed.
2. **First warning frame:** same unified director can advance a **genuinely urgent** camera/aim transition only when the ordinarily eased view would still crop a real imminent warning. Bounded fraction \`<= .94\`, never an uncontrolled snap. Uses the minimum beneficial step among four samples and up to 82° portrait / 76° landscape FOV. No speculative boss attacks, synthetic danger, damage or movement.
3. **Camera world collision:** \`camera-volume-safety.js\` checks the interpolated camera segment against floor-cached original masonry wall columns and actual foreground world AABBs (bounded near-camera scan, max 352 walls plus 160 nearby props). Clear movement is unchanged; an obstructed track cranes above real stone or holds until safe. An existing camera embedded in a tall pillar can recover into free air. No gameplay collision or environment geometry edits.
4. **Truthful final visibility:** an additional \`actualDangerCoverage\` diagnostic inspects the **post-easing, post-collision, post-subject-fit actual 3D camera**. This distinguishes a correctly projected *proposed* warning shot from the camera frame the player truly receives. \`cameraPhysicalPath\`, \`threatFrame\` and the coordinator's bounded metrics explain any safety correction. Projection alone is not an unobscured-WebGL visual pass.
5. Auto cinematic owns only these decisions; manual follow, tactical/chase camera selection, reduced-motion behavior, fixed map, boss AI, character art, materials, HUD, audio and save/replay remain untouched.

### Test-first and authentic authority state checks

- Created **failing tests before** implementing the danger and collision modules and their unified integrations.
- Verified exact source through local \`npm run build\`, \`npm run dungeon:test\` **357/357 PASS**, and \`node --test tests/foundation/dungeon-*.test.cjs\` **567/567 PASS**. All existing source/scene contracts remained intact.
- Four real seeds — \`camera-warden-1\`, \`camera-warden-2\`, \`camera-warden-3\`, \`gauntlet-corpus-v1-0\` — contributed **170 evaluated authentic desktop/mobile warning snapshots**. **155/170** produced a smaller full-footprint required FOV than the original authored candidate. **8/170** remained capped/unframeable, appropriately reported rather than hidden.
- A more adversarial **16 first-frame 390px warning transitions** from the same genuine authority seeds tested the ordinary-ease proposal against the new urgency rule: **16/16** improved projected coverage, and **14/16** became fully framed within the selected lens in the bounded physical-shot projection. The other two remain open. This is *predicted geometric coverage*, not actual recorded GPU frames.
- Camera-only local Node profile: **1,242** naturally generated true Warden warnings, \`planAuthoritativeThreatFrame\` p50 **0.045 ms**, p95 **0.1155 ms**, p99 **0.2345 ms**, worst **2.6094 ms**; max **43** candidate views. With 300 representative tall masonry-volume scans, \`planCameraVolumeSafety\` p50 **0.038 ms**, p95 **0.224 ms**, p99 **0.3518 ms**, worst **0.9962 ms**. These are **process-local CPU function times only**—not browser rAF, GPU p95, production hardware, draw calls or encode time. Sampled on the available sandbox Node runtime; no performance win against a captured baseline is claimed.

### Remaining blocking visual integration

**UNVERIFIED — DO NOT MERGE:** a genuine AFTER 1440px desktop and 390px mobile WebGL journey cannot be captured from this environment because browser navigation to the local dungeon was blocked by administrator policy; the interactive coding workspace tunnel remained unavailable. Existing earlier real gameplay footage is source-only and does not validate any new framing or physical detour. Check in motion: (1) full Warden danger tiles visible **after** collision correction, (2) no 0.94 transition near-snap that produces viewer disorientation, (3) no visible high-clearance camera crane/stone popping, (4) manual and reduced-motion modes, (5) three-floor organic traversal, (6) final defeat/restart, (7) responsive 390px combat, and (8) long-run render cadence. Any failure must remain open with its actual screenshot/video evidence.

Parent #49 continues moving under parallel specialized sessions; this branch intentionally remains isolated and may require conflict-aware integration when parent stabilizes. **M1 remains IN PROGRESS / NOT TRANSFORMED.** The pinned \`281735d0910c6b2443648af976003d50412ee324\` baseline is unchanged.
