# Independent presentation and HUD critique — round 2

## Scope and overall verdict

Inspected the actual finished-game screenshots `round-2-overview.jpg`, `round-2-follow.jpg`, `round-2-mobile.jpg`, and `round-2-portrait.jpg` in `/workspace/scratch/c732709c31c7/ai-games/public/snake-stream/progress/evidence/`, plus the real visual reference `/tmp/snakepass_quality_refs/screenshot_0.jpg`. No builder reports or implementation were read.

**Overall: FAIL for release across the supplied viewports.** The desktop overview has a coherent, attractive shell and a readable game state. The portrait screenshot is a complete loss of the game scene, and the closer desktop camera does not deliver a convincing action-focused spectator composition. The portrait failure is the first issue to fix.

These are judgments of the supplied still images. They do not certify movement, collision logic, autonomous behavior, camera transitions, sound, keyboard operation, focus behavior, screen-reader labeling, or the persistence of any camera problem over time. Behavioral tests are separate.

## Viewport verdicts

| Supplied view | Status | Specific visible evidence |
| --- | --- | --- |
| Desktop overview, 1440 × 900 | **PASS, with presentation caveats** | The arena, snake sections, orange fruit, spikes, and blue rings are simultaneously visible. The title and `LENGTH 22 / 96` establish identity and objective at once. `BEST 22` and the run status are secondary. The dark shell, cream text, gold accents, and garden scene are coherent. Remaining weaknesses are ambiguous mechanics, a tiny snake face, and a broad, low-contrast floor. |
| Desktop closer/follow view, 1440 × 900 | **FAIL for action framing** | The snake head is near the upper-left part of the arena view and remains small. Most of the canvas is empty tiled ground; another section of the snake enters and is cropped by the bottom edge. No fruit is visible. The view sacrifices full-board context without making the head, immediate target, or a meaningful danger the clear focal point. The HUD itself remains readable. |
| Landscape mobile, 640 × 360 | **PASS, with readability caveats** | The compact header preserves `LENGTH 52 / 96` and `BEST 52`, and the board, snake head, body, and lower-right fruit remain visible together. The run status stays below the canvas without covering play. Camera and sound controls are visible. Secondary labels and the controls are very small in this supplied image, so target size and text legibility need a check at the actual CSS viewport and device scale. Some lower board edge is close to the crop. |
| Portrait mobile, 390 × 844 | **FAIL — release blocker** | The entire playfield is missing. The canvas contains only water and a pale upper strip: no board, snake, fruit, hazard, or destination. Yet the HUD reports `LENGTH 57 / 96`, `BEST 57`, and an autonomous run in progress. This is a direct contradiction between the visible game state and the spectator scene. The stacked header and bottom-right control placement otherwise fit the narrow width, but cannot compensate for the absent game. |

## Key failures, in priority order

### 1. Portrait camera loses the game entirely

The portrait canvas occupies most of the screen and shows none of the gameplay. This prevents a viewer from understanding or following the stream. A responsive layout is only successful if the actual 3D arena remains framed as the aspect ratio changes.

**Next action:** fix or constrain the portrait camera so its composition contains the playable board, or deliberately choose a shorter landscape-shaped canvas within the portrait page. Use the actual portrait screenshot dimensions as an acceptance check. A screenshot at first load and another after the autonomous run has advanced should both retain the action. The screenshot alone does not establish the implementation cause.

### 2. The closer view fails to establish an action focal point

The closer image enlarges the floor and crops the board, while leaving the head near the upper-left and without a visible fruit target. It is difficult to understand why this camera is useful. An action view should make the head and its next meaningful interaction easy to watch; a wide view should make route planning and global constraints easy to watch.

**Next action:** frame the head with useful look-ahead toward its next objective, leaving enough neighboring body and hazard context to understand danger. Allow a small full-board inset or an easy overview fallback if the body extends far offscreen. Do not rely on simply increasing zoom.

### 3. Goal and length are clear; danger and mechanics are not

`THE GOAL · GROW TO 96` and the large current length work well. However, `NEXT MOVE: Keeping a safe way through` supplies little actionable or explanatory information. It does not identify a target, describe a danger, or explain an immediate decision.

The overview includes orange fruit and orange spikes; the other screenshots include dark discs with gold rims and blue rings. The still images do not explain what the rings do, whether the dark discs are dormant hazards, or why the body appears in separated stretches. The spikes have a useful threatening silhouette, but that explanation is absent when they are not raised. At mobile scale, color and small shape differences carry almost all of the meaning.

**Next action:** add a concise, unobtrusive explanation of food, dangerous cells, and portals, plus a real current-state cue when danger changes. A short state such as seeking fruit, waiting for a hazard, or using a portal would carry more information than generic reassurance, if those are states the actual game supports. Avoid inventing states just for the HUD.

### 4. Scene craft is coherent, but the visual reference remains substantially stronger

The supplied reference is useful for character appeal, warm/cool lighting, material variation, layered scenery, foliage placement, and purposeful composition. It does not imply that this game should copy an unrelated game's HUD or abandon the readable board format.

The finished scene already has a recognizable stone garden, water, ruins, flowers, foliage, shadows, and a green-and-gold snake. Those are real strengths. The main craft gap is that the reference has a large expressive character and tactile, varied surfaces, while this game's main canvas is dominated by pale, similarly colored tiles and a small head. The closer camera exposes that imbalance instead of solving it. The reference has a strong near/middle/far hierarchy; the finished scene is mostly a single planar play surface with decoration at the perimeter.

**Next action:** prioritize a better character/action composition and stronger local separation of the snake, food, and hazards before adding more peripheral decoration. Preserve board legibility while giving the hero and current interaction more visual emphasis.

### 5. Accessible control behavior is unproven

The camera and sound controls have visible text as well as icons, and the sound control explicitly says `Sound off`. Those are good affordances. The portrait control group appears comfortably contained within the canvas, and the mobile landscape labels are much smaller.

The images cannot verify hit areas, keyboard focus, accessible names, toggle semantics, contrast ratios, motion preferences, or whether controls remain reachable during camera transitions. The screenshots do not show a pause control, but they also cannot establish whether one exists elsewhere. These should remain live-test questions, not be recorded as passing accessibility on the basis of the stills.

## Strongest part

**The shell and primary HUD hierarchy.** The dark green surrounding frame, restrained gold accents, serif title, compact uppercase labels, large cream length figure, and quieter best score feel deliberately designed. The main objective is immediately legible, and the desktop overview offers enough room to understand the board. The narrow header also reflows sensibly in portrait. This is a sound presentation foundation.

## Biggest next improvement

**Make camera framing reliable at every aspect ratio, then make the closer camera follow the meaningful action.** This single area produces the largest improvement in actual spectator experience: portrait becomes usable, the closer mode gains a clear purpose, and the expressive snake model gets a chance to carry the scene. Fixing typography or adding decorative assets first would not resolve the current release blocker.

