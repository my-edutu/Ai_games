# Autonomous Snake 3D — source-exact complete-world attribute bandwidth reduction (UNPROMOTED; NOT ACCEPTED)

**Date:** 2026-11-22. **PR:** [existing draft #52](https://github.com/my-edutu/Ai_games/pull/52), `feat/autonomous-snake-3d-gauntlet`, **unchanged live head** `bbce17cac5781b0a92ffe1bf55865cc8b8b06cea`. The exact official source archive (`source.tar.gz`, SHA256 `1b95e835b31db2223614a56a43fee9bce810da1d1156c689d78cc8e6914ec948`) and pinned dependencies (`node_modules.tar.gz`, SHA256 `b2437804b1b5e41b7590e8129b9f5c833f620f2c68bee57466bee0fe48d6dea8`) were hash-verified from the [successful offline reproduction run](https://github.com/my-edutu/Ai_games/actions/runs/45019872761). Five governing documents, live PR metadata, original current-head CI/browser jobs and logs were read. All six same-head Actions were completed; no evidence job cancelled. No main change or branch write.

## Source-backed defect and selected whole-scene target

The [same-head genuine Chromium run](https://github.com/my-edutu/Ai_games/actions/runs/45019872777) FAILS the **unchanged strict 1-second requirement** at **10 of 17 genuine complete WebGL renderer submissions** with 751×415 actual raster (browser **52/95**); [native CI](https://github.com/my-edutu/Ai_games/actions/runs/45019872716) **749/822**. Original real 1920×1080 and 390×844 imagery remains visually rejected: the large tiled rectangle dominates and the hero is small. The previously integrated **unpromoted** seven connected woodland floors, four-shore coastal relief, west/east hollow ruins and grounded piers, native T2 cervical repair and complete original CPU terrain/courtyard atlas recovery still await actual candidate Chromium. Since piling on more geometry risks greater GPU saturation, the current run targets a real bounded static-world vertex bandwidth cost **without reducing any of those integrated whole-game assets or the original benchmark**.

The candidate contains 13 complete native static PBR meshes, 33 game draw objects, four original world textures and original lighting/shadow maps. Before this change their shader input used 32-bit XYZ normals and 32-bit RGB vertex tint even though normals are unit range and all actual world tints are within [0,1]. The new `compactStaticWorldAttributes` is applied once AFTER the complete static world is built, displaced, UV-mapped, recoloured and (where needed) had its normals rebuilt. It encodes normals as native normalized signed Int16×3 and present vertex colours as normalized unsigned Uint8×3. It validates all inputs and precision bounds **before changing any attributes**, preserving full-precision XYZ positions, UVs, every index, actual triangles, PBR maps, shadows, camera metadata, current fog/water/hero and immutable simulation. No renderer test or buffer scale is changed. This is a material, **native-measured memory/upload representation change**, NOT a verified GPU queue or displayed FPS improvement.

### Exact paired native geometry and shader input report

| Real game board | Original normal+tint bytes | Candidate bytes | Saved bytes | Saved | Complete native triangles |
|---|---:|---:|---:|---:|---:|
| 8×8 | 1,076,412 | 536,766 | 539,646 | 50.13% | 71,058 |
| 28×16 | 1,735,788 | 865,374 | 870,414 | 50.15% | 98,312 |
| 40×24 | 1,928,748 | 958,614 | 970,134 | 50.30% | 106,712 |

Each row is from REAL Three.js 0.186.0 `createWorld` instantiated once in the previously validated **exact-head integrated baseline candidate** and again after ONLY this new optimization. Per-static-mesh **SHA256-identical positions/UVs/indices** in all three boards. Original 13 static meshes/33 draw objects/four textures/shadows/visibility block metadata retained; no geometry culled from the model. Actual maximum normalized normal reconstruction discrepancy is 0.000015260 per component; actual maximum tint discrepancy 0.001961, both within declared error bounds. This is not a frame comparison, GPU workload timing, or native device-present FPS. Machine-readable [paired samples](2026-11-22-bbce17-t4-complete-world-paired-native.json).

**Reproduce paired native buffers:** restore the official `bbce17` source archive and dependencies in two independent directories; apply the preceding cumulative `snake-bbce17-integrated-real-woodlands-cervical-t4-recovery-UNPROMOTED.patch` to both (the resulting world is the true immediately preceding control), then apply the NEW normalization changes to only the candidate tree. Execute:

```bash
node scripts/compare-snake-complete-world-attributes.mjs \
  /absolute/path/control/public/snake-stream/world.mjs \
  /absolute/path/candidate/public/snake-stream/world.mjs
```

The bundled script asserts exact SHA256 geometry/UV/index identities and bound checks on all three original complete boards and prints the machine-readable sample. The packaged source patch also contains the predecessor cumulative code; do not apply both *complete* patches in sequence to the same original archive, because the new complete patch already includes the predecessor. This report compares the original cumulative forest+ruins+hero baseline to that identical candidate with only the new T4 normalized shader inputs.

### Executed real RED/GREEN and regression evidence

- New authored test `tests/phase3/snake-t4-complete-world-bandwidth-run9.test.mjs`: **RED 0/2** on untouched GitHub source and **RED 0/2** against previously integrated unpromoted candidate. After production implementation **GREEN 2/2** with actual 8×8, 28×16, 40×24 world builds and decoded component precision checks, range-rejection checks and full source geometry/resource guards. No original test or acceptance threshold loosened.
- Focused new T4 + prior T1 woodland/ruins + T2 head/portal regression subset **15/15 PASS**, 25.1s; separate original-material/culling/CPU-art-cache compatibility subset **9/9 PASS**, 25.5s.
- `npm run build` **PASS**; unchanged original `npm run snake:stream:self-test` **PASS**, authoritative tick 900 / checksum `82492d82` / real restart / recovery / privacy; unchanged source-backed host simulation ownership. The larger affected set recorded 22 passes then **timed out at 120s**; it is NOT called green, and the full native suite remains unverified.
- **NOT executed/available on candidate:** true source-matched Chromium/WebGL 1920/390/detail/fruit/portal/hazard, uninterrupted 45–90s autonomous video, the untouched strict >=17 in three independent 1-second real full-render trials at useful raster, physical displayed >=30fps/p95, full 40+ segment soak and independent fresh-context whole-game critic. The approved coding tunnel remains unavailable and prior authorized Chromium attempts were administrator-blocked. This run did not bypass that restriction or claim an FPS win.

## Current milestone decision and required next action

**T0 UNSIGNED; T1 BUILDING / old whole-game visibly SELF-REJECTED / integrated candidate VISUALLY UNJUDGED; T2/T3 BUILDING; T4 HARD RED (live 10/17); independent review PENDING.** This exact original-source cumulative candidate is staged as a reproducible patch only. Never merge, deploy, force-push, cancel currently collecting CI or declare PS5/Snake Pass visual parity. On an authorized connected coding/browser runner, reconstruct this exact candidate and capture real identical-public-seed full overview/portrait/detail, 45–90s autonomous gameplay, GPU queue/present data and three strict original full-scene trials. If the actual full-frame composition remains a tiled rectangle, self-reject T1 and rebuild coherent scene composition/hero visibility, not more static micro-tweaks.
