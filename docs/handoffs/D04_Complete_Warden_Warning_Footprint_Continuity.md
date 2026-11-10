# D04 — Complete Warden warning footprint continuity

**Status:** isolated source improvement and adapted source-contract verification. Genuine Dungeon GLB-backed WebGL/WebAudio playback, multi-view footage, and production acceptance remain **UNVERIFIED**.

- Repo: `my-edutu/Ai_games`
- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Starting branch head: `369ad91b69ee83d6d4eaf813055a9fb1b122c5e4`
- Frozen BEFORE comparator: `281735d0910c6b2443648af976003d50412ee324`
- The normal `/dungeon` spectator remains unchanged. New feedback remains **opt-in `?feedback=d04`**. No main/PR #49 merge or authoritative gameplay change.

## Reproduced defect and physical stakes

The prior Warden warning lifecycle validated only the *at most eight* danger cells D04 painted. A revised public `bossWarning` could change one of the other actual threatened cells without changing the pattern, impact tick, owner, countdown, or any painted sample. The retained warning ring was then reported live and the pending sound could be released after a WebGL frame acknowledgement—even though that exact previously witnessed footprint was no longer authoritative. A public warning event does **not** itself authenticate an attacker or an unchanged strike region.

This was **source-reproduced**, not observed in an actual gameplay clip. A deterministic case with 24 real cells and eight sampled markers showed: old full-footprint proof missing, replaced non-rendered cell accepted, and one pending warning sound released (`decision: delivered`) after frame receipt.

## Test-first and change set

1. `1592910` — first committed `tests/foundation/dungeon-d04-warning-footprint-continuity.test.cjs` (three regression contracts). Proves revocation when a non-painted cell changes, stability when cell order/duplicates change, fail-closed forged/missing proof, and no sound on a revoked warning receipt. The first source-backed adapted V8 red reproduction demonstrated the defect before implementation.
2. `d1d5ea8` — `public/ai-dungeon/physical-feedback-plan.js` now stores a *lossless, bounded canonical key* of **all valid public warning cells** in owner-specific cues, alongside the existing eight retained presentation markers. Coordinates map to a sorted distinct cell index; cell ordering and duplicate entries are neutral. It does not synthesize or add a cell.
3. `d4c77a2` — `public/ai-dungeon/warden-warning-lifecycle.js` now requires that canonical full-footprint key to match the latest public snapshot. Missing proof and changed cells fail closed, retiring the retained ring and preventing frame-awaiting warning audio through the existing lifecycle and controller checks.
4. `5b357d1` — updated the older single-cell warning fixture to carry its complete canonical evidence.

## Proportional verification

- **8/8 passed:** 3 newly committed contracts and 5 existing live-warning lifecycle contracts, running fetched real production-source bodies in a detached V8 adapter with mocked Three.js and injected audio. The first source reproduction was red; the same scenarios were green after the production change.
- New/changed module syntax parsed in that V8 adapter.
- An expanded adapted warning-cell suite was **not fully green** (13/17 including the 8 focused tests). Four older warning-cell fixture scenarios fail in that broad mocked adapter; native baseline status is not established. Do not call the broad suite passing or attribute these failures to a real browser regression without a proper native run.
- **Not run:** `npm ci`, `npm run build`, `node --test`, Playwright, genuine WebGL/GLB/WebAudio trial, synchronized PCM, desktop/mobile multi-view captures, or 20-minute soak. The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`, and the separate container could not resolve `github.com`. No authoritative Dungeon GLBs or recordings were available as tracked files in the inspected branch.
- GitHub branch compare was four commits ahead and zero behind before this handoff, touching only two opt-in D04 production files and the two scoped tests. Recheck branch compare at review.

## Specification and engineering review

The full public cell set, not just eight visible samples, identifies a physical warning. The key is a stable textual encoding of at most 300 valid 256-by-256 grid coordinates, not a collision-prone rolling hash and not a private gameplay dependency. It cannot create injury, contact, attacker ownership, or a new attack tick. Existing marker selection, priority, deduplication, frame receipts, guard rails, opt-in and persisted mute, reduced motion/flash, reset and dispose remain untouched.

There are **no new visual pools, draw calls, audio nodes, voices, generated samples, or timers**. Source budgets remain seven visual pools / 102 reserved instances, eight foley voices, 32 pending, 32 awaiting submission, 64 receipts. Exact real frame cost, memory pressure and perceptual effect are **unmeasured**. New canonicalization performs bounded sorting of at most 300 public cell indices when planning or verifying a warning; no WebGL submission hook was changed.

## Required real-game acceptance

Mount the actual 3D Dungeon GLBs. From the same authority seed, run/floor/tick/checksum, record BEFORE and `?feedback=d04` AFTER from three matched camera viewpoints at 1440×900 and 390×844. Capture continuous Warden warning/release/recovery/earned counterattack and a warning whose footprint changes before audio frame acknowledgement; miss, block, dodge, ranged release, spell, interrupt and HP-confirmed impact; original WebM + PCM/WAV from the actual capture bus. Verify consent/mute/reload, reduced-motion/flash, prolonged WebGL stalls, scene restart/recovery, peak draw calls, voice bounds and the 20-minute cleanup soak. Standalone synthesized WAV or mocked Three.js **cannot** close any audiovisual acceptance gate.

**Next dominant remaining physical weakness:** measured wrist-based sword ribbon and Warden release cue do not establish authenticated blade-tip contact or actual audible onset alignment. Treat this as unresolved until moving GLB playback and real audio/frame capture exist.

**Rollback:** revert only these scoped D04 commits on this branch if an independent acceptance review rejects the full-footprint witness. Do not modify, deploy or merge main, PR #49, character rigs, camera, lighting or other sessions.
