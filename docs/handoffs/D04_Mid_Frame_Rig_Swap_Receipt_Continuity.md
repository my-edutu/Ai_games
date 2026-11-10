# D04 — Retained sword foley must preserve skinned-wrist identity at receipt

**Status:** source-level fix on the isolated D04 branch; genuine GLB-backed WebGL/WebAudio playback **UNVERIFIED**. Do not merge, deploy or switch the legacy spectator default.

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Starting head: `9f72f0b85e8ad602bfba715be8cc90ee8f3fe46a`.
Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
Read repository `AGENTS.md`, the D04 real-preview acceptance gates, frozen commit metadata, existing measured-wrist and frame-receipt tests, current production planner/visuals/controller/foley, asset manifest and relevant game-feel, audio, physics, QA and performance skills.

## Highest-confidence observable source defect

The D04 visual keeps a small measured sword ribbon for up to 55ms after wrist movement. The existing measured-trajectory planner rejects splicing two different `sourceBone` objects, but the **later renderer-submission audio witness** checked only whether *some* valid current authored melee wrist was present. If a different GLB or wrist binding replaced the original joint after `advance()` and before the actual frame acknowledgment, the old trail was still drawable and the newly loaded wrist passed the generic pose witness. The controller could therefore play a whoosh for motion **never measured on the replacement rig**.

A focused detached V8 reproduction executing fetched production modules yielded: old trail drawable=true; original wrist witness=true; after replacement with a different bone object at the *same exact world coordinates*, witness=true (invalid). This is a source-level reproduction, not authentic game footage.

## Test-first and production change

- Added `tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs` before modifying production source. Three native `node:test` contracts cover (1) old drawable ribbon + joint replacement => no whoosh, (2) unchanged measured joint => exactly one whoosh, (3) replacement joint earns a new measured passage only after two fresh samples. Test file was committed first as `06269e1`; native tests have **not run** in the disconnected worktree.
- Changed only `public/ai-dungeon/physical-feedback-visuals.js`. `hasAuthenticatedSwingPose(cue)` still requires a living action and real sampled wrist. **When a retained drawable measured slot exists for that cue, the current wrist must be the identical `sourceBone` used for its latest measured path**. A different bone object at the same position cannot authorize sound. After the first replacement sample the stale path is cleared; after two new authentic samples a new trail can again pass the existing receipt gate.
- Controller `acknowledgePresentedFrame()` already calls this witness immediately before original foley. No controller, simulation, rig, asset, camera or lighting edit was necessary. Audio receipt decision remains `revoked-drawn-swing-pose`, preserving existing observability and queue limits.

## Verification matrix

| Evidence | Result |
|---|---|
| Detached V8 before correction | Defect reproduced: new wrist at identical world position incorrectly authorized old path |
| Detached V8 with fetched updated production planner + measured trail + visuals + controller + frame gate | 3/3 focused scenarios matched expected source behavior |
| Native `node --test tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs` | **UNVERIFIED** — coding tunnel offline |
| Broader native foundation suite / `npm run build` | **UNVERIFIED** |
| Playwright genuine Dungeon canvas/WebAudio and 390px mobile | **UNVERIFIED** |
| Original WebM + PCM and three-viewpoint matched clips | **NOT CAPTURED** |
| 20-minute resource soak and measured WebGL GPU/voice cost | **UNVERIFIED** |

The adapted V8 harness uses source from GitHub and simulated Three.js scene objects and injected sound. It is not a native Node suite, cannot substitute for real moving GLBs, and cannot establish sound-onset synchronization.

## Causality, budgets and scope

No attack can assert an HP loss, a target, or an attacker. A sword whoosh remains an observed action attempt **plus verified drawn local wrist travel**. Confirmed HP injury and anonymous events retain their independent public-authority proof. The change adds no effects, textures, samples, listeners, voices, buffers or draw calls. Existing source-defined budgets remain seven visual pools / 102 reserved instances, maximum eight WebAudio voices, one 13,440-sample original generated noise buffer, 32 pending, 32 awaiting frame, 64 receipt records. The detached harness reported 102 reserved instances, **not measured actual GPU cost**. Existing audio gesture opt-in, persisted mute, reduced motion/flash, deduplication and cleanup paths were not changed.

**Rollback:** revert the two targeted D04 source/test commits on this isolated branch only; do not modify main, Draft PR #49, `games/ai-dungeon/src`, rigs, camera or other task branches. Legacy `/dungeon` remains default; experimental feedback is only `?feedback=d04`.

## Remaining physicality and evidence gate

A tracked wrist is still **not** a verified sword tip, weapon sweep or actual collision. Before accepting D04 collect the frozen BEFORE and current AFTER at identical authority seed/run/floor/tick/checksum, through genuine moving assets, 1440x900 and 390x844, three camera viewpoints, failed swing, real HP injury, block, dodge, arrow, spell, interrupted attack, full Warden warning/release/recovery/earned counter, simultaneous threats, restart, gesture/mute/reload, reduced motion/flash, WebGL recovery and 20-minute resource soak. Capture canvas WebM plus genuine audible PCM, measure submission-to-audio alignment and perform independent moving-footage review. Missing GLBs/tunnel prohibit any honest genre-parity or production-readiness claim.

**Next dominant weakness:** verify authentic blade-tip location/contact and Warden release sound onset against animated GLBs and common-clock PCM. Do not invent an offset or certify physical synchronization from source tests.
