# AI Civilization — Living Tiny Kingdom Presentation Design

**Date:** 2026-09-07  
**Game:** Game 5 — AI Civilization / Tiny Kingdom  
**Implementation branch:** `agent/game-05-living-kingdom`  
**Baseline:** `85dcbf3af3848b7faf2d2578107f1b04560b7e26` (`feat/game-05-ai-civilization`)  
**Parent design:** `docs/superpowers/specs/2026-08-17-ai-civilization-tiny-kingdom-design.md`

## 1. Goal

Turn the current flat tile/dashboard presentation into a coherent miniature settlement that visibly communicates architecture, land use, production, pressure, and dynasty state while preserving the existing deterministic cohort simulation exactly.

The intended reaction is: **“This looks like a small civilisation living and working, not coloured objects moving around a dashboard.”**

## 2. Verified starting point

The authoritative Game 5 implementation lives on `feat/game-05-ai-civilization`, not `main`. The verified baseline is commit `85dcbf3af3848b7faf2d2578107f1b04560b7e26`.

The current architecture already separates authoritative state/rules from immutable presentation snapshots. Population is cohort-based; there are no individual citizen entities, job paths, roads, carts, collision bodies, or transport transactions. Resource production is resolved directly by authoritative daily economy rules.

The current browser map renders every building as the same beige block. The latest `ux-v2.css` is referenced by the page but is absent from the stream server's static allowlist, so that revision is not served by the production-like browser source.

Local checkout execution is unavailable in the current agent environment because direct GitHub DNS/network access is unavailable. Runtime verification will therefore use repository CI/Actions where available. Any evidence not actually executed remains explicitly unverified.

## 3. Architecture decision

### Selected: truthful 2.5D DOM/CSS presentation on immutable snapshot data

Retain the current renderer and browser source. Enrich the public render snapshot with presentation-only descriptors derived deterministically from authoritative building, terrain, economy, population, and scene state. Render those descriptors with bounded DOM/CSS layers.

This approach is selected because it:

- preserves the existing deterministic simulation, saves, replay checksums, and rule timing;
- does not introduce a second physics or pathfinding model;
- works without external assets or network requests;
- can degrade cleanly on low-end devices;
- remains inspectable and accessible in the existing browser source;
- avoids a fragile renderer migration for a 12×8 to 16×10 bounded world.

### Rejected: per-citizen simulation

The approved game architecture explicitly models population as cohorts. Adding authoritative individual citizens, jobs, transport, pathfinding, congestion, collision, or inventory carrying would be a mechanics rewrite, not visual polish. It would change replay, save, performance, and economy semantics and is outside this presentation upgrade.

### Rejected: decorative fake transport

Workers will not walk resources between buildings, carry inventory, or imply physical transfers because the economy does not currently model those transactions. Representative labour stays local to the building whose real rule produces or supports the associated resource.

## 4. Truthful world model exposed to presentation

Keep `civilization-render-v1` backward-compatible. Add optional additive tile presentation fields rather than changing authoritative state or the state schema.

Each render tile may expose:

- `building`: the existing sanitized display label;
- `buildingType`: the real authoritative building type, or `null`;
- `visualVariant`: a bounded deterministic integer derived from existing stable tile/building data without consuming any RNG stream;
- `activity`: either `null` or a sanitized aggregate descriptor with `kind`, `label`, `resource`, and `density`;
- `groundDetail`: a bounded descriptor such as cultivated, timber, masonry, civic, domestic, or none, derived from real building/terrain state.

The presentation layer may render a small number of **representative cohort figures** near active economic structures. These figures are explicitly aggregate visuals. They have no identity, no inventory, no path, no collision, no authoritative position, and no ability to mutate simulation state. Low quality may omit them entirely while the same simulation continues.

Activity mapping must follow existing mechanics:

- farm → crop tending / food;
- lumberyard → timber work / wood;
- quarry → stone work / stone;
- granary → harvest storage / food support;
- market → market activity / gold;
- school → study / knowledge;
- temple → civic activity / influence;
- workshop → craft work / wood, stone, and knowledge support;
- barracks → defence drill / defence support;
- aqueduct → waterworks / health/housing support;
- house → domestic activity;
- monument → civic landmark;
- camp → settlement activity.

No visual statement may claim a delivery, reservation, assigned individual job, construction percentage, road route, damage state, upgrade state, weather effect, or transport action that authority does not track.

## 5. Visual constitution

### Palette and material roles

- earth/background: deep warm soil and desaturated olive;
- stone: warm limestone and weathered grey-beige;
- timber: aged brown with darker structural edges;
- roofs: muted terracotta and weathered clay;
- cultivated land: restrained green/ochre rows;
- water: cool muted blue-green;
- progress: civic gold;
- danger: amber/red plus icon/shape/pattern, never colour alone;
- focus/selection: pale parchment/gold outline rather than neon.

### Tile and building language

Keep the discrete authoritative grid but present it as a miniature relief board: elevated ground plates, contact shadows, front/side faces, coherent light direction, and shallow perspective.

Every real building type receives a unique silhouette made from CSS/DOM primitives. Building variations remain bounded and deterministic. The silhouette must be identifiable at normal zoom before fine detail is visible.

Examples:

- farms: furrow/crop rows and a small shed marker;
- houses: pitched terracotta roof, door, chimney silhouette without smoke unless a real activity rule justifies it;
- granaries: raised store body and loading apron;
- markets: canopy/stall silhouette;
- workshops: timber/stone workbench shapes and restrained activity motion;
- schools: taller civic roof/window rhythm;
- barracks: compact fortified yard;
- temples: civic/ritual roofline;
- aqueduct: arch sequence;
- monument: unmistakable vertical landmark.

Terrain remains semantically readable beneath structures. Water, hills, forest, marsh, plains, and coast use distinct texture/pattern/value, not only hue.

## 6. Layout and interaction

The world is the dominant element.

Desktop hierarchy:

1. compact top status ribbon;
2. concise AI plan/danger strip;
3. large world stage;
4. narrow contextual realm rail;
5. chronicle/events as secondary context.

Mobile hierarchy:

1. plan/danger;
2. world stage;
3. contextual selected-tile sheet/realm essentials;
4. secondary dynasty/resources/events.

Add a presentation-only tile inspector. Clicking or keyboard-focusing a tile selects it locally without changing authority. The inspector shows only fields supported by the snapshot: terrain, ownership, actual building, aggregate activity, real resource association, capital/threat state. It must state aggregate activity honestly where applicable.

## 7. Quality presets

Add `Low`, `Balanced`, `High`, and `Ultra` presentation presets stored only in browser preferences.

All presets consume the same snapshot and authority.

- **Low:** core terrain/building silhouettes, focus/danger states, no representative labour figures, minimal shadows/effects.
- **Balanced:** bounded representative labour, richer ground detail, contact shadows, restrained motion.
- **High:** richer secondary detail and environmental depth, still bounded.
- **Ultra:** maximum CSS detail/effects and high-resolution-friendly presentation; no universal 4K performance claim.

Quality changes may alter decorative density, shadows, texture complexity, and animation only. They must never alter population, resource production, action selection, tick cadence, collision, outcome, snapshot authority, or replay.

Reduced-motion overrides decorative motion at every quality level.

## 8. Audio

Preserve semantic event-driven audio. Improve cue envelopes/material character only where it can remain bounded and comfortable. Do not fabricate positional footsteps or transport sounds because individual movement is not simulated.

Keep critical information available through captions and visual state. Audio context failure or mute must not affect authority.

## 9. Performance boundaries

No new external assets, canvas engine, WebGL dependency, model call, or per-frame authoritative work.

Hard presentation bounds:

- maximum authoritative tiles remain 160;
- representative cohort figures are capped per visible tile and globally;
- decorative layers are CSS/DOM-only and quality-gated;
- rendering remains snapshot-driven;
- updates replace bounded tile DOM; no unbounded history/listener/effect accumulation;
- reduced-motion and Low preset remove the most expensive decorative animation first.

Existing performance numbers are baseline claims from previous evidence, not automatically valid for this upgrade. New measured FPS/device claims require actual capture hardware evidence.

## 10. Verification strategy

TDD applies to behaviour changes.

First regression: prove the presentation stylesheet route is unavailable from the stream host before fixing it.

Then verify:

- render snapshot enrichment is deterministic, deeply immutable, privacy-safe, bounded, and checksum-neutral;
- activity descriptors map only to mechanics that really exist;
- repeated snapshot creation never mutates authority;
- browser source serves every referenced static asset;
- world tiles expose building-specific semantic hooks;
- tile inspector is keyboard/click usable and truthfully labels aggregate activity;
- quality preset changes only body/presentation state;
- desktop 1920×1080 and mobile 390×844 remain overflow-safe;
- reduced motion/high contrast/large text remain functional;
- screenshots include overview, visible economic activity, selected building, mobile, and the densest repeatable scene available in the automated capture;
- CI uploads civilization capture evidence.

If Actions/runner execution cannot be obtained, tests and screenshots remain `NOT_RUN`; they must not be described as passing.

## 11. Explicit non-goals

This upgrade does not introduce:

- authoritative individual citizens;
- road/pathfinding/collision/avoidance systems;
- physical transport or inventory carrying;
- construction progress mechanics;
- new resource/economy balance;
- new weather/day-night economic rules;
- hidden drama manipulation;
- external image/audio assets or licences;
- renderer migration;
- Phase 4 audience influence, Phase 5 durability, or Phase 6 release-governance claims.

## 12. Completion standard

The pass is successful when the browser source visibly reads as one miniature kingdom rather than a dashboard of abstract tiles; every displayed activity is grounded in existing authoritative mechanics; the simulation checksum remains presentation-independent; all referenced assets are actually served; accessibility and mobile hierarchy remain intact; and automated evidence clearly separates verified results from unrun production-hardware claims.
