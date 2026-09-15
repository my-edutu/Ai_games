# AI Escape Room Physical Rebuild — Implementation Plan

**Date:** 2026-09-15
**Branch:** `agent/escape-room-2-5d-rebuild`
**Base:** `agent/ai-escape-room-all-phases`

## Goal
Replace the flat/debug-like presentation with a physical 2.5D/3D Cipher Vault while preserving deterministic generation, AI observation/planning, rule application, replay, recovery, and viewer-integrity boundaries.

## Execution slices
1. Baseline audit and capture from the existing CI candidate.
2. Add failing browser/contract checks for a physical WebGL renderer and safe mechanism presentation metadata.
3. Keep `EscapeRenderSnapshot` as the only browser truth boundary; add only non-secret `mechanismKind` presentation metadata.
4. Build dependency-free WebGL room geometry, materials, practical-light styling, avatar, props, camera and inspection.
5. Map the eight authoritative puzzle primitives to distinct physical mechanism geometry.
6. Add event-driven camera beats, micro-animation, contact shadows, dust, hazard pressure and WebAudio cues.
7. Reduce HUD footprint so the room remains the dominant image, including clean-feed mode.
8. Run TypeScript/unit/integration/self-test/browser CI; collect screenshots; critique and polish from runtime evidence.
9. Update visual, solvability, performance and acceptance reports truthfully.

## Non-goals
No changes to Eko Street Run or any other game. No remote model dependency. No client mutation of authoritative puzzle state. No hidden solution values in render data. No fake runtime screenshots.
