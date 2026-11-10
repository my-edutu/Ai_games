# D04 — Reduced-motion sword sound must retain a living action source

**Status:** isolated source-level change, genuine animated GLB / WebGL / original WebAudio capture **UNVERIFIED**. **Do not merge or deploy.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Inspected starting head: `d5218f86a07caacbbb2871006e68fc83a26bf443`. Frozen BEFORE benchmark: `281735d0910c6b2443648af976003d50412ee324` (not a D04 execution baseline). Read `AGENTS.md`, `D04_Real_3D_Preview_Acceptance.md`, the frozen commit and current controller, visuals, planner, frame gate, foley, D04 tests and relevant game-audio/game-feel/physics/simulation-QA/performance skills. The coding tunnel reported `Tunnel-client has not been seen for 300 seconds`; local GitHub clone also failed DNS, so no mounted worktree or browser/GLBs were available.

## Dominant source-level defect

The normal-motion sword path already requires a measured retained trail and revalidates the live skinned wrist at frame receipt. **The accessibility/reduced-motion path intentionally disables the sword trail**. In the prior controller this meant a previously authenticated sword attempt could still release its whoosh after the actor died, changed to guard, was unloaded or moved off-cell between the public snapshot and actual frame receipt. The generic frame gate did not require a measured blade in reduced-motion mode, and the undrawn-source revalidation covered arrow/spell and body-signal cues, but **not a reduced-motion swing**.

The defect is demonstrable by source-path inspection. There is no claimed authentic gameplay recording of it.

## Test-first contract and isolated changes

1. Added `tests/foundation/dungeon-d04-reduced-motion-swing-source.test.cjs` before production edits. Six native `node:test` contracts cover: legitimate procedural reduced-motion whoosh; guard/death before admission; guard/death after staging but before receipt; absent/out-of-cell/invalid performer; unchanged strict normal-motion blade requirement; no audio before consent. The native tests **have not run**, so they are specified regression contracts, **not passing evidence**.
2. `physical-feedback-visuals.js` exposes `hasAuthenticatedSwingAction(cue)`: a read-only match of actor identity, expected melee kind, living HP, current `attack` action and `actionTick`, visible actor root and authoritative world cell. It **does not** require an authored blade bone or invent a contact. That preserves accessible sound-only behavior for legitimate procedural fallback actors.
3. `physical-combat-feedback.js` probes the action at **both cue admission and actual WebGL submission receipt** for reduced-motion undrawn swings. A revoked source receives `unverified-reduced-swing-action` or `revoked-reduced-swing-action`, respectively; no whoosh enters original foley. Older injected visual adapters lacking the optional new probe retain their existing compatibility contract; **this is not equivalent provenance protection**.

No gameplay authority, target/damage inference, character rig, camera, global lighting, audio recipe, or spectator default changed. `/dungeon` remains legacy; `/dungeon?feedback=d04` remains opt-in.

## Review and verification truthfulness

- **Specification review:** A public attack proves the attempt, never injury or attacker-victim causality. Reduced motion may replace a measured visual with a whoosh but must not authorize an absent or interrupted performer. Genuine HP-loss/neutral block/dodge/anonymous threat audio is left independently authorized.
- **Quality review:** Probe is bounded (one actor lookup, finite validation and root-cell check, with no new GPU effect, voice or allocator). It intentionally does not require skinned-bone provenance when motion is reduced; audio-only fallback should remain accessible for procedural characters. An old injected adapter lacking this method retains its previous behavior; integration must eventually enforce the probe contract explicitly when retiring legacy adapters.
- **GitHub inspection:** Starting branch head `d5218f8`; the tests and production source were committed on this isolated branch, and a commit-compare at `8641c6c` showed four commits ahead, zero behind, limited to D04 test/controller/visuals. The new handoff adds one D04 documentation file.
- **Not executed:** `npm ci`, native `node --test`, `npm run build`, Playwright, genuine Dungeon WebGL/WebAudio, original canvas+PCM capture, browser performance and memory soak, CI pass. No fake scores or synced-media claims. GitHub combined status at `8641c6c` contained no statuses; absence of status is not a pass.

## Retained resource and deployment envelope

The source continues using seven pools, 102 reserved visual instances, maximum eight original foley voices and one 13,440-sample original noise texture. Existing 32 pending / 32 awaiting-frame / 64 receipt ceilings, click-to-enable, persisted mute, reduced flash, deduplication, Warden warning retirement, scene reset and frame acknowledgment were not changed. Actual GPU/voice performance has **not** been measured.

## Reproduction and hard acceptance still required

```sh
npm ci
node --test tests/foundation/dungeon-d04-reduced-motion-swing-source.test.cjs tests/foundation/dungeon-d04-drawn-source-frame-receipt.test.cjs tests/foundation/dungeon-d04-strict-blade-submission.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Record the same authority seed/run/floor/tick/checksum from three camera directions at 1440×900 and 390×844, actual missed and HP-confirmed strikes, block, one-cell dodge, arrow, spell, interrupt, complete Warden warning/release/recovery/earned counter, defeat/restart and two simultaneous threats with ambiguous damage. Repeat in reduced-motion, reduced-flash, opt-in/mute/reload and WebGL loss/recovery states; capture real canvas WebM and output-bus PCM/WAV if supported, and run the 20-minute retained-resource soak. Neither standalone procedural foley nor synthetic actor tests prove real-world synchronization.

**Next dominant weakness:** The normal-motion trail is still only measured skinned wrist displacement, not verified weapon tip/contact, and Warden strike sound onset has not been aligned to genuine moving GLBs and audible PCM. Do not fabricate blade offsets or accept genre-parity claims without the original assets and recordings.

**Rollback:** revert only the isolated D04 commits, never change main or Draft PR #49.