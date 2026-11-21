# Round 7 — independent character, camera, water, and recorded-sequence review

Date: 2026-10-30. Reviewer: `snake_cache_critic`.

## Verdict

**The latest game still loses the visual comparison to the supplied official Snake Pass reference.** The lower detail camera is a useful improvement, and the large eyes blend better into the head. The eating pose now exposes the largest remaining character weakness: the lower jaw and dark interior read as a separate flat oval beneath an apparently closed upper muzzle, rather than one connected mouth opening.

Keep the current large eyes and the lower detail angle for the next pass. The smallest high-value correction is to make the rear jaw/lip visibly meet the mouth corners, recess the interior behind the lip, and constrain the gape to an opening that the cheek/interior geometry can support.

This judgment comes from the actual new PNGs and decoded video frames. No browser was run and no repository files were edited.

## Evidence and method

Feature commit: `f3be8b70f6efc5d5ca5870423a62e922a9d15925`, as identified in the recovered CI report's synthetic-merge subject.

Images inspected directly:

- `/tmp/snake-3d-ci-round7/artifacts/phase3/character-current.png`
- `/tmp/snake-3d-ci-round7/artifacts/phase3/desktop-1920x1080.png`
- `/tmp/snake-3d-ci-round7/artifacts/phase3/portrait-390x844.png`
- `/tmp/snakepass_quality_refs/screenshot_0.jpg`, the supplied official Snake Pass reference.

Recorded evidence: `/tmp/snake-3d-ci-round7/artifacts/phase3/character-motion.webm`. `ffprobe` reports a 28.72-second, 1280×960 VP8 file encoded at 25 FPS.

**Motion-review limit:** I decoded the actual WebM and inspected 29 samples at approximately one-second spacing, then nine native-resolution frames at 17, 21, 21.5, 22, 22.5, 23, 23.5, 24, and 28 seconds. This is sampled-frame review, not continuous real-time playback. It can establish shown poses, framing, changes of state, and visible construction problems. It cannot establish fluid animation, continuous interpolation quality, or a motion benchmark win. The video's encoding rate is not the game's rendered frame rate.

Inspection outputs are `/tmp/snake-r7-motion-frames/sequence-1.png` through `sequence-4.png` and `/tmp/snake-r7-jaw-sequence.png`. The latter collects native-pixel head crops around the eating pose. Gray padding in parts of the recording accompanies viewport resizing in the fixed video canvas; it is not present as a game defect in the full PNGs.

The earlier and new character stills show different game states and poses. This is not a controlled geometry-only A/B. The eating pose exposes a construction weakness that the earlier closed-mouth still could not fully establish.

## 1. Face: eye integration improves; the mouth remains the largest gap

The lighter green eye surrounds are less visually separate from the head than the older dark cups. The white eyes, amber irises, pupils, and catchlights remain prominent. Their readability should be retained. The green/gold palette, continuous body, scales, and tapered tail still supply a recognizable original character.

The mouth is the dominant remaining problem. In `character-current.png` and the recorded frames around **22–23 seconds**, a broad maroon oval with a cream rim hangs below the muzzle. Its almost planar surface and uniform silhouette make it read as a separate plate or lid. The upper muzzle still presents a largely closed underside, while the mouth corners and rear hinge do not convincingly connect the two volumes.

The frames around **17–21.5 seconds** and **23.5–28 seconds** show the smaller resting opening. They still contain a sequence of separate dark and pale bands, including a conspicuous pale crescent within the opening. Thus this is not only a problem at the most extreme eating pose.

Compared with the reference, the current face has less coordination between muzzle, mouth cavity, cheek, jaw, and expression. The reference's open mouth has a readable interior and a tongue inside the opening; its jaw and cheek surfaces belong visibly to the same face. Adding more eye size or additional lip outlines would not address the current structural gap.

### Smallest concrete correction

1. **Attach the mouth corners and rear jaw edge.** Reposition/shape the rear jaw and its pivot so the lip stays tucked under the cheek at both ends of the opening. The correction should be visible from the current three-quarter camera, not only from the front.
2. **Recess the interior.** Keep the dark interior behind the cream lip and connect it into the mouth opening; avoid exposing one large uninterrupted oval as the entire interior. A shallow connected cavity/side wall using the existing mouth geometry budget would be more convincing than the present flat-looking surface.
3. **Use a shallower supported gape initially.** Limit the maximum eating opening until those side/interior surfaces remain connected throughout it. Preserve the visible eating response through the existing head/neck reaction and a clear, attached jaw motion.

The immediate acceptance capture is the same close angle at rest, half-open, peak-open, and closing. Both rear mouth corners should remain attached, and the interior should read as depth inside the head. Keep the current eye and body proportions unchanged during that focused correction.

## 2. Camera: retain the lower detail view

The new close view materially improves the old floor-heavy composition. The current still contains the head, a long receding body, nearby portal, flowers, column structure, water, and distant banks. The head is large and clearly visible, and the body now contributes a stronger perspective line into the scene.

The recorded sequence also supplies a frontal three-quarter view with fruit in the foreground and a later view near the portal. These are more useful character presentations than the earlier predominantly downward view. The full-garden inset remains available during the close view.

The new camera also makes the environment's simpler construction more apparent: coarse faceted banks, repeated large leaf shapes, and blocky columns are conspicuous at this distance. In some samples the backdrop is mostly a broad sky/water gradient. The next pass should improve the mouth while retaining this angle; changing the camera again would not solve the exposed geometry.

Only the recorded headings/locations were inspected. These samples do not prove every edge/corner view is free of occlusion or that the camera transitions feel smooth in continuous playback.

## 3. Water and whole-scene appearance

The latest desktop and portrait images show darker, quieter teal water with faint ripple/contour detail. The earlier bright repeating bands are substantially less dominant. This helps the pale board and the green/gold serpent remain the focus.

The tradeoff is a broad, nearly uniform surround. In the close view, the water/sky gradient and faceted banks still provide much less layered environmental depth than the reference's carved stone, roots, hanging plants, foreground supports, and atmospheric distance. Water is present and visually coherent; it is not yet a strong material or depth feature in these images.

The smallest environmental refinement would be restrained broad color/depth variation around the island and toward the horizon, while retaining the quieter texture. This would give the surround more spatial separation without restoring the distracting bright repetition. It is secondary to the mouth correction and requires new output/performance evidence if implemented.

The desktop overview retains a clear legal playing field, readable body path, food, active hazard forms, portal cues, goal, and caption. The portrait still retains the whole board and readable primary text. Facial expression is necessarily too small to judge from the portrait overview; the close camera is the evidence for character craft. These functional composition strengths do not close the artistic gap to the reference.

## 4. What the recorded sequence establishes

The actual recording progresses from startup into overview, follow, and detail presentations. HUD length changes, the serpent changes route and orientation, the close view shows a larger mouth opening around the collected-food state, and subsequent samples show a smaller opening again. The head remains recognizable across the inspected poses.

That is useful evidence of live state changes and more than one static showcase pose. It is not a fluid-animation pass. Sparse samples cannot establish the quality of turns, portal transitions, the exact timing of swallowing, or the absence of intermittent hitches. The sampled frames also do not demonstrate a comparably rich range of coordinated facial expressions to the reference.

## Performance and benchmark status

The separate desktop artifact records **8 actual draws in 1050 ms, 7.619 FPS, and a 250 ms maximum gap**. Its adaptive drawing buffer is 863×394 at a 0.469 pixel ratio, with the cache active. The required 17 FPS minimum and strictly-below-250 ms maximum gap are not met. These values are the recorded desktop measurement; they are not inferred from the video's 25 FPS container.

The latest images show meaningful presentation progress, particularly the lower detail camera and less separate-looking eye supports. The strongest remaining visual blocker is the mouth/jaw construction in the now-observed eating pose. The wider environment remains simpler and less layered than the official reference, and pacing remains below the gate. **The honest round-7 whole-game verdict is still LOSE.**
