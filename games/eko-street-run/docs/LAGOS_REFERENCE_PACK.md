# Eko Run Lagos Reference Pack

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Translate approved Lagos/Nigerian visual references into original game-design decisions.  
**Status:** `approved reference constitution`  
**Owning phase:** Phase 0  
**Related:** `../ASSET_LEDGER.md`, `../AUDIO_VISUAL.md`, `../GAME_DESIGN.md`.  
**Last material review:** 2026-09-15  
**Version:** `REFERENCE-1.0`

## Research Rule

This pack is not a claim that one photograph represents all of Lagos or all Nigerian cultural clothing. It uses multiple stock references to establish concrete design questions—proportion, silhouette, material, density, motion and hierarchy—then creates original game assets. Districts are fictionalized composites and should be reviewed by people familiar with Lagos/Nigerian cultural context before final release.

## Reference Board A — Transport and Street Motion

**Primary references:** `REF-LAGOS-001`, `REF-LAGOS-002`, `REF-LAGOS-005` in `ASSET_LEDGER.md`.

Observed design cues to study:

- strong yellow vehicle mass reads quickly against mixed street backgrounds;
- public-transport scale can act as a moving platforming wall without requiring photoreal replication;
- street scenes mix vehicles, pedestrians and roadside activity, so Eko Run must create hierarchy rather than copy visual clutter literally;
- top-view/oblique references are useful for establishing vehicle roof/body proportions and visibility under the game camera.

**Game translation:** create original `eko_danfo` and `eko_large_bus` vehicle families with fictional plates/route signs. Authoritative collision shapes are simpler and slightly clearer than the visual mesh. Vehicle motion uses pre-cues and route contracts.

## Reference Board B — Markets and Commerce

**Primary references:** `REF-LAGOS-002`, `REF-LAGOS-003`, `REF-LAGOS-004`.

Observed design cues to study:

- umbrella/canopy color creates strong overhead rhythm;
- produce/stall groupings create low-height obstacle silhouettes;
- pedestrian/vehicle layering can visually compress a route;
- commerce should communicate active city life rather than exist only as an obstacle theme.

**Game translation:** Market Rush uses fictional stalls, awnings, carts, produce color blocks and route openings. Presentation-only pedestrians can animate around an authoritative simplified occupancy layer. Background commerce continues during calm beats so Lagos identity is not synonymous with danger.

## Reference Board C — Skyline, Water and Modern City

**Primary references:** `REF-LAGOS-006`, `REF-LAGOS-007`.

Observed design cues to study:

- water/skyline creates long depth layers and calmer visual breathing space;
- later-day lighting can shift the emotional tone without changing the route grammar;
- modern high-rise/waterfront silhouettes broaden the visual identity beyond markets/traffic.

**Game translation:** Island Night and Bridge Run use distant skyline/water layers, controlled reflections and long sight lines. Decorative boats/traffic stay non-authoritative unless explicitly promoted to a tested hazard system.

## Reference Board D — Yoruba-Inspired Outfit

**Primary:** `REF-COSTUME-001`.

Study broad agbada drape, sleeve volume, cap silhouette and how fabric creates a readable outer shape. Do not copy the photographed subject, facial features, exact embroidery or accessories.

**Game translation:** an original Tayo agbada silhouette with exaggerated but controlled cloth arcs. Feet, torso direction and jump/landing pose remain readable through the garment.

## Reference Board E — Igbo-Inspired Outfit

**Primary:** `REF-COSTUME-002`; secondary pattern-scale study `REF-COSTUME-003`.

Study red-cap silhouette, bead/accessory placement and high-contrast upper-body textile rhythm. Do not copy a person's likeness or exact lion-pattern artwork.

**Game translation:** original isi-agu-inspired textile motifs designed for game readability, a clean red-cap silhouette and restrained accessory simulation.

## Reference Board F — Hausa-Inspired Outfit

**Primary:** `REF-COSTUME-004`; secondary volume reference `REF-COSTUME-005`.

Study long garment layering, embroidery placement, headwear proportions and how fabric hangs during standing/walking poses. Do not reproduce the photographed person or exact garment artwork.

**Game translation:** original baban-riga/kaftan-inspired outer silhouette with low-cost cloth secondary motion and a distinct embroidered-cap profile.

## Lagos Identity Constitution

A representative Eko Run capture should combine multiple identity channels:

1. **spatial:** road/sidewalk/drainage/building proportions and route shape;
2. **behavioural:** transport, commerce, pedestrian flow, weather response and authored street incidents;
3. **material:** road wear, painted vehicles, canopies, concrete/metal/water/wet-surface variation;
4. **character:** clothing silhouettes and animation;
5. **audio:** traffic bed, cloth/footsteps, market/rain/city ambience and original music grammar;
6. **graphic:** fictional route signs, local-inspired typography rhythm and HUD identity;
7. **contrast:** calm/modern/waterfront/community moments as well as congestion/pressure.

If a scene needs a Nigerian flag or the word “Lagos” to be recognizable, the underlying world identity is not yet strong enough.

## Cultural Review Questions

- Does the scene show people/city life as more than obstacles or chaos?
- Are clothing references respectful and specific without presenting one garment as a universal Nigerian uniform?
- Are ethnic identities kept out of negative fight/hazard targeting?
- Are fictional businesses/signs clearly fictional and free of accidental real-brand copying?
- Do crowd/fight scenes remain non-graphic, neutral and readable rather than sensationalized?
- Does the game represent modern architecture, style, commerce, water/skyline and community alongside broken roads/traffic?

## Art Production Handoff

Phase 3 creates original SVG character/costume sheets and 3D presentation assets from this constitution. Phase 4 creates the Mainland Morning environment. Any new external reference is added to the ledger before use. Runtime asset approval remains separate from reference approval.
