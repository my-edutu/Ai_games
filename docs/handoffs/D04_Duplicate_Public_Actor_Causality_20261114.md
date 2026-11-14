# D04 — Reject duplicated public actor IDs before physical combat feedback (14 November 2026)

**Status:** isolated implementation committed; new native/build and real-game verdict pending. This is a source-confirmed causal-correctness repair, **not** verified moving-contact realism or a completed A/V acceptance.

- Repository: `my-edutu/Ai_games`.
- Allowed branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting verified branch head: `74940a23be8897d50c662b7be00fcd3b845e8bb8`.
- Frozen BEFORE baseline: `281735d0910c6b2443648af976003d50412ee324`.
- Legacy `/dungeon` remains default, D04 only on `?feedback=d04`.
- Do not merge to main / Draft PR #49 or alter `games/ai-dungeon/src/**`, character rigs, camera, lighting or other-session branches.

## Selected realism defect and source proof

The D04 planner indexed up to 256 previous and current public units into JavaScript Maps, where duplicate IDs silently overwrite earlier bodies. When either snapshot contains multiple bodies with an identical ID, an apparent HP drop can be calculated from the wrong body and can emit a false `damage` / `damage-fatal` impact. Two simultaneously observed actors with the same ID could also authorize an arbitrary `swing` source. Neither anonymous events nor a legal aim resolver can recover that missing identity proof.

This defect was identified by source inspection and new deterministic contracts. It was **not identified by a specific frame** in historical browser footage; the latter continues to show a separate, severe multi-second WebGL frame-delivery problem.

## Test-first contracts, correction and bounds

1. [Test-first commit 102716c7](https://github.com/my-edutu/Ai_games/commit/102716c7a6451b58db634afaf4a5db1a45c6abf8) added a D04 foundation regression for duplicated prior HP, duplicated current victim/action, snapshot immutability, and preservation of a distinct genuine victim/single sword source. Its first [Actions run 43549997760](https://github.com/my-edutu/Ai_games/actions/runs/43549997760) was queued and subsequently cancelled by the workflow's push-concurrency rule; **there is no verified failing-test execution**. Source-level expected failure is clear but must not be reported as measured RED CI.
2. [Implementation commit c1f65e1](https://github.com/my-edutu/Ai_games/commit/c1f65e15320d0ed96732b22bf3c89ce1adebaea5) builds the same bounded 256-unit prior/current read-only indexes but **removes IDs that occur more than once** in a snapshot. HP comparisons, newly observed actor actions, body-anchored block attribution and uniquely owned Warden warnings/openings/counters require their respective unique witnesses. Unrelated legitimate damage remains eligible. No text can invent a perpetrator.
3. [Implementation workflow 43550105604](https://github.com/my-edutu/Ai_games/actions/runs/43550105604) runs the existing D04 native contracts and production build, then the real Chrome opt-in preview when the contract job succeeds. At handoff creation its result was not yet available: **native GREEN, build and browser A/V remain UNVERIFIED for this increment**.

A separate **direct V8 source-level red/green probe** evaluated the exact GitHub planner content from both `74940a2` and `c1f65e1` after stripping its ES-module import/export declarations and stubbing the unused evasion helper. The old code produced a false `damage:revenant` for a duplicate prior ID and a false `damage:revenant` plus `swing` for duplicate current IDs; the new code retained only genuine unrelated `damage:vanguard` and preserved uniquely witnessed `damage:revenant` plus `swing`. A further 31 deterministic V8 assertions passed (six previous-order permutations, 24 current-order permutations and one skipped-tick suppression). **This is a useful executed source-level probe, not a Node native-suite result, browser/WebGL playback or sample-synchronized A/V test.**

The additional identity filtering is bounded to the existing first 256 units, with one temporary duplicate-ID Set per existing Map. The 96-unit pose/action scan, 18-injury/24-total cue limits, 7 retained visual pools, 104-or-fewer reserved instances, 7-draw-call cap, 8-voice cap, 32 pending/awaiting and 64 receipt limits remain unchanged. No new renderers, audio sources, models, assets or licensing were introduced. WebAudio click consent, mute persistence, 400ms verified-frame deadline, reduced motion/flash, deduplication, reset and frame acknowledgments are untouched. No authority state or replay version changed.

**Limit:** if malformed public identities occur beyond the bounded 256-unit observation window, this patch cannot detect them. That is not permission to emit unbounded or speculative contacts.

## Real-browser evidence boundary

The latest completed pre-patch Chrome [run 43544493167](https://github.com/my-edutu/Ai_games/actions/runs/43544493167) again failed strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Its continuous 1440px phase evidence included 2343ms inside a renderer call (versus 0ms D04 visual advance in the worst sampled frame); the 390px worst recorded renderer call was 3313ms, likewise with 0ms D04 visual advance. Comparable legacy-mode tails were recorded, so this is *not* proof D04 caused the stalls. The job generated real WebGL/Opus recordings but its internal native-decoder check remained unavailable, not synchronized A/V evidence.

Earlier pre-patch Chrome [run 43538843846](https://github.com/my-edutu/Ai_games/actions/runs/43538843846) produced genuine Dungeon WebGL / Opus recordings. The prior independent decode notes 13 desktop and 19 390px mobile live-authority frames over ~13 seconds, with largest gaps 3.533s and 3.356s; the separate original A/V clips have maximum gaps of 4.445s desktop and 3.359s mobile. The previous strict acceptance remained `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` after a genuine damage cue expired as `stale-frame`. Sparse frames and unaligned encoded audio cannot verify contact-to-original-PCM synchronization. The new patch does **not** resolve those stalls. Legacy rendering has shown related stalls; D04-specific causation is unproven.

Still missing: matched frozen/preview moving sequences from three actual viewpoints at 1440x900 and 390x844; complete Warden warning/release/recovery/earned counter; real missed swing, block, dodge, projectile, spell, authentic HP impact; decoded original sound onset alignment; 20-minute soak/teardown; stall ownership diagnosis.

## Independent reviews and rollback

**Specification review:** a victim and a performing actor must each have a unique public identity before physically located presentation can be claimed. Anonymous event sounds may remain neutral. Never turn an attempted swing into contact proof. The invariant is deliberately stronger than picking array-first or array-last.

**Quality review:** no new pool, external dependency or authority mutation. Index memory is bounded but adds up to 256 temporary duplicate-ID entries on each snapshot. Source-order permutation cannot change whether a repeated ID is admissible. This is not a frame-rate optimization and must not be sold as one.

**Rollback:** revert implementation commit `c1f65e1` if needed, retaining the focused regression as a requirement for its replacement. No merge, deployment or default-route switch.

**Next dominant observable weakness:** multi-second genuine WebGL renderer-call stalls and the strict failure to admit timely visible HP effects. First obtain a completed Chrome report, then isolate the renderer phase without editing code owned by other sessions. Require true moving A/V evidence before declaring any visual transformation.
