# D04 — Undrawn ranger/spell release must retain a real source witness

**Status:** source-level correction, focused adapted checks passed. Genuine Dungeon GLB/WebGL/WebAudio playback, native Node/build/browser suites and real PCM remain **UNVERIFIED**. Not production-ready or promoted.

- Owner: D04 combat VFX/foley only, branch `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting head: `9960c6d12b64b07dd079575014520e2a06238d6c`. Frozen BEFORE reference: `281735d0910c6b2443648af976003d50412ee324`.
- No change to main, Draft PR #49, `games/ai-dungeon/src`, character rigs, camera, lighting, or other branches. Legacy `/dungeon` remains default; experiment requires `?feedback=d04`.

## Defect and test-first reproduction

The earlier delayed-release renderer correctly rejected an arrow or spell when its ranger/caster had disappeared, changed action, lost its authenticated authored hand, or advanced beyond the original `actionTick`. However, D04's submitted-frame audio controller accepted `visual=false` for all non-sword cues as generic sound-only admission. It could therefore play a fresh ranged/spell release after an absent or stale physical emitter, despite the VFX rejection. This is **source-confirmed**, NOT observed in a real Dungeon clip.

First committed `tests/foundation/dungeon-d04-unverified-release-audio.test.cjs` to cover (1) stale ranger source, (2) stale/missing caster hand, (3) true shot hidden by physical flight clearance, (4) absence of the new witness adapter, (5) a drawn source already admitted, and (6) independent, attacker-neutral HP-loss sound. An adapted V8 probe on the then-existing production controller reproduced the failing case: undrawn ranger release with `hasAuthenticatedReleasePose=false` still produced an audible receipt marked `delivered`.

## Production change

1. `public/ai-dungeon/physical-feedback-visuals.js` exposes `hasAuthenticatedReleasePose(cue)`, a **read-only** probe only for `ranged-release` and `spell-release` with `authority-action` proof. It reuses the same observed actor ID, current firing/casting action, `actionTick`, live root/cell and authored skinned-hand checks already used by visual admission. A procedural fallback remains a witnessed body/root *proxy*, not an authenticated weapon-tip socket.
2. `public/ai-dungeon/physical-combat-feedback.js` requires an affirmative probe for an **undrawn** ranger/spell release when frame-submission gating is enabled. Missing/unavailable probes fail closed with receipt `unverified-release-pose`. Genuine sound-only launches remain possible when the live emitter is witnessed but masonry clips the sprite, the pool is full or art is otherwise unavailable. Already-admitted visual launches are not recalled when their actor subsequently changes pose. A confirmed HP drop remains neutral, independently audible without art, and never identifies a guessed attacker.
3. Added direct imported-renderer regression coverage to `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`: authored hand present/missing, stale action/tick, hidden/unloaded actor, procedural root proxy, wrong proof/kind, and no allocation by the witness query.

No invented impact, new authorititative tick/contact, actor owner, new audio asset, FX instance, material, draw call, timer, permanent listener or noise buffer. The extra read-only source probe is invoked only when a submitted-frame kinetic release fails visual admission, not every gameplay frame. Existing seven pools / 102 reserved instances, maximum eight voices, bounded pending/audio queues, consent click, persisted mute, reduced motion/flash, restart/dispose and frame receipt dedupe remain unchanged in source.

## Verification performed

- **Red:** fetched previous controller with a simulated undrawn ranger release and explicit negative source witness returned **one sound**, receipt `delivered` (wrong).
- **Green:** six focused adapted checks executed fetched actual production planner, submission gate and controller with injected render/audio: **6/6** expected decisions. Stale ranger and spell are silent; witnessed undrawn arrow remains audible; absent witness rejects; drawn arrow and real HP-drop sound remain allowed. This is not a native repository test result.
- Actual fetched retained renderer exercised with mocked Three.js and actors: **5/5** live/stale/wrong tick/invisible/missing actor witness checks, pool budget **7 / 102**. This does not prove GLB bone accuracy or WebGL.
- Integrated fetched planner/controller/renderer source with simulated Three.js and a blocked visual path: **2/2**. Stale ranger released no sound; observed ranger sound delivered despite absent sprite. No real browser/device/audio capture.
- New Node test file parsed as JavaScript in V8; **native** `node --test`, `npm ci`, `npm run build`, Playwright and original WebAudio sample capture **not run**. A shared coding tunnel call returned `Tunnel-client has not been seen for 300 seconds`.
- GitHub recursive tree inspected (2,133 tracked paths at starting head, not truncated): no `.glb`, `.gltf`, `.webm`, `.mp4`, `.wav`, `.ogg` or `.mp3` tracked in that tree; no genuine Dungeon recordings to compare. Frozen BEFORE does not contain the new D04 controller module.
- The older broad adapted Warden-warning suite had unresolved **13/17** on the preceding handoff; no claim of resolving those failures.

## Required independent real-game review

On the actual isolated worktree with the GLBs mounted:

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-unverified-release-audio.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
npm run dungeon:stream
```

Capture same seed/run/floor/tick/checksum BEFORE and D04 opt-in with three genuine viewpoints at 1440×900 and 390×844: stale source and real arrow/cast, sword miss and HP-confirmed impact, block, dodge, interrupt, Warden warning/release/recovery/earned counter, defeat/restart. Capture actual canvas+original sound bus to WebM and PCM, audit audible onset against rendered frames. Test fresh-click audio, mute/reload, reduced motion/flash, 300–720ms stalls, WebGL recovery, pool/voice telemetry and the 20-minute soak. No fabricated scores, Diablo IV parity or completed acceptance claim.

**Review:** Specification: source must be observed for an undrawn *release*, while independently confirmed HP loss retains sound-only authorization. Quality: the selective extra bone/root read is bounded and happens only for refused kinetic visuals; need real timing/performance data. Risk: if an authentic action finishes before the 210/290ms staged admission, this conservative guard suppresses its delayed foley. Do not loosen without actual animated/PCM evidence. Rollback: revert only this D04-scoped increment on its own branch.

**Next dominant weakness:** authenticity of bowstring/staff-tip and Warden weapon-contact positions, and sound onset against real GLB movement remain unverified. The previous 13/17 broad warning-cell adapted check also needs a native baseline investigation.
