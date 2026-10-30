# Testing strategy

## Authority

Run `npm run test:royale`. Behavioral tests were developed red/green and cover seeded replay, restore continuation, immutable snapshots, strict checkpoint handling, swept geometry and LOS, complete matches and automatic restart, event bounds, truthful storm draws and critic regression cases. Record exact results in the live review ledger.

Run `npm run royale:headless` for an eight-seed default campaign that records winners, durations, checksums and observed restart. It is a reproducible sample, not a statistical fairness proof.

## Integration

Run `npm run test:royale:browser`. The dedicated config uses one Chromium worker and an isolated local host, preserving the existing catalogue browser suite. It checks a real WebGL scene, read-only API boundary, spectator controls, advancing independent authority, phone layout and the separate development page. After the first actual snapshot render, inspection mode freezes rendering and polling for the control/layout checks; these tests do not certify sustained rendering performance. Presentation fault tests execute the actual module with real Three objects and controlled GPU/DOM/network boundaries.

## Visual review

With the host running, use `npm run royale:capture -- --prefix=review-name` for actual desktop, character and phone PNGs plus an evidence JSON. `ROYALE_CAPTURE_URL` selects another local review host; `--high` selects the high graphics tier after startup. Capture freezes one successfully rendered snapshot, preserving its match/tick in the evidence. It does not alter geometry, retouch pixels or produce motion evidence.

Capture actual gameplay, close-up equipment/anatomy and representative motion. Critics use the fixed reference brief and actual output without builder explanations. A code-level check is insufficient for a visual pass. Retain rejected captures so camera and quality improvements can be assessed honestly. Any inaccessible reference stays an open gap.

## Remaining gates

Target-hardware frame time and long-session resource measurements, multiple complete visible match recordings, human comprehension review, actual provider/encoding audio measurement, the repository's elapsed soak and external canary remain necessary before production claims.
