# D04 — Same-tick shield and evasion visual liveness (13 November 2026)

**Status: independently reviewable D04-only correctness increment; NOT authentic physical-combat realism acceptance.**

- Branch: \`feat/dungeon-d04-combat-feedback-realism-20261108\`.
- Frozen BEFORE comparison: \`281735d0910c6b2443648af976003d50412ee324\`.
- Starting branch head: \`145654d75a3b2a9f0ab6c4912a9c128d5598f158\`.
- Test-first red commit: \`d7be116dfb6ea5dd3afe9b84a6d34168fd614eaa\`; [red Actions 43391622900](https://github.com/my-edutu/Ai_games/actions/runs/43391622900).
- Production correction: \`2cc8be04ff771a6c5747fecf8e219745dbfbd8a5\`; [corrected Actions 43391836143](https://github.com/my-edutu/Ai_games/actions/runs/43391836143).
- Normal spectator remains default; only \`?feedback=d04\` may use this effect path. No merge, main or PR #49 modification.

## Defect witnessed in source and native red test

The D04 read-only planner correctly required a unique same-tick guarded HP loss for localized block art and a semantically witnessed legal one-cell escape for dodge grit. But when a planned cue waited for the next visual pass, \`physical-feedback-visuals.js::emit\` accepted the proof string and coordinates **without checking whether the current public snapshot still described that pose**. An already-finished tick-11 sidestep could therefore paint grit on tick 12; a stale block might appear on a defender who was no longer guarding. This is a controller/renderer code-path defect demonstrated by native test, **not proven from previous real Dungeon WebMs**.

The new test first failed exactly \`an old move cannot emit delayed dodge grit\` (\`true !== false\`): **272/273 native contracts passed, one expected failure**. It then exercises wrong destination, changed action, stale block, wrong guard tick, and timely same-tick positive cases.

## Implemented correction and ownership

A read-only, bounded \`transientBodyStillWitnessed(cue,type)\` gate rechecks the latest public snapshot at visual admission for exactly the attempted cue's \`run:floor\`, **the exact event tick**, one identified party body in the existing 96-unit public action window, and a legal source/destination. Shield art requires current \`guard\` with matching \`actionTick\`, \`guardTick\`, and defender cell; evade grit requires a living current \`move\` with matching \`actionTick\` and destination. Absent, contradictory, duplicated, or throwing public snapshot evidence fails closed. It never infers an attacker, and it cannot convert a missed swing into HP injury. Planner-only/injected visual adapters without a snapshot getter retain their original validated-cue behavior.

- Touched files: \`tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs\`, \`public/ai-dungeon/physical-feedback-visuals.js\`, this handoff.
- No changes under \`games/ai-dungeon/src\`, app renderer, rigs, camera, lighting, audio buffers, global gameplay or other session branches.
- No new meshes, draw calls, effect pools, GPU instance slots, WebAudio voices, nodes, noise assets, timers, receipts or queue capacity. The check performs up to 96 read-only unit comparisons **only for block/dust emission**, not on every render frame.
- The seven retained pools / 102 reserved instances, at most seven D04 draw calls, 8-voice cap, 32/32/64 bounded queues and receipts, original 400ms audio deadline, gesture opt-in, mute preference, reduced-motion/flash, deduplication, scene cleanup and WebGL receipt rules remain under existing tests.
- Deterministic game execution, replay checksums and versioned saves are unaffected: no authoritative state is modified.

## Proportional verification and limits

The corrected [Actions 43391836143](https://github.com/my-edutu/Ai_games/actions/runs/43391836143) completed **273/273 native tests and a passing production build**. Its genuine Chrome \`real-preview\` job was queued at handoff drafting: do not claim its result, decoded audiovisual sync or moving-contact acceptance without inspecting the completed browser artifact. Standalone contracts are not a real-frame presentation result.

Older actual Dungeon browser evidence remains a known rejection: HP-impact visual frames can be delayed well beyond 400ms by intermittent multi-second software-WebGL submissions, including stalls also seen in legacy. An independently inspected earlier original browser desktop WebM contained 11 decoded VP8 frames (max interval 3.063s) at 587x339; the 390px-mobile WebM contained 10 (3.375s) at 386x517. Each had original Opus audio, **not sample-verified impact alignment**. These clips predate this correction and are not accepted matched before/after comparisons.

## Specification and engineering reviews

**Specification:** reject late faux shield/footstep positioning; preserve authentic same-tick block/escape visual when the public body is still present. Invalid public evidence must not be repaired by parsing event prose or selecting another actor. No change to ambient or original procedural foley behavior.

**Quality:** the per-cue snapshot scan is bounded by the existing public action visibility window, with duplicate identities failing closed. No extra per-frame work when no block/dust admission. A potential trade-off is losing a late localized cue when the snapshot changes before its first drawable frame. That is intentional: showing a false delayed pose would be worse than omitting art, and normal no-visual original audio still follows its independent causal and submission gates.

**Rollback:** revert \`2cc8be04f\` on this isolated D04 branch alone; leave the red regression visible for review. No special migration or default-route toggle is required.

## Next independently measured blocker

The dominant genuinely observable remaining defect is **multi-second software-WebGL submission during continuous real Dungeon combat**, especially first confirmed HP loss. D04 must not stretch its 400ms contact-sound deadline to disguise that. Still unaccepted: matched same-authority 3-viewpoint desktop 1440x900 and 390x844 moving footage; actual sword miss/contact, block, dodge, projectile, spell, interrupt, Warden warning/release/recovery/earned counter/defeat/restart; decoded original PCM/Opus onset aligned to real submitted video frames; reduced-motion/mute/reload and WebGL recovery; and a 20-minute resource cleanup soak.
