# D04 — Bounded polyphonic phase separation for original material foley

Branch: \`feat/dungeon-d04-combat-feedback-realism-20261108\`.
Source base: \`02189dd46a789b76725ede3d407f9337beb152d5\`.
Frozen BEFORE comparison: \`281735d0910c6b2443648af976003d50412ee324\`.
Status: **SOURCE-LEVEL AUDIO CORRECTION / REAL DUNGEON A/V UNVERIFIED**.

## Source-observed problem and test-first contract

The retained single original noise buffer loops correctly after the previous D04 tail fix, but all eight potential simultaneous AudioBufferSourceNodes still called \`source.start(t)\` with no buffer offset. In WebAudio that starts each source at sample zero. Thus several co-timed combat cues share phase-aligned noise; coherent peaks can exaggerate impact and obscure distinct warning, block and release sounds. The code inspection establishes phase alignment, **not** a measured audible peak.

A three-case bounded phase-policy test was run locally with Node 22: the old zero-offset stub failed the two separation contracts (one other input-safety contract passed), then the new 16-candidate algorithm passed all three. New native integration regression tests are committed but cannot be run against the actual repository while the coding tunnel is offline.

## Implementation

\`public/ai-dungeon/original-combat-foley.js\` now selects a per-voice offset at emission time. It checks 16 evenly spaced candidate positions in the one existing mono generated noise buffer and selects the largest minimum circular separation from live voices' *current* playback phases, accounting for elapsed AudioContext time. At most eight voices are inspected; no phase search occurs per sample or per rendered frame. The AudioBufferSourceNode starts with \`start(t,noiseOffset)\`; resonator oscillators continue with ordinary \`start(t)\`.

Voice priority, cooldown, opt-in, mute, cleanup and limiter remain in place. One <=19,200-sample generated mono buffer, eight live voices, no external audio, and no gameplay/authority writes. The other seven D04 VFX pools, frame-submission gate and legacy spectator are unchanged. This changes original sound texture only inside \`?feedback=d04\`.

## Checks and non-claims

- Local isolated phase-policy TDD: **two red contracts, three green**; not a native module or browser run.
- GitHub exact-source review: previously phase-locked \`source.start(t)\` loop, new live-voice phase selection and changed noise-source start.
- New committed Node WebAudio-mock regressions: eight simultaneous voices, ongoing phase, three sample rates, one noise buffer, eight-voice cap, eviction and mute. **Native suite not run**.
- Genuine Chromium Dungeon game visuals/audio, capture-bus PCM, 3 viewpoints, 1440x900/390x844, Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/hit, and 20-minute soak remain **UNVERIFIED**. No tracked GLB/glTF or gameplay recordings existed in the inspected GitHub tree.
- No loudness, true-peak, loop-flutter or perceived-quality score is claimed without real output.

Rollback: revert this single isolated commit. Review next the physical sword-tip attachment versus its wrist proxy and verify actual sound onset against submitted game frames before considering D04 integration.
