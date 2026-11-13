# D04 — Authenticated HP impact during one-cell body interpolation (13 November 2026)

**Status: test-first isolated correctness improvement; authentic audiovisual realism NOT accepted.**

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`; starting head `8e141c1b972bd20e36924f1d36cdc62e611a66e2`.
- Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324` (D04 implementation did not exist in this frozen milestone).
- Red regression: `146a24043c2f581764a4e70f82c8a85b540ce4c6`, [Actions 43398104172](https://github.com/my-edutu/Ai_games/actions/runs/43398104172). Test failed precisely because the witnessed HP impact was rejected while the body root lagged its own authoritative cell by 0.84m.
- Implementation: `de2de0e3971cc402f2e1591cced75f54e651c5bd`.
- Contract hardening: `98607d4cb453099f68d59eb53d8962faa3fa971c`, [Actions 43398457736](https://github.com/my-edutu/Ai_games/actions/runs/43398457736), **274/274 native contracts passed; production build passed**. Genuine Chrome job was still in progress at handoff and must not be treated as passing.

## Why the change matters

The existing strict actor sampler refuses an effect when the rendered body is more than 0.58m from its public tile. During a legal body interpolation, a real HP drop can coincide with the visible body still 0.84m behind its new cell. The prior `anchor()` then refused to use the authoritative injury cell because an actor object already existed. Thus a *genuine* HP loss could have no physical fragments even with a correctly emitted cue.

This is a **source/native-contract defect**, reproduced red-first; the older real Dungeon clips do **not** establish that this specific rejection caused the previously observed strict-browser failure. Multi-second shared WebGL stalls remain an independent, measured problem.

## Isolated code and evidence contract

Only the `hit` category, already requiring a planner-certified consecutive HP decrease, receives an additional body-local interpolation witness in `public/ai-dungeon/physical-feedback-visuals.js`. It admits a retained fragment at the **actual visible root**, not a guessed blade/contact point, when:

1. The current public snapshot still has the exact cue run/floor/tick and one matching victim identity in the existing bounded 256-unit HP observation window.
2. The current public victim has the exact target cell, HP, faction and kind of the rendered actor.
3. The actor remains visible, has a finite root position within 0.96m of its own current public tile and within 0.75m of ground height.

Missing, duplicated, stale, wrong-cell, recycled, far-away or throwing witnesses fail closed; no different actor may be selected. The original strict .58m rig sampling, all sword/ranged/utility/guard/evade/warden anchoring and the absent-actor fallback are unchanged.

The native regression verifies the interpolating positive case; actual first-instance matrix origin equals the visible body root (not the empty destination tile); and distant root, wrong actor, wrong cell, stale tick and duplicate identity are all rejected. It makes no claim of a real-frame pixel match or audible PCM alignment.

## Scope, budgets and safety

- Modified: `public/ai-dungeon/physical-feedback-visuals.js` and `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`, plus this handoff.
- Exactly seven retained visual pools and 102 reserved instance slots; no new geometry, draw calls, voices, WebAudio buffers, timers, queues, effects or gameplay state changes.
- The extra scan runs only on a failed strict victim anchor for an already HP-certified hit, not per idle frame. Maximum 256 public units.
- No inferred attacker, swing-to-hit promotion, invented contact direction or frame/Opus sample verification.
- No edits to `games/ai-dungeon/src`, main, Draft PR #49, cameras, rigs, global lighting, other branches or default spectator route.
- Existing gesture opt-in, persistent mute, reduced motion/flash, WebGL receipt gate, 400ms sound deadline, seven-pool/102-instance budget, 8-voice limit and scene cleanup are retained.

## Genuine media and next gate

Prior real Dungeon WebMs were inspected separately with `ffprobe`: desktop 587×339, VP8+Opus, 11 decoded frames and maximum 3.063s video gap; mobile 386×517, VP8+Opus, 10 decoded frames and maximum 3.375s gap. They predate this code and do not prove moving physical contact, original-sound synchronization or three-viewpoint acceptance.

The previously completed [Chrome job 43391836143](https://github.com/my-edutu/Ai_games/actions/runs/43391836143) passed five paired diagnostics but failed strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. New Chrome output must be inspected after completion; a passing native test or build cannot overturn that rejection.

**Next dominant observable weakness:** high, intermittent actual render-submission latency in both legacy and D04, which can exceed the fixed 400ms impact-audio deadline. Required: matched seed/run/floor/tick/checksum three-viewpoint 1440×900 and 390×844 moving capture, real miss/contact/block/dodge/projectile/spell/interrupt and full Warden warning-release-recovery-earned-counter-defeat-restart, decoded sample-to-frame alignment, WebGL loss/recovery, consent/mute/reload/reduced-motion and a twenty-minute cleanup soak.

**Roll back** implementation commit `de2de0e3971cc402f2e1591cced75f54e651c5bd` only on the isolated D04 branch if a real renderer regression is demonstrated; leave red tests visible for review. D04 remains opt-in via `?feedback=d04`; legacy remains default until final integration.
