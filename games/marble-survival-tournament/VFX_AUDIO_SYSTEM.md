# VFX and Audio System

## VFX

`arena3d.js` maintains a bounded reusable effect pool sized by quality preset. Semantic presentation events drive effects:

- `physics-contact` → small impact burst and bounded camera impulse;
- `marble-eliminated` → stronger danger burst;
- `marble-qualified` → success burst;
- `shield-recovery` → shield burst;
- `tournament-champion` → championship burst.

Effects never create authority events and never affect collisions. Reduced-motion cuts low-value impact effects.

## Lighting

Each arena theme configures background/fog, key-light tint and a restrained point-light accent. Directional shadows are enabled on balanced/high/ultra presets and disabled on low. Marbles and machinery cast/receive shadows.

## Audio

The recovered runtime contains semantic WebAudio cues for qualification, elimination, shield recovery and championship. Those cues remain functional through the existing `app.js` sound control.

Status: PARTIAL. A full spatial/material audio pass (rolling loops, surface-specific rolling, mechanical beds, wind, adaptive music stems, spatial attenuation) has not yet been implemented and must not be claimed.

## Noise budget

No persistent effect is allowed to obscure route readability. VFX count is quality-bounded and lifetime-bounded; championship ambience is decorative and presentation-only.
