# AI Dungeon — Gauntlet Operating Protocol

**Mission:** Turn the dungeon game into a complete, visually extraordinary 3D autonomous fantasy RPG. Benchmark against *actual official Path of Exile 2 footage* for render quality and encounter presentation, then exceed it in unattended autonomous adventure depth. Do not reproduce copyrighted game assets.

## Lead-agent handoff

> Improve the real AI Dungeon in `my-edutu/Ai_games`, not a mockup. Use subagents and ultracode. Choose the implementation strategy and split the work into independently reviewable pieces. For each piece, commission an isolated builder and a fresh-context harsh critic. Have the critic inspect the running browser game, clips and screenshots against equivalent scenes in official Path of Exile 2 gameplay; blind A/B when feasible. The critic reports the largest remaining gap and evidence. Repair it and repeat until the game wins independent comparisons or the user stops. Keep `/dungeon/gauntlet` showing truthful live state, captures, iteration history and unresolved gaps. Preserve deterministic gameplay, passing tests and working runtime at every round.

## Judgeable minimum
1. Run `npm run dungeon:test` and `npm run dungeon:gauntlet` to establish authority and seed evidence.
2. Run `npm run dungeon:visual`; inspect actual `artifacts/dungeon-desktop.png` and `artifacts/dungeon-mobile.png`, plus motion clips captured from the stream.
3. Pair reference footage by camera elevation, encounter density, environment theme and animation type. Link origin and license. Do not substitute AI-generated reference screenshots.
4. Independent critic reviews at least one ordinary traversal, one battle, one boss confrontation, one floor transition, one death/restart, and a mobile screenshot.
5. Record biggest gap, severity, proposed measurable visual/gameplay test and before/after evidence per round. Stop claiming wins until external blind preference is observed.

## Review artifact schema
```json
{"round":1,"commit":"git-sha","builder":"worker-name","critic":"independent-worker","reference":{"url":"official-clip","timestamp":"00:00"},"candidate":{"screenshots":["artifact-path"],"gameplayClip":"artifact-path"},"blindAB":{"sampleSize":0,"candidateWins":0,"referenceWins":0,"ties":0,"verdict":"NOT_RUN"},"largestGap":"specific observed issue","severity":"P1","checks":{"unit":"NOT_RUN","headless":"NOT_RUN","browser":"NOT_RUN"},"nextAction":"measurable fix"}
```
`NOT_RUN` and `NOT_ASSESSED` are valid and preferred to made-up evidence. The actual live progress page reports runtime telemetry plus latest local campaign status; it does not start autonomous coding workers. An agent-capable environment must launch independent subagents. No indefinite unattended iteration is activated by merging this foundation.

## Visual acceptance
Use blinded independent raters comparing equivalent source assets and gameplay clips. Require a clear majority of candidate preferences across ordinary motion, busy combat, boss moments and mobile readability, while performance stays acceptable. Do not treat the headless green gate as evidence for visual quality.
