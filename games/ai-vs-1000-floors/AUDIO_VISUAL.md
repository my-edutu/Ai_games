# Audio and Visual Direction — Signalpunk Ascension

## Visual promise

A dark architectural tower, crisp tactical silhouettes, luminous circuit seams and restrained effects make progress and danger readable at phone size. Floor identity changes mechanics and material language, not palette alone.

## Character grammar

Astra is a compact armored silhouette containing a geometric AI core:

- diamond: navigation;
- shield: defense/recovery;
- spear: combat;
- split chevron: route evaluation;
- broken ring: deterministic fallback.

Enemy silhouettes:

- Sentinel — wide shield;
- Striker — narrow forward wedge;
- Leech — ring/drain shape;
- Warden — sector-specific rule silhouette;
- Architect — synthesis of prior motifs.

## HUD hierarchy

1. `FLOOR n / 1000` and sector;
2. health/energy/shield and immediate objective;
3. threat tier and telegraphs;
4. Astra goal/intent/confidence;
5. record comparison;
6. contextual loadout or audience choice;
7. transient acknowledgement.

Operator diagnostics are never part of the public feed.

## Camera and VFX

- room framing with tactical focus and short architectural floor wipes;
- common actions use one restrained channel;
- boss, checkpoint, record and terminal moments use multi-channel treatment;
- route, hazard and attack telegraphs use shape/line pattern plus color;
- critical cues are never obscured by particles, audience cards or camera impulse;
- reduced-motion removes camera shake and substitutes opacity/shape transitions;
- reduced-flash replaces full-screen flashes with borders/icons/captions.

## Audio states

Intermission, exploration, anticipation, danger, Warden, recovery, floor clear, sector clear, failure and safe maintenance. Semantic priority is integrity/result → lethal danger → boss/milestone → audience → tactical → ambience.

## Audio implementation rules

- synthesized/provenance-safe cues in the software candidate;
- voice cap, dedupe and per-cue cooldown;
- adaptive state hysteresis and quiet contrast;
- music ducking under critical SFX;
- user-gesture resume and explicit audio status;
- visual/caption alternative for every critical cue;
- audio process failure never changes authority.

## Status

Phase 3 implements the Canvas/Web Audio browser source and representative capture tests. Phase 1 exposes semantic state/events needed by that layer but makes no visual-completion claim.
