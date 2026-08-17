# AI Maze Escape Final Software Review

## Review scope

This internal production-candidate review covered game architecture, deterministic authority, generator/solver separation, partial-observation integrity, autonomous policy, threat fairness, audience transactions, durability/recovery, operator controls, broadcast UI, accessibility, performance boundaries, release governance, documentation, and the readiness score.

It is not the external signed exact-candidate review required for R5.

## Review method

1. Read the PRD, game design, AI, viewer-interaction, audiovisual, architecture, testing, readiness, and phase specifications.
2. Inspected authoritative state, rules, generation, solution oracle, observation/belief/policy, threats, influence, persistence, channel service, presentation, browser source, operations, and release assessor.
3. Inspected retained desktop, phone-landscape, and clean-feed captures.
4. Added focused regression tests before fixes.
5. Observed each new test fail for the intended reason.
6. Applied the smallest root-cause fix and reran full Node, stream, browser, chaos, and release-validation gates.

## Findings resolved

| Severity | Finding | Resolution and evidence |
|---|---|---|
| P1 | Threat evasion compared flattened cell IDs instead of grid distance. | Added a geometry regression; policy now ranks Manhattan distance using maze width. |
| P1 | A paused visible threat disappeared from observation while remaining collidable. | Observation now separates active presence from movement pause and keeps the threat visible. |
| P1 | An inactive threat could still capture the explorer and create danger telemetry. | Threat movement, capture, adjacency, and encounter telemetry now ignore inactive entities. |
| P1 | Rejected influence commands were appended to durable replay evidence before game-state validation. | Influence is validated against a cloned state before durable reservation; only accepted commands enter the journal. |
| P1 | Gateway/moderation/entitlement/audit failure did not consistently reject influence before reservation. | Interaction dependencies now fail closed without sequence, store, or authority mutation. |
| P1 | Operator state could mutate when durable audit was unavailable. | Controls require audit/persistence health and reserve an immutable request audit before mutation. |
| P2 | Browser presentation ignored the camera model and left most of the stage unused early in exploration. | Public-knowledge camera focuses discovered cells, preserves orientation, and expands into overview mode. |
| P2 | Fixed-interval polling could overlap slow requests and grow concurrent work. | Polling is serialized and timeout-bounded with AbortController; maximum concurrent state request is one. |
| P2 | Release manifest reused an old browser-capture digest after the UI changed. | Manifest artifacts are logical candidate-bound software contracts derived from the exact source SHA. Uploaded CI artifacts remain separate primary evidence. |
| P2 | The mandatory production drill catalogue referenced a missing Maze runbook. | Added a Maze-specific runbook with all 26 exact drill IDs, responses, exit evidence, rollback, and witness rules. |

## Architecture verdict

**PASS.** Authoritative state has one deterministic owner. Presentation consumes privacy-safe immutable snapshots. The generator oracle is unavailable to the normal AI. All gameplay randomness uses named seeded streams. Provider payloads and payment data stay outside game authority. Commands are validation-first, durable, replayable, and exactly-once. Writer leases fence stale processes; incompatible or divergent evidence quarantines.

## Gameplay and AI verdict

**PASS.** The AI operates only on visible/remembered knowledge, builds a bounded belief map, explores frontiers, manages key/door dependencies, revises repeated routes, evades active/paused visible threats, and retains deterministic fallback without a remote model. Technical/invalid content remains separate from fair failure.

## Broadcast and UI verdict

**PASS at software-candidate level.** The reviewed captures show:

- desktop: focused map uses the main stage while objective, level, discovery, intent, time, inventory, integrity, and caption remain readable;
- phone landscape: gameplay, objective, progress, AI mode, integrity, and captions remain visible without horizontal overflow;
- clean feed: essential game truth remains while decorative HUD is reduced;
- reduced motion, high contrast, captions, muted comprehension, output-health protection, and safe recovery are implemented.

The final reviewed runtime capture artifact is `9277539661`, digest `sha256:6d63ad83c3c2174f2482440db79df1a1b3b8b5676b003d3fd5a2335817872143`.

## Verification snapshot

Reviewed runtime candidate `cd77b7a59cbcf01074825777426c413b34d122be`, workflow `31998030132`:

- 251 / 251 Node tests passed;
- 8 / 8 catalogue Chromium tests passed, including five Maze broadcast tests;
- Maze and Snake stream self-tests passed;
- authoritative ambient-nondeterminism scan passed;
- Maze and Snake chaos and release-validation bundles passed;
- all six artifact uploads succeeded;
- open software P0: 0;
- open software P1: 0.

The subsequent governance tests explicitly demonstrated red before the candidate-bound manifest and runbook fixes.

## Readiness verdict

- Software phases: 6 / 6 complete.
- Software score: 88 / 88 available software points.
- Overall production-readiness score: **88 / 100**.
- Highest truthful readiness: **R4**.
- R5 verdict: **BLOCKED_EXTERNAL**.
- Production ready: **false**.

The remaining 12 points require primary production evidence. Green CI, internal review, fixtures, synthetic timestamps, and unwitnessed drills cannot award them.
