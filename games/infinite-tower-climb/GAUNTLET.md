# Game 3 — continuing the Gauntlet

Run from the repository root. Read the current [review record](../../docs/reviews/2026-10-30-tower-3d-gauntlet.md) and `/tower/gauntlet` before choosing the next improvement. Preserve evidence from failed attempts.

## Lead-agent prompt

Make Infinite Tower Climb a complete, compelling 3D game: fully developed original characters, animation, scenes, sound and a coherent autonomous experience. Beat the official [ASTRO BOT — Rising Heat gameplay](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4) on character finish, visible action, material separation, environmental depth and clarity of the next move. Use [Jusant](https://dont-nod.com/en/games/jusant/) for scale and atmosphere, and [Fall Guys](https://store.epicgames.com/en-US/p/fall-guys) for obstacle readability.

Choose the approach. Divide the goal into the smallest independently improvable, independently judgeable pieces. For every important piece, fan out a builder and a separate critic with fresh context. Use subagents and ultracode when available; disclose unavailable capabilities.

Critics must inspect the real output, compare directly with the bar, use randomized blind A/B when feasible, identify the biggest remaining gap and send it back to a builder. Inspect actual motion and complete run transitions, not only screenshots or state logs. Keep looping until our output wins or the user stops the run. Missing evidence and ties do not count as wins.

Maintain the simple live progress page at `/tower/gauntlet`: real before/after captures, critic verdicts, fixes and the next gap. Keep each iteration reviewable in git. Preserve the game's authority, replay and public-snapshot contracts.

The progress page is a live journal of agent work; its refresh timer does not independently launch agents or continue a run after the coding session ends.
