# Infinite Tower Climb PR68 — observed clear return lane and intervening one-way contact

**Date:** 2026-11-06 · **Stage:** P0 EVIDENCE + GAME-LOOP TRUTH, still OPEN  
**Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9` (not moved)  
**Implementation commits:** `3422fe049fe140bc8074e59d9a8e7e4c47461295` (clear landing lane), `b65f34f6efc234200847a6cded219e65c0e4a61b` (unavoidable intervening one-way collision veto).  
**Regression commits:** `fc23e5882883c22276f0a396bc7f70f6c1e79d46` and `e95e273b0b8fb8c92e647b8080ac36b6080348fd` (latest original-runtime fixtures).

## Specification review — code inspected; source campaign NOT run

After a real guardian defeat and physical fall through the cap, the previous return controller could classify a shelf as reachable by its *outer platform bounds* even if its only reachable landing strip was occupied by a real observed enemy body, active trap or published imminent crusher warning. Its highest-deck heuristic also ignored that 20 Hz one-way collision would force a landing on an intervening upper shelf, even when the autonomous controller intended to descend to a lower, visually clear shelf.

The opt-in guardian recovery now intersects the present fixed-step maximum-air-control envelope with the **same hazard/enemy-clear lanes** used by everyday landing steering. A reachable clear lane outranks a blocked upper landing, and its steering target persists through the controller's braking decision. Before choosing a lower shelf, it also vetoes descent where every physically legal current-state lateral trajectory intersects the observed upper one-way platform first. If a landing is reachable but none is clear, the intent explicitly reports that risk; it does not call the collision-safe route achieved. No private upcoming hazards, future moving-platform positions, free jumps, teleports or floor awards are used. Historical/unflagged replay routes are unchanged.

## Engineering / playable quality review — OPEN

Two original-runtime regression cases were added and then corrected to respect actual one-way interception. Cases cover full-deck imminent crusher pressure, deterministic lateral braking into a reachable clear corridor, and a last-resort landing with no clear observed lane. **These cases have been committed, not executed against a compiled checkout.** This review is a source-reading audit, not a runtime approval. Both the positive collision avoidance and the no-false-safe guard require the real `npm run build`, source tests and complete game replay to verify.

- [Quality workflow at latest regression SHA](https://github.com/my-edutu/Ai_games/actions/runs/42254400689) — QUEUED when inspected, no test result.
- [Nine-job source-pinned gameplay capture at implementation SHA](https://github.com/my-edutu/Ai_games/actions/runs/42254240903) — QUEUED when inspected. No playable 960×600 / 390×844 new WebM artifact inspected.
- [Source snapshot workflow](https://github.com/my-edutu/Ai_games/actions/runs/42254240824) — PENDING, not a quality pass.
- Full two-run 3,200-tick guardian campaign with same-run crusher, defeat, earned full-body crossing, later floor-nine landing, game outcome and restart — **NOT EVALUATED**.
- Independent fresh-context blinded LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**; real hardware frame-time p50/p95/p99 and memory — **NOT EVALUATED**.

### Known limitations and highest-impact follow-up

The hazard corridors are based on source-published present enemy/deck positions and published warning phase; no future motion oracle or guaranteed safe landing is claimed. A moving platform can change while the climber is falling, and risk may become unavoidable even after a correct present-state choice. The open source-campaign and normal-speed film must determine whether this recovery plays well.

The most important **actually reviewed historical portrait footage defect** remains the undersized upper-cap climber/guardian and an unclear earned gateway crossing in old source `8fd9018f`. That old film cannot validate these new commits. Next, run the latest source/build tests and the authored same-episode guardian campaign, inspect *matching* actual normal-speed desktop and portrait footage, and fix the largest observed filmed issue. Do not advance P0 on source reasoning, test counts, or a queued CI workflow.

**Assessment:** NOT EVALUATED. Frozen baseline remains unchanged; PR58 untouched; PR68 remains DRAFT. No merge, deploy or force-push.