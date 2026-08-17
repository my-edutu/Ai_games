# Phase 5 — Reliability, Recovery and Operations

## Authority durability

Game 9 now has an adapter-neutral append-only authority journal model with monotonically increasing writer epochs. A new lease fences the previous writer. Commands are reserved before mutation and committed with a result checksum. Duplicate command IDs return the original reservation and cannot apply a second authoritative effect inside the retained dedupe horizon.

Snapshots are checksum-verified before restore. Recovery scans newest to oldest compatible snapshots; a corrupt newest snapshot falls back to an older verified point. If no verified snapshot exists, the run is quarantined rather than silently continued.

## Operations

Independent probes cover simulation progress, render freshness/black output, intended audio, snapshot age, queue pressure and memory slope. Unsafe truth/output states enter a safe scene and verified-recovery workflow. Audio or rendering can restart independently. Pressure first reduces cosmetic quality.

The supervisor permits only a bounded crash budget. Three crashes inside the configured window open a breaker, preventing restart storms until the breaker interval elapses.

Typed operator controls expose audience disable/enable, verified snapshot capture and safe-intermission entry. Unknown commands and non-operator roles are rejected; there is no arbitrary set-health/state-edit control.

## Phase gate

The Phase 5 suite must prove fencing, exactly-once reservation/commit, corrupt-snapshot fallback, quarantine, output health, crash breaking, typed controls, bounded resources and deterministic compressed chaos. Synthetic chaos is engineering evidence only; it does not substitute for real 72-hour candidate endurance or canary evidence.
