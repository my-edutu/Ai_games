# Game 2 Gauntlet passes 15–16: source-bound gate composition and portrait review

**Status:** local rendering improvement verified; **Nintendo Captain Toad fixed bar NOT PASSED**. Draft PR [#53](https://github.com/my-edutu/Ai_games/pull/53) stays unmerged and undeployed. Exact official 1280×720 benchmark identities remain unchanged in [reference-manifest.json](./reference-manifest.json).

## Small independent slices

Pass 14 had a legible sealed-gate coral cross but placed the real gate at the far-left edge with Pip partly blocked by the lintel. The work was split into: public-only sealed-gate selection and numeric camera limits; actual follow-camera staging of Pip plus the obstacle; small side-angle correction; genuine desktop and portrait captures; and separate full-scale visual critique. The first four are implemented and evidence-linked. An independent visual critic and blind fixed-bar A/B remain blocked.

- [b6c23e2](https://github.com/my-edutu/Ai_games/commit/b6c23e21efd7a34f944604936ec17c6879c476fb): test-first public gate selection and bounded camera regressions.
- [5e0d7b7](https://github.com/my-edutu/Ai_games/commit/5e0d7b7bdcbf3a1081ad2d7be8fbca345ba7258c): select only an already-disclosed, adjacent, **closed** gate with public source cells, no hidden corridor lookups, and cap follow offsets at 1.6 world units (portrait 1.1).
- [2374ded](https://github.com/my-edutu/Ai_games/commit/2374dedc211a54ebfaec3a38e6df2469b63811a6): use that obstruction in an unthreatened follow camera only when a near known reachable objective is not already being framed; record gate/Pip projection diagnostics. A closed gate is never a navigable step, goal cue or promise of refuge.
- [3a6b193](https://github.com/my-edutu/Ai_games/commit/3a6b193ddf550a008e735b4e549a05af5185553f) and [ba114ce](https://github.com/my-edutu/Ai_games/commit/ba114ce5ef71ad2fc710fa688c59446638ef2765): source-verified 390×844 portrait key/gate and 1280×900 desktop gate Playwright captures, with exact seed/tick, source hashes, images and screen projections. No inserted props.
- [ff31870](https://github.com/my-edutu/Ai_games/commit/ff3187038574849e7adbe29dd4d08dea06ba6783): very mild sealed-gate camera side-angle (camera offset from (15,21,18) toward (20,21,14)), smoothed out after leaving the observed gate shot. Deterministic gameplay, authority, security and public disclosure remain unchanged.

## CI and real render provenance

Pass 15 exact source [CI 41175515301](https://github.com/my-edutu/Ai_games/actions/runs/41175515301) passed **524/524 Node and 25/25 browser**. [Original screenshot artifact 13033246037](https://github.com/my-edutu/Ai_games/actions/runs/41175515301/artifacts/13033246037).

Pass 16 exact source [CI 41175973975](https://github.com/my-edutu/Ai_games/actions/runs/41175973975) passed **524/524 Node and 25/25 browser checks**, plus build, host self-tests and deterministic scan. [Original screenshot artifact 13033176303](https://github.com/my-edutu/Ai_games/actions/runs/41175973975/artifacts/13033176303).

All sealed-gate frames below are the actual production seed 'maze-visual-reference-13', **tick 21**, with public closed door 'door-2'. The downloaded image bytes were decoded, inspected at native dimensions and independently SHA-256 checked against the JSON capture manifests.

| Capture | UTC source time | PNG SHA-256 |
| --- | --- | --- |
| Pass 14 desktop baseline | 2026-10-31 05:04:37.546 | 3ef0814c04f38a2465687b7feded50c6d8b7dc24c3da6ed2278de74f356ef668 |
| Pass 15 desktop | 2026-10-31 06:15:06.206 | d4a2b35dfa2a3ccda1c76381e6d6b32347f6994e1da61ed9f97433f7b60e5d6e |
| Pass 15 portrait gate | 2026-10-31 06:15:07.918 | a80f3b32d6cdb5954424aa2338e099ab481f3196be74c5a0bcdc9715653eb46e |
| Pass 16 desktop | **2026-10-31 06:24:40.243** | e7620535601d1405d738b0521a2e5783cafbb70be23d208672a60955e75c0ed9 |
| Pass 16 portrait gate | **2026-10-31 06:24:43.717** | 075450e0201219402109b94fde9f155abc64de1fa1cdc1fa4be79c7be2c3e16e |
| Pass 16 portrait known key | 2026-10-31 (exact in manifest) | b3fd1eba342bcdfc405b78b699a9a08f9c31d774045435b9ae1543b2fbcc408e |

Actual pass 16 desktop diagnostics: closedGatesInFrame=1; publicly selected gate a17/b34, zero known-step distance; projected gate x=-0.1084 and Pip x=0.0051, both in camera. Portrait projected gate x=-0.2152, Pip x=0.0113. These are screen-space provenance/visibility checks, **not** proof of quality or a safe route.

## Lead native-size visual criticism and frozen benchmark verdict

The pass-15 local focus re-centers the visibly blocked gate and Pip compared with pass 14. Pass 16's slight side angle reveals Pip's eyes, teal body and lantern beside the crossed barrier more cleanly on desktop and portrait, rather than letting the lintel cover them. The golden-key portrait is a real, recognizable collectible with accessible compact controls.

However, the water field remains large, the gate and character still read as small props at normal gameplay scale, the obstacle-to-next-action relationship remains ambiguous without the text panel, and the terraced assets are less varied and expressive than the frozen official Nintendo Captain Toad samples. **Nintendo wins overall; this is the lead's visual judgment, not a fresh independent blind A/B verdict.** Do not infer an independent win from successful tests or these camera projections.

Shared-workspace commands and fresh-context agent status were actually attempted this pass, but failed 'Tunnel-client has not been seen for 300 seconds'. Thus separate builder/critic, Ultracode and an authentic new blind fixed-bar comparison could not execute, despite GitHub CI/browser capture being available. CPU-throttled SwiftShader frame timings **are not hardware GPU FPS**, and no GPU performance defect is asserted.

**Next:** make a publicly known gate/hero/action relationship unmistakable with stronger physical staging and less water (without implying an illegal passage), then demand native-scale fresh-context blind A/B against the same official SHA-pinned Nintendo imagery; independently review actual motion/audio and GPU performance. The automation remains active and the PR remains draft, unmerged, undeployed.
