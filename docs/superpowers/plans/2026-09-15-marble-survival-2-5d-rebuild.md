# Marble Survival Tournament — 2.5D / 3D Rebuild Plan

## Scope
Only Marble Survival Tournament. Eko Street Run, Infinite Tower, Ant Colony and Maze remain untouched.

## Authority rule
Preserve the deterministic TypeScript tournament, AI, fixed-point ground-plane physics, seeding, eliminations and replay state. Presentation consumes authority snapshots and may not invent results.

## Execution
1. Audit existing Marble branches and runtime evidence.
2. Establish a failing 3D presentation contract test.
3. Add WebGL2 renderer while retaining the current Canvas renderer as fallback.
4. Build volumetric marbles, rolling orientation, material response, constructed arenas, machinery, hazards, VFX and server-directed cameras.
5. Keep visual themes cosmetic unless physics explicitly supports a surface mechanic.
6. Add browser/runtime verification and capture real screenshots.
7. Critique the runtime as a game director, fix flat/primitive presentation, then polish performance and final-round spectacle.
8. Record truthful acceptance status; incomplete rigid-body features must remain marked incomplete.

## Merge strategy
The working branch is isolated. The final integration must contain only Marble-related files plus Marble-specific CI/tests/config hooks and must not pull active parallel-game work into `main`.
