# D04 — Canonical victim-cell and positive HP evidence for original impact foley (14 November 2026)

**Status:** strict sound-causality change committed on the isolated D04 branch; test-first RED witnessed; GREEN and genuine browser A/V acceptance not assumed before completed jobs.

## Context and ownership

Repository: `my-edutu/Ai_games`. Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Started from the actual branch head `ca49c1920200f3b6585ec6d4e6c383951d02071a`, not the earlier initial reference. Read `AGENTS.md`, `D04_Real_3D_Preview_Acceptance.md`, and the game-audio, game-feel-vfx, performance and QA instructions. Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324` has the existing spectator `app.js`, not the new D04 procedural foley module.

Only the opt-in `public/ai-dungeon/original-combat-foley.js` and four D04-owned foundation test modules were touched. No main, PR #49, authority `games/ai-dungeon/src`, rigs, camera, lighting, or other sessions' branches were changed.

## Defect and correction

A canonical injury sound had previously been authorized by `kind + audio + verified + target ID + event ID + 'observed-hp-drop'`, without verifying that the supplied victim position, visual semantics, positive damage and severity agreed. A mutated cue retaining its plausible event ID could therefore start impact audio with `to: null`, no damage detail, impossible/zero damage, or a contradictory intensity. The original planner itself derives damage from adjacent public HP loss, but the independent sound admission boundary lacked a matching self-consistency check.

In strict mode, `coherentCanonicalHPFoleyEvidence` now requires **hit** visual, null source position, bounded victim cell, positive safe-integer damage, safe positive max HP, damage <= max HP, and severity equal to the observed damage fraction to numeric tolerance. Both ordinary and fatal real planner HP cues remain valid. No attacker attribution or new hit is created: this is defense in depth over cues already admitted by the actual public controller. Standalone/non-strict sound auditions retain their existing permissive timbre and polyphonic behavior.

A new foundation contract generates authentic HP transitions with the existing public planner and tests malformed position, visual, proof magnitude, health denominator and severity. Rejected sound must allocate no voice, consume no canonical cue history or verified damage onset. The three pre-existing strict foley identity/preemption fixture files were updated to include coherent positive HP metadata rather than downgrading the new boundary.

## Evidence, scope, and limits

- RED: [Actions 43624399274](https://github.com/my-edutu/Ai_games/actions/runs/43624399274) completed with **345 passed / 1 intentionally failing contract** out of 346. This verifies a genuine initial regression, not an audiovisual sample.
- Source and fixture commits: `dfa33bf` (RED test), `4bcfad6` (source), `1672092`, `37e03d2`, `5013ec3` (fixture alignment).
- Final GREEN workflow initiated at [Actions 43624557844](https://github.com/my-edutu/Ai_games/actions/runs/43624557844). At writing, its final native/build/browser result was **not yet established**. Inspect its completed jobs before making further claims.
- Prior genuine browser recordings contain VP8/Opus on desktop/mobile, but have sparse frames; desktop maximum gap 3.294s, 390px mobile 3.011s in a previously decoded recording. This evidence predates this correction and is **not** sample-synchronized proof for it.
- The preceding completed real-browser [Actions 43619889173](https://github.com/my-edutu/Ai_games/actions/runs/43619889173) reported five diagnostics passing, strict live damage receipt failing; a real renderer phase reached 3280ms in a sampled slow frame. That is a CPU call interval, not proof D04 caused slow GPU frame delivery. Some stalls also occur without D04. No current matched three-viewpoint playback or 20-minute soak was completed in this increment.

No change to 7 GPU pools, <=104 instances, <=7 effect draws, <=8 original voices, single 13,440-sample generated mono noise buffer, 32 pending / 32 awaiting frame / 64 receipts, audio opt-in/mute persistence, reduced motion/flash, scene cleanup, deduplication, or 400ms genuine-frame deadline. Source checks are constant-time per strict impact attempt and make no audio/GPU allocations on rejection.

**Specification review:** strict impact sound remains victim-only, no invented owner/contact; no legacy default changes. **Quality review:** this prevents false/orphaned sound metadata but does not improve measured animation, sample-onset alignment or WebGL frame latency. Standalone node tests are not actual browser PCM.

**Rollout:** opt-in `?feedback=d04` only. **Rollback:** revert the implementation and dependent fixture contract on this isolated branch if authentic public HP transitions are incorrectly silenced; never merge to main/PR #49 without D10 integration review.

## Next dominant blocker

Investigate genuine multi-second WebGL frame delivery with paired D04-on/off and desktop/390px viewport frame-phase records, classify render-call versus after-visual work without attribution from averages. Then collect three matched camera positions, identical authoritative tick/checksum, authentic missed sword, block, dodge, arrow, spell, real HP impact, and complete Warden warning/release/recovery/earned counter, with decoded original PCM onset, capture-chain consent/reload and 20-minute soak. Keep the original 400ms fail-closed sound gate; no guessed strike, late sound, or false game-quality rating.
