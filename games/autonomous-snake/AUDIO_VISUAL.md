# Autonomous Snake — Audio and Visual Direction

**Status:** Approved design; 3D presentation undergoing Gauntlet review
**Creative aim:** Make spatial intelligence, growth, danger, and near-complete board conquest readable at a glance without turning every food pickup into maximum spectacle.

## Art Direction

The current feature-branch presentation uses an original 3D verdant-ruins garden: weathered pale stone above turquoise water, warm sun, layered vegetation and a jade-and-gold serpent. The snake is the dominant moving silhouette, while the exact board, fruit, hazards and portal endpoints remain legible. Snake Pass's official runtime media is the inspectable character/scene quality bar; ASTRO BOT is secondary environmental inspiration. References are not game assets.

### Implemented presentation

The pinned local Three.js renderer consumes immutable public snapshots. The character has a continuous tapered body, custom skull, cream jaw, scale textures, eyes, brows and semantic expressions, with preallocated close/distant geometry. Motion never draws a bridge across a portal or interpolates a prior run into a restart. Overview, follow and character cameras retain a clickable full-board mini-map when zoomed in. The portrait camera changes viewing direction to fit the board vertically.

The garden includes original stone terraces, arch, trees, foliage, water, waterfalls, fruit and snapshot-driven hazard/portal props. Static scenery uses baked material batches. The responsive shell presents length/goal, occupancy, record and readable strategy, plus loading, result, intermission and recovery. Optional sound is synthesized locally and starts muted; reduced motion and clean feed are available. The live `/progress` page records actual captures, critic verdicts and verification.

These implemented features do not imply that every long-term audiovisual behavior below has been completed or that the commercial comparison has been won. The active evidence and gaps are recorded in `docs/reviews/SNAKE_GAUNTLET_LEDGER.md`.

### Shape Language

- head: unique directional silhouette, eye/sensor or leading-edge marker, stronger outline and motion trail;
- body: connected segments with clear order and curvature; no gaps that imply separate entities;
- tail: subtly distinct endpoint to help viewers understand safe-route planning;
- food: compact high-contrast objective shape with pulse cadence based on expiry/importance;
- hazards: angular or unstable silhouettes with telegraph and recovery states;
- obstacles: visually solid, low-motion masses;
- portals: paired shape language and animated directional link;
- audience effects: one shared accent treatment, never confused with ordinary food or lethal danger.

### Palette Roles

Each theme defines semantic roles rather than arbitrary colors: background, grid, snake neutral, snake head, progress, food, special reward, danger, warning, audience, record, integrity/recovery, and disabled state. Shape, outline, icon, motion, and value reinforce every critical color.

Initial themes may include Neon Circuit, Deep Ocean, Solar Temple, Arctic Glass, and Cosmic Grid. Theme changes are cosmetic and cannot alter authoritative contrast classifications.

## Board Composition and Camera

The default camera keeps the full playable board visible whenever cells remain readable. Larger boards may use bounded dynamic zoom or overview/inset modes, but viewers must always retain objective context.

Camera modes:

- board overview/countdown;
- stable run framing;
- subtle look emphasis around the head and intended route;
- milestone/record emphasis;
- decisive collision/replay;
- result and next-board preview;
- safe recovery/intermission.

Camera motion uses hysteresis and low-amplitude impulses. No rapid zooming or continuous shake. Reduced-motion mode removes impulses and uses fades/outlines.

## HUD Hierarchy

Persistent primary:

1. `LENGTH`;
2. `BOARD OCCUPIED`;
3. current milestone or phase;
4. best eligible record.

Persistent/contextual secondary:

- run number and mode;
- AI intent and confidence band;
- speed/hazard modifier;
- next audience window;
- food/objective expiry where relevant.

Context cards:

- vote choices and countdown;
- applied audience effect;
- milestone, record, near-miss;
- provider degradation;
- recovery/verified checkpoint.

The board remains larger than the combined HUD footprint. Mobile-size capture tests determine minimum cell, type, and icon sizes.

## Animation and VFX Grammar

### Food Collection

Anticipation pulse → precise head contact → short growth wave through nearby segments → restrained particles and score/progress tick. Repeated ordinary food uses low intensity; special food adds unique icon/color/audio and a capped trail.

### Near-Miss

When a validated event indicates minimum clearance or one-safe-move escape, briefly emphasize the dangerous cell and head route without altering time or revealing hidden future data. A subtle vignette, line pulse, or replay marker is preferred to full-screen flash.

### Growth and Milestones

Small milestones use progress-ring/board-edge animation. Major occupancy bands may change board lighting, music stem, snake material, and HUD treatment. Record crossing receives a distinct but bounded celebration that yields immediately to lethal danger.

### Hazards and Audience Effects

Every hazard has telegraph, active, and recovery visuals. Audience effects use a common incoming marker, safe placement preview where appropriate, applied state, and expiry. Paid/cosmetic acknowledgement cannot obscure collision or result.

### Result and Replay

A loss freezes or clearly isolates the decisive authoritative cell, traces the final route, displays the exact rule cause, and plays a short replay. Victory emphasizes the occupied board pattern and record. Technical quarantine uses a separate safe scene and never imitates a collision.

## Performance Budgets

Game-specific evidence will set exact numbers on reference hardware. The design requires caps for active particles, trails, floating text, full-screen passes, camera impulses, dynamic lights, textures, and replay buffer. Quality degradation removes ambient grid animation, background particles, decorative trails, and replay fidelity before goal, food, hazards, head, record, captions, or result clarity.

## Audio Identity

The current client provides original synthesized collection, milestone, danger and result cues over quiet tonal ambience, with eight transient voices and two ambience oscillators. Browser gesture gating, mute and disposal are implemented. The longer-term audio direction below remains a design target: precise movement ticks, soft body motion, spacious telegraphs and a score responding to occupancy.

### Music States

- countdown/intermission;
- open-board calm;
- route tension;
- hazard/pressure;
- high-occupancy cycle;
- record chase;
- victory;
- failure;
- safe recovery/maintenance.

Transitions use hysteresis, minimum dwell, musical bars, stems, and quiet contrast. The system must not remain at peak tension for long sessions.

### SFX Priority

1. terminal/integrity and decisive collision;
2. immediate hazard telegraph;
3. major milestone/record/victory;
4. audience effect application;
5. special food;
6. ordinary food and movement;
7. ambience.

Voice limits, cooldowns, deduplication, ducking, and true-peak protection are mandatory. Dense food/segment events merge rather than clip.

## Accessibility

- critical danger and results use shape/icon/text, not color alone;
- captions describe meaningful cues such as “Hazard activates” or “Record broken”;
- reduced-motion disables shake, rapid zoom, and route sweeps;
- reduced-flash replaces flashes with outlines and controlled luminance transitions;
- muted-audio viewers retain full game comprehension;
- color-vision simulations and grayscale captures are part of review;
- public text is bounded, sanitized, and localization-safe.

## Asset Governance

Every sprite, texture, shader, font licence, music track, stem, ambience, and SFX entry records provenance, licence, version, size/memory, preload/stream policy, fallback, accessibility variant, and replacement owner. Placeholder or unlicensed assets cannot enter the R4 build.

### Current asset provenance

| Asset | Source and ownership | Loading and fallback |
|---|---|---|
| Snake meshes, pigment, scale relief and roughness | Original procedural code in `public/snake-stream/serpent.mjs`; no downloaded model or texture | Built once, preallocated geometry tiers; live 2D fallback |
| Garden geometry, stone/moss textures and water shader | Original procedural code in `public/snake-stream/world.mjs`; local cosmetic random stream | Built for board dimensions, disposed on replacement |
| Contact shadow | Original radial texture in the renderer | Fixed texture and instance buffer |
| Sound cues and ambience | Original Web Audio synthesis in `audio.mjs`; no sampled recordings | User gesture only, bounded voices, starts muted |
| Identity mark and interface | Original inline SVG and CSS; installed system font stacks | No remote font or icon request |
| Rendering engine | Existing pinned `three@0.186.0` dependency | Two explicit locally served module paths; no CDN |
| Comparison media | Links to official Snake Pass and ASTRO BOT pages | Inspection references only; not packaged as playable assets |

Actual screenshots under `public/snake-stream/progress/evidence` are development evidence, not textures used to fake the game view. Commercial-quality, performance and production readiness claims require their separate evidence gates.

## Evidence Gate

The audiovisual design passes when representative desktop, phone-size, low-bitrate, color-safe, reduced-motion, muted, peak-VFX, result, provider-degraded, and renderer/audio-recovery captures preserve goal and danger comprehension; frame/audio budgets pass; assets are licensed; and resources remain bounded through the candidate soak.
