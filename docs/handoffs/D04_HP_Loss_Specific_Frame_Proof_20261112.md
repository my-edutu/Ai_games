# D04 — Original HP-loss frame proof, not cumulative visual counts (12 November 2026)

**IN PROGRESS — specific confirmed injury remains visually UNACCEPTED in real capture.** Isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen historical BEFORE remains `281735d0910c6b2443648af976003d50412ee324`. Legacy /dungeon is unchanged; `?feedback=d04` remains opt-in. No merge, authority, rigs, camera, lighting or other branch edits.

## Concrete false-positive defect observed

The genuine Chrome run [43182485194](https://github.com/my-edutu/Ai_games/actions/runs/43182485194) for predecessor code `170dbec2` passed its *browser smoke*. Its real original-source files were independently inspected with the available local FFprobe decoder and the saved JSON evidence:

- Browser telemetry confirms **one** concurrently active primary MediaRecorder, not the previously planned five. Original direct canvas+opted-in sound recorded 174,520 bytes across 7,122ms; independently recorded original PCM contains 242,550 frames at 44,100Hz. This proves provenance, not synchronization.
- Actual combined WebM contains **3 VP8 packets** with presentation timestamps approximately **0.293, 2.944, 3.403 seconds** and **117 Opus packets**. There were **7 legitimate render-receipt frame requests** and **3 HTML-video frame deliveries**. Sparse encoded video remains a real limitation even with one recorder.
- 39 combat cues were queued, **29 expired**, six cumulative visuals admitted, one audio cue admitted and 37 frame receipts recorded. These totals do **not** certify any individual injury.
- Actual adjacent Dungeon HP loss: `run=1,floor=1,tick=4`, victim `enemy-1-0`, after-checksum `92c5595b`. Its exact D04 receipt `1:1:4:damage:-:enemy-1-0` is `expired-pending-before-frame`, with **no admitted visual or audio** and no submission frame.
- The actual later successful `1:1:24:damage:-:enemy-1-2` was accepted at frame 46 after 121ms and got one original sound scheduling provenance match. It is **not** the tick-4 injury. This proves that the previous `VISUAL_ADMITTED_NOT_AV_VERIFIED` outcome was a **false positive for the originally requested damage witness**: it used `visualAccepted>0` from unrelated later events.

## Test-first correction on this branch

Regression contracts were committed first in `tests/foundation/dungeon-d04-real-feedback-observation.test.cjs` (same-tick wrong victim, invented actor, stale frame, expired/delayed original injury, and a true original-victim delivered receipt). Pre-fix CI was automatically cancelled by the isolated workflow's newer-commit concurrency policy, so no completed red CI is claimed.

The read-only classifier `tests/browser/dungeon-d04-real-feedback-observation.cjs` now requires an **exact anonymous damage/damage-fatal cue** for each actual HP-loss victim in the same scene/tick, plus a truthful `delivered` visual receipt with real frame ID and monotonic observation-to-submission delay at most 400ms. It rejects guessed attackers, later impacts, unrelated targets, stale submissions, missing receipt clocks, and stale or duplicate outcomes. The accumulated visual counters are **context only**, not contact proof.

Possible source-specific results:
- `VISUAL_ADMITTED_NOT_AV_VERIFIED`: all observed HP-loss targets have valid delivered visual receipts. This still does **not** prove contact physics, decoded audible onset or A/V sample alignment.
- `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`: the exact injury receipt exists but has no valid timely visual submission.
- `DAMAGE_VISUAL_RECEIPT_UNVERIFIED`: cumulative visuals exist but the bounded receipt ring cannot prove the original injury.
- Existing invalid scene/authority/counter statuses and full-expiration status remain fail-closed.

The genuine browser test retains its final strict acceptance assertion, after writing authentic recordings, receipts and the diagnostic verdict. It will correctly fail if the original HP-loss witness still expires, even if unrelated later effects look good. A red real-browser acceptance is preferable to a fabricated success.

## Evidence hierarchy and next defect

Native contracts and source parsing are one layer; an isolated Chrome smoke run is a second. The exact HP-loss event is **not** accepted until a real WebGL receipt shows it. VP8/Opus packet presence is not decoded sample alignment. A separate procedural Foley audition is never game playback.

**Next highest-priority weakness:** actual WebGL frame submission can stall 2–3 seconds during live moving combat. The one-encoder run demonstrates the stall **still exists after removing four concurrent encoders**, although it does not establish causation. Identify active-render/capture scheduling and effect density with controlled matched scene/seed/viewpoint trials. Preserve the 400ms deadline and no-invented-contact rule. Full Warden, true miss/block/dodge/projectile/spell, three viewpoints at desktop and 390px mobile, moving video, decoded original-audio onset and 20-minute resource soak remain unaccepted.

### Rollback and ownership

Revert only the read-only evidence classifier, its focused regression tests and this D04 handoff if necessary. No production source or default spectator behavior changed, no gameplay/replay contracts changed, and the 7 pools/104 instances, 8 foley voices, opt-in/mute, reduced-motion/flash, cleanup and submission gates remain unchanged.


## Verified implementation outcome — genuine Chrome run 43189136184

[The corrected run](https://github.com/my-edutu/Ai_games/actions/runs/43189136184), head `62e4496b`, completed with **successful native contracts and production build** and a **failed real-preview acceptance**. The failure is intentional and load-bearing: the new event-specific classifier rejected the original injury, which the old cumulative-counter gate had incorrectly accepted. Browser media and diagnostics were preserved under artifact `d04-authentic-preview-smoke` despite red acceptance.

Fresh original-clip facts, inspected independently:
- One primary active MediaRecorder; 11 real frame requests, 6 encoded VP8 packets at 688×397 and 108 Opus packets. This is more encoded video than a previous independent capture, **not** a controlled causal performance claim or sufficient moving footage for contact synchronization.
- Cumulative totals were 62 queued, 30 expired, 16 admitted visuals, 11 admitted sounds and 62 WebGL frame acknowledgements; such totals are explicitly **not** evidence that the originally witnessed HP loss was accepted.
- Exact original tick-4 victim receipt: `1:1:4:damage:-:enemy-1-0`, `visual:true`, `decision:stale-frame`, frame 13, `audio:false`, observation-to-submission **1,370ms**, direct renderer call **1,005ms**. It was drawn/attempted too late for the 400ms physical-impact deadline and must **not** count as timely admission; a `visual:true` alone cannot prove a valid hit.
- Correct verdict: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`, `damageVisualAdmitted:0`, `damageCueReceiptObserved:true`. Read this status precisely as **not a timely accepted visual receipt**, not a claim that no stale geometry was ever submitted.
- The genuine real-preview check stayed red instead of silently certifying the later unrelated 16 visual admissions. Audible onset, impact-to-Opus alignment, moving three-viewpoint comparisons and 20-minute soak remain **UNVERIFIED**.

**Next action:** determine why the authentic original injury spent 1,005ms in the WebGL renderer. Match the same dynamic authority tick, view and viewport with single primary capture enabled/disabled, compare per-frame effect density and actual direct renderer durations, and retain outliers. D04 must not stretch its 400ms deadline or invent a late impact to obtain a green acceptance.
