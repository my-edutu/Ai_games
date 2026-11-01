# Infinite Tower Climb — Transformation Gauntlet

**Status: open / not yet near the 90-point quality bar.** This document changes the *acceptance criterion*, not only the vocabulary of the old loop. Do not equate many safe commits or a green CI run with a transformed game.

## North star — independently judged, commercial-quality climbing

Make a distinctive, complete autonomous 3D vertical adventure with expressive, physically connected characters, visually rich tower environments, readable action, compact accessible spectator UI, and trustworthy continuous gameplay. Compare the whole moving experience with official [Jusant](https://dont-nod.com/en/games/jusant/) for climbing contact, atmosphere and architecture, and official [ASTRO BOT — Rising Heat](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4) for character polish, game feel and obstacle readability. [Fall Guys](https://store.epicgames.com/en-US/p/fall-guys) supports hazard recognition. These are **quality references, not assets to copy**. No lowering either primary bar when evidence is inconvenient.

## The operating change: transformations instead of micro-tweaks

A transformation sprint owns **one complete representative gameplay sequence**, not a single isolated component. A meaningful sprint changes multiple mutually supporting experience dimensions (for example: physical route contact, world architecture/materials/lighting, animated movement, framing/audio, and spectator legibility). Spend engineering effort where it can move **the player-visible experience** materially. Avoid 30 tiny commits fixing pixels if the complete scene still looks like a prototype.

**Golden vertical slice:** first Ruins ascent and first genuine ledge at real tick 298, followed by a real guardian encounter. At each iteration compare the exact old and new *unmodified authoritative* seed/checksums/tick, after all actual materials load, at both **960×600** and **390×844**, and review normal-speed WebM through landing, combat, death/restart and new floor. Use varied seeds and biomes to detect overfitting. Never insert fake showcase poses, manipulate authority, or use off-screen beauty renders as proof of shipped gameplay.

## Transformation score and release gate (100 points, provisional until independent review)

| Dimension | Points | Evidence required |
| --- | ---: | --- |
| Environment / 3D art direction | 25 | Rich original architecture, silhouettes, material separation, lighting and atmospheric depth, across five biomes |
| Character design and animation | 20 | Fully articulated recognizable cast, contact-led grip / mantle / land and attacks at real speed |
| Physical gameplay clarity / action | 20 | Legible route, hazards, decision, combat anticipation, contact/recovery and meaningful progression |
| Camera and spectator readability | 15 | No cropping, occlusion, misleading route cues, screen-time lag or clutter at desktop / portrait |
| Audio, VFX and emotional rhythm | 10 | Distinct audible, captioned, bounded feedback on actual authoritative events |
| Accessible UX and mobile layout | 5 | Screen reader/keyboard/contrast/reduced-motion/44px tap targets and concise HUD proof |
| Real-device performance, stability | 5 | Device-measured presented FPS/frame pacing, deterministic replay, long-run endurance, fault recovery |
| **Total** | **100** | **Independent evaluation on actual shipped gameplay** |

**A 90+ score is necessary, not sufficient.** Every important dimension must be at least 80% of its own points. Independently reviewed normal-speed gameplay and matched screenshot comparisons must favor the *new* version substantially, not merely differ. At least **8/10 blinded paired preferences** across distinct meaningful scenarios should prefer the new version before calling a sprint a quality leap; choose a different critic from the builder. Failing or absent evidence is an **OPEN / FAIL**, never a pass. Do not assign a numeric score without evidence. The official Jusant/ASTRO BOT comparison still remains a separate independent judgment; an improvement over our last commit alone cannot claim commercial parity.

**Stop-ship failures:** body/platform penetration; false support or impossible contacts; unreadable intended move; enemy silhouette hidden by scenery; camera-caused loss; frame-rate-dependent collision or hidden AI advantage; clipping UI; unusable reduced-motion alternatives; missing drawn frames; nondeterministic replay; resource leaks or crash. Any stops the 90 gate, regardless of aggregate points.

## Concrete workflow

1. **Inspect actual output first:** latest draft PR head, AGENTS.md, this file, chronological `/tower/gauntlet` progress, prior reviews and full CI, downloaded PNG/WebM and diagnostics, and official video frames. Check concurrent activity; preserve other authors' work.
2. **Select a major experiential failure:** describe in one sentence what a viewer sees and why it fails compared with the two fixed reference games. Choose a coherent vertical slice likely to change a viewer's preference, not the easiest assertion to satisfy.
3. **Build a visual target and implementation:** make actual runtime-source changes to 3D/animation/scene/UX systems needed for that slice; keep the deterministic simulation and presentation boundary intact. Original assets or responsibly licensed sources only. Prefer a reproducible authoring pipeline over endlessly tweaking primitive geometry.
4. **Use builder and independent fresh-context critic** when actually connected, with separate visual/motion assessment. If disconnected, explicitly label SELF-REVIEW and do not pass independent gates. Ultracode only when actually available.
5. **Prove safety and improvements separately:** failing-then-passing regressions for real defects, proportional build/replay/physics/resource/CI checks, and **authentic before/after GPU evidence** with actual normal-speed action. No screenshot capture, model preview, JS render submission, or green tests substitute for hardware FPS or commercial-quality review.
6. **Critique the whole scene at its intended size:** a reviewer must identify what materially changed in visible play, what remains prototype-like, and whether the new result wins the comparison. Preserve failures. If improvement isn't conspicuous, verdict FAIL and choose a *larger* transformation next.
7. **Commit only cohesive verified source**, re-read the latest head and use expected-head protection. Append chronological ledger evidence, named artifacts, source SHA, scoped PASS/FAIL, independent/SELF-REVIEW status and automatically selected next major transformation. Keep PR draft. No merge, force-push or deploy.

The `/tower/gauntlet` progress page is a read-only public journal; its refresh timer is **not** an agent runner. An existing scheduled task may continue iterations but cannot declare completion until these genuinely independent motion, art, UX, device and stability gates all pass.
