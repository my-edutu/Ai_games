# D04 — Live Warden warning footprint survives a stalled WebGL frame

Date: 11 November 2026. Status: **isolated implementation candidate; native and authentic-browser CI pending; NOT sample-synchronized, not realism accepted**.

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324`. Only D04 public visual stage and D04 foundation tests changed. Never merge main or Draft PR #49, and do not modify authoritative `games/ai-dungeon/src`, camera, rigs, global lighting or other sessions' branches.

## Dominant acceptance issue

The preceding genuine Chrome/Three.js playback [43085923288](https://github.com/my-edutu/Ai_games/actions/runs/43085923288) recorded 35 real renderer acknowledgements, 36 planned cues, 29 expired cues, four visual admissions and **zero** foley admissions/source starts. Two stale visual receipt intervals were about 917ms and 3303ms. A separate D04 patch now retires stale hit fragments after slow submission; it does not restore missing true danger markers.

In the D04 visual stage, **all** slots originally consumed the actual observed WebGL interval before testing warning liveness. An authenticated Warden cell marker with a 300ms presentation recipe therefore expired during an otherwise active 700ms software-WebGL frame. The danger floor could go visually silent even though the latest public snapshot still identified the same attack tick, shape, unique living Warden and complete footprint.

This is not an excuse to prolong stale combat audio, fake hit contact, infer an attacker or invent a telegraph. A genuine live public warning has different semantics from a one-shot hit fragment.

## Test-first contracts

Commit `928312c4922534ed9a89e22ec5397441016e41de` extends `tests/foundation/dungeon-d04-stale-submission-visual-retirement.test.cjs` with two focused contracts:
- Given an **actual matching** Warden NOVA public warning, including unique living owner, attack tick 14, three/two-beat horizons and exact canonical footprint, a 300ms warning remains in the same two retained instances through twelve 700ms renderer stalls. A subsequent public release (tick 14, warning false) retires both markers on the next update. The 7-pool/104-slot budget stays intact. An expired audio deadline never revokes the live hazard.
- Given a missing/unverifiable current snapshot, the same warning is retired fail-closed; in an injected/standalone renderer **without** a live authority adapter, the original bounded 300ms visual lifetime remains in effect.

The test commit was written before the implementation. GitHub Actions queue/concurrency meant an independently witnessed red run was **not confirmed**; do not assert red-green verification yet.

## D04-only implementation

Commit `fa711ae366e8885f2d4328ba86218660db8520f9` modifies `public/ai-dungeon/physical-feedback-visuals.js` only:
- Check the current authority **before** expiring a signal marker, using the already implemented `isLiveWardenWarning` verifier (scene/run/floor/tick, sole living owner, exact shape, complete footprint and imminent attack).
- While provably live, freeze the **existing retained** marker's visual age at 35% of its bounded recipe. This prevents invisible end-of-life scale and repeated zero-age strobing. The same fixed instanced geometry is reused; no new ring, mesh, source, draw call, state authority or timing origin is introduced.
- If the latest authority changes, remove the marker immediately, upload its existing hidden matrix and account for invalid-warning retirement. Without an authority adapter, keep the old finite lifetime and never grant an unverified extension.
- Sample the current warning once per retained cue group, not once per danger cell. Warden release and newer warning retirement still take precedence. The previous stale-frame audio/ghost-hit retirement is unchanged.

The change does **not** touch the controller's 400ms audio staleness threshold, WebAudio opt-in/mute, voice counts, source-start audit, reduced-flash/motion, deduplication, arena transforms, authored rigs, camera or lighting. It does not make an audible sample synchronized merely because a visible marker persists.

## Evidence and verification boundaries

- **Observed before this patch:** genuine 800×500 Chrome gameplay and later real WebGL/Opus coexistence; genuine desktop/mobile screenshots; recorded source-start limitations. Older artifacts are not proof that this patch renders correctly or improves warning readability.
- **Added this run:** two narrowly scoped native test contracts and a code fix on the isolated D04 branch.
- **Not verified at handoff:** full native suite and build at `fa711ae`, fresh authentic Chrome playback, actual GPU-visible warning retention, decoded original combat sample onset, same-seed three-direction desktop/390px moving comparisons, complete Warden sequence, real sword blade-tip contact, miss/block/dodge/projectile/spell samples, recovery and 20-minute soak.
- **Outstanding risk:** keeping a marker alive across a long paused same-tick snapshot is intentional only while the authenticated public warning remains unchanged; it must be independently visually judged for clutter in real movement. This is NOT a default-spectator change.

CI candidate: [D04 GitHub Actions run 43095565330](https://github.com/my-edutu/Ai_games/actions/runs/43095565330). At the time of submitting this handoff, the run had been queued and there is no verified green/red result.

## Review, rollout and rollback

Specification review: authority-first warning lifetime respects the original hazard cells; audio deadline and hit causality stay conservative, with no identity guess. Engineering review: fixed GPU instance cap is retained, snapshot verification is bounded by the existing max eight signal slots, and invalid public warnings fail closed. Runtime performance/visual judgment remain open.

Revert the scoped visual implementation and the two new foundation tests if authentic browser behavior regresses. Legacy `/dungeon` remains default and unchanged; D04 is restricted to `?feedback=d04` pending final integration review. **Acceptance remains IN PROGRESS.**
