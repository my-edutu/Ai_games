# AI Battle Royale — Approved Design Specification

## Viewer promise

Viewers watch twenty-four autonomous contenders scavenge, reposition, out-think rivals and survive a shrinking arena until one champion remains. They return because every seed creates different rivalries, zone pressures, loadouts, comebacks and final-circle decisions without a hidden winner script.

## Product boundaries

The game is a deterministic, top-down, fixed-step battle royale built for unattended livestream operation. It is not a human-playable shooter, does not depend on a remote model, does not display raw audience text, and never lets payment guarantee a winner, death or record.

## Creative pillars

1. **Readable tactical survival** — silhouettes, health, shield, intent and safe-zone pressure are legible at phone size. Spectacle is suppressed whenever it obscures authoritative action.
2. **Distinct autonomous personalities** — Vanguard, Ranger, Scavenger and Tactician archetypes use different utility weights, preferred ranges, resource priorities and silhouettes while sharing the same legal action system.
3. **Causal drama** — eliminations, escapes, zone damage, resource swings and terminal results derive from recorded rules and named random streams. Technical failures are never counted as losses.
4. **Fair crowd pressure** — fixed-choice votes create global, bounded trade-offs. Free and paid-eligible inputs share safety checks; paid weight is capped at two and cannot target a contender.
5. **Always-on resilience** — verified snapshots, deterministic replay, bounded resources, output health and controlled recovery preserve truth through optional service or presentation failure.

## Ten-second comprehension hierarchy

1. Survivors remaining.
2. Current zone phase and ticks until shrink.
3. Arena and safe-zone boundary.
4. Current leader/focus contender with health, shield, weapon and public intent.
5. Recent eliminations.
6. Current audience decision and its disclosed global effect.

## Core rules

- The arena is an integer grid with deterministic obstacles, cover, spawn points and loot.
- Twenty-four contenders spawn on a validated connected map.
- Every contender chooses one legal action per tick: move, attack, heal or wait.
- Attacks use deterministic line-of-sight, range, ammunition, cooldown, cover and named hit-roll streams.
- Simultaneous valid attacks are resolved as one combat batch; movement conflicts use a stable rotating priority.
- The safe zone shrinks on a declared logical schedule and damages all contenders outside it equally.
- Supply drops and no-progress escalation are declared, bounded and replayable.
- The last living contender wins. If the configured hard limit is reached, a declared battle score resolves the winner; exact ties produce a draw.
- Results enter a short intermission and the host starts a new deterministic seed automatically.

## Archetypes

| Archetype | Identity | Strength | Trade-off | Public silhouette |
|---|---|---|---|---|
| Vanguard | aggressive front-liner | health and close pressure | lower long-range accuracy | shielded hexagon |
| Ranger | patient marksman | range and accuracy | lower health and loot urgency | directional triangle |
| Scavenger | opportunistic survivor | ammunition, pickups and recovery | lower burst damage | split diamond/backpack |
| Tactician | cover-oriented planner | shield and positional discipline | slower pursuit | ringed square/cross |

Archetypes alter utility and transparent stats only. No archetype receives hidden information or protected outcomes.

## Authoritative order

For each logical tick:

1. lifecycle and validated influence commands;
2. cooldown and vote-window updates;
3. zone schedule and supply eligibility;
4. bounded AI observations and decisions in stable contender order;
5. healing and action validation;
6. simultaneous combat batch;
7. deterministic movement conflict resolution;
8. automatic loot pickup and drops;
9. zone damage and eliminations;
10. progression, no-progress escalation and terminal result;
11. bounded semantic events, RNG snapshot, invariants and checksum.

## Random-stream registry

- `arena:obstacles`, `arena:cover`, `arena:loot`, `arena:spawns` — world generation.
- `combat:<contender-id>` — authoritative hit rolls.
- `loot:drops`, `loot:supply` — item creation and placement.
- `ai:<contender-id>` — intentional equal-score tactical variety only.
- `influence:tiebreak:<window-id>` — vote ties.
- `presentation:*` — optional cosmetic variation; prohibited from authority.

## Audience catalogue

| Effect | Scope | Maximum consequence | Safety property |
|---|---|---|---|
| Supply Rain | global arena | three extra pickups | no targeted recipient |
| Zone Hold | global schedule | delay one shrink by at most 40 ticks | cannot cancel future shrink |
| Medic Mist | all living contenders | restore at most 5 health each | symmetric and capped |
| Radar Pulse | presentation only | reveal all locations for 24 ticks | AI receives no new information |
| Theme Shift | presentation only | change visual theme | no authoritative effect |

Votes use logical tick windows, one ballot per tokenized viewer, free weight one, paid-eligible weight at most two, bounded audit and deterministic ties. The game remains complete with the gateway disabled.

## Broadcast constitution

- Dark tactical arena with high-contrast semantic roles; shape and outline carry meaning in addition to colour.
- Full-arena camera is the default. Focus panels explain a contender without hiding the decisive action.
- Common hits receive restrained feedback; eliminations, final circle and result receive reserved higher-priority treatment.
- Synthesized WebAudio cues use semantic priority, cooldowns and voice limits. Critical meaning is duplicated in captions and visuals.
- Reduced-motion, reduced-flash, mute and clean-feed paths preserve all critical information.
- No external art, font, music or sound asset is required, removing licence and missing-asset risk.

## Reliability and readiness

Software phases may prove an R4 candidate through deterministic campaigns, browser-source validation, snapshot/replay recovery, chaos drills, bounded resources, security/privacy review, runbooks and rollback machinery. R5 remains blocked until the exact frozen deployed candidate completes real credentialed provider tests, independently witnessed drills, a real 72-hour endurance run, a real seven-day canary and independent review.

## Rejected alternatives

- **Continuous rigid-body shooter physics:** rejected because grid/fixed-step combat is more replayable, legible and efficient for twenty-four autonomous agents.
- **Remote-LLM action selection:** rejected because deterministic utility AI supplies sufficient variety without continuity, cost, privacy or latency risk.
- **Viewer targeting of named contenders:** rejected because it creates harassment, pay-to-kill and winner-manipulation risk.
- **Photoreal character assets:** rejected because procedural silhouettes are faster, licence-safe, more readable and easier to degrade safely.
