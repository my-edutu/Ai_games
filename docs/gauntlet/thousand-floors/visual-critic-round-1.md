# Fresh visual critic — round 1

Reviewed 2026-10-30 UTC, approximately 13:05–13:09. Independent reviewer; no game code changed and no tests rerun.

**Verdict: the reference is clearly preferred. The largest gap is the environment's architecture and material depth. This build is an early stylized prototype, not a reference-level presentation.** The current presentation exposes its repeated platform construction. Its pale slabs, widely spaced cream poles and flattened cloud forms do not yet establish a living tower or an authored district. A cleaner HUD is not a substitute for that missing world.

## Actual evidence inspected

- Running build: `http://127.0.0.1:4184/floors/`, fresh Playwright context, 1280 × 720, default speed. Browser capture in `/tmp/game4-critic-round1/d6f0d4b510d4fd840e8ef22bcd62c48c.webm`; review excerpt `/tmp/game4-critic-round1/inspected-motion.webm` (first 20 seconds).
- Game stills: `evidence/thousand-floors/captures/iteration-1-desktop.png` (1600 × 900, floor 003) and `evidence/thousand-floors/captures/iteration-1-mobile.png` (390 × 844, floor 009). Both were opened with the image viewer.
- Matched 1280 × 720 views: `/tmp/game4-critic-round1/comparison-0.png` (current desktop), `comparison-1.png` (Spring-Loaded 5 s), `comparison-2.png` (Rising Heat 5 s), each inspected at the same dimensions with aspect ratio preserved.
- Actual gameplay videos: `/tmp/game4-gauntlet-references/astro-bot-dlc-03-spring-loaded-en-29oct24.mp4` and `/tmp/game4-gauntlet-references/astro-bot-dlc-05-rising-heat-en-29oct24.mp4`. Inspected temporal sequences at 04.0, 04.5, 05.0, 05.5, 06.0, 06.5, 07.0 and 07.5 seconds from each video, in `/tmp/game4-critic-round1/reference-spring-4to8.png` and `reference-heat-4to8.png`. Cells are each 640 × 360.
- Current moving-output sequences: video times 02.0 through 07.5 seconds and 12.0 through 17.5 seconds, sampled every 0.5 seconds into `/tmp/game4-critic-round1/current-motion-2to8.png` and `current-motion-12to18.png`; same 640 × 360 cell size. Current sequence includes loading, floor 001 traversal and gate arrival, floor 002 exit, floor 003 traversal across a rotor and gate approach. Individual browser screenshots `frame-00.png` through `frame-05.png` were also available; their capture latency was uneven, so they are not a precise animation clock.
- Additional inspected originals: `/tmp/game4-gauntlet-references/astro-bot-dlc-05-rising-heat-en-29oct24-08s.jpg`; `/tmp/game4-gauntlet-references/luigi-official-5.jpg` (secondary architectural staging only).

Primary source page: https://www.playstation.com/en-us/games/astro-bot/

Exact official gameplay sources:
- https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-03-spring-loaded-en-29oct24.mp4
- https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4

Luigi provenance and source URL are recorded in `reference-evidence.md`. No reference assets were added to the game.

This is a disclosed comparison, not a valid blind study. Recognizable characters and the THOUSAND HUD reveal identity even if filenames are hidden. I did not claim blinding or manufacture anonymous preference scores.

## Ranked findings and changes

1. **Build a connected, layered environment.** Current platforms float with little surrounding architecture. The cream poles have almost no joints, supports, surface variation or relation to the route; rounded white blobs read more like flat rocks than atmospheric clouds. Spring-Loaded's 5 s frame provides a near landing surface, middle-distance obstacle, water plane, ruins, foliage and distant landmarks simultaneously. Rising Heat provides a cliff face, route, lava bed and remote mountains. Add a visible tower core behind the route, buttresses or ribs tying selected landings to it, several architectural scales, recessed/windowed surfaces and one recognizable district landmark. Preserve a clean foreground route. Do not merely add more of the same columns.
2. **Make hazard state and route direction visually unambiguous.** The gold line can be mistaken for a narrow physical rail rather than a route guide. Its thinness and low contrast make it weaker than Astro's high-contrast arrows and distinct contact targets. Rotor hazards appear as orange turntable ornaments; the sampled scene does not explain the safe interval through visible telegraphing. Give the rotor a readable sweep volume/sector and a clearly different safe phase, with an anticipation cue tied to simulation state. Use direction markers on the actual walk surface and make start/exit landmarks visibly different. Verify exact collision timing separately; this review does not establish a timing bug.
3. **Prevent the exit gate from hiding the actor.** In the current video's approximately 06.5–07.5 s samples, the character stands behind the near gate upright/arch and much of its torso disappears. The endpoint is precisely where arrival feedback should be most legible. Move the near upright out of the camera-to-character sightline, widen/rotate the arch, or add camera-aware occlusion treatment. Keep landing/arrival poses visible through the whole beat.
4. **Improve action pose and contact.** The visible character is complete and distinguishable, but mostly smooth ellipsoids with shallow material differentiation. In sampled traversal poses its legs remain tucked beneath a mostly upright body, and little anticipation or landing compression is readable at gameplay scale. Prioritize stronger silhouettes: crouch before launch, extension in flight, feet leading landing, bent knees on contact, arms counterbalancing, and delayed backpack/companion follow-through. Add a short localized contact effect and a grounded shadow that changes with height. Reference temporal sequences show launch, airborne travel and grab/landing as meaningfully different body configurations. Do not use a constant bob as the main expression of movement.
5. **Give materials distinct responses and useful edge detail.** Current cream character shell, platform slab and column share a soft low-detail treatment. Add roughness/color variation to stone, darker seams and inset panels to metal, clear fabric/rubber zones, beveled edges and localized warm light. The visor already gives the strongest contrast; extend that intentional separation to hands, boots, belt and backpack without making the entire actor noisy. Material finish should be judged at normal gameplay size, not a close-up.
6. **Use mobile space for the upcoming route.** The 390 × 844 capture keeps the protagonist visible but cuts the prior/adjacent route at the left edge, while progress/branding occupies roughly the upper third. Compact the progress block on portrait screens and use a portrait camera that frames the current platform plus the next required landing/hazard. Test several route directions; a single centered actor screenshot cannot establish mobile route readability. The sound label wraps to two lines and settings is icon-only, so ensure its accessible name and touch target remain clear.
7. **Prove floor identity through geometry and staging.** Inspected floors 001–009 repeatedly use essentially the same small slab/rotor/gate vocabulary. Luigi's pyramid scene establishes its theme with stepped massing, carved motifs, statues, light and sand, not a color change. Show representative later districts with visibly different silhouette and prop vocabulary. This review cannot infer ten-district variety from a spec or source code.

## Dimension judgments

| Dimension | Preference / conclusion | Evidence limit |
| --- | --- | --- |
| Character silhouette/material finish | Reference | Current actor has complete limbs and a readable visor, but simpler shapes/materials and weaker articulation at normal size. |
| Animation/weight | Reference for observed pose progression | Current capture includes repeated frames and large pose/position steps under shared host load. No precise frame-rate or latency claim is justified. |
| Environment depth/detail | Reference, large gap | Matched gameplay frames show substantial difference in connected architecture, surface breakup and layers. |
| Environment variety | Current not demonstrated beyond early floors | Need later district captures and traversal sequences. |
| Camera/action readability | Reference overall | Current centered actor is easy to find, but thin route lines, gate occlusion and portrait crop reduce comprehension. |
| Feedback/UI | Current progress text is readable; reference preferred for spatial action feedback | Reference website clips do not provide a comparable full controls/HUD test. Current audio not auditioned. |
| Campaign/recovery/performance/accessibility | Unjudged by this critic | Require functional test/runtime evidence, not visual scores. |

## Motion limits and next evidence

Moving output was recorded and sampled rather than inferred from source code. The current video often repeats one image for several half-second samples, then advances a substantial distance. This is an observed capture defect, but concurrent CPU/software-rendering load is a plausible confound; do not label it a proven application frame-pacing bug without an isolated capture. The independent browser capture ran slowly enough that the planned 24 screenshots were curtailed by tooling/runtime limits. The available first 18 seconds still show actual route progression, actor orientation, rotor visibility, gate occlusion and repeated staging. Temporal sampling cannot settle subtle easing, contact duration or audio quality.

For the next review: record an isolated 10–20 second traversal that includes a deliberate wait, jump, landing and floor transition at normal speed; include portrait traversal, a recovery, and representative district 2/5/10 scenes. Supply matching screenshots from the revised running build. This round supplies no parity claim and no overall win.
