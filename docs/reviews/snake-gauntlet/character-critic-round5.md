# Round 5 — independent character and whole-image visual review

Date: 2026-10-30. Reviewer: `snake_cache_critic`.

## Verdict

**The current game loses the presented visual comparison to Snake Pass.** A wins the anonymous-labelled character pair overall and in facial expression, cohesive modeling, and surface finish/body silhouette. The full character and portrait images do not overturn that result.

The current serpent is readable and appealing: its green/gold identity is coherent, the body is continuous, the tail tapers, and the eyes are large enough to communicate. The largest remaining character gap is the integration of the mouth and eye surrounds into one expressive face. The largest immediate framing gap is the detail camera's predominantly empty-floor composition.

This is a judgment of actual supplied images. It is not inferred from passing tests, mesh counts, or a claimed frame rate. It does not assess unseen animation or justify changing authoritative Snake rules.

## Method and independence limit

The reviewer first opened only:

- `/tmp/snake-character-comparison-r5/A.png`
- `/tmp/snake-character-comparison-r5/B.png`

The decision that A wins was sent to the lead and written to `/tmp/snake-character-r5-preidentity.md` before opening the full original character/reference images. The later original-image inspection confirmed A is the supplied official Snake Pass reference and B is the current Autonomous Snake character.

**This was not fully blind and was not wholly fresh context.** The identities are visually recognizable, and the reviewer had already inspected the current renderer and game images for a separate cache review. The lead reused this independent critic because a new thread was unavailable. No claim of anonymous guessing or experimentally controlled blinding is made.

The crops share a display width but have different heights, cameras, poses, lighting, and game mechanics. They support a qualitative craft/presentation comparison, not an objective numeric quality score. The current game is not required to add climbing or wrap its authoritative body around bamboo to pass its own rules.

## Labelled character result

| Category | Winner | Visible reason | Largest concrete gap in B |
|---|---|---|---|
| Facial expression | A | The open mouth, curved tongue, eye direction, and head pose work together as a strong readable expression. | B's forward-looking eyes and shallow banded grin communicate a much narrower, more static expression in this capture. |
| Cohesive modeling | A | Muzzle, mouth opening, cheek/eye area, and lower jaw read as coordinated surfaces of one character. | The dark eye rims and stacked dark/green/gold/cream mouth outlines read as separate pieces attached to the head. |
| Surface finish | A | Scale detail, colored bands, highlights, and shadow produce a more varied, integrated surface. | B's very regular scale texture and strongly repeated bands feel more uniform across long body sections; some head/neck shading is less unified. |
| Body silhouette and volume | A | The lit bends and overlapping depth of the body make its rounded volume immediately clear. | B has a sound continuous body and taper, but nearly constant-width planar sections and the floor-heavy view give it less sculptural presence. |

These are observations about the visible result. B's green/gold palette and large eyes should be preserved as its own design; the aim is better integration and expression, not copying A's colors or assets.

## Smallest concrete face correction

The next pass should concentrate on a few visible interfaces rather than shrinking the eyes or rebuilding the character from scratch.

### Keep the eye size; reduce the separate-eye-cup impression

In the B image, the dark green outer rims make the eyes appear to sit in distinct cups. Keep the current white-eye/iris size and the existing enlarged socket scale. Make the outer support/rim share the head or upper-lid green, so its transition into the skull becomes less graphically separate. Let the existing upper-lid surface supply the main upper contour.

This is primarily a material/outline correction. It preserves the large readable white areas and pupils. The verification should be a same-angle full-size head capture plus a smaller overview crop, checking that the white/iris silhouette still reads without the conspicuous dark cups.

### Simplify the mouth to one crease and one lower jaw

The strongest assembled detail is the sequence of maroon mouth band, thin colored lip outlines, and cream lower rim. Remove the extra gold lip-edge tubes, retain one fine mouth crease, and reduce how much of the maroon cavity is exposed in the neutral pose. The present cavity ellipsoid's vertical scale is 0.031; a first controlled trial around 0.012–0.016 would make the resting opening less band-like while retaining the mouth shape. This is a proposed visual trial, not a verified numeric optimum.

Retain one cream lower-jaw surface and the current overall muzzle volume. The objective is a single intentional mouth opening rather than multiple stacked outlines. Inspect both the neutral and eating/open-jaw pose after the change so a cleaner closed smile does not eliminate the readable bite expression.

The upper-lid/socket color unification and mouth-outline simplification are the smallest concrete correction I would try first. Larger eyes alone will not resolve these visible boundaries.

## Detail camera: lower angle would materially improve presentation

The full `/tmp/snake-3d-ci-round5/artifacts/phase3/character-current.png` shows the face clearly, but most of the surrounding image is pale floor. Almost none of the authored ruins, plants, water, or distant scenery contributes to the close-view composition. The character appears displayed on a large tiled surface rather than situated in the garden.

The current detail offset has approximately 27° elevation and the camera has a 36° vertical field of view. At that elevation the uppermost view ray still points roughly 9° below horizontal, which explains the all-floor tendency in this open part of the board. This geometric observation supports what is visible in the image.

A bounded next trial is **15–18° elevation, with a target near eye height around 0.6 world units**, initially retaining the current horizontal direction/distance and overview inset. That should compress the foreground floor, show more of the face front, and admit the ruin/tree backdrop into the top of the frame. It is likely to produce a material presentation improvement before adding more art assets.

The camera change needs actual corner and cardinal-heading captures. A lower view can let foreground leaves or ruins hide the head, especially near the board's rear edge. Keep the safe overview available and retain head readability as the criterion; do not adopt the lower angle merely because its center-board screenshot looks better.

Improved framing will help display the existing work. It will not by itself remove the mouth/rim construction or establish expression quality in motion.

## Full character and portrait versus the official reference

Additional images inspected:

- `/tmp/snake-3d-ci-round5/artifacts/phase3/character-current.png`
- `/tmp/snake-3d-ci-round5/artifacts/phase3/portrait-390x844.png`
- `/tmp/snakepass_quality_refs/screenshot_0.jpg` — supplied official Snake Pass reference.

### What the current game does well

The full character capture confirms that B is the actual rendered game character, rather than separate concept art. Its body, bands, scales, face, and tail are coherent with the green/gold garden identity. The presentation has a restrained frame, a clear length/goal display, a small whole-garden inset in the close view, and a readable instruction caption.

The portrait view retains the rectangular playing field, the current goal and record, the serpent route, food, and board props. This is useful evidence of a deliberate mobile overview. The image's quiet playing surface also makes the path easier to trace than a heavily decorated field would.

### Why the visual benchmark is still a loss

The official reference has pronounced foreground/middle/background separation: the character and bamboo support lead into carved stone, hanging vegetation, roots, flowers, suspended structures, and atmospheric distance. Its character has a strong expression and its materials remain distinct across the scene. The image feels authored around a particular moment.

The current close view dedicates most of its image to repeating floor. The portrait overview necessarily shows the whole board, but the authored environment occupies mostly a thin border; the snake and prop details are small, and the large quiet rectangle dominates. The tree canopy's repeated leaf construction and the regular surrounding stone are more apparent than in the reference. The reference's richer shape variety and layering therefore remain a clear craft gap even when allowing for different gameplay and aspect ratio.

The useful next response is to improve the character's facial integration and the detail camera's composition, then use selected static environmental accents and material variation outside the legal playfield. Filling the board with obstacles or foliage purely to resemble the reference would undermine the game's existing readability and is not called for by this verdict.

## Next acceptance evidence

1. Same neutral head angle before/after the eye-rim and mouth simplification, at both detail size and a reduced display size.
2. A brief close-view sequence showing neutral, anticipation/turn, collection, and danger expressions, with readable eye/mouth coordination.
3. A lower detail-camera frame at the board center plus representative edges/headings, demonstrating a useful backdrop and an unobscured head.
4. A fresh whole-scene and mobile review after those changes. Preserve the board, truthfully represented path, goal, hazard/portal cues, and safe overview.

The benchmark verdict remains **LOSE**, with the face integration and floor-heavy detail composition as the highest-value next visual corrections. The separate desktop pacing failure remains open; still-image quality does not excuse it.
