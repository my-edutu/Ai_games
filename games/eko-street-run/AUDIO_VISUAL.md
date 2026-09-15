# Eko Run Audio / Visual Constitution

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define art, character, animation, camera, VFX, HUD, sound, accessibility, asset and broadcast rules.  
**Status:** `approved design`  
**Owning phases:** Phase 0 reference constitution; implementation Phase 3 onward  
**Related:** `GAME_DESIGN.md`, `ASSET_LEDGER.md`, `docs/LAGOS_REFERENCE_PACK.md`, `docs/EKO_EXPERIENCE_STANDARD.md`.  
**Last material review:** 2026-09-15  
**Version:** `AV-1.0`

## Visual Promise

A richly dimensional Lagos-inspired world surrounds an immediately readable original protagonist. The visual hierarchy at gameplay speed is always:

`Tayo → safe/possible route → immediate danger → reward/progress → world detail → decorative ambience`.

No amount of environmental authenticity or spectacle may invert that order.

## Shape and Silhouette Language

- Tayo uses a compact readable core body silhouette with expressive clothing outer silhouettes.
- Safe traversable geometry uses coherent edges/planes and repetition patterns.
- Hazards use distinct shape/motion signatures in addition to color.
- Background architecture favors readable masses and depth separation over micro-detail at gameplay scale.
- Vehicles use original game models inspired by category/form references rather than photo-textured replicas with brands/plates/real persons.

## Tayo Outfit Families

### Yoruba-inspired agbada + fila

Broad flowing outer silhouette, embroidered/patterned accents, controlled cloth overshoot on acceleration/jump/landing. Sleeves/cloth cannot obscure feet/contact or route information.

### Igbo-inspired isi-agu styling + red cap

Strong patterned upper-body identity and red-cap silhouette. Lion-pattern inspiration is recreated as original textile art rather than copied from a stock photo or branded garment.

### Hausa-inspired baban-riga/kaftan + embroidered cap

Long layered garment silhouette, restrained embroidery and cap profile. Cloth motion remains readable and performant.

### Contemporary Lagos streetwear

Modern fitted/layered silhouette used as a visual counterpoint to ceremonial/traditional-inspired outfits.

All four use identical authoritative collision geometry unless a future versioned mechanic explicitly changes the rule for every comparable outfit class.

## Character Animation States

Idle, anticipation, acceleration, run, brake, takeoff, ascent, apex, descent, landing, slide, vault, near-miss reaction, hit/stumble, recovery, failure and celebration. Animation can exaggerate weight/anticipation but cannot delay authoritative input or fabricate collision timing.

## Camera Philosophy

The camera is a gameplay information system first. It uses forward look-ahead, protected landing visibility, bounded vertical framing and authored occlusion handling. Camera shake/FOV changes occur after or around understandable events and never hide unresolved decisions.

Any failure where route/hazard/landing information was not reasonably visible before commitment is treated as a camera/level defect until replay evidence disproves it.

## Environment Pillars

- yellow public-transport forms and bus-stop movement as references for transport identity;
- mixed market/commercial color and canopy rhythms;
- drainage, pothole, broken-road and wet-weather material variation;
- residential/commercial building transitions;
- waterfront/skyline/modern-city depth for later districts;
- street signage/typography inspired by observed visual density but recreated with fictional names/brands;
- day → rain → night lighting progression without losing gameplay contrast.

## Material and Lighting Rules

PBR/Three.js presentation may use stylized physically plausible materials. Avoid generic glossy sci-fi surfaces. Wet streets increase reflection selectively; reflection/glare cannot hide pothole/drain edges. Night scenes preserve local contrast around Tayo, route and hazards. Low tier removes expensive ambience before critical lighting/cues.

## VFX Hierarchy

1. terminal/integrity state;
2. immediate danger/decisive result;
3. checkpoint/record/major recovery;
4. viewer acknowledgement;
5. movement/collect/tactical feedback;
6. ambient Lagos motion.

Effects follow anticipation → impact → recovery. Particles, splash, dust, debris, cloth accents, near-miss accents and celebration all have caps/cooldowns. Reduced-motion/flash alternatives are designed per cue.

## HUD Hierarchy

Persistent primary: distance/checkpoint progress.  
Persistent secondary: record comparison and minimal run state.  
Contextual: AI intent or route choice.  
Transient: token/near-miss/acknowledgement.  
Operator-only: versions, errors, queues, diagnostics.

Phone-size landscape-stream viewing is a required capture target. Raw chat, provider data, stack traces, secrets and chain-of-thought never appear publicly.

## Audio Identity

Audio conveys movement and state before quantity:

- movement/foley: footsteps, cloth, slide, landing;
- danger: vehicle approach, large-vehicle set-piece cue, route warning;
- ambience: traffic bed, market activity, rain/water, distant city texture;
- progress: checkpoint, record, district transition;
- music: calm/progress → anticipation → danger/crisis → recovery → celebration/failure;
- system: truthful recovery/intermission state.

No critical hazard relies on audio only.

## Mix Buses

Master, music, ambience, movement/foley, danger/vehicle, impacts, UI/HUD, audience acknowledgement and system/emergency. Voice counts, cooldowns, ducking and peak control are explicit in Phase 7. Constant crisis music is prohibited.

## Accessibility

- Critical meaning uses shape/motion/text/icon plus color as appropriate.
- Reduced-motion and reduced-flash variants preserve semantic priority.
- Captions/visual icons cover critical audio cues.
- Touch/HUD safe areas are tested at supported mobile viewport classes.
- Camera impulses have bounded magnitude/duration and a reduced-motion path.

## Quality Degradation Order

1. ambient particles/decorative crowd density;
2. distant animation/secondary shadows;
3. reflection/post-processing quality;
4. non-critical environmental detail.

Never degrade authoritative tick, collision, input interpretation, route/hazard cues, critical animation readability or accessibility information.

## SVG / Raster / 3D Asset Pipeline

- SVG is the editable master for 2D character concepts, costume sheets, icons, signage, decals and UI art.
- JPG contact sheets are generated for review/reference sharing as requested.
- Transparency-critical runtime 2D assets use SVG/PNG/WebP rather than lossy JPG.
- Three.js character/environment meshes are original procedural or authored 3D assets informed by approved references.
- Stock photos are not baked into identifiable-character skins.

## Asset Naming

`eko_<category>_<subject>_<variant>_vNN.<ext>` with a matching ledger row for any external source/derivative. Release assets record source, author, licence, third-party-rights review, derivative path and replacement status.

## Broadcast Scenes

Countdown, normal play, danger, checkpoint/milestone, result, replay, intermission, provider-degraded, safe recovery/quarantine and clean feed. Technical failure is visually distinct from a normal gameplay failure.
