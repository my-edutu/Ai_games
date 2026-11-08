# D04 — real-browser visual lifetime and blocked-frame cleanup

**Status:** independently reviewable presentation fix. Genuine game audiovisual acceptance remains **UNVERIFIED**.
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Parent:** `8366a899516b754e37de28158c8d7186944a0ccd`. **Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.

## Source-identified defect
The legacy D04 VFX pool advanced visual lifetime using the game's **capped animation delta** (no more than 50ms). A genuine 720–900ms blocked browser/WebGL frame therefore aged an HP-confirmed shard or unconfirmed arrow by just 50ms. The audio coordinator already used raw browser time and suppressed stale combat transients. The mismatch could present lingering silent debris or obsolete bolts after a stall, falsely implying a slower movement. This is diagnosed from source, **not** observed in recorded gameplay.

## Implementation
`physical-feedback-visuals.js` now advances every retained visual's age using the measured raw browser frame interval, bounded at 0.70s, the maximum permitted effect lifetime. A malformed/zero/non-finite interval expires old visuals conservatively. The 50ms animation timestep, bone sampling freshness gate and actual authoritative simulation are unchanged. Expiry never produces an arrival effect, damage, source identification, sound or new particle. The existing seven geometry/material/instancing pools, at most 102 reserved instances, and single noise buffer/eight-voice original WebAudio budget remain unchanged. Legacy spectator is the default; the coordinator only exists under `?feedback=d04`.

**Tradeoff:** on a software-WebGL stall, an effect may be dropped instead of being visibly replayed late. This is deliberate for cosmetic feedback. Actual HP and threat information remain authoritative and readable through existing game/UI systems. Newly emitted effects coincident with a stalled interval may also be dropped: acceptable pending authentic playback review.

## Test-first evidence, scope and limitations
Three new detached Node regression cases were **RED (0/3)** on the earlier packaged D04 v2 visual module, then **GREEN (3/3)** after the same age-clock correction. The detached prior D04 v2 realism suite and these tests completed **14/14** locally with Node 22. This detached module is **older** than current GitHub D04; it is **not** a clean full-branch test run. The three focused contracts are appended to `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` for worktree/CI validation and have **not run against the committed latest source** because the coding/browser tunnel is unavailable.

Required:
```sh
node --test tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
Then compare genuine frozen BEFORE vs D04 clips at the same seed/run/floor/tick/checksum from three actual camera directions, desktop 1440×900 and mobile 390×844, with opt-in PCM: missed swing, confirmed impact, block, dodge, arrow, spell, and Warden warning/release/recovery/counter. Include deliberate 300ms and 900ms WebGL stalls, background/foreground, audio mute/reload, reduced settings, restart, and a 20-minute resource soak. Confirm effects vanish after the stalled submission and neither sounds nor effects fabricate contact. No recorded clips or true audiovisual sync measurements are available for this commit.

## Review, rollout and rollback
Review this small presentation-only patch for source correctness, then verify in a running game. No gameplay/replay changes, network calls, new audio assets, draw calls or visual allocation. No access to secret state. Revert just this commit on regression. **Next dominant unresolved weakness:** the realistic sword trail still uses observed wrist motion rather than real blade-tip geometry; genuine moving gameplay and an installed GLB are required before claiming physical parity. Also inspect the visual/audio receipt boundary during 150–350ms frames to ensure a newly expired cosmetic doesn't leave a misleading late sound.
