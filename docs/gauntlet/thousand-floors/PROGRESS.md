# AI vs 1,000 Floors — live Gauntlet progress

## Current verdict: third scene pass underway; benchmark not passed

Baseline commit: `d1678cd`. Game 4 appears in the catalogue as a finite campaign with checkpoints; there is no Game 4 runtime or scene to capture at this baseline. The first screenshot will therefore be a new implementation, not a before/after improvement to an existing playable game.

The fixed main reference is ASTRO BOT gameplay, with Luigi's Mansion 3 for floor identity and Returnal's Tower of Sisyphus for tower presentation. Sources and criteria are in the design specification. No reference assets will be shipped as original work.

## Work in progress

| Piece | State | Evidence / next gate |
|---|---|---|
| Finite campaign, deterministic movement, checkpoints | Review round 3 | Focused core/server checks pass; recovery-state edge case corrected and awaiting independent verification |
| Original articulated character and 3D environments | Scene pass 3 | First actual visual comparison prefers ASTRO BOT; architecture, materials, character and camera are being rebuilt |
| Responsive spectator experience and sound | Integrated | Mobile settings and progress-page checks pass; transport/reload tests hit rendering delays and remain unresolved |
| Independent critic loop | Active | Three campaign reviews and one actual visual/motion comparison; reports linked below |

## Iteration history

- **Baseline:** verified no playable Game 4 in current main. Created isolated implementation branch, approved goal, fixed references and shared builder interfaces.
- **Iteration 1:** implemented a real worker-driven 3D campaign. [Desktop capture](../../../evidence/thousand-floors/captures/iteration-1-desktop.jpg), [mobile capture](../../../evidence/thousand-floors/captures/iteration-1-mobile.jpg). The [visual critic](visual-critic-round-1.md) inspected moving gameplay and the exact official ASTRO BOT clips. Reference preferred: environment depth, materials, articulation and portrait camera were the largest gaps.
- **Iteration 2:** improved platform dressing, compact mobile HUD, interpolation and exit visibility. [Desktop capture](../../../evidence/thousand-floors/captures/iteration-2-desktop.jpg), [mobile capture](../../../evidence/thousand-floors/captures/iteration-2-mobile.jpg). [Campaign review 1](campaign-critic-round-1.md) exposed hazard contact and impossible saves; [review 2](campaign-critic-round-2.md) verified contact fixes and found reward/phase inconsistencies. Builder corrected both and added independently timed double crossings on selected floors.
- **Iteration 3 in progress:** procedural stone/brick/copper surfaces, hollow architecture and district landmarks; articulated character, camera fitting and geometry batching in progress. Twelve focused core tests passed before the newest independent review. Browser trace shows delayed queries during heavy rendering; no performance pass is claimed. Fresh critic found a forged recovering state with zero retries that is accepted but becomes invalid after one tick; the builder corrected it with a regression test, and independent verification is in progress.

## Reproduce the live review

Run `npm ci`, then `npm run floors:stream`. Open `http://localhost:4184/floors/` for the game and `/floors/progress` for the page, which refreshes this iteration record every five seconds. `npm run test:floors` exercises core/server behaviour; `npm run test:floors:browser` exercises the real browser.

The [reference manifest](reference-evidence.md) records official sources, exact clip times and comparison limits. Reviews use matched viewing sizes where feasible; the known characters and HUDs prevent a credible fully blind comparison, so no blind preference study is claimed.

## Honest limitations

No visual comparison has passed yet. `ultracode` is not installed in this environment; the explicit builder/fresh-critic workflow runs using the available subagent tools. Production operations and live audience providers are outside this implementation's evidence.
