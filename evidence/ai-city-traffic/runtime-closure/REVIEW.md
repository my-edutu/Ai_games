# Independent runtime finding closure — City / Flow

**Verdict: scoped PASS. Prior runtime findings R1 and R2 are closed for the exact source versions below.** This is a runtime readiness/evidence-command verdict, not a game-completion, visual-quality, commercial-parity, or production-readiness verdict.

Reviewer: independent `runtime_closure_review` agent, 2026-10-30. Base commit: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`; branch: `codex/game11-city-traffic-gauntlet`, with uncommitted Game 11 changes. Final source identity was rechecked at 21:27:17 UTC. Node: v24.22.1 on Linux.

The reviewer read `AGENTS.md`, the active phase/ledger/plan, the repository reliability and readiness-review guidance, the earlier `../runtime-review.md`, and the implementation itself. The reviewer did not author or modify product code. All review writes are under this directory or in deleted isolated temporary fixtures. No Chromium process was launched by this review.

## R1 — Required asset readiness

**Closed after one additional independently reproduced correction.** The complete required-route manifest fixes the earlier two-file false-ready case. It covers the current entry HTML, stylesheet, main/world/world-assets/audio modules, both compiled authority modules, and the three local Three.js/OrbitControls modules in the startup import graph.

The first closure run also found a remaining false-ready condition: a nonempty `main.mjs` existed but had mode `000`, and the isolated server ran as unprivileged uid 65534. Health returned `buildReady: true`; requesting that same module returned HTTP 500, with `EACCES` in the server's stderr. This was an actual filesystem/HTTP reproduction, not an injected mock result. The initial code checked metadata but did not check readability.

The lead then added `fs.accessSync(file, fs.constants.R_OK)` after the path-containment, regular-file and size checks. The reviewer reran the same probe against the new source. The unreadable file now produces `buildReady: false`, and restoring its permission restores readiness. The initial failing source and result remain in `server-review1.cjs` and `server-review1-results.json`; they were not replaced by the successful rerun.

| Independent isolated readiness scenario | Cases | Expected and observed final result |
|---|---:|---|
| Complete required-asset fixture, including recovery after faults | 2 | `buildReady: true` |
| Original two-file partial build | 1 | `buildReady: false`; missing main module returns 404 |
| Remove each required asset in turn | 11 | `buildReady: false` every time |
| Empty each required asset in turn | 11 | `buildReady: false` every time |
| Required path is a directory | 1 | `buildReady: false`; asset request returns 404 |
| Required symlink points outside its allowed root | 1 | `buildReady: false`; asset request returns 403 |
| Required file exceeds the 24 MiB serving limit | 1 | `buildReady: false`; asset request returns 404 |
| Required file is unreadable by the server uid | 1 | `buildReady: false`; asset request returns 500 |
| **Total** | **29** | **29 expected readiness outcomes passed** |

All eleven nonempty fixture assets also returned HTTP 200. Every health response retained `productionReady: false`. The source hash remained unchanged during each probe run.

Executable probe: `server-probe.cjs`. Final observations: `server-review2-results.json`. Final reviewed source copy: `server-review2.cjs`. The fixtures contain minimal nonempty bytes; this deliberately tests asset availability rather than compilation or browser execution. The manifest must remain in sync when startup dependencies change.

## R2 — Capture acceptance and cleanup

**Closed for the reviewed capture driver.** Initial fingerprints are computed before browser launch. All work after a successful launch is inside the cleanup boundary. Reports are retained for runtime capture failures when the destination is writable; browser closure is in a nested `finally`, so failure to write a report does not skip cleanup. The command rejects recorded browser errors, failed diagnostics, unavailable WebGL, interrupted capture and source changes with a nonzero exit.

The independent probe executes the unchanged driver in a VM with a controlled browser interface. The page evaluation callbacks execute against a fixture `window.cityTraffic` object. This verifies command acceptance and resource handling; it produces no pixels and makes no rendering-quality claim. Faults are injected into events, diagnostics, filesystem reads, browser setup, capture steps and report writing.

| Controlled scenario | Driver exit | Saved diagnostic report | Cleanup result |
|---|---:|---|---|
| Clean default run | 0 | Exactly six ordered default scenes, complete and source-stable | One close call |
| Console warning control | 0 | Six scenes; no recorded error | One close call |
| Clean `--details` run with three pedestrians and car/bus/van present | 0 | Exactly fourteen ordered scenes | One close call |
| Console error or page exception | 1 each | Error retained | One close call each |
| `diagnostics.failed: true` or `webgl: false` | 1 each | Failed diagnostics retained | One close call each |
| Source bytes change after the initial fingerprint | 1 | `sourceStable: false` | One close call |
| Final source fingerprint throws | 1 | `sourceStable: false` and fingerprint error retained | One close call |
| Initial source fingerprint throws | 1 | No report; failure precedes browser launch | Browser never launched |
| Browser launch rejects | 1 | No report | No browser instance returned |
| Page creation, navigation, or readiness wait rejects | 1 each | `complete: false` and execution error retained | One close call each |
| Third screenshot rejects | 1 | Two completed scenes plus execution error retained | One close call |
| Report write rejects | 1 | Destination write failed | One close call still occurs |

**All sixteen controlled scenarios produced their expected outcomes.** The default sequence remains `aerial`, `street`, `follow`, `night`, `mobile`, `mobile-experiment`. Detailed entity captures are conditional on entities available in the snapshot; the fourteen-scene assertion here applies to the declared fixture, not to every possible live population.

Executable probe: `capture-probe.cjs`. Full observations and the driver's diagnostic objects: `capture-review1-results.json`. Reviewed driver copy: `capture-review1.cjs`. The nested diagnostic objects retain the driver's own method string, but these probe records are explicitly controlled-interface evidence, not actual browser captures.

## Focused repository verification

The reviewer ran:

```sh
node --test tests/foundation/city-traffic-server.test.cjs tests/foundation/city-traffic-capture.test.cjs
node --check scripts/serve-city-traffic.cjs
node --check scripts/capture-city-traffic.cjs
```

The two test files reported **11 passed, 0 failed, 0 skipped**, in 573.840319 ms. Both syntax checks exited zero. Raw test-runner output is `focused-tests.log`; the tested test-file copies are in `reviewed-tests/`.

Loopback tests and the real unreadability fixture ran with approved execution access. An earlier restricted attempt failed to construct the uid-restricted child (`spawn EINVAL`); it contributed no passing evidence. The successful fixture ran at uid 65534, making the permission test meaningful even though the review process itself used uid 0.

## Exact reviewed identities

| Source | SHA-256 |
|---|---|
| Final server, R1 closed | `a6e2292541f25c5ae40802b1eaed14b155a94b1d956c3792390994188d7784fc` |
| Capture driver, R2 closed | `eebb974b752a2d1a4091265942f2e16eb8cffc026ccdd6bc6adb5333bf00fcdd` |
| Server before additional readability correction | `fc9177c185804da64006bec0fc981835a49bba5ff22b02971e8f4a85938963a3` |
| Focused server test | `9012acffd15d8d791cc49bb95fbff3be5cce96547e37deefcba27e3fe836300d` |
| Focused capture test | `8261fd6282cf6cd8dc5d41a7009d6b6980c2611ad4ff5d91aa2a03b2c849d87a` |

`manifest.json` records source identities, commands, outcomes and hashes of the portable review evidence. The original runtime review and its artifacts remain unchanged.

## Scope and residual limits

No remaining load-bearing R1/R2 defect was reproduced in this scope. `buildReady` means the current required assets are present, regular, contained, nonempty, within the serving size limit and readable. It does not validate JavaScript semantics, successful simulation progress, rendering or future file availability.

The capture driver's before/after comparison covers its eight listed game/compiled-source files. It is not an atomic build snapshot and does not fingerprint the vendor modules, server or driver itself; this review separately pins the server and driver above. Initial fingerprint and launch failures exit before a report is written. A report-writing failure cannot retain a report at that failed destination, but does reject the run and still invokes browser cleanup.

This reviewer did not launch Chromium, inspect refreshed pixels, measure FPS/audio, rerun fairness or the full catalogue, perform a soak, test public deployment, or assess commercial benchmark parity. The lead's separate live capture run is not claimed as this reviewer's evidence. Production readiness and the benchmark status are unchanged by this scoped closure; the benchmark remains **REFERENCE LEADS**.
