# Independent final fairness review probes

These files support `review.md`, the independent 2026-10-30 review of the Q1 request-age/corner-allocation change. **SPEC PASS / QUALITY PASS apply to Q1's causal ordering and age-persistence fix, with the original C1–C3 integrity guards retained.** They do not establish bounded waiting times, an overall visual/gameplay benchmark win, production readiness, or R5.

The actual reviewed candidate was freshly compiled into `/workspace/scratch/f951d9074684/traffic-fairness-final-compiled`. All current-candidate scripts used that build through `TRAFFIC_REVIEW_BUILD`; no archived compiled critic directory was reused. The separate old-authority counterfactual was freshly compiled from the previously reviewed source into `/workspace/scratch/f951d9074684/traffic-fairness-final-baseline-compiled`.

## Identity

| Source | SHA-256 |
| --- | --- |
| Current `simulation.ts` | `543b1ec46043142bc618dfae14a19aeb3ed6a208da5056b636a92aaf34a8c199` |
| Current `traffic-network.ts` | `1211706ca0504ed1f2699a807eb4f8798affd019a6692c02da4cd42a3c95ef32` |
| Pre-fix `simulation.ts` | `05c0bb42ad5d3d1b476289c8e9ce8cddbfe06f86df5fcbd47860a1ae58904d0b` |

Current configuration hash: `e630d7fa`; previous configuration hash: `4127a5e0`. Runtime: Node 24.22.1, TypeScript 5.8.3, fixed step 1/30 second. `candidate-manifest.json` records build and evidence hashes. `reviewed-source/` contains exact current source/test copies. The old source remains under `../probes/reviewed-source/`.

## Reproduce from the repository root

Use the pinned TypeScript executable to compile the retained source into fresh directories. Using the retained copies makes the evidence reproducible even after the working product changes.

```bash
./node_modules/.bin/tsc --target ES2022 --module CommonJS --moduleResolution Node --strict --esModuleInterop --skipLibCheck --rootDir evidence/ai-city-traffic/fairness-final/reviewed-source --outDir /tmp/traffic-fairness-current evidence/ai-city-traffic/fairness-final/reviewed-source/simulation.ts evidence/ai-city-traffic/fairness-final/reviewed-source/traffic-network.ts
./node_modules/.bin/tsc --target ES2022 --module CommonJS --moduleResolution Node --strict --esModuleInterop --skipLibCheck --rootDir evidence/ai-city-traffic/probes/reviewed-source --outDir /tmp/traffic-fairness-before-age evidence/ai-city-traffic/probes/reviewed-source/simulation.ts evidence/ai-city-traffic/probes/reviewed-source/traffic-network.ts
export TRAFFIC_REVIEW_BUILD=/tmp/traffic-fairness-current
export TRAFFIC_BASELINE_BUILD=/tmp/traffic-fairness-before-age
node evidence/ai-city-traffic/fairness-final/traffic-closure-probes.cjs
node evidence/ai-city-traffic/fairness-final/traffic-closure-restore-boundaries.cjs
node evidence/ai-city-traffic/fairness-final/traffic-closure-replay-fairness.cjs
node evidence/ai-city-traffic/fairness-final/independent-allocation-audit.cjs default
node evidence/ai-city-traffic/fairness-final/independent-allocation-audit.cjs high
node evidence/ai-city-traffic/fairness-final/independent-request-restore.cjs
node evidence/ai-city-traffic/fairness-final/causal-witness-and-tail.cjs
node --test --test-isolation=none --test-reporter=tap --test-name-pattern='older eligible|equal-age|yielding|pending citizen|fixed-step|normalized command' evidence/ai-city-traffic/fairness-final/foundation-production.test.cjs
```

Scripts write beside themselves. Copy this evidence folder before running a different candidate so the retained review observations are preserved. If `TRAFFIC_REVIEW_BUILD` is omitted, `authority.cjs` imports the normal repository `dist/games/ai-city-traffic/src/`; that fallback must not be mistaken for the reviewed candidate unless its hashes match.

## What each probe establishes

| Probe / results | Question and result |
| --- | --- |
| `independent-allocation-audit.cjs`; `independent-allocation-default.json`, `independent-allocation-high.json` | Every allocation write during two 15-minute production scenarios. 2,190 grants, 245 contested grants, zero older-eligible bypasses, 119 older/higher-ID wins, 16 safe releases preserving request age. Thirty minute checkpoints match uninstrumented production runs byte for byte. Includes per-tick and one-second latency observations. |
| `independent-request-restore.cjs`; `independent-request-restore.json` | Fifteen malformed age/approach states reject atomically, old config rejects, and six genuine age states restore and continue exactly for 180 ticks. |
| `causal-witness-and-tail.cjs`; `causal-witness-and-tail.json` | Two genuine physical states are run through current and old production authorities: old lower-ID wins become current older-request wins. Also directly records citizen 7's surviving 227.4-second stop and its staging/reservation dependencies. |
| `traffic-closure-probes.cjs`; `traffic-closure-probe-results.json` | Exact original C1 every-tick separation and C2/C3 adversaries, plus checksum rejection atomicity. |
| `traffic-closure-restore-boundaries.cjs`; `traffic-closure-restore-boundaries-results.json` | Ten old semantic-adversary rejections and ten genuine green, clearance, corner, crossing, and completion-window restores, with 90-tick continuation. |
| `traffic-closure-replay-fairness.cjs`; `traffic-closure-replay-fairness-results.json` | 15-minute high-demand command scenario, cohort progress, tick-10800 restore continued through tick 27000, and command-17 rate-limit atomicity. |
| `foundation-production.test.cjs`; `focused-inprocess-tests.tap` | Six selected repository tests run against the fresh build: render-read schedule, command replay, older-vs-lower-ID landing, equal-age clearing priority, yielded-age continuation, and age-state validation. |

The original closure scripts and focused repository tests were copied with only module-import/output-location adaptation. The three `independent-*` / `causal-*` probes were written for this review, rather than treating the builder's audit as independent evidence.

The allocation observer temporarily wraps the runtime corner-owner array to observe all actual writes. It does not rewrite production source or decisions. Independent eligibility calculations use recorded pre-movement geometry and actual signal state. Every minute it compares the observed execution with a separate unmodified execution. No same-tick release/regrant or natural equal-age clearing contest happened in these two scenarios; the instrumentation covers such writes, while the explicit focused fixture exercises equal-age clearing.

`oldHighCitizen20Interval` applies only to the high scenario and `oldDefaultCitizen44Interval` only to the default scenario. One-second sampled stop durations and exact per-tick durations are distinct measures; do not mix them. The default sampled stop count over 60 seconds rose from 89 to 105 while stops over 120 seconds fell from 15 to 3. The high scenario's total completed citizen journeys fell from 180 to 166. These changes remain visible in the verdict.

The first old closure probe is observational: exit 0 means it produced observations. Its JSON must be checked for actual overlap counts and typed rejection results. The allocation, request-restore, causal-witness, and restore-boundary probes provide explicit `pass` fields; the replay and focused tests use assertions. A successful process exit alone is not a commercial or operational quality verdict.
