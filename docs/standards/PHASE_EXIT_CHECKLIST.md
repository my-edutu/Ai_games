# Universal Phase Exit Checklist

A phase does not close because code exists or a demo looks good. Close it only when every applicable item below is evidenced.

## Scope and Traceability

- [ ] Objective and viewer-visible vertical increment are delivered.
- [ ] Every in-scope requirement maps to implementation and evidence.
- [ ] Non-scope was not smuggled in without design and version review.
- [ ] Documentation matches actual paths, contracts, commands and behavior.

## Correctness and Integrity

- [ ] Focused behavior tests were observed failing before implementation.
- [ ] Unit, contract, property and invariant tests pass.
- [ ] Deterministic seed, replay and snapshot tests pass where applicable.
- [ ] Technical failures are not counted as normal game outcomes.
- [ ] No hidden outcome forcing, unsafe bypass or alternate headless rules exist.

## AI, Content and Balance

- [ ] Legal actions, budgets, fallback and stuck or pathology handling pass.
- [ ] Generated-content validators, repair, fallback and diversity pass.
- [ ] Statistical claims include seed and event strata, confidence and tail replay review.
- [ ] Economy, progression and record semantics are bounded and auditable.

## Audience and Safety

- [ ] Provider inputs are authenticated, normalized, moderated and rate-limited.
- [ ] Effects have eligibility, caps, cooldowns, expiry, reversal and idempotency.
- [ ] No purchase guarantees a prohibited outcome.
- [ ] No-audience and provider-outage operation passes.
- [ ] Security, privacy, content and platform-policy findings are closed.

## Broadcast and Operations

- [ ] Mobile comprehension and accessibility captures pass.
- [ ] Frame, audio, loudness, output and resource budgets pass.
- [ ] Renderer, audio, output and recovery paths are tested.
- [ ] Metrics, logs, alerts, dashboards and runbooks identify failures.
- [ ] Compatibility, migration, rollback and safe or fresh-run boundaries are declared.

## Evidence and Review

- [ ] Evidence manifest records commit, versions, config/content, seeds/events, commands, environment/hardware, thresholds and artefact paths or checksums.
- [ ] Specification-compliance review passes.
- [ ] Code, architecture and quality review passes.
- [ ] No P0, P1 or load-bearing flaky or ignored test remains.
- [ ] The next phase consumes stable public contracts rather than internal shortcuts.

R5 additionally requires the game-specific 72-hour candidate soak, seven-day canary, rollback and incident drills, and independent production-readiness `PASS`.
