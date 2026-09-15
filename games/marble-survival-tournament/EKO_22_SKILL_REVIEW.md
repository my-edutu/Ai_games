# Marble Survival Tournament — Eko 22-Skill Review

Review basis: the complete `skills/` catalogue used by Eko Street Run. This is an adversarial implementation review, not a production-readiness declaration.

Status vocabulary:
- **PASS** — implementation evidence exists in this branch.
- **PARTIAL** — useful implementation exists but a load-bearing gap remains.
- **NOT PROVEN** — implementation may exist, but runtime/capture/soak evidence has not yet passed.
- **MISSING** — required capability is not implemented.

## Review matrix

| # | Skill | Status | Marble finding | Improvement / gate |
|---|---|---|---|---|
| 1 | game-creative-direction | PARTIAL | Five arenas now have distinct material/lighting identities, but some themes are still dressing over similar topology. | Increase mechanic-led theme identity; prove silhouettes/readability in real captures. |
| 2 | gameplay-progression | PASS | 32→16→8→4→2→1 bracket, round transitions, qualification and champion state are authoritative. | Preserve bracket while tuning round-specific dramatic beats. |
| 3 | difficulty-failure-balancing | PARTIAL | Difficulty rises through bumpers, sweepers, hazards and later-round density, but distribution evidence is thin. | Add seeded outcome/failure distribution campaign before balance claims. |
| 4 | procedural-generation | PARTIAL | Seeded arenas validate bounds, lanes and contact budgets; topology variety within an archetype remains limited. | Add diversity metrics and more mechanic modules without invalid seeds. |
| 5 | game-economy-rewards | PASS / N/A | No spendable economy is required for the current tournament; records are separated from assisted influence. | Do not add currency unless it creates meaningful non-pay-to-win choices. |
| 6 | platformer-experience-review | PARTIAL | Spatial readability, camera and collision spectacle improved; anticipation and hazard telegraphing still need capture proof. | Add visible force-zone/sweeper telegraphs and review at stream/mobile scale. |
| 7 | game-architecture | PASS | Deterministic authority is separated from immutable presentation snapshots; WebGL cannot choose winners. | Keep renderer/audio/provider failures outside authority. |
| 8 | autonomous-agent-design | PARTIAL | Agents are local and deterministic, but the recovered policy underuses traits and upcoming geometry. | Add bounded sweeper anticipation and archetype-specific risk routing; test determinism. |
| 9 | deterministic-simulation | PASS | Seeded fixed-step state, checksums, named RNG and no renderer feedback. | CI now scans Marble authority for ambient nondeterminism. |
| 10 | game-physics | PARTIAL | Circle collisions, restitution, moving sweepers, bumpers, wind, substeps and contact caps are authoritative. Vertical 3D gravity/surface-material physics are not. | Improve contact mechanics only with deterministic/replay evidence; do not fake full rigid-body physics. |
| 11 | game-audio | PARTIAL | Semantic qualification/elimination/recovery/champion tones exist; no measured spatial rolling/impact mix yet. | Add bounded contact audio, bus limits and capture-chain measurement. |
| 12 | game-feel-vfx | PARTIAL | Event-driven impact/elimination/recovery/champion VFX, camera impulse, shadows and rolling are implemented. | Validate density, camera comfort and low-tier readability in captures. |
| 13 | livestream-hud | PASS candidate | HUD prioritizes round, remaining, qualification and standings; clean feed exists. | Browser/mobile/compression capture remains required for final pass. |
| 14 | viewer-retention | PARTIAL | Elimination bracket naturally creates escalation and late-round stakes. | Add measured dramatic-pattern telemetry rather than forced outcomes. |
| 15 | audience-interaction | PASS for current disabled mode | Influence endpoint truthfully rejects effects until deterministic authority supports them. | Never enable paid/free influence by mutating render state or guaranteeing results. |
| 16 | crowd-moderation | PASS / dormant | No raw viewer text reaches game/render state while influence is disabled. | Re-review before enabling identity/text/provider inputs. |
| 17 | security-privacy | PASS candidate | Strict CSP, bounded JSON, operator token check, sanitized snapshots and no seeds/tokens in public state. | Add dependency/security review before production promotion. |
| 18 | long-running-reliability | PARTIAL | Health endpoint, bounded event history, authoritative fallback and 2D presentation fallback exist. | Add Marble-specific soak, restore, renderer failure and output-freeze evidence. |
| 19 | performance-optimization | NOT PROVEN | Quality tiers, DPR caps, effect pooling and bounded entity counts exist. | Measure frame p50/p95/p99, draw calls, heap/GPU slope and low-tier headroom. |
| 20 | game-analytics-experimentation | PARTIAL | Deterministic signals and metrics endpoint exist, but no versioned balance experiment report yet. | Add seed-corpus distributions and candidate-vs-baseline comparison. |
| 21 | simulation-qa | PARTIAL→improving | Authority determinism, arena validity, presentation separation and browser capture tests exist. | Marble is now a first-class CI gate; retain failing seeds and upload visual evidence. |
| 22 | production-readiness-review | FAIL for R5 / candidate below R5 | Build/tests are not equivalent to unattended production proof. | Require green Marble CI, capture review, performance evidence, soak/canary, rollback and independent review. |

## Highest-priority findings

### P1 — Browser renderer asset contract
The initial Three.js browser test failed because the runtime attempted to serve `three.module.min.js`, which Three.js r186 does not ship. The authoritative runtime itself remained healthy. The server has been corrected to source the shipped `three.module.js` build while preserving the stable same-origin public module URL. Marble CI now runs the stream self-test and visual contract directly.

### P1 — Autonomous decision variety
The recovered action policy routes nearly every competitor toward one of two safe lanes and does not anticipate moving sweepers. This makes trait differences less visible than the data model promises. A test-first improvement is in progress for deterministic sweeper avoidance and bounded sprinter risk routing.

### P2 — Hazard communication
Wind zones affect authority but are not yet clearly represented as force fields/fans in the 3D presentation. This is a fairness/readability gap, not merely decoration.

### P2 — Audio hierarchy
Current semantic tones are useful fallback cues, but contact density, rolling loops, spatialization, voice limits, ducking and loudness have not been measured.

### P2 — Procedural variety
Arena generation is safe and deterministic but does not yet demonstrate sufficient within-archetype layout diversity. Diversity must be increased without sacrificing guaranteed safe routes or contact budgets.

### P2 — Performance evidence
Quality tiers are implementation, not proof. Final acceptance requires real browser measurements across overview, contact storm, late tournament, champion VFX and clean feed.

## Changes made because of this review

1. Fixed the Three.js r186 module packaging contract discovered by browser CI.
2. Hardened browser evidence timeouts, champion predicates and renderer diagnostics.
3. Added Marble authority tests, stream-host self-test, visual-contract verification and nondeterminism scan to main CI.
4. Added upload of real Marble visual capture evidence from Playwright.
5. Added failing autonomous-agent tests before changing agent behavior.

## Next implementation order

1. Make autonomous-agent tests green with deterministic geometry-aware behavior.
2. Re-run the full authority and browser suite and inspect generated screenshots.
3. Fix visual/readability defects found in captures before adding more spectacle.
4. Expose and telegraph authoritative wind zones.
5. Improve bounded semantic audio and collision-density handling.
6. Add seeded balance/diversity/performance campaigns.
7. Re-run all 22 skill gates and update this file with evidence links and remaining blockers.

No R5 or production-ready claim is permitted until the production-readiness skill's external evidence gates are satisfied.
