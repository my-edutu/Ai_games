# D04 — Strict original block and observed-dodge foley admission (14 November 2026)

**Status:** isolated, test-first code committed. Native GREEN and browser acceptance **unverified** at this handoff. The complete D04 realism transformation is **not accepted**.

## Bounds and source inspection

- Repo: my-edutu/Ai_games; isolated branch feat/dungeon-d04-combat-feedback-realism-20261108.
- Started from commit 0dbb6f257e2e34180f0d8a2dc1643d8787e6c29e; frozen BEFORE remains 281735d0910c6b2443648af976003d50412ee324 (comparison only).
- Read AGENTS.md, docs/handoffs/D04_Real_3D_Preview_Acceptance.md, D04 planner, original sound engine, frame gate and prior output-clock handoff; reviewed skills/game-audio/SKILL.md, skills/game-feel-vfx/SKILL.md and skills/simulation-qa/SKILL.md.
- The shared coding tunnel was offline (Tunnel-client has not been seen for 300 seconds). GitHub remained accessible through its connected GitHub tool. No local browser or full native build ran this increment.

## Specific source-level flaw

The public planner distinguishes a neutral, anonymous block event from a unique guarded HP-loss defender and requires a one-cell action/event witness for evade. But D04's strict original foley gate checked canonical IDs for sword/HP/release/owned Warden warnings **not for block or evade**. A malformed object with audio='block' or audio='evade' could therefore schedule material sound even in requireVerifiedContact mode. This is a **defense-in-depth sound-causality defect in inspected source**, not a misfire proven in prior video.

## Implemented test-first increment

1. [Test-only commit 0d166d5](https://github.com/my-edutu/Ai_games/commit/0d166d51cabed008a27c0ae34b0c8d9b3f29a3f4) adds real-planner positive examples for anonymous block, uniquely guarded HP-loss block and observed one-cell dodge, plus negative mutated actor/proof/target/position/ID cases. Invalid cues must schedule **no** source, consume **no** confirmed-event ID and create **no** live voice.
2. [Source commit 525dc4f](https://github.com/my-edutu/Ai_games/commit/525dc4f9f3e08a0c9c2f7299eae83399cef575e1) adds two bounded stateless semantic validators and makes block/evade subject to strict canonical event identity before WebAudio scheduling. Anonymous block remains anonymous; witnessed body block keeps only a uniquely identified defender, **never the attacker**; dodge requires exactly one orthogonal cell of movement.
3. Branch comparison against prior head includes **only** tests/foundation/dungeon-physical-feedback-d04.test.cjs and public/ai-dungeon/original-combat-foley.js for this source/test increment. No change to authority, games/ai-dungeon/src, rigs, camera, global lighting, main, Draft PR #49 or other branches.

## Verification and remaining evidence

- This is **test-first by commit order**. A completed RED CI run was not obtainable with the available GitHub connector: its commit workflow lookup filters PR-triggered runs while this workflow uses branch push triggers. Do not claim that the expected RED was executed.
- Native rerun commands: node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs, then the three documented D04 foundation suites, npm run build.
- The latest previously completed [genuine Chrome Actions run 43588302506](https://github.com/my-edutu/Ai_games/actions/runs/43588302506) had a successful contracts/build job but failed strict real preview with AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED. Live-comparison phase samples included 2,311ms desktop and 3,435ms mobile renderer calls, with near-zero D04 visual advance. This **does not prove** D04 caused the stalls.
- No new same-viewpoint WebM+PCM audio alignment, three-viewpoint desktop/390px mobile clips, full Warden warning/release/recovery/earned-counter sequence, verified miss/block/dodge/projectile/spell/HP-hit moving comparison, or 20-minute soak is certified by this increment.
- Inspect actual completed Actions results from both source/test pushes before calling the new contracts green or browser accepted.

## Budgets, review and rollback

- Two constant-time authorizer checks at sound admission only. No audio generators, voices, effect emitters, GPU draws, timers, event queues, output buffers, listeners, or retained state added. Existing eight-voice cap, 13,440-sample mono seeded texture, seven VFX pools, 32 pending/32 awaiting/64 receipts, WebAudio fresh-gesture opt-in/mute, reduced flash/motion, cleanup, dedupe and 400ms submitted-frame deadline remain unchanged.
- Specification review: block/dodge sound authorization now matches the public planner's semantics and immutable event ID; no swing-as-contact or invented attacker.
- Quality review: prevents unsupported sound; it does **not** make sword hits visually realistic or resolve multi-second renderer stalls.
- Rollback only the D04 source commit if an authentic public block/dodge cue is rejected; retain regression to expose a mismatch. Legacy remains the default; D04 is opt-in only via ?feedback=d04.

**Next dominant problem:** complete real browser A/V and stall attribution, then check remaining neutral event-sound classes (interrupt, recovery, counter, generic threat, utility) for the same strict origin vulnerability. Never soften the 400ms clock to manufacture late impact audio.
