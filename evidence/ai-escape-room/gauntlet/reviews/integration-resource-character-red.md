# Integration resource and character regressions — confirmed failing

Date: 2026-10-30. Chromium with SwiftShader, single worker, live assets from localhost:4177. Production EscapeRuntime frames, seed `gauntlet-vault-reference-v1`. These observations are runtime evidence, not builder claims.

## P1: Retired vault instances leak GPU buffers

The test “replacing animated mechanisms releases GPU instance buffers as well as geometries” instruments the real WebGL context's `createBuffer` and `deleteBuffer` methods. Bookkeeping uses WeakSets and does not retain the buffer objects. It renders each replacement, warms the caches, and measures at the same opening state after every escaped → opening cycle.

| Replay cycle | Buffers created | Buffers deleted | Outstanding buffers | Three geometry count |
|---|---:|---:|---:|---:|
| 0 | 737 | 393 | 344 | 106 |
| 1 | 1132 | 786 | 346 | 106 |
| 2 | 1527 | 1179 | 348 | 106 |
| 3 | 1922 | 1572 | 350 | 106 |
| 4 | 2317 | 1965 | 352 | 106 |
| 5 | 2712 | 2358 | 354 | 106 |

Observed assertion: expected at most 347 after warm-up; received 354. The linear growth is two unreleased buffer objects per replay cycle. These counters measure buffer objects, not GPU bytes.

A separate read-only reviewer traced the installed Three.js implementation: `WebGLBindingStates` stores instance-specific binding state under shared geometry ID, object ID, and program ID; its cache strongly references the instance matrix. `Object3D.clear()` removes children without disposing them. `InstancedMesh.dispose()` triggers `WebGLObjects` to release the object's vertex-array bindings and `WebGLAttributes` to delete its instance-matrix buffer. The cached bolt geometry remains alive, so forgetting the instance cleanup retains that state. `renderer.info.memory` reports only geometries and textures, hiding this leak.

Minimal correction for source owner: dispose retired `isInstancedMesh` nodes before clearing the dynamic root, independently of disposing owned batch geometries. Keep cached shared geometries and materials alive.

The earlier five-cycle, four-theme, three-frame resource test had reported a perfectly flat 107 geometries, 20 textures, 15 programs, and 160 cached geometries. This illustrates why the additional raw buffer counter was necessary.

## P2: Character camera heavily crops the Archivist at the left wall

The test “character view keeps the entire Archivist visible beside real wall mechanisms” uses the real target-05 frame, activates the actual Viewing options → Meet the Archivist control, then projects the actual actor bounds with the actual rendered camera.

- Actor position: `[-4.72, 1.85, 2]`.
- Camera position: `[-5.55, 2.45, 1.0342726233009234]`.
- Projected actor bounds: x extends approximately -1.371 to 1.090; y extends -3.419 to 3.310, far outside the visible normalized range of -1 to 1.
- The outward-facing camera offset is clamped against the room wall, collapsing the intended subject distance.

The explicit full-page image `character-left-wall-red.png` was captured before assertion and visually inspected. It confirms a very large cropped face/body: the head's top and lower chassis are cut off, and the progress display covers part of the lower figure. This is not merely a conservative bounding-box failure.

## Reproduction and retained evidence

Run the browser test file with a single-worker config, the existing localhost:4177 server, and Chromium args `--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`.

- `browser-character-buffer-red.json`: two passing camera fixes and the two failing regressions above.
- `trace-character-red.zip`, `trace-gpu-buffer-red.zip`: retained traces of the original failed batch.
- `character-left-wall-red.png`: explicit visual proof, captured by the focused character rerun.

No performance or production-soak claim is made from SwiftShader runs.
