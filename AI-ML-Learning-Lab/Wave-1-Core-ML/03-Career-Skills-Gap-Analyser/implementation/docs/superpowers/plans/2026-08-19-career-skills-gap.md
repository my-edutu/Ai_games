# Career Skills Gap Analyser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an explainable, evidence-aware role skill-gap service that never treats missing resume text as proof of absence.

**Architecture:** A versioned ontology and role contract feed evidence extraction, explicit observed/inferred/unknown gap analysis, learning-priority calculation, a conservative semantic matcher, typed API, independent ontology/model operations, representative pilot and release evidence.

**Tech Stack:** Python, Pydantic, scikit-learn, FastAPI, pytest.

**Spec:** `docs/superpowers/specs/2026-08-19-career-skills-gap-design.md`

## Global Constraints
- Protected demographic traits are excluded from ranking/extraction contracts.
- Missing evidence stays `unknown`.
- Inferred evidence is labelled and lower confidence than observed evidence.
- Recommendations do not guarantee employability.
- Representative pilot evidence is never described as real-world impact evidence.

## Tasks
- [x] Ontology, contracts and evidence states.
- [x] Gap analysis and deterministic dataset snapshot.
- [x] Exact/semantic benchmark and learning priorities.
- [x] Typed API with traceable versions.
- [x] Independent ontology/model operations, drift, audit and rollback.
- [x] Representative pilot, release gate and handover evidence.
- [x] Full tests, compile, benchmark, pilot and release verification.
