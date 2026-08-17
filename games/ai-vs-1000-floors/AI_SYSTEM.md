# Autonomous AI System — Astra

## Design principle

Astra must appear purposeful without being omniscient and must remain valid when every remote model is unavailable. Public explanation fields are bounded status summaries, not hidden chain-of-thought.

## Observation contract

The production policy may observe only authoritative, legitimately visible/discovered data: grid geometry, known exit/objective, visible enemies and telegraphs, visible hazards, Astra resources/status, module options, scheduled eligible effects and recent public events. It never reads future random draws, provider payloads or hidden director decisions.

## Action contract

`move`, `attack`, `guard`, `interact`, `ability`, `wait`. Every proposal passes `listLegalActions`; invalid proposals are rejected atomically and never advance logical time.

## Policy stack

1. legality and hard safety;
2. immediate adjacent combat/hazard reflex;
3. bounded tactical search;
4. resource/exit/objective utility;
5. plan persistence and explicit replan triggers;
6. deterministic fallback and stable tie-break;
7. stuck/oscillation/no-progress recovery.

## Phase 1 implementation

- bounded breadth-first path search;
- adjacent-threat attack priority;
- verified exit-path movement;
- lowest-danger legal move when no direct path exists;
- guard/wait continuity fallback;
- stable action keys and deterministic tie-break;
- public mode, goal, intent, confidence and plan-change reason;
- node expansion and fallback counters.

## Phase 2 production upgrades

- threat maps, damage forecast and module-aware utility;
- sector-specific observations and Warden mechanics;
- route/resource/reward trade-offs;
- plan persistence, oscillation detector and local recovery;
- expansion p50/p95/p99 evidence and hard cap;
- benchmark fixtures for adversarial floors and forced fallback;
- no invalid action and no infinite decision loop across stratified campaigns.

## Fallback invariant

When at least one legal action exists, the fallback returns one of those exact actions. If no action exists because of an integrity defect, runtime enters the declared technical path rather than inventing movement.

## Explainability

Public fields are templated and capped:

- goal;
- intent;
- obstacle;
- confidence band;
- fallback status;
- plan-change reason.

No private scratchpad, prompt, model response, future random value or internal security diagnostic is exposed.
