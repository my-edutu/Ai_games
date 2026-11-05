# Independent runtime and evidence review — City / Flow

Reviewed 2026-10-30, approximately 21:07–21:17 UTC. Reviewer: independent `traffic_runtime_critic` agent. Branch: `codex/game11-city-traffic-gauntlet`; base commit `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31` with the uncommitted Game 11 implementation.

## Verdict

**Runtime delivery and build contract: scoped PASS on the current complete build. Evidence/reporting quality: REVISE for two P2 findings. No P1 was reproduced in this scope.**

Fresh compilation succeeded for both CommonJS and browser ESM without modifying the live output directory. Live HTTP responses served byte-identical local assets, including ESM identical to the independent fresh compilation. Four focused server tests passed. Current health and journal explicitly say development, production readiness false, and **REFERENCE LEADS**.

The two findings concern failure states: an incomplete build can still advertise `buildReady: true`, and the capture driver can exit successfully despite its own evidence recording source drift or rendering errors. They do not invalidate the separately inspected stable iteration-3 captures, whose reports remain available for assessment. They do mean future capture-command success is not yet a trustworthy acceptance gate.

## P2 findings

### R1 — Build readiness can be true when required game modules do not exist

**Location:** reviewed `scripts/serve-city-traffic.cjs`, lines 71–73.

`buildReady` checks only `dist/city-traffic-browser/simulation.js` and `public/ai-city-traffic/world.mjs`. A running browser also requires the entry HTML/module, styles, `world-assets.mjs`, audio module, compiled `traffic-network.js`, and local Three.js/OrbitControls dependencies.

**Actual reproduction:** the HTTP probe copies the unchanged server into an isolated temporary directory. It creates only `simulation.js` and `world.mjs`, leaving both `main.mjs` and the imported `traffic-network.js` absent. The isolated server responds:

```json
{
  "game": "ai-city-traffic",
  "status": "development",
  "buildReady": true,
  "productionReady": false
}
```

Both `GET /traffic/main.mjs` and `GET /traffic/runtime/traffic-network.js` return **404** in that same process. No live asset was removed or modified.

**Impact:** partial builds or missing dependencies appear ready to callers even though startup cannot succeed. The health route is also the browser runner's server-availability URL, so its status needs clear semantics. This is a development readiness defect, not a demand for production monitoring.

**Correction:** check an explicit required-asset manifest using readable regular files within the allowed roots, or rename the field to describe exactly the two-file check. Keep production/render/simulation readiness separate. Add a focused missing-required-asset regression test.

**Reproduction/evidence:** `runtime-probes.cjs`, last check; `runtime-http-probes.json`, `observations[0]` and the partial-build check. The reproduction succeeds when it demonstrates the defect; its `pass: true` is not a readiness acceptance verdict.

### R2 — Capture command accepts recorded render failures and mixed-source output

**Location:** reviewed `scripts/capture-city-traffic.cjs`, lines 18–19, 28 and 50–54.

The script collects browser errors, per-scene diagnostics and before/after source hashes, but never rejects those failures. It writes the report and exits zero even when `errors` is nonempty, a scene has `diagnostics.failed: true`, or `sourceStable` is false.

**Reproduction:** `runtime-evidence-gate-probe.cjs` executes the unchanged capture driver using a controlled browser interface and filesystem-read fault injection. This probe does not launch Chromium, generate screenshots or certify visual output. It directly verifies the driver's acceptance behavior.

| Controlled scenario | Observed driver exit | Saved report | Relevant reported result |
|---|---:|---|---|
| Clean control | 0 | Yes, six scenes | No errors; stable source |
| Console rendering error | 0 | Yes, six scenes | One recorded error; failed scene diagnostics |
| Source changes between hash passes | 0 | Yes, six scenes | `sourceStable: false` |

**Impact:** an automated review or operator relying on command success can treat failed or mixed-build captures as valid evidence. This matters during the active parallel revision process, where fresh stable output is a Gauntlet requirement.

**Correction:** preserve the report for diagnosis, then fail the command if browser errors, failed scene diagnostics, or source drift are present. Include an explicit evidence-valid flag/reasons, and require the expected complete scene set before accepting a run. A valid report still does not establish a benchmark win.

**Associated cleanup issue:** the initial `hashes()` call runs after browser launch but before the `try/finally` block. Injecting an initial `ENOENT` produces exit code 1 and leaves the browser unclosed in the controlled-interface probe. Move all post-launch work inside the cleanup boundary, or compute initial source hashes before launching.

**Evidence:** `runtime-evidence-gate-results.json` preserves all four scenarios, including cleanup; `runtime-evidence-gate-probe.cjs` contains the executable reproduction.

## Fresh checks and their limits

| Area | Actual verification | Result |
|---|---|---|
| CommonJS build | `npm run build -- --outDir /tmp/traffic-runtime-review-node` | Exit 0. An npm environment warning about `http-proxy` appeared; compilation succeeded. |
| Browser authority build | `node node_modules/typescript/bin/tsc -p tsconfig.city-traffic-browser.json --outDir /tmp/traffic-runtime-review-esm` | Exit 0. Both resulting JS modules match the served browser build by SHA-256. |
| Entry/module syntax | `node --check` on server, headless driver, capture driver, `main.mjs` and progress module | Exit 0 for each. |
| Focused server tests | `node --test tests/foundation/city-traffic-server.test.cjs` | 4 passed; 0 failed. Evidence: `runtime-server-tests.tap`. |
| Live local asset delivery | Actual GET requests to 15 game, vendor, runtime and progress assets at `127.0.0.1:4311` | All 200, no-store, nosniff; bodies match local file hashes. JS modules use JavaScript MIME. |
| Bootstrap CSP | Hash actual inline import-map and bootstrap bodies and compare to response CSP | Both exact hashes present. Local import map and local-only connection policy preserved. |
| Repository/traversal isolation | 20 raw HTTP paths, including encoded/double-encoded traversal, backslashes, null bytes, bad percent encodings, repeated separators and repository files | All rejected with 400/404; small generic responses. |
| Method boundary | POST, PUT, PATCH, DELETE, OPTIONS and TRACE to progress data | All 405 with `Allow: GET, HEAD`; file hash unchanged. |
| GET/HEAD/redirect contract | Three redirects; HEAD of main HTML, JS, health and missing asset | Correct locations/status; HEAD body empty and content length agrees with GET. |
| Published evidence links | HEAD all 11 captures listed by live progress JSON | Every listed capture exists and has nonzero length. |
| Invalid-request bounds | 20 KB URL and 20 KB request header | Both 431. |
| Small concurrency check | 32 concurrent health/missing-asset requests | All expected statuses; approximately 28 ms for this batch. This is not a throughput or load certification. |
| Configured deadlines | Instantiate current server and inspect timeout settings | Request 15 s, header 10 s, keepalive 5 s; Node connection check interval 30 s. No claim of exact 10/15-second wall-clock enforcement was made. |
| Headless command | `node scripts/run-city-traffic-headless.cjs --seed=11026 --ticks=900 --demand=1` | Exit 0; two 30-second simulated runs serialize identically; production false. |
| Headless input bounds | Eight negative, nonfinite, fractional, and over-limit tick/seed/demand cases | All reject with RangeError and nonzero exit. |

The live probe report records individual routes, lengths, hashes and timing, allowing current-file identity to be checked rather than inferred from a previously passing run.

## Integration and progress assessment

The checked bootstrap imports the shared compiled authority and runs it through a fixed-step accumulator. Presentation receives snapshots; the server exposes static game assets and a development health response, with no network mutation endpoint. The supported package scripts target the new game while leaving the existing catalogue scripts intact. The already pinned Three.js and TypeScript lockfile versions match the package declaration; this feature did not introduce an unlocked dependency.

The progress page uses text nodes for supplied copy, restricts capture names, requests no-store JSON updates, retains the last successful data on ordinary fetch failures, and defers polling while hidden. Its current content attributes browser checks to stable iteration 3 and explicitly says subsequent revisions need affected checks. It does not upgrade green code tests into commercial parity or production readiness. Historical capture labels and dates are retained.

The progress fetch has no application-level timeout, so a request that never settles can hold the single-flight polling flag. This is a limited robustness follow-up rather than an additional release blocker for the current local server. A bounded fetch deadline would improve recovery under a stalled connection.

## Reviewed identity and preserved evidence

The reviewed source copies and full manifest are in `runtime-reviewed-source/`. Key SHA-256 values:

- Server: `eb52c22767c471ae9f5c24a8ac357ac9678f0e7dc869e618b3632fa34303462e`
- Capture driver: `5c64467b051dbc68fd1dd5acf5751dba19e29e1567676a5cf29120ef1167aaa8`
- Headless driver: `0e5d824fd1ef3b77cc5669e0430e1f7a8a25962e20d47cef2554903a02908047`
- Main integration module: `0c8210d1e7d78d256f3e62961280835c961900d93bf5ac5db377aa6a12623f78`

`runtime-http-probes.json`, `runtime-server-tests.tap`, `runtime-headless-contract.json`, and `runtime-evidence-gate-results.json` contain the fresh results. Product files were not changed by this review; all writes were review evidence or isolated temporary compiler/fixture output.

## Scope exclusions

No Chromium instance was launched and no pixels, audio, FPS or refreshed UI/vehicle-art verdict were claimed. Existing stable iteration-3 browser evidence was treated as historical context, not a fresh run by this critic. Simulation fairness and vehicle art are owned by other active reviewers. The full catalogue was not rerun; the independently recorded baseline remains 120 passing and 3 failing test-file checks. Long-running soak, target hardware, public deployment, provider integration, automatic crash recovery and commercial benchmark parity remain outside this development-runtime pass.

Close R1 and R2 with focused failure-case verification, then obtain the coordinated fresh integrated render required for the active UI/art revision. The benchmark status remains **REFERENCE LEADS**.
