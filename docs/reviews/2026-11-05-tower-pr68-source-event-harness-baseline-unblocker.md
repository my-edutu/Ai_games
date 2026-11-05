# Tower PR68 — frozen-baseline capture and actual-source event pairing unblocker

**Stage:** P0 evidence + game-loop truth, still OPEN. **Code commit:** `658cad51de6416ae62d001dfbbb3815406c5c871`. **Frozen source:** `1731b380851162741761c5569e2bc152a0869ca9`. **Real gameplay implementation SHA:** `4cce1ded8e4ee7213c6bb0f773e7297fbd6275e8`. **Assessor:** NOT EVALUATED; independent LOOKS / FEELS / PLAYS 0/5 each.

## Primary blocker confirmed in source (not a claimed video failure)

The prior `033e6faf` neutral capture spec imports `scripts/tower-event-alignment.cjs` so all eight authentic full-motion baseline/candidate scenarios can produce source-event sidecars. However, the baseline source-checkout recipe copied its **new spec**, motion and crossfire modules but did **not** copy that imported alignment helper. Since the source is frozen before that helper was created, baseline's four scenario jobs would fail module resolution. The 033e capture job was **cancelled**, so do not mislabel this as an observed baseline job failure.

## Cohesive P0 correction

- The baseline matrix now copies exactly the extra read-only neutral event observer and its regression test, leaving the original source, host, simulation, seed, camera, graphics and WebM bytes alone.
- Both source checkouts run the neutral event-index test as capture-integrity preflight.
- A post-matrix collector downloads the original eight upload artifacts without editing films. It indexes the actual source-event sequences across ascent, danger, moving deck and outcome at desktop 960×600 and portrait 390×844, checking SHA, native viewport, seed/tier/mute/reduced-motion, >=60-second observation and actual unedited `live.webm` presence.
- Output `tower-ungraded-event-pairs-<run-id>` is a comparison **search manifest**, preserving source-only event names/relative observation offsets, missing transitions and provenance failures. It **never** declares event-matched filmed clips, independent reviewers or acceptance.
- Newly added four focused tests cover order-preserving source combat/gateway matching, missing defeat/advance, eight authentic-pair schema and tamper/missing-film/short-phone rejection.

## Execution and evidence

- Safe, non-force push on original PR68 branch: [implementation commit](https://github.com/my-edutu/Ai_games/commit/658cad51de6416ae62d001dfbbb3815406c5c871).
- Isolated V8 execution of `scripts/tower-event-pairing.cjs` confirmed one event pair and explicit `NOT EVALUATED`. Four targeted test cases were exercised; the fourth exposed a wrong expected defect count (actual five distinct integrity issues), corrected in the accompanying evidence/test follow-up.
- Current [source capture](https://github.com/my-edutu/Ai_games/actions/runs/42126700099) and [quality contract](https://github.com/my-edutu/Ai_games/actions/runs/42126700070) were still queued/pending at inspection. **No** real new capture artifact, full-motion human visual inspection or supported-device performance result was available for this run.
- Existing source film defect remains the material concern: sampled candidate portrait danger historically framed live guardian in only 5/13 observations and gate in 0/13; the new leap-to-deck/gateway scene may have improved this but is **not yet filmed and graded**.

## Next most consequential action

Read completion of the eight source-pinned actual-video jobs and the collector manifest. Inspect unaltered normal-speed video around matching **real** moving-deck contact, guardian telegraph, HP loss, defeat, physically walkable bronze gateway crossing, authentic floor-nine ascent and actual result/restart in both aspect ratios; do not confuse source events with frame-visible action. Fix the largest visible gameplay/camera failure, then commission genuinely independent anonymous randomized 5× LOOKS, 5× FEELS, 5× PLAYS full-film critics and device p50/p95/p99/memory. Quality remains NOT EVALUATED. No merge, deployment, force-push, baseline move or conversion from draft.
