# D04 — Prevent delayed Warden cues from erasing future danger

**Status:** source-level improvement committed for isolated review; genuine Dungeon A/V and native repository integration tests still **UNVERIFIED**.

## Dominant source-identified defect

The earlier D04 change retired every warning signal in the same scene whenever a new warning or authoritative Warden release arrived. A delayed old release could therefore erase a **newer attack's** correctly observed floor markers. Conversely, an older queued warning could arrive after a newer footprint and erase it. This is a causal danger-readability defect found by inspecting the production D04 source, **not** an observed browser clip.

## Correction

- New pure `public/ai-dungeon/warden-warning-lifecycle.js` compares genuine scene identity, Warden actor identity, public observation tick, and public `bossWarning.attackTick`.
- A Warden release retires only warnings actually due by its tick; it never clears future attack windows or other actors' danger.
- An old warning delivered after a newer active footprint is suppressed before touching the signal pool.
- Existing eight signal instances, seven retained VFX pools, 102 instance budget, seven draw-call bound, original audio voices and independent mute/opt-in/reduced settings are unchanged.
- Added `staleWarningCues` metric. No attack, hit, target, HP change, or danger cell is invented. No authoritative source, rigs, camera, environment, or lighting changed.

## Test-first / evidence distinction

A standalone Node harness reproduced **four expected red failures** under the pre-fix same-scene retirement policy. The corrected pure helper then passed **4/4** matching Node cases and `node --check`. Those detached tests exercised the new policy itself, **not the entire GitHub checkout**.

Three additional genuine visuals integration contracts have been appended to `tests/foundation/dungeon-d04-warden-warning-cells.test.cjs`: delayed previous release vs future attack, old queued tell vs newer tell, and same-scene distinct actors. They are **committed but not executed** because the coding tunnel is disconnected and GitHub is unreachable from the independent shell.

Recommended verification on the isolated branch:

```sh
node --test tests/foundation/dungeon-d04-warden-warning-order.test.cjs tests/foundation/dungeon-d04-warden-warning-cells.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then run actual authored GLBs and matching `/dungeon` vs `/dungeon?feedback=d04` capture with all three camera views, 1440×900 and 390×844; inspect Warden warning/release/recovery/counter alongside missed swing, block, dodge, arrow, spell, and HP-confirmed injury. Preserve the frozen BEFORE at `281735d0910c6b2443648af976003d50412ee324`. Capture original PCM and submitted render frames, run the 20-minute resource soak, and request independent critique. None of those clips, audio-device measurements, soak or full CI claims are established by this patch.

**Review gate:** NOT ACCEPTED. Roll back this commit if genuine Warden sequences contradict tick/attack-window semantics. The remaining most important physical realism weakness is the wrist-proxy trail: authenticated weapon-tip transforms and moving-game audiovisual proof are still missing.
