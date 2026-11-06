# Infinite Tower PR68 P0 — full-height guardian lock under real double-jump physics

**Date:** 2026-11-06. **Stage:** P0 OPEN. **Leading transformation verdict:** NOT EVALUATED.
**Exact gameplay implementation:** [`74bbe242228120de04f5ec1b1a867dc48b3600f1`](https://github.com/my-edutu/Ai_games/commit/74bbe242228120de04f5ec1b1a867dc48b3600f1). **Immutable baseline:** `1731b380851162741761c5569e2bc152a0869ca9`.

## Largest causal source defect discovered and addressed
The previous cap gateway blocked a living guardian's threshold only up to **140,000 source units** above the real cap. Authoritative physics allows a grounded jump followed by one additional airborne jump. Under the default gravity 1,200 / impulse 15,000 / half-height 14,000, two maximum jumps bring the head **200,200 units** above the cap. The actor could plausibly clear the 140,000-unit visible/physical barrier and move to the far side before the actual guardian was defeated, undermining the intended earned locked → defeated → crossing progression. This is a **source-derived bypass**, not a defect demonstrated in new game film.

## Integrated, original, source-owned correction
- `games/infinite-tower-climb/src/generation/chunks.ts`: shared `guardianArenaSealHeight` upper-bounds two legitimate source jumps with the continuous-in-time rise bound `jumpImpulse²/gravity + 2*halfHeight + 16,000`; it never shrinks below the original 140,000. No new config field or generated chunk changes.
- `games/infinite-tower-climb/src/physics/step.ts`: opt-in living guardian's swept full-body collider now extends to this source-derived height, retaining existing contacts, retreat, no teleports and locked-to-zero-HP release.
- `games/infinite-tower-climb/src/presentation/snapshot.ts`: the public, immutable **opt-in** guardian snapshot publishes the same seal height alongside exact guardian exit X. Frozen unflagged snapshots omit both optional new ownership fields.
- `public/infinite-tower-climb/visuals/guardian-passage.mjs`: existing **five instanced** bronze/energy lattice elements now scale to the authoritative height instead of falsely advertising a climb-over shortcut. The physical gateway and source-defeat release remain unchanged. No separate presentation collision or wall-clock rule.
- `tests/phase2/tower-guardian-earned-exit.test.cjs`: committed default two-jump overreach fixture, real source collider/visual snapshot agreement, historical opt-out, and legal high-impulse/low-gravity envelope.

## Checks performed versus still missing
- **Actually executed, isolated numeric source-envelope sanity:** default two-jump max head `200200`, source seal `231500`, margin `31300`; legal extreme 40000/100/40000 max head `16040000`, seal `16096000`. Additional cases 40000/5000/5000 and 3000/5000/5000 remained below the formula. These are local arithmetic probes **not** original repo tests, an authentic game campaign, WebGL, device profiling, or full motion.
- **Original game runtime/build:** NOT EXECUTED; the linked development terminal reports `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`.
- **Original candidate 3,200-tick guardian/crusher → on-deck release → floor-nine onward → result/restart:** NOT EVALUATED. Two deterministic replicas and intact same-run event audit remain required.
- **Exact-source CI:** [nine-job native film pipeline](https://github.com/my-edutu/Ai_games/actions/runs/42306258180) queued, zero current artifacts at inspection; [quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/42306258337) queued; [snapshot workflow](https://github.com/my-edutu/Ai_games/actions/runs/42306258152) pending. Queued work is not passing CI.
- **Normal-speed 960×600 / 390×844 film:** NOT EVALUATED for this source. Previous historical `8fd9018f` portrait footage showed an undersized climber/guardian and unclear physical doorway crossing; it cannot judge the new taller barrier.
- **Independent genuinely blinded reviewers:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. **Actual-device p50/p95/p99 and memory:** NOT EVALUATED.

## Design and quality criticism
This closes a meaningful *source logic contradiction*, not a verified experience gain. A taller translucent lattice could make portrait framing, skyward traversal, guardian projectiles, or the action silhouette **worse**. No occlusion, z-fighting, tall-config mobile composition, 60+s film or supported-device frametime has been checked. The upper barrier has no independent AI pathfinding proof; source tests must reveal stalls, and the actual player needs a fightable guardian while locked. The conservative two-jump height does not establish that arbitrary corrupted far-side states are corrected.

**Next highest-impact action:** Restore an actual Node22/Chromium source checkout, run `npm run build` and `node --test tests/phase2/tower-guardian-earned-exit.test.cjs`, then two unchanged 3,200-tick authoritative guardian/crusher campaigns. Inspect continuous source-pinned 60+s normal-speed matched baseline/candidate desktop and phone films through living lock, real crusher duel, guardian defeat, grounded trailing-edge crossing, floor-nine onward, outcome and restart. Fix the largest visually/gameplay-demonstrated defect, especially if portrait framing suffers. Preserve failing artifacts and test evidence. Device tails and five real randomized blind critics per pillar follow only after source/motion authenticity.

**Safety:** No changes to the frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`, PR58, other games, branch base, draft status; no merge, deploy or force-push.
