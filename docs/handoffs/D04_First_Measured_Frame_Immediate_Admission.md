# D04 — First measured-frame admission for zero-delay HP feedback

**Status:** Detached behavioural contract verified; authentic Dungeon WebGL + PCM playback **UNVERIFIED**.
**Scope:** Isolated `feat/dungeon-d04-combat-feedback-realism-20261108` only. Parent inspected: `4fe1241724237d62ab1073184fda42b9f6b91d0c`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

## Defect observed from the committed source

In the submission-gated preview, `acceptSnapshot()` immediately called `popDue(0)` even for an HP-confirmed zero-delay injury. During a subsequent **300ms browser stall**, `visuals.advance()` expired its .23s fragments *before their first actual render*, and `acknowledgePresentedFrame()` rejected the impact audio as `expired-visual`. The previous improvement to age visuals before delayed cues did not fix this **immediate** path. The detached replay of the exact fetched parent implementation produced one already-staged visual before `advance`, zero surviving fragments, zero audio, and an `expired-visual` receipt.

## Correction and preservation

For `requirePresentedFrame:true`, newly planned zero-delay effects stay in the existing **32-entry pending queue** until the next measured `advance()`. The coordinator ages existing pools first, then admits those fresh cues ahead of the upcoming real WebGL submission. A 300ms first frame can now show and release genuine HP-confirmed contact while a **720ms** blocked frame exceeds the existing 400ms stale-queue deadline and admits **neither** late visual nor late audio. Previously submitted 230ms fragments that expire before a later frame still suppress their sound with `expired-visual`. No new lifetime, voice, material, draw call or buffer allocation was introduced. The non-gated controller keeps its previous immediate dispatch behaviour.

The source-level regression suite was updated to check both the first-frame contract and the previously-submitted stale-art contract; two earlier fixtures now advance a real measured frame before asserting that sounds are awaiting submission.

## Evidence

- The frozen BEFORE commit exists on GitHub. The branch was read at `4fe1241724237d62ab1073184fda42b9f6b91d0c`; no native video, GLB, WAV or other captured media was found in its tracked Git tree.
- Test-first detached V8 harness, using **exact original fetched parent modules**, reproduced the defect: `300ms -> expired-visual, 0 audio`.
- After the source correction, the same detached harness reported: `300ms -> delivered, 1 audio`; `720ms -> 0 visual, 0 audio, 1 expired-queue`; `16ms -> delivered once`; and ungated legacy mode still admitted immediately. Syntax of all three modified source/test files was checked in V8.
- **NOT RUN:** native Node foundation/integration suites, full build, Playwright, 1440×900/390×844 real movement, three viewpoints, actual Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/impact, PCM/frame-clock measurement and 20-minute soak. The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; the separate container cannot resolve github.com. Detached tests are not a real-game A/V pass.

## Reproduction and review

On a full local worktree of the isolated D04 branch:

```sh
node --test tests/foundation/dungeon-d04-visual-audio-submission.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Confirm legitimate same-tick HP loss remains attacker-neutral, compare old/new genuine 300ms and 720ms stalls before calling the scene accepted, and include original capture-bus PCM. The opt-in `?feedback=d04` remains the sole preview path. No authority, rigs, camera, environment, global lighting, default spectator or other branch is changed.

**Next dominant weakness:** Real 3D first-submission evidence, audible onset correlation, and weapon-tip tracking cannot be accepted until the browser tunnel, model assets and matching captures are available.
