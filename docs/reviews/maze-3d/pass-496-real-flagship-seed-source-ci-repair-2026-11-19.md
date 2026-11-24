# Pass496 — repair real Pass494 live flagship selection failure
**UTC date:** 2026-11-19. **Incoming HEAD:** `c32c594bb4bd270f176679afd9b26c1a77352ea8`. Single follow-up correction on Draft PR #53.

## Material source/CI blocker (not a cosmetic pass)
[Pass494 exact-head native WebGL workflow 44442757517](https://github.com/my-edutu/Ai_games/actions/runs/44442757517) failed **before** browser capture in its source suite: **241/242 passed; one failed** `tests/phase3/maze-3d-flagship-chapter.test.cjs`. The bounded default 43-seed list did not contain any one genuine pressure→straight Thornback→same-tier two-link key detour→matching gate world. Its strict failure was correct: production silently chose fallback `maze-stream-reference`, NOT the intended connected live chapter. The failing test's own actual `MazeRuntime.create`/inventory-solver diagnostic checked 2,048 unmodified generated seeds and emitted:

```
TRUE_CHAPTER_DISCOVERY={"seed":"tideglass-live-chapter-1387","chapter":{"guardianId":"threat-1","pressureCell":107,"keyId":"key-2","gateId":"door-2","entryCell":90,"shrineCell":72}}
```

This is an *actual generated world graph*, not fabricated footage, invented doors or test-owned AI oracle. The whole-repo CI [44442757603](https://github.com/my-edutu/Ai_games/actions/runs/44442757603) fails the same source test.

## One worthwhile production correction
Pin `tideglass-live-chapter-1387` near the front of the existing immutable `DEFAULT_SEEDS` array. That makes the built-in production `/maze` seed selection invoke the **existing strict original** chapter validator on the real seed and choose it if and only if the real world still qualifies; preserve the fallback on generation regressions. The bounded count rises from 43 to 44 (unchanged cap 48); explicit `MAZE_SEED` always wins. No pressure, enemy, key, gate, passage, collision, AI partial-knowledge, source budget or test threshold changed. Strengthen existing installed runtime test to require this exact independently discovered seed and ensure replay. This is a gameplay continuity repair, not a score from test coverage.

## Gate and limitations
New exact-HEAD source tests and original unaltered native WebGL four-viewport captures **PENDING**. The chosen stage has the ingredients but must be observed as an uninterrupted partial-observation AI playthrough: pressure→Thornback→two-link key-gallery collection/return→matching gate→escape. Source/native 390px visual critique of preceding Pass493 still rejected Thornback occlusion. Pass495's blocked spectator low-reef scene change also awaits exact-source rendering and full-body NDC checks. Independent critic/Ultracode workspace disconnected (NOT_FOUND). No independent Nintendo visual quality win. PR remains open DRAFT, unmerged/undeployed, Gauntlet active.
