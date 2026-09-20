# Product Requirements

## Goal
Deliver a cinematic autonomous 2.5D survival experience where AI survivors visibly scavenge, defend, fight, retreat, heal, and attempt to survive escalating zombie pressure in a ruined modular city.

## Acceptance
- Fixed-step deterministic authoritative simulation.
- Six survivor roles with visible action-state presentation.
- Separated zombie crowd movement, pursuit, attacks, barricade damage, stagger/death states, and deterministic horde reinforcement.
- Physical buildings, resources, barricades and safe-house representation.
- Day/dawn/sunset/night presentation and bounded weather visuals.
- Compact HUD, 16:9 responsive stream layout, HUD-hidden mode.
- Camera director observes state but cannot mutate it.
- Viewer influence is bounded, idempotent and audited.
- 25/50/100/250-zombie stress validation.
- Tests/build must pass before completion claims.
