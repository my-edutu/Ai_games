# Game design

## Campaign and movement

The expedition ends after Floor 1,000. Floors are grouped into ten 100-floor districts: Verdant Atrium, Sunlit Aqueduct, Copperworks, Frost Conservatory, Coral Archive, Cloud Gardens, Ember Foundry, Moonlit Observatory, Astral Vault and Crown of Dawn.

A seed and floor number choose a route containing four, five or six nodes, elevations and hazard timing. The explorer walks between overlapping, level surfaces and jumps between separated ones. Motion follows a fixed 30-tick segment. Landings dwell for eight ticks; floor arrivals transition for eighteen ticks. These are authored kinematic trajectories, not general rigid-body physics.

Every tenth floor provides a hazard-free rest. Other floors contain one or, on selected floors, two independently timed crossings. Sweeper, pulse, gate and crusher hazards have different periods, radii and contact heights. The agent waits for a safe traversal window. Contact is evaluated by the authoritative core and emits hit/recovery events; the renderer cannot grant safety.

## Progress and recovery

Each floor has one pickup; every fifth floor's pickup is a relic. A completed campaign contains 200 relics. Clearing a ten-floor group sets the next entrance as checkpoint. An explicit checkpoint recovery rolls progress and relics back coherently. An actual hazard hit resets the current traversal to the floor entrance and records a retry. No audience event or cosmetic effect can change these rules.

## Current limitations

There is one route chain per generated floor. The agent does not choose between alternate paths, learn a strategy or call a language model. Repeated patterns across 1,000 floors remain a quality risk requiring longer viewer review. Future route-choice work must preserve the current deterministic replay and version saves when authoritative content changes.
