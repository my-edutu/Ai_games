# Fresh visual critic — round 2

Reviewed **2026-10-30 UTC**. Independent visual reviewer. This review used the actual supplied capture files and decoded gameplay-video frames. No game source, browser state, simulation, or tests were changed by the reviewer.

**Verdict: ASTRO BOT remains clearly preferred overall on the evidenced presentation dimensions. The new build is substantially better than round 1, but it does not reach the fixed reference bar. The largest aesthetic gap is connected environmental staging and material depth. The most actionable readability defect is that the desktop camera clips the upcoming exit landing before it pulls back during the approach.**

The architecture now has recognizable red masonry, pale trim, windows, turquoise conservatory arches, planted roofs and bridge supports. The explorer has a coherent face, torso, hands, boots and equipment; it is no longer just a small collection of largely featureless ellipsoids. These are visible improvements, not evidence of parity. The dominant wide composition is still a short stack of similar square slabs between two repeated decorative towers, surrounded by large areas of pale empty sky and a few plain polygonal columns. The reference presents a much more connected world with several useful scales of structure, material response and environmental activity.

This is a disclosed preference review. The games are recognizable from their characters and HUDs; no blind comparison or anonymous preference test is claimed.

## Evidence actually inspected

### Candidate

- `evidence/thousand-floors/captures/iteration-3-desktop.jpg`, **1280 × 720**, floor 005, paused while the intent reads “Waiting for a safe opening.” Opened at its actual display dimensions.
- `evidence/thousand-floors/captures/iteration-3-mobile.jpg`, **390 × 844**, the same floor and paused intent. Opened at its actual display dimensions.
- `/tmp/game4-round3-video/8d69233ca0e2d5986764edb5da2f909e.webm`, **1280 × 720**, 39.28 seconds. The recording starts with the loader, proceeds through desktop traversal on floors 001–004, and ends with the portrait setup. Its 25 fps stream metadata describes encoding, not measured rendering performance.
- A temporal overview decoded from that recording is `/tmp/game4-critic-round2/current-overview.jpg`. Closer sequences at **14.0–19.5 s** and **30.0–35.5 s**, sampled every 0.5 seconds, are `/tmp/game4-critic-round2/current-14to20.jpg` and `current-30to36.jpg`. All sequence cells are 640 × 360.
- Individual **1280 × 720** decoded frames at **16.5, 18.0, 19.5, 31.0, 33.0, 34.0 and 35.5 s** are `/tmp/game4-critic-round2/current-full-TIMEs.jpg`. Full-size 16.5, 19.5, 31.0, 33.0, 34.0 and 35.5 s images were inspected in addition to the sequence sheets.

### Reference

- Actual official **Spring-Loaded Run** MP4 at `/tmp/game4-gauntlet-references/astro-bot-dlc-03-spring-loaded-en-29oct24.mp4`.
- Actual official **Rising Heat** MP4 at `/tmp/game4-gauntlet-references/astro-bot-dlc-05-rising-heat-en-29oct24.mp4`.
- Both reference clips were decoded into temporal sequences for **4.0–7.5 s**, sampled every 0.5 seconds, using the same **640 × 360** cell size as the candidate. Inspected outputs are `/tmp/game4-critic-round2/spring-4to8.jpg` and `heat-4to8.jpg`. A wider Spring-Loaded timeline overview was also inspected.
- Spring-Loaded **5.000 s**, Rising Heat **5.000 s** and Rising Heat **8.000 s** were inspected separately after resizing from the source to **1280 × 720** with aspect ratio preserved. These matched-size images are in `/tmp/game4-critic-round2/matched-*.jpg`. The candidate was not enlarged relative to the reference.
- `/tmp/game4-gauntlet-references/luigi-official-5.jpg`, **1280 × 720**, was inspected as secondary evidence of architectural theme and staging, not as proof of motion or interactive camera behavior.

Publisher provenance, original hashes and exact download URLs are recorded in [reference-evidence.md](reference-evidence.md). Primary sources:

- https://www.playstation.com/en-us/games/astro-bot/
- https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-03-spring-loaded-en-29oct24.mp4
- https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4

These are video-derived observations, not a claim that every frame was auditioned in real time. Temporal stepping supports pose progression and camera-position observations. It does not establish subtle easing, audio synchronization, input latency, or a hardware frame-rate comparison.

## Load-bearing presentation finding

### R2-1 — Reveal the next landing before the jump, inside the usable viewport

**Moment:** candidate video **33.000 s**, floor 004, `/tmp/game4-critic-round2/current-full-33.0s.jpg`; compare **34.000 s** and **35.500 s**.

**Expected experience:** while the explorer is on or approaching the hazard platform, the viewer can see the next required exit landing and its target marker before the next jump begins. Framing then stays sufficiently stable to read takeoff, flight and contact.

**Observed experience:** at 33.000 s, the exit platform projects through the bottom edge. Its ring and much of its landing surface are clipped. By 34.000 s, the camera has pulled back and shows the platform more fully while the explorer is already traveling toward it. The earlier 16.5–19.5 s sequence also shows a substantial close-to-wide change in camera scale over a single floor. The dark teal mechanism at 33.000 s is not evidence of an energized or damaging state; the camera finding does not depend on its collision state.

**Why this matters:** an autonomous spectator game still needs visible causality. Revealing a destination during the commitment weakens the viewer’s understanding of the decision. Zooming out to show the whole module also reduces the readable character pose and the weight of arrival. This is an observed composition defect; it is **not** evidence that collision timing is unfair or that the campaign fails.

**Severity:** high presentation priority; correct before adding further decorative density. No simulation blocker is established by this review.

**Exact improvement:** fit the explorer, the current contact area and the entire next required landing in a viewport rectangle that excludes the HUD and transport controls **before takeoff**. Add look-ahead toward the next landing rather than waiting for travel to trigger a zoom change. Keep a bounded character screen scale and avoid fitting distant, already-cleared platforms when they are not needed for the next decision. Preserve the useful perspective and visible gaps.

**Verification:** capture complete wait → launch → hazard landing → exit launch → arrival sequences on short and long floor layouts at 1280 × 720 and 390 × 844. Inspect the actual frames immediately before takeoff and at the apex; the next landing perimeter and destination marker must be visible, and the explorer must remain identifiable. Revisit the exact floor-004 direction shown here.

## Largest aesthetic gaps, in order

### R2-2 — Make the platforms belong to a larger, connected tower

**Moment:** candidate desktop still and wide views at **19.5 s** and **35.5 s**, compared with Spring-Loaded **5 s** and Rising Heat **5/8 s**.

**Expected experience:** the viewer reads a route through an inhabited or functioning sky tower, with near surfaces, supporting middle-distance structure, and a destination or district beyond the immediate obstacle.

**Observed experience:** the new buildings provide strong local identity, but most walk surfaces remain separate, nearly identical square caps on tapered brick posts. A small pair of towers, planter bridges and sparse braces repeats across the inspected early floors. Pale faceted columns in the distance do not yet form a convincing skyline or communicate where the ascent is going. A wide camera makes the gaps and repeated module boundaries particularly conspicuous.

**Reference evidence:** Spring-Loaded has the immediate landing and route arrows, the next interaction structure, water with visible surface change, ruins, sculpted vegetation and a remote landmark in the same gameplay view. Rising Heat uses a safe dark rock route against luminous lava, then a large cliff and metal climbing surface whose structures continue outside the current action. Luigi’s pyramid still establishes a room through its massing, surrounding sand, stairs, statues, lighting and repeated motifs.

**Why this fails the benchmark:** the candidate’s added detail decorates the route but does not yet supply the same sense of a complete place. More copies of the existing columns or planters would preserve the underlying gap.

**Exact improvement:** build one district composition around a visible architectural spine that continues beyond the frame. Attach selected landings to balconies, recessed walls, archways or buttresses so that the support system reads spatially. Use a small number of larger plant masses and a clear district landmark, with a quieter distant silhouette layer. Let playable surfaces vary in outline and relationship to the structure while preserving the clean action region. Judge the result from the widest actual traversal camera, not a close beauty shot. Keep the design within measured rendering budgets; this finding does not call for unbounded mesh or particle counts.

**Verification:** show a short complete traversal in which the actor, next action and connected environment are all visible. Compare the same 1280 × 720 frames against the same official timestamps. A successful change must improve spatial continuity and composition, not just texture density.

### R2-3 — Give each material a distinct appearance at gameplay distance

**Moment:** candidate desktop still, airborne pose at **16.5 s**, and the full-size reference frames.

**Observed experience:** stone now has seams, brick walls have a readable pattern, windows have deep dark contrast, and the character has a stronger layered costume. However, broad stone, brick, foliage, metal trim and character surfaces still tend toward uniform flat shading. Brick rows and pale slab panels are highly regular; leaf forms remain large flat triangles. The reference separates rough rock, bright metal/plastic, vegetation and water/lava with much stronger variation in highlight, surface shape, local color and contact light.

**Severity:** major visual-quality gap, not a gameplay fault.

**Exact improvement:** concentrate detail where it communicates material: softened or worn slab edges; slight stone/brick value variation rather than a uniform grid; recessed joints; distinct dark fabric/rubber versus shell/metal on the explorer; stronger but controlled metal highlights; more varied plant silhouettes. Keep decorative microdetail subordinate to hazard shapes and the face. The target is visible material distinction in a normal-size frame, not a higher texture count.

**Verification:** compare a lit stone edge, a shadowed masonry face, metal trim, foliage and the explorer in one normal gameplay frame. They should be distinguishable by response and structure even when their colors are similar.

### R2-4 — Strengthen the readable launch, flight and landing poses

**Moment:** candidate **16.5–19.5 s** and **33.0–35.5 s**, compared with both reference **4.0–7.5 s** sequences.

**Observed experience:** candidate limbs now change position; airborne legs and arms are visible, the backpack/companion make a clearer silhouette, and a cast shadow helps establish height. These are real improvements over round 1. The sampled body remains predominantly upright through travel and arrival, and the wide views reduce pose detail. The reference shows more distinct body/equipment configurations across departure, airborne movement, grab and contact, with stronger interaction effects.

**Evidence limit:** sparse or repeated frames in the candidate recording prevent a claim that a short anticipation or landing effect never occurs. The shared software-rendering host is a known confound. This review prefers the reference’s **observed** pose progression; it does not assign a numeric frame rate or diagnose frame pacing from the video.

**Exact improvement:** after the camera fix, make three or four key silhouettes unmistakable at the smallest intended actor size: a brief compressed launch pose, a stretched or counterbalanced flight pose, a feet-leading landing, and a compressed recovery. Use small localized contact feedback tied to the actual landing event. Do not replace readable poses with constant bobbing, full-screen effects, or a larger ambient particle field.

**Verification:** record one normal-speed jump and landing with the explorer at the widest supported gameplay scale, plus the same sequence stepped by frame. Distinct poses and the actual contact moment should remain visible without consulting the intent label.

## Changes that visibly succeeded

- **Local architectural identity improved.** The conservatory arch, planted roofs, masonry faces, window recesses and bridge supports are inspectable features. Round 1’s “chiefly bare slabs and poles” description no longer fairly describes the close current view.
- **Character finish improved.** The face, visor, feet, hands and layered body/equipment can be separated in the actual desktop and portrait captures. The explorer remains recognizable from front, side and back in the inspected frames.
- **The previous exit-gate occlusion is not reproduced.** The current exit is a low ring; the arrival images at 19.5 and 35.5 s keep the actor visible. This verifies those particular arrival views, not every possible camera direction.
- **Floor markings are more useful than the old thin floating guide line.** The filled chevrons read as directions on the walk surface. Active hazards show raised orange forms and an orange rim, while safe sampled states retract to a dark teal disc. That geometry change improves the active/safe distinction beyond a color-only swap. The paused floor-005 image alone still cannot explain exactly why the AI is waiting.
- **Portrait framing improved for the immediate decision.** At 390 × 844, the explorer and next hazard platform are both visible. A later left-hand platform is partly clipped and the distant platform shares space with the header, but the immediate next action is not hidden in this sample. No portrait-motion or full mobile camera pass follows from one paused image.
- **Campaign progress and intent are readable.** Floor number, district, checkpoint and pause state remain comprehensible. Their clarity does not by itself establish reference-level spatial action feedback.

## Dimension judgments

| Fixed dimension | Preference or conclusion | Actual basis and limits |
| --- | --- | --- |
| Character silhouette/materials | **Reference preferred** | Candidate now has a clear complete explorer, but reference has stronger material contrast and a more polished articulated silhouette at gameplay scale. |
| Animation/weight | **Reference preferred for the observed sequence** | Candidate has visible limb changes and shadow separation; reference demonstrates more differentiated action poses and equipment response. Fine timing is unresolved under capture/host limits. |
| Environment detail/depth | **Reference preferred, largest remaining gap** | Candidate has coherent local buildings; reference has more connected scene layers, material variety and authored landmarks surrounding the route. |
| Environment variety | **Reference preferred within the inspected early scenes; full candidate campaign unjudged** | Floors 001–005 repeatedly expose the same building/slab vocabulary. Later district evidence is required before judging the ten-district promise. |
| Camera/action readability | **Reference preferred overall** | Candidate portrait immediate framing is improved, but desktop next-exit clipping and close-to-wide changes reduce anticipation and character readability. Reference route/interaction cues remain stronger in the inspected sequences. |
| Feedback/UI | **Reference preferred for spatial action feedback; full HUD comparison unjudged** | Candidate progress/intent text is clear and hazard geometry changes help. Official reference clips are not a comparable settings, keyboard, touch-target or full HUD test. |
| Audio | **Unjudged** | Neither candidate nor reference audio was auditioned in this visual review. |
| Campaign/recovery | **Unjudged by this visual critic** | The clip shows actual floor advancement, not campaign completeness, checkpoint reliability or valid recovery. Those belong to the independent core/browser evidence. |
| Performance/accessibility | **Unjudged by this visual critic** | Stream metadata, supplied resource counts and capture repetition do not establish reference-hardware performance, long-run bounds or accessibility. The mobile screenshot supports only its actual visible state. |

No applicable dimension in this evidence set establishes candidate preference or full parity. The report deliberately does not fabricate a numerical experience score, five-reviewer comprehension result, audio judgment, or blind win from partial footage.

## Evidence still needed

1. Correct and recapture the next-landing camera issue, including the original floor-004 direction.
2. Supply representative later district scenes and at least one complete later-district traversal. Geometry and staging must change visibly; the label or palette is insufficient.
3. Capture a recovery and checkpoint arrival, plus portrait motion. The current evidence cannot settle their presentation quality.
4. If smoothness becomes a blocking claim, measure an isolated run on declared hardware and workload. The current shared-host recording is unsuitable for a console/browser performance comparison.

**Round status: benchmark not passed. Continue with the camera/readability correction, then concentrate the next art pass on connected scene composition and material differentiation.**
