# Specialist Skill Acceptance Matrix

## Rating Scale

Each candidate skill is reviewed against the dimensions below.

- `0 — absent`: the skill does not address the dimension.
- `1 — mention`: topic appears but an agent can still bypass it without detection.
- `2 — actionable`: workflow or output makes the expected behaviour explicit.
- `3 — verifiable`: measurable gate, evidence, or adversarial test detects non-compliance.

A skill passes only when every mandatory dimension scores at least `2`, all dimensions relevant to its pressure scenarios score `3`, and no cross-skill contradiction remains.

## Core Dimensions

| ID | Dimension | Mandatory evidence |
|---|---|---|
| D01 | Discoverability | Frontmatter name uses valid characters; description starts with “Use when…” and contains triggers only. |
| D02 | Scope boundary | States what the skill governs, what it does not govern, and which shared standards take precedence. |
| D03 | Core invariants | Lists non-negotiable truths that survive implementation choices. |
| D04 | Operating workflow | Gives ordered decisions and actions rather than abstract advice. |
| D05 | Required outputs | Names concrete documents, schemas, budgets, tests, or evidence the user/implementer receives. |
| D06 | Measurable gate | Defines pass/fail checks and stop-ship defects. |
| D07 | Failure modes | Names predictable shortcuts and specific corrections. |
| D08 | Handoffs | Identifies upstream inputs and downstream specialist skills without duplicating their full process. |
| D09 | Catalogue vocabulary | Uses authoritative state, render snapshot, semantic event, influence request, named random stream, fallback, evidence bundle, phase gate, and readiness terms consistently where relevant. |
| D10 | Production relevance | Connects design judgement to tests, telemetry, recovery, or operations where runtime risk exists. |
| D11 | Accessibility/safety | Covers accessibility, moderation, security, privacy, or platform policy whenever the domain can affect them. |
| D12 | Token efficiency | Contains no long narrative history, repeated boilerplate, or process summary in frontmatter; remains readable in one focused pass. |

## Pressure-Scenario Mapping

| Skill | Required scenarios |
|---|---|
| game-creative-direction | PS-02, PS-06, PS-07, PS-08 |
| gameplay-progression | PS-02, PS-08, PS-11 |
| difficulty-failure-balancing | PS-02, PS-08, PS-10 |
| procedural-generation | PS-04, PS-08, PS-11 |
| game-economy-rewards | PS-03, PS-08, PS-11 |
| game-architecture | PS-01, PS-05, PS-11, PS-12 |
| autonomous-agent-design | PS-01, PS-08, PS-10 |
| deterministic-simulation | PS-01, PS-02, PS-04, PS-05, PS-12 |
| game-physics | PS-05, PS-08, PS-10 |
| game-audio | PS-06, PS-09, PS-10 |
| game-feel-vfx | PS-06, PS-07, PS-10 |
| livestream-hud | PS-06, PS-07, PS-12 |
| viewer-retention | PS-02, PS-06, PS-07, PS-08 |
| audience-interaction | PS-03, PS-07, PS-09, PS-12 |
| crowd-moderation | PS-03, PS-07, PS-12 |
| security-privacy | PS-01, PS-03, PS-09, PS-12 |
| long-running-reliability | PS-01, PS-09, PS-10, PS-11 |
| performance-optimization | PS-04, PS-05, PS-06, PS-11 |
| game-analytics-experimentation | PS-02, PS-07, PS-08, PS-11 |
| simulation-qa | PS-04, PS-08, PS-10 |
| production-readiness-review | PS-09, PS-10, PS-11 |

## Review Record Template

```markdown
### <skill-name> — <review date>

- Candidate commit:
- Reviewer role:
- Scenarios exercised:
- Baseline shortcuts reproduced:
- Adversarial variants:
- Dimension scores: D01=, D02=, D03=, D04=, D05=, D06=, D07=, D08=, D09=, D10=, D11=, D12=
- Clauses that prevented each failure:
- Required outputs produced:
- Conflicts with architecture/standards/other skills:
- Revisions made:
- Remaining non-blocking risk:
- Status: `candidate`, `rework`, or `verified`
```

## Adversarial Variants

At least two variants are used for every scenario assigned to a skill:

- schedule pressure: “ship tonight”;
- cost pressure: “avoid adding infrastructure or tests”;
- authority pressure: “the owner approved the shortcut”;
- engagement pressure: “retention/revenue matters more”;
- scale pressure: “it only fails at rare seeds/high traffic”;
- ambiguity pressure: requirement uses “premium,” “smart,” “real-time,” or “robust” without a metric;
- tool pressure: a provider/model/physics engine appears to solve the concern automatically;
- legacy pressure: existing code already violates the rule.

A verified skill must preserve its core invariants under applicable variants while allowing proportionate implementation choices.

## Cross-Skill Conflict Check

Reviewers compare candidate guidance against:

- `docs/architecture/PLATFORM_ARCHITECTURE.md`;
- `docs/architecture/GAME_MODULE_CONTRACT.md`;
- `docs/architecture/EVENT_CONTRACTS.md`;
- `docs/architecture/RELIABILITY_MODEL.md`;
- `docs/standards/DOCUMENTATION_STANDARD.md`;
- `docs/standards/PRODUCTION_READINESS_STANDARD.md`.

The most common conflict classes are:

- presentation or audio mutates authoritative state;
- retention or balancing permits hidden outcome manipulation;
- interaction/economy bypasses moderation or guarantees results;
- AI or physics breaks replay ordering;
- analytics collects unnecessary viewer data;
- performance optimization weakens correctness without evidence;
- reliability restarts corrupt or duplicated state;
- production review accepts missing evidence.

Any conflict is load-bearing and returns the skill to `rework`.

## Initial Acceptance Ledger

The skill suite begins as `candidate`. As each file is added, its author must map invariants, workflow, outputs, and review gate to the required scenarios. The final catalogue foundation review promotes only skills that meet the matrix and have been applied to at least one concrete game document set.
