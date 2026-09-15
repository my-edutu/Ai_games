# Visual Acceptance Report

Date: 2026-09-15
Candidate branch: `agent/marble-survival-physics-rebuild`

## Three-pass quality loop

### Pass 1 — Build
Implemented/recovered deterministic authority, Three.js WebGL arena, spatial track, physical marble materials/rolling, moving sweepers, bumpers/pits/blocks, shadows, five visual themes, camera modes, event VFX, gameplay-first HUD, clean feed, local Three.js serving and 2D safety fallback.

### Pass 2 — Critique
Found and fixed:
- Marble did not exist on current `main`; recovered the actual prior implementation instead of inventing rules.
- Recovered browser server referenced the obsolete `dist/games/marble-survival` path; updated to the new target.
- Root TypeScript build ignored Marble; added target source to `tsconfig.json`.
- Recovered tests depended on an obsolete helper module; replaced with tests against the real runtime.
- Original runtime was Canvas 2D/dashboard-heavy; made Three.js primary and reduced broadcast UI to overlays.
- WebGL failure needed a safe fallback; preserved the authoritative Canvas renderer until `.three-ready` is proven.

### Pass 3 — Polish
Added quality-tier budgets, local/pinned Three.js delivery under CSP, geometric competitor patterns, contact shadows, theme-specific lighting/fog/dressing, pooled semantic VFX, reduced-motion handling, clean-feed viewport behavior, final/champion framing and explicit visual verification tooling.

## Acceptance matrix

| Requirement | Status |
| --- | --- |
| Real spatial 2.5D arena | IMPLEMENTED IN CODE; browser proof pending |
| Genuine deterministic physics integration | IMPLEMENTED (existing fixed-point engine retained) |
| Rolling marbles / angular presentation | IMPLEMENTED |
| Material-specific authoritative physics | PARTIAL |
| Shadows/contact cues | IMPLEMENTED |
| Persistent competitor identities | IMPLEMENTED |
| Static + moving obstacle types | IMPLEMENTED (current authority set) |
| Collision feedback | IMPLEMENTED |
| Elimination / tournament progression | PRESERVED |
| Multiple arena themes | IMPLEMENTED |
| Cinematic camera / final framing | IMPLEMENTED |
| VFX | IMPLEMENTED |
| Environmental/spatial audio | PARTIAL |
| Compact HUD / clean feed | IMPLEMENTED |
| Long-session cleanup | PARTIAL; disposal logic implemented, endurance proof pending |
| Stable performance | NOT_PROVEN |
| Viewer integrity boundaries | PRESERVED |
| Existing simulation/rules | PRESERVED |
| Tests/build | PENDING CI evidence |
| Browser runtime | PENDING CI/browser evidence |
| Screenshots/gameplay capture | NOT_PROVEN |
| Three quality passes | COMPLETED AS CODE/REVIEW PASSES; runtime visual pass still pending |
| Protected parallel games untouched | VERIFIED BY DIFF |

## Stop-ship / incomplete items

Do not declare final production completion until CI is green and a live browser run supplies screenshots/video, HUD-off review, performance measurements and extended-session evidence. Full authoritative per-surface material zones, vertical gravity/rigid-body physics, dedicated visible fan geometry, spatial rolling/material audio, and replay shots are not complete in this candidate.
