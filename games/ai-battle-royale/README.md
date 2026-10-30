# LAST LIGHT — AI Battle Royale

Game 6 is an autonomous, original 3D battle royale for spectators. Twelve combatants loot, navigate cover, engage visible enemies and evade a shrinking storm on Cinder Coast. The last survivor wins; simultaneous elimination produces a draw. Results lead into an automatic next match.

## Run

```sh
npm ci
npm run royale:stream
```

- Spectator game: `http://localhost:4177/royale/`
- Live development review: `http://localhost:4177/royale/dev/`
- Health: `/royale/health`; immutable view: `/royale/state`.
- Optional host configuration: `PORT` and `ROYALE_SEED`. There are no paid services or external asset requests.

```sh
npm run test:royale
npm run test:royale:browser
npm run royale:headless
```

## Watch

Director chooses active fights. Follow locks a contender. Tactical shows the arena and storm. Select a roster entry or use the next-contender button / Right arrow. Drag the arena to orbit; scroll to change distance. H toggles a clean broadcast feed; M toggles sound. Settings offer reduced camera movement and lower graphics load. Audio begins only after a user gesture. Software graphics automatically use a lower-load tier with simpler lit materials and reduced rendering resolution. High quality restores the original PBR materials. Sustained software-render performance is currently inadequate in the review environment; a hardware-accelerated browser still requires target-device verification.

All controls affect presentation only. The server advances fixed logical ticks independently of browser frame rate, audio, cameras and viewer connection. No control allows a spectator to change a result.

## Current scope

The game includes a complete playable-by-AI loop, original procedural environment and articulated combatants, four weapon behaviors, health/shields, finite medkits, loot, cover/LOS, match results, renderer reconnection, checkpoint serialization/validation and seeded replay tests. Weapon magazines replenish on reload without a finite reserve. The world uses planar movement with solid rectangular structures; traversable building interiors, jumping, vehicles and multiplayer human control are not implemented.

This is a new Game 6 implementation under active Gauntlet review. It has **not been demonstrated to beat Fortnite, Apex Legends or PUBG**, and it is not certified for production livestream operation. See `PRODUCTION_READINESS.md` and the development progress page for evidence and gaps.
