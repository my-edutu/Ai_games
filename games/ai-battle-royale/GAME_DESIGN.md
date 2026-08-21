# Game Design — AI Battle Royale

## Nested loops

- **Moment:** observe, choose one legal action, receive immediate movement/combat/resource feedback.
- **Tactical:** acquire a useful loadout, take or avoid a fight, move toward cover and zone safety.
- **Match:** survive successive zone phases until one contender remains.
- **Stream:** compare champions, eliminations, final-circle size, archetype performance and records across automatic matches.
- **Community:** vote on bounded global conditions without selecting a winner.

## Progress currencies

Primary: survivors remaining. Secondary: zone phase, contender eliminations, health/shield and match elapsed ticks. These counters are authoritative projections; no presentation interpolation changes records.

## Escalation

Zone radius, outside-zone damage, resource scarcity, cover concentration and encounter density increase in declared phases. No-progress escalation advances future zone pressure rather than secretly damaging a selected contender.

## Setback and recovery

Damage, shield loss, ammunition depletion and poor position are causal setbacks. Recovery uses collected medkits/shields, cover, disengagement and symmetric Medic Mist. There is no hidden immunity or rescue.

## Terminal flow

One survivor produces victory. Zero survivors or exact hard-limit score tie produces draw. Integrity failures produce quarantine, not defeat. Result presentation includes decisive cause, champion/finalists, records, short recap, next seed preview and automatic restart.

## Dramatic patterns

- Early aggressor lead → resource depletion → tactical retreat or collapse.
- Quiet scavenging → zone compression → multi-agent middle fight → unlikely survivor.
- Ranger control → cover disruption → close final circle → Vanguard comeback.
- Tactician low-risk survival → late resource shortage → decisive positional duel.
