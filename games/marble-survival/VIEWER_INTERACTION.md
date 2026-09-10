# Marble Survival Tournament — Viewer Interaction

## Current operational scope

Only `wind-vote` is operational. `gate-tempo`, `shield-orb`, `cheer-pulse`, `theme-vote` and `next-arena` remain catalogued but fail closed. North, South, East and West are browser controls; `calm` is a valid authority option without a current button.

Despite the legacy name, the operational behavior is **first eligible bounded wind request**, not an aggregated majority vote. No paid-provider, membership, Twitch or YouTube integration is supplied here.

## HTTP admission

`GET /api/snapshot` issues a signed HTTP-only, SameSite=Strict session cookie. The browser submits a request ID, visible run ID, visible one-based round number, `wind-vote` family and an allowlisted option. The server resolves identity from the signed cookie and uses its own monotonic reception clock; client `userId` and `at` fields cannot bypass cooldowns.

POST requests must use JSON and pass same-origin checks. Missing/invalid sessions, malformed requests, stale run/round references, duplicate requests and cooldown conflicts are refused before an authoritative command is admitted. Session-scoped request IDs are normalized before entering authority. A fresh browser session is not proof of a unique person: multi-session bot abuse still requires production identity and ingress controls.

Operator commands require an explicitly configured credential. With no configured credential they are disabled; there is no known default token. The CLI binds to loopback unless `HOST` is explicitly supplied.

## Authoritative wind policy

- Force magnitude: 6 fixed velocity units per authoritative tick, applied equally to active marbles.
- Duration: 180 logical ticks, with an exclusive expiry boundary.
- One pending or active wind field at a time; a later direction cannot silently overwrite an accepted field.
- Admission cooldown: 900 logical ticks; maximum 32 accepted wind commands per tournament.
- Per-session HTTP cooldown: 15 seconds from server reception time, independent of client time.
- Countdown requests wait for the first racing tick. Non-active states and championship round reject admission.
- Host dedupe/cooldown storage is bounded to 512 entries; authority history has a finite cap of 4,096, while admission limits the actual per-run command count to 32.

`MarbleRuntime.scheduleInfluence` schedules accepted commands. HTTP handlers do not directly change velocities, scores, eliminations or champions. Application emits semantic events and moves the tournament to the separate `Assisted` record category. Round advancement clears pending/active fields while retaining the run's bounded applied-ID history and cooldown state.

## Public representation

Public snapshots expose availability, queued/active status, direction, expiry and logical retry interval. Public events pass through an explicit field/value allowlist. They do not expose session nonces, normalized request IDs, raw chat, provider/payment data or internal integrity diagnostic detail.

The browser disables unavailable choices and distinguishes queued fields, active wind and next-window waiting. Display timing is not authoritative admission timing.

## Recovery compatibility

Pending commands, applied-ID history and logical cooldown are captured in authority state. Snapshot capture and restore use independent object copies and validate JSON checksums, input-policy version, state-set/config consistency, exact declared wind strength and queue/conflict bounds. A valid pending command survives snapshot round trip without double application.

The snapshot envelope requires **`wind-policy-v2`** in addition to `marble-physics-v2`. Older envelopes fail with a typed version error. Deployments crossing this boundary start a fresh tournament; no silent migration of pending commands is supported.

This proves snapshot primitives, not a deployed durable journal or host crash-recovery service. Credentialed provider adapters, production flood limits, operator audit/roles, complete effect cancellation/reversal and multi-session abuse controls remain separate unfinished work. No purchase or request promises a winner or guaranteed qualification.
