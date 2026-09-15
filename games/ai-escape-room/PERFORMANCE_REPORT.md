# Performance Report

## Design budget
- one shared cube vertex buffer / one WebGL program;
- existing snapshot cap: 48 visible authoritative objects;
- one directional shader light plus bounded emissive practicals;
- no real-time shadow map; contact-shadow proxies instead;
- 18 bounded cosmetic dust particles;
- no texture downloads, model downloads or runtime CDN dependencies;
- device pixel ratio capped at 2;
- state polling remains bounded at the existing 180 ms cadence.

The renderer exposes diagnostics including FPS estimate, physical prop count, material-family count, active-light count, shadow mode, particle count and approximate draw-call pressure. These values are presentation diagnostics only.

## Evidence status
Static design bounds are implemented. Measured CI/browser FPS and final capture quality must be read from the latest runtime run before claiming acceptance. No synthetic soak or performance number is treated as measured evidence.
