# Visual Architecture

## Authority boundary

The existing fixed-step Ant Colony simulation remains authoritative. The browser consumes the immutable public snapshot and semantic camera/audio output; presentation code does not write back into simulation state.

```text
Authoritative simulation
  -> sanitized immutable render snapshot
  -> presentation adapter / semantic camera + audio
  -> living-world Canvas renderer
  -> documentary camera transform
  -> organic VFX + compact broadcast overlays
```

## Renderer structure

The current rebuild deliberately upgrades the existing Canvas path in-place instead of adding a new 3D dependency before the visual contract is proven. The renderer now composes sky/atmosphere, surface biome, soil strata, roots, authoritative world cells, contextual pheromones, brood/queen, ants, predators, weather and foreground depth.

Visual-only variation uses stable hashes of world/entity identifiers or tick-derived animation. It cannot alter authoritative food, threat, pathing, brood, queen health, tunnel cells, predator state or outcomes.

## Scalability

Ants render through explicit near/mid/far LOD. Effect lists and audio voices are bounded; stale ant-motion cache entries are pruned. Decorative world dressing is generated deterministically rather than accumulated each frame.

## Integration contract

The browser continues to poll `/ant/state`, preserve `window.__ANT_PUBLIC_STATE__`, consume server camera/audio semantics, preserve `/ant/command`, clean feed, reduced motion and high contrast. This keeps existing operations, persistence, tests and stream hosting compatible.