# Performance Report — Renderer V2

## Baseline finding

The previous evidence bundle reported roughly 38 FPS with 49 draw calls while the scene was still visually simple. The renderer also allowed up to 2× device pixel ratio. That was an unfavorable visual-quality/performance exchange and is treated as a failed optimization target, not as an acceptable baseline.

## V2 design budget

- repository-pinned, self-hosted Three.js; no runtime CDN;
- snapshot cap remains 48 visible authoritative objects;
- reusable cached primitive geometries and shared PBR material families;
- four bounded lights, with only one light eligible to cast shadows;
- high quality pixel ratio capped at 1.25, medium at 1.0, low at 0.82;
- adaptive quality uses a bounded rolling FPS sample and degrades shadows/pixel ratio/particles before semantic puzzle geometry;
- 54 / 36 / 18 cosmetic dust points for high / medium / low tiers;
- maximum six hazard presentations and eight transient solve/escape bursts;
- target draw-call budget <190 and triangle budget <150,000 in the reference room;
- state polling remains bounded at 180 ms and cannot drive authoritative timing.

## Runtime diagnostics

The renderer exposes engine/version, estimated FPS, quality tier, adaptive-quality state, draw calls, triangles, physical prop count, mesh/material family counts, themed dressing count, hazard visuals, active lights, shadow mode and particle count. These are presentation diagnostics only.

## Evidence status

The V2 implementation is a candidate until fresh CI/browser evidence is available. Do not reuse the old ~38 FPS number as a V2 result and do not claim a performance pass from static code inspection. Final assessment must use the latest runtime diagnostics plus screenshots and, for production readiness, longer-running resource evidence.
