---
name: boss-encounter-design
description: Use when creating or reviewing boss identity, arenas, phase transitions, attack patterns, telegraphs, adds, safe zones, camera, lighting, music, fairness and boss-specific QA.
---

# Boss Encounter Design

## Objective
Create bosses that are mechanically, visually and audiovisually distinct from normal enemies rather than scaled-up stat blocks.

## Invariants
- Every dangerous attack has a learnable telegraph and valid response where design intends one.
- Boss phases change behavior/pattern composition, not just HP/damage.
- Arena geometry and camera preserve visibility of the hero, boss and relevant hazards.
- Difficulty comes from pattern/composition/escalation before raw health inflation.
- Boss logic remains deterministic under identical inputs/seeds.
- Music/light/camera effects consume boss state and never modify authority.

## Boss package
For each boss define silhouette, fantasy, arena, locomotion, base attacks, signature attacks, telegraphs, recovery windows, phase triggers, add/hazard rules, counterplay, camera plan, lighting plan, music states, defeat choreography, reward beat and reduced-motion/accessibility treatment.

## Review gate
Pass only when a player/viewer can distinguish the boss from elites without HUD, predict dangerous attacks from telegraphs after learning them, understand phase changes, see cause of damage/death and experience a substantially different encounter from ordinary combat.
