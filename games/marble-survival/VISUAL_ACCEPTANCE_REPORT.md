# Visual Acceptance Report

Status: **ACTIVE REBUILD — NOT COMPLETE**

This report intentionally separates implemented code from verified runtime evidence.

## Implemented in rebuild branch
- WebGL2 arena renderer with volumetric sphere marbles;
- real 3D deck, understructure, guard rails and finish gantry;
- 3D representations of authoritative blocks, bumpers, sweepers and pits;
- rolling orientation derived from authoritative marble velocity;
- material lighting, contact shadows and themed round palettes;
- server-directed 3D camera modes;
- event-driven bounded VFX;
- existing Canvas renderer retained as fallback;
- deterministic tournament/physics authority preserved.

## Not yet accepted
- real browser screenshots from this branch;
- measured FPS/memory/draw-call evidence;
- full long-session stability run;
- authoritative vertical gravity / ramps / jumps;
- full obstacle catalogue (pendulums, crushers, conveyors, trapdoors, destruction);
- water/ice gameplay physics;
- replay buffer and replay camera;
- full spatial collision/machinery/rolling audio;
- final podium ceremony and richer intermission transitions;
- three-pass visual critique completed against actual screenshots.

## Completion rule
No unchecked item above may be described as complete until runtime evidence exists. The rebuild should remain draft until browser screenshots and CI validation are reviewed and the remaining acceptance gaps are either implemented or explicitly deferred.