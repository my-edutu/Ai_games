# Game Design — AI vs 1,000 Floors

## Core fantasy

Astra is a self-directed signal knight attempting to outthink a living tower. The tower changes tactical questions as the ascent progresses, but every challenge is authored, bounded, deterministic and replayable.

## Moment loop

Observe → select a legal move/attack/guard/interact/ability → resolve Astra → resolve enemies by stable ID → resolve hazards → collect/complete → update plan and feedback.

## Floor loop

Enter → read objective and threats → choose safe or profitable route → fight/bypass → collect optional value → reach exit → receive a concise floor result.

## Run loop

Cross ten sectors, improve a bounded three-module loadout, survive checkpoint gates and Wardens, defeat the Architect or end with a causal loss, then review and restart on a new deterministic seed.

## Phase 1 implemented rules

- odd integer grids from 7×7 to 15×15;
- guaranteed start-to-exit path with boundary walls and deterministic branches;
- basic Striker and Spike representations;
- move, attack, guard and wait actions;
- stable enemy order, integer damage, reward collection and automatic floor transition;
- victory after clearing Floor 1,000;
- player defeat, floor timeout and stagnation results;
- result → intermission → new run without operator input.

## Full progression grammar

- Floors 1–100: Intake Vaults;
- 101–200: Ember Foundry;
- 201–300: Verdant Archive;
- 301–400: Prism Court;
- 401–500: Null Catacombs;
- 501–600: Storm Engine;
- 601–700: Iron Menagerie;
- 701–800: Memory Labyrinth;
- 801–900: Crown Warworks;
- 901–1000: Architect's Spine.

Every fifth floor offers bounded value; every tenth previews a modifier; offsets 25/50/75 are checkpoint/miniboss gates; every 100th is a Warden; Floor 1,000 is the Architect.

## Dramatic patterns

1. mastery → complication → replan → recovery;
2. resource drought → risky cache route → costly success or causal loss;
3. audience challenge → near-collapse → earned recovery or visible consequence;
4. early module synergy → Warden counter → adaptation;
5. poor opening → conservative checkpoint play → record chase.

## Fairness rules

- no unavoidable spawn damage;
- required exit/objective remains reachable;
- invalid content is repaired or quarantined, never counted as fair loss;
- challenge effects cannot alter already resolved actions;
- exact spend cannot map to unbounded power;
- checkpoints and recovery are earned and explicitly represented;
- hidden rescue, kill, fail-per-hour and record manipulation are forbidden.

## Result and restart

Result includes terminal kind, reason, tick, highest floor, score and checksum. Presentation will add decisive-moment replay, record comparison, audience acknowledgement and next-seed preview while preserving the authoritative result unchanged.
