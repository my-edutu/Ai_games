# Game 7 production-evidence intake

Use one completed copy of this template per evidence package. A checkbox is not evidence by itself. Attach immutable raw outputs and identify the exact candidate commit and environment.

## Candidate identity

- Repository:
- Commit SHA:
- Release/build identifier:
- Environment:
- Game configuration version:
- Authority seed policy:
- Start timestamp (UTC):
- End timestamp (UTC):
- Evidence owner:
- Independent reviewer or witness:

## A. 72-hour endurance run

- [ ] Candidate operated continuously for at least 72 hours.
- [ ] Process restarts, crashes, and operator interventions are enumerated.
- [ ] CPU, memory, event-loop lag, snapshot lag, queue depth, and network telemetry are attached.
- [ ] Round transitions, tournament restarts, and champions are counted.
- [ ] Replay samples and checksums are attached.
- [ ] Browser-source/stream quality observations are attached.
- [ ] Error budget and pass/fail threshold were defined before the run.
- [ ] Result is signed by the evidence owner and reviewer.

Attachments/links:

Findings and remediation references:

Decision: `PASS / FAIL / REPEAT`

## B. Seven-day canary

- [ ] Canary population and traffic percentage are documented.
- [ ] Success, latency, health, stream, and influence-abuse budgets were defined before start.
- [ ] Rollback trigger and rollback procedure were tested.
- [ ] Daily summaries and complete raw telemetry are attached.
- [ ] Incidents, user reports, provider disruptions, and interventions are enumerated.
- [ ] No unresolved P0/P1 finding remains.

Attachments/links:

Decision: `PASS / FAIL / EXTEND / ROLLBACK`

## C. Credentialed provider session

- [ ] Production streaming-provider account and credential path were used.
- [ ] Credentials came from the approved secret manager and were not logged or exposed to the browser.
- [ ] Connection, reconnect, token rotation/expiry, and disconnect behavior are documented.
- [ ] OBS/browser-source resolution, frame cadence, audio behavior, and overlay readability are recorded.
- [ ] Provider timestamps and session identifier are attached.

Provider:

Session identifier:

Attachments/links:

Decision: `PASS / FAIL / REPEAT`

## D. Independent security review

Reviewer and organization:

Scope and methodology:

- [ ] Public snapshot schema and information leakage.
- [ ] Operator authentication and secret handling.
- [ ] Request limits, path handling, security headers, and error responses.
- [ ] Viewer influence eligibility, replay, idempotency, rate, cooldown, queue, and dedupe bounds.
- [ ] Dependency and deployment configuration review.
- [ ] Abuse cases, logging privacy, monitoring exposure, and incident controls.
- [ ] Findings have severity, owner, due date, fix reference, and retest result.

Report attachment/link:

Unresolved findings:

Decision: `APPROVED / CONDITIONAL / REJECTED`

## E. Independent accessibility review

Reviewer and organization:

Devices, browsers, assistive technology, and methodology:

- [ ] Keyboard-only operation and focus visibility.
- [ ] Screen-reader structure, names, status/live regions, and vote feedback.
- [ ] Text and non-text contrast.
- [ ] Colour-independent marble identity.
- [ ] Reduced-motion behavior.
- [ ] Zoom/reflow at 200% and 400% where applicable.
- [ ] Mobile portrait/landscape and clean-feed evaluation.
- [ ] Audio opt-in and equivalent visible information.
- [ ] Findings have severity, owner, due date, fix reference, and retest result.

Report attachment/link:

Decision: `APPROVED / CONDITIONAL / REJECTED`

## F. Witnessed recovery drill

Witness:

Scenario start/end timestamps:

- [ ] Latest snapshot was deliberately corrupted.
- [ ] Previous checksum-valid snapshot was selected.
- [ ] Authority was restarted with the intended release and seed policy.
- [ ] Replay checksum was compared.
- [ ] Unauthenticated operator action was denied.
- [ ] Authenticated pause/resume or restart was accepted and audited.
- [ ] Broadcast continuity or disclosed reset behavior was evaluated.
- [ ] Raw logs, video/recording, checksums, and witness statement are attached.

Recovery time objective observed:

Recovery point objective observed:

Decision: `PASS / FAIL / REPEAT`

## G. Production capacity proof

Environment and instance/container shape:

Traffic/concurrency model:

- [ ] Authority tick performance under representative host contention.
- [ ] Snapshot and event read volume.
- [ ] Viewer influence accepted/rejected volume and queue behavior.
- [ ] Network and browser-source behavior.
- [ ] CPU, memory, event-loop lag, file descriptors, and storage headroom.
- [ ] Failure and recovery behavior at capacity boundaries.
- [ ] Capacity target, measured limit, and safety margin are documented.

Attachments/links:

Decision: `PASS / FAIL / RESIZE / RETEST`

## Approval

All seven packages above are required before R5 can be considered.

- Product owner:
- Engineering owner:
- Operations owner:
- Security approver:
- Accessibility approver:
- Final release approver:
- Approval timestamp (UTC):
- Final decision: `R5 APPROVED / R5 REJECTED`

Any missing, conditional, failed, expired, or unverifiable package keeps `productionReady = false`.
