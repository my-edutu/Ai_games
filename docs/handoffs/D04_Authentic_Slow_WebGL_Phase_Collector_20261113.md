# D04 — Authentic slow-WebGL phase collection and evidence validation

**13 November 2026 — isolated diagnostic increment, NOT realism acceptance.**

Repository: my-edutu/Ai_games. Branch: feat/dungeon-d04-combat-feedback-realism-20261108.
Starting head: d237eebcc807848cc62c294d065519e2c0d9c244.
Frozen comparison BEFORE: 281735d0910c6b2443648af976003d50412ee324 (read only).

## Observed failure and priority

D04's controller was already recording slow post-WebGL submission phases in a 32-entry ring, but the real matched legacy-versus-D04 browser comparison had no sampler or reporting for those measurements. Previous real Chrome reports saw multi-second stage and renderer outliers in BOTH modes, without proving a D04 cause.

Preceding completed browser run: https://github.com/my-edutu/Ai_games/actions/runs/43431256352
Contracts/build passed; five browser diagnostics passed and strict genuine-impact acceptance failed AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED. Two older real game WebMs with original Opus contain 11 desktop / 10 mobile decoded video frames, maximum gaps 3.063s / 3.375s, and cannot prove synchronized contact/audio.

## Change set — evidence only, no gameplay edits

1. tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs: two test-first cases covering a 150ms frame with 20ms D04 visual advance, 105ms non-D04 remainder and 25ms renderer call; repeated sampling, a second renderer-dominated frame, future frames and contradictory/unknown intervals.
2. tests/browser/dungeon-d04-continuous-mode-pair.cjs: verify and deduplicate bounded frame-phase records across genuine samples, report worst observed wall clock phase, count rejected/future records, and distinguish unavailable browser phase evidence from an observed absence of slow receipts.
3. tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs: transport read-only controller phase counters and no more than 32 recent slow receipts per sample to real 1440×900 and 390×844 browser comparison and include the evidence summary in diagnostic console output.

No HP, attacker, sound, GPU pool or visual emission code changed. The browser's 80ms sampler may miss submitted frames. A WebGL renderer-call duration is not GPU-completion timing. None of the evidence certifies audible PCM onset or physical blade contact.

## Verification

RED: https://github.com/my-edutu/Ai_games/actions/runs/43439290598 — 278/280 tests passed, precisely two new phase-evidence regression contracts failed before implementation.
GREEN contracts/build: https://github.com/my-edutu/Ai_games/actions/runs/43439468584 — at commit eea7ec9ebf05144f8d4e030861733f8d4cc50639, 280/280 native contracts and production build passed. New real-preview Chrome run was queued at final inspection; no browser-pass claim.

## Review and next dominant task

Specification review: 7 retained visual pools, 102 effect instances, max 7 VFX draws, 8 foley voices, 32 pending, 32 awaiting frame, 64 receipt cap, original 400ms deadline, audio click opt-in, mute persistence, reduced motion/flash, dedupe and run/floor cleanup are untouched. Legacy /dungeon remains the default; D04 requires ?feedback=d04. No edits to main, PR #49, games/ai-dungeon/src, rigs, camera, lighting or other branches.

Quality review: the new diagnostics close a provenance gap but do not optimize slow frames. A measured D04 visual-advance bottleneck may justify a D04-only optimization; renderer or unrelated pre-render stalls need diagnosis with the owning sessions, not unauthorized edits.

Outstanding: matched three-viewpoint moving clips, real Warden warning/release/recovery/counter, miss, block, dodge, arrow, spell, HP injury, decoded sample-aligned original audio and a 20-minute resource/cleanup soak. The strict acceptance failure must not be weakened to make CI green.

Rollback: revert this browser-evidence collector/classifier on this isolated branch if it adds unacceptable observer overhead or invalid data; preserve the red-first tests for audit.
