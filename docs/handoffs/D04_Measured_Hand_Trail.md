# D04 — measured right-hand motion instead of a synthetic sword crescent

Status: **ISOLATED CANDIDATE / REAL GAME CAPTURE UNVERIFIED**

Base inspected: `b5b0135208c1fe95a2a25f246c7fa42825592667`; frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. No authoritative gameplay, camera, rigs, lighting, other branches or legacy spectator default were changed.

## Dominant defect and correction

The earlier D04 blade was a pre-curved mesh, rotated by an arbitrary elapsed-time roll whenever a public attack happened. Even sampling a live hand at the mesh origin left a floating crescent independent of hand motion. The replacement starts with a hidden slot, samples the actual authored right-hand bone across consecutive rendered frames, subtracts root translation, and draws only a slim tapered local segment measured at 0.025–0.38m during an accepted <=60ms step. It does not derive an attacker, contact or injury. An unavailable, stationary, stale or wrong-cell hand renders no sword streak; the truthful *attempted-swing* audio may still occur after real render submission if opted in. The implementation follows the **hand**, not a verified physical sword tip.

## Boundaries and tests

Retains seven instanced VFX pools, 102 reserved instances (within the 104-instance acceptance ceiling) and at most seven effect draw calls. No per-frame geometry, new materials, lights, sockets, buffers or character rig writes. Trail sampling is bounded to eight active slots; samples are read-only and validated against same-cell active attack/action tick. Old HP-damage proof, audio frame receipts, opt-in/mute, reduced-motion/flash, dedupe and scene cleanup remain unchanged.

TDD: two isolated pure hand-path contracts were first run **RED** locally without the module (ERR_MODULE_NOT_FOUND), then **GREEN 2/2** with the new pure module on Node 22. The repository's broader existing suite, build and Playwright were **not run** because the shared coding tunnel was offline. Integration test fixtures now require a real mocked moving hand to authorize a visible trail; this new fixture has **not** been executed within the full repository, and must be checked by CI or a live worktree.

## Required genuine acceptance

Obtain matching live Dungeon `/dungeon` vs `/dungeon?feedback=d04` footage at three viewpoints, 1440×900 and 390×844, including real misses and HP-confirmed hits, block, dodge, arrow, spell, Warden tell/release/recovery/earned counter, run restart, audio opt-in/mute, reduced settings, WebGL recovery and 20-minute stress. Inspect when real hands barely move, and whether missing authored rigs make the feedback too quiet. Capture actual canvas and opt-in sound bus and compare clock alignment; an offline WAV audition is not proof. Do not assert Diablo IV parity, visual transformation or production readiness.

Rollback: revert this commit on this branch. Next dominant weakness: accurately locating the real blade-tip/weapon asset rather than using hand movement as a proxy, then assessing physical impact sync in genuine moving footage.
