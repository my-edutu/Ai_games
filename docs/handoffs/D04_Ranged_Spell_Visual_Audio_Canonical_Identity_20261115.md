# D04 — Canonical ranged/spell visual–foley identity (15 November 2026)

Status: **test-first native correction verified on production-fix commit; genuine combat audiovisual acceptance NOT achieved**.

## Scope and provenance

- Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting checked head: `ac05450e6cdfbb4d96eb8b0ea8bd8d535e796638`.
- Frozen BEFORE comparison remains `281735d0910c6b2443648af976003d50412ee324`.
- Only `public/ai-dungeon/physical-feedback-visuals.js`, `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`, and this handoff are touched.
- Main, Draft PR #49, `games/ai-dungeon/src`, rigs, cameras, lighting, global renderer, and other session branches are explicitly out of scope.
- Normal spectator remains default. New renderer and original foley remain opt-in using `?feedback=d04`.

## Dominant observed weakness vs. tractable isolated correction

Authentic prior Dungeon Chromium clips across desktop and 390px mobile have sparse delivered video frames. The latest completed genuine browser evaluation inspected during this increment, [workflow 43734203734](https://github.com/my-edutu/Ai_games/actions/runs/43734203734), failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Six captured viewpoints and five shared real HP-loss ticks produced **zero HP-loss ticks universally confirmed drawable**. Renderer phases recorded up to approximately 3300ms desktop and 1931ms mobile in the continuous-mode comparison, while D04 visual time measured near 0ms on those worst frames. Those timings do not attribute the renderer stall to D04. No decoded contact/Opus sample-level synchronization is established.

The dominant observed presentation issue therefore remains **multi-second WebGL submission stalls**; fixing that broad renderer path is outside Session 4 ownership. This increment instead fixes a narrower, source-confirmed D04 causality error without weakening the 400ms deadline.

## Test-first defect and change

A verified ranged or spell cue could supply a plausible actor, action tick, grid cell, proof string and target, yet carry a noncanonical or contradictory cue ID. The original foley's `isCanonicalVerifiedCombatFoleyCue` already rejects that sound, but strict D04 VFX admission did not. A renamed/recycled target could therefore create **silent misleading arrow or orb art** that no sound-authentic event identity warranted.

- [RED regression commit](https://github.com/my-edutu/Ai_games/commit/5bfbcfc272efcb7331a12a4cda07de4a811d7f38) reproduced that gap. [RED CI](https://github.com/my-edutu/Ai_games/actions/runs/43739337809): 375 native tests passed; 1 focused expected failure (`true` visual admission instead of `false`).
- [Production correction](https://github.com/my-edutu/Ai_games/commit/06910ae49575b0eb00636153bcb9b36763be0e47) requires the same canonical source/tick/scene/aim ID for strict `projectile` and `spell` visual cues as original sound. This is a read-only rejection before allocation, not additional authority. [GREEN CI](https://github.com/my-edutu/Ai_games/actions/runs/43739452784) native job: **376 tests passed, 0 failed; production build passed**.
- [Additional spell/audition test](https://github.com/my-edutu/Ai_games/commit/06da30ba94fd1e030985177c6df4dcb0ced9ec3f) covers forged spell targets, correct original cast, and the intentionally permissive standalone visual audition. New-head native/browser [CI](https://github.com/my-edutu/Ai_games/actions/runs/43739589805) was pending at authorship, **not claimed green**.

A read-only cue remains a public action, not a collision. A successful arrow launch does not assert arrow impact, and a spell release does not assert HP loss. The new check does not create a target/attacker, change seeded simulation, adjust animation, or alter WebAudio schedules.

## Budgets, reproducibility and evidence labels

No geometry, material, GPU instance, WebAudio node, clock read, timer or unbounded cache was added. Preserved: seven retained pools/102 instances, seven-effect-draw ceiling, eight voices and one locally generated noise buffer, 32 pending effects, 32 awaiting-frame sound entries, 64 delivery receipts, WebAudio click/opt-in and mute persistence, reduced motion/flash, scene cleanup and the 400ms original frame deadline. Original sound uses locally generated seeded texture and oscillators, not borrowed samples.

Static foundation tests verify ingress, bounded counts and compatibility. They do **not** establish measured audio-onset latency or image realism. Older six-viewpoint VP8/Opus clips and frames are **genuine prior-branch Dungeon evidence**, not evidence that this new gate improves actual Chrome image/audio output. Standalone generated sounds are not synchronized gameplay evidence.

## Review gate and next blocker

1. Verify the latest 377-test native/build result and actual new-head Playwright verdict; do not borrow a prior-run pass.
2. Capture matched real moving desktop and 390px clips from cinematic, tactical and chase, same run/floor/tick/checksum; prove multiple real HP-loss submissions inside 400ms, and retain undecoded/decode-failed clips as unverified.
3. Isolate renderer stalls without modifying other sessions' ownership, and independently inspect original PCM onset against decoded contact frames; assess Warden warning/release/recovery/counter, real miss, guarded block, dodge, ranger, cultist, and 20-minute cleanup.
4. Require dedicated integration review before changing the legacy spectator default. No parity claim with Diablo IV or any unverified visual-quality score.

Rollback: revert the isolated strict release admission commit; standalone rehearsal adapters remain intentionally unchanged.
