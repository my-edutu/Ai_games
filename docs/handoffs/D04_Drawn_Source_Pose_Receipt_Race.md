# D04 — Drawn source pose revocation at actual frame receipt

**State:** isolated source-level improvement; genuine Dungeon WebGL/GLB/WebAudio acceptance **UNVERIFIED**.

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. Inspected starting head: `a9df9813d10a2b86d279ad23f445d57e09f1d187`. Frozen BEFORE milestone remains `281735d0910c6b2443648af976003d50412ee324`, which predates the D04 experiment (do not invent a D04 baseline at this revision). Read `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, the interrupted-trail handoff, current D04 production source, applicable game-feel/audio/physics skills, and the actual previous commit. The current `public/ai-dungeon/models` GitHub directory contains only `.gitignore`, not the GLBs or moving clips required for physical acceptance.

## Observable dominant source defect

A retained GPU slot was updated in `visuals.advance()`, but its source actor could disappear, die, change public action or lose its attached skinned wrist *before* `acknowledgePresentedFrame()`. The controller previously tested retained-slot liveness and drawability only. These remained `true` until another visual advance, so an obsolete **drawn sword whoosh or Warden release/recovery sound** could be released from a now-invalid physical performer. The prior revocation safeguard covered only **undrawn** release/body cues. This is a source-confirmed timing race, **not** an observed real-game clip defect.

Using the actual fetched **pre-change** controller body, a detached V8 production-source experiment produced:
- Revoked drawn Vanguard: one audible `swing` and `delivered` receipt.
- Revoked drawn Warden: two audible `warden-release` and `opening` cues, both `delivered`.
- Unrevoked controls: expected single swing and ordered two Warden beats.

## Test-first contract and production delta

The new `tests/foundation/dungeon-d04-drawn-source-frame-receipt.test.cjs` was committed **before** production modifications. Six native `node:test` cases define:
1. Drawn sword audio must be rejected if its performer is revoked after staging but before receipt.
2. Drawn Warden release and recovery audio are independently revoked at receipt.
3. Still-valid drawn sword and Warden cues retain one-shot audio.
4. Already-launched drawn ranger projectile may continue sounding despite later caster pose changes; the release was witnessed at admission.
5. Production sword witness requires the same living actor, attack tick and actual attached authored wrist; no root proxy.
6. Integration with the **real D04 retained renderer and controller**: a measurable skinned-hand ribbon remains drawable between pose update and receipt, but action cancellation suppresses its stale sound.

`public/ai-dungeon/physical-feedback-visuals.js` now exposes a read-only `hasAuthenticatedSwingPose(cue)` that delegates to the existing strict `anchor(cue,'trail')` witness. It adds no geometry or pose mutation. `public/ai-dungeon/physical-combat-feedback.js` rechecks drawn sword and drawn body-local action pose (existing `hasAuthenticatedBodyPose`) after normal submitted-frame liveness/drawability/deadline checks and before original foley emit. Two explicit decisions are `revoked-drawn-swing-pose` and `revoked-drawn-body-pose`.

This strict additional check applies in the actual D04 renderer, which implements both probes. Older injected test/legacy visual adapters without those **optional** probes keep their pre-existing compatibility behavior; they are **not** evidence of equivalent provenance protection. Independent HP damage, anonymous impact, unrelated Warden warnings, and already-admitted projectile/spell flight are not retroactively attributed or revoked. Reduced-motion swing audio intentionally stays on the existing accessible event-only path; that path still requires separate real-device verification.

## Verification completed in this environment

- **Source-based red/green**, actual fetched module bodies loaded in detached V8 with injected planner/visual/foley dependencies, not a browser: revoked drawn Vanguard **1 -> 0** false foley; revoked Warden **2 -> 0** false foley; unrevoked cases **1 -> 1** and **2 -> 2** remain intact.
- **Post-change source-backed controller scenarios:** revoked sword suppressed, revoked release/recovery suppressed, live sword delivered, live release/recovery ordered, and previously launched drawn ranger arrow remains independent. These are adapted and simulated.
- **Production renderer source-backed witness:** genuine selected authored wrist accepted once, then correctly denied after guard switch, death or wrist removal. No effect allocation; reserved instances **102** across **7** visual pools.
- **Adapted integrated renderer/controller race:** measured trail `hasLiveCue=true`, `hasDrawableCue=true`, and one active retained trail after two synthetic animation updates; switching action to guard before receipt yields **0 whooshes** and `revoked-drawn-swing-pose`. This is a simulated THREE stage, **not authentic GLB playback**.
- Source and committed test bodies were syntax-checked through detached JS compilation. **Native `node --test`, `npm ci`, `npm run build`, Playwright and CI pass status are NOT verified.** The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; the separate container cannot resolve `github.com`. GitHub's combined commit-status endpoint reported zero statuses, not a green run.

## Boundaries, resources, rollout and remaining risks

Only D04 visuals, D04 controller, a D04-specific test and this handoff changed. No write to `main`, Draft PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting, or other branches; no merge or deployment. Legacy spectator stays default; experiment remains explicit `/dungeon?feedback=d04`.

No extra draw call, mesh, material, GPU pool, audio sample, noise buffer, voice, listener, clock or authoritative mutation was added. Existing seven pools / 102 reserved instances / eight original-foley voices, priority/deduplication, click opt-in, persisted mute, reduced motion/flash, cleanup and bounded receipt semantics were not altered. The two checks are bounded read-only pose probes per corresponding pending sound on frame receipt. Actual browser CPU/PCM/soak deltas remain unknown.

**Specification review:** a submitted drawable slot is necessary but not sufficient proof of a *currently valid* body gesture; repeat the current physical source check immediately before audio release. **Quality review:** a very narrow advance-to-submit actor change can still show one obsolete GPU frame because the draw occurred before audio receipt. Fixing that fully requires frame-level producer/renderer ordering and moving GLB evidence at the integration boundary; it must not be misrepresented as solved by silencing audio.

## Next required genuine trial

With the isolated worktree, licensed model assets and browser/audio capture restored:

```sh
npm ci
node --test tests/foundation/dungeon-d04-drawn-source-frame-receipt.test.cjs tests/foundation/dungeon-d04-interrupted-attacker-melee-trail.test.cjs tests/foundation/dungeon-d04-strict-blade-submission.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Capture exact same seed/run/floor/tick/checksum BEFORE/AFTER from three viewpoints at 1440×900 and 390×844; actual missed swing, block, dodge, live arrow, spell, real HP injury, Warden warning/release/recovery/counter, defeat/restart, rapid interrupt/death, opt-in/mute/reload, reduced motion/flash, WebGL loss/recovery and 20-minute retained-resource soak. Inspect original canvas WebM + sound-bus PCM against submitted-frame time; do **not** count procedural WAV audition or stub scene as genuine synchronized playback. The older broad Warden-warning adapted fixture failures (previously 13/17) also remain unresolved.

**Next dominant realism weakness:** the trail still represents animated wrist displacement, **not authenticated sword-tip passage/contact**, and original Warden strike sound onset has no verified moving GLB/PCM alignment. A blade-contact redesign must wait for real asset transforms and actual play footage, not fabricated offsets or genre-parity scores.
