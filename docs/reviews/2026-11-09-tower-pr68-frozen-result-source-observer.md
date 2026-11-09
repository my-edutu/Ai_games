# Infinite Tower Climb — P0 original-source terminal witness (9 November 2026)

**Verdict: NOT EVALUATED.** Scope: Draft PR #68 only. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` remains immutable.

## Real blocker found
GitHub Actions recording 42695480406 captured eight native baseline/candidate WebMs, but its frozen-baseline portrait outcome recording failed the strict same-run source-story test. The indexed original host reported a true intermission, but no witnessed **source-result-phase:result**. The companion desktop baseline outcome was witnessed. Pairing failed, with only six of eight native clocks calibrated; seven of eight recording jobs were successful. This does **not** prove the original game omitted the result: its authentic phase can last one 50ms tick and the 50ms browser state observer is subject to software-WebGL starvation. It also does not authorize a synthetic result event or weakening the gate.

## Integrated system-level correction
- New `scripts/tower-public-state-witness.cjs`: bounded 25ms Node-side read-only requests to the original existing `/tower/state` endpoint, identical for baseline and candidate. It samples genuine source run tokens, ticks, lifecycle and result values, retaining running→result→intermission edges even if the browser misses a frame. It never advances or mutates source physics or the frozen source.
- `tests/browser/tower-live-motion.spec.cjs`: run the source observer alongside unmodified normal-speed native recording, write an auditable original-host public witness artifact, use its real ticks for source event indexing when available, and retain the existing browser/renderer samples, original candidate fixed-step optional diagnostics and strict source episode veto.
- `scripts/tower-event-alignment.cjs`: state the correct provenance of the separately polled original-host public evidence.
- Focused original Node contract tests verify an actually witnessed one-tick result, same-tick intermission and restart; a missed result stays missing, with transport errors and capacity overflow surfaced.

## Limits / next proof
The development tunnel was disconnected; this code needs exact-head GitHub Node, Chromium and original-game capture checks. No new film quality, real device p50/p95/p99, memory or blind preferences are asserted. Last reviewed native 390×844 candidate danger from source 8448e2c shows a dominant foreground wheel near 15s. The recent physical below-cap restage at 61d718bd must be compared in actual source-pinned normal-speed film. Source events are not proof of visible gateway pixels, and missing original result ticks must remain a RED gate rather than inferred from an intermission.

NEXT: inspect the newly triggered exact-source quality and nine-job capture, verify authentic unedited WebM timestamps align with result/restart and guardian→crusher→walkable gateway→floor9, then fix the single strongest observed gameplay/presentation defect. Genuine independent LOOKS/FEELS/PLAYS critics **0/5 each**. **NOT EVALUATED.**

Nothing merged, deployed, force-pushed, converted from draft, or changed in PR #58 / main.

## CI integration follow-up — current witness source 0f929c5f
The immediate source-pinned workflow 42707474114 exposed a concrete harness-overlay defect: its frozen baseline recording job could not import `../../scripts/tower-public-state-witness.cjs` because the baseline checkout's explicit neutral-harness allowlist did not copy this new module. This is an actual engineering failure (not a missing original-game result). Corrected the overlay to copy the new read-only source observer and its focused tests; retained the baseline host hash check, no gameplay mutation. Added a repository-integrated contract that enumerates ALL required neutral script imports and fails if a future capture helper is missing from the allowlist. The new exact-source browser/video quality result remains **NOT EVALUATED** until it runs.
