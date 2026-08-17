# Autonomous AI System

The controller observes only validated traffic state: incoming queues, vehicle class and wait, signal age, closures, and bounded audience policy state. It does not access future RNG draws or hidden provider information.

Decision order:

1. protect minimum and maximum green legality;
2. calculate deterministic north–south and east–west pressure;
3. choose hold or switch using stable tie rules;
4. route new demand through bounded congestion-aware search;
5. replan stalled or closure-affected vehicles within the route budget;
6. fall back to safe fixed-cycle behavior when no bounded route or pressure decision is available.

Public intent is a short validated summary of goal, action, reason, and confidence. It is not hidden chain-of-thought.
