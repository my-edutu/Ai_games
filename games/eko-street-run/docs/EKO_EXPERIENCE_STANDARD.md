# Eko Run Experience Standard

## Purpose

This document is the project-specific quality constitution for Eko Run. It converts the reusable `platformer-experience-review` skill into measurable Eko Run gates. It applies to every playable vertical slice, level, movement change, character/costume change, camera change, hazard family, major VFX/audio change, and performance tier.

## Experience Promise

Eko Run must feel like a precise, expressive, highly readable platformer whose world could only be inspired by Lagos. Lagos identity must strengthen gameplay rather than excuse poor readability or unfair chaos.

## Mandatory Representative Moments

Every phase review includes evidence for:

- first 30 seconds of a fresh run;
- walk/run acceleration and full-speed traversal;
- single jump, chained jumps, edge jump, large-fall landing, slide/dodge, hit, recovery, death, and restart;
- danfo encounter and Molue-style large-vehicle encounter;
- pothole/open-drain section;
- dense market/crowd section;
- rain/flood or low-visibility section when implemented;
- street argument/fight-crowd disturbance when implemented;
- every shipped costume silhouette;
- desktop, mobile viewport, and lowest supported presentation tier;
- AI/autoplay mode when implemented.

Review normal-speed footage first. Use slow motion/frame stepping only to diagnose causes.

## 100-Point Experience Score

| Area | Weight | Evidence expectation |
|---|---:|---|
| Movement & controls | 15 | acceleration, braking, jump arc, air control, buffering/coyote behaviour, landing/recovery consistency |
| Character animation | 12 | anticipation, readable poses, weight, transitions, cloth/costume response |
| Character & art direction | 10 | silhouette, costume distinction, visual coherence, respectful cultural design |
| Camera | 8 | look-ahead, landing visibility, hazard revelation, shake/FOV discipline, no camera-caused failures |
| Level & obstacle design | 12 | route choices, rhythm, spacing, escalating combinations, recoverability |
| Readability & fairness | 10 | cues, reaction windows, avoidability, collision truth, visual hierarchy |
| Lagos authenticity & worldbuilding | 10 | behavioural/spatial identity, environment, traffic, soundscape, signage/props, non-generic cultural detail |
| Game feel, VFX & audio | 8 | anticipation-impact-recovery, hierarchy, material feedback, restrained density |
| Emotional pacing | 5 | calm, anticipation, escalation, crisis, relief, reward/failure contrast |
| Spectator & replay value | 5 | five-second comprehension, near-miss clarity, satisfying failure/restart, record visibility |
| Accessibility & mobile | 3 | critical cue alternatives, reduced-motion/flash treatment, mobile legibility |
| Performance consistency | 2 | frame-time stability and graceful fidelity degradation without control/readability loss |

Scores are diagnostic. A build with a stop-ship defect fails regardless of total.

## Hazard Fairness Contract

For each hazard family record:

- first visible/audible warning cue;
- first meaningful decision point;
- expected player speed range;
- minimum reaction window;
- valid responses;
- collision volume and authoritative consequence;
- recovery route if a recoverable mistake occurs;
- combinations that are forbidden because they remove a skilled response;
- mobile/low-tier cue equivalence.

“Lagos traffic is chaotic” is never evidence that an unavoidable hit is acceptable.

## Camera Standard

The camera must show the information needed before player commitment. Log and investigate every suspected camera-caused failure.

A failure counts as camera-caused when the relevant landing surface, hazard, route transition, safe lane, or state change was not reasonably visible before the player had to commit, or when shake/FOV/camera lag materially prevented interpretation.

Camera spectacle is subordinate to control readability. Cinematic framing may intensify a resolved moment but may not hide an unresolved gameplay decision.

## Character & Costume Standard

Every costume is reviewed in idle, acceleration, run, takeoff, ascent, apex, descent, landing, slide/dodge, hit, recovery, and failure poses.

Yoruba-inspired agbada/fila, Igbo-inspired isi agu/red-cap styling, Hausa-inspired baban-riga/embroidered-cap styling, and contemporary Lagos clothing must:

- have distinct, respectful silhouettes and material behaviour;
- preserve the same authoritative collision truth unless a documented gameplay mechanic explicitly says otherwise;
- keep hands/feet/body direction readable during fast traversal;
- avoid cloth or accessories obscuring landing/contact information;
- avoid costume animation clipping that materially damages character quality;
- remain legible against bright, dark, rainy, crowded, and high-motion backgrounds.

## Lagos Authenticity Standard

Lagos authenticity is judged by more than labels, flags, colour schemes, or isolated props. Reviewers look for coherent combinations of road geometry, drainage, traffic behaviour, bus forms, market activity, building/street proportions, weather response, pedestrian motion, signage language, soundscape, and traversal situations.

Avoid generic “African city” shorthand, ethnic caricature, poverty-as-spectacle, or treating disorder as the only Lagos identity. The world should also communicate energy, commerce, fashion, humour, ingenuity, architecture, music, movement, community, and modern city life.

## Visual Hierarchy Standard

At gameplay speed, the priority order is:

`player → safe/possible route → immediate danger → reward/progress → world detail → decorative ambience`

If crowd density, vehicles, lighting, weather, VFX, signage, UI, or costumes invert that hierarchy, reduce or reorganize presentation density before adding more effects.

## Movement & Animation Standard

Movement changes are judged by player intention and consistency rather than visual smoothness alone. Review acceleration, deceleration, jump timing, apex control, air correction, collision response, landing compression, stumble/recovery, edge cases, and transitions between authored states.

Animation may exaggerate anticipation and impact, but it may not create deceptive timing or delay authoritative control without a deliberate, tested rule.

## Performance Standard

Performance fallback degrades in this order unless evidence justifies another order:

1. ambient particles and decorative crowd density;
2. distant animation and secondary shadows;
3. reflection/post-processing quality;
4. non-critical environmental detail.

Do not degrade input sampling, authoritative tick rate, collision correctness, hazard cues, camera information, or critical animation readability merely to preserve decoration.

## Phase Gate / Stop-Ship

The phase fails when representative evidence contains any of the following:

- ordinary unavoidable or unreadable hazard;
- camera-caused failure;
- frame-rate-dependent gameplay outcome;
- movement/animation transition that materially violates player intent;
- costume or VFX state that destroys the playable silhouette;
- scenery/UI/weather/crowds hiding the safe route or hazard cue;
- inaccessible critical cue without a supported alternative;
- performance spike that materially changes control feel;
- Lagos identity represented mainly through generic stereotypes or superficial reskinning;
- evidence limited to screenshots, trailers, or one showcase run.

## Required Finding Format

For every material issue write:

`Moment → Expected experience → Observed experience → Why it succeeds/fails → Severity → Exact improvement → Verification test`

Severity is `stop-ship`, `major`, `moderate`, or `minor`.

## Evidence Bundle

Each phase stores:

- representative capture list and build/config/seed identifiers;
- normal-speed review notes;
- slow-motion diagnostic notes where used;
- hazard fairness table;
- camera-causality log;
- costume/silhouette review;
- Lagos authenticity review;
- mobile/low-tier captures;
- frame-time summary;
- 100-point score breakdown;
- stop-ship verdict;
- regression tests/checks required for every resolved major or stop-ship issue.
