# Tiny Kingdom recovery review — 2026-10-30

## Scope and provenance

Continue the approved Game 5 Gauntlet without overwriting inaccessible newer work. The prior worker tunnel was disconnected; `feat/tiny-kingdom-pagonia-upgrade` was not available remotely. This pass recovers the saved `a52df9e1b42a46a12a58c5daa3161d79a21d8f66` source into a separate branch. Main and the original Tiny Kingdom branch remain unchanged.

Verified implementation commit: `73f23210b8835bd6006c1bb3830eb72a5730ba3d`.
Game source SHA-256: `f7ae295be845aaa45d885e80d75b3820d69ca3838acd81f2ac4c425f0988c44a`.
CI evidence: https://github.com/my-edutu/Ai_games/actions/runs/41138125096/artifacts/13017866262 .

## Requirements addressed

- Arrival starts a stationary work interval; travel time cannot produce an immediate work reward.
- Failed navigation cannot grant work rewards at the wrong location.
- Working, walking, resting and waiting poses are distinct. Resting and waiting feet stay planted.
- Six profession-specific tools or accessories share the actual animated wrist joints. These are equipment, not a simulated cargo inventory.
- Cottage gables and ceramic roof tiles face outward/upward. Boot contact height is corrected.
- `seeded-work-v2` records the changed reward cadence. Legacy v1 snapshots migrate deliberately; valid v2 snapshots preserve exact in-progress replay. Rendering remains read-only and does not consume authoritative RNG.
- The launcher's new journal and image/JSON routes are explicitly allowlisted. Inline scripts/styles retain hashed CSP; no provider integration or secrets added.

## Evidence actually inspected

| Check | Result |
|---|---|
| Initial focused reproduction | 2 passed, 5 failed before implementation |
| New focused checks | 11/11 passed locally and in GitHub Chromium |
| Existing Tiny Kingdom browser regressions | 54/54 passed in GitHub Chromium (2.8 minutes) |
| Catalogue TypeScript compile | Passed |
| Stream-server self-test | Passed locally and in GitHub |
| Dedicated HTTP evidence-route test | 1/1 passed locally after reproducing 404; not claimed as CI-tested |
| 90 simulated days | Passed; 27 citizens, 24 buildings, 394.5907867 food, 21.2 wood, 555.2 gold; 24 citizens with friendship links; every citizen position walkable |
| Candidate WebGL frames | Actual ANGLE/SwiftShader captures; zero page exceptions or invalid mesh components |
| Full catalogue test run | INCOMPLETE: exit 124 at the 150-second diagnostic cap after 478 passing test records; no final test summary |

The workflow's green overall status is not a full-suite pass: its catalogue diagnostic uses `continue-on-error`. The artifact's `verification-boundaries.json` records `catalogueOutcome: failure`. Local catalogue execution also lacked `three` and timed out. Neither run proves a clean complete catalogue.

`npm ci` reported two high-severity dependency vulnerabilities. Advisory details and remediation were not assessed in this pass. Do not apply an unreviewed force upgrade or call this production-ready.

## Visual review — self-review, not an independent critic

Actual baseline and candidate WebGL cottage screenshots at the same camera show the previously missing roof halves and gables now closed and correctly visible. The market overview is coherent and renderer geometry is finite. This is a real source-level improvement, not a replacement image.

Remaining high-impact gaps:
1. Repeated cottage silhouettes and sparse gardens make the settlement feel generic; public spaces need stronger composition and purpose.
2. Lighting and surface response remain flat, with large simple ground shadows and limited material variation.
3. The current close citizen camera is partly blocked by buildings. It is insufficient evidence for facial quality or tool animation; capture unobstructed close-ups and continuous work routines next.
4. Characters are still procedural assembled geometry, not fully authored commercial-quality characters. Cargo chains, richer social routines and animation blending remain open.
5. Frame rate was not measured. The manifest's 12 fps value is a renderer target, not achieved hardware performance. Local Canvas2D fallback frames also show depth-sorting artifacts.

No fixed-reference blind A/B was performed in this pass. No independent fresh-context critic or Ultracode execution was available. Commercial benchmark verdict: NOT PASSED.

## Review of tooling and operations

The guarded recovery script refuses unfamiliar source hashes. The first CI before/after run is valid. Before re-running this bootstrap workflow after the candidate is committed, preserve or restore the pinned baseline: otherwise its initial capture would show the candidate labelled as 'before'. Also harden piped test steps with explicit pipefail and make full required verification fail closed before promotion. These are review blockers, not proof of game failure.

The 90-day campaign is accelerated simulation, not a 90-day real-time service soak. This remains a browser-authoritative prototype, not a production service or shared GameModule integration.

## Rollout / rollback and next gate

Keep the recovery change as an unmerged draft stacked on the existing Tiny Kingdom branch. Review the exact implementation and evidence before merging. Rollback means leaving this branch unmerged or reverting the cohesive implementation commit; export saves first because original v1 code does not understand v2 saves.

Next build: unobstructed character/work-sequence capture, richer market district composition and materials, then real-time performance profiling. Fresh independent builders/critics must resume the fixed Pioneers of Pagonia comparison when that runner is connected. Do not lower the bar to the recovered prototype.
