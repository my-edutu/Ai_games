# D04 — Drawn HP Capacity Identity (15 November 2026)

**Status:** one isolated causality bug corrected and native-verified. Full audiovisual combat realism remains rejected.

## Boundary and evidence inspected

- D04 branch only; normal spectator stays default, opt-in remains ?feedback=d04. No main, PR #49, authoritative Dungeon, rig, camera or lighting edit.
- Branch starting point: 3ce9568df6622907ce4b063c059badcb658121e0. Frozen BEFORE: 281735d0910c6b2443648af976003d50412ee324.
- Actual six-viewpoint Chrome clips from the earlier run: desktop 1440×900 and mobile 390×844, cinematic/tactical/chase. Twelve frame-acknowledged authority states per view, five shared HP-loss ticks, zero drawable HP-loss matches in all six.
- Prior authentic Chrome workflow 43707334937 failed AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED. Verified HP injury receipt was stale-frame. Original video/audio WebM tracks are not evidence of audible PCM sync.

## Test-first regression and correction

Previously, drawnHpMatchesObservedTransition accepted a body when drawn.hp equaled current public HP, without comparing the drawn health capacity. A recycled or invalid rendered actor could therefore receive authentic injury fragments despite mismatched maxHp.

1. RED commit 856939b4a23a8242e0dd2e98dabda6002367626f adds drawn/interpolated checks for maxHp 21, 0 and undefined against a 20-max-HP victim. The genuine native contracts job in run 43712439396 failed the expected assertion: drawn current HP with stale maxHp 21 was accepted (true !== false).
2. GREEN commit 13a9a55259ece509d607a2f62db4117b7a7d718e makes the matching-HP fast path strict on safe-integer equal maxHp in production D04. The legitimate prior-HP cached transition still works.
3. GREEN contracts job in run 43712524049 passed native tests and production build. Its real-browser job was still in progress at authoring; do not claim corrected AV acceptance until separately checked.

## Performance, causality and remaining gates

Only the D04 visuals source and foundation test changed; no new meshes, sounds, pools, allocations, camera or gameplay rules. The seven pools, 102 reserved instances, eight voices, 400ms impact deadline, audio consent/mute, reduced motion/flash, dedupe and teardown safeguards are preserved.

Dominant remaining weakness: the genuine WebGL submission phase can stall for seconds, particularly masking mobile HP effects. Investigate paired actual-game WebGL phase receipts without stretching the deadline or claiming causation from synthetic tests. Warden warning/release/recovery/counter, misses, blocks, dodges, projectile, spells, six-view moving contact+audio alignment and 20-minute soak remain unaccepted.
