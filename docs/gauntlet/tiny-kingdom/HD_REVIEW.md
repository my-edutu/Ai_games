# Tiny Kingdom HD pass — 31 October 2026

Continue Game 5's approved Pioneers of Pagonia Gauntlet on draft PR59. Do not merge, replace the original branch, or claim a benchmark win.

## Implemented and pinned locally
Compact charcoal/brass contextual HUD, six inspector panels, explicit native-HD / 80% / 60% rendering choices; a bounded 2048px depth-texture sun map with 3x3 PCF; linear fragment lighting, tone mapping, original material detail and local night lamp spill. Corrected cylinder/cone winding; exterior gable framing, side windows/shutters, planted borders, hall gallery, draped market cloth and bounded surrounding terrain. The Gauntlet journal remains separate at /tiny/hd.

Input game SHA256: f7ae295be845aaa45d885e80d75b3820d69ca3838acd81f2ac4c425f0988c44a .
Tested HD game SHA256: b729a47541cf68509420bb685a9bdff4045f5a4461767d80f42b90a2d194d4e5 .

## Verification boundary
Locally: 10 new HD/geometry/interface checks plus 11 existing focused simulation/save checks pass; an additional HTTP/CSP/allowlist check passes. TypeScript compile and stream self-test pass. RED-to-GREEN findings included missing lighting/panels, inward primitive winding, missing district detail, stale resize readout, hidden gable bracing and missing journal route. The no-depth-extension test was a passing edge-case test, not a claimed reproduced defect.

The 90-simulated-day result retains 27 citizens,24 buildings,food394.5907866665433,wood21.200000000000657,gold555.1999999999963 and24 citizens with friendship links; every position is walkable. Rendering and inspector changes do not mutate saved state or authoritative RNG. This is not a real-time soak.

Existing browser regressions are adapted to open the actual contextual panels, inspect depth-map shadows when supported, and retain geometric-shadow checks on fallback. No simulation, save, economy or navigation assertions are removed. CI must verify this broader suite separately.

Local npm test completed with 380 passes and33 failures while dependencies could not be installed (package registry unreachable). Read CI logs with installed dependencies before claiming complete catalogue success or interpreting those failures as new product regressions. The earlier dependency audit warning is unresolved.

## Self-review, not independent criticism
The worker tunnel is offline. No independent fresh-context critic, Ultracode run or blind Pagonia win was performed. Actual 1920x1080, 390x844, dusk/night and live-browser recordings are inspected. The visual bar is NOT PASSED: architecture is repetitive, foliage sparse, distant terrain/riverbanks simple and people still procedural. This is stylized HD, not photorealistic or AAA.

Software WebGL is slow: short local recordings are around one to two frames/s depending on contention. These prove live execution, not smooth hardware performance. No 30/60fps, mobile hardware, memory-soak or production claim is made. Further work needs richer authored assets, district variation, animation scrutiny and hardware profiling.

## Delivery / rollback
The one-time assembler refuses unfamiliar source hashes and produces only the exact tested candidate. The baseline capture also rejects an upgraded source instead of relabelling it as before. Plain migration fragments and checked patches are delivery provenance, not new runtime dependencies: the game remains standalone HTML. The old auto-mutating recovery workflow becomes read-only manual verification. Draft-only writes are allowlisted; full catalogue failure must remain a failed final CI gate even if the draft source is preserved for review.

Rollback by leaving the draft unmerged or reverting the cohesive HD implementation. Save schema remains seeded-work-v2. Ruling: preserve the existing engine and simulation for this pass to avoid behavioral regressions; cost is continued procedural-art/allocation limitations. Ruling: self-review while workers are offline, leaving the independent gate open. Deferred: authored realism, full reference comparison, hardware performance, production integration and dependency remediation.
