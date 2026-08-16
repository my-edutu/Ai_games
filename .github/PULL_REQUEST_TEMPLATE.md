## Objective

<!-- What phase criterion or bounded change does this PR complete? -->

## Scope / Non-Scope

<!-- List what changed and what intentionally did not. -->

## Requirements

<!-- Link requirement and phase IDs. -->

## Test-First Evidence

- [ ] Focused tests were observed failing for the intended missing behavior.
- [ ] Focused tests pass.
- [ ] Affected suite passes.
- [ ] Property, invariant and replay tests pass where applicable.
- [ ] Commands and environment are recorded below.

```text
commands:
results:
```

## Determinism, Performance and Failure

- [ ] Random streams, order and checksums are unchanged or intentionally versioned.
- [ ] Snapshot and event compatibility is declared.
- [ ] Performance and resource evidence meets the phase budget.
- [ ] Failure, degradation and rollback behavior is tested.

## Audience, Security and Accessibility

- [ ] No raw provider, private or payment data enters game or public state.
- [ ] Interaction effects remain bounded, idempotent, moderated and non-guaranteed.
- [ ] Security, privacy, content and platform-policy review is complete where applicable.
- [ ] Mobile, accessibility, audio and output evidence is complete where applicable.

## Evidence Manifest

<!-- Commit, versions, config/content, seeds/events, hardware/environment and artefact paths/checksums. -->

## Reviews

- [ ] Specification-compliance review
- [ ] Code, architecture and quality review
- [ ] Independent production-readiness review when R5

## Risks and Rollback

<!-- Known risks, safe disable, migration or fresh-run boundary, and exact rollback. -->
