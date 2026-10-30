# Archive furniture proposal — ready for integration

## Source boundary

- Proposed file: `/tmp/escape-scenery-next.js`.
- Copy target after the frozen-source browser boundary: `public/ai-escape-room/scenery3d.js`.
- Original source SHA-256: `d36862d119bc9053a6e325d99328e90c5ea6fb2ac4a1fc35493e1a71c8b37dd1`.
- Proposal SHA-256: `46d1fe0b81224549c2082ca75d5f8c939c1393807e69f48bd17aa7478417b644`.
- No repository source was changed by the builder. No server or Chromium process was started.

## Evidence and chosen improvement

Read `AGENTS.md`, the Gauntlet ledger, the round-03 independent review, and the local creative-direction, performance-optimization and game-feel skills. Inspected actual round-03 room, mechanism and mobile images beside `room4-library-wide.jpg` and `escape-simulator-egypt-avatar-wide.jpg`.

The proposal addresses the critic's largest gap: the dominant furniture grouping looked like repeated simple objects, while the reference environments used differentiated, visibly constructed furnishings and purposeful relationships. It does not claim reference parity without a new independent review of actual output.

## Changes

- **Writing bench:** chamfered front corners; retained full usable top; breadboard join lines; a framed filing case with two drawer proportions, recessed fields and shaped cup pulls; a distinct open ledger rack with turned legs and shelves; a shaped kneehole apron with visible joinery. Darker existing archive wood separates the carcass from the floor, with the prior warm/honey materials retained for the structural edges.
- **Chair:** moved into the clear interval between the public floor columns and turned toward the writing inset. Added a shaped crest/back, convex upholstered cushion, arms, splayed legs, stretchers, ferrules and selective upholstery tacks.
- **Mechanism stands:** retained the original circular support caps and attachment locations. Their lower bodies are now a faceted drum, turned baluster with swept feet, paneled cabinet, and open trestle.
- **Bookcases:** a folio crown and a different specimen-archive cornice; grounded plinths; raised pilasters; grouped horizontal folios, standing volumes and archive boxes instead of mirrored rows of eight similar books.
- **Grounding:** existing contact-shadow material reused under the new feet and chair. The existing room-owned wood material also casts shadows when the selected quality tier enables them.

No active object coordinates, gameplay state, mechanism logic, camera code, or new external assets were introduced. All photo maps remain the existing self-hosted CC0 files. Commercial reference images are not included in the scene.

## Static allocation measurement

Measured real repository-pinned Three.js geometry in Node, with only canvas painting and texture loading stubbed. This measures geometry allocation and batching, not rendering, GPU timing, visual quality or actual hardware performance.

| Theme | Original static triangles | Proposed static triangles | Delta | Original batches | Proposed batches |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cipher Vault | 29,322 | 35,582 | +6,260 | 17 | 18 |
| Clockwork Study | 29,322 | 35,582 | +6,260 | 17 | 18 |
| Chromatic Lab | 29,934 | 36,194 | +6,260 | 20 | 21 |
| Archive Zero | 29,322 | 35,582 | +6,260 | 17 | 18 |

The added static triangle allocation is 8,740 below the permitted 15,000 delta. The one additional batch uses the already-owned `m.wood`; no additional material or texture family is created. Texture cache remains 16, geometry cache is a finite 228 templates after warm-up (original 166), and merged vertex attributes grow by 600,960 bytes. Both caches are unchanged through the last two complete four-theme cycles of the twelve-build check.

The integrated 190-draw / 150,000-triangle room gate still belongs to the root's actual browser run. Shadow passes and dynamic mechanisms are outside this static-only allocation report.

## Attachment checks

- `room3d.js` and its attachment transforms remain untouched.
- The four original pedestal cap geometries, positions, rotations and scales compare identically.
- Maximum desk geometry height is `0.9465000001341104`, the same original brass-edge level; the clue mesh begins at `0.9515`. No tall desktop clutter was added.
- Every added shelf part clears all 24 reserved clue/tool/decoy envelopes, including the top row. The original shelf surface geometry is retained.
- The complete new chair bounds, including contact planes, clear twelve floor attachment envelopes. Its total bound is x `[-0.875, 0.775]`, y `[0.06315, 1.71234]`, z `[-1.74, -0.14]`.

## Reproduction and remaining acceptance

`node --check /tmp/escape-scenery-next.js` passes.

`node /tmp/escape-scenery-budget.cjs` passes; detailed output is `/tmp/escape-scenery-budget.json`.

The first cap-identity assertion used strict equality across separate VM array prototypes and failed even though the values matched. The checker was corrected to compare serialized geometry/transform values; no source change was made to the caps to obtain the pass. A static clearance check also prompted moving the new cornice dentils above the top-row attachment envelope before the final run.

After integration, inspect fresh room, mobile, and oblique desk/chair captures. Judge whether the darker carcass keeps enough local detail, whether the centered angled chair leaves the stands readable, and whether the new furniture silhouette closes the actual visual gap. No visual pass has been asserted.
