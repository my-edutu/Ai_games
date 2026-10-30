# Inspection framing proposal

## Scope

Apply `inspection-framing.patch` to the repository. It changes only `public/ai-escape-room/bootstrap.js` and adds `tests/escape-room/gauntlet-inspection-framing.test.cjs`. The patch preserves the newly integrated `network.js` import. `git apply --check` passed against the current live bootstrap. No live runtime source has been changed by this builder.

## Diagnosis and decision

Round 04's mechanism still shows a near-frontal vault with its lower flange obscured by the progress HUD. Its mobile image is room overview, so it does not demonstrate portrait inspection. The production inspection implementation placed the eye at a fixed 2.15 distance and verified only the object origin. The new test reproduces full geometry escaping the usable viewport: desktop vertical bounds 70.1–896.1 px versus the reserved 154–727 px; portrait horizontal bounds −77.4–433.0 px versus 16–348 px. Its horizontal view angle was 4.57 degrees.

The proposal fits the real object's bounds, including its preserved staticRoot geometry, within actual HUD rectangles. It uses the object's actual rotation and an inward side choice for an approximately 31.8 degree oblique view. A bounded distance search chooses the nearest fit up to the unchanged 3.6 maximum. Existing field of view is unchanged: 46 degrees for the measured desktop and 52 for portrait. Resize refits an active inspection. The danger ribbon receives reserved space before it appears. Camera diagnostics add `inspectGeometryVisible` for the planned pose, and identify the camera rig as `bounded-geometry-fit-v2`.

Geometry-only measurements with the danger ribbon present:

| Stage | Distance | Horizontal oblique angle | Physical vertical bounds |
| --- | ---: | ---: | --- |
| 1256 × 862 | 3.277 | 31.799 degrees | 160.4–696.6 px |
| 364 × 576 | 3.586 | 31.799 degrees | 146.0–425.9 px |

The bound calculation still includes invisible original static meshes, so retaining those nodes while moving visible batches to a separate render group remains compatible. The fit occurs only on inspection/resize and uses at most twelve candidate camera poses. It does not add draw submissions or change authoritative state, gameplay, snapshots, mechanism construction, or materials.

## Verification

- `inspection-red.txt`: five expected failures against the original production implementation, before implementation changes.
- `inspection-danger-css-red.txt`: the later focused danger-caption reservation test failed before its corresponding correction.
- `inspection-green.txt`: all six focused tests pass against the candidate. Tests use the real production Three.js mechanism geometry and camera math; DOM rectangles are explicit layout fixtures. They cover desktop/portrait full bounds, oblique depth, eight mechanism families across locked/solved and wall-placement variants, immutability, resize, and danger caption clearance.
- `inspection-affected-regression.txt`: ten existing mechanism, overview, successful-intermission, and renderer-lifecycle Node tests pass. These use live unchanged production files, so they are regression context rather than evidence that the candidate has been integrated.
- `inspection-metrics.json`: numeric candidate projections using real geometry and reserved HUD fixture rectangles.
- `node --check bootstrap.js`: passed.
- `git apply --check inspection-framing.patch`: passed.

The Three.js CommonJS deprecation warning is present in this repository's existing tests and the new test; no test failures were suppressed. Node's default subprocess isolation did not expose assertion detail in this tool environment, so the final focused run used `--test-isolation=none`.

## Reproduce and integrate

From the repository, apply the patch once the live freeze ends:

```sh
git apply /tmp/escape-inspection-builder/inspection-framing.patch
node --test tests/escape-room/gauntlet-inspection-framing.test.cjs
```

To rerun the unintegrated candidate with the observed environment:

```sh
ESCAPE_REPO=/workspace/scratch/4b9cf76baf7a/ai-escape-room ESCAPE_BOOTSTRAP=/tmp/escape-inspection-builder/bootstrap.js node --test --test-isolation=none /tmp/escape-inspection-builder/gauntlet-inspection-framing.test.cjs
```

Full `npm test` is deferred to the lead's integration gate because it builds live dist during the active runtime freeze. No Chromium was launched. Fresh actual renderer captures of desktop and portrait inspection, and independent visual review, remain the acceptance gate; these geometry results do not establish visual parity with the fixed references.
