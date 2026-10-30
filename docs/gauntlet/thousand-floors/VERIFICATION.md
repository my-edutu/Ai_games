# Review candidate verification — 30 October 2026

## Outcome

The implementation builds and the focused Game 4 checks pass. All six browser functional cases pass using the game's supported low-quality mode. Fresh critics closed the observed persistence and sampled next-landing framing defects. The fixed visual benchmark remains **not passed**; see [visual review 3](visual-critic-round-3.md).

## Commands and results

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` | Pinned dependencies installed; no dependency version changes |
| `npm run build` | TypeScript compilation passed |
| `npm run floors:build` | Browser ESM compilation of the same core passed |
| `npm run test:floors` | Three test files passed in 9.24 seconds; 15 campaign cases, four camera cases, three server cases |
| `FLOORS_TEST_QUALITY=low npx playwright test -c playwright.floors.config.cjs --trace off` | Six actual Chromium cases passed in 1.8 minutes |
| Independent campaign review 4 | No remaining P1 found within its bounded evidence; 6,024 successful save round trips, worker/server contracts and recovery matrix |
| Actual high-quality captures | No page errors; early district, aqueduct, coral archive, crown and portrait output inspected |
| Ten-district renderer cycle | Returned to exactly 50 geometries and 13 textures, matching the initial scene |
| `git diff --check` | Passed before publication |

The focused campaign tests include 3,000 seed/floor generation combinations, five full seeded campaign completions, 12,000 natural tick positions with restore/follow-on checks, actual contact-handler exercises, reward conservation and explicit checkpoint recovery. The independent review's round-trip count is repeated bounded checking, not that many independent seeds.

The camera regression reproduces the old floor-004 exit clipping using actual route data, then independently projects hero and landing bounds. It also exercises real floors 001–005 with one tick of presentation latency, crossing routes, portrait and a legacy cursor fallback. Mathematical projection checks do not substitute for occlusion inspection; the fresh visual critic also inspected the revised sequence.

## Browser coverage and performance limits

The six cases exercise autonomous progression, pause/resume, speed/camera/sound controls, verified save reload, portrait settings/no overflow, honest live progress, corrupt data preserved until explicit fresh start, and review mode leaving normal saved progress untouched. Some cases cover several related behaviours.

Initial high-quality runs hit delayed-query and total-test timeouts. Disabling trace snapshots reduced instrumentation overhead but did not establish fast high-quality rendering. Static batching and presentation snapshot coalescing reduce work; the quality fallback now responds to sustained wall-clock frame gaps and respects manual choices. The verified functional run explicitly selected the existing low tier and allowed 90 seconds per test / 15 seconds per assertion. **It is not evidence that default high quality meets a latency or frame-rate target.**

High-quality manual captures recorded active frame gaps up to approximately 3.3 seconds on this host. The exported 28-second motion clip is a 960×540, 12 fps encoding excerpt; encoding frame rate is not measured game rendering performance. Audio was toggled successfully, but no listening-quality comparison is claimed. The final portrait capture is paused; a complete portrait-motion or assistive-technology audit remains open.

The final progress page was also exercised after its media update: five history cards, three reference links, four capture links, and the 28-second clip loaded and played without page errors. Native MP4 plus WebM sources cover the inspected Chromium build, which has no H.264 decoder. Its reported graphics backend is ANGLE / Vulkan SwiftShader (Subzero), confirming software graphics for these captures.

## Resource evidence

An actual browser renderer consumed real generated snapshots for floors 1, 101, 201, 301, 401, 501, 601, 701, 801 and 901, then the original floor-1 snapshot. The small low-quality lifecycle probe used the same public renderer API; it was not used as visual benchmark footage. Geometry counts varied by district and returned from the last scene to the initial **50**. Texture counts remained **13**. This is a bounded GPU-resource cycle, not a JavaScript-heap, long-duration or production soak result.

The separate high-quality captures report 87–187 draw calls depending on the scene. The earlier approximately 970-call capture was a different state; the comparison demonstrates reduced submission overhead, not a controlled FPS improvement.

## Catalogue baseline

The earlier complete `npm test` run reported **120 of 123 test files passing**, with failures in Eko headless, Snake stream host and the phase-6 candidate script. Focused diagnosis exposed sandbox child-process restrictions; Eko and Snake's two affected files subsequently passed all seven checks with appropriate process permissions. The phase-6 candidate-script failure remains undiagnosed. No clean full-catalogue result is claimed, and unrelated game code was not modified to hide those failures.

## Reproducibility and disposition

[verification.json](../../../evidence/thousand-floors/verification.json) contains captured authoritative floors/ticks, renderer counters, resource-cycle rows and JPEG hashes. The source keeps save/campaign version 2 and render snapshot schema 1; the additive read-only traversal cursor changes camera presentation without changing rules or save checksums.

The branch is a draft review candidate. Remaining work includes stronger district architecture/materials, alternate route choice, broader accessibility/audio/context-recovery review and real-hardware performance evidence. No main merge, production deployment, live audience integration or AAA-equivalence claim accompanies this record.
