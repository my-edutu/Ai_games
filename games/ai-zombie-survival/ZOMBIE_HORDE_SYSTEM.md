# Zombie Horde System

Zombies use wander, pursue, attack, stagger and dead states. Spawn positions use deterministic golden-angle rings plus seeded jitter to prevent identical overlap. Local spatial separation resolves crowd congestion. Night applies a bounded speed multiplier. Reinforcement hordes spawn every 45 simulated seconds while the run continues.

The 250-zombie sustained test confirms finite coordinates and bounded event memory.
