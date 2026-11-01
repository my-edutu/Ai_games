# Infinite Tower Climb — Transformation-First Gauntlet

**Binding design:** [Transformation acceptance](../../docs/superpowers/specs/2026-11-01-infinite-tower-transformation-gauntlet-design.md). This replaces the former micro-improvement success model. The engineering journal, CI checks and existing phase records remain useful, but are not the score.

## The lead-agent prompt

Make Infinite Tower Climb a genuinely more spectacular, convincing, enjoyable **complete 3D game**, not merely a passing build. Preserve the autonomous climbing fantasy and deterministic gameplay. Judge the **running game** against frozen footage of its previous playable build and official [ASTRO BOT — Rising Heat gameplay](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4), with [Jusant](https://dont-nod.com/en/games/jusant/) for climbing weight/scale and [Returnal: Tower of Sisyphus](https://www.playstation.com/en-us/games/returnal/) for high-end action presentation. Don't copy their assets.

Choose the approach and overhaul whole *playable experiences*—character/world fidelity, movement and camera weight, encounters, progression, sound and a near-invisible HUD. Delegate separate builder and harsh critic subagents with fresh contexts, using ultracode if available. Each critic must inspect actual normal-speed gameplay, compare anonymous A/B footage of identical scenes and identify the biggest **systemic experience gap** to rebuild. Repeat without a fixed round count until the whole game is demonstrably transformed or the user stops.

**Acceptance is not a green CI run or one corrected animation.** Show matching baseline/candidate footage for everyday ascent, high-stakes action and a real outcome/restart. Require at least four of five independent blind critics to prefer the new game on **LOOKS**, **FEELS** and **PLAYS**, separately, with no serious gameplay or performance regressions. Missing recordings, critics, genuine playthroughs or hardware results mean **NOT EVALUATED**, not PASS.

Keep `/tower/gauntlet` a simple **experience transformation** page: old vs new real-game evidence, three pillar verdicts, current major transformation, strongest remaining weakness, and secondary engineering history. Keep in-game text minimal. Preserve code integrity, replay safety and truthful operational evidence. **Do not convert minor commits into Gauntlet milestones.**

## Working agreement

- **Freeze one baseline per transformation.** Do not quietly reset it after patches; pin source SHA, seed, viewport and capture settings.
- **Work in substantial playable vertical slices.** Use red/green tests and small commits internally, but don't report a new Gauntlet win until viewers would recognize a radically improved game.
- **Inspect source-bound real gameplay.** A still or an isolated model render cannot validate animation, feel, or fun. Pair full-motion footage and an end-to-end run with independent criticism.
- **Safety gates are vetoes, never positive quality points.** Tests, accessibility, deterministic replay, GPU performance, privacy, restart and production controls must hold.
- **Continue the same transformation across scheduled runs.** Report work-in-progress honestly, do not invent independent critics, and do not merge, force-push or deploy without authorization.

The progress page's refresh timer only displays published evidence; it does not run agents or background code.
