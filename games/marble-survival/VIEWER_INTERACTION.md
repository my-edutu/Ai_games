# Marble Survival Tournament — Viewer Interaction

## Current v2 Policy

The premium upgrade preserves the six legacy influence families as an explicit catalogue, but it does **not** pretend all six are implemented.

| Family | v2 status | Current behavior |
|---|---|---|
| `wind-vote` | Operational | Schedules one bounded global wind field for a fixed logical duration; applies equally to active marbles; tournament becomes `Assisted`. |
| `gate-tempo` | Temporarily unavailable | Fails closed until a real v2 future-gate timing mechanic exists. |
| `shield-orb` | Temporarily unavailable | Fails closed until a validated v2 neutral collectable mechanic exists. |
| `cheer-pulse` | Temporarily unavailable | Fails closed until a fairness-reviewed v2 implementation exists. |
| `theme-vote` | Temporarily unavailable | Fails closed until the premium renderer exposes a bounded presentation-theme contract. |
| `next-arena` | Temporarily unavailable | Fails closed until the v2 generator exposes validated selectable profiles. |

Only operational choices are rendered as clickable spectator controls. The browser currently exposes North, South, East and West wind. `calm` remains a valid authority option but is not currently presented as a button.

## Wind Request Lifecycle

The browser submits a bounded request containing:

- request ID;
- session-scoped viewer token;
- family `wind-vote`;
- one allowlisted option;
- submission timestamp for host cooldown enforcement.

The server rejects malformed tokens, duplicates, cooldown violations, invalid choices, unavailable families, ineligible lifecycle state and queue overflow before anything can affect gameplay.

An accepted request is then passed to `MarbleRuntime.scheduleInfluence`. It does not alter velocity directly from the HTTP handler. Authority schedules the command for a logical tick, applies it once, records the request ID in bounded idempotency history, emits `influence-scheduled` / `influence-applied`, and changes the tournament record category to `Assisted`.

Current v2 wind constants:

- global force magnitude: 6 fixed velocity units per authority tick;
- duration: 180 logical ticks;
- authority pending queue cap: 64;
- authority applied-ID history cap: 4,096;
- host request-dedupe cap: 512;
- host per-viewer cooldown map cap: 512;
- per-viewer cooldown: 15 seconds at the HTTP participation boundary.

## Fairness

Wind is a global declared field. It does not secretly select a favourite marble, grant popularity-based mass/friction/restitution, guarantee qualification, eliminate a named marble, or rewrite a confirmed result.

Every gameplay-changing wind application moves records to the separate `Assisted` category. The effect is shown in the public HUD and event rail when active.

## Privacy and Moderation Surface

The v2 operational interaction uses fixed choices only. No arbitrary chat text is parsed into gameplay commands.

Public snapshots expose only:

- whether an influence is active;
- family;
- selected direction;
- authoritative expiry tick.

They do **not** expose viewer token, request ID, provider payload, payment data, raw chat, moderation evidence or operator/audit internals.

## Recovery / Replay

Pending influence commands and applied-ID history are part of authoritative state and snapshot checksums. Restore validates their shape and bounds. A pending command survives valid restore and applies exactly once.

Round advancement clears the active wind field and pending queue, while retaining bounded applied-ID history and the tournament's `Assisted` record category. Replay copies may display the historical active field but cannot reapply it to live authority.

## Provider Boundary

This upgrade does not add YouTube, Twitch, payment or membership provider dependencies. A production provider adapter still belongs outside the game package and must normalize/authenticate/moderate/idempotently deliver eligible requests before using this authority contract.

A credentialed production-provider session remains external production-readiness evidence.
