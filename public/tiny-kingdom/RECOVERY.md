# Tiny Kingdom recovery checkpoint — 2026-10-30

This is a recoverable improvement pass, not completion of the Pioneers of Pagonia quality target.

## Play and inspect

From the repository root run `npm run tiny:stream` (Node 22+). The game is at `http://127.0.0.1:4177/tiny/` and the current evidence journal at `http://127.0.0.1:4177/tiny/recovery`. The older journal remains at `/tiny/progress`.

## Implemented

- Arriving citizens remain at their workstation for a real work interval before receiving the existing economic reward; travel cannot count as work.
- Failed navigation does not grant a reward at the accidental waiting position.
- Six professions have distinct equipment attached to animated wrist joints; resting and waiting feet no longer march.
- Cottage gables and ceramic roof tiles face outward/upward; boot soles are grounded.
- Simulation behavior is tagged `seeded-work-v2`. Valid legacy snapshots migrate deliberately; new snapshots retain exact in-progress replay.
- Before/after browser captures, renderer capability and geometry validation are stored alongside the playable source.

## Verified evidence

Eleven focused tests passed locally and in the recovery-validation workflow. The TypeScript build and stream-server self-test passed. At 90 simulated days the local run reached 27 citizens, 24 buildings, 394.5907867 food, 21.2 wood, 555.2 gold, and 24 citizens with a recorded friendship; every citizen position was walkable. This is accelerated simulation evidence, not a real-time soak.

Exact tested game source SHA-256: `f7ae295be845aaa45d885e80d75b3820d69ca3838acd81f2ac4c425f0988c44a`.

GitHub capture manifest records `software-webgl`, ANGLE/SwiftShader, 58,051 static plus 37,215 dynamic triangles, zero invalid components/normals/colors/out-of-bounds vertices, and no page errors. The declared 12 fps setting is a rendering target, NOT a measured result. Local captures used the Canvas2D fallback and showed depth-sorting artifacts.

Workflow run: https://github.com/my-edutu/Ai_games/actions/runs/41138125096 . Existing Tiny Kingdom browser regressions and the full catalogue diagnostic were still running when this note was written; inspect their exact outcomes in the artifact before claiming a full pass. The local full-suite attempt failed due to unavailable `three` in Eko Run tests and exceeded the execution limit.

## Recovery and review boundary

The previous `/workspace/scratch/70436df5adcb/ai-games` workspace and unpushed `feat/tiny-kingdom-pagonia-upgrade` work could not be recovered. This branch starts from the saved `a52df9e1` game source. It does not replace or claim to include the missing newer work; main and the original Tiny Kingdom branch are unchanged.

The worker tunnel was offline. This pass used inline implementation and self-review, not independent fresh-context subagents or Ultracode. No blind Pagonia A/B win, hardware-GPU frame-rate result, full character completion or production-readiness claim is made. Keep this change unmerged until broader reviews and required gates pass.

Next priority: inspect the exact WebGL capture and continuous citizen motion, fix the largest visual/animation gap, then repeat with independent critics against the fixed commercial reference. Original authored character assets, denser district composition, convincing materials, full task/cargo chains and measured performance remain open.
