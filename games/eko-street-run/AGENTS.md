# AGENTS.md — Eko Run

## Scope

These instructions apply to all work under `games/eko-street-run/`. They supplement the repository root `AGENTS.md`; higher-precedence legal, safety, architecture, determinism, and production-readiness rules still apply.

## Mandatory Skill Gate

Before design, implementation, coding, changing gameplay, tuning, art integration, animation, camera work, level work, or review, the agent **must load** the Eko Run core skill set:

- `game-creative-direction`
- `game-architecture`
- `game-physics`
- `game-feel-vfx`
- `performance-optimization`
- `platformer-experience-review`

Load additional specialist skills whenever their domain is touched:

- `gameplay-progression` for level rhythm, milestones, difficulty curves, rewards, and route progression;
- `deterministic-simulation` for authoritative ticks, replay, seeded randomness, and event ordering;
- `autonomous-agent-design` for AI/autoplay behaviour;
- `procedural-generation` for authored Lagos route/world variation;
- `game-audio` for music, ambience, impacts, vehicle sound, voice, and accessibility cues;
- `livestream-hud` and `viewer-retention` for spectator/broadcast surfaces;
- `simulation-qa` for seeded campaigns and regression coverage;
- `production-readiness-review` before any launch/readiness claim.

Skipping the core set because a change appears “visual only,” “small,” “just content,” or “already reviewed” is not permitted. Visual, camera, animation, performance, and world changes can alter control readability and therefore require the experience gate.

## Experience-First Rule

Eko Run is not approved because Lagos assets look impressive. The build must remain an excellent platformer when theme and branding are mentally removed, and it must remain recognizably Eko Run when the title is hidden.

Every meaningful vertical slice must be reviewed with `platformer-experience-review` against `docs/EKO_EXPERIENCE_STANDARD.md`.

## Phase Gate

A phase cannot pass until:

1. authoritative gameplay behaviour has focused tests and deterministic evidence where applicable;
2. representative play is reviewed at normal speed and slow motion;
3. movement, animation, camera, hazard readability/fairness, visual hierarchy, pacing, Lagos identity, accessibility/mobile, and performance are scored;
4. each material defect uses the required finding contract;
5. every stop-ship defect is resolved or the phase remains failed;
6. regression evidence is recorded for fixed experience defects.

No aggregate score overrides a stop-ship finding.

## Eko Run Non-Negotiables

- Lagos authenticity must come from behaviour, environment, spatial detail, soundscape, movement situations, and authored cultural reference—not generic “African” decoration.
- Yoruba, Igbo, Hausa, and contemporary outfits must preserve distinct respectful silhouettes without changing collision truth or creating readability problems.
- Danfo, Molue-style buses, potholes, drains, crowds, roadworks, flooding, market activity, and street incidents are gameplay systems only when their cues and response windows are fair.
- Crowd/fight scenes remain non-graphic environmental hazards; they must not target protected groups, identifiable real people, or become ethnic caricatures.
- Presentation consumes render snapshots and semantic events; it does not mutate authoritative state.
- Performance fallback lowers visual density before it weakens controls, collision, camera information, or obstacle cues.

## Review Output

Use this order for each experience review:

1. stop-ship verdict;
2. representative moments reviewed;
3. findings using `Moment → Expected experience → Observed experience → Why → Severity → Exact improvement → Verification test`;
4. 100-point score breakdown;
5. Lagos identity review;
6. mobile/low-tier performance evidence;
7. regressions required before the phase gate can pass.
