# African-Language Moderation Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
**Goal:** Build a controlled multilingual moderation service with per-language quality and human escalation.
**Architecture:** Explicit policy/language contract → normalized text/code-switch signals → char n-gram classifier → validation-selected threshold → untouched template holdout → context abstention/reviewer snippets → API → drift/review queue/rollback → release evidence.
**Tech Stack:** Python, Pydantic, scikit-learn, FastAPI, pytest.
- [x] Phases 1–3 scope/contracts/data fixtures.
- [x] Phases 4–5 multilingual baseline/model/per-language evaluation.
- [x] Phase 6 code-switch/context robustness and reviewer explanations.
- [x] Phase 7 fail-closed API/human escalation.
- [x] Phase 8 monitoring/active review/version rollback.
- [x] Phase 9 representative pilot.
- [x] Phase 10 cards/runbook/hardening evidence and deployment gate.
