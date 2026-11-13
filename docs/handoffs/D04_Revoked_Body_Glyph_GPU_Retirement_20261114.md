# D04 — Revoked body glyph GPU retirement (14 November 2026)

**Decision:** narrowly scoped, branch-only rendering correctness correction; complete D04 audiovisual realism acceptance remains **NOT ACHIEVED**.

## Ownership and evidence baseline

- Repository `my-edutu/Ai_games`, only branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Work began at `9c98a48438e863e2fa35f2ea9a30d02d0d39d5e6`.
- Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324` does not contain the D04 visual renderer.
- Changes: `public/ai-dungeon/physical-feedback-visuals.js` and `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`; this handoff only. No game authority, default spectator, main, Draft PR #49, rigs, cameras, lighting, or other work branches.
- Legacy spectator stays default. Physical feedback remains explicitly opt-in with `?feedback=d04`.

## Defect and smallest correction

A real Warden release/cast may be emitted on a witnessed live body. If its visible actor leaves the original action before the next visual advance (interruption, death, unloaded or changed pose), the D04 signal loop already hid its instance matrix and retired the JS slot. It then took an early `continue` **without setting the retained pool dirty**. The shared InstancedMesh could remain `visible=true` and the hidden matrix could fail to reach GPU submission. A cancelled release/recovery/guard/utility glyph could persist as an orphaned draw while no valid action was drawable.

The early retirement now sets `dirty=true`, so the existing shared pool marks `instanceMatrix.needsUpdate=true`, recalculates `mesh.visible` from surviving live slots, and records one actual dirty pool. No extra buffer, pool, shader, geometry, audio voice, clock, random draw, API or gameplay rule was added.

## Test-first contract

- Test-first commit [`35ab187`](https://github.com/my-edutu/Ai_games/commit/35ab187d42db0de4139be408ac16055af68d680b): construct a genuinely anchored Warden cast, emit a release, simulate a previously submitted WebGL instance by clearing `needsUpdate`, interrupt its public pose, then require retired slot, zero active signal draw, a new hidden GPU matrix upload, a dirty pool and no drawable cue.
- Fix commit [`9a93f97`](https://github.com/my-edutu/Ai_games/commit/9a93f97fa0778b5cdd4640a064806be0264c2553).
- Automated regression command: `node --test tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`. Follow with the existing isolated D04 native suite and `npm run build`.
- **Execution truth:** original test-only GitHub Actions run [43524700431](https://github.com/my-edutu/Ai_games/actions/runs/43524700431) was **cancelled by the branch workflow's `cancel-in-progress` rule** when the corrective source commit arrived. Thus no executed RED result is claimed. Green and genuine browser outcomes for the corrected SHA must be checked independently in [run 43524815831](https://github.com/my-edutu/Ai_games/actions/runs/43524815831). This document does not claim a result before that job completes.

## Specification review and remaining gates

The fix is presentation-only: it cannot turn a swing into damage, create an attacker, infer contact, resurrect invalid warnings or override genuine danger cells. Live signals already passed the existing authority pose tests; cancellation now retires their actual GPU art. The seven retained pools, at most 104 reserved instances, at most seven draws, 32 frame-awaiting slots, eight generated foley voices, 400ms sound deadline, WebAudio consent/mute, reduced-motion/flash and deduplication remain unchanged.

The major previously observed rendering blocker remains multi-second CPU-side renderer calls, present in both legacy and D04 measurements. This one-flag upload correction does not prove a frame-time improvement. Last completed [genuine Chrome run 43517334222](https://github.com/my-edutu/Ai_games/actions/runs/43517334222) passed native contracts and five browser diagnostics but still failed strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Sparse existing video and independently observed WebAudio source starts cannot prove synchronous real impacts.

**Outstanding:** three matched moving camera directions in both 1440×900 and 390×844; authentic miss, block, dodge, ranger arrow, cultist spell, true HP contact and Warden warning/release/recovery/earned counter/defeat; extracted synchronized PCM; 20-minute pool/voice/scene cleanup soak; independent final integration review. No Diablo-IV parity or production-ready claim. Rollback is only this branch's single rendering fix.
