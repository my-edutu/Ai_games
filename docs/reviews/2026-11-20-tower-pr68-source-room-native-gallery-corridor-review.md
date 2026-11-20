# Infinite Tower Climb — P0: genuine shared F8→F9 corridor in original 1x gameplay

**Stage:** P0 OPEN. **Leading assessor:** NOT EVALUATED. Frozen source baseline: `1731b380851162741761c5569e2bc152a0869ca9`. PR #68 remains DRAFT; PR #58 is not modified.

## Inspected evidence

Immutable candidate `10797818d577fc4e52fc297a83f1ec367d06c3f4` produced 8/8 matched original baseline/candidate scenes, authentic ledge success and exact-commit quality 10/10. The [nine-job original 1x campaign](https://github.com/my-edutu/Ai_games/actions/runs/44776068490) failed strict event/native pairing 0/2; this is a meaningful P0 veto, not a flaky CI score. Unedited original WebM desktop 960×600 and portrait 390×844 were examined at 23–32 seconds. Drawn F9 HUD at 26.25s/26s preceded predominantly violet next-world materials at 27s/26.5s, but there was **no sustained shared bronze-to-violet corridor** containing opened original guardian gate, moving full actor and walkable successor. Portrait bronze load paths occupy the corridor; later framing loses the original doorway and briefly shrinks the moving climber.

Native/source timing is not calibrated for pixel-event attribution: source→browser accepted 86ms/336ms, browser accepted→returned WebGL 470ms/454ms, render-return→first sampled visible HUD approx 970ms/517ms desktop/portrait. None of these are device GPU time, compositor guarantees or independent preference.

## One systemic fix, bounded to actual source-traversed old scenery

`observedEarnedGalleryExitClearance` already authenticates the same-run defeated guardian, original HP0 door, real Floor 9 receiving roof, full-body passage beyond the authoritative x threshold, exact boot/flight support and a previously returned WebGL frame. Before this change, historical non-colliding **extracted** bronze gallery opacity relied solely on three returned frames / 0.3s; under a delayed native first image this curtain masked the true arriving climber and changed abruptly with the incoming Void shaft. It now additionally respects the *actual full-body signed distance past the genuine threshold*: on a fully cleared first supported roof step the old **detached, noncolliding** bars recede sooner; a barely cleared actor retains more old architecture. The current renderer still owns original material leases; old HP-open gate, collision-bearing cap, genuine moving/ground decks, enemy mechanics and frame authority remain untouched. Reduced motion still uses instant fixed fade.

The focused regression now checks the real 333296 source x first-returned-ground case, barely crossed sill, no unreturned-frame progression, and continued protection of original guardian gateway opacity. Relevant source contract: `tests/phase3/tower-earned-original-gallery-departure.test.cjs`. Required `node --test tests/phase3/tower-earned-original-gallery-departure.test.cjs` and full 10-job exact-head CI results must be read from CI; no green test claim until observed.

## Remaining evidence and required action

A fresh, exactly pinned 9-job 1x candidate/baseline recording is requested by `public/infinite-tower-climb/gauntlet/capture-request.json`. Review native full-motion, source-event correspondence and the specific opening/hero/roof frames in both viewports. Still require actual-device p50/p95/p99 and memory, accessible portrait input, true outcome/restart and five **genuine** fresh-context blind critics each for LOOKS/FEELS/PLAYS (currently 0/5 each). CI is a veto, never transformation acceptance.

**Verdict:** NOT EVALUATED. No merge, deployment, baseline movement, force-push, PR status change or edit outside Tower occurred.

## Corrected exact-head test failure (separate guarded commit)

The first new Phase 3 regression deliberately used the close-sill position x318996, but the player's true left body edge (309996) fell **four authoritative source units outside** the receiving ground x310000. Production correctly returned no clearance; the test was invalid, not a rendering failure. The fixture was corrected to x319100, still barely beyond the real sill and **entirely supported by actual f9:ground**. The true support validator was not relaxed, and the original gameplay capture was already running against the preceding immutable source commit. Quality from that first commit had 9/10 job progress and Phase 3 shard0 failed; final corrected-head CI must be checked before claiming green.
