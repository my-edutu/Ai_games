# Infinite Tower Climb PR #68 — full-silhouette physical guardian crossing

## Problem found in existing actual gameplay authority
The new inner bronze gateway stands at the genuine source cap exit X and world radius 25. But the deterministic rules would grant floor nine when the climber was **anywhere within ±18,000 units** of that gate center, even if the skinned body was still in front of its frame. The autonomous policy also tried to stop at the center within ±5,500 units; simply changing the finish predicate would strand it there indefinitely.

## Connected playable fix
- Add one source-owned clearance coordinate: **gate plane + actual player half-width + 4,000 units**. This measures the climber's trailing edge passing the center of the real threshold, not a timer, proximity circle or animation cue.
- Restrict the opt-in guardian arena's floor advancement to a grounded cap-supported body beyond that coordinate. The unflagged historical guardian gate and all other floors retain their original replay rules.
- Drive the autonomous climber to the same clearance coordinate, coast/brake on longer approaches, and commit rightward movement for the final 18,000 units instead of stopping inside an unreachable dead zone.
- Keep combat, collision, guardian health, hazard damage, camera, 3D threshold, replay serialization and optional audio unchanged. A legitimate crossing now gives the existing opened gate more time to be seen before the source-authoritative next-floor handoff.

## Verification contracts / limitations
Focused tests exercise the cap-plane premature transition, the last unit before full-body clearance, legitimate clearance, bounded deck support, tactical steering near the doorway, and a bounded autonomous journey to the next floor. These contracts are engineering guardrails; not evidence of better LOOKS, FEELS or PLAYS. Direct code worker was unreachable (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`). No local Node, Playwright, native phone, blind critic or supported-device frame-time test was available here. Exact-source workflow must still execute and report success; prior source-run CI was cancelled. Record full-motion matched baseline/candidate desktop and portrait clips including source crossing and real outcome/restart before giving quality preference.

**Baseline:** 1731b380851162741761c5569e2bc152a0869ca9 (unchanged). **PR:** #68 draft from active #58. No merge/deployment/force push.
