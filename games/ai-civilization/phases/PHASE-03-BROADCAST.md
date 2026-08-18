# Phase 3 — Premium Broadcast Experience

## Objective

Expose the autonomous kingdom through a deterministic, privacy-safe, accessible browser source that remains understandable in a 1920×1080 broadcast frame and on a 390×844 mobile viewport.

## Implemented contracts

- Deeply immutable and detached render snapshots with bounded tiles, characters, events, text, and viewer-safe rival observations.
- Public identity and payloads exclude operator seeds, raw provider payloads, private IDs, arbitrary viewer text, stack traces, prompts, host paths, and debug fields.
- Goal, decree, danger, tier, renown, population, stability, defence, ruler intent, dynasty, rivals, Great Works, crisis causality, and chronicle hierarchy.
- Semantic audio frame with music hysteresis, cue priority, cooldown, deduplication, captions, bounded memory, and a 16-voice ceiling.
- Responsive browser source with a live tile world, geometric portrait recipes, bounded animation, reduced motion, high contrast, larger text, audio controls, captions, reconnect slate, and no external asset dependency.
- Host-owned runtime with `/civilization/health`, `/civilization/state`, `/civilization/events`, and `/civilization/stream` routes, bounded SSE clients, CSP/security headers, and self-test.

## Test-first and review evidence

- The initial Phase 3 suite failed because presentation, audio, browser, and stream interfaces did not exist.
- The first implementation made six contracts green.
- A visual review then found two P1 defects: the mobile map overflowed a 390 px viewport and the desktop chronicle/captions fell below a 1080 px clean frame. Viewport regressions were added before the CSS correction.
- A second review found three P1 defects: operator seed leakage in the public label, reversed audio `aria-pressed` semantics, and disabled browser storage breaking initialization. Focused regressions were added and observed red before remediation.
- Fresh Phase 1–3 verification completed with 31 passed and 0 failed.

## Acceptance evidence

- 1920×1080: zero horizontal overflow; chronicle bottom 1018.89 px; captions bottom 1067.14 px; 36 px goal text; 21.6 px ruler text.
- 390×844: zero horizontal overflow; map right edge 363.4 px.
- Stream self-test: health, state, events, SSE, and static source all return 200; render schema and privacy scan pass.
- Representative 1,500-day authority run: zero integrity failures and checksum `6e31831e`.
- Authoritative checksum remains unchanged by snapshot creation, muted audio, or unavailable audio.

## Readiness boundary

Phase 3 completes the software broadcast surface but does not establish safe audience influence, durable recovery, operations, launch governance, real-duration soak, or canary evidence. R5 is not claimed.
