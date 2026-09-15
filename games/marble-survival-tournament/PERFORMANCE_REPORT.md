# Performance Report

## Design budgets

Presentation quality is explicitly tiered:

| Preset | Pixel ratio cap | Shadows | Track segments | VFX pool | Marble sphere segments |
| --- | ---: | --- | ---: | ---: | ---: |
| Low | 1.0 | off | 16 | 28 | 18 |
| Balanced | 1.35 | on | 24 | 48 | 24 |
| High | 1.75 | on | 32 | 68 | 32 |
| Ultra | 2.0 | on | 40 | 88 | 40 |

The effect pool is bounded; track geometry is segmented predictably; no full-scene post-processing stack is used. Three.js resources are rebuilt on arena/quality transitions and disposed when replaced.

## Authority budgets

The deterministic solver already caps max substeps, collision iterations, contacts per tick and collider count. Arena validation rejects expected contact loads beyond configured budget.

## Measurements

FPS, draw calls, triangle count, GPU memory and browser heap are NOT_PROVEN in this connector session. No fabricated numbers are recorded.

## Runtime gates still required

- capture FPS/frametime on low/balanced/high;
- inspect renderer draw calls/triangles;
- repeated arena reset heap trend;
- 30/60/120 Hz render-rate comparison while authority tick count stays fixed;
- sustained tournament loop for stale object/body detection.
