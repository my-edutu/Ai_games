# SDD ledger — plan: docs/superpowers/plans/2026-10-30-ai-maze-escape-3d.md

## Identity

- Base: d1678cd on `main`.
- Work branch: `feat/maze-3d-gauntlet`.
- User authorization: implement the proposed 3D Gauntlet here.
- Benchmark: fixed official Captain Toad water/character and maze/hazard screenshots, plus real gameplay clips; supporting Luigi's Mansion 3 and ASTRO BOT.
- Status: implementation in progress; benchmark not passed.

## Preflight

| Tasks | Shared interface or internal agreement | Finding |
| --- | --- | --- |
| 1 / 2 / 4 | Character/world share y=0 floor, 2.4 cell size and centered grid coordinates | Consistent; host owns character position |
| 1 / 4 | Group/update/dispose contract, seconds and heading angle | Consistent; host owns run lifecycle |
| 2 / 4 | Public snapshot only; no authoritative world imports | Consistent; hidden data stays server-side |
| 3 / 4 | Existing DOM IDs plus named controls; frame-driven audio | Consistent; UI builder does not edit host |
| 1 | Original geometry; visual review rather than implementation-mirroring assertions | Consistent |
| 2 | Public geometry and resource lifecycle are both acceptance conditions | Consistent |
| 3 | Progress is separate and cannot invent review status | Consistent |
| 4 | Browser/contract regressions first; full-game review after component reviews | Consistent |

## Rulings

- Ruling: use an isolated fresh clone and feature branch — no user workspace existed — keeps concurrent catalogue work untouched.
- Ruling: execute the already approved goal without another design prompt — user explicitly said implement here — design choices remain reviewable in this spec.
- Ruling: parallelize disjoint character, environment and UI files — user requested fan-out and there are no shared edits — integration host owns interfaces.
- Ruling: ultracode is unavailable; use available subagents — never claim an unavailable capability ran.

## Evidence and reviews

- Baseline test suite and original 2D capture started before edits to product code.
- All critic verdicts remain pending until real output has been inspected.

## First integration and critique

- Original 2D baseline and first actual WebGL capture retained in evidence/maze-3d/captures.
- 21 focused production maze rules/privacy/presentation and new public motion tests pass.
- Baseline full suite: 120 file-level suites passed; 3 child-process tests blocked by sandbox EPERM. Repeat with appropriate process permissions after integration.
- World critic 1: reference wins; flat repetitive board lacks focal architecture, rich materials and lighting hierarchy. Returned to builder; new conservatory landmarks, larger garden clusters and lagoon/material revision awaiting capture.
- Root debug: software renderer identified as SwiftShader. Added balanced rendering for software while preserving full shadows on hardware/high quality. Character routes retain turns, never interpolate undisclosed paths.
- Root debug: default hunter could end a self-test before its scheduled tick-120 recovery probe; moved probe to first accepted update. Self-test passes with deterministic authority and true restart.
- Ruling: user's explicit no-fixed-round Gauntlet instruction supersedes the generic skill's round cap. Continue from measured critic gaps without inventing a win.

## Independent reviews and subsequent revisions

- Environment critic 2 inspected actual desktop, overview and portrait captures against the fixed Nintendo images: reference wins. The prominent dot pattern, shallow repeated geometry and weak environmental mass were returned to the builder.
- Character critic 1 inspected real front/detail output: reference wins. The amber/ivory silhouette merged into stone; motion and warden evidence were missing. Revision introduces a broad teal torso, dark boots, quieter face details, asymmetric idle, head-led turns and clearer prop separation. Production loss tokens now trigger their actual poses.
- UI critic 1 identified a truthful-progress defect: escape reported 100% Garden discovered although only 75/187 cells were known. The HUD now computes actual discovery from public cells, uses a current goal, translates real intent modes and changes terminal labels. Compact controls are 44px or40px on320px screens.
- Engineering critic 1 found persistent graphics loss, masked results, a truncated step counter and hidden review verdicts. All were repaired; the public snapshot now includes the already-public cumulative step statistic, with no authority-rule change. Three browser recovery/progress regressions pass.
- The world now has three public-coordinate terrace elevations. Disclosed legal passages between levels receive visible stairs. The shared ground sampler drives character feet, route marks, lights and camera targets. The former y=0 agreement now applies locally to each character rig; the scene owns its sampled world elevation.
- Ten focused checks pass for public movement, cumulative steps, legal/hidden stair boundaries, exact tread sampling and fixed shared resources over real runs.
- Engineering critic 2 caught stale route replay after WebGL restoration and camera loss on long-gap snaps. Both were fixed and independently reprobed against real public snapshots. The remaining terminal reconnect indication is now explicit in the visible status strip; its browser regression is being exercised.
- Real danger footage uses maze-visual-reference-13, not fabricated entities. Captures and the movement recording are made with the actual application renderer. Software WebGL timings are recorded honestly and are not a hardware-frame-rate claim.
- A balanced character tessellation path retains every part/pivot but reduces explorer triangles26,064→7,728 and warden22,744→7,448. Full-quality geometry and shadows remain available; the benchmark has not been lowered.
