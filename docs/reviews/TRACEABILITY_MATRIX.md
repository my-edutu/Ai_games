# Catalogue Foundation Traceability Matrix

| User Goal | Repository Evidence | Status |
|---|---|---|
| One monorepo with 12 AI games | `games/` and `docs/catalogue/GAME_CATALOGUE.md` | Complete design |
| Expert reusable game skills | `skills/*/SKILL.md` and `skills/tests/` | 21 candidate skills authored |
| Masterpiece architecture, physics, audio, visuals and AI | architecture and platform docs plus specialist skills | Complete design |
| PRD for every game | `games/*/PRD.md` | Complete |
| Several MD files per game | nine core documents per game | Complete |
| Phase-by-phase implementation | six files under every `games/*/phases/` | Complete |
| Self-playing, winning or losing, and automatic restart | every PRD, game design, Phase 1 and Phase 3 | Specified; not implemented |
| Long-running livestream reliability | readiness standard, watchdog and game Phase 5 or 6 | Specified; not implemented |
| Viewer votes, gifts and items | audience gateway, Event Director, policy and game interaction docs | Specified; not implemented |
| No guaranteed paid outcome | monetization standard and every interaction PRD | Complete policy |
| Shared platform instead of 12 unrelated games | platform architecture, contracts and roadmap | Complete design |
| Chat vs AI shared identity | `docs/platform/CHAT_VS_AI_MODE.md` and game interaction docs | Complete design |
| Ralph loop until phase completion | `docs/roadmap/RALPH_LOOP_EXECUTION.md`, phase checklist and issue template | Complete process |
| Production-readiness honesty | readiness standard, game readiness docs and foundation review | Complete gate; no R5 claims |

## Per-Game File Contract

Every game path contains the expected design categories:

`README`, `PRD`, `GAME_DESIGN`, `AI_SYSTEM`, `VIEWER_INTERACTION`, `AUDIO_VISUAL`, `TECHNICAL_ARCHITECTURE`, `TESTING_STRATEGY`, `PRODUCTION_READINESS`, plus Phase 1 through Phase 6.

Runtime traceability will extend this matrix with implementation paths, test commands and evidence artefacts during each game phase.
