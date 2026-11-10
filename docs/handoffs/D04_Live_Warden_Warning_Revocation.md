# D04 — Retire revoked Warden danger glyphs and pending warning audio

**Status:** ISOLATED SOURCE CORRECTION / ADAPTED V8 SOURCE TESTS PASSED / GENUINE DUNGEON AUDIOVISUAL EVIDENCE **UNVERIFIED** / NOT PRODUCTION READY.

Review branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting head: `46fca3c8ef0ee45e3314181446d6a9b7df2560b7`. Frozen pre-D04 comparator: `281735d0910c6b2443648af976003d50412ee324`. D04 remains opt-in with `?feedback=d04`; ordinary `/dungeon` remains the legacy spectator. Never merge this experiment into main or Draft PR #49 before separate final integration acceptance.

## Dominant source-confirmed defect

The retained `signal` pool could continue drawing three-beat Warden danger-cell rings for the remainder of their roughly 300 ms VFX lifetime **after the authoritative `bossWarning` had been removed, changed, superseded or reached its impact tick**. Its frame-acknowledged original warning audio could likewise be delivered after that public danger window was revoked. Timely frame submission is not proof of ongoing attack danger. This was established by source inspection and a committed regression contract, **not** a real Dungeon clip.

The planner already authenticates Warden warning ownership conservatively. This correction does not guess a new source, fabricate danger cells or change gameplay.

## Test-first change

- `tests/foundation/dungeon-d04-live-warning-lifecycle.test.cjs` was committed first at `255281d48dbefca8624c5903bd4c252de47d4470`. The original source lacked the required live-warning witness, so the new tests could not succeed before the production change; a native Node red run was unavailable.
- `public/ai-dungeon/warden-warning-lifecycle.js`: add pure `isLiveWardenWarning(cue, snapshot)`. Require the exact scene, attack tick, pattern, remaining legal 1–3-beat horizon, one same living Warden, and each of the cue's originally selected public danger cells still present in the current footprint. A three-beat horizon only belongs to NOVA or ECLIPSE_SWEEP. Revocation, changed owner, seal/replacement, impact, malformed or conflicting state fail closed.
- `public/ai-dungeon/physical-feedback-visuals.js`: refuse late warning admission after authority revocation and retire retained warning markers on subsequent visual advances. Count retirements as `retiredInvalidWarnings`. If an injected legacy adapter supplies no snapshot getter, preserve its previous contract.
- `public/ai-dungeon/physical-combat-feedback.js`: before frame-receipt audio classification, suppress a pending owner-specific Warden warning if that exact public warning is no longer current; receipt reason `retired-warning`. Anonymous threat event sounds remain owner-neutral.
- Production change commit: `133fbcd81760bf4734f5c5837615e3651d8b6346`.

## Proportional verification and exact limits

- Source syntax checks on all three changed production modules passed in a detached V8 adapter.
- **11/11** direct pure-helper V8 cases passed: live warning ticks, completed impact, cancellation, changed scene, dead/replaced owner, changed shape/horizon, and moved footprint.
- **5/5** new committed regression callbacks passed with actual fetched planner, controller, renderer and frame gate bodies in an **adapted V8 harness using simulated Three.js, injected audio and mocked scene snapshots**. This includes retained-ring retirement and preventing warning sound on a subsequent frame acknowledgment.
- **11/11** existing warning-watermark, warning-order and Warden-bone-signal callbacks passed in the same category of adapted source tests. A first harness attempt failed to map one test's zero-argument `load()`; corrected harness passed **4/4** of that group. No product regression was inferred from the harness error.
- No native `node --test`, `npm ci`, `npm run build`, Playwright, authentic GLB-backed WebGL or original WebAudio browser run could be executed. The coding tunnel reported `Tunnel-client has not been seen for 300 seconds`. The separate container could not reach GitHub. GitHub reported no associated PR-triggered workflow run or commit statuses at the production commit.
- The inspected tracked `public/ai-dungeon/models` contains only `.gitignore`; no genuine Dungeon WebM/MP4/WAV was located under tracked evidence directories. The frozen comparator's legacy `index.html` was inspected; D04 feedback modules did not exist at that historical snapshot.
- The source preserves the original **seven retained visual pools / 102 reserved instances / at most seven visual draw calls**, **eight-voice WebAudio limit**, **32 pending / 32 awaiting frame / 64 receipt bounds** and the existing generated mono noise limit. These are **unchanged source budgets, not runtime measurements**. No new mesh, buffer, voice, external sound or GPU resource pool.
- No change to WebAudio gesture opt-in, persisted mute, reduced-motion/flash, frame-acknowledgment eligibility, actual HP-loss causality, attacker attribution, authoritative gameplay, rigs, camera, lighting, or any other branch.

## Specification and quality review

**Specification:** A public Warden warning remains a true floor threat only while the latest public snapshot independently carries the same horizon and danger cells. Anonymous events never authorize named Warden rings. Cancelling a tell cannot generate strike or impact feedback. The extra live-warning check runs only in the opt-in D04 path.

**Engineering:** Per-frame visual checks reuse the retained slots and bound source array; the visual loop checks the same cue once for contiguous marker slots. There are no extra GPU resources. The helper checks public snapshot data without mutating it. Risks remaining: actual renderer/delivery ordering and browser clock drift have not been observed in real playback; no source-unit result alone establishes perceptual improvement.

## Required genuine acceptance before rollout

Use the same authoritative seed/run/floor/tick/checksum for frozen BEFORE and D04 AFTER captures. Record real canvas-plus-original-audio bus at **1440×900** and **390×844** from **three matched camera viewpoints**, with Warden warning/release/recovery/earned counter, missed swing, legitimate HP-confirmed impact, block, dodge, ranger arrow, spell and interrupt. Include both continuous and interrupted Warden telegraphs, a deliberately revoked warning before frame submit, saved WebM plus PCM/WAV and a common frame/audio clock. Exercise consent, mute/reload, reduced motion/flash, stalls, backgrounding, WebGL recovery, ambiguous multi-threat loss and 20-minute soak; inspect actual draw calls, voices, buffers, cleanup, and limb movement. Do not call a standalone synthesis audition or mocked Three.js an in-game synchronization test.

**Next dominant realism gap:** genuine animated sword-tip/weapon-contact and original foley onset remain unmeasured. A verified wrist joint is not a verified blade tip or strike hit. Reject claims of Diablo-IV parity or full transformation until authentic moving multi-view recordings pass independent review.

**Rollback:** revert the isolated three-file production correction and its scoped test on this D04 branch only if evidence shows incompatibility. Never force-push, merge main, modify Draft PR #49 or change gameplay/rig/camera/lighting owners.
