# Autonomous AI System — AI Battle Royale

## Contract

Each living contender receives a serializable observation containing legal terrain, visible opponents, known pickups, own resources, safe-zone geometry and recent public events. It never receives future RNG draws, hidden audience ballots or private provider data.

## Policy stack

1. legality and terminal-state filter;
2. immediate zone-escape and emergency-heal reflex;
3. bounded visible-target combat utility;
4. bounded BFS for loot, cover, zone and pursuit goals;
5. archetype utility weights and preferred range;
6. deterministic equal-score tie variation using the contender-owned RNG stream;
7. deterministic fallback to a legal safety-improving move or wait.

## Budgets

Every decision has a fixed expansion cap, one action result and bounded recent-cell memory. Population ordering is stable. Timeout/fallback, oscillation and no-progress counts are observable.

## Public intent

Only templated fields are exposed: goal, intent, confidence band, target type, fallback state and plan-change reason. Hidden deliberation is never displayed.

## Evaluation

Campaigns measure survival, eliminations, damage, illegal actions, path expansions, fallback use, repeated cells, run length, archetype win share and terminal causes across identical seed corpora.
