# D04 — Require a witnessed Warden body before drawing release or recovery glyphs

**Status:** source-level correction on isolated D04 preview. NOT a real Dungeon browser audiovisual pass, NOT final integration, NOT production-ready.

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Verified starting branch head: `4d0f868eb34acff46e1a42093568472bb7b7db49`
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324` (not modified)
- Opt-in path only: `/dungeon?feedback=d04`. The existing spectator remains default.

## Observable source defect and exact scope

The D04 visual adapter correctly draws Warden **warnings** at true public danger cells and stages **release** and **recovery** as vertical character-local rings when a live character root is available. However, `anchor()` also fell back to `world(cue.from, .08)` when the Warden actor was **missing**, drawing the release/recovery as another floor-level ring that viewers could mistake for an actual danger footprint. A reused **idle** Warden body at the same cell could also receive a cast release ring even though its actor snapshot did not witness that cast tick. Neither case verified the animated action pose.

This was confirmed against fetched parent source with a detached retained-geometry fixture, not by real browser footage. Before correction, **three of four** new test-first scenarios failed for: missing model release ring, stale idle/cast release ring, and missing-model recovery ring. The HP-confirmed neutral counter/damage case passed. A false floor ring is specifically prohibited by the current realism rejection gates.

## Production correction

`public/ai-dungeon/physical-feedback-visuals.js` requires the actual actor for `warden-release` and `opening` to have matching ID, Warden kind, `action === 'cast'` and `actionTick === cue.tick`. The existing root visibility, finite transform and authoritative cell-distance check must also succeed. If missing, the visual is suppressed and the bounded, cumulative `unanchoredWardenSignals` counter increments; it **never** falls back to an invented floor glyph.

Actual danger warnings still draw on independently confirmed public floor cells even with no boss model. A witnessed release **still retires its spent warnings before attempting an actor-local glyph** and retains the bounded Warden warning watermark so those spent cells do not reappear. Later genuine warnings survive. Confirmed HP loss still produces attacker-neutral damage fragments, and a verified counter may still mark the real known victim without inventing a source. No authoritative action, cast time, target, HP, boss rule or camera is changed.

The controller, original-sound recipes, consent gate, mute behavior, audio epoch, real-frame receipt, budgets and `?feedback=d04` routing are untouched. A source-level controller+visual-adapter test confirms that a genuine Warden cast may still play its original `warden-release` and `recovery` sound **only after** frame acknowledgment when no body art is available, without inventing a visual. Its mocked frame acknowledgment is **not** evidence of real WebGL pixels or audible PCM.

## Contract migration and verification

New test file: `tests/foundation/dungeon-d04-warden-body-pose-anchoring.test.cjs` (5 scenarios). Three prior test files explicitly asserted the now-rejected missing-model **floor-ring fallback**. Their assertions were intentionally migrated to require suppressed release geometry, preserved warning retirement and the fixed resource limit:

- `dungeon-d04-signal-stage-physical-anchoring.test.cjs`
- `dungeon-d04-stale-warden-release-retirement.test.cjs`
- `dungeon-d04-warden-warning-watermark.test.cjs`

Adapted **exact committed source** and committed callbacks in a detached V8 test shim: **20/20 pass** across these four files after the change. Before the change, **3/4** new visual scenarios failed as intended. The shim strips ESM imports and injects related source modules and deterministic fake geometry/audio adapters; it is not a native Node test, real Three.js GPU draw, WebAudio performance measurement, game state trace, or live browser capture. Source function compilation also succeeded. The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; therefore native Node, `npm ci`, build and Playwright were **not run**.

Required local verification once a worktree and models exist:

```sh
npm ci
node --test tests/foundation/dungeon-d04-warden-body-pose-anchoring.test.cjs tests/foundation/dungeon-d04-signal-stage-physical-anchoring.test.cjs tests/foundation/dungeon-d04-stale-warden-release-retirement.test.cjs tests/foundation/dungeon-d04-warden-warning-watermark.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Retained visuals still use the existing seven pools / 102 reserved instances, <=7 potential new effect draws, and no new materials, geometry or WebAudio voices. The existing eight-voice, single <=19,200-sample original noise buffer, 32 pending effects, 32 sounds awaiting frame and 64 receipts are not altered. These are **source-defined budgets**, not newly measured GPU or audio utilization.

## Mandatory evidence and remaining risk

Unverified: actual imported Dungeon GLBs, same-seed three-viewpoint AFTER/BEFORE moving video, 1440x900/390x844, audible onset from actual canvas + original sound bus, Warden warning/release/recovery/earned counter, missed swing, block, dodge, spell, arrow, genuine HP impact, overlap/ambiguous damage, stall/mute/restart/WebGL recovery, reduced-flash/reduced-motion and 20-minute resource soak. There are no tracked real-game GLB/WebM/WAV assets in the inspected branch tree, and the coding tunnel was disconnected for this run. No claim of Diablo-IV parity or completed 3D realism is justified.

**Next dominant weakness:** the current `actionTick` confirms the action snapshot but not the **physical attack pose or contact time**; the Warden release sound still needs matching original PCM and real submitted-frame recording against its actual animated cast. Melee ribbons still follow a genuine measured wrist proxy instead of authenticated GLB sword-tip geometry. Capture the real animation before introducing another synthetic offset or silent global renderer change.

**Review / rollback:** keep isolated D04 preview only. Review source contract, then actual three-viewpoint footage and budgets before D10 final integration. Revert only this session's isolated D04 commits if real-world evidence falsifies the new anchoring policy. Never merge main or PR #49 here.
