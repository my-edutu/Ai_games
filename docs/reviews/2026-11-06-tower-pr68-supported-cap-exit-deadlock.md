# Infinite Tower Climb PR68 — P0 legal-climber guardian-to-floor-nine deadlock

**Checked 2026-11-06. Active P0: OPEN. Leading transformation verdict: NOT EVALUATED.**
The frozen baseline remains `1731b380851162741761c5569e2bc152a0869ca9`. PR68 stays OPEN DRAFT and PR58 must not be edited.

## Source-proven primary defect

The original 20Hz `applyTowerAction` only examined whether the guardian cap was cleared if the climber's **center Y** had first reached `current.exitY`. The generated cap top is `baseY + chunkHeight - 16000`, while exitY is `baseY + chunkHeight - 8000`. Valid playerHalfHeight settings are 5000–40000. For 5000–7999, the physically supported climber is *below* that Y gate, even after it defeats the real guardian and walks its full body beyond the bronze threshold. Jumping above exitY removes grounded cap contact. Consequently, the physical doorway to floor nine was impossible for a valid configuration. This is a **source-derived impossibility**, not a defect newly witnessed in current WebM.

At the 360000 source chunk height, legal halfHeight 5000 produces cap-foot-supported center 349000 versus exitY 352000 (3000 short). Normal height 14000 gives 358000 (> exitY); this branch is not claimed to change the default-size fight.

## Implemented in the existing PR68 branch

- `aae46a77bc277dec4cf3a9ed6d7d5c5f872e43e3` adds two fixed-step real-runtime regression cases to `tests/phase2/tower-guardian-earned-exit.test.cjs`: below-Y-but-full-body-earned cap crossing and the negative gates (alive or absent guardian, airborne actor, unflagged legacy simulation).
- `d7461372a86bf1a28f763ea242211591987219a5` changes **only** `games/infinite-tower-climb/src/rules/step.ts`. An opt-in source-observed guardian defeat with real cap grounding can enter the existing passage test even when the supported center remains below exitY. The existing **guardian-defeated, actual cap-contact, grounded, horizontal trailing-edge clearance** checks remain mandatory before authentic floor-nine spawn. No teleport, scripted kill, physics modification, UI substitute, baseline rewrite or widened historical gate.

## Verification truth

Read GitHub's exact PR68 branch HEAD and source files after both commits; branch HEAD was `d7461372a86bf1a28f763ea242211591987219a5` at implementation inspection. Isolated scalar geometry (not the original game) confirms the below-Y region for legal halfHeight 5000–7999, while 8000 and 14000 already satisfy the old height condition.

**NOT EXECUTED:** authored Node 22 repository red/green tests, TypeScript build, real 3200-tick dual guardian campaigns, same-run crusher → guardian defeat → grounded gate → floor-nine movement → outcome/restart, or Chromium 60s+ footage. Remote source workspace returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`. The [exact implementation gameplay capture](https://github.com/my-edutu/Ai_games/actions/runs/42281114266) and [quality](https://github.com/my-edutu/Ai_games/actions/runs/42281114269) were QUEUED on inspection. No artifact-based video review can yet certify this change.

**Most important observed visual weakness (HISTORICAL ONLY):** candidate `8fd9018f` old portrait film shows a tiny climber/guardian relative to tower machinery, and the earned physical crossing is not clearly legible. It has not been evaluated against this HEAD.

Independent randomized fresh-context LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. Hardware p50/p95/p99 frame-time and memory: **NOT EVALUATED**. The source fix is a safety/progression unblocker, **not a demonstrated transformation-quality win**.

**Next highest-impact P0 action:** Restore an exact-SHA Node 22/Chromium runner; execute `npm run build && node --test tests/phase2/tower-guardian-earned-exit.test.cjs` and paired 3200-tick authentic campaigns. Review full native 960×600/390×844 video with source-event-matched guardian+crusher, physically supported clearance, floor-nine landed continuation and real outcome/restart. If footage still makes the actor and earned gateway too small, rebuild the combined encounter and crossing composition rather than accumulate further camera micro-patches. Then perform physical-device and 5-per-pillar blind assessments.

**Safety:** frozen baseline unchanged; PR58 untouched; PR68 OPEN DRAFT; no merge/deploy/force push.
