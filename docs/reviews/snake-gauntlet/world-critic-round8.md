# Round 8 — independent world finish critique

## Verdict: LOSE against the reference finish bar

The current environment is coherent and the flat playing field is easy to read. It still reads as a clean procedural diorama rather than a substantially finished game environment. This judgment comes from the actual running-game captures, not source inspection.

## Evidence inspected

- `/tmp/snake-3d-ci-round8/artifacts/phase3/desktop-1920x1080.png`
- `/tmp/snake-3d-ci-round8/artifacts/phase3/character-current.png`
- `/tmp/snakepass_quality_refs/screenshot_0.jpg`
- `/tmp/snakepass_quality_refs/screenshot_1.jpg`
- `/tmp/snakepass_quality_refs/screenshot_2.jpg`

Character construction and expression are outside this critique.

## Single biggest remaining environment gap

**The dominant stone courtyard and its rim lack convincing material and surface depth.**

In the overview, the pale yellow-green court is the largest uninterrupted shape. Most cells share almost the same value, and the regular thin grid is more apparent than the stone itself. The front border, corner blocks, and steps possess geometry, but their surfaces still read as broadly uniform colored forms. The camera therefore exposes a large, flat-looking material field surrounded by small decorative detail.

The follow capture confirms the problem at a different scale. The foreground floor has some diffuse mottling, but its strongest feature remains the repeated fine grid. There is little indication of softened worn edges or slightly recessed joints. The material has weak spatial structure: it does not communicate the different scales of whole slabs, their boundaries, and local wear.

Reference `screenshot_0.jpg` gives the most useful direct comparison. Its large stones show broad warm stone variation, cooler weathered areas, worn edges that catch the light, and dark recessed joints. These cues work together across a complete block; they remain legible before examining small texture details. `screenshot_2.jpg` preserves the same convincing stone weight and aged surface beneath its vegetation. This is a finish lesson that transfers to a perfectly flat Snake board without adopting the reference's traversable terrain.

## Smallest independently judgeable correction

**Finish the existing courtyard and visible rim as one coherent stone family.**

Keep the playing plane, the cell layout, and the established scene composition. Give the existing stone field broad, restrained slab-to-slab color variation; subtle worn edge highlights; and shallow, coherent seam/contact darkening. Carry related broad material variation onto the already visible rim and ruin stone so the court and border belong together. The finish should read at the overview camera distance, not depend on close inspection of tiny grain.

The builder has accepted this bounded direction: a world-coordinate courtyard surface treatment and correlated broad mottling on the existing masonry. This report does not prescribe code structure or request additional props, terrain, or mechanics.

## Candidate acceptance criteria

1. **Overview-scale stone identity:** At the same desktop framing, the courtyard visibly reads as worn stone slabs. Broad surface variation is perceptible, but the snake, fruit, and markers retain stronger contrast. A noisy or high-contrast checkerboard fails this condition.
2. **Surface and rim depth:** The existing slab edges, joints, and front rim acquire believable depth from their material treatment. The visible rim remains heavier and darker than the sun-facing court. Repeated dark outlines around every cell fail this condition.
3. **Follow-view consistency:** In the same follow framing, the floor looks softly weathered and materially coherent. Wear and seams have distinct scales; enlarged fine speckle or a repeated blur pattern fails this condition.
4. **Gameplay readability:** The playing surface remains visibly flat, the snake path stays easy to follow, and no surface feature suggests a new obstacle, height change, or playable route.

## Decision rule for the next actual render

Call this correction **WIN relative to the current scene** only if it produces an obvious improvement at both existing camera distances while meeting all four criteria. Call it **LOSE** if the difference is mostly visible in a texture close-up, if the court merely gets darker or busier, or if the snake loses contrast.

The current complete scene remains **LOSE against the reference finish bar**. A source-level material change is not evidence of passing; the candidate must be judged from fresh running-game captures. This bounded correction is the highest-leverage next comparison, not a guarantee that one material pass alone reaches the full reference bar.
