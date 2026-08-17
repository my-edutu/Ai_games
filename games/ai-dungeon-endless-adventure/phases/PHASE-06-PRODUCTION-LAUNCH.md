# Phase 6 — Production Validation and Launch Governance

## Internal release contract

A Game 9 software candidate is frozen by exact 40-character source SHA, configuration hash and content version. The R4 assessor requires green unit/integration/browser gates, deterministic replay, Phase 5 chaos, security/privacy review, rollback drill, bounded resources/provider degradation and zero open P0/P1 findings. Missing evidence is a failure, not a warning.

The deterministic validator exercises paired autonomous runs, verified snapshot restore, zero-audience progress, duplicate audience input, resource caps and Phase 5 chaos using the same authoritative runtime.

## Truthful R5 boundary

Internal completion can produce at most R4. `productionReady:true` and R5 require all of the following for the exact deployed candidate:

1. current credentialed provider evidence;
2. production-reference capacity/output evidence;
3. independent exact-candidate review;
4. independently witnessed recovery/rollback exercise;
5. genuine 72-hour wall-clock endurance evidence;
6. guarded seven-day canary evidence.

Synthetic timestamps, compressed simulations and fixture providers cannot satisfy these gates.

## Release decision

The software can be handed off as an R4 release candidate only after repository CI passes at the frozen SHA. Until the external evidence set is complete, the production status remains `false / R5 BLOCKED` by design.
