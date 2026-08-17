# AI Dungeon Operations Runbook

## Normal state

Verify one active writer epoch, advancing simulation sequence, recent verified snapshot, fresh render output, intended audio state, bounded audience/journal queues and no integrity quarantine. Audience providers are optional; Astra must continue autonomously during provider loss.

## Incident priorities

- Integrity/checksum/snapshot uncertainty: disable interactions, fence the writer, show the safe recovery scene, preserve evidence, restore newest verified compatible snapshot; if none exists, quarantine and start a fresh run rather than falsifying continuity.
- Simulation stall: fence current writer, check crash breaker, restore verified authority only after acquiring a new epoch.
- Frozen/black renderer: keep authority running when healthy, show safe scene, restart renderer, rebuild from latest public snapshot, verify freshness before resuming normal capture.
- Audio failure: mute/restart audio independently; critical meaning remains visual/captioned.
- Provider/moderation outage: reject affected input and continue zero-audience autonomous play.
- Queue/memory pressure: disable lower-priority audience/cosmetic work first, reduce presentation quality, then controlled component restart. Never change game rules silently.

## Operator controls

Use typed role-controlled controls only: disable/enable audience, capture a verified snapshot, or enter a safe operational intermission. There is no arbitrary health, score, enemy, loot or outcome editor.

## Recovery verification

A recovery is complete only after snapshot compatibility/checksum passes, restored authoritative checksum matches the accepted recovery point, the new writer epoch fences the old worker, presentation is rebuilt, and output freshness is verified.
