# Tiny Kingdom — Living Valley Visual Direction Workstream

Status: **active, NOT PROVEN**, on draft PR #64 only. The pinned comparison remains G088 at `2f6deb43feb1a1557848d44def53a6109deb1ab1`; NEVER advance the baseline. Do not merge without new user approval. Do not integrate PRs #43, #59 or #62.

## The single integrated goal

Make the **running, autonomous** medieval village legibly more convincing across its Day-1 arrival, an authentic worker's task, a market walk, and the populated Day-120 view at desktop and 390px: warm/cool believable illumination, restrained materials, depth and weather, intelligible human motion, and a world-first medieval command interface. Compare real official Manor Lords imagery as an eventual quality bar, with Foundation and Farthest Frontier secondary; create original content only.

## Starting evidence (not a transformation pass)

The G164 real same-seed capture is [artifact 13230152415](https://github.com/my-edutu/Ai_games/actions/runs/41634064285/artifacts/13230152415). It shows a washed-out distant landscape, flat walls/tree forms, roof geometry dominating the overview and mobile worker views, neon teal UI framing, and low-performing real SwiftShader rendering. G164's verified accelerated 120-day run recorded 28 citizens, 37 buildings, 150,967 triangles, identical replay, 2.306 observed **software** FPS and CPU p95 366.5 ms. These figures are NOT hardware-GPU performance. G164 and G163's Day-120 overview differed by only 0.33% of pixels above the 10/255 threshold: earlier work was not a visual experience milestone.

## Style constitution (original assets only)

- **Lighting:** cooler sky fill in shade, warm solar highlights, legible directional form in roofs, stone and plaster, coherent 07:00/day/night exposure; no glowing facades at night.
- **Depth:** readable middle-ground activities and distant atmospheric perspective, but don't hide work or wash away the settlement. No camera-induced popping, overdraw-heavy fog volume or fullscreen multisample pipeline.
- **Materials:** weathered oak, handmade roof clay, lime plaster, moss/grass, worked stone. Preserve original material atlas and world-space coordinates, avoid borrowed textures/assets, avoid artificial citizens.
- **UI:** smoky charcoal/ink, parchment, restrained sage and weathered brass. Primary information is what people are doing and what the settlement needs; avoid excessive neon, glowing gradients, microscopic labels and debug card accumulation. Preserve all controls, accessibility and 390px handling.
- **Motion:** following one authentic producer from task to loaded journey, actual delivery, documented arrival; no decorative fake work or cutscene-only success.
- **Performance:** rendering is already CPU-bound; profile sky/material/geometry and take away expense before adding detail. No new global post-processing framebuffer, new texture allocations or unlimited effects as shortcuts.

## Multi-run stages (remain on THIS workstream)

1. **Tone, sky and world-first command UI — candidate implemented at source `28750e5452ef1d89ca7d56a9fb941501c87fe7fb`.** Cheap vertex form-shadow, deeper sky palette, preserved material responses, bounded final tone pass, and restrained medieval CSS are code changes, **not a verified experiential PASS**. Mobile and GL regression is `tests/browser/tiny-kingdom-visual-direction.spec.cjs` (CI run awaited). Check new real WebGL footage and software frame p95 before advancing.
2. **Resolve observed visual failure, not a preset micro-task:** select the most distracting obstruction, flat object, material or poor framing from actual W01 recordings. Improve scene-scale readability across village overview, worker foreground, buildings, canopy, marketplace and mobile; conserve deterministic activity and frame budget.
3. **Demonstrable lived-in workday:** authentic same-person production -> hauling -> market receipt + camera following physically animated labor, visually understandable without counters. Keep the G165 real production-to-market workstream integrated, never independently fake its result.
4. **Performance architecture:** compare CPU p50/p95/p99, static rebuild, GPU if a physical device exists, draw calls, heap, hidden/missing citizens, 120–180-day deterministic replay and 390px UI. Treat <160k triangles as a safety guard, NOT the experience goal.

## Evidence gate for every outcome

Record same seed/staged view and continuous moving camera/interactions for baseline G088 vs candidate: Day-1 world, worker's hands, Day-120 town, mobile and night scenes. Actual screenshots or videos must link to exact commit and real CI artifact. Obtain independent fresh-context blind 4-of-5 votes in LOOK, FEEL and PLAY when critic workers exist; otherwise **NOT PROVEN**. The separate commercial-grade comparison remains **FAIL** until warranted.

A passing test, new color grade, or screenshot delta never means the Gauntlet has been achieved. Add new observations in `public/tiny-kingdom/progress.html`, preserve its chronology, keep PR #64 **OPEN / DRAFT / UNMERGED**.

## W07 — rebuilt public market common, same lived-in economy workstream (3 November 2026)

The prior exact-source W06 Playwright Day-120 filmed-lens gate failed 0.556 actual solid-house foreground coverage vs the <0.38 screen-readability bar; the matching evidence job failed despite the real 120-day simulation soak succeeding. Do not count the earlier camera grading as a win. Five original founding cottages physically overlaid the cobbled public trading square. W07 test-first Playwright contract (a107a0b0, registered in GPU CI) independently inspects actual serialized city lots, Day-120 growth, market navigation, 390px footage and spectator-snapshot immutability. W07 actual city/environment reconstruction is at source c7cfcc08934bb01486efe7ad6358a76356eb1fe2 (source blob d81da0f08181436916160151f6b5b5c85828a871): five inhabited real cottages are now on surrounding streets, not hidden or omitted; a shared market footprint supplies render and physical-court audit. Exact browser/GPU 41701402985, A/B 41701402961 and replay 41701402623 are required and still NOT PROVEN until checked; no separate blinded critics. Continue source-matched close labor / Day-1 / Day-120 moving comparisons and real CPU stalls. KEEP PR #64 OPEN DRAFT / NO MERGE.
