# Product Requirements — AI Dungeon

## Viewer promise
Watch three autonomous adventurers fight, heal, loot, survive and push through ever deeper fantasy dungeons, without player input.

## Goals and acceptance
- **G1 playable 3D:** streamed web client must display real 3D world, characters and combat-state movement. Chromium test must observe an active WebGL canvas and increasing authoritative tick.
- **G2 endless structure:** seeded dungeon generation must create a reachable exit for every seed tested; valid boss/loot placement and no unbounded retries. Node seed corpus must pass.
- **G3 character agency:** roles visibly differ, choose legal movements/combat/heals, and expose an accurate public intent. Must run without external model APIs.
- **G4 replay safety:** identical seed and tick sequence reproduce checksums; saves reject tampering and restore to identical future events.
- **G5 continuously viewable:** clear goal, current floor, party health, danger, and recent events on desktop and mobile. Reduced-motion and view recovery are required.
- **G6 visual quality:** independent critic captures original gameplay and compares side-by-side with *actual* Path of Exile 2 footage at comparable scene and camera scale. A screenshot-only claim is insufficient; matching quality remains an open target.
- **G7 operational delivery:** versioned production controls, persistence, uptime/soak, telemetry/alerts, broadcaster output, audited external integrations and deploy rollback required prior to R5.

## Non-goals for the first slice
Claims of AAA parity, full character rigging, mocap, multiplayer, voice-over, financial transactions, model-driven NPCs, public cloud hosting and production readiness.
