# SDD ledger — plan: docs/superpowers/plans/2026-10-30-ai-maze-escape-3d.md

## Identity

- Base: d1678cd on `main`.
- Work branch: `feat/maze-3d-gauntlet`.
- User authorization: implement the proposed 3D Gauntlet here.
- Benchmark: fixed official Captain Toad water/character and maze/hazard screenshots, plus real gameplay clips; supporting Luigi's Mansion 3 and ASTRO BOT.
- Status: implementation in progress; benchmark not passed. Draft review: https://github.com/my-edutu/Ai_games/pull/53.
- Saved checkpoint: `c7eddc13574b3964c9149a15c5f3b2ced99ee113`; this subsequent checkpoint records the fourth-pass refinements, fresh engineering review and dated third-pass evidence. Fresh fourth-pass visual judgment is still required.

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
- Critic verdicts are recorded only after real output is inspected. The latest completed visual review still prefers the fixed reference.

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
- A balanced character tessellation path retains every part and pivot. The third pass reduced explorer triangles from 26,064 to 7,728 and warden triangles from 22,744 to 7,448. The later face and cloth refinement changes the explorer count as recorded below. Full-quality geometry and shadows remain available; the benchmark has not been lowered.

## Third-pass evidence and independent verdict

- Actual production public frames were captured through the application renderer on 2026-10-30: desktop at 19:21:46.689 UTC, character detail at 19:21:53.406, portrait at 19:21:57.514, landscape at 19:22:00.888, overview at 19:22:06.017, danger at 19:22:11.403 and result at 19:22:17.155. The capture manifest records the exact frames, quality, diagnostics and capture timestamps. The lead preserved `round-03-manifest.json` plus stable `round-03-desktop.png`, `round-03-character-detail.png`, `round-03-mobile-portrait.png` and `round-03-danger.png` copies before the next capture; the dated journal uses those stable image names.
- Fresh visual critic 3 read no prior builder or critic notes. It inspected six current stills and decoded the real 16.8-second recording, then compared them directly with the same two Nintendo references. See `docs/reviews/maze-3d/visual-critic-3.md` for pinned image hashes and the comparison criteria.
- Verdict: **reference wins**. The captures establish a coherent terraced 3D garden and developed explorer and beetle models. The largest remaining gaps are scene-specific landmark composition, material and shoreline integration, expression and facing direction at gameplay size, actionable-object hierarchy and persistent UI weight.
- The comparison is explicitly **unblinded** because the Nintendo characters and HUD are recognizable. The critic excluded brand familiarity from its stated criteria. No blind-test claim is made.
- The old `full-quality.png` predates this terrace pass and was excluded. It must not be shown as evidence of the current build. New overwrites of capture filenames must not be attributed to the old pinned verdict without another review.
- The recording supports actual movement, changing orientation, camera framing and an escape result. It does not establish smooth gait, consistent stair foot planting, reaction timing, audio mix quality or sustained rendering performance. A nominal encoded 25 fps is not a rendered frame-rate result.

## Fourth pass returned to the builders

- Character builder: Pip now has quieter goggle frames, larger eye whites and dark pupils, directional gaze, a coral collar and side scarf, and a matching rear bedroll. Thornback has a broader bronze mask forward of its shell, a dark eye band and larger bright eyes. All named pivots, production loss states and reduced-motion support remain. Current balanced geometry is 8,064 explorer triangles and 7,448 warden triangles; full geometry is 27,104 and 22,744 respectively.
- World builder: thicker octagonal key bows and broader shafts keep a readable sway; a dark pedestal and quieter decorative trim reserve contrast for actionable items. Known exits gain a mint opening, halo and diamond crown. Plant growth forms public-coordinate patches with root contact pads; disclosed shoreline edges gain contact accents and occasional structural buttresses. No undisclosed topology or object is introduced.
- UI builder: native Map and Path notes disclosures start closed, leaving the main goal and immediate intent visible. Compact portrait layout reduces persistent explanation weight. Host wiring redraws the map after opening and closes focused disclosures with Escape. `Detail` replaces the ambiguous camera label `Close`, and viewer captions replace internal key/door identifiers.
- These refinements are implemented, but **fresh rendered evidence and an independent visual verdict remain pending**. The third-pass screenshots are labeled as such; the live journal includes an uncaptured fourth-pass card instead of substituting older images.

## Current verification and performance boundary

- Fresh focused command: `node --test tests/phase3/catalogue-frontend-quality.test.cjs tests/phase3/maze-3d-characters.test.cjs tests/phase3/maze-3d-world.test.cjs tests/phase3/maze-3d-presentation.test.cjs` — **16/16 passed**, exit 0. This comprises four catalogue UI contract, two character, two world and eight public snapshot/motion checks. `git diff --check` is clean.
- The latest completed browser suite reports **13 passed, 1 failed**. The real-3D test exceeded its unchanged 60-second budget; its initial rendered-frame wait consumed about 52.74 seconds. Passed checks include graphics fallback/restoration, real terminal results without WebGL, user-activated audio and mute, repeated-run resource bounds, 320px controls and the existing responsive/public-state checks. A subsequent targeted real-browser check passes for drawn Map disclosure, Path notes visibility, Escape/focus restoration and reconnect status during a preserved real terminal result. That probe intentionally disables WebGL to exercise recovery; it does not establish current 3D performance.
- The full local catalogue Node run is in progress. The earlier saved-checkpoint CI has successful Eko Phase 2/3/4 workflows. Its main Autonomous Games build/test workflow failed exactly one check: the Maze frontend revision marker. That fix passes in the current focused suite, but the older CI result is not a result for the latest source. Do not describe the whole regression suite as green.
- Independent performance diagnosis is retained in `docs/reviews/maze-3d/performance-review.md`. Measured scene/world rebuilds are small relative to the dominant native software graphics/compositor delay. The host had an eight-CPU quota, load around 67 and throttling in about 97% of sampled quota periods. No unrelated process was stopped.
- Combined Chromium flags enable its graphics compositor path while retaining SwiftShader. That feature-status change does not prove an actual speed improvement. The next real capture attempt still exceeded its 45-second frame wait under continuing contention. Performance remains open; neither the browser-test deadline nor the quality bar is being relaxed.
- The next useful evidence is an actual current-source browser/capture result after contention permits it, followed by a fresh critic and a hardware-rendering measurement. Repeating a blocked software capture or increasing the timeout alone does not satisfy the quality or performance gate.

- The fresh refinement reviewer found a clipped keyboard focus outline on the collapsed Map summary. The summary now uses an inset focus outline; the reviewer confirmed the source correction. The reviewer also reproduced Path notes overlapping captions in844×390 landscape. The repaired upward popup stays above the caption band with both ordinary and longer production copy (popup bottom245.06px; captions begin351px). The reviewer inspected the visible inset Map focus ring and marked both findings repaired. See `docs/reviews/maze-3d/refinement-review.md`.

- Fresh stream self-test exits0 with `ok`, `authorityStable`, `browserAssets`, `boundedSource`, `snapshotPrivacySafe`, `recoveryVerified` and `restartObserved` all true. Changed browser modules and the capture script pass syntax checks.
- Capture reporting now records each completed image immediately with current source-file hashes; a later failed case cannot silently misattribute a newly overwritten image to an older manifest.

## Persistent continuation

- Hourly Gauntlet continuation is enabled for the existing branch and draft PR. Its first scheduled run is **2026-10-30 at 21:10 UTC** (22:10 Africa/Lagos), then hourly. No scheduled run has yet been observed at this checkpoint.
- Each continuation resumes the ledger and evidence, chooses the smallest independently judgeable gap, pairs a builder with a fresh separate critic, inspects real output against the fixed bar and updates the progress page. Ultracode should be used if it becomes available; its current absence must remain explicit.
- There is no fixed round count. Continue until a supported independent win or the user stops the run; pause continuation on a verified win. Scheduled work must not merge or deploy, overwrite concurrent changes, or report queued checks as completed evidence.
