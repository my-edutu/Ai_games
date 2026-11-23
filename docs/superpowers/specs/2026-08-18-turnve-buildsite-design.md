# Turnve BuildSite — Design Specification

## Product

**Turnve BuildSite: Your First Day on Site** is a 10–15 minute browser-based construction internship simulation. The learner enters a stylized 3D site as a Construction Project Intern and prepares a ground-floor slab for a concrete pour by observing, documenting, communicating, escalating, and producing professional artifacts.

## Design authority

This specification codifies the approved master build brief supplied on 2026-08-18. When implementation details conflict, preserve: intern authority boundaries, safety/quality realism, deterministic consequences, evidence-backed assessment, pitch reliability, and offline/local fallback behavior.

## Experience loop

Receive task → explore → observe → gather evidence → interpret → speak to stakeholders → execute action → update artifact → experience consequence → receive feedback.

## Scenario

The site is constructing a fictional four-storey community innovation centre. The planned ground-floor slab pour is threatened by: incorrect fall protection, blocked emergency access, moisture-exposed cement, water near temporary electrical cable, incomplete formwork, outdated drawing Revision 02, unsigned consultant inspection, an early concrete truck, and approaching rain.

The learner may observe, inspect, compare documents, record evidence, ask questions, draft artifacts, recommend action, and escalate. The learner may not approve structural work, sign inspections, override HSE, alter engineering drawings, issue binding commercial instructions, operate dangerous machinery, or authorize the pour independently.

## Stages

1. Cinematic site introduction.
2. PPE induction.
3. Morning briefing and stakeholder introduction.
4. Guided first-person site walk with evidence capture.
5. Drawing Revision 02 vs Revision 03 comparison.
6. Pre-pour readiness checklist.
7. Pressure event: early truck + missing approval + rain + foreman pressure.
8. Consequences based on sequence, timing, evidence, communication, and authority awareness.
9. Artifact submission: safety observation, RFI, site diary, supervisor update; checklist optional fifth artifact.
10. Intern Readiness Report with cause/effect timeline.

## Stakeholders

- Maya Okafor — Assistant Site Manager: schedule, coordination, documentation, judgment.
- Ibrahim Bello — HSE Officer: safety, prevention, immediate reporting, compliance.
- Daniel Mensah — Site Foreman: productivity, practical constraints, coordination, idle-time pressure.
- Ada Nwosu — Quantity Surveyor: cost exposure, waiting charges, variations, records.
- Grace Adebayo — Consultant Site Inspector: quality, drawings, inspection evidence, approval procedure.
- Concrete Supplier Dispatcher: timing, waiting charges, communication, truck availability.

Each stakeholder tracks trust, responsiveness, frustration, information received, and outstanding requests. Legitimate trade-offs are intentional; one action may raise one stakeholder’s trust while reducing another’s satisfaction.

## Simulation state

Typed state tracks simulated time, stage, tasks, metrics, stakeholder trust, weather, inspection status, drawing status, truck status, hazard states, evidence, messages, artifacts, decisions, and consequences. Scenario definitions are data-driven and validated with Zod.

## Decision engine

UI dispatches typed learner actions. A separate reducer/rule engine updates state, evaluates rules, appends audit events, unlocks tasks, applies metric/stakeholder effects, and triggers visible consequences. Presentation code never writes authoritative state directly.

Critical rule example: authorizing/allowing a pour while `inspectionSigned === false` causes a major quality penalty, consultant trust loss, rework risk, and a critical judgment failure.

## Artifact impact

Artifacts are scored for completeness, accuracy, clarity, evidence use, tone, stakeholder appropriateness, timeliness, cross-artifact consistency, authority awareness, and next action. Artifact quality can accelerate or delay stakeholder response and affects final readiness.

## TARI

TARI (Turnve Applied Readiness Intelligence) is an adapter-based mentor. MVP ships deterministic local behavior and a mock demo mode. Optional external AI remains behind an environment-controlled adapter and is never required for gameplay or assessment.

## 3D environment

Procedural low-poly site includes gate/security, office, safety board, material storage, rebar/formwork zones, partially built structure, access route, open edge, pour zone, delivery/waiting area, crane zone, and rest area. Required props are represented with lightweight geometry; visual state changes show corrected hazards, truck arrival, weather, and task progress.

## Controls

Desktop priority: WASD/arrow movement, mouse look, E/click interaction, Tab tablet, Escape pause. Mobile uses touch-friendly controls as progressive enhancement. Guided Mode highlights interactions; Assessment Mode reduces guidance.

## UI

Professional construction-technology theme: deep navy, construction yellow, safety orange, slate, success green, alert red. HUD uses progressive disclosure. Site Tablet contains Today, Tasks, Site Map, Messages, Drawings, Inspections, Evidence, Artifacts, and Performance.

## Pitch mode

`?demo=true` defaults to Guided Mode, deterministic event timing, and presenter controls behind Shift+P: restart, pause time, advance event, trigger rain, trigger truck, unlock inspections, apply recommended action sequence, open report, reset local state. The presenter cannot become permanently stuck.

## Assessment

0–100 metrics: Safety Awareness, Quality Awareness, Communication, Documentation, Problem Identification, Escalation Judgment, Schedule Awareness, Cost Awareness, Stakeholder Management, Professional Conduct.

Readiness bands:
- 0–39 Requires Foundation Training
- 40–59 Developing Intern
- 60–74 Supervised Site Ready
- 75–89 Strong Intern Readiness
- 90–100 High-Potential Entry-Level Candidate

Score uses issues discovered/classified, evidence, escalation speed, stakeholder choice, communication, artifacts, consistency, action sequence, authority boundaries, and consequences—not only final choices.

## Architecture

A standalone Vite workspace lives at `games/turnve-buildsite/` so React/Three dependencies do not affect the root headless-games build. Runtime boundaries:

- `src/simulation/` — types, scenario, rules, scoring.
- `src/state/` — Zustand authoritative store and persistence.
- `src/three/` — R3F world, player, weather, truck, inspection points.
- `src/ui/` — HUD, tablet, induction, artifacts, report, pitch controls.
- `src/ai/` — TARI adapters.

## Verification gates

Each phase requires its focused tests, typecheck/build, runtime smoke check, visual/UX critique, realism critique, P0/P1 closure, and regression review. GitHub or local verification evidence must be recorded; inability to execute verification is a blocker to production-readiness claims, not a reason to fake evidence.
