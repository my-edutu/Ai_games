# AI vs 1,000 Floors — live Gauntlet progress

## Current verdict: building; benchmark not passed

Baseline commit: `d1678cd`. Game 4 appears in the catalogue as a finite campaign with checkpoints; there is no Game 4 runtime or scene to capture at this baseline. The first screenshot will therefore be a new implementation, not a before/after improvement to an existing playable game.

The fixed main reference is ASTRO BOT gameplay, with Luigi's Mansion 3 for floor identity and Returnal's Tower of Sisyphus for tower presentation. Sources and criteria are in the design specification. No reference assets will be shipped as original work.

## Work in progress

| Piece | State | Evidence / next gate |
|---|---|---|
| Finite campaign, deterministic movement, checkpoints | Building | All-floor, multi-seed, replay and save tests |
| Original articulated character and 3D environments | Building | Running desktop, mobile and moving captures |
| Responsive spectator experience and sound | Building | Browser interaction and accessibility review |
| Independent critic loop | Awaiting first build | Fresh critics inspect actual outputs |

## Iteration history

- **Baseline:** verified no playable Game 4 in current main. Created isolated implementation branch, approved goal, fixed references and shared builder interfaces.

## Honest limitations

No visual comparison has passed yet. `ultracode` is not installed in this environment; the explicit builder/fresh-critic workflow runs using the available subagent tools. Production operations and live audience providers are outside this implementation's evidence.
