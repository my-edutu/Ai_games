# D04 — Verified victim injury chip visibility (2026-11-16)

**Status: INCREMENTAL D04-ONLY EXPERIMENT. NOT REAL-BROWSER VISUALLY ACCEPTED.**

## Observed problem and deliberately narrow correction

The earlier genuine six-viewpoint Dungeon recordings from workflow
[43797050087](https://github.com/my-edutu/Ai_games/actions/runs/43797050087)
cover cinematic/tactical/chase views at 1440×900 and 390×844, with actual
seeded authority and original opted-in WebAudio. Five HP-loss ticks were shared,
but zero injury ticks had *universally confirmed drawable visuals* across all
six views. The browser log also reported WebGL renderer intervals above four
seconds on some frames; D04 visual work was much smaller. This does not prove
that every missing injury was occluded, nor does it establish original PCM sync.

Inspection of D04's *actual source* exposed a separate within-ownership
visibility risk: all 4–6 tiny, depth-tested verified injury tetrahedra began at
the exact same point in the drawn victim's chest, where its model can occlude
them. Their distinct seeded velocities spread only *after* admission, and a
slow or single first submission may show no injury. This is a **source-level
presentation defect**, not an experimentally proven cause of the larger renderer
stalls.

## Test-first isolated improvement

1. A new native test was committed first:
   [7a2bf9c](https://github.com/my-edutu/Ai_games/commit/7a2bf9c235941f2f945e57536b785087c9c91677).
   GitHub Actions [43803078794](https://github.com/my-edutu/Ai_games/actions/runs/43803078794)
   reproduced the intended RED: **396 pass / 1 fail** with the new specific
   failure `chips must start just outside the torso`.
2. The production correction:
   [43b78ff](https://github.com/my-edutu/Ai_games/commit/43b78ff8b1b2614732dc90be122b8efde9c129bf)
   preserves one exact authenticated body-centre chip and positions the
   remaining 3–5 chips in an even, seeded, 0.31-metre-radius torso shell
   (height offsets within 0.1m), with symmetric outward micro-drift.
   The source carries **no attacker vector, inferred weapon direction,
   contact inference or camera-view adaptation**. The same canonical
   HP-only victim/scene/tick checks execute before any allocation.
3. The test also protects fixed 102-instance budget, single hit draw
   call, deterministic reset, no stale injury and preservation of the
   original root-local anchor. All existing sound and accessibility
   paths remain unchanged.
4. Corrected code was pushed and automatically queued for native/build/real
   Chrome verification in [43803417842](https://github.com/my-edutu/Ai_games/actions/runs/43803417842).
   Its outcome must be inspected independently; this document does **not**
   assert GREEN or genuine video improvement until recorded by that run.

## Limits and acceptance

The geometry correction does not address the dominant **multi-second WebGL
submission** obstruction. It does not establish that the shell protrudes
beyond every original GLB's actual armor geometry, nor do source-level tests
establish a physically credible strike. Genuine before/after moving video
must verify each of three viewpoints at desktop and 390px mobile with the
same seed, run, floor, tick and checksum; inspect actual per-frame injury
readability and original decoded PCM contact onset against the post-WebGL
submission clock, not just action receipts.

Remaining unaccepted cases: genuine missed swing with no false impact,
block, one-cell dodge, ranger projectile, cultist spell, ambiguous
simultaneous threats, Warden warning/release/recovery/earned counter,
victory/restart, reduced motion/flash, consent/mute/reload, WebGL loss and
recovery, 20-minute pool/audio cleanup soak and independent blind
before/after critique.

## Isolation and rollback

The two implementation commits changed only
`tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` and
`public/ai-dungeon/physical-feedback-visuals.js`. No authority,
`games/ai-dungeon/src`, character rig, camera, global lighting, main,
PR #49, other session branch, VFX pool, new WebAudio asset, deadline or
spectator default changed.

Roll back the production shell commit if corrected-head browser movement
shows detached or unconvincing floating debris; retain the test as a
candidate acceptance constraint pending dedicated visual review.
The legacy spectator is still default; this remains opt-in
`/dungeon?feedback=d04` and is not production-ready.
