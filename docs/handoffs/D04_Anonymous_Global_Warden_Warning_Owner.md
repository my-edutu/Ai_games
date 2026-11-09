# D04 — Do not invent the source of a global Warden warning

**Status:** source-level correction on opt-in D04 only; not a genuine Dungeon audiovisual acceptance pass.

- Repository: `my-edutu/Ai_games`
- Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Started at verified branch head: `3caabb485acc2c9f34997bb894d4deabce05e655`
- Frozen BEFORE milestone: `281735d0910c6b2443648af976003d50412ee324` (not edited)
- Default spectator remains legacy; D04 is **only** `/dungeon?feedback=d04`.

## Source-confirmed defect

`next.bossWarning` supplies authoritative danger cells and attack timing but **no boss identity**. In `public/ai-dungeon/physical-feedback-plan.js`, the earlier planner gated on the existence of any living Warden, then used `next.units.find(...)` to choose the **first** living Warden as the owner of the warning. In an unusual restored, malformed or future multi-Warden snapshot, array order could invent a visible Warden-source label. The same issue affected a lone replacement boss whose continuity across snapshots was not witnessed.

That is not an authority-certified source. The footprint may still be true; choosing its attacker from array order is not.

## Test-first correction and actual source checks

Added `tests/foundation/dungeon-d04-warden-warning-owner-integrity.test.cjs` **before** production editing. Five committed contracts cover: two live Wardens in opposite array order, changed boss identity across observations, missing previous boss, a single stable living boss with a dead unrelated boss, and a simultaneous neutral telegraph.

A detached V8 harness executed the fetched production planner and those committed callbacks with a stub only for the unrelated evasion-plan import. **Before** the fix, 1/5 passed and 4/5 failed as expected. **After** the fix, 5/5 passed. Four existing committed anonymous-owner tests were exercised against the same fetched source and passed 4/4. Total observed **9/9** after correction. The changed module compiled and ran in that harness. This is *adapted production-source execution*, NOT native Node's test runner, a full build, CI, live WebGL or WebAudio.

The planner now:
1. Considers only living enemy Wardens in the bounded public unit sample.
2. Requires exactly one on both adjacent observations, with the same valid ID and matching unit identity and map cell, before placing an owner-specific D04 danger-cell glyph.
3. For a real public warning whose owner is ambiguous or newly appearing, emits **one** source-free `threat-warning` sound cue (`visual:'none'`, `actorId:null`, proof `authority-warning-unattributed`) instead of a falsely attributed boss glyph.
4. Preserves the original sampled public danger footprint and stronger authored warning cadence for a stable sole Warden. A same-tick anonymous telegraph deduplicates with the neutral warning cue.
5. Does **not** modify authoritative damage, AI, snapshots, boss timing, character rigs, render stage, global lighting, camera or original foley recipes.

There is no new geometry, texture, voice, buffer, timer or unbounded queue. The seven existing GPU effect pools (102 reserved instances), <=7 potential effect draws, <=8 original voices, <=19,200 mono noise samples, 32 pending VFX, 32 audio-awaiting-frame and 64 bounded receipts remain source-defined budgets only, **not** measured actual usage.

## What could and could not be verified

The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. The separate shell could not resolve `github.com`. Repository browsing via connected GitHub was available. Its `public/ai-dungeon/models` folder contained only `.gitignore`; `games/ai-dungeon/assets` contains a manifest/provenance but not mounted GLBs. The tracked `evidence/` directory had no Dungeon recordings. GitHub's frozen BEFORE commit was read as a fixed comparison milestone and was not modified.

The following evidence remains **UNVERIFIED**: native `npm ci`, native `node --test`, `npm run build`, Playwright, actual Dungeon Three.js motion, audible original WebAudio through the capture bus, 3 matched viewpoints, 1440×900 and 390×844, full Warden warning/release/recovery/counter, sword miss and real HP hit, projectile, spell, block, dodge, simultaneous threats, mute/opt-in, reduced-motion/flash, lost/restored WebGL, extracted PCM/video-frame onset, and the 20-minute cleanup soak.

Once the actual worktree, GLBs and browser are available, reproduce:

```sh
npm ci
node --test tests/foundation/dungeon-d04-warden-warning-owner-integrity.test.cjs tests/foundation/dungeon-d04-ambiguous-warden-owner.test.cjs tests/foundation/dungeon-d04-warden-warning-cells.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then capture genuine game-originated desktop/mobile three-angle footage + original A/V, compare the fixed BEFORE milestone at matching seed/run/floor/tick/checksum, and inspect bounded counters after dense combat and restart. **Do not** classify isolated synthesis, detached mocks, waveform energy or static screenshots as a successful audiovisual preview.

## Review, rollback and next main weakness

Specification review: no warning owner may be inferred from array order; ownerless public warnings degrade to neutral sound only. Quality review: deliberate loss of an additional D04 authored floor glyph for ambiguous ownership is preferable to a misleading Warden identification; the authoritative threat area still belongs to the existing game presentation. Keep this isolated until final cross-session review; revert only the two implementation/test commits plus this handoff if genuine traced gameplay disproves the continuity contract.

**Next dominant physicality weakness:** A matching Warden action tick still does not show the actual weapon's contact pose, and the melee streak still uses skinned wrist travel rather than verified blade-tip geometry. Inspect the real licensed GLBs and capture synchronized moving-game audio before attempting a new synthetic sound offset or claiming physical realism. No Diablo-IV parity or production readiness is claimed.
