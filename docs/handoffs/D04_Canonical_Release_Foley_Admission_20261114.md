# D04 — Canonical ranger, spell and Warden release sound admission (14 November 2026)

**Status:** Test-first D04 source correction committed; **329/329 native contracts and production build verified**. Genuine full audiovisual realism **NOT ACCEPTED**.

## Ownership and provenance

- Only modified branch: `feat/dungeon-d04-combat-feedback-realism-20261108`, starting at `32a9fd53733af502ab0c7b281add89aeef89aef8`.
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324`. Reviewed `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, frozen Dungeon README, D04 foley source, CI reports, genuine previous Chrome log/capture montage, and the game-audio, game-feel-vfx, simulation-qa and performance-optimization guides.
- Source: `public/ai-dungeon/original-combat-foley.js`; tests: `tests/foundation/dungeon-d04-strict-original-foley-provenance.test.cjs` and `tests/foundation/dungeon-d04-foley-cue-idempotency.test.cjs`. Documentation only otherwise. No changes to `games/ai-dungeon/src`, authored character rigs, camera, global lighting, main, PR #49, other branches, or deployments.
- Test fixture update [a9e042f](https://github.com/my-edutu/Ai_games/commit/a9e042f3326e571e3600f162bf9105d99018f355), failing new three-kind regressions [391aa46](https://github.com/my-edutu/Ai_games/commit/391aa46b34aaea519e39483b09dbdc5e0c31286b), source fix [949e7c6](https://github.com/my-edutu/Ai_games/commit/949e7c6313dc8a5746f5bbe1fe6ba9b434787791).

## Defect / real outcome boundary

The strict preview already canonicalized ranger, cultist and Warden release cues for *historical freshness*, but its admission condition rejected malformed canonical proof only for whooshes and HP impacts. Thus a release named `ranged-release`, `spell-release` or `warden-release` could play original WebAudio with a fabricated ID, absent actor, mismatched scene/tick, invalid proof or invented target. A release is an authoritative action, not a hit, and may never obtain original source sound from a malformed tuple.

The fix requires `isCanonicalVerifiedCombatFoleyCue` for **all six authority-bound original transients** (swing; regular/fatal HP injury; ranger, spell and Warden releases) in `requireVerifiedContact` production mode. The existing verification requires event ID = scene:tick:kind:actor:target, unique bounded IDs, canonical scene and tick, verified `authority-action`, matching kind, audio, visual and target semantics. Neutral dry/utility/guard recipes and standalone procedural auditions keep their established separate contracts. Rejected releases allocate **no WebAudio nodes** and do not consume 128-ID history, onset budgets or eight-voice slots.

The sound pool remains eight voices, one locally generated 13,440-sample mono noise buffer, transactional priority preemption, mute/opt-in, bounded deduplication and existing low master gain. VFX pools, reduced motion/flash, physical HP proof and 400ms actual-frame audio deadline are untouched. `/dungeon` legacy stays default and `?feedback=d04` remains opt-in.

## Verification, with explicit evidence tiers

1. **RED:** [run 43569422354](https://github.com/my-edutu/Ai_games/actions/runs/43569422354) executed the native suite: 329 tests, 326 passed, **three expected release-proof regressions failed** (`actual:true` but required `false`). Browser job was intentionally skipped following native failure.
2. **GREEN:** [run 43569513403](https://github.com/my-edutu/Ai_games/actions/runs/43569513403) executed 329/329 native tests, 0 failures, and `npm run build` successfully. CI also checked JavaScript syntax.
3. **Genuine game browser:** On the GREEN run, the Chrome real-preview job had begun at this document's preparation time; final verdict was **unverified**. It may fail the separate mandatory physical realism gate and must not be represented as passing. The preceding completed [Chrome run 43564882629](https://github.com/my-edutu/Ai_games/actions/runs/43564882629) ran six real Dungeon browser tests, five passed and one strict preview test failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The captured original WebM tracks are **not sample synchronized**; independent decoded video was unavailable on that runner. This increment's source-level cue admission correction is not independently audible/visible in those previous recordings.
4. **Previous real-clip inspection:** Decoded pre-change desktop/mobile WebGL+Opus contact montage shows very sparse camera views without continuous contact. Previous 1440px live authority: 13 frames, max 3.533s gap; 390px: 19 frames, max 3.356s. An earlier real-frame phase diagnostic attributed sampled worst delays primarily to the renderer call, including legacy mode. This is **not evidence that D04 caused or solved WebGL stalls**.

## Reviews, next owner and rollback

**Specification review:** strict releases now demand canonical action proof before sound; no invented attacker/victim, no additional release-to-damage claim, no mutation of authority. **Quality review:** a single hot-path Boolean proof check reuses the existing canonical witness, avoiding buffers/listeners/allocations. Test fixtures that previously invented a Warden release without actor/tick/proof were updated to provide a legitimate public-action witness. Note: rejecting malformed cues is required even if a production caller currently passes only valid cues.

**Rollback:** on the isolated D04 branch only, revert source commit `949e7c6` if integration demonstrates a legitimate old event tuple mismatch, but retain the three RED tests as a stop-ship signal. Do not merge or change the legacy path.

**Next dominant observed blocker:** The stringent real-game HP visual acceptance remains unsuccessful because multi-second WebGL frame-submission stalls allow authentic impact cues to expire. Compare the same authoritative snapshots and matched viewport with/without D04 while measuring render CPU phases, GPU visibility and frame capture overhead; preserve the 400ms fail-closed audio window. The three-viewpoint moving desktop/390px videos, complete Warden warning/release/recovery/counter, missed swing, block, dodge, projectile, spell and actual HP impact audiovisual evidence, independently aligned decoded original PCM, accessibility/mute-reload and 20-minute cleanup/resource soak remain **NOT VERIFIED**. Only D04-owned submission/cue/evidence code is writable; renderer/rig/camera/global-lighting changes need their designated owners and integration review.
