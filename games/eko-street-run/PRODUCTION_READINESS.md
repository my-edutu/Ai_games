# Eko Run Production Readiness

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define truthful readiness levels, operational evidence, stop-ship conditions and rollout/rollback expectations.  
**Status:** `draft operational contract`; current project level is R0/constitution  
**Owning scope:** All phases, final decision Phase 13  
**Related:** `TESTING_STRATEGY.md`, `TECHNICAL_ARCHITECTURE.md`, catalogue production-readiness standard.  
**Last material review:** 2026-09-15  
**Version:** `READINESS-1.0`

## Readiness Levels

- **R0 — Constitution:** product/architecture/test contracts exist; no runtime readiness claim.
- **R1 — Foundation:** deterministic headless authority, replay/snapshot/restore and basic operational metadata verified.
- **R2 — Playable slice:** precision movement + one representative Lagos vertical slice pass experience/browser/accessibility gates.
- **R3 — Feature complete candidate:** v1 systems/districts/AI/viewer features intended for launch are implemented with integration evidence.
- **R4 — Staging/canary candidate:** security, performance, accessibility, provider, recovery and operational drills pass in staging; required soak/canary clocks may still be incomplete.
- **R5 — Production ready:** every catalogue gate including required production-candidate soak, canary and rehearsed rollback passes with independent/candidate-review status recorded truthfully.

Current status must never be described above the highest evidence-backed level.

## Service Objectives for Production Candidate

Final numerical production SLOs are calibrated with representative Phase 11–12 workloads; the contract already requires measurement of:

- authoritative tick availability/latency;
- output frame freshness;
- intended audio presence/silence state;
- snapshot age/durability;
- restore/recovery time;
- provider/audience processing availability;
- operator command success;
- safe-intermission activation/recovery;
- crash-loop/quarantine rate;
- memory/resource slope.

Phase 1 has only the foundation tick budget defined in `TECHNICAL_ARCHITECTURE.md` and does not claim stream SLOs.

## Failure-Domain Matrix

| Domain | Truth impact | Degradation | Recovery expectation |
|---|---|---|---|
| simulation invariant/checksum | integrity uncertain | quarantine run, preserve evidence | restore verified snapshot or fresh run |
| AI policy | truth valid if commands legal | deterministic fallback | recover policy without changing prior state |
| renderer | authority remains valid | safe slate/restart renderer | reconstruct from latest render snapshot |
| audio | authority remains valid | visual/caption alternatives + restart | restore semantic audio state |
| provider/audience | authority remains valid | disable affected interaction; AI continues | reconnect with idempotency |
| moderation/entitlement | external eligibility unavailable | fail closed for unsafe/public-text or paid-authoritative effects | resume after service health |
| persistence lag | durability risk | bound queue; reject effects requiring unavailable audit | catch up or safe boundary |
| analytics | authority remains valid | bounded drop/buffer | recover without blocking tick |
| output/capture frozen | public experience invalid | safe source/scene + restart | verify frame freshness before return |

## Snapshot/Restore/Quarantine

Restore never trusts “latest” blindly. It validates compatibility, checksum, invariants and event continuity, then replays and checks checkpoints. Divergence is quarantined rather than silently corrected. Older verified snapshots may be tried; otherwise a fresh run begins with transparent system state.

## Resource Boundaries

Every queue/cache/listener/timer/entity/history/texture/audio voice/buffer has a cap, TTL, eviction/cleanup or rollover rule by the phase that introduces it. Monotonic unbounded growth is P1 for unattended mode.

## Asset/Policy Readiness

Release assets require provenance/licence/third-party-rights review. Public text/input requires moderation and privacy controls. Raw provider/payment data, secrets, stack traces and internal IDs remain absent from public bundles/output/evidence.

## Accessibility Readiness

Critical goal/path/danger/result meaning must survive muted audio, color-vision variations and reduced-motion/flash settings. Phone-size/compressed-stream capture is required for launch-facing HUD. Accessibility defects affecting critical information are stop-ship.

## Required Operations Evidence

Before R5:

- dashboard/alert ownership and runbooks;
- interaction disable and emergency halt;
- provider outage/reconnect/reversal;
- renderer/audio restart and output health;
- corrupt-snapshot quarantine/restore;
- configuration/content rollback and previous deployment rollback;
- credential rotation/revocation where external providers exist;
- capacity evidence on declared reference hardware;
- 72-hour production-candidate soak;
- seven-day canary;
- rollback rehearsal after the last material change requiring clock reset.

## Stop-Ship Conditions

- unresolved Eko experience stop-ship issue;
- replay divergence or ambient authoritative randomness;
- invalid generated route counted as fair loss;
- remote model required for continuity;
- secret/private/raw payment/chat exposure;
- duplicate paid-authoritative effect;
- unbounded resource/queue growth;
- black/frozen/silent output without detection/recovery;
- critical inaccessible cue;
- unlicensed/unreviewed release asset;
- missing emergency owner/runbook/rollback evidence;
- P0/P1 production finding.

## Rollout and Rollback

Feature/config/content changes are versioned and have rollback thresholds. Unsupported deterministic/schema versions start fresh runs rather than loading incompatible snapshots. Viewer-interaction features have independent safe-disable controls. Rollback is tested; it is not defined as “redeploy and hope.”

## Phase 1 Promotion to R1

R1 requires green deterministic foundation tests, headless route completion, matching repeat/restore/render-schedule checksums, corrupt snapshot rejection, architecture-boundary checks, documented foundation performance measurement and no false claim of playable/stream readiness.
