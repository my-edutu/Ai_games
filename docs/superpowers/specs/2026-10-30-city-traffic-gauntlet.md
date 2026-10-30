# AI City Traffic Experiment — Gauntlet specification

## User goal and authority

The user approved applying the Gauntlet prompt to Game 11 in `my-edutu/Ai_games`: a complete autonomous 3D traffic game, fully modeled and animated people and vehicles, a finished city, sound and polished UI. Builders and separate critics iterate on independently judgeable pieces and the integrated running game. The user delegates technical approach and decomposition. There is no predetermined review-round count.

The commercial bar is representative real Cities: Skylines II gameplay at comparable aerial/street views, resolution, city scale and traffic density. Transport Fever 2 is a supporting vehicle/infrastructure reference; Mini Motorways supports interface readability. Actual official gameplay screenshots have now been retrieved, visually inspected and pinned with provenance in `evidence/ai-city-traffic/reference-manifest.json`. Independent direct comparison currently records **REFERENCE LEADS**. Fresh blind comparisons prefer the revised architecture and vehicles to their predecessors; this does not establish a commercial win. Code tests and local inspection alone cannot establish that win.

## Viewer promise

Watch a city keep moving as autonomous drivers and pedestrians negotiate demand, signals and a road incident. Viewers can understand rising queues, see signal-policy choices take effect and follow individual vehicles through the district. This implementation exposes local controls; it does not claim live audience-provider integration.

## Observable requirements

- Connected roads, seeded trips, replenished vehicles, purposeful citizens, meaningful signals, safe queues and crossings.
- One fixed-step authority used by browser and headless tests. Immutable snapshots feed presentation. Cosmetic time never changes traffic outcomes.
- A coherent coastal city: dressed blocks, distinct buildings, civic greenery, sidewalks, markings, crossings, waterfront, lights and street furniture.
- Recognizable vehicle classes with modeled cabins, wheels, glazing and lamps; articulated citizens with visible gait and appearance variation.
- Actual functioning pause/speed, camera views, demand, signal policy, incident, day/night, flow overlay and opt-in sound controls. HUD values derive from simulation state.
- Accessible native controls, keyboard support, visible focus, reduced-motion behavior, mobile layout, and recoverable startup/WebGL failure.
- A separate live progress page containing dated captures, reference provenance, reviewer findings, next gaps and explicit benchmark status.
- Preserve other games and repository rules. Do not claim R5/production readiness or commercial parity without their evidence.

## Approach chosen by the lead

Use the repository's pinned Three.js 0.186.0 with locally served assets. Implement traffic in strict TypeScript, compile the same authority for Node and browser ES modules, and keep rendering and local controls behind its snapshot/command boundary. Use the existing Node HTTP-server convention with a dedicated `/traffic/` route. This avoids duplicating traffic rules or adding an unrelated application framework.

An isolated feature branch holds all changes. Separate builders own simulation, 3D world and interface; critics receive requirements and inspect actual output independently. Code reviews do not substitute for running-game inspection. Changes follow the largest supported finding; unfetched references and unavailable tools remain recorded blockers.

## Completion evidence

Focused deterministic/invariant tests, comparison of saved/restored state, an integrated browser run with real interactions, desktop and mobile captures, and an independent review are required for implementation claims. Every benchmark win additionally requires pinned external media and a direct fair comparison. Production deployment, provider integration, real-device performance and long-running operational evidence are separate unfulfilled gates until tested.
