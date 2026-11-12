# D04 — Genuine original A/V capture on/off paired dynamic WebGL cost

**Status: DIAGNOSTIC ONLY / PHYSICAL COMBAT REALISM NOT ACCEPTED**  
**Date:** 12 November 2026  
**Owned branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`  
**Prior candidate:** `7f1253e6a17e18a876049a2f419022c0e40f960f`

## Reason for this increment

The preceding genuine browser [red acceptance](https://github.com/my-edutu/Ai_games/actions/runs/43189136184) proved the original tick-4 HP-loss victim `enemy-1-0` was not admitted before the 400ms deadline: observation to actual WebGL submission was **1,370ms**, of which the direct renderer took **1,005ms**. Running a single primary encoder did not eliminate stalls. Previous uncaptured tactical comparisons on fixed and sequential states showed much shorter direct render calls. This difference is *not yet a causal explanation*.

## Implementation and boundary

Added a **read-only** capture-cost experiment to compare identical consecutive real `DungeonRuntime.step()` public snapshots from seed `visual-room-art-18`, including real HP loss, with and without an actual WebM recorder on the real Three.js canvas plus original opted-in soundstage.

- Both arms use the experimental `?feedback=d04` route, the normal `#view-toggle` tactical camera and a real `#audio-toggle` opt-in click; neither modifies authoritative `games/ai-dungeon/src`, renderer internals, rigs, camera, lighting or the default legacy route.
- The captured arm starts **one** diagnostic-owned MediaRecorder before sequential combat stages, uses actual canvas frame receipt requests when supported (native canvas stream fallback), retains a bounded **8MiB** actual WebM when encoded, and stops before exit. The uncaptured arm creates no recorder. Original soundtracks are borrowed, never stopped or fabricated.
- Runs are serial at **1440×900** and **390×844**, without simultaneous software-WebGL pages. Every stage captures the real post-render frame id, seed, scene checksum/tick, focused actor, camera position and aim, direct WebGL render-call duration, VFX draw calls, reserved instances and opt-in state.
- The evidence classifier rejects incorrect mode, missing recorder provenance, non-monotonic or duplicate stages/frames, wrong checksum, unmatched view/viewport/focused actor, no actual HP-loss witness, missing sound consent, and unsafe effect pool size. It preserves multi-second outliers instead of trimming them.
- This is **not** a randomized causal experiment: new-page initialization, shader/model warmup, media encoding, browser scheduling, screenshot costs and software renderer variability still differ across serial arms. The classifier explicitly sets `causedByRecorder:null` and `sampleSynchronized:false`, even when the timings match.

## Test-first and verification

Tests were committed **before the classifier** to enforce:
1. strict same-tick/camera and genuine damage evidence;
2. one opt-in original A/V track pair and **one owned recorder** only;
3. no fabricated sound, false scene matching or favorable duplicate selection;
4. full outlier retention and visual pool budget violations;
5. no causal or audible synchronization claim from post-WebGL timings.

The isolated CI workflow now runs those unit contracts plus the four-test real Chrome suite. New test-first contracts were committed before production of their implementation, but **no completed red CI run is claimed**.

[CI run 43198249099](https://github.com/my-edutu/Ai_games/actions/runs/43198249099): **188/188 native contracts and production build passed** for code head `f192ecb0c94be54819132b122948b0f2a1cb8385`. The real-preview job was still running at the time this document was first authored; do not claim new gameplay A/V acceptance without its actual completed artifacts.

## Reproduction

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-capture-cost-pair.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs dungeon-d04-real-capture-cost-pair.spec.cjs
```

Expected artifact name: `artifacts/dungeon-d04-capture-cost-pair-evidence.json`. Genuine captured WebMs, when viable, are named `artifacts/dungeon-d04-capture-on-{desktop1440,mobile390}-original-unaligned.webm`, and still **NOT** accepted as synchronized impact sound. Preserve explicit `CAPTURE_PROVENANCE_UNVERIFIED` or `INSUFFICIENT_CAPTURE_COMBAT_MATCH` results instead of hiding them or treating them as speed wins.

## Review, impact and rollback

**Specification review:** immutable authority and deterministic replay unchanged; original opt-in/mute ownership unchanged; no faked attacker, target or damage; no production hit deadline, cue policy or retained pools changed. A combined original A/V recording is only a capture provenance witness, not proof of physical impact synchronization.

**Engineering review:** sampling two serial page runs reduces simultaneous software-WebGL competition but cannot eliminate warmup bias; the capture polling timer is part of the experimental load; explicit per-stage matching prevents cumulative-counter false positives. A MediaRecorder event may produce a valid WebM with sparse VP8 frames; actual encoded moving-audio alignment must be inspected independently.

**Rollback:** revert the D04-only comparator, its native tests, the isolated Chrome test, the isolated workflow/config registrations and this handoff. No gameplay migration or default-route release flag is involved.

**Unaccepted gates:** timely original injury frame, genuine movement/audio sample alignment, Warden warning-release-recovery-counter, real miss/block/dodge/projectile/spell presentation, three distinct moving viewpoints, matched 390px mobile, and 20-minute pooled-effect cleanup. The next implementation must follow evidence: if the same original HP-loss frames still stall without recording, investigate renderer/frame presentation in D04 ownership; if captured runs are consistently worse, isolate recorder/track overhead before modifying effects. Never stretch 400ms to disguise a stale impact.


## Completed independent verification — 12 November 2026

[Actual GitHub Actions run 43198249099](https://github.com/my-edutu/Ai_games/actions/runs/43198249099) completed: **contracts/build green (188/188 native tests)**, **three of four real Chrome tests passed**, **one strict authentic-original-injury acceptance failed**. No overall browser pass is claimed. The fresh capture-on/off dynamic trial itself passed and recorded both genuine combined A/V WebMs.

| Actual Chrome trial | Matched stages | Real HP-loss stages | Uncaptured direct WebGL p50 / worst | With one original A/V encoder p50 / worst |
|---|---:|---:|---|---|
| 1440×900 | 10 | 3 | 15.4 / 32.7ms | 15.1 / 28.6ms |
| 390×844 | 10 | 3 | 16.8 / 26.1ms | 13.1 / 23.5ms |

These few **serial staged-state** runs did not reproduce the multi-second direct render stall, with or without the owned MediaRecorder. This does **not** prove the encoder improves performance, nor exclude encoder interference under fully continuous live play. The captured arms used one actual source stream and original soundstage track (one video + one audio), no requestFrame failures, and generated 252,230 desktop and 315,930 mobile WebM bytes.

Independent local FFprobe inspection of the original artifact found **8 VP8 packets and 207 Opus packets** in desktop captured WebM, **9 VP8 and 225 Opus packets** in mobile, with long frame gaps (desktop approximately 3.35 to 9.06 seconds). These are original real browser frames and sound packets, not a verified contact-aligned soundtrack or smooth full-motion recording. The evidence files also contain real viewport screenshots and all paired stage records.

The separate **continuous real-Dungeon A/V acceptance is still red**. Its exact original tick-4 victim `enemy-1-0` was flagged `stale-frame`, observation-to-submission **1,994ms**, of which direct WebGL rendering consumed **1,680ms**; original impact audio remained correctly rejected. Genuine preview recording had just **2 VP8 packets and 107 Opus packets** despite 7 submitted-frame requests. Verdict: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`, damage receipts admitted **0**; aggregate visuals **7**, queued effects **39**, expired **29**, acknowledged frames **33**. One later fatal impact had a valid original WebAudio scheduling receipt, but that does **not** repair the original injury or prove sample-level timing.

**Resulting priority:** the discrepancy between staged, polled sequential snapshots and fully active continuous gameplay/capture is the dominant observable defect. Next session should instrument a controlled **continuously advancing real authority** run with capture on/off under the same public seed, viewpoint and audio consent, retaining software-WebGL stalls and the exact HP-loss clock. Do not extend the 400ms deadline, count unrelated later effects, infer an attacker, or relax audiovisual acceptance. Three-angle moving footage, complete Warden and miss/block/dodge/projectile/spell cases, 390px moving combat and 20-minute cleanup remain open.
