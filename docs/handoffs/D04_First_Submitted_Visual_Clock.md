# D04 — First submitted combat visual after a blocked browser frame

**Status:** Isolated presentation correction; authentic WebGL + WebAudio synchronization **UNVERIFIED**.
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Parent SHA:** `a6c9cfa112fae2a2a4aa9f9bbb6911e12473e137`.
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.

## Dominant source-level defect
The coordinator used to stage delayed cues with `popDue(dt)` **before** aging retained visuals by the actual browser interval. A swing becoming due during a 260ms frame was admitted and then immediately aged by 260ms, exceeding its 220ms nominal effect life. The later frame receipt correctly rejected the sound as `expired-visual`, but the legitimate fresh swing got neither visible art nor audio. Separately, `visuals.emit()` marked nontrail meshes visible while leaving their GPU instance matrices at the hidden setup transform until the next `advance()`. Both defects were identified from the committed source, not from a captured game session.

## Correction
- `createPhysicalCombatFeedback.advance()` first ages **previously existing** visual slots using actual elapsed time, and only then admits cues that have just become due using the existing 50ms bounded animation step. Previously submitted stale art still expires. The 400ms stale-cue barrier continues rejecting obsolete pending and awaiting audio.
- `createPhysicalFeedbackVisuals.emit()` immediately writes and marks dirty each newly accepted instance's initial matrix for the imminent actual WebGL render; genuine wrist trails stay geometrically hidden until measured moving-bone travel is observed. No fake damage, source attribution or new particle is introduced.
- Updated an obsolete Vanguard test mock to use the current `rigMeleeBones.wrist` and existing asset-root gate. Added focused tests for due-cue ordering, first-frame hit geometry upload and retained old-art expiry.

## Evidence collected in this run
- Read the exact GitHub D04 branch at `a6c9cfa112fae2a2a4aa9f9bbb6911e12473e137`, AGENTS.md, acceptance document, latest handoff, modules, actual app render-submit integration and test fixtures.
- Executed a detached V8 harness against the **exact fetched prior module source**. With two 50ms frames followed by a 260ms frame, the due swing was emitted before aging; subsequent 12ms submission returned **0** playable sounds, receipt `expired-visual`. Evaluating the proposed coordinator change returned **1** post-frame sound with `delivered` receipt and admission order `age → emit`.
- Separate detached V8 mock-Three.js source evaluation: old hit admission performed **0** GPU matrix writes; patched source performed **5** writes for five genuine-HP-derived chips. These checks are **not** Node repository tests and do **not** establish browser submission, perceptual video, PCM onset or hardware performance.
- Full `node --test`, `npm run build`, Playwright, three real viewpoints, 1440×900 and 390×844 recordings, Warden sequence, real missed swing/block/dodge/projectile/spell/impact, 20-minute soak and actual A/V are **NOT VERIFIED**. Local git tunnel could not resolve github.com and no matching gameplay WebM assets are tracked in the inspected tree.

## Preservation and acceptance
All edits are confined to `public/ai-dungeon`, D04 foundation tests and this handoff. The existing seven VFX pools, 102 instance cap, max eight generated foley voices, one retained noise buffer, opt-in/mute, reduced motion/flash, dedupe, cleanup and authoritative HP/counter rules are unchanged. The established legacy /dungeon remains default; the experiment is only `?feedback=d04`. No edits to main, Draft PR #49, `games/ai-dungeon/src`, character rigs, camera or global lighting.

Verify on an actual checked-out D04 branch:
```sh
node --test tests/foundation/dungeon-d04-visual-audio-submission.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
Then collect matched frozen-before and D04 actual WebM plus original PCM at three viewpoints and 390px mobile; test 260ms versus 720ms stalls with genuine Warden warning/release/recovery/counter and real harm. If the first submitted VFX matrix is absent or late audio remains, reject this pass and revert the isolated commit.

**Next dominant unresolved weakness:** the trail still measures hand, not actual GLB sword tip; authentic sampled blade/PCM capture and a real 3D model are prerequisites for judging physical parity. The release-time post-frame synchronization must be inspected in genuine software and hardware WebGL.
