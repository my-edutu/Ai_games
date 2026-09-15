# Visual Architecture

`authoritative EscapeState -> buildEscapeRenderSnapshot -> EscapePresentationController -> /escape-room/state -> app.js -> EscapeRoom3D -> mechanisms3d -> room3d-polish -> WebGL canvas`

The browser cannot call gameplay rules. It may only poll immutable snapshots and move a presentation camera. `mechanismKind` is derived from a puzzle target and is intentionally non-secret; it selects geometry but exposes no solution.

`room3d.js` owns the shared WebGL program, cube buffer, perspective/look-at camera, room shell, furniture, dynamic prop transforms, avatar, picking and camera interpolation. `mechanisms3d.js` decorates authoritative object state with puzzle-specific mechanical geometry. `room3d-polish.js` adds cosmetic dust, contact-shadow proxies, pressure lighting and renderer diagnostics. `app.js` owns polling, minimal DOM HUD/captions and semantic WebAudio cues.

On WebGL initialization failure the page activates the existing verified safe scene. Presentation failure never changes the authoritative checksum.
