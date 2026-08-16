# AI Games Specialist Skills

## Purpose

These skills are reusable operating guides for agents designing, implementing, reviewing, balancing, and releasing the autonomous livestream game catalogue. They encode judgement that cannot be enforced by one schema or linter: how to make a game readable and dramatic, preserve deterministic truth, create fair viewer influence, design sound and game feel, test emergent systems, and prove unattended production readiness.

Project-specific mechanics and decisions belong under `games/` and `docs/`. Skills contain reusable methods, invariants, review questions, and required outputs.

## Skill Catalogue

### Creative and Gameplay

- `game-creative-direction`
- `gameplay-progression`
- `difficulty-failure-balancing`
- `procedural-generation`
- `game-economy-rewards`

### Architecture, AI, Simulation, and Physics

- `game-architecture`
- `autonomous-agent-design`
- `deterministic-simulation`
- `game-physics`

### Broadcast Experience

- `game-audio`
- `game-feel-vfx`
- `livestream-hud`
- `viewer-retention`

### Audience and Safety

- `audience-interaction`
- `crowd-moderation`
- `security-privacy`

### Reliability and Delivery

- `long-running-reliability`
- `performance-optimization`
- `game-analytics-experimentation`
- `simulation-qa`
- `production-readiness-review`

## Invocation Order

Load every relevant skill before creative or implementation work. Process and architecture skills normally precede domain skills:

1. clarify the game/phase requirement and source documents;
2. use `game-creative-direction` and `gameplay-progression` for the viewer promise and loops;
3. use `game-architecture`, `deterministic-simulation`, `autonomous-agent-design`, `game-physics`, and `procedural-generation` as applicable;
4. use audiovisual, HUD, retention, interaction, economy, moderation, and safety skills;
5. use performance, reliability, analytics, QA, and production review skills;
6. record outputs in the game documents and phase evidence bundle.

A skill cannot waive a higher-precedence platform standard. When two skills expose a trade-off, choose the design that protects game truth, viewer comprehension, fair disclosed influence, recoverability, and measurable readiness.

## Skill Shape

Every skill contains:

- trigger-only Agent Skills frontmatter;
- core principle and scope;
- conditions for use and non-use;
- non-negotiable invariants;
- step-by-step operating workflow;
- concrete required outputs;
- measurable review gate;
- handoffs to other skills;
- common failure modes and corrections.

Descriptions begin with “Use when…” and describe only triggering conditions. They do not summarize the workflow, which forces agents to read the full skill.

## Test-Driven Skill Authoring

Skill changes follow the test harness in `skills/tests/`:

1. select or write a pressure scenario that tempts a capable agent into a predictable shortcut;
2. capture the naive baseline response or decision and its rationalization;
3. write the smallest skill guidance that blocks the failure without overfitting;
4. apply the skill to the same scenario and evaluate the acceptance matrix;
5. add adversarial variants and close newly discovered loopholes;
6. keep the skill concise enough to be read in full;
7. record the review result.

Mechanical rules that can be validated automatically should become schemas, tests, or CI checks. Skills remain focused on judgement and operating method.

## Required Cross-Skill Vocabulary

Use these terms consistently:

- **authoritative state**: the game truth changed only by the deterministic simulation;
- **render snapshot**: immutable public/presentation view of authoritative state;
- **semantic event**: typed fact emitted by rules for presentation, audio, analytics, or persistence;
- **influence request**: validated viewer/operator request before game eligibility and scheduling;
- **named random stream**: seeded independent source of replayable randomness;
- **fallback policy**: bounded deterministic behaviour used when an advanced decision system is unavailable;
- **dramatic pattern**: recognizable sequence of tension, progress, setback, recovery, and resolution;
- **evidence bundle**: reproducible artefacts proving acceptance criteria;
- **phase gate**: pass/fail boundary for a vertical implementation increment;
- **production-ready**: R5 status under the catalogue production-readiness standard.

## Skill Review Status

A skill is `candidate` until its pressure scenarios, acceptance matrix, cross-skill terminology, and one real game application pass review. It becomes `verified` after the production-readiness reviewer confirms that it prevents the target shortcut without creating contradictions or unusable process overhead.
