# Phase 4 — Safe Audience Interaction

**Target:** R3  
**Status:** Software implementation complete on the candidate branch; final exact-head CI remains the authoritative regression gate.  
**Behavioral source:** `8fdb5f1d4c7379bf1cc755340470d537d63256de` closes the final gateway-provenance P1.

## Acceptance criteria

- [x] Provider-neutral fixed-choice inputs with schema and stable reason codes.
- [x] At-most-once processing, logical vote windows and deterministic ties.
- [x] Paid-eligible weight capped at two; no targeted or terminal effects.
- [x] Bounded audit/queues and truthful acknowledgement lifecycle.
- [x] Disabled/provider-outage mode preserves complete autonomous gameplay.
- [x] Authentication, moderation and region checks fail closed before authoritative scheduling.
- [x] Pseudonymous identity, bounded per-viewer/global rate limits and duplicate suppression are enforced.
- [x] The authoritative ballot reducer rejects normalized input that did not pass the gateway.

## Review ledger

The initial Phase 4 implementation was driven by a formal RED suite and closed the provider-neutral gateway, deterministic reducer, logical vote windows, bounded effect catalogue and outage-continuity contracts. A later P1 audit found that a caller could normalize a provider event and invoke the reducer directly, skipping gateway authentication/moderation/rate/dedupe checks. Run number `1178` preserved that finding as a single failing regression with `415/416` tests passing. The behavioral fix uses non-forgeable in-process object provenance: only the exact frozen object returned by a successful gateway decision can enter the authoritative reducer. No serializable `verified` flag is trusted.

Open software P0: `0`. Open software P1: `0`, subject to final exact-head CI verification.

## Readiness boundary

Safe audience interaction does not make external providers production-validated. Credentialed YouTube/Twitch evidence, moderation/entitlement production behavior and other R5 gates remain external requirements.
