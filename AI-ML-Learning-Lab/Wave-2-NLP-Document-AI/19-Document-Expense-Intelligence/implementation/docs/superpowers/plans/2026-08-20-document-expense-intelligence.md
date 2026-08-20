# Document Expense Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reviewable document-to-expense pipeline through phases 1–10.

**Architecture:** Transparent parser and validation engine first; separately trained expense categorizer; low-confidence/conflicting values routed to human review; corrections append to an immutable audit ledger. Serving requires configured artifacts and exposes parser/category/ruleset/data versions and hashes.

**Tech Stack:** Python, Pydantic, FastAPI, scikit-learn, pytest.

**Spec:** `docs/superpowers/specs/2026-08-20-document-expense-intelligence-design.md`

## Global Constraints
- Never silently alter a financial value extracted from source text.
- Preserve source value, confidence, and provenance.
- Use vendor/template holdout for representative evaluation.
- Do not claim real OCR accuracy without real scanned-document validation.
- Fail closed when required serving artifacts are absent.

## Tasks
- [x] Contracts, provenance and field confidence.
- [x] Parser baseline and monetary normalization.
- [x] Reconciliation, duplicate and anomaly rules.
- [x] Vendor/template holdout evaluation.
- [x] Separate spend-category model and artifact fingerprint.
- [x] Reviewer correction ledger and canonical corrected copy.
- [x] Fail-closed API with train/serve category parity.
- [x] Monitoring, registry and rollback.
- [x] Representative pilot and benchmark.
- [x] Release cards, runbook, limitations and production-hardening audit.
