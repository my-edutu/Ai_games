# Independent traffic authority closure probes

These probes and retained JSON observations belong to the independent 2026-10-30 closure review. See `../simulation-closure-review.md` for the separate specification and quality verdicts. The original C1–C3 findings are closed on the hashed candidate; Q1, unfair pedestrian corner/landing service with multi-minute waits, remains open.

## Candidate and execution identity

The complete hash manifest is `traffic-closure-manifest.json`. Reviewed production source:

- `simulation.ts`: `05c0bb42ad5d3d1b476289c8e9ce8cddbfe06f86df5fcbd47860a1ae58904d0b`
- `traffic-network.ts`: `1211706ca0504ed1f2699a807eb4f8798affd019a6692c02da4cd42a3c95ef32`

Exact source copies are retained in `reviewed-source/` so the evidence remains attributable after future product changes. Runtime: Node 24.22.1, TypeScript 5.8.3, fixed authority step 1/30 second, deterministic version `city-traffic-1`, configuration hash `4127a5e0`.

The actual review compiled the current source into a new isolated scratch directory and imported that build. The archived old critic build was never reused. The copies here differ from the executed scripts only in module-import and JSON-output paths; reverse path replacement was checked for exact equality. Relocation did not cause another corpus run.

## Run from the repository root

First verify that the production source hashes match the intended candidate. Compile the production authority with the repository build:

```bash
npm run build
```

Then execute the probes:

```bash
node evidence/ai-city-traffic/probes/traffic-closure-probes.cjs
node evidence/ai-city-traffic/probes/traffic-closure-replay-fairness.cjs
node evidence/ai-city-traffic/probes/traffic-closure-restore-boundaries.cjs
node evidence/ai-city-traffic/probes/traffic-closure-pedestrian-latency.cjs high
node evidence/ai-city-traffic/probes/traffic-closure-pedestrian-latency.cjs default
node evidence/ai-city-traffic/probes/traffic-closure-corner-fairness.cjs high
node evidence/ai-city-traffic/probes/traffic-closure-corner-fairness.cjs default
```

Each script imports `../../../dist/games/ai-city-traffic/src/` relative to this folder and writes its JSON beside itself. Run a later candidate in a separately named sibling probe folder to preserve this review's results. Current-source execution cannot be represented as the same candidate after source hashes change.

## Evidence meaning

| Probe | Actual question | Retained result |
| --- | --- | --- |
| `traffic-closure-probes.cjs` | Every-tick separation through 60 seconds; exact old forged completion and reservation cases; checksum rejection atomicity | `traffic-closure-probe-results.json` |
| `traffic-closure-replay-fairness.cjs` | 15-minute command scenario, byte-identical continuation, vehicle and pedestrian cohort progress, command 17 atomicity | `traffic-closure-replay-fairness-results.json` |
| `traffic-closure-restore-boundaries.cjs` | Ten typed atomic malformed-state rejections and ten genuine restores with 90-tick continuation | `traffic-closure-restore-boundaries-results.json` |
| `traffic-closure-pedestrian-latency.cjs high` | Exact per-tick citizen-20 stationary interval during the high-demand scenario | `traffic-closure-pedestrian-latency-high.json` |
| `traffic-closure-pedestrian-latency.cjs default` | All 48 citizens' stop intervals at one-second samples through 15 minutes of default demand | `traffic-closure-pedestrian-latency-default.json` |
| `traffic-closure-corner-fairness.cjs high/default` | Actual corner ownership changes and movement-guard dependencies causing the long waits | `traffic-closure-corner-fairness-high.json`, `traffic-closure-corner-fairness-default.json` |

The first, latency, and fairness probes are observational: exit 0 means the observations were produced, not that the candidate passed every quality criterion. The restore-boundary probe additionally sets nonzero exit status if its declared rejection/continuation gate fails. The replay probe uses assertions for byte identity. Read the JSON and the review verdict; do not turn every exit 0 into a blanket pass.

The fairness probe reads the compiled class's runtime state for diagnosis without modifying it. Its `reasons`/dependency observations derive from the existing movement guards. The separate latency probe observes public production snapshots. This distinction keeps direct output evidence separate from the explanation of why the output occurs.

No broad catalogue test rerun, browser rendering verdict, commercial comparison win, or production/R5 claim is attached to these probes.
