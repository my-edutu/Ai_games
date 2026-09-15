# AI Zombie Survival

Autonomous deterministic 2.5D survival game for long-form livestream play. The authoritative fixed-step simulation drives survivor decisions, zombie hordes, barricades, scavenging, infection, resources, day/night, weather state, camera events, and bounded viewer influence. The browser renderer presents that state as an isometric ruined city rather than as a dashboard.

## Run

```bash
npm run test
npm run serve
```

Open `http://127.0.0.1:4177/web/index.html` in a normal local browser. Controls: **H** toggles HUD, **R** restarts the deterministic run, **Space** pauses presentation/simulation.

## Integrity

Presentation never decides outcomes. Viewer events are bounded and audited. Determinism is covered by tests. The game is isolated under `games/ai-zombie-survival/**` except for its dedicated implementation plan under `docs/superpowers/plans/`.
