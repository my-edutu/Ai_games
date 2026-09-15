# Phase 04 Review Pass 3 — Projection and Comprehension Truth

## Scope

Final adversarial pass over the actual Three.js projection, portrait/desktop parity and the five-second comprehension contract.

## Finding A — renderer aspect drift

The camera planning layer calculated portrait/mobile framing, but the Three.js adapter used a hard-coded `16 / 9` aspect. The renderer could therefore disagree with the safety/readability model.

- RED: `2a0c2d32662890e540f4f28d0c9998051e337f7b`
- observed run: `34953747393`, 13/15 Phase 4 tests passing; both new viewport projection tests failed for the intended mismatch
- fixes: `a5500dae9e406f5ec2ec5e25efb1d7ec3fd7a824`, `397fec19c2d37751ef676b538080de4072bea263`, `a368c74a77bcc783e02ff6f8ba90f9dc5a37e4e5`
- independent GREEN run: `34953873586`

## Finding B — false progress visibility

The progress marker was authored at route finish while the comprehension model hard-coded `progressVisible: true`. Early-run cameras could not see the marker despite the model claiming a pass.

- RED: `49af2090a21146b752a8c29167c7b6efb55e8ce2`
- observed run: `34954045035`, 15/16 passing; only the new progress-visibility regression failed
- fix: `6e48c4ece0ad17752d6dfe38f2d67780279b50d2`
- implementation now exposes a visible next-milestone/checkpoint beacon and derives progress visibility from actual whole-node camera containment

## Final focused verification

Exact runtime candidate `6e48c4ece0ad17752d6dfe38f2d67780279b50d2` passed dedicated run `34954217787`:

- Phase 4: 16/16
- Phase 3: 21/21
- Phase 2: 28/28
- Phase 1: 20/20
- Three authority boundary scan: PASS
- Phase 4 evidence runner: PASS

## Result

PASS. The planning model and actual Three.js projection agree on viewport aspect, and the five-second progress claim is now measured rather than asserted. No unresolved Phase 4 stop-ship/P1/P2 finding remains from review pass 3.
