# AI Dungeon: Endless Adventure — Production Design

## Product decision

Game 9 is a deterministic autonomous tactical roguelite for continuous livestream viewing. One fixed-step runtime owns authoritative truth. Presentation consumes immutable public snapshots and semantic events. Viewer input enters only through validated, bounded, replay-safe commands. Remote models, provider SDKs, storage, rendering and audio are never required for gameplay continuity.

The design reuses the strongest Autonomous Snake patterns: named seeded randomness, versioned configuration, pure rule reducers, bounded AI, deterministic replay, automatic lifecycle transitions, verified snapshots, semantic audiovisual cues, safe audience influence, health probes and evidence-gated release claims.

## Viewer promise

Viewers watch Astra, the Wayfinder descend a cursed endless dungeon, fight readable monsters, assemble a build through meaningful relic choices and survive escalating chapter bosses. They return because every floor changes Astra's route, resources, build and record depth.

The audience may influence eligible blessings, routes and complications, but cannot force victory, death or a record.

## Creative pillars

1. **Visible intelligence:** Astra exposes a concise goal, intent, confidence and plan-change reason. Movement, combat, retreat, healing and loot choices must look purposeful.
2. **Build attachment:** weapons, relics, companion spirits and temporary boons create a recognisable strategic identity. Every reward creates a trade-off and every stack is capped.
3. **Fair endless discovery:** floors are constructively connected, objectives are reachable, hazards preserve a safe mandatory route, repairs are deterministic and failed seeds remain reproducible.
4. **Broadcast contrast:** exploration, anticipation, skirmish, crisis, recovery, reward, boss, result and restart use distinct visual and audio states. Constant spectacle is prohibited.
5. **Honest resilience:** optional services degrade safely. Integrity failures quarantine authority instead of silently continuing.

## Core loop and progression

The moment loop is observe, select one legal action, resolve movement/combat/interaction and emit semantic feedback. A floor requires finding a sigil, unlocking a descent gate and overcoming its guardian. Every fifth floor ends a chapter with a boss and one of three major relic choices. Runs end through death or retirement, show cause and records, then restart automatically.

Floor depth is the primary progress measure. Health, threat tier, gold, relic build, boss progress and record comparison are secondary.

## Dungeon, characters and combat

Each odd-sized grid floor uses independent streams for topology, objectives, encounters, hazards, rewards and cosmetic dressing. Generation creates connected rooms and corridors first, then entrance, sigil, locked gate, shrine, chest and boss room with route-separation guarantees. Validation proves entrance-to-sigil and sigil-to-gate reachability. Attempts and repairs are bounded; a versioned safe floor is the observable fallback.

Astra has a hood, lantern core, directional weapon, health ring and intent marker. Enemy silhouettes communicate behaviour without relying on colour: Mireling swarm pursuer, Bone Warden shield controller, Ember Seer ranged caster, Void Hound flanker, Reliquary Mimic ambusher and large multi-phase chapter bosses.

Authority uses integer grid combat and stable entity order. Actions are move, melee, ranged, guard, heal, interact, descend and wait. Damage, armour, energy, cooldowns and telegraphs use integer arithmetic. Health, energy, gold, potions, relics and essence have explicit sources, sinks, caps and event trails. No persistent power carries between runs.

## Autonomous AI

The policy stack is legality/integrity filtering, immediate reflexes, tactical utility scoring, bounded pathfinding, strategic goal selection and deterministic emergency fallback. Observations contain only visible cells and bounded remembered public information. Search nodes, path length, history, decisions and replans are capped. Stuck, oscillation, no-progress and stale paths are detected. Public intent is templated; hidden reasoning is never exposed.

## Audience, presentation and audio

Eligible effects are a relic vote, next-floor route modifier, one-room reveal, capped shield, telegraphed elite-for-reward encounter, cosmetic theme and bounded Chat-vs-AI challenge. Requests are validated, moderated, rate-limited, idempotent, scheduled, auditable, capped and expiring. Effects that create unavoidable terminal harm, guaranteed success or stale-target mutation are rejected. Zero-audience mode remains complete.

The 16:9 browser source uses a dominant dungeon canvas, vector silhouettes and restrained HUD. Priority order is floor/objective/health/danger, then build/intent/boss/record, then bounded event feed/audience/system health. Reduced-motion removes shake, parallax, pulses and nonessential particles. Colour-safe shapes and captions carry critical meaning.

Web Audio synthesises semantic movement, combat, damage, heal, loot, sigil, gate, boss, milestone, audience, result and integrity cues. Voice limits, cooldowns, deduplication, ducking and peak control are explicit. Audio failure cannot affect authority.

## Architecture and phases

```text
validated config + seed + normalized commands
  -> DungeonRuntime (single authority)
  -> generator + AI policy + rule reducer + progression
  -> semantic events + checksums + snapshots
  -> immutable public render snapshot
  -> browser UI / audio / captions / analytics adapters
```

Lifecycle states are running, floor-result, chapter-result, run-result, intermission and quarantined. Six phases deliver: deterministic foundation; autonomous RPG; broadcast UI/audio; audience interaction; reliability/operations; release governance.

Authoritative ticks perform no network or filesystem I/O. Generator attempts, entities, inventory, event feed, remembered cells, queues, audio voices, particles and retries are capped. Identical version/config/content/seed/commands must produce identical checksums across uninterrupted and restored runs.

Software completion targets truthful R4. R5 and `productionReady:true` remain blocked until exact deployed-candidate evidence includes credentialed providers, production-reference capacity, independent review, witnessed recovery/rollback drills, a real 72-hour endurance run and a guarded seven-day canary.

## Forbidden shortcuts

No ambient randomness or wall-clock authority; no renderer/provider mutation; no remote-model dependency in the hot path; no unbounded procedural retry or search; no colour-only danger; no hidden rubber-banding; no paid guaranteed outcomes; no unlicensed release assets; no synthetic evidence represented as production evidence.