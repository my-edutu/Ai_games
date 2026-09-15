# VFX and Audio System

## Visual effects
The first rebuild pass keeps VFX bounded and gameplay-readable. Lighting/fog are shader driven; traps have geometric spike telegraphs; threats receive danger color; keys and exits use restrained objective contrast. The renderer avoids decorative particle spam and does not fabricate events.

## Existing audio authority
The rebuild preserves the existing presentation audio/caption pipeline supplied in `frame.audio`. Captions continue to come from the public presentation controller and are displayed in the broadcast shell.

## Spatial intent
The WebGL world now provides world-space positions for explorer, keys, doors, traps, threats and exit. This creates a safe future seam for positional Web Audio without changing authoritative simulation state.

## Current acceptance boundary
This pass does **not** claim a complete spatial-audio library or production particle system. Existing audio/caption behavior is preserved; richer positional footsteps, door/key/trap sounds and reusable particles remain incomplete until implemented and verified in the running browser source.

## Safety
Audio/VFX may clarify an event that exists in public state. They may not create false hazards, fake pickups, fake failures or fake victories.
