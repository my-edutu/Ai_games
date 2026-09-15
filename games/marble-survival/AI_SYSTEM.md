# Marble Survival Tournament — Autonomous Agent System

Each marble receives only legal local observation: its transform, next checkpoint/finish, nearby colliders/marbles, active field, progress, and declared global influence. The launch policy stack is legality/speed clamp → immediate hazard avoidance → lane/goal utility → archetype preference → deterministic fallback.

Decision cadence is staggered by marble ID and bounded by configuration. Actions are integer steering vectors plus a bounded boost and allowlisted public intent. Policies never mutate state. Remote models are not required or used for authoritative movement. Phase 2 adds full archetype utility, sweep prediction, collision anticipation, stuck recovery, benchmark distributions, and public confidence validation.
