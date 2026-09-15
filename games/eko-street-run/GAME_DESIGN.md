# Eko Run Game Design

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define gameplay fantasy, authoritative rules, loops, progression, hazards, difficulty and content grammar.  
**Status:** `approved` for foundation implementation  
**Owning scope:** Game-design contract  
**Related:** `PRD.md`, `AUDIO_VISUAL.md`, `TECHNICAL_ARCHITECTURE.md`, `docs/EKO_EXPERIENCE_STANDARD.md`.  
**Last material review:** 2026-09-15  
**Version:** `GDD-1.0`

## Fantasy and Emotional Arc

Tayo is a capable Lagos runner whose strength is reading movement, finding rhythm and recovering under pressure. The world begins readable and ordinary, builds anticipation through traffic and spatial compression, peaks in authored route crises, then gives short recovery beats so success feels earned rather than continuously noisy.

The dominant emotional sequence is **confidence → anticipation → commitment → near-miss/impact → recovery → mastery**. Failure should feel causal and replayable, never like the engine cheated.

## Creative Pillars

### 1. Precision inside motion

- **Promise:** A busy city can still support exact, fair platforming.
- **Rule expression:** hazards have explicit cue/decision/recovery contracts.
- **Audiovisual expression:** background motion is dense but lower priority than player/path/danger.
- **Proof scene:** Tayo threads a danfo pull-out and pothole while the safe response remains obvious at speed.
- **Anti-pattern:** random traffic enters from off-camera and causes unavoidable damage.

### 2. Lagos behaves, not merely decorates

- **Promise:** The game feels specific through transport, commerce, drainage/weather, street proportions, skyline/water, fashion and sound.
- **Rule expression:** districts introduce decisions inspired by these movement situations.
- **Proof scene:** Rainy Lagos changes visibility, splash cues and route choice without hiding hazards.
- **Anti-pattern:** generic city geometry plus flags and slang.

### 3. Expressive Nigerian protagonist

- **Promise:** Tayo remains readable and charismatic across distinct clothing silhouettes.
- **Rule expression:** one collision truth; outfit geometry is presentation-only.
- **Proof scene:** agbada cloth reacts during a landing while feet/body direction and contact remain obvious.
- **Anti-pattern:** costume clips through camera/path or changes hitbox advantage.

### 4. Recovery creates stories

- **Promise:** Near-misses and recoveries are entertaining without hidden rescue.
- **Rule expression:** declared stumble/recovery windows, checkpoints and safer routes.
- **Proof scene:** a poorly timed landing costs momentum but permits a legal recovery line.
- **Anti-pattern:** director secretly grants immunity because a run is exciting.

## Authoritative World Model

The simulation is primarily a forward route with x/y platforming and authored depth/lane states where a route segment explicitly supports them. Authoritative state stores player transform/velocity, movement state, route segment/checkpoint, active authoritative hazards, collectible/resource state, run progress, normalized commands, deterministic stream states, event sequence and result state.

Presentation-only crowds, particles, camera easing, decorative vehicles, cloth bones, light flicker and ambience cannot affect authority.

## Player Action Catalogue

Phase 2 implements the full controller; Phase 1 reserves the command schema.

- `move`: normalized horizontal intent `[-1, 1]`.
- `jump-press`: request jump; input buffering applies in the movement state machine.
- `jump-release`: shorten eligible ascent.
- `slide-press` / `slide-release`: enter/exit allowed slide window.
- `vault`: only when an authored vault sensor and movement conditions permit it; no automatic global parkour.
- `lane-shift`: only in explicitly authored route segments.

Commands are requests; rules determine legality and outcome.

## Movement Design Targets

Final numeric tuning belongs to Phase 2. The design targets are:

- responsive acceleration without instant full-speed snap;
- braking that communicates momentum without causing input lag;
- a jump arc whose takeoff, apex and landing are visually/physically legible;
- coyote time and input buffering that forgive human timing without hiding rules;
- bounded air control that preserves commitment;
- consistent collision/landing across frame schedules;
- recovery states that cost something understandable but return control quickly.

## Primary Progress and Resources

**Primary progress:** district distance/checkpoint progress.

**Secondary:**

- Eko Tokens — cosmetic/meta unlock resource; not required for survival.
- Near-miss streak — run-level expression/record context, not a source of hidden immunity.
- Outfit/theme unlocks — identity and variety, not authoritative power.

## Hazard Families

Each family must have a hazard fairness record before shipping.

1. **Danfo pull-out/crossing** — moving block with approach/turn cue and safe timing windows.
2. **Molue-style large vehicle** — larger sight-line/set-piece pressure with stronger anticipation and longer decision horizon.
3. **Pothole/broken road** — ground discontinuity readable by shape/value/edge treatment, not color alone.
4. **Open drain/trench** — explicit edge, depth cue and safe jump/route options.
5. **Roadworks/barriers** — vault/slide/alternate path grammar.
6. **Puddle/flood zone** — route/readability friction; presentation may be dramatic but collision truth remains exact.
7. **Handcart/hawker-cart movement** — slow lateral/route interruption with readable path.
8. **Loose rolling object** — bounded trajectory with pre-cue.
9. **Crowd compression** — authored narrowing/motion pressure represented with simplified authoritative occupancy rather than full-body crowd physics.
10. **Street argument/fight disturbance** — non-graphic temporary blocked/unstable route area with neutral participants; it is not combat gameplay and cannot target ethnic/protected groups.

## Hazard Fairness Contract

For every authoritative hazard record:

- first visible/audible cue;
- first meaningful decision point;
- player speed range;
- minimum response window;
- valid actions/routes;
- collision shape and outcome;
- recoverable mistake path;
- forbidden combinations;
- mobile/low-tier equivalent cue.

Invalid/unavoidable hazard configurations are content defects and do not count toward balance statistics.

## Nested Loops

### Moment

Read → commit action → physical resolution → feedback → next read.

### Tactical

Prepare for 5–30 second obstacle sequence → choose safer/faster branch → execute → recover/reward → checkpoint or relief beat.

### Run

District segments alternate learning, pressure, choice, crisis and recovery. Checkpoints partition meaningful progress and support verified restore rules where mode policy permits.

### Session/stream

Runs compare records, rotate deterministic route seeds/themes, vary outfit presentation and later open bounded viewer choices.

### Long-term

Cosmetic collections, achievements, route/theme unlocks, record history and seasonal presentation add identity without permanent power that predetermines outcomes.

## District Grammar

### Mainland Morning

Purpose: teach route language while establishing Lagos identity. Wide sight lines, moderate danfo timing, simple potholes/roadworks, residential/commercial transitions, bus-stop checkpoint.

### Market Rush

Purpose: choice and compression. Awnings, stalls, carts, crowd lanes, optional risk/reward branches and dense color that still protects hazard hierarchy.

### Danfo Junction

Purpose: timing mastery. Vehicle pull-outs, crossing patterns, bus-stop movement, route switching and moving visual occluders constrained by camera rules.

### Rainy Lagos

Purpose: information pressure without deception. Rain/splash/wet surfaces, drainage/flood choices, lower contrast compensated by stronger shape/motion/cue design.

### Island Night

Purpose: speed and modern-city spectacle. Wider roads, modern architecture, lighting, construction diversions and stronger motion contrast without glare hiding routes.

### Bridge Run

Purpose: long-horizon set-piece pressure. Long sight lines, waves of traffic, wind/presentation motion and a culminating authored crisis. Wind that affects authority must be versioned and fully readable; decorative wind is presentation-only.

## Progression and Milestones

Small milestones: route-segment completion, clean hazard sequence, token cluster, local near-miss record.

Medium milestones: checkpoint, district grammar shift, alternate route decision, weather/intensity change.

Major milestones: district completion, record break, set-piece resolution, run completion.

Milestones must change mechanics, environment, stakes, route choice or presentation state rather than only display a badge.

## Difficulty Axes

Challenge grows through combinations of:

- spatial precision;
- approach speed/time pressure;
- hazard concurrency;
- route width/branching;
- vehicle timing complexity;
- vertical commitment;
- information pressure from weather/scene density;
- recovery cost;
- optional risk/reward path value.

Raw speed is only one axis and cannot be the sole progression mechanism.

## Failure Taxonomy

- informed risk accepted;
- execution/timing error;
- route-choice error;
- momentum/recovery management error;
- generated-content pressure that remained valid;
- viewer-induced bounded complication;
- AI policy/fallback error;
- invalid/unavoidable content defect;
- camera/readability defect;
- technical/integrity failure.

The last three are excluded from legitimate gameplay-loss statistics as appropriate: content/camera defects require fixes; technical/integrity failures enter recovery/quarantine.

## Terminal States

- `completed`: declared run objective completed.
- `failed`: causal gameplay failure.
- `aborted`: explicit user/operator safe abort.
- `quarantined`: integrity uncertainty/divergence.
- `maintenance`: no active competitive run; intentional system state.

Results include cause, distance/checkpoint, records/notable moments, short resolution beat, next seed/theme preview, and bounded restart countdown.

## Procedural Route Grammar

Generation is layered:

1. guaranteed traversable backbone;
2. checkpoint/objective placement;
3. hazards with clearance/reaction constraints;
4. optional branches/rewards;
5. audience anchor points;
6. visual/audio dressing;
7. physics/visibility/performance validation;
8. feature extraction.

Named streams isolate topology, hazards, rewards, audience tie-breaks and cosmetic dressing. Cosmetic draws cannot perturb rule-critical output.

## Dramatic Patterns

At minimum, route/AI/balance must naturally support:

- steady mastery → complication → adaptation → checkpoint;
- early mistake → momentum loss → recovery → record chase;
- risky shortcut → temporary advantage → denser pressure → escape/failure;
- calm introduction → transport surge → route compression → relief;
- weather/visibility change → cautious adjustment → regained confidence.

No director may fabricate a near-miss or secretly change resolved collision outcomes.

## Content Expansion Seams

New districts add route grammars, hazard combinations, presentation themes and authored set pieces through versioned content packs. They may depend on public contracts but cannot fork the game rules into incompatible district-specific engines.

## Rule Precedence

Integrity/safety > command legality > collision/physics truth > hazard consequences > progression/reward > presentation. If two simultaneous consequences conflict, the deterministic system order and stable entity/contact ordering defined in `TECHNICAL_ARCHITECTURE.md` decides the outcome.
