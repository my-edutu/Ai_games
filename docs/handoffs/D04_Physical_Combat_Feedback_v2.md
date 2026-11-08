# AI Dungeon — D04 Physical Combat Feedback Realism Pass v2

**Verdict: IMPLEMENTED ISOLATED CANDIDATE. NOT MERGED, NOT INTEGRATED, NOT VISUALLY ACCEPTED.**

This extends the first D04 handoff. It improves the *real, authored spectator effect code* and procedural sound design; it does **not** claim that an unrendered demo is a gameplay recording. The live coding tunnel was offline, and this round could not test against a running instance of the full Three.js Dungeon. **D10 alone** owns integration with the other D01–D09 workstreams.

## Source identity and frozen boundary

- Repo: `my-edutu/Ai_games`, existing Draft PR #49 (`feat/ai-dungeon-3d-gauntlet-foundation`).
- Frozen split-wave source inspected: `c51342c0253435325d6a46e4d9f02b337a2ad138`. Do not silently rebase isolated D04 changes onto the moving head.
- Permanent BEFORE reference for overall Gauntlet: `281735d0910c6b2443648af976003d50412ee324`. Do not rebaseline.
- D04 owns feedback event planning, weapon trails, impact fragments, projectile/spell cosmetics, material foley, cue scheduling, audio opt-in and clean-up. Other sessions own rigs, gameplay, walls, lighting, camera, HUD, renderer and master Gauntlet ledger.

## What changed in this continuation

1. **New original blade streak geometry:** a shared tapered 16-segment ribbon, low opacity, attached to the existing validated skinned hand where present; not a neon torus or an asserted contact path. No rig modifications.
2. **A restrained verified-injury fracture:** 4–6 deterministic small ballistic fragments per *actual observed HP decrease*. Fixed instancing, no per-hit mesh/material creation and no actor identification for ambiguous harm. Source direction is never guessed. No arrival splash for arrows/spells whose actual hit is not established.
3. **Distinct physical effect roles:** muted steel streak, detached material chips, shield shimmer only with a grounded actor, one-cell dodge dust, Warden source signal, pointed ranged arrow, and a separate spell orb. All effects are local and never overwrite Warden hazard cells.
4. **Original material sound:** air swings use filtered noise only; body impact uses a low transient; a confirmed block has three inharmonic, short steel partials; magic and Warden releases use separate narrow-band textures. Max eight voices, low master gain, optional compressor, one retained seeded mono noise buffer and clean shutdown.
5. **Render-submission audio barrier:** `createPhysicalCombatFeedback({requirePresentedFrame:true})` stages due VFX before a render, then **only** emits its queued audio when `acknowledgePresentedFrame(frameId)` is called *after a successful actual 3D render*. Duplicate frame IDs are ignored. Effects older than 400 ms of bounded rendered time are silently dropped rather than arriving as a later storm. This reduces premature sound, but **a submission acknowledgment is NOT proof of video pixel or audio playback synchrony**.
6. **Safety:** first-load silence; default-mute persisted preference; no audio restart on reload without a new gesture; stale/blocked/anonymous inputs cannot invent a hit, a material cause or a combat actor. Reduced-motion removes non-essential trails/dust, retains meaningful HP-damage feedback and reduces duration; reduced-flash effect opacity ≤0.25.

## Files to hand D10

- `public/ai-dungeon/physical-feedback-plan.js` — pure authority-derived cue contract (preserved from v1).
- `public/ai-dungeon/physical-feedback-visuals.js` — rebuilt original instanced geometry and finite physical effect scheduling.
- `public/ai-dungeon/original-combat-foley.js` — new sound recipes, synth layering, original noise, mute and voice cleanup.
- `public/ai-dungeon/physical-combat-feedback.js` — shared scheduling and acknowledgment contract.
- `tests/foundation/dungeon-physical-feedback-d04.test.cjs` — original 14 behavioral contracts, updated fixture to account for seven retained geometry groups.
- `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` — 11 new focused visual/audio/barrier/storm/consent contracts.
- `docs/contracts/D04_physical_feedback_contract.v2.json` — machine-readable event, proof, pool, scheduling and ownership contract.
- `evidence/d04-original-foley-audition.wav`, `evidence/d04-original-foley-browser-receipt.json`, `evidence/d04-original-foley-window-metrics.json` — genuine **browser-synthesized audition only**, not running-game evidence. Audition source is preserved separately.

## Concrete test receipts

- Baseline v1 suite before continued changes: **14/14 PASS**.
- Added five isolated failing v2 tests on initial v1 implementation: **0/5 PASS, 5/5 expected RED**.
- Rebuilt visual geometry and pools: **2/5 new tests GREEN**.
- Rebuilt audio engine: **3/5 new tests GREEN**.
- Render-submission barrier: **5/5 new tests GREEN**.
- Expanded storm, failure and provenance cases: **25/25 total Node contract tests PASS** from one run.
- `node --check`: four ES modules pass syntax check. Node `v22.16.0`.
- Actual headless Chromium `AudioContext` with explicitly clicked audition button rendered **240,000 mono frames, 48 kHz, 5 seconds**. Peak **0.01316**, RMS **0.00074** (sample normalized), no page errors. These are PCM results from the real WebAudio graph, **not integrated-loudness, true peak, audio-video sync or game-event proof**. Localhost test navigation was blocked by the browser administrator; a self-contained `about:blank` page and inlined module were used instead.
- The actual full-game TypeScript runtime, original WebGL actors, 390px composition, combat audio/media recorder and browser CI were **not available**, so full-game acceptance is explicitly pending.

## Resource envelope (strict hard caps)

| Resource | New observed/contracted bound |
| --- | --- |
| Instanced pools | 7 retained meshes; zero shown when idle |
| Total reserved VFX instances | 102 = 8 trail + 48 hit + 8 block + 12 dust + 8 signal + 10 arrow + 8 spell |
| Geometry/material allocations | 7/7 retained for scene lifetime; none per hit |
| VFX draw submissions | ≤7 when every group active, zero when idle; actual hardware draw cost NOT profiled |
| Hit fragments | 4–6 for HP delta only; 0 for merely successful target alignment / projectile arrival |
| Audio voices | 8 concurrent maximum; lowest-priority may be preempted |
| Shared noise | ≤19,200 samples / ≤76,800 raw bytes |
| Audio master | gain 0.12, optional dynamics compressor; final rendered true peak unverified |
| Cues | ≤24 per snapshot; ≤32 pending; ≤32 awaiting presented frame; ≤64 receipt entries |
| Old cues | 400 ms maximum rendered-time staleness after presentation scheduling |
| Timers/texture imports/camera changes | 0 in effects modules |

## Critical truth, attribution and visibility limits

- A **swing** is an action, not a hit. A whoosh may occur on a miss, but no chip or contact sound can follow until a real HP decline is witnessed.
- **Observed HP loss** is a victim fact. Current public events lack source IDs for many blocks and interrupts. Even one legal same-tick incoming attacker may coincide with an independent hazard. Therefore `damage` cues do not name a perpetrator. A verified melee lane permits only a presentation delay of 215 ms.
- **Block, dodge, warning** only use real public event kinds. A generic `telegraph` cannot be called a Warden warning just because its text mentions the boss. Anonymous block/interrupt remains audible and HUD-readable, not falsely anchored in 3D.
- **Ranged launch** needs exact authoritative targetId and an eligible presentation lane. Arrow reaching the target creates no victim damage particle by itself. The actual HP delta owns the injury.
- **Materials** are timbre categories only when the renderer has a trusted explicit role descriptor; actor or injury attribution may never be derived from a material sound.
- **Warden** warning (rising/final), actual cast release, opening/recovery and earned counter remain different feedback groups; never invent strike/contact from a warning countdown.
- **One render submission** is neither video presentation nor audio output proof. Measure captured frame/audio onset separately.

## D10 integration gates: do not enable both combat effect systems

1. Add the four modules as same-origin `/dungeon/` script routes under the existing strict CSP. Do not modify gameplay code or change simulation versions.
2. Establish **one reversible combat owner** before enabling D04. Disable overlapping `combatDirector.accept/recordDamage/recordEvasions` and overlapping `soundstage.planSoundCues` combat categories **without** deleting ambient mood, footsteps, healing/loot/floor cues, Warden hazard cells, character motion, HUD or accessibility. D04 must never duplicate the old contact fan, trails or boss-warning audio.
3. In the real authority poll, call `physicalFeedback.acceptSnapshot(publicState)` after actors are created. In the real animation loop, call `physicalFeedback.advance(dt)` **after rig posing but before WebGL render**. After successful `composer.render()` or `renderer.render(scene,camera)` (including a successful error fallback), call `physicalFeedback.acknowledgePresentedFrame(monotonicRenderedFrameId)` once. Do not acknowledge from a timer, screenshot test, state poll or failed render.
4. In the existing real audio user gesture, resume AudioContext, then call `physicalFeedback.attachAudioContext(ctx)` and `physicalFeedback.enableAudioFromGesture()`; on mute call `physicalFeedback.muteAudio()`. Persist mute, not consent. If WebAudio fails, game/visual feedback continue. Reconnect audio only after a new gesture as appropriate.
5. On floor/run/world destruction, call `physicalFeedback.reset()`; on final shutdown call `dispose()`. On context loss, do not acknowledge stale frames; reconstitute the effect resources when a new WebGL context/world exists, preserving source-of-truth state only.
6. Check first-load, individual combat miss/contact/guard/evade/interrupt/arrow/magic, Warden three-beat warning/strike/recovery/counter, fatal defeat/restart, audio disable/resume, and browser graphics restore **in real game motion**. Match seed, ticks, viewpoints, encoding FPS and desktop/390px viewport against the pinned BEFORE. Inspect both clips, not only PNGs.
7. Record exact integration SHA, actual frames, render-submission ticks, public cue receipts, visible effect onset frames and audible waveform onset, peak/true-peak, timeline tolerance, memory budgets, CPU/GPU p95/soak, browser errors and reviewer verdict. Use fresh critics for LOOK/FEEL/PLAY. If any are missing, the entire transformation remains **IN PROGRESS — NOT TRANSFORMED**.

## Still not realism-complete

The fidelity bottlenecks span Sessions 1–9: original high-quality actors and believable deformation, physical world/buildings/materials, exposure and legibility, continuity camera, readable outcomes and actual tactical progression. This D04 pass cannot turn a simple stylized game into a credible Diablo IV-like action spectacle on its own. **Do not merge or declare production-ready until the genuinely integrated game is accepted.**
