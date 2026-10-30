# Round 9 candidate: full-scene and recording follow-up

## Finding

**The jaw/cheek/neck wedge persists in the later, narrower-mouth pose. It is not confined to the wider post-pickup mouth pose.** The original blind preference for B remains unchanged.

The full candidate still shows the same distracting junction identified in the anonymous crop. The actual recording then provides a wider mouth after a fruit pickup and a later narrower-mouth view. In the later view, a pale/background triangle remains above a pointed chin/neck projection beneath the lip. Changing the jaw opening does not resolve the physical reading of that attachment.

## Evidence inspected

- Full scene: `/tmp/snake-3d-ci-round9-preview/artifacts/phase3/character-current.png`.
- Actual recording: `/tmp/snake-3d-ci-round9-motion/character-motion.webm`, approximately 45 seconds long.
- Decoded overview samples across the recording, quarter-second samples from 15 through 22 seconds, and full-resolution frames at 16.25, 28, and 44 seconds. Later samples at 24, 32, 36, and 40 seconds were also inspected.

I did not inspect implementation source, edit the character, or run a browser/GPU session. Mapping information was received only after the original blind verdict had been saved and reported.

## Visible states

| Time or evidence | Visible state | Jaw-junction observation |
|---|---|---|
| Full candidate still | Close three-quarter head view with a substantial black mouth opening | The pale lower rim and cream side streak converge near a conspicuous triangular gap/form on image-right. The nearby neck underside ends abruptly, so the jaw does not read as one rounded solid connection. |
| 15.00–16.00 s | Side/overhead approach to fruit; UI length is 8 | This angle and scale do not expose the rear jaw junction well enough for a confident attachment judgment. |
| 16.25 s | Fruit has disappeared, UI length is 9, and the camera presents the head from the opposite three-quarter side. Mouth is visibly wider. | The cream side streak, thin lower lip, and bulky cheek/neck remain distinct competing elements. The mouth reads as a shallow dark plate with a thin light rim more than a substantial articulated jaw. |
| 28.00 s | Later narrower-mouth pose, used as the available resting comparison | A sharp little chin/neck prong remains under the side of the mouth. A bright triangular gap sits above it. This is visible on image-left in this camera, approximately x540–570 and y510–530 in the 1280×960 decoded frame. |
| 32.00–44.00 s | Continued later narrow-mouth view; no further fruit pickup is visible in these samples | The pointed attachment silhouette and pale gap remain visible. The 44-second full-resolution frame confirms that the issue survives well beyond the initial wider pose. |

“Post-pickup/wider” and “later narrower/resting” describe what is visible. I cannot independently verify internal animation-state labels from these images. The late pose is nevertheless sufficient to establish that the defect is not exclusive to the most-open mouth configuration shown.

## Neutral versus chewing assessment

The wider pose makes the thin dark mouth surface and bright rim conspicuous. In the narrower pose, reducing the opening makes the mouth less dominant, but exposes the rear attachment as a pointed hanging shape with a light triangular gap above it. These are two expressions of the same weak anatomical connection.

The recording has long stretches in which the pose looks nearly held. Its visible samples do not provide a sufficiently clear continuous open–close chewing sequence to judge deformation through the whole cycle. I therefore do not award a motion or smoothness pass, and I do not infer one from the recording's nominal frame rate. A check of decoded frame hashes did not establish exact duplicate full frames; “held-looking” is a visual limitation, not a claim that the recording contains proven frozen-frame runs.

## Smallest useful repair

Repair the local lower-jaw attachment rather than relying on a smaller mouth opening to conceal it:

1. Give the rear lower jaw a rounded, visibly solid transition into the cheek/neck.
2. Remove the pointed prong and the bright triangular gap from the visible underside silhouette.
3. End one continuous lip edge at a clearly readable mouth corner; avoid multiple pale lines suggesting detached layers.

This should preserve the existing character's broad muzzle, palette, scale treatment, and friendly eye expression.

## Visual acceptance criteria sent to the builder

- In a neutral/narrow-mouth three-quarter view, the underside of the jaw flows into the neck without the pointed wedge or an exposed light triangle.
- In the wider mouth view, the same connection remains solid and rounded, with readable jaw thickness.
- The lip reads as one continuous edge ending at a single mouth corner rather than several competing stripes or layers.
- The result holds from both of the three-quarter sides represented by the supplied still and recording.
- A visible chewing cycle returns to the same clean resting attachment; no wedge, detached-looking rim, or abrupt silhouette change appears during the transition.

The timestamped defect and these criteria were sent directly to `/root/snake_mouth_join_builder` and `/root` before this report was saved.
