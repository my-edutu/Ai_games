# D04 combat feedback: witnessed blocker and Warden counter anchors

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108` (isolated; no main/PR #49 writes)

## Reproduced defect

D04 planned an `opening` and an HP-proven `counter` using the Warden's `targetId/to`, but the visual stage requested the undefined `actorId/from` for all signal cues, discarding an earned counter effect. Public `block` events have neither an actor nor a destination; the original planner emitted unlocated blocks, so every blocking ring was silently suppressed. Event prose is intentionally untrusted.

## Correction

- An earned counter ring is now anchored to the public, HP-confirmed Warden victim, **not** an invented attacking hero; a cue without exact counter proof is refused.
- A block ring is anchored to a party defender only with exactly one same-tick `block` event, exactly one corroborating defender with `action=guard`, `guardTick=event.tick`, real HP decline and valid world coordinates. Otherwise the block stays sound-only and nameless. A fully absorbed blow is intentionally unlocated.
- Added direct red-green contract checks for unique guard, two guards, two events, uninjured guard, forged counter/block and reset cleanup. No authority, rig, camera, legacy default, audio engine or renderer work is modified.

## Verification

Local detached-source Node suite on the exact candidate modules: **27/27 passing**, following a reproduced expected red failure (and corrected invalid ambiguity fixture). The separate integration-contract test, catalogue build and full Playwright game path **were not executed**: shared code/browser tunnel unavailable, and the local candidate package lacks the entire game and GLB assets. Do not claim any genuine browser footage, 390px evaluation or frame/audio synchronization was collected this session.

## Performance / policy

Existing 7 retained pools / 104 reserved instances remain unchanged; no allocations, lights, draw calls, new sound samples or authoritative simulation writes added. The planner checks at most 96 public units and 96 scanned events per snapshot, and performs additional checks only when a real block event is present. Mute, audio opt-in, WebAudio voice budget, effect receipt and frame-submission contracts are untouched. Rollback: revert this single commit. Further blocker: three-view genuine Dungeon capture against frozen comparison `281735d0910c6b2443648af976003d50412ee324`; inspect hand/weapon path and impact acoustics in motion before acceptance.
