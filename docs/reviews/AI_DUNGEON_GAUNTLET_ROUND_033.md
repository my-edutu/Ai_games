# AI Dungeon — Gauntlet Round 033: Physically present worn floors

**Status at authoring:** Implementation and TDD completed locally; GitHub exact-head CI and actual WebGL screenshots not yet verified. **Diablo IV quality bar NOT MET.** Draft PR #49 only.

## Visual gap
Verified Round 31 real desktop/raw-world game captures show a very regular blue-grey tiled ground plane. Round 32 introduced shallow, irregular wall spalls. Floor surfaces still lack comparable depth and material storytelling.

## Implementation
Added deterministic cosmetic `floor-ruins-plan.js`: maximum 144 low raised stone pieces and 22 shallow biome-specific damp patches, never within three Manhattan cells of the spawn or two cells of the exit. Every placement belongs to an existing walkable tile and is reproducible without randomness from the authoritative simulation.

Added two Three.js instances with original irregular bevel geometry and muted PBR stone/wet surfaces. The instances are nonblocking, have no additional lights, are deleted with the retired world, respect reduced motion (no animation), and expose real `floorRuins` rendering metrics. The WebGL source is unchanged for camera, world transitions, gameplay, AI and financial/audience systems.

## TDD and evidence policy
Three real seeded-map foundation tests failed before the pure planner existed, then passed after implementation. The new Playwright tests inspect the genuine world rendering on desktop and mobile, capture the real canvas and report texture/visibility/instance bounds. The source archive is local only until GitHub commit and CI; never claim a browser pass or matched Diablo IV preference without a corresponding exact commit and genuine capture.

## Remaining harsh critic gaps
Floor material depth is a small independent improvement, not AAA art. Hero and enemy GLB fidelity, stone surface realism, animation fluidity, contrast/horizon composition, frame pacing, independent blind A/B and production readiness remain open. No outside licensing changes. Pending independent evidence and review, leave the PR draft and do not merge.
