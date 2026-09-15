# Visual Acceptance Report

**Branch:** `agent/maze-2-5d-rebuild`

## Acceptance policy
No item is COMPLETE merely because code exists. Browser/runtime evidence is required for visual claims, and CI evidence is required for regression claims.

## Current matrix
| Requirement | Implementation | Evidence status |
|---|---|---|
| Existing simulation/AI preserved | No authoritative maze files intentionally changed | PENDING final branch diff + CI |
| Real 2.5D world / physical wall depth | WebGL2 geometry + depth test implemented | PENDING browser screenshot |
| Explorer character | Multipart 3D explorer implemented | PENDING screenshot critique |
| Fog of war | Frontier volumes + distance fog implemented | PENDING screenshot critique |
| Lighting | Directional + explorer-local shader lighting implemented | PENDING screenshot critique |
| Doors / keys / traps / threats / exit | Physical world functions implemented | PENDING scenario evidence |
| AI uncertainty visible | Confidence affects posture; route affects camera look-ahead | PARTIAL — richer state animation not yet evidenced |
| Distinct room identity | Deterministic hybrid room archetypes implemented | PENDING screenshot variety evidence |
| Compact HUD | Desktop target reduced to ~12.5vw with clean-feed support | PENDING layout capture |
| VFX | Geometry/lighting/fog cues present | PARTIAL — reusable particle library not implemented |
| Audio | Existing public audio/captions preserved | PARTIAL — spatial audio expansion not implemented |
| Responsive browser source | Existing responsive contracts preserved | PENDING Playwright capture |
| Performance | Single-batch renderer + bounded DPR/view implemented | PENDING runtime measurements |
| Three quality passes | Pass 1 code implemented | PENDING screenshot critique/pass 2/pass 3 |
| 10 requested scenario screenshots | Not yet captured | INCOMPLETE |

## RED evidence
A new 2.5D contract was committed first. CI ran 443 tests: 440 passed and exactly the three new 2.5D contract tests failed against the legacy flat renderer. This established the expected RED state before production code changed.

## Completion rule
Update this report only after fresh branch-head CI and real running-game artifacts are inspected. Anything still lacking evidence must remain PARTIAL or INCOMPLETE.
