# D04 — Live-source frame gate for unmatched attempt foley (14 November 2026)

**Status:** test-first implementation GREEN 345/345; production build passed; real audiovisual acceptance NOT ACHIEVED.

## Scope and inspection

- Starting branch head: 95317a0b5fd1ff0338c5fce59a6d334fb958f536. Isolated branch: feat/dungeon-d04-combat-feedback-realism-20261108.
- Read AGENTS.md, D04_Real_3D_Preview_Acceptance.md, relevant game-audio/game-feel-vfx/performance-optimization/simulation-qa skills and D04 planner, visual stage, controller, and foley engine.
- Frozen BEFORE 281735d0910c6b2443648af976003d50412ee324 contains public/ai-dungeon/app.js but not the new D04 original-combat-foley.js; no invented BEFORE clip or quality score.
- Only two opt-in D04 source modules and their two native foundation tests changed; no authoritative games/ai-dungeon/src, main, PR #49, character rigs, camera, global lighting or other branches.

## Observed defect

Prior strict original-foley authorization verified the canonical IDs of ranged-unmatched and cast-unmatched cues. But unmatched attempts intentionally have NO visual release mesh, and controller did not check their current physical sources. A revoked ranger draw or cultist/mystic dry cast could therefore play original action sound from an unloaded, dead, moved or idle performer as long as it remained within the existing frame deadline. The sound would not prove damage, but its source/body relationship was false.

## Implemented fix

1. A read-only hasAuthenticatedSourceOnlyAction(cue) witness on the D04 visual stage verifies source-only cue semantics, unmatched neutral target, exact event ID and scene/tick; unique current public actor within 256, matching alive legal ranger/caster action and location; and matching visible rendered body. No visual, audio or authoritative state is allocated by the witness.
2. The opt-in, submitted-frame controller rejects unanchored source-only sounds at admission, recording an explicit refusal receipt.
3. The controller independently rechecks the source at the genuine submitted WebGL frame, revoking a dry cue if an action or body changed after admission. A genuine unmatched arrow/spell attempt may still sound, NEVER an HP impact, invented target or confirmed projectile hit.
4. Existing frame deadline, priorities, deduplication, opt-in, mute persistence, reduced-motion/flash behavior and cleanup are unchanged.

## Test-first CI evidence

- RED one new controller test: [CI 43619689488](https://github.com/my-edutu/Ai_games/actions/runs/43619689488), 343 passing / 1 expected failure of 344.
- RED both new contracts: [CI 43619741021](https://github.com/my-edutu/Ai_games/actions/runs/43619741021), 343 passing / 2 expected failures of 345.
- Intermediate visual-stage fix: [CI 43619833156](https://github.com/my-edutu/Ai_games/actions/runs/43619833156), 344 passing / 1 expected controller failure.
- GREEN controller + visual source fix: [CI 43619889173](https://github.com/my-edutu/Ai_games/actions/runs/43619889173), 345 native tests passed, 0 failed; production npm run build passed. Chrome real-preview runs separately and is NOT a presumed audiovisual pass.
- Tests derive real unmatched ranger/cultist actions using the existing public planner and verify both revocation boundaries plus live-positive attempts; separate real visual-stage witness tests cover changed tick/run, duplicate IDs, death, movement, idle, model invisibility, spoofed target and source cell. Neither fake WebAudio nor unit tests prove audible PCM sync.

## Genuine browser status and next blocker

- Last completed genuine Chrome baseline, [CI 43613908337](https://github.com/my-edutu/Ai_games/actions/runs/43613908337), passed five real-WebGL diagnostics but strict original HP-impact preview failed AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED.
- Its slow genuine submission receipts included a desktop 2264ms renderer phase and a mobile 1792ms renderer phase. Similar stalls occurred in the legacy path; attribution to D04 is not established.
- Existing decoded desktop/390px mobile source captures are sparse moving-game VP8/Opus recordings, NOT 3 matched camera-view clips or independently aligned audible PCM. Current browser replay on the new fix must be checked on its own merits.
- **Unmet:** three-viewpoint same-seed/tick/checksum footage; desktop and 390px mobile Warden warning/release/recovery/counter/defeat, miss, block, dodge, projectile, spell and actual HP impact; original PCM-to-frame onset alignment, reduced accessibility/mute/reload, and 20-minute bounded cleanup soak.

## Invariants, rollout, rollback

- D04 remains available only at ?feedback=d04; ordinary Dungeon stays legacy. No merges.
- Seven retained VFX pools, <=104 reserved instances and <=7 new draw calls; <=8 foley voices, one 13440-sample mono procedural buffer, 32 pending / 32 awaiting-frame / 64 receipt caps, existing cue dedup and 400ms deadline retained.
- No licensed third-party sound, hidden attacker, gameplay authority, randomness, character or camera changes. The extra unique-public-source scan is bounded per attempted dry sound, not idle-frame work. Browser profiling is still needed.
- Specification review: dry audio requires evidence of a real live action emitter; unmatched attacks remain non-contact. Quality review: improves causality only; no new claim about perceptual 3D fidelity or improved WebGL performance.
- Roll back only this isolated source/visual witness pair and their tests if genuine gameplay regression demonstrates necessity. Next priority: independently explain renderer stalls before changing D04 timing, while preserving genuine-frame and 400ms fail-closed behavior.
