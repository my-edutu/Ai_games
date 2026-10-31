# Camera Director

## Authority ownership
Camera priority comes from the server-side `chooseMarbleCameraDirective` path. The browser consumes the directive; it does not decide sporting significance independently.

## 3D modes
- `overview`: elevated broadcast view that keeps the arena and pack legible.
- `cut-line`: tighter qualification-battle framing.
- `danger`: lower, closer framing around threatened marbles and hazards.
- `finish`: biases target and camera toward the finish structure.
- `victory`: close champion-oriented camera.

## Motion behavior
Presentation interpolates camera eye/target toward authority-selected framing. Reduced-motion preference disables gradual easing. Zoom is bounded, and the camera never changes simulation state.

## Speed/legibility
Current camera design uses wider overview framing for pack context and tighter contextual modes for event emphasis. Further runtime critique must verify that high-speed movement remains comfortable at 16:9 and that hazard framing does not crop important landing/escape space.

## Replay status
Short authoritative replay buffers are not yet implemented in the WebGL renderer. Replay remains incomplete rather than fabricated.