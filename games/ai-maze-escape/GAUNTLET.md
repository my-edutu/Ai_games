# AI Maze Escape — 3D Gauntlet

## Goal
Transform the existing deterministic, partially observed autonomous Maze Escape game into a production-grade cinematic 3D maze adventure **without replacing or weakening** its working simulation, solvability proofs, fairness, recovery, or broadcast contracts.

## Reference bar
**The Talos Principle 2** — inspect its official actual gameplay at matching framing and resolution for environmental fidelity, depth, lighting, composition, material response, and puzzle readability. Additional references: **Little Nightmares III** for character staging, animation, visual storytelling and atmosphere; **Labyrinthine** for maze tension and dynamic threats.

## Loop contract
The lead chooses the decomposition, assigns independent builder and critic workers with fresh context, and iterates each independently judgeable component against **real running builds**, not code summaries. Critics compare matched screenshots or recordings in randomized blind A/B when feasible, identify the single most damaging remaining gap, and demand the next working improvement. No predetermined round limit. Stop only when the reference comparison is demonstrably won with gameplay and stability intact, or when the user stops it.

## Evidence contract
1. Run `npm ci && npm run maze:stream`. Browser source: `http://localhost:4174/maze`; progress: `http://localhost:4174/maze/progress`.
2. Run `npm test`, `npm run maze:stream:self-test`, and `npm run test:browser`. Capture screenshots and short gameplay clips of explorer, locked door, trap, known exit, moving threat, and recovery.
3. Inspect the **real pixels** at desktop (1920×1080), 1440×900 and phone landscape (844×390); review camera, character, environment, lighting, animation, sound, threat readability, performance and artifacts. Compare to official reference captures at equivalent framing; provide source and capture provenance.
4. Confirm no hidden-state leaks. Never consult generator oracle, undiscovered exits, private seeds, hidden topology or future threat truth from the rendering layer.
5. Test extended autoplay, restart and error paths. Measure render FPS, allocations, GPU context loss, regressions and accessibility. Preserve 2D fallback.
6. Update `public/ai-maze-escape/gauntlet.json` after each review, recording build evidence, critic finding, next gap, status and explicit `visualBarMet` boolean. **Never claim passed without evidence.**

## First iteration
A Three.js 3D presentation has been added on top of the verified public observation stream: known rooms, open passages, walls, keys, locks, traps, exit, autonomous explorer and threats. A camera follows the explorer and the UI includes live progress. **These are preliminary procedural geometry and characters. They are not comparable yet to The Talos Principle 2.** The original 2D canvas remains as a safety fallback.

## Release blockers
- Independent real-browser screenshot and video inspection; blinded visual comparisons against official gameplay references.
- Authored character meshes, believable rigged animation, detailed environment models, material/lighting/audio art direction.
- Performance and long-run 3D validation, accessibility and GPU fallback evidence.
- Existing R5 external production gates from `PRODUCTION_READINESS.md`.

## Rules
Never equate test success with visual quality; never label a mockup or concept art as a running game. Do not weaken or delete authority tests to make visuals pass. Keep the progress record factual.


## HUD and cinematic presentation gate (Round 6)

The official screenshots of **The Talos Principle 2** remain the primary visual reference; the previous small boxed maze and cramped low-contrast sidebar are not acceptable. Each UI critique must inspect actual pixels alongside the reference and answer:

- **World first:** Does the 3D viewport visibly dominate? At 1920×1080 its stage must occupy >92% of viewport width without horizontal scrolling. The explorer, exit and threats must not be completely obscured by UI.
- **Readable at a glance:** Is a viewer able to identify current goal, level, visible danger, progress, AI intention and the outcome in <5 seconds? Body text must remain legible on 1920×1080 and 844×390 stream captures.
- **Narrative feedback:** Do journal messages, mission focus and audience influence come only from the public render snapshot, with no invented outcomes or hidden-information leaks?
- **Working modes:** Do Cinematic, Follow and Tactical controls change the actual WebGL camera and preserve autonomous AI, with clearly marked active mode? A 2D-only fallback must hide nonfunctional 3D controls.
- **Livestream compatibility:** Is the interface coherent in normal, clean-feed, high-contrast, reduced-motion, desktop, mobile-landscape and portrait modes? It must not cover vital video content on a phone.
- **Operational proof:** Chromium screenshots (`gauntlet-ui-v3-*.png`), browser test logs, render FPS and draw-call recordings, and matched unbiased A/B comparisons must be retained. A screenshot capture alone is not a visual pass.

The goal-by-goal reference matrix in `public/ai-maze-escape/gauntlet.json` must stay truthful. No static design or passing DOM test is proof of the AAA benchmark.
