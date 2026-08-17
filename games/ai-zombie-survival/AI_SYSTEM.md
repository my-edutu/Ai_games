# Autonomous AI System

The policy stack is legality/safety, immediate reflex, role utility, team strategy, deterministic fallback and stuck/oscillation recovery. Scout, Builder, Medic and Guard receive only allowed serializable observations. Each decision has fixed candidate/search limits and stable tie-breaking through the `survivor-ties` stream.

Team strategies are `fortify`, `stockpile`, `balanced`, `rescue` and `last-stand`. Public intent exposes current goal, concise action, confidence band and plan-change reason—never hidden chain-of-thought. Remote inference is optional cold-path experimentation only and can be absent for an entire run without affecting continuity.
