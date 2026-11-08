# D04 — Physical Combat Realism Preview: Acceptance and Rejection Gates

Status: **IN PROGRESS / NOT TRANSFORMED / NOT PRODUCTION READY**

Frozen inspection base: \`c51342c0253435325d6a46e4d9f02b337a2ad138\`. 
Isolated review branch: \`feat/dungeon-d04-combat-feedback-realism-20261108\`.
Comparison milestone BEFORE stays pinned at \`281735d0910c6b2443648af976003d50412ee324\`.
Do not merge into main or PR #49 until evidence-led review is satisfied.

## What is installed on this branch

- **Normal /dungeon**: previously established legacy director and soundstage unchanged in behavior.
- **/dungeon?feedback=d04**: opt-in experiment with read-only snapshot planner, seven retained GPU pools, new procedural physical foley, and renderer-submission acknowledgment.
- The experimental spectator routes all new foley into the existing capture-capable soundstage FX bus, suppresses duplicate old combat cues, preserves ambient, traversal, utility and reward audio.
- Only real public action transitions may create swing/release cues. A swing **never** certifies damage. Only consecutive actual HP loss may make injury VFX. No text-parsed attacker or fictitious target.
- Audio remains off until a fresh click; mute stops pending voices, stores muted preference, never automatically unmutes after reload. Motion/flash have restrained alternatives.

## Run the exact reproduction

From a worktree checked out on the isolated branch:

\`\`\`sh
npm ci
npm run build
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
\`\`\`

Open \`http://localhost:4181/dungeon\` for the known spectator and \`http://localhost:4181/dungeon?feedback=d04\` for the preview, using \`npm run dungeon:stream\` once the model assets are present.

**Truthfulness:** the local detached-module tests passed **25/25**, and a separate Chromium audition verified original WebAudio synthesis. The newly added integration-contract test and genuine Dungeon/Three.js browser preview have **not** run on this branch yet; the shared coding tunnel was disconnected. No CI job ran on the new branch as of the latest inspection. The audition WAV is not a real dungeon audiovisual sync test.

## Mandatory authentic LOOK / FEEL / SOUND trials

Record SAME authoritative (seed/run/floor/tick/checksum), three camera directions and actual movement, without altering authority or substituting screenshots:
1. Entry to ordinary chamber, long traversal and real footfalls.
2. Genuine sword attempt that **misses**: visible gesture and whoosh, **zero** injury fragments or successful-hit sound.
3. Genuine adjacent sword contact with real HP loss; after-image, target fragment, vibration/acoustic onset and damaged-actor pose compared frame-by-frame.
4. Block, one-cell dodge, cultist cast, ranger arrow and a real interrupt. No fake target or duplicated audio.
5. Warden warning, release, recovery and **earned** counterattack, followed by decisive Warden defeat and run restart. Warning floor cells stay readable, no ghost emitter or sound after restart.
6. 1440×900 and 390×844. Show world-first combat readability, not HUD mockups. Inspect visuals from multiple camera positions and in moving footage.
7. Two distinct cases with **simultaneous incoming threats** and one ambiguous health loss: no arbitrary attacker identification.
8. Audio opt-in, mute/reload, low-end render stalls, reduced-motion + reduced-flash, WebGL recovery, browser background/foreground and 20-minute effect density/cleanup run.

Capture **both tracks** from the actual canvas+original opt-in sound bus. Attach original WebM and extracted PCM/WAV when supported. If codec, device or frame delivery is absent, label audiovisual evidence **UNVERIFIED**, not passing. Audio waveform energy alone does not prove synchronization. Compare a bounded common clock to actual frame submission and audible samples.

## Hard budgets and acceptance criteria

| Contract | Required proof |
|---|---|
| 7 retained visual pools, 104 or fewer reserved instances | Inspect genuine WebGL draw submission and pool stats |
| Maximum 7 new VFX draw calls | Count actual effects during dense combat |
| 8 or fewer live foley voices, one 19,200-sample-or-smaller mono generated noise buffer | Browser audio telemetry and voice cleanup |
| 32 pending effects, 32 audio-awaiting-frame, 64 receipts | Saturation/eviction test and restart |
| No audio before opted-in gesture or unsubmitted effect | Real button interaction, frame receipt and A/V playback inspection |
| No false injury, wrong attacker or distant projectile target | Compare with actual authority HP, actor targetId, map collision/range |
| Complete cleanup after run/floor change, mute, WebGL loss/recovery | Scene/audio node counts after stress |
| Genuine improved readability and physicality versus frozen baseline | Matched BEFORE/AFTER clips, mobile/desktop, fresh independent blind critique |

## Fail-fast realism review

Reject if the blade looks like a floating neon crescent, effects appear at grid-centre detached from the rig, whoosh arrives long after blade passage, strike and damage clocks diverge, frequent hits overwhelm foreground actors, the Warden becomes visually unreadable, or software-WebGL performance collapses. Existing 3D character anatomy, choreography, environment and camera have independent owner sessions; do not silently “fix” them in D04. D10 may only replace default after verifying compatibility and removing old overlapping systems.

**Do not claim the Diablo IV/No Rest for the Wicked/Path of Exile 2 bar, integrated transformation, or production readiness based on the 25 green unit tests, one WAV audition or a single screenshot.**
