# D04 — Remove orphaned WebGL trail draw after slot priority preemption (13 November 2026)

**Status:** branch-only correction; new test/build/browser verdict **not independently confirmed** at this handoff. Full combat realism acceptance remains **NOT ACHIEVED**.

## Scope and baseline

- Repo: `my-edutu/Ai_games`; only `feat/dungeon-d04-combat-feedback-realism-20261108`. Session head before this increment: `f047948cb320d8b9a23458a3f9bc5bbe33eef018`.
- Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`, where the new physical-feedback-visuals module does not yet exist.
- Only D04-owned `public/ai-dungeon/physical-feedback-visuals.js`, its existing foundation test, and this handoff change. No `games/ai-dungeon/src/**`, rigs, animation, camera, lighting, main, PR #49 or other branches.
- Legacy spectator remains default; D04 remains `?feedback=d04` only.

## Observable defect / correction

The retained trail pool supports eight instances and one InstancedMesh. One genuine measured authored wrist passage sets `mesh.visible=true`. A later higher-priority real action can replace precisely that measured slot. The newly allocated replacement trail correctly begins hidden until its **own** actual wrist displacement, but emission did not recalculate pool visibility for this preemption. If the remaining seven trails were unmeasured and therefore matrix-hidden, the mesh stayed visible and rendered an empty draw until its next dirty/retirement frame. This wastes a D04 WebGL submission and overstates `activeDrawCalls` despite **zero** drawable sword passages.

D04 emission now recomputes trail mesh visibility **only when a live trail slot is displaced**. The scan is hard-bounded to eight slots, reuses the existing pool/geometry, and never reinterprets an old whoosh as contact. Normal visible measured trail passage, sound, hit HP causality, scene and frame receipt policies are unchanged.

## Test-first contract and verification

- Test-first commit: `b3ba01b22f23f12924cee054ca5ff3719ca543c3`, extending the existing D04 foundation suite with priority-saturation, a measured real wrist passage, replacement with an unmeasured wrist, immediate no-draw expectation, and reactivation only after new measured movement.
- Correction: `56416dae76c5dd72a48fd82a6fd0e71a87715dc1`.
- Fixture follow-up: `78931dc6514b0d0e78b702e23043a16172778dec`, explicitly includes an authored asset root required by the production wrist selector.
- The already-configured isolated D04 Actions workflow includes `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` and production build. Required local command: `node --test tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` and `npm run build`.
- The coding tunnel was offline at this inspection and the isolated new push's CI result was not independently available through the connector. **Do not claim a confirmed RED/GREEN run, passing new test, measured draw-call reduction, or fresh Chrome playback.**

## Actual evidence and outstanding blockers

The previous completed authentic [Chrome run 43508873107](https://github.com/my-edutu/Ai_games/actions/runs/43508873107) passed the native/build job and failed strict real HP-impact admission with `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. This new trail-pool correction does not solve that HP case and should not be credited with a renderer speedup. Earlier genuine desktop and 390px mobile WebM contain sparse VP8 video/Opus audio, not matched sword-contact/PCM alignment. Independent inspection shows the real world and moving viewpoint, but not sufficient continuous motion for authenticity acceptance.

The dominant unresolved defect is multi-second CPU-side WebGL renderer calls that also occur in legacy mode. They must be attributed with matched, uncapped runtime measurement; do not weaken the 400ms sound deadline or alter another session's renderer, camera, characters or authority. Still needed: matched three-viewpoint desktop and 390px moving clips, Warden warning/release/recovery/earned counter, verified miss/block/dodge/projectile/spell/impact, decoded original sound-to-video alignment and 20-minute bounded-resource soak.

## Review

Specification: preempted measured sword strokes no longer authorize visible mesh admission for an unmeasured replacement. No new attacker/victim inference, audio consent, motion/flash, or authority change.

Engineering: strictly bounded eight-slot visibility check on preemption only; no extra pools, geometry, GPU meshes, audio voices, oscillator or timers. Rollback is a single branch-only code change if unforeseen GLB rendering differs. These static facts are not a browser performance benchmark.
