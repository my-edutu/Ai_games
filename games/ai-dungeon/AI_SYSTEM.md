# Autonomous AI Contract

Decisions are made during fixed logical steps and do not consult a network service. Agents process in stable party/enemy order. Party units prioritize threatened nearby enemies, the mystic performs periodic low-health healing, followers move toward the leader and the leader pursues the Warden then portal. Enemies pursue only within a limited distance; attack cooldowns bound frequency.

Movement uses a shortest-path search over an explicitly navigable seeded map. Attack range is capped; ranged attacks require cardinal corridor visibility. There is no hidden teleport, collision bypass or player intervention. Public `intent` is a templated description of the actual behaviour, not unfiltered internal reasoning.

Current implementation limitations: no fog-of-war/private belief state; no learned tactics, advanced squad coordination or long-horizon economy policy. All behaviour remains available if optional model services are absent.

Future critic metrics: percent of ticks with legal actions, retreat/survival rate, healing effectiveness, repeated-position tail, strategy diversity, Warden kill distribution and progress per 1,000 ticks; evaluate with a fixed seed corpus.
