# Phase 1 — Foundation

## Goal

Create a runnable isolated Vite package with typed deterministic scenario state, rule engine, persistence boundary, scoring primitives, and core tests.

## Implemented

- Package/build/test configuration.
- Typed scenario, metrics, stakeholders, hazards, artifacts, actions, audit events.
- Zod-validated scenario definition.
- Pure reducer/consequence engine.
- Zustand adapter that strips store functions before reducer cloning.
- Local persistence fallback.
- Unit coverage for PPE, hazards/evidence, drawing/inspection, checklist truth, unauthorized pour, readiness bands.

## Gate

- [x] Source implementation present.
- [x] Self-review found and fixed store serialization defect.
- [ ] Exact-commit CI test result recorded.
- [ ] Exact-commit production build result recorded.

Phase is implemented but not verification-complete until CI evidence is attached.
