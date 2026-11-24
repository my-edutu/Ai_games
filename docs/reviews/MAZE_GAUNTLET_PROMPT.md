# Game 2 Gauntlet

**Bar:** The two [pinned Captain Toad: Treasure Tracker screenshots](maze-3d/reference-manifest.json) set the fixed standard for expressive original 3D characters, readable miniature environments, lighting and encounter staging at comparable viewing sizes.

## Lead prompt

Massively improve Game 2, AI Maze Escape, into a complete, polished 3D adventure: every character, scene, animation, effect, sound and interface should feel fully developed. Use the pinned Captain Toad references as the fixed quality bar while keeping our own identity.

Use subagents and ultracode. Choose the approach. Divide the goal into the smallest pieces that can be improved and judged independently. For every important piece, fan out a builder and a separate critic with fresh context. Each critic must inspect the real running output, compare it directly with the bar—blind A/B when possible—identify the biggest remaining gap and return it to the builder. Keep looping until our output wins or I stop the run. Do not lower the bar or substitute passing tests for a visual win.

Maintain a simple live progress page at `/maze/progress` with dated real captures, changes, critic verdicts and the next gaps. Preserve working gameplay and truthful evidence. Report unavailable tools explicitly; never pretend they ran.

## Current continuation

Resume `feat/maze-3d-gauntlet` and draft PR #53. Start with `AI_MAZE_ESCAPE_3D_LEDGER.md` and the latest independent reports in `maze-3d/`. Hourly continuation is enabled; the benchmark has not been passed. Ultracode was unavailable during the initial implementation.
