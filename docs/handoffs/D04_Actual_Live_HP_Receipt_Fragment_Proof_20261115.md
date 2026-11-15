# D04 — Live public HP receipt identity before physical injury fragments

**State: in progress, NOT visually/audio accepted.** Only `feat/dungeon-d04-combat-feedback-realism-20261108`; frozen comparison baseline `281735d0910c6b2443648af976003d50412ee324`. Legacy remains the default, `?feedback=d04` is explicitly opt-in. No main/PR #49, authoritative Dungeon source, rigs, camera or lighting changes.

## P1 defect isolated

An internally canonical HP-loss cue (victim-only, positive damage, coherent severity) could still create five retained injury fragments over a *same-run, same-floor, same-tick* live public victim whose real HP **did not match** the cue's purported post-injury HP. The existing visible/interpolated/unloaded victim branches checked identity, cell and actor-vs-public health, but did not cross-check the cue's `detail.remainingHp` or `detail.maxHp` against that same public victim. A contradictory public body therefore acquired false physical damage art. This is a D04 visual-authorisation defect, not proof of a faulty damage simulation or a cause of WebGL stalls.

## Two independent reviewable commits

1. [RED regression `03a1f74`](https://github.com/my-edutu/Ai_games/commit/03a1f74c73a06d4f058bd76fd0897573e8065120): twelve adversarial/positive variants covering the existing rendered body, body still interpolating within its own authoritative cell, and genuine unloaded model fallback; wrong live HP (including uninjured), mismatched max HP, legitimate HP. Strict production mode only. [Native RED workflow](https://github.com/my-edutu/Ai_games/actions/runs/43688398461) observed **366 pass / 1 intended fail**, where the uninjured rendered body was incorrectly accepted as an impact.
2. [Production correction `3eb0ab2`](https://github.com/my-edutu/Ai_games/commit/3eb0ab25e6b86f881ed10e43835b2f0e2729ec52): single bounded `matchesCurrentHpReceipt` read-only predicate used in all three existing public-victim verification branches, prior to visual pool allocation. It checks the cue's post-hit and max health against the **currently observed** unique victim. Non-production standalone visual auditions keep the pre-existing loose test mode. [Native GREEN and browser workflow](https://github.com/my-edutu/Ai_games/actions/runs/43688467240) confirmed **367/367 native contracts and production build passed**; genuine Chrome result must be checked independently.

## Resource, authority and rollout review

No new geometry, materials, visual pools, draw calls, WebAudio nodes, voices, procedural samples, random streams or physical damage. Seven pooled meshes, 102 reserved matrices, eight original sound voices, 32 queued effects, 32 frame-awaiting effects, 64 retained receipts and existing 400ms post-observation sound deadline unchanged. No new world contact or perpetrator claim. Consent/mute persistence, reduction modes, frame submission, scene cleanup and dedupe remain untouched. Spec review: the three emission paths now require consistent current public HP in strict production; quality review: the extra comparison uses an already traversed bounded public-victim witness, with no new scan or frame-clock read. Rollback: revert only the production correction if it rejects a genuine public HP state; retain the regression.

## Authentic media and outstanding acceptance

An earlier inspected real Chrome evidence bundle contains six VP8/Opus original recordings; its WebGL acceptance status is `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`, not an AV pass. Frame-acknowledged matched states are not realtime playback proof, controller receipt flags do not certify decoded contact pixels, and Opus track existence does not prove aligned audible impact. Those recordings precede this fix. The new-head genuine Chrome workflow was started; do not assign its result or score until complete.

**Next dominant weakness:** multi-second renderer submission stalls and particularly inconsistent 390px victim-impact visibility. Recompare native original VP8/Opus six-view clips against this head; align authentic impact frame and decoded PCM on a common clock. Complete the Warden warning/release/recovery/counter, miss, guard, dodge, arrow, spell, simultaneous ambiguous health loss, browser recovery, accessibility and 20-minute soak before any integration review.
