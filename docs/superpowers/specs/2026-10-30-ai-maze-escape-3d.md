# AI Maze Escape — 3D Gauntlet specification

## Authorization and goal

The user approved the proposed Gauntlet prompt and instructed: “implement it here.” Implement the upgrade in this repository, autonomously, with separate builders and fresh critics. The deciding visual reference is Nintendo's Captain Toad: Treasure Tracker. Luigi's Mansion 3 and ASTRO BOT provide supporting examples of scene finish and character motion. Do not call a comparison won unless actual output supports that verdict.

## Experience

Viewers watch an expressive explorer discover a lost, overgrown maze, collect keys, evade known hazards, and earn a route home. Keep the existing partially observed autonomous simulation and legal result/restart loop. Build an original stylized 3D ruin garden with warm sandstone, jade foliage, turquoise water, amber light, animated characters, and an unobtrusive, legible spectator interface. The explorer, known route, interactables and threats take priority over decoration.

## Fixed reference set

- Primary: https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/
- Primary stills: official gallery `bc357ae2086f43bbcaf6cef34a8caad0ddfcd739d0ea25db236a0a4b71bc81a8` (water/character scene), `72a7b70a3161a757d40571a9264444e307bdcd83a851978510ed8fa31e762a6d` (maze/hazards composition).
- Supporting: https://www.nintendo.com/us/store/products/luigis-mansion-3-switch/
- Supporting: https://www.playstation.com/en-us/games/astro-bot/
- Compare real captured exploration, detail, danger, result/restart and mobile output. Use comparable framing and resolution, randomize unlabeled A/B where feasible, and record why blinding is imperfect when recognizable characters reveal provenance.

## Acceptance

1. The actual `/maze` application renders a true 3D scene with modeled, textured/material-finished, articulated explorer and threat characters, distinct keys/locks/traps/exit, readable paths, environment depth, lighting and shadows.
2. Presentation consumes only the existing sanitized public snapshots. It never reads or fabricates hidden passages, entities, results or AI knowledge. No changes to the authority/replay rules are required.
3. Smooth motion follows observed legal routes rather than interpolating through walls when polls skip ticks. Camera preserves protagonist visibility. Reduced-motion and high-contrast settings remain functional.
4. Desktop, portrait and landscape views preserve visible game content, captions, primary objective, and usable controls without horizontal overflow. Clean feed suppresses optional chrome. Audio starts only after user activation and can be muted.
5. Controls affect presentation only. Loading, reconnecting, WebGL loss/failure, result and restart are explicit and recoverable; no silent black output or duplicate polling.
6. Geometry/materials, effects, history, audio voices, event listeners and render targets have bounded lifecycles across repeat runs. Record measured browser frame/memory evidence and the environment used; do not claim console performance from a software-rendered test environment.
7. A separate `/maze/progress` page shows dated real captures, reference links, independent verdicts, changes, next gaps and verification status. It never invents completion percentages, review results or victory.
8. Retain passing affected simulation and browser contracts, add meaningful regressions for new renderer controls, truth boundaries and recovery, and review the whole integrated game after component reviews.

## Boundaries

Work on a feature branch. Keep the Gauntlet as a development workflow separate from in-game modes. Preserve other catalogue games. Use the existing Three dependency and self-host browser modules; maintain CSP. All new visual/audio assets must be original or have documented licenses. Do not claim R5 production readiness or a Nintendo-quality victory from build/test success. Ultracode is unavailable in this environment; use available subagents and record that limitation.
