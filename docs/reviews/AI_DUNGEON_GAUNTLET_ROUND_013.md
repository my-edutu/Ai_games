# AI Dungeon Gauntlet — Round 013: Evidence-led fixes

**Starting SHA:** d3a47b54f46d06b24dd5a4c7ea8f3be0460adb4f. **PR #49 remains draft.** Path of Exile 2 visual parity: **NOT ASSESSED / NOT ACHIEVED**.

## Actual evidence inspected
- [GitHub Actions run 37788807146](https://github.com/my-edutu/Ai_games/actions/runs/37788807146) failed: dungeon authority **10/11 passed**, Warden guard action failed; browser **17/19 passed**, audio-toggle poll and spectator click timed out. The latter reports repeated hero-card DOM detachments.
- Downloaded [browser artifact 11558442250](https://github.com/my-edutu/Ai_games/actions/runs/37788807146/artifacts/11558442250): inspected desktop/world captures, 390px and 360px full-page mobile screenshots, and actual WebM frames. 3D geometry and animated character models are visible, but masonry is visibly repetitive, bloom sometimes obscures combat, and mobile squad/map cards were compressed into two narrow columns with 8px labels.
- Actual colour audit: **58.07/255** mean luminance and **0.767** saturated fraction. This is brightness evidence, not aesthetic parity. The separate world-only artifact was missing. No independent blinded A/B or 24-hour soak.

## Implementation
1. Same-turn melee against an autonomous guard now deals 40% damage and preserves the guard pose, so the Warden's warning leads to visible tactical defence.
2. Keyed hero cards update state/accessibility in place without DOM detachments at every 190ms poll, retaining live spectator click focus.
3. Audio toggle follows explicit user intent, including AudioContext instances already running on creation.
4. Mobile WebGL stage expanded to 62dvh; full-width squad/map panels, 11px+ hero names and larger touch targets.
5. Added Playwright regressions for card node persistence, click focus, stage size, mobile typography, card width and horizontal overflow. New screenshot: `artifacts/dungeon-mobile-legibility-round13.png`.

## Open acceptance gates
Latest TypeScript, authority, seed campaign and Chromium CI: **PENDING**. Independent Path of Exile 2 A/B: **NOT RUN**. P1: authored characters/animation, environment richness, bloom clarity, mobile screenshot critique, long-duration uptime/renderer recovery. Do not merge.
