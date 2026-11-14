# Whole-game visual review: round 8 / v6

## Verdict

**Round 8 versus round 7: a narrow WIN, driven by a less distracting mouth shape.**

**Round 8 versus the supplied official Snake Pass quality bar: LOSE.**

**Detached-jaw issue: PARTIALLY RESOLVED, not closed.** The broad brown hanging oval from round 7 is much reduced. The new close view still exposes a freestanding dark smile loop and a thin lower jaw that ends in an angular point. The face is improved, but the mouth still reads as an attached accessory rather than a fully integrated anatomical opening.

**Motion: no smoothness pass.** The new recording contains long near-static spans and large changes between held states. This is a finding about the supplied recording. I cannot isolate live application performance from capture behavior using this artifact alone.

## Scope and comparison limits

I directly inspected the round 8 close character, desktop, and portrait screenshots; revisited the round 7 close character; and compared the actual visuals with the supplied official Snake Pass image. I decoded the new video with CPU tools, sampled the full recording at two-second output intervals, and inspected a denser five-frame-per-second sequence around 11.2–14.2 seconds. I also ran frame freeze detection on the recording. I did not launch a browser or GPU workload, inspect application code, or edit code.

This is a **nonblind comparison**. I had previously reviewed round 7 and knew which images were newer. The two hero screenshots also have different camera composition, body arrangement, and background, so they are not a controlled same-pose A/B. I attempted to obtain a separately masked comparison, but no fresh reviewer thread was available; I do not claim a blind result. Neither project intent nor the supplied FPS figure is used as proof of what the images or animation achieve.

### Artifacts

- Round 8: `/tmp/snake-3d-ci-round8/artifacts/phase3/character-current.png`
- Round 8: `/tmp/snake-3d-ci-round8/artifacts/phase3/desktop-1920x1080.png`
- Round 8: `/tmp/snake-3d-ci-round8/artifacts/phase3/portrait-390x844.png`
- Round 8 motion: `/tmp/snake-3d-ci-round8-motion/character-motion.webm`
- Prior close view: `/tmp/snake-3d-ci-round7/artifacts/phase3/character-current.png`
- Reference: `/tmp/snakepass_quality_refs/screenshot_0.jpg`, supplied as official media from the [Snake Pass Steam listing](https://store.steampowered.com/app/544330/Snake_Pass/).
- Sample sheets: `/tmp/snake-round8-motion-sheet.png` and `/tmp/snake-round8-face-motion-sheet.png`.

## Face and jaw: what improved, what remains

The previous close view made the mouth the dominant defect: a large, flat brown oval hung below the muzzle and carried a broad pale rim. Round 8 reduces the depth and visual weight of that opening. The friendly eyes, nostrils, striped body, and green/yellow identity remain legible, and the head now reads more as a single compact volume at first glance. That is a real local improvement.

On closer inspection, the dark outline across the mouth remains visibly separated from the facial surface. At the front/right corner it projects like a thin loop rather than terminating as part of the cheek. The pale underside beneath the dark cavity ends in a sharp triangular flap. This point is particularly clear in the new still and recurs in the lower camera views in the video samples. The revision has changed a large hanging paddle into a smaller, sharper accessory; it has not fully solved the attachment problem.

The eye housings still read as two prominent domes on top of a broad muzzle, and the broad specular shading has a plastic quality. These are secondary to the mouth silhouette because the basic friendly expression already works. More texture or additional face pieces would not address the immediate problem.

### Single largest remaining visual-art gap

**The hero's resting facial silhouette is still unfinished at the distance used by the close camera.** The mouth line and chin need to belong to the same rounded head form. Until they do, a viewer looking at the hero sees construction details before expression.

### Smallest useful correction

**Make the mouth outline lie on the mouth surface, and round the lower-jaw front.** Recess or remove the visibly freestanding dark loop; make the cream lower lip a shallow curved rim rather than a pointed wedge; ensure both corners visibly meet the cheek. Retain the smaller opening introduced in round 8. Do not add another outline or decorative mesh layer to conceal the gap.

A useful review capture is the same front three-quarter angle with both neutral and eating expressions, plus one side view. The visible acceptance criterion is simple: no wire-like loop ahead of the lip, no pointed hanging flap, and a continuous cheek-to-jaw silhouette in both poses.

## Whole-game comparison

| Criterion | Round 8 observation | Judgment |
| --- | --- | --- |
| Recognizable autonomous Snake | The rectangular board, stripe route, fruit, length counter, and self-playing label communicate the game immediately. The long route remains easy to follow in desktop view. | Works; retain. |
| Desktop composition | The UI is orderly and the arena is framed clearly. The scene remains dominated by one large pale slab, with the character's expression effectively invisible at this distance. | Readable, but not rich enough to meet the reference's character-led presentation. |
| Portrait composition | The length goal and full board remain visible. Controls overlap the lower viewport and the head is very small. | Usable overview; character appeal is largely absent. |
| Scene depth | The close view has a broad nearly uniform cyan background and sparse distant silhouettes. The overview relies on a single island/slab layer against teal water. | Still below the reference's overlapping foreground, middle distance, atmospheric background, and stronger depth cues. |
| Material separation | Pale tiles, repeated foliage forms, simple stone blocks, and broad character highlights create a coherent palette but limited material distinction. | Still below the reference's richer stone/foliage/character separation. |
| Image finish | The 3D viewport appears softer and coarser than the crisp surrounding interface, especially in distant foliage and masonry edges. | A visible polish gap; no rendering cause inferred from the screenshot. |
| Main character | Smaller mouth opening improves the first impression. The loop and pointed chin remain visible in the hero view. | Improved versus round 7, not yet finished. |

The environmental gap does not require platformer rules, vertical navigation, or filling the board with obstacles. Better edge silhouette, a more layered backdrop, more deliberate light separation, and controlled surface variation are compatible with the same flat readable Snake board. Those are later scene-art opportunities; the current bounded face defect should be finished first.

## Actual motion evidence

The new file is 30.64 seconds long, 1280 × 960, with a nominal 25-fps video stream. Those metadata do not establish an equivalent live animation rate.

The sampled sequence shows camera changes, different body poses, and a visible change in head orientation. However, successive samples often hold the same composition and pose. A dense sample around the transition to the close camera still shows groups of repeated states rather than enough intermediate poses to judge continuous turning. The rounded body looks continuous in the inspected states; that is a pose observation, not an animation pass.

Near-static intervals reported by frame analysis include:

- 7.28–9.96 seconds: 2.68 seconds.
- 15.92–17.68 seconds: 1.76 seconds.
- 17.68–20.08 seconds: 2.40 seconds.
- 25.88–28.88 seconds: 3.00 seconds.

I used a conservative low-change threshold of -60 dB. The exact classification is an image-change measurement, not a diagnosis of the renderer. The corresponding held states are also apparent in the contact sheet. As delivered, this artifact cannot support a claim of smooth animation; nor can I determine from it whether the cause is application rendering, browser scheduling, recording, or an intentional hold.

The recording also does not show an unambiguous, continuously visible fruit pickup from approach through swallow and departure. I therefore cannot validate the timing or truthfulness of the eating reaction. Smoothness and event timing remain a separate delivery gate even after the still-image face correction.

## Recommended decision

Keep the round 8 reduction in jaw opening. Make the one bounded lip/chin correction above, then judge it in actual close captures. Keep the readable board and coherent interface. Do not describe this round as meeting the Snake Pass quality bar or as having demonstrated smooth motion. It is a modest visual improvement with a remaining facial construction defect and unresolved motion evidence.
