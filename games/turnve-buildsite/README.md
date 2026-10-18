# Turnve BuildSite — Your First Day on Site

A browser-based 3D construction internship simulation for Turnve.

## Scenario

You are a Construction Project Intern helping prepare a ground-floor structural slab for a concrete pour. Inspect the site, identify hazards, compare drawing revisions, complete readiness checks, communicate with stakeholders, respond to an early truck and approaching rain, create professional artifacts, and finish with an Intern Readiness Report.

## Workspace commands

```bash
cd games/turnve-buildsite
npm install
npm run dev
npm test
npm run build
```

## Controls

- WASD / arrows — move
- Mouse — look
- E / click — inspect nearby item
- Tab — Site Tablet
- Escape — pause/close panel
- Shift + P — presenter panel

## Pitch demo

Open `/?demo=true`. Guided Mode is enabled and presenter recovery controls are available with Shift+P.

### Seven-minute sequence

1. Open the cinematic site.
2. Complete PPE induction.
3. Open the Site Tablet.
4. Inspect a visible hazard and capture evidence.
5. Compare Drawing Revision 02 and Revision 03.
6. Trigger/enter the concrete-truck crisis.
7. Escalate missing inspection and update the supplier.
8. Complete a concise supervisor update.
9. Open the Intern Readiness Report.

Pitch framing: Turnve evaluates what the learner observed, who they contacted, what evidence they collected, how they documented work, and what consequences followed—not just a multiple-choice answer.

## Architecture

See `TECHNICAL_ARCHITECTURE.md` and the approved design at `../../docs/superpowers/specs/2026-08-18-turnve-buildsite-design.md`.

## Scenario authoring

Scenario facts, hazards, stakeholders, task conditions, consequence rules, and rubric weights are data-driven under `src/simulation/`. Add a new scenario by creating a scenario definition and plugging it into the same reducer/store boundary; do not encode scenario rules inside React components.

## Known verification limitation

This branch must not claim pitch or production readiness until its exact commit has an executed package install, test run, production build, and browser flow. GitHub Actions or a connected development environment may supply that evidence.
