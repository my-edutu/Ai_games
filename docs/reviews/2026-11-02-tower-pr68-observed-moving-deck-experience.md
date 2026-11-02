# Infinite Tower Climb — observed moving-deck experience continuation

**2026-11-02 · same draft PR #68 · TRANSFORMATION QUALITY: NOT EVALUATED**

## Starting evidence and constraints

Inspected active PR #68 before editing at `d85f0cd6a67f840e8878b6bbcc38c53fcf8e3eda`, root `AGENTS.md`, the approved 2026-11-01 transformation spec, game `GAUNTLET.md`, frozen `transformation.json`, the actual renderer (`scene.mjs`, `world.mjs`, `route-intent.mjs`), source opt-in audio, and the live-capture Playwright harness. Frozen baseline is **`1731b380851162741761c5569e2bc152a0869ca9`** and is not rewritten. Older source-pinned video evidence recorded actual portrait actor cropping and an incomplete frozen-baseline outcome. Those findings still stand; they are not a new candidate result.

## Connected real-game slice

**Issue:** The real autonomous agent already selects an exact landing platform, but a player/viewer cannot easily tell which way a moving platform has *actually travelled*. The previous fixed 3D route cones show its selected destination but not the deck's source-observed motion. A new 3D, HUD-free source-bound clue improves the continuity of **decision → moving target → actual landing**, while existing skinned hero, exterior camera and grounded touchdown remain unchanged.

- `public/infinite-tower-climb/visuals/route-intent.mjs`: each truly **moving** selected deck can leave at most six historical amber 3D stone echoes, composed from earlier authoritative `platform.x/y` snapshots in the exact same run/platform ID and separated by no more than eight source ticks. The outer deck position is projected onto the real cylindrical stage, depth-tested, and rendered in one additional instanced draw only when source movement was actually observed. The markers are **not predictions of where a platform will be**. No ghosts appear in reduced-motion mode; stale snapshots, no target, different target, genuine combat windup/attack, ended run and renderer disposal clear history. A passed-in platform ID now must match the snapshot's selected AI target ID.
- `public/infinite-tower-climb/visuals/audio.mjs`: when a viewer voluntarily enables sound, a quiet short tone marks a **genuine change between two present same-floor AI-selected destinations**. Initial observation, repeat packets, unavailable platform ID, combat warnings, attacking hero, new run, and mute cannot make a speculative route sound. Existing WebAudio voice limit and cleanup remain binding. This is a simple tone, **not** spatialized binaural audio.
- The existing `landingCue`, `landingBeacon`, physical platforms, real enemy danger, and actual deck-contact halo remain the final/impact points in the *same* source-driven narrative; no new on-screen explanations or simulation paths are created.

## Independent checks possible in this execution

- Syntactically parsed the shipped ES modules and test files with the JavaScript parser; these are not complete build tests.
- Loaded the **actual new route module** using minimal Three.js stand-ins in V8. At one moving-source observation, historic echoes = 0; after an **observed +7,500 x displacement** one echo appears at the **prior** deck location and extra draw budget = 2. A target-ID discrepancy clears the effect. Reduced-motion clears historical echoes, and `dispose()` releases the effect. These are source-module exercises, **not** screenshots or live browser playback.
- Loaded the **actual new audio module** with a fake opt-in AudioContext. Existing three ambient oscillators remained, then one short tone followed a genuine same-floor target change; duplicate target, enemy windup and muted target change generated no further oscillators. Again, not actual browser audio playback.
- Wrote Node test cases in `tests/phase3/tower-route-intent.test.cjs` and `tests/phase3/tower-moving-deck-audio.test.cjs` for historical positions, bounded history, replay source mismatch, muted/reduced-motion, old target and audio authority. **Node and browser test runners were inaccessible**: no verified exact-head CI pass.
- Re-executed the actual transformation assessor against updated `transformation.json`: **`NOT_EVALUATED`**, zero legitimate votes in each of LOOKS, FEELS and PLAYS, all three matched scenarios missing current candidate evidence. This is the correct **non-pass**.

## Unverified and critical review findings

1. **Normal-speed matched source-pinned motion:** the full candidate game and these specific markers/audio have not been seen or heard in 60+s actual desktop 960×600 or phone 390×844 gameplay. Historical CI software-renderer video captures refer to older game source and do not evaluate this change. The frozen baseline still shows its result state for only one 50ms source tick; source tick traces are not proof of visible 3D outcome in video.
2. **Actual viewer experience:** the new amber echoes might be difficult to notice or could clutter the tower with many simultaneous cues. Actual offscreen mobile climbing/guardian gate visibility remains a known systemic risk. A fresh-context reviewer must watch **entire real-game recordings** with audio enabled and disabled before calling either change an improvement.
3. **Robustness/performance/accessibility:** mocked V8 checks cannot substitute for full Three.js browser tests, real-device frame-time tails (p50/p95/p99), GPU memory, mobile contrast, replay checks, browser WebGL recovery or actual audio accessibility. Reduced motion and mute source guards exist but remain browser-unverified.
4. **Independent critique:** worker/browser workspace connector returned `NOT_FOUND` because tunnel-client had not been seen for >300s. Five genuine blind randomized reviewers are not available, so recorded ratings remain **0/5 per pillar**, not fictional proxy opinions.
5. **Integrating upstream:** PR #58 remains an active separate base; no rebase, force-push, merge or deployment was performed. Review upstream before future integration rather than overwriting parallel work.

## Next experience-first acceptance decision

**Do not score this by commits.** Continue the same integrated traversal/guardian/ending transformation until normal-speed source-aligned gameplay on phone and desktop is captured for all three scenes, including a complete genuine outcome/restart; collect independently randomized blind A/B judgments on actual footage (minimum 4/5 candidate preferences on *each* pillar), real-device performance and safety evidence. If these new cues obscure or mislead actual play, remove/rework them rather than defending implementation. Current quality is **NOT EVALUATED**.
