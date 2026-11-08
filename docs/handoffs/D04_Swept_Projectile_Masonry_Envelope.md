# D04 — Swept-width projectile masonry clearance

**Status: independently reviewable source correction; genuine audiovisual realism UNVERIFIED.** Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`. This change belongs only to `feat/dungeon-d04-combat-feedback-realism-20261108` and keeps legacy `/dungeon` unchanged.

## Observable source defect

The previous D04 public-map planner checked only the arrow/spell **centreline**. The existing rendered arrow is a 0.43m cylinder with up to 0.024m radius. At 0.02m lateral clearance it can visibly intersect masonry even though the centreline stays entirely in a walkable tile. Source code also missed final-frame contact when wall entry was exactly at the segment's terminal point. This was diagnosed from source, not real gameplay footage.

## Independent implementation

The straight pre-target-clearance ray now checks the public-map 2D **swept width** by intersecting the finite segment with only the relevant solid tiles, each conservatively expanded by 0.035m (mesh radius plus 0.011m tolerance). It retains an additional 0.31m longitudinal stone margin and the 0.20m minimum visible flight; contacts too close to the start suppress only the visual. Off-map boundaries fail closed even when perimeter is encoded as walkable. No effect creates a strike, attacker, target damage, wall explosion or false arrival sound. Real spells share the same conservative radius as arrows.

The map is read once at release by the existing D04 adapter. The canonical 19×19 grid takes at most 361 tile candidates per shot; a 63×63 validated maximum takes at most 3,969. No new geometry, retained pool, draw call, audio source, per-frame raycast or RNG. Original WebAudio opt-in/mute, reduced-motion/flash, cleanup, deduplication and frame-submission handshake remain untouched.

## Test-first and unresolved evidence

On the previous algorithm two newly authored near-grazing/source-overlap tests failed, followed by a failing exact-terminal-wall test before correction. A detached Node 22 harness passes **13/13** (six prior contracts + seven added cases) after implementing the identical helper algorithm; this is not the full repository suite or CI. The previously asserted full-face collision distance was tightened by the intentional 0.035m swept-width margin.

The shared game coding/browser tunnel is disconnected: no real Dungeon WebGL/PCM recording or synchronized three-viewpoint desktop/390px mobile BEFORE/AFTER, Warden sequence, gameplay checks, 20-minute soak or independent audiovisual realism review exists for this commit. The public map cannot certify decorative 3D prop collision, vertical height clearance, or actual GLB sword-tip movement.

## Required integration review

Follow `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`; run `npm ci && npm run build`, focused Node tests and D04 Playwright with actual model assets; record genuine canvas+opted-in sound bus for misses, HP-confirmed hits, blocks, dodges, arrow/spell, Warden warning/release/recovery/counter and restart from three viewpoints at 1440×900 and 390×844. Reject visual stone penetration or invented contact. Roll back by reverting only this D04 commit.
