# SDD ledger — plan: docs/superpowers/plans/2026-10-30-city-traffic-gauntlet.md

## Identity and baseline

User request: apply the approved Game 11 Gauntlet prompt. Repository: `my-edutu/Ai_games`. Inspected base: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`. The catalogue contained Game 11, but no dedicated runtime was present. Source snapshot was retrieved through the authorized GitHub connector after ordinary Git network access failed.

## Rulings

- Execute now — the user explicitly said to apply the prompt and delegated approach; no repeated approval gate is necessary for reversible feature work.
- Parallel builders on disjoint paths — simulation, world art and UI share only documented interfaces; this fulfills the requested fan-out without shared-file races.
- Preserve commercial benchmark — failed external media retrieval is a blocker to a comparison win, not permission to lower the bar.
- Ultracode is unavailable — no callable tool or executable was found. Use the available independent builder/critic agents and report the limitation honestly.
- Use locally cached pinned dependencies — no CDN or live API is required to run the traffic game.

## Interface/preflight scan

| Tasks | Shared interface/file | Finding / ruling |
|---|---|---|
| Simulation / world | immutable vehicle, citizen and signal snapshots; yaw 0 = +Z | Contract supplied to both builders; world cannot mutate authority. |
| Simulation / UI | fixed-step create/step/snapshot/command methods | UI changes schedule only; speed does not change timestep. |
| World / UI | createWorld and update; root-owned renderer/light/camera | File ownership disjoint; roads centered at -72,-24,24,72. |
| UI / runtime | `/traffic/`, runtime and local vendor routes | Server/build owner is lead; UI uses local import map. |
| Simulation task | tests / implementation | Behavioral tests consume compiled production authority. |
| World task | art / review | Visual inspection is required; mesh count alone cannot pass. |
| UI task | controls / verification | Browser tests exercise real command effects and mobile layout. |
| Runtime task | static serving / evidence | References are pinned; comparison remains unverified until independent output review. |

## Active work

- Simulation builder: `traffic_sim_builder`.
- City art builder: `city_world_builder`.
- Interface builder: `traffic_ui_builder`.
- Reference retrieval: official Cities: Skylines II, Transport Fever 2 and Mini Motorways images retrieved and inspected; exact URLs and hashes pinned in `evidence/ai-city-traffic/reference-manifest.json`.
- Lead: runtime integration, baseline/test evidence, progress page, review cycles and remote handoff.

## Review loop evidence

- First independent authority review reproduced three P1 findings: pedestrian corner overlap, forged completion history accepted at restore, and an incoming reservation accepted under an opposing green. Builder fixes and fresh closure review are in progress.
- Initial running render reported 238 draw calls / 2,214,204 triangles and approximately 0.4 fps on the shared software device. After LOD and cached shadows, a real first frame reported 71 calls / 267,166 triangles. This is not an FPS result.
- Iteration-2 actual aerial, street, night and mobile captures completed. Fresh visual and interface critics are reviewing the pixels.
- Original repository baseline completed 120 passing and 3 failing test-file checks before feature changes; details are retained in evidence.

## Iterations 3–4

- Fresh visual critics preferred iteration 3 architecture over iteration 2 and iteration 4 vehicles over iteration 3 in anonymous A/B candidate reviews. Mapping was disclosed after each choice; pinned commercial references still lead.
- Architecture now has heritage, arcade, stepped terrace and commercial families plus a connected background district. Vehicles have class-specific bodies, wheel openings, framed glazing, lamps and original reflection materials. These are original runtime assets.
- Iteration 4 produced 14 real WebGL screenshots, including three citizens and three vehicle classes at close range. Source hashes remained stable, internal pixel ratio was 1, and no rendering errors were recorded. Still images do not prove animation, sound or sustained frame rate.
- Independent authority review closed original C1–C3. A new request-age fairness implementation passed fresh independent Q1 review: 2,190 allocations, 245 contested, zero older eligible bypasses; malformed restore and exact continuation checks remain green. One reviewed high-demand citizen still waits 227.4 seconds behind physical blockers. No bounded-wait guarantee is claimed.
- Stable iteration 3 passed all eight browser tests. UI4 then passed 40 independent mechanical checks and the mobile test, but the critic found selected junctions obscured by buildings. UI5 uses a near-vertical fit; actual iteration-4 phone captures are in fresh closure review. The integrated iteration-4 browser run is underway.
- Runtime review found partial builds falsely ready and capture failures falsely successful. Manifest/readability checks and strict evidence acceptance now have independent failure reproductions and closure evidence under `evidence/ai-city-traffic/runtime-closure/`.
- The actual original Git commit was subsequently fetched; its tree exactly matched the recovered source snapshot. Local feature history now descends from that genuine base. The remote feature branch exists; the cohesive evidence checkpoint and draft PR are being prepared.

## Iteration-4 checkpoint

- All eight integrated Playwright checks pass in 1.4 minutes; `evidence/ai-city-traffic/browser-tests-4.txt` retains output. This includes actual context loss and restored authority.
- Independent UI-08 visual closure passes on both phone sizes. At320px, the summary crops the farther approach tail, while the actual crossing and immediate approach remain visible.
- Runtime independent closure passes29 readiness scenarios and16 capture acceptance/cleanup scenarios, including actual unreadable assets. Eleven focused assertions pass; red evidence is preserved.
- The visual critic selected iteration4 vehicles blind, but matched-scale citizen comparison still favors the fixed reference. The next work is a staged complete citizen asset revision and a separately staged player-facing citizen inspection UI. Neither is claimed complete by this checkpoint.
