# Marble Survival Tournament — 22-Skill Review Matrix

This review applies the full `skills/README.md` specialist catalogue used by Eko Street Run. It is a gate, not a scorecard: an open P0/P1 blocks a pass even when the aggregate experience looks strong.

## Review rules

- Authority, determinism and architecture are reviewed before presentation.
- Presentation may consume authority but may not mutate or reinterpret outcomes.
- A screenshot that is technically correct but visually fails to explain the competition is still a failure.
- Unsupported mechanics remain explicitly incomplete rather than simulated cosmetically and called physics.
- Production readiness is evidence-based; this document does not grant R5.

| # | Skill | Current verdict | Severity | Evidence / action |
|---|---|---|---|---|
| 1 | game-creative-direction | IMPROVED | P2 | Arena-first hierarchy added. Tournament identity is coherent, but arenas still need stronger set-piece differentiation. |
| 2 | gameplay-progression | PASS-CANDIDATE | P2 | Five-round elimination ladder, remaining/qualified/cut-line state and champion outcome are visible. Continue strengthening between-round escalation. |
| 3 | difficulty-failure-balancing | PASS-CANDIDATE | P2 | Deterministic hazards, recovery shields and typed elimination causes exist. Continue statistical fairness review across larger seed corpora. |
| 4 | procedural-generation | PASS-CANDIDATE | P2 | Constructive generation, collider/contact budgets and safe-lane validation are tested. Archive failing seeds if future generators expand. |
| 5 | game-economy-rewards | BLOCKED-BY-SCOPE | P2 | No monetized reward economy is active. Viewer influence remains disabled rather than pay-to-win. Do not activate without deterministic bounded effects. |
| 6 | platformer-experience-review | IMPROVED | P1→P2 | Screenshot review found finals visually collapsing into an empty track because stale camera/event history survived tournament rollover. Regression tests and fixes added. |
| 7 | game-architecture | PASS-CANDIDATE | P1 gate cleared | Authority and presentation remain separated. WebGL renderer consumes public snapshots; no client adjudication. |
| 8 | autonomous-agent-design | PASS-CANDIDATE | P2 | Marble intents/confidence derive from deterministic authority. Spectator UI must not claim strategy beyond exported state. |
| 9 | deterministic-simulation | PASS-CANDIDATE | P1 gate cleared | Fixed-step/fixed-point authority, replay checksums, twin-run tests and nondeterminism scanning exist. |
| 10 | game-physics | PARTIAL | P2 | Ground-plane collision solver is authoritative and tested. Vertical gravity, ramps, jumps, pendulums and destructible rigid bodies are NOT implemented and must not be claimed. |
| 11 | game-audio | NEEDS WORK | P2 | Basic browser cues exist, but semantic cue budgeting, richer collision/hazard layers, captions and ducking still need a dedicated pass. |
| 12 | game-feel-vfx | IMPROVED | P2 | WebGL contact shadows and bounded event VFX exist. Need stronger qualifier/elimination/final-round visual grammar without obscuring marbles. |
| 13 | livestream-hud | IMPROVED | P1→P2 | Permanent 17vw sidebar/lower dashboard replaced by translucent broadcast overlays; arena now dominates the frame. Mobile overlay budget retained. |
| 14 | viewer-retention | NEEDS WORK | P2 | Round escalation exists, but visual rhythm between arena archetypes still risks sameness. Add stronger set-piece signatures and measured event-density targets. |
| 15 | audience-interaction | SAFE-BLOCKED | P2 | `/api/influence` returns unavailable until a deterministic authority route exists. Zero-audience game remains complete. |
| 16 | crowd-moderation | PASS-CANDIDATE | P3 | No free-text gameplay input. Future interaction catalogue uses fixed choices only. |
| 17 | security-privacy | PASS-CANDIDATE | P2 | Presentation snapshot is sanitized, operator commands authenticated, seeds/tokens excluded, CSP/security headers present. Continue dependency/security review before release. |
| 18 | long-running-reliability | NEEDS EVIDENCE | P2 | Restart/replay behavior is tested, but true multi-hour soak, memory growth and browser recovery evidence are still missing. |
| 19 | performance-optimization | NEEDS EVIDENCE | P2 | Quality/DPR controls and bounded meshes exist. p50/p95/p99 frame time, draw-call, memory and GPU evidence are not yet measured. |
| 20 | game-analytics-experimentation | PARTIAL | P2 | Authoritative events expose round, elimination, qualification and champion signals. A formal retention/fairness experiment schema is still missing. |
| 21 | simulation-qa | IMPROVED | P1 gate active | Unit/property/replay/browser tests exist. New regressions cover stale cross-tournament camera/event state. Visual evidence is captured from the real runtime. |
| 22 | production-readiness-review | NOT R5 | P1 gate active | Candidate can only advance after current CI, browser evidence, soak/performance measurements and independent release evidence are green. |

## Pass 1 findings and fixes

### P1 — stale tournament presentation state

Observed evidence: later screenshots could show `Champion camera` during a fresh race or frame an empty track while the authority was healthy. Root cause was presentation event history surviving tournament rollover and camera event selection accepting stale/future-tick events.

Fixes:

- camera event reactions now require a bounded fresh event window;
- champion framing comes from current authoritative champion/lifecycle state, not historical champion events;
- presentation snapshots discard event history before the latest `tournament-restarted` boundary;
- future-tick events are excluded from the current presentation snapshot;
- regression tests cover cross-tournament camera hijack and event leakage.

### P1 — dashboard dominated the game

Observed evidence: a permanent standings sidebar plus two lower panels reduced arena dominance and made the build read like a telemetry dashboard.

Fixes:

- added `data-layout="arena-first"` broadcast composition;
- standings are now a translucent overlay instead of a layout column;
- official events and disabled audience-influence status are lightweight lower overlays;
- mobile reduces overlay density to preserve the live game view;
- clean-feed mode continues to remove all overlays.

## Pass 2 priorities

1. Re-run browser evidence after the rollover/camera fix and inspect every capture.
2. Strengthen arena archetype signatures and final-round spectacle only where screenshots prove the need.
3. Improve semantic audio/VFX without creating false gameplay cues.
4. Add measured long-run and frame-time evidence.
5. Keep viewer influence disabled until deterministic bounded authority support exists.

## Stop-ship status

No authority rewrite is requested by this review. The current stop-ship condition is evidence-based: if fresh CI screenshots still lose active marbles, mis-frame finals, or shared browser CI remains timing-dependent, the visual rebuild remains blocked regardless of unit-test score.
