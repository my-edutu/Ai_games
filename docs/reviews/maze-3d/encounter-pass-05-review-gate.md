# Fifth-pass guardian-encounter review gate (not a critic verdict)

Date: 2026-10-30. Candidate branch: `feat/maze-3d-gauntlet`.

The previous independent scene critic chose the fourth pass narrowly over the third but retained the official Captain Toad reference as the winner. This source-only pass addresses its largest gap: Pip and Thornback previously faced outward without an intelligible relationship.

## Independent, smallest-piece judgments

1. **Explorer reaction:** In an actual disclosed encounter, cover the danger caption. Can a viewer read Pip's threat-aware gaze and lantern lift without losing the route-facing body and real route?
2. **Guardian response:** Does Thornback's eye/mask/jaw orientation visibly address Pip, rather than play a generic idle pose? Confirm the difference at native gameplay size.
3. **Shared staging:** Does the follow camera hold the two characters and the relevant passage legibly while keeping Pip in frame? Compare a real encounter frame, not a hand-composed mockup.
4. **Reversibility and privacy:** On actual sanitized public-state changes, does attention stop when the threat disappears or a genuine terminal result occurs? Check there is no query to hidden world/AI state.
5. **Fixed bar:** Compare current actual output directly with the two pinned Nintendo images in `reference-manifest.json`. Do not lower the bar or call test success a visual win.

Capture the same real public seed and scene at the previous fourth-pass source and the candidate. An independent critic with no builder notes should lock a blind A/B choice first, then evaluate the fixed reference. Preserve actual timestamps, source hashes, screenshots, tradeoffs, and unresolved deficits. Keep third-party reference bytes outside the repository.

## Capability / evidence status

No fifth-pass screenshot, fresh independent critic, motion/audio verification, or hardware frame-rate measurement exists at this entry. The live workspace tunnel and its worker/browser tools were unreachable. This document is an acceptance plan, not a completed review. Ultracode did not run.

## CI verification and observed output

Source `7d7671ccdd56d77ae05e7a7c2fa05e997348c81a` passed Autonomous Games CI 41130491285 on 2026-10-30: 516/516 unit and 24/24 browser. The run supplied three real image artifacts, inspected and hashed in `ci-artifact-05.md`. The images show original Pip and the disclosed beetle on a coherent stage, but not a near enough interaction to judge the new attention behavior at gameplay size. The “Warden nearby” label alone is not a visible threat–response relationship. An independent actual proximity capture and blind A/B remain required. These findings are a lead artifact inspection, **not** a separate critic verdict.
