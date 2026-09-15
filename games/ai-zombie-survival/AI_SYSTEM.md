# AI System

AI is deterministic and local. Survivor intent is recalculated on a fixed cadence from health, threat, role, ammunition, damaged defenses and available loot. Zombie targeting chooses the nearest living survivor; movement uses pursuit/wander modes plus local separation to reduce impossible body overlap. No remote model call is required for continuity.

The AI state is directly mapped to animation poses so text never substitutes for behaviour.
