# Infinite Tower Climb PR68 — P0 floor-nine physical roof / validation mismatch

**Verdict:** P0 OPEN; transformation **NOT EVALUATED**. Quality and visual acceptance remain vetoed until exact-source runtime and native full-motion proof.

## Verified blocker from original source + completed CI

The last completed original-repository quality job, [42397136322](https://github.com/my-edutu/Ai_games/actions/runs/42397136322) at `c2a784bb3e571b113a60e8e2ff8b1080a90c05ab`, failed two actual floor-eight -> nine source-handoff regressions:
- `tests/phase2/tower-guardian-arena-encounter.test.cjs:399`: expected floor 9, actual 8.
- `tests/phase3/tower-seamless-guardian-floor-handoff.test.cjs:62`: expected floor 9, actual 8.

Investigation found a **systemic incompatible authority condition**, not an animation problem. The intended P0 gameplay fix generates the first post-guardian floor's real full-width roof at `next.baseY - 16000`, exactly level with the previous cap roof. Its slot-one hazard is physically placed **on that same collidable roof** by `generation/chunks.ts`. However, `generation/validator.ts` still rejected **every** hazard with `y < next.baseY`. For the actual floor-nine default dimensions, the real physical roof/hazard stands at **3,224,000** while `baseY` is **3,240,000**. The generated geometry and acceptance validator had contradicted one another. `rules/step.ts` handles invalid next-floor chunks by emitting a technical-terminal instead of awarding floor nine, so a completely legitimate defeated-guardian crossing could remain floor eight.

A direct source-exact FNV1a/xorshift calculation of the published `NamedRng` algorithm for both original regression seeds `tower-transformation-capture-v1` and `tower-real-cap-gate-flight` yields `tower:hazard-slot:9:0 = 1` in **both** cases. This matches the failure pattern but is **not** a substitute for executing those two original-runtime regressions.

## Implemented correction (PR68 branch only)

- **Test first:** [828070b0](https://github.com/my-edutu/Ai_games/commit/828070b0c11876ee8f7b49c4f338681c02bb242b) adds exact published-runtime seed regression cases to `tests/phase3/tower-seamless-guardian-floor-handoff.test.cjs`. They require generated real ground-level hazards to validate, reject hazards one unit **under** real support, and reject a displaced successor roof.
- **Game rules correction:** [dc3c3108](https://github.com/my-edutu/Ai_games/commit/dc3c31082f0168dd5ef4ccb5a6b4f32e6738b05d) updates the authoritative chunk validator to honor the **actual ground roof** only on an opted-in successor of a guardian floor. It additionally verifies that the roof is joined at the required fixed-height interface. All other floors, historical configurations, normal platform bounds, high hazard bounds, maximum counts and route reachability checks retain their previous behavior.

No extra guardian victory, forced collision, teleport, scripted floor award, guessed camera event, dummy metrics or replay/frozen-baseline changes are introduced. The authoritative source still requires a dead guardian, a genuinely grounded body and full horizontal clearance to cross.

## Evidence status / remaining vetoes

- Exact-code quality run: [42404054865](https://github.com/my-edutu/Ai_games/actions/runs/42404054865) — **QUEUED at inspection**. The added original-runtime tests, both prior failed floor-handoff tests, complete repository quality and 3,200-tick campaigns are **NOT YET EXECUTED at this SHA**.
- Exact-code real gameplay capture: [42404054915](https://github.com/my-edutu/Ai_games/actions/runs/42404054915) — **QUEUED at inspection**, **zero new verified artifacts**. Prior original candidate film at `ee9a223e` and recovered nine-job evidence does NOT evaluate this fix or later aerial guardian camera revision.
- Last accepted real film identified severe portrait occlusion at **94.5–97 s**: huge foreground clockwork housing obscured the actual climber/doorway. The camera/world patch at `e821006f` remains without exact-source continuous visual acceptance.
- Original-run verification counts: LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5** independent fresh-context critics. No actual-device frame-time p50/p95/p99, memory, reduced-motion/mobile UX or verified matched immutable-baseline footage at this SHA. **NOT EVALUATED**.

**Next P0 action:** Get the exact-head original-runtime quality log. If cap handoff still fails, inspect `technical-terminal` reason, validation issues, grounded support, body clearance and genuine source events rather than weakening the test. Execute the two unchanged 3,200-tick campaigns; inspect current candidate **and immutable baseline** native 960x600/390x844 full-motion gameplay with source-event timestamps through living guardian/crusher -> authentic defeat -> physical door -> floor nine -> outcome/restart. If any major visual/action defect persists, reopen the systemic issue. Do not advance to P1 until P0 proof is satisfied.

Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9`. Parent PR58 untouched. PR68 stays open and DRAFT. No force push, merge or deployment.
