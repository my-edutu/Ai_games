# Camera Director

## Primary view
The public game uses a cinematic three-quarter perspective rather than a flat map. The camera is presentation-only and cannot alter the run.

## Tracking
`cameraLookAhead(snapshot)` inspects only the public planned route/travel history. The renderer targets the explorer plus a bounded forward offset, then smooths toward that target unless reduced-motion mode is active.

## Framing
Camera distance scales with the current bounded public view so local exploration remains readable while overview/result states can reveal more discovered space. Existing presentation `camera.zoom` remains an input and is clamped by the geometry/camera distance design.

## Occlusion strategy
The initial implementation relies on elevated three-quarter framing, bounded wall height and public-view cropping to limit wall occlusion. No hidden geometry is queried for collision avoidance.

## Director contract
Presentation emphasis may follow danger, result or existing camera mode supplied by the presentation controller. It must never fabricate danger, move the explorer, change pathing or change outcomes.

## Acceptance
Browser evidence must confirm that the explorer and adjacent passages remain visible and that the camera does not collapse back into a top-down grid impression.
