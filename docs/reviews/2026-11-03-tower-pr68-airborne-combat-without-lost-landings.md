# Infinite Tower Climb — airborne combat without sacrificing the landing (PR68)

**2026-11-03 · SAME unfinished transformation.** Baseline `1731b380851162741761c5569e2bc152a0869ca9` remains frozen. The first connected code slice is committed at `1bc3c8ef9482f88ed77816f36b38d85c48d60b91`; this is **not** proof of a visually better game or any Gauntlet PASS.

## Systemic problem in the existing real game

The autonomous pilot already has a physically grounded air-braking controller, earned double-jump/boost and present-state safe landing lanes. But the global `nearbyEnemy` branch ran **before** the airborne landing controller. A real opponent within melee distance could replace a braking/landing decision with a horizontal attack pursuit while the climber was still over open air. This disconnects movement, contact, animation and combat: attacking looked heroic for one instant, yet could drive the character away from its actual supported destination. A whole climb→combat→landing flow requires traversal and fighting to coexist without one silently disabling the other.

## Connected playable intervention

- Tactical v2 no longer lets ordinary near-body pursuit steal airborne trajectory decisions. Ground combat, guardian gate combat, real danger reflexes, current supported routes, moving decks, safe landing lanes, recovery jumps and physical boosts retain their existing precedence. `tactical:false` is unchanged for historical replay.
- **The same genuine airborne landing decision** can now include an earned Pulse Shot or physical melee against a currently observed same-floor foe. Real enemy collider height and horizontal melee reach control a strike; real centerline projectile geometry, earned upgrade, cooldown and current/future-physics facing alignment control a shot. No new attack force, hit, upgrade, enemy forecast, invulnerability, teleport, fake result or RNG.
- No air combat when a recovery jump or dash takes traversal priority. The choice keeps exactly the source steering, jump and dash values that would have been issued without an enemy. Source authority produces the hit/miss, projectile, recoil, sound and existing 3D ribbon. The public render snapshot and minimal HUD are unchanged.
- Existing articulated 3D airborne/attack posing, action cue, original projectile mesh/travel ribbon, opt-in event sound and camera source threat framing provide visible effects from the **same** actual actions. This is not a screenshot-only presentation change.

## Engineering contract & current evidence

A new source-runtime test file `tests/phase2/tower-airborne-combat-landing.test.cjs` verifies (1) an actual local source decision keeps all landing controls while emitting the real authoritative projectile, (2) an earned ranged shot works without a fake melee hit, (3) wrong-height, unearned or cooldown-blocked abilities stay off, and (4) the historical branch retains its own old near-body behavior. Static review of the live code is possible; this environment **cannot execute the repository or watch actual video**, because the shared coding/browser tunnel returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`. Tests are **not** asserted green; exact-source CI remains unverified.

The predecessor capture workflow `41650913522` was still queued/in progress when inspected and records candidate source `16b11cc`, not this change. Earlier source `16b11cc` quality workflow `41650913503` shows **cancelled**, not success. The new `1bc3c8e` code has **no** source-pinned normal-speed ≥60-second desktop+390px portrait ascent/danger/outcome clips, no independent full-motion event-matched comparison with frozen baseline, no five blind randomized critic votes on LOOKS/FEELS/PLAYS, no real supported-device p50/p95/p99 frame times/memory and no evidence-based whole-game acceptance. **Quality: NOT EVALUATED (0/5 on each pillar).**

## Next coherent transformation work, not a new micro-milestone

Capture the revised source, observe actual 20Hz autopilot landing → fire/contact → enemy damage or miss → safe deck landing in desktop/portrait real gameplay. Reject this intervention if a source campaign shows worse floor completion, landing success, health loss or mobile framing. The visual centerpiece must remain a readable original 3D climber, enemy, supported destination and guardian mechanism without additional HUD clutter. Then capture the authentic full run to a real result/restart and submit shuffled A/B full-motion recordings to five genuine independent critics. Do not reset baseline, merge, deploy, call isolated CI a win, or edit PR58.
