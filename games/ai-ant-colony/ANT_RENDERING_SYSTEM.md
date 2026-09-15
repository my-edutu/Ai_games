# Ant Rendering System

## Representation

Ants are rendered as oriented head/thorax/abdomen bodies with six legs and antennae. Soldier and digger silhouettes can expose mandibles. Role differentiation is intentionally morphological and behavioral rather than neon color coding.

## Motion

The presentation caches each visible ant's previous public position. Heading derives from actual public movement; gait phase derives from authoritative tick plus stable ant ID. The cache is visual-only and pruned when entities disappear.

## LOD

- Near: full body, six segmented legs, antennae, optional mandibles and carried food.
- Mid: simplified three-part body and legs.
- Far: compact two-lobe insect silhouette preserving density without pretending entities were deleted.

All simulation ants remain authoritative. LOD changes only rendering complexity.

## Queen and brood

The queen is rendered in the authoritative nest-center area with a larger body, legs/antennae, subtle breathing and danger emphasis. Brood is visible around her as egg/larva/pupa-like forms. Where the public snapshot exposes only aggregate brood count rather than per-stage entities, stage appearance is explicitly presentation-derived and does not feed back into simulation.