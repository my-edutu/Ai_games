# Specialist Skill Review Protocol

## Purpose

Apply test-driven discipline to process guidance. A skill is accepted because it changes decisions under pressure and makes defects detectable—not because it sounds expert.

## Roles

- **Scenario author:** describes a realistic task and pressure that invites a shortcut.
- **Baseline responder:** solves the scenario without reading the candidate skill.
- **Skill responder:** solves the same scenario after reading the candidate skill and only the minimum relevant architecture context.
- **Reviewer:** compares decisions and outputs using the acceptance matrix.
- **Adjudicator:** resolves genuine conflicts between a skill and higher-precedence approved specifications.

Where native subagents are unavailable, one controller may perform the roles sequentially, explicitly separating baseline notes, skill-guided response, and review. The record must not claim independent review when none occurred; final verification then remains pending until a later independent reviewer applies the skill to implementation work.

## Red — Baseline

1. Select at least one required scenario from `BASELINE_PRESSURE_SCENARIOS.md`.
2. Add a game-specific prompt containing real constraints, schedule pressure, and an attractive shortcut.
3. Produce a concise naive design or implementation decision without reading the candidate skill.
4. Record the exact rationalizations and omitted outputs.
5. Confirm the failure is caused by missing judgement guidance rather than a typo or unavailable tool.

A baseline that already behaves correctly is not useful. Increase pressure or choose a less obvious edge case.

## Green — Candidate Skill

1. Write the smallest reusable guidance that blocks the observed shortcut.
2. Keep frontmatter trigger-only and ensure the responder must read the body.
3. Re-run the same scenario with the skill.
4. Require the skill’s named outputs, metrics, and review gates.
5. Score all relevant acceptance dimensions.
6. Confirm the new response preserves scope and does not over-engineer unrelated systems.

The pass must be behavioural. Merely quoting the skill is a failure if the design still permits the original defect.

## Refactor — Loophole Closure

1. Apply at least two adversarial variants from the acceptance matrix.
2. Search for alternate rationalizations: “temporary,” “only cosmetics,” “provider handles it,” “rare seed,” “operator approved,” “we will monitor,” or “documentation only.”
3. Tighten the invariant, workflow, output, or gate that allowed the bypass.
4. Remove duplicate explanation and keep the skill focused.
5. Re-run the original and variant scenarios.
6. Check for contradictions with all shared architecture and standard documents.

## Review Package

Each review package contains:

```text
skills/tests/reviews/<skill>/<date>/
├── scenario.md
├── baseline-response.md
├── baseline-findings.md
├── skill-response.md
├── acceptance-scores.md
├── adversarial-variants.md
├── conflict-check.md
└── verdict.md
```

A documentation-only foundation may store the initial results in a consolidated review file. Real implementation application later adds code/test/evidence references.

## Verdicts

- `rework`: a required scenario remains bypassable, a dimension scores below threshold, or a cross-skill conflict exists.
- `candidate`: documentation-level pressure tests pass, but no independent implementation application has occurred.
- `verified`: pressure tests pass, cross-skill review is clean, and an independent reviewer confirms the skill prevented or detected the target defect on real game work.
- `deprecated`: triggers overlap with a better skill or guidance conflicts with current architecture; replacement is named.

## Review Questions

### Discoverability

- Would an agent facing the actual symptom know to load this skill?
- Does the description avoid summarizing the workflow?
- Are game-domain keywords and failure symptoms represented?

### Decision Quality

- Does the skill protect the catalogue’s core truths under pressure?
- Does it force explicit trade-offs rather than one fashionable technology?
- Can it adapt to Snake, Marble, Tower, Dungeon, and persistent simulations?
- Does it avoid project-specific magic numbers unless they are catalogue standards?

### Outputs and Verification

- Are outputs exact enough to save into a game document or evidence bundle?
- Is there a measurable pass/fail gate?
- Would a reviewer detect a shortcut by checking the output?
- Are stop-ship defects explicit?

### Handoffs

- Does the skill know what it consumes from architecture/product work?
- Does it invoke adjacent skills at the right boundary?
- Does it avoid duplicating full specialist processes?
- Does terminology match the repository vocabulary?

### Operational Reality

- Does guidance cover failure, degradation, telemetry, testing, and rollback where relevant?
- Does it account for days-long operation and provider outages?
- Does it prevent hidden costs, unbounded memory, unbounded model calls, or manual recovery assumptions?

## Change Control

A skill change requires review when it alters:

- core invariants;
- mandatory workflow or outputs;
- acceptance/stop-ship criteria;
- architecture or cross-skill handoffs;
- production-readiness meaning;
- interaction, monetization, moderation, privacy, or security policy.

Editorial changes still run frontmatter validation, link checks, placeholder scan, and conflict scan.

## Foundation Exit Criteria

The initial specialist suite is complete when:

- all named skills exist with valid frontmatter and unique triggers;
- every skill maps to pressure scenarios and acceptance dimensions;
- cross-skill vocabulary and architecture checks are clean;
- each skill is applied to at least one game document in Wave A;
- the catalogue foundation review records candidate or verified status honestly;
- no skill can waive deterministic truth, fair disclosed influence, accessibility, recovery, security, or evidence gates.
