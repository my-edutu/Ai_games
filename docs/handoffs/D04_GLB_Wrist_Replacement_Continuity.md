# D04 — Do not stitch different GLB wrists into one sword trail

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Parent: `6328df62b3cf5cdc4199cee54cca63c734afd2e2`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

Status: **source-level fix, authentic Dungeon 3D/audio evidence unverified**.

## Defect (reproduced before code change)

The D04 read-only measured hand-trail retained only wrist position, root and yaw. When a GLB was replaced during the same authority attack, a new wrist at a different rest position could be joined to the previous rig's wrist. A 16ms detached V8 test of the exact fetched parent source emitted a ghost drawable trail; the stale ribbon could survive the additional 55ms grace interval. Neither a change of GLB nor a static replacement wrist is proof of sword motion or HP contact.

## Correction

A valid bone-sourced trail sample now retains the actual selected skinned wrist object's identity within its bounded per-cue visual slot. The measured path requires the same bone object in consecutive frames. Any switch immediately clears the old ribbon and its grace age; a replacement requires two fresh valid samples before showing or releasing its gated whoosh. Malformed/absent bones remain suppressed. Pure numeric legacy geometry tests remain supported; all production samples are provenance-bearing. This is **wrist** identity, not a verified physical blade-tip endpoint.

## Tests and evidence

Test-first detached V8 red/green using exact branch source: prior source showed the ribbon after swapping two valid right-wrist bones; corrected source states were **visible → suppressed on swap → visible after new-bone travel**, all at 16ms. Pure identity check rejected different bones, allowed the same one. The committed Node regression tests in `dungeon-measured-hand-trail-d04.test.cjs` and `dungeon-physical-feedback-realism-d04.test.cjs` cover both pure policy and mocked Three.js slot behavior. **Full native Node tests, build, CI and real Dungeon browser AV were NOT run** (coding tunnel offline). The detached mock is not genuine observed gameplay.

No new pool, geometry, draw call, buffer, source, authority input or character-rig modification: seven pools / 102 reserved VFX instances, eight audio voices and one original <=19,200-sample buffer remain bounded. D04 stays opt-in at `?feedback=d04`; the legacy spectator default stays intact. Reset/dispose drops retained bone references.

Acceptance remains blocked on real matched three-viewpoint desktop (1440×900) and 390px mobile clips, miss/block/dodge/arrow/spell/real HP damage, complete Warden warning/release/recovery/earned counter and defeat/restart, stream-bus PCM/frame correlation, reduced settings, recovery and 20-minute soak. No visual parity or synced-audio claim is made.

## Scope and rollback

Only `public/ai-dungeon/measured-weapon-trail.js`, `public/ai-dungeon/physical-feedback-visuals.js`, their dedicated tests and this handoff. No gameplay authority, rigs, camera, lighting, default spectator, main, PR #49 or other session branch. Revert this isolated commit if genuine recorded continuity regresses. Next dominant weakness: identify actual source GLB blade-tip attachment instead of a wrist proxy, then measure visible blade crossing against capture-bus audio on genuine moving Dungeon playback.
