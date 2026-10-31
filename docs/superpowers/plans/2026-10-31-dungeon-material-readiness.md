# Dungeon Material Readiness Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for this continuation because the external worker workspace is offline.

**Goal:** Restore authored character textures and repeated action animation, and make these failures visible in the Gauntlet evidence.
**Architecture:** Repair the existing local asset loader and stream-server CSP. Preserve server-authoritative state; use existing read-only diagnostic fields for regression checks.
**Tech Stack:** Existing JavaScript, Three.js 0.186.0, Node 22 and Playwright.
**Spec:** docs/superpowers/specs/2026-10-31-dungeon-material-readiness-design.md

## Global constraints
No main-branch writes, no model replacement, no fabricated screenshots, no weakening script CSP, and no AAA/independent-review claims.

## Review focus
Nested texture failures must not hide fallback rigs; same-tick rerenders must not reset animation; new attack ticks must replay; movement must remain continuous; camera tests must observe the rendered frame, not an immediate UI label.

## Task 1: regression and repair
- [x] Write failing tests for production CSP blob image decoding and repeated one-shot animation using the unchanged source.
- [x] Add request-scoped asset loading failure detection and decoded texture diagnostics in public/ai-dungeon/model-assets.js.
- [x] Permit blob fetch/images only in scripts/serve-dungeon-stream.cjs.
- [x] Verify negative script-CSP checks and the focused Node/browser tests.

## Task 2: integration evidence
- [x] Add real browser assertions for textures and looping camera modes; keep all existing acceptance assertions.
- [x] Record true test results and remaining gaps in the separate Gauntlet progress page.
- [ ] Commit atomically to the existing draft branch with a checked head lease.
- [ ] Inspect CI and genuine renderer screenshots if available in this session; otherwise leave those gates explicitly pending.

Ruling: the browser suite is authored and syntax-checked, not claimed locally executed. The isolated Chromium image-decode reproduction and focused Node tests ran red then green. Author self-review only; independent workers unavailable.
