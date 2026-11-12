# D04 — Real submitted-frame phase attribution (12 November 2026)

**Status: incremental diagnostic implementation; physical-combat realism and decoded sound synchronization NOT ACCEPTED.** This is the isolated D04 branch only; it does not alter authoritative gameplay, camera, characters, lighting, main, or Draft PR #49. The legacy spectator remains default. D04 requires \`?feedback=d04\`.

## Provenance and dominant observed defect

- Frozen BEFORE milestone: \`281735d0910c6b2443648af976003d50412ee324\`; do not rewrite it.
- Prior D04 head: \`1dec6d0f0ada28d920530acaeca9bed355877eb8\`.
- Test-first red commit: \`f97fa3a8062ee95c833a200165475c5513da3e3f\`, [CI 43159040794](https://github.com/my-edutu/Ai_games/actions/runs/43159040794). Both new phase contracts failed because the fields did not exist (one also lacked an accepted submitted-clock receipt on nonmonotonic input).
- Phase attribution implementation: \`0203ff650cd26ad1fba2969a020b92a3a98b3ce9\`; corresponding adjustment to the older simultaneous-receipt synthetic clock sequence: \`f1f3b4c5689898ce694614a6024e6e79fe25eda0\`.
- [Green-candidate CI 43159247428](https://github.com/my-edutu/Ai_games/actions/runs/43159247428).

Earlier **genuine Chrome Dungeon** evidence from [Actions 43152292749](https://github.com/my-edutu/Ai_games/actions/runs/43152292749), independently inspected with actual source/tick receipts and FFprobe, established an HP-confirmed tick-4 impact rejected after **2,783ms** between observation and real WebGL submission. Across that recording 43 cues were queued, 34 expired, and six visuals admitted, while combined video yielded only two VP8 frames and 91 Opus packets. Those are facts about that **older** recording, not measurements of this new code. The combat audio silence on stale impact was correct; the real source of the delay remained unidentified.

## Change and measurement contract

\`public/ai-dungeon/physical-combat-feedback.js\` now reuses the existing monotonic start-of-advance clock, samples the **end of its own retained-visual update once**, and keeps exactly two bounded scalar boundaries for the latest D04 advance. The existing real post-\`renderer.render()\` receipt clock completes the measurement.

Every genuine, clock-valid receipt may expose:

1. \`beforeVisualAdvanceMs\`: public cue observation to the start of the latest D04 visual advance;
2. \`visualAdvanceMs\`: only the synchronous D04 retained-visual update, measured across that call;
3. \`afterVisualAdvanceToSubmissionMs\`: completion of the D04 visual update to genuine frame acknowledgement, **including all other app work and the renderer call**.

These are subdivisions of \`observationToSubmissionMs\` (subject to integer rounding). \`renderSubmissionMs\` stays a separate, previously present renderer measurement and **must not be added twice** to the third category. This new information does NOT certify browser presentation, encoded frame PTS, sample audible onset, blade-tip contact, the cause of a particular stall, or GPU-completion time.

If the injected clock is unavailable, nonmonotonic, before observation, or newer than the submission boundary, the applicable fields are \`null\`; they must never become made-up zero-duration evidence. Scene reset also clears the timing boundaries. No unbounded timing arrays, effect pools, audio voices or timers were introduced.

## Test-first contracts and checks

Two new contracts in \`tests/foundation/dungeon-d04-pre-submit-wall-deadline.test.cjs\` require:

- An actual observed HP drop followed by 32ms pre-advance, 11ms D04 visual update, and 2,740ms additional pre-submission wait to produce independently reported phase durations, **no stale injury sound**, and physical retirement of the timed-out retained shard.
- Nonmonotonic visual-work timestamp detection to leave the visual and post-visual phases unknown rather than claim a fabricated split, while keeping the valid observed-to-submission total.

The existing two-victim test now expects 30ms rather than 20ms under its **artificial test clock that advances 10ms on every read**, because the new bounded measurement adds one timestamp read within the D04 visual pass. This is not a claimed browser time regression.

At handoff drafting, the corrected Actions **contracts job passed 157/157** and the production build was in the same successful job. Genuine-browser playback was still running and cannot be marked as accepted until it completes and its artifact is inspected.

## Review A: specification preservation

- Only consecutive actual HP loss can authorize injury; an attempted swing still does not prove a hit or nominate an attacker.
- The unchanged original 400ms deadline and real WebGL receipt still gate audio; there is no retroactive foley, contact, or old-frame resurrection.
- WebAudio real-gesture opt-in, persisted mute, bounded deduplication, scene reset, audio interruption, reduced motion and reduced flash remain separate existing contracts.
- Seven retained GPU pools, 104 reserved instances, at most seven new draw calls, eight live voices and the existing 32/32/64 queue/receipt capacities are unchanged.

## Review B: performance and evidence quality

The change adds **one monotonic clock read per gated D04 visual pass**, two scalar timestamps and three nullable numbers in each of at most 64 bounded receipts. No extra scene traversal or GPU draw is introduced. It is diagnostic; until a new authentic running Dungeon recording shows populated phases for a rejected confirmed HP-loss event, **there is no measured performance or physical-realism improvement**.

Inspect a new authentic Chrome artifact's \`dungeon-d04-real-cue-frame-foley-timeline.json\` and \`recentDeliveryReceipts\`. Look for a real \`stale-frame\` on an observed HP-loss cue and identify whether the phase dominates **before** D04 visual advance, **inside** the D04 visual pass, or **after** it (including renderer time). If phases are unavailable, retain \`UNVERIFIED\`, not a diagnosis.

## Rollback and unaccepted work

Revert \`f1f3b4c\`, \`0203ff6\`, and focused tests on this branch alone; do not revert an unrelated session or merge PR. No change to replay determinism or authoritative state is intended.

Still required: genuine matched three-viewpoint, 1440x900 and 390x844 moving clips; full Warden warning/release/recovery/earned counter/defeat/restart; misses, block, dodge, ranged projectile, spell and confirmed HP impacts; source-verified physical sword-tip rather than wrist-only motion; decoded PCM onset against genuine video frames; FFmpeg-backed continuous moving capture; genuine event coverage and 20-minute resource soak. The next implementation must follow the **measured dominant phase** without weakening contact truth or the existing 400ms cap.


## Completed authentic Chrome phase measurement (implementation candidate \`f1f3b4c\`)

The full [Actions 43159247428](https://github.com/my-edutu/Ai_games/actions/runs/43159247428) completed **successfully**: 157/157 D04 native contracts, production build, SHA-verified CC0 model retrieval and genuine Playwright/Chrome Three.js Dungeon smoke. The [actual Actions artifact](https://github.com/my-edutu/Ai_games/actions/runs/43159247428#artifacts) was downloaded and inspected, including the live Dungeon cue timeline and local FFprobe on the original WebM.

**The same genuine tick-4 witnessed HP decrease still failed to make a timely impact.** Its receipt now directly measures:

| Real tick-4 HP-impact receipt | Monotonic reading |
| --- | ---: |
| Authority HP-loss observed to post-WebGL frame receipt | **1,765ms** |
| Observed to latest D04 visual advance start | 106ms |
| D04 visual-advance wall time | 0ms rounded (not proof of zero CPU work) |
| D04 visual-advance end to post-WebGL receipt | **1,659ms** |
| Existing separately measured renderer submission | **1,596ms** (already inside the 1,659ms) |
| Audio classification | \`stale-frame\`, **no late impact sound** |

The three phase readings sum to the 1,765ms observation-to-submission wall duration. In this specific frame, software-WebGL **renderer submission**, not D04's retained visual update, dominated the waiting time (1,596ms of 1,765ms). This does not prove that all other stalls are renderer-bound or that a different machine would behave similarly. It directly falsifies any inference that the newly measured D04 visual pool was the sole bottleneck.

Across this separate new recording: 82 queued cues, 51 expired before visual emission, 22 visual admissions, 14 original audio admissions and 58 renderer acknowledgements. These counts depend on capture duration and simulation progression and are **not an A/B performance gain** relative to the previous 43-cue run. An independently real tick-24 HP loss produced a timely delivered receipt (51ms; renderer 8ms) and a matching original sound-source scheduling audit. That proves **cue-to-WebAudio scheduling provenance only**, not decoded audible contact.

The combined WebM's bounded EBML inspector found seven VP8 packet timestamps; independent FFprobe decoded five VP8 frames at 688x397. Original Opus/PCM was present but **neither moving three-viewpoint evidence nor decoded PCM onset aligned to the genuine impact frame was established**. The Chromium/readback decoders remain unverified where reported. The desktop and 390px mobile compositor stills are genuine, but they are not accepted moving audiovisual comparisons.

### Updated next dominant weakness and owner boundary

**The single observed primary blocker is very slow renderer submission under the hosted software WebGL workload**, with a genuine 1,596ms render call at the tick-4 impact. The D04 implementation must not artificially preserve stale contact sound or retry old impacts. Next measure matched D04-opt-in versus legacy spectator WebGL render cost, with identical world/seed/camera and controlled capture overhead; only then consider D04-controlled effect-density reduction or its own GPU geometry optimization. Camera, renderer configuration, world lighting, authoritative rules and character assets belong to other sessions and must not be modified here. Three-angle clips, Warden story, touch-size moving A/V, blade-tip witness, and 20-minute soak remain open.
