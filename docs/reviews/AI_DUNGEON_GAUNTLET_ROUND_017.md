# AI Dungeon — Gauntlet Round 017: world-first spectator interface

Primary visual bar: actual Diablo IV gameplay; No Rest for the Wicked and Path of Exile 2 support material/character critique. **NOT MET.** This is an implementation increment, not an independent preference win.

## Observed baseline
Read the complete browser job log and inspected actual run 41160245577 captures at cc91f24. The browser suite finished 26/30; texture tests passed. Four failures involved a selected hero dying before a click/assertion or a scene reaching intermission between visibility reads. A separate code inspection also found: boss grid coordinates were blended into a world-space camera target without subtracting the map origin. The HUD dominated the right side, repeated ordinary messages blocked the action, and mobile map/control composition was crowded.

## Builder changes
- Replace 36 KB of layered dashboard CSS with one restrained fantasy stylesheet: charcoal, parchment and brass; bottom party cards, compact progress and optional map.
- The desktop canvas footprint increases from measured 52.885% to 92.444% at 1440×900. This is canvas area, not a claim about unobscured pixels or art quality.
- Clean view, map and native-dialog expedition journal; H/M/J/V and 1–3 shortcuts; 44 px touch controls. Journal uses bounded real events and safe text nodes, closes with Escape and returns focus.
- Explicit actual intermission results; connection failure stays visible even in clean view; dead cards are labelled and cannot pretend to be the live focus.
- Suppress historical event replay on initial load and noncritical centre alerts. Correct boss framing, snap render actors to a changed floor and reset camera/ray-audit state.
- Stable real seeded snapshots isolate UI/framing assertions from unrelated AI deaths. Separate live browser checks still exercise the actual HTTP host, progression and model loading. No game authority, combat balancing or save format changed.
- Raw-world capture masks include the new sibling HUD, avoiding false scene quality credit from bright interface pixels.

## Verification
- New camera/alert tests observed failing before implementation: 0/4; after implementation: 4/4.
- Focused production-module tests: 14/14.
- Full npm test: 528/528, exit 0, approximately 120 seconds on this workspace.
- Production HTML/CSS plus actual HUD/controller functions exercised in isolated Chromium at 1440×900, 390×844, 360×780, 844×390 and 1024×768: no horizontal overflow; touch, clean-view, map and journal focus checks pass. These component checks **do not include WebGL**.
- Local browser WebGL context creation and HTTP navigation are restricted. No attempt was made to bypass that policy. New full-game captures run on GitHub's real browser runner and are pending at this commit.
- Node syntax and git whitespace checks passed.

## Self-review, not independent review
External worker/tunnel is offline; no fresh subagent or ultracode execution occurred. Review found that world-only capture must also hide sibling HUD layers, which is covered by a new browser gate. Reproducible UI snapshots strengthen selection assertions from merely nonempty checksums to unchanged checksums; they do not replace the live progression test. No fixed number of further Gauntlet rounds or completion percentage is asserted.

## Remaining gates
Inspect exact-commit desktop/mobile/raw WebGL images, complete the full live browser suite, inspect multiple real combat/floor-transition frames, obtain independent matched A/B against official gameplay, develop more detailed characters/environments/animation, and gather production endurance/performance evidence. Keep PR #49 draft. No merge or deployment.
