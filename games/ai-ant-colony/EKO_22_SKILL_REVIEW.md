# Eko 22-Skill Critical Review — AI Ant Colony / Ecosystem

**Review target:** `agent/ant-colony-2-5d-rebuild`  
**Reference discipline:** Eko Street Run's 22-skill review catalogue and experience standard, adapted to a spectator-first autonomous ecosystem.  
**Scope boundary:** presentation, readability, camera, graphics, UI, game feel, reliability, and production evidence. The authoritative colony simulation is not redesigned by this review.

## Stop-ship verdict before this pass

**NOT READY.** The branch's authoritative build/test path is healthy, but the latest browser evidence has one stop-ship presentation failure: at **640×360 phone landscape**, the primary objective is hidden by the small-viewport CSS. A living-world stream must preserve objective comprehension while keeping the world dominant.

The second critical weakness is qualitative rather than a failing test: the renderer contains strong biological/world systems, but camera framing is mostly target-centering plus zoom. Surface/soil/chamber layers therefore risk reading as a sophisticated visualization rather than a premium 2.5D living world.

## Finding contract

### F1 — Primary objective disappears in phone landscape
**Moment:** 640×360 spectator entry.  
**Expected experience:** within seconds, viewer sees the colony, understands the objective/progress, and can read the live caption.  
**Observed experience:** the base small-viewport rule hides `.goal-panel`, including `data-testid="objective"`.  
**Why it fails:** the interface protects screen space by removing the single most important piece of comprehension.  
**Severity:** STOP-SHIP.  
**Exact improvement:** keep a compact objective/progress row; remove lower-value metric cards and threat detail instead. Reposition headline and captions into remaining safe areas.  
**Verification:** Playwright phone-landscape test passes with objective, canvas, captions, and zero horizontal overflow.

### F2 — Camera lacks authored composition
**Moment:** predator, combat, foraging, brood, excavation, milestone, queen danger.  
**Expected experience:** documentary framing preserves causal context and intentionally places subjects in frame.  
**Observed experience:** shots mostly center one target and apply a fixed zoom. Edge targets can lose context and fights do not frame both participants.  
**Why it fails:** correct focus is not the same thing as good composition.  
**Severity:** MAJOR.  
**Exact improvement:** midpoint framing for related entities, shot-specific composition offsets, safe world bounds, longer dwell/cooldown, reduced-motion ceiling, and context-preserving zoom profiles.  
**Verification:** source/unit contracts preserve bounded director behavior; real browser screenshots show subject plus cause/context without exposed outside-world voids.

### F3 — Cross-section has layers but insufficient volumetric separation
**Moment:** ordinary colony overview and underground chamber shots.  
**Expected experience:** surface, cut-earth, chambers and depth read as a physical miniature ecosystem.  
**Observed experience:** soil/roots/tunnels are rich but mostly share one flat render plane.  
**Why it fails:** visual layering alone does not create a convincing 2.5D volume hierarchy.  
**Severity:** MAJOR.  
**Exact improvement:** deterministic presentation-only cinematic layer for surface horizon light, chamber bounce light, queen focal warmth, soil motes and shot-aware vignette.  
**Verification:** HUD-hidden screenshots must still read as a living cross-section rather than dots/lines on a scientific diagram.

### F4 — HUD still leans toward dashboard styling
**Moment:** ordinary desktop observation.  
**Expected experience:** 90% living world / 10% UI.  
**Observed experience:** compact HUD is much better than the old dashboard, but resource metrics remain card-like and visually subdivided.  
**Why it fails:** repeated mini-cards compete with the world and imply analytics-first presentation.  
**Severity:** MODERATE.  
**Exact improvement:** reduce card chrome into a quiet metric strip, softer glass, fewer borders, stronger objective hierarchy.  
**Verification:** world remains dominant at desktop and landscape phone sizes; clean feed unchanged.

## 22-skill review matrix

| # | Eko skill | Ant Colony review | Action in this pass |
|---|---|---|---|
| 1 | game-creative-direction | Living-world promise is strong; depth/composition still need premium authorship. | Add cinematic cross-section depth and stronger frame hierarchy. |
| 2 | gameplay-progression | Ascension, population, brood and milestones are visible, but small-screen objective was removed. | Preserve objective/progress at every supported viewport. |
| 3 | difficulty-failure-balancing | Threat/queen danger are causally represented without hidden rescue/kill logic. | Keep danger emphasis presentation-only; no outcome mutation. |
| 4 | procedural-generation | World dressing is deterministic and bounded; no ambient random generation is required for polish. | New cosmetic depth uses deterministic hashes and fixed budgets only. |
| 5 | game-economy-rewards | Food/brood/tunnel growth are readable but should not become finance-dashboard UI. | De-emphasize metric-card chrome; keep resources secondary to world. |
| 6 | platformer-experience-review | Adapted moment-by-moment review finds phone objective loss and weak camera composition. | Fix stop-ship and author shot composition. |
| 7 | game-architecture | Simulation/presentation separation is sound. | Keep all new work downstream of public snapshots. |
| 8 | autonomous-agent-design | Roles/tasks are visible through morphology and behavior. | Camera follows real carriers/fighters/diggers rather than synthetic events. |
| 9 | deterministic-simulation | Authority and replay guarantees are already green. | Cosmetic layer cannot touch state and uses deterministic decoration. |
| 10 | game-physics | No physics/gameplay authority should be changed in a visual pass. | No physics changes. |
| 11 | game-audio | Bounded semantic soundscape exists; full ambience/music remains partial. | No false completion claim; retain as follow-up acceptance item. |
| 12 | game-feel-vfx | Excavation/weather/particles exist; focal lighting can improve impact without spam. | Add bounded environmental/focal light, not constant per-ant effects. |
| 13 | livestream-hud | Desktop is compact; phone rule currently removes primary progress. | Rebuild phone hierarchy and reduce desktop card chrome. |
| 14 | viewer-retention | Documentary shots exist but switch/composition can feel mechanical. | Longer dwell, safer framing, shot-specific profiles. |
| 15 | audience-interaction | Viewer influence remains bounded and cannot force outcomes. | No changes to authority or voting boundaries. |
| 16 | crowd-moderation | No unbounded public text is introduced by visual polish. | No change. |
| 17 | security-privacy | Browser tests already verify seed/config/influence internals are absent. | Cinematic layer reads only the existing privacy-safe snapshot. |
| 18 | long-running-reliability | Existing particles/history are bounded. | New chamber lights and soil motes have fixed upper budgets. |
| 19 | performance-optimization | WebGL LOD exists; extra polish must stay cheap. | One transparent 2D layer, capped DPR, capped chamber lights/motes, no asset churn. |
| 20 | game-analytics-experimentation | Render metrics exist for LOD/particles/draw calls. | Add cinematic-layer/shot counters to render metrics. |
| 21 | simulation-qa | Core CI/unit suite is green; browser evidence has one failure. | Use existing Playwright failure as RED gate, then rerun full branch workflow. |
| 22 | production-readiness-review | Not production-ready while browser gate fails and screenshot critique is incomplete. | Require green browser capture and real screenshot review before COMPLETE. |

## Acceptance focus after implementation

The pass is successful only if:
- phone-landscape objective/caption/world visibility passes;
- desktop and clean-feed remain intact;
- camera never exposes invalid outside-world framing;
- combat/predator/foraging shots preserve causal context;
- chamber/surface depth is deterministic and bounded;
- the HUD is visually quieter than the world;
- the new presentation layer cannot mutate colony state;
- CI and real screenshot evidence are green before status is upgraded.
