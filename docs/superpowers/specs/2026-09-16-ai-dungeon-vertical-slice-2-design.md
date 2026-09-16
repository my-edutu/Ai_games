# AI Dungeon Vertical Slice 2 — Experience Design

**Approved direction:** Implement the 2026-09-16 commercial benchmark critique as a focused vertical slice that improves what viewers see and feel without weakening deterministic authority, low-end support, replayability, or autonomous continuity.

## Viewer promise

Viewers watch Astra descend through an ancient living dungeon, read her intent at a glance, understand why attacks hit or miss, recognize room purpose and enemy pressure, and anticipate boss behaviour through clear multi-phase combat language.

## Scope

This slice closes five high-impact gaps:

1. **Combat choreography and character motion** — authoritative semantic events drive presentation-only anticipation, attack motion, hit reaction, recovery, trails, impact rings, bounded camera impulse and reduced-motion equivalents.
2. **Authored-feeling room grammar** — generated rooms receive deterministic semantic roles and a floor biome; objective placement and encounter population use those roles so the floor has pacing rather than undifferentiated rooms.
3. **Three-phase chapter boss** — the chapter boss changes deterministic tactics at explicit health thresholds, emits phase transitions, and uses distinct readable telegraphs.
4. **Adaptive audio hierarchy** — boss phases, attack impacts and room/biome context feed a bounded presentation-only audio state machine with cooldowns, voice limits and visual/caption alternatives.
5. **Capture-based review gate** — browser tests expose representative gameplay state and enforce semantic animation/camera/audio contracts so future polish is judged from rendered play, not source-code complexity alone.

## Non-goals for this slice

- No sanctuary/meta-progression system yet.
- No six-weapon roster yet. The existing close-range/ranged action vocabulary remains authoritative; weapon identity will build on the combat-envelope system created here.
- No external art/audio dependency or unlicensed asset pack.
- No new provider integration, monetization mechanic, deployment, merge to main, R5 claim, 72-hour claim, or seven-day-canary claim.

## Architecture

`DungeonRuntime` and `stepDungeonRules` remain the only gameplay authority. Procedural room roles, biome choice and boss phases are deterministic state produced from named RNG streams or deterministic health thresholds. Presentation receives immutable public snapshots and semantic events. Animation poses, hit stop illusion, trails, particles, camera impulses and adaptive Web Audio never feed back into simulation time, collision, AI observation or rule outcomes.

## Deterministic content grammar

### Floor biome

Each floor has one deterministic `biome` chosen from:

- `ashen-catacomb`
- `drowned-archive`
- `void-observatory`

Biome affects presentation material language and encounter weighting only. It does not consume the topology stream.

### Room roles

Each generated room has one deterministic role:

- `entrance`
- `combat`
- `ambush`
- `shrine`
- `treasure`
- `elite`
- `boss-approach`

Hard rules:

- room containing the entrance is `entrance`;
- room nearest the shrine is `shrine`;
- room nearest the chest is `treasure`;
- room containing/nearest the gate is `boss-approach`;
- remaining rooms are assigned `combat`, `ambush`, or `elite` from a dedicated named stream;
- role assignment cannot alter room topology or objective reachability.

Encounter spawning prefers semantically appropriate rooms while retaining caps and a known deterministic fallback.

## Boss design

The chapter boss uses three phases:

- **Phase 1 — Warden:** above 66% HP. Heavy adjacent strike with clear anticipation.
- **Phase 2 — Cinder:** 34–66% HP. Prefers a line-of-sight ranged flame telegraph from distance 2–4; otherwise closes distance.
- **Phase 3 — Rift:** below 34% HP. Uses a telegraphed two-cell leap when positioned for it; otherwise uses a stronger committed melee attack.

Crossing a threshold emits `boss.phase-changed` exactly once per new phase. Every damaging boss action must be preceded by a visible telegraph and must revalidate range/line-of-sight before resolving.

## Combat presentation envelope

Public render events expose bounded targeting metadata (`entityId`, `cell`, `value`) needed for presentation only. The semantic cue mapper adds an `animation` field with one of:

- `move`
- `melee`
- `ranged`
- `guard`
- `heal`
- `hit`
- `defeat`
- `telegraph`
- `boss-phase`
- `milestone`
- `result`
- `ambient`

Browser presentation keeps a bounded action-envelope cache keyed by cue id. A combat envelope has anticipation, impact and recovery timing. The renderer may translate/rotate/squash vector art, draw weapon trails and impact rings, and add bounded camera impulse, but never pauses or changes authoritative ticks.

Reduced-motion mode removes lunge translation, camera shake and pulse scale while preserving pose, outline, telegraph and impact meaning.

## Audio direction

The existing Web Audio system remains dependency-free. Add semantic cue classes for boss phase change, melee impact, ranged release and guard/heal. Adaptive ambience remains bounded by `MAX_AUDIO_VOICES`, cooldowns and bus gain. Boss phase may increase harmonic/intensity treatment, but danger cues always outrank ambience and every critical cue remains visually/caption represented.

## Visual direction

Biome palette accents are presentation-only:

- Ashen Catacomb: warm stone, ember/bronze accents.
- Drowned Archive: cool damp stone, teal/green reflected accents.
- Void Observatory: desaturated stone, violet/cold highlights.

Room-role markers are subtle environmental motifs, not HUD labels: shrine light, treasure glint, elite floor sigil, boss-approach threshold. Low quality keeps role/objective silhouettes and removes only cosmetic density.

## Capture/review gate

Representative browser evidence must cover:

- desktop 1920×1080;
- phone landscape 640×360;
- low quality + reduced motion;
- clean feed;
- boss encounter with phase/telegraph language visible.

Automated assertions require:

- no horizontal overflow or console/page errors;
- critical objective/HP/intent remain present;
- boss phase is exposed in public state;
- semantic combat cues carry animation metadata;
- reduced-motion mode preserves semantic cue presence while suppressing motion-heavy presentation;
- quality tiers preserve boss/enemy/objective visibility.

## Versioning

Because floor content metadata, encounter placement and boss outcomes change, increment deterministic/content/generator versions as required by the existing manifest conventions. Presentation version also increments because the public snapshot/cue contract and browser renderer change.

## Acceptance gate

The slice passes only when:

- same seed/config/version reproduces identical authoritative checksum;
- generated floors retain reachability and bounded generation;
- every room has a valid role and every floor a valid biome;
- chapter boss demonstrates all three phases in deterministic tests;
- phase changes and damaging attacks are telegraphed causally;
- combat cue animations never mutate authority;
- low/reduced-motion retains gameplay truth;
- Dungeon Phase 2/3 focused suites pass;
- full catalogue test/build and authoritative nondeterminism scan pass;
- browser capture evidence is generated and inspected;
- release readiness remains truthfully R4 unless external R5 evidence is separately supplied.