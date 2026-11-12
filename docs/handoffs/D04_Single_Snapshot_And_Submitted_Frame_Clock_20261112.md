# D04 — One observed snapshot clock and one genuine submitted-frame clock (12 November 2026)

**Review status:** isolated incremental fix; real-combat audiovisual acceptance still **NOT VERIFIED**. Do not merge into main or Draft PR #49. Legacy /dungeon remains default; D04 requires `?feedback=d04`.

- Frozen BEFORE comparator: `281735d0910c6b2443648af976003d50412ee324` (no D04 controller there).
- Starting D04 branch head: `fe1b62e58c5ce1ae126a6507728dbadd5b1823ae`.
- Red contract: `c44d1fbf1bb2414fa970ce37ef55ee38c5ce2783`, [Actions 43152155881](https://github.com/my-edutu/Ai_games/actions/runs/43152155881).
- Green implementation: `a120cd2f24598dd6fce35766b66aabe527dbdf03`, [Actions 43152292749](https://github.com/my-edutu/Ai_games/actions/runs/43152292749).

## Authentic evidence and defect

The independently inspected archived genuine Chrome/Three.js artifact [43140193368](https://github.com/my-edutu/Ai_games/actions/runs/43140193368) recorded 41 planned cues, 33 expired pending, 6 visual admissions, 4 controller audio admissions and 34 renderer acknowledgements. Its *actual* authoritative HP-loss victim at tick 4 expired before visual staging; source scheduling elsewhere does not establish decoded audible impact. This fix does **not** resolve stalls or improve the physical scene.

Separate source inspection identified a verifiable **causality-metadata defect**. The D04 orchestrator sampled the injected monotonic clock once **per planned cue** in `acceptSnapshot()`, despite all those cues belonging to the same immutable public snapshot. It sampled again **per cue receipt** in `retainReceipt()`, even though all receipts were delivered by one completed WebGL submission. On a crowded simultaneous HP-loss snapshot, each victim could therefore receive a different fictitious observation and submission boundary from JS callback time spent iterating; a slow clock callback also contributed unnecessary hot-path work. The 400ms gate was already based on a single wall read at submission, making these reported per-cue times disagree with the actual decision boundary.

## Test-first proof

The new two-victim regression in `tests/foundation/dungeon-d04-pre-submit-wall-deadline.test.cjs` requires:
1. Two **actual HP decreases** in the same public tick and snapshot share exactly one clock sample at initial observation.
2. An opt-in frame-gated adapter issues no sound before `advance()` and the real frame acknowledgement.
3. The same renderer submission uses one monotonic sample shared by both delivered cue receipts, rather than giving the second injury a later clock.
4. Both independently confirmed victims remain distinct sound identities, with the same true observation-to-submission interval; frame replay emits nothing.
5. `sampleSynchronized` stays false. Clock provenance never proves decoded PCM/video onset.

**Observed red CI:** tests loaded, 86 earlier tests completed, and new subtest 87 failed as designed: `all HP losses in one immutable public snapshot share their observation boundary`, **2 !== 1**. This was a real assertion failure, not missing dependencies. [Failing job](https://github.com/my-edutu/Ai_games/actions/runs/43152155881).

**Observed green contracts:** the fix passed **155/155** native tests, and `npm run build` passed in Actions run 43152292749. The genuine Playwright/Chrome job was still running when this handoff was drafted; check the linked run rather than inferring final acceptance.

## Minimal change

In `public/ai-dungeon/physical-combat-feedback.js`:
- The opt-in submitted-frame controller samples the monotonic clock **once for each new immutable public snapshot** (only if it planned cues), then assigns that same observation boundary to those cues.
- The renderer acknowledgement already samples one post-`renderer.render()` boundary for its 400ms age decision. It now **passes that exact single timestamp** into each retained receipt rather than calling the clock again per cue.
- There is no new deadline, queue, timer, renderer draw, AudioNode, synthetic frame, attacker mapping, or data collection.

**Review pass A — specification:** A swing remains an attempt, not proof of damage. Only observed HP loss permits injury; the submitted-frame safety, invalid-clock fallback, stale sound suppression, replay deduplication, scene reset, consent, persistent mute, and reduced motion/flash remain in force. The fixed `submittedClockMs` and `observationToSubmissionMs` document only one boundary for genuine delivered-frame acknowledgements; no encoded A/V correlation is inferred.

**Review pass B — implementation/quality:** At most one fewer clock read for each extra planned cue and each extra presented receipt within their existing 32/64 bounded structures. This is a small CPU/measurement correctness improvement, **not a demonstrated GPU performance, FPS, realism or audible synchronization improvement**. Retained visual pools remain seven with 104 reserved instances; original audio remains eight voices and one bounded original noise buffer. No authoritative rules, rigs, camera, lights, source map, or other branch is touched.

## Rollback and unresolved acceptance

Revert `a120cd2` and its focused test on D04 only. A clock without trustworthy monotonic data continues to fall back to the earlier raw-frame gate; missing timing must never become a false PCM onset.

Remaining: authentic moving clips from three camera viewpoints at 1440x900 and 390x844, verified real Warden warning→release→recovery→earned counter and defeat/restart, witnessed miss/block/dodge/ranger arrow/spell/impact, blade-tip (not wrist-only) geometry measurement, decoded original impact PCM alignment, heavy software-WebGL stall remediation and 20-minute cleanup/resource soak. Existing moving captures are sparse and do not close these gates.

**Next dominant weakness:** actual cue expiration under slow frame delivery, particularly the authentic tick-4 HP loss; address rendering throughput and physical alignment without lengthening the 400ms audio gate or replaying stale injuries.

## Completed independent Chrome/browser check (same implementation candidate)

[Actions 43152292749](https://github.com/my-edutu/Ai_games/actions/runs/43152292749) completed **successfully** for `a120cd2`: 155/155 native tests, production build, strict SHA-verified CC0 model retrieval and authentic Chrome/Three.js smoke all passed. The [authentic ZIP artifact](https://github.com/my-edutu/Ai_games/actions/runs/43152292749#artifacts) was independently inspected, including FFprobe stream decoding and read-only Dungeon event receipts.

New authentic artifact, seed `visual-room-art-18`: 43 cues queued, **34 expired**, 6 admitted visuals, 1 original audio admission, 38 renderer acknowledgements. At tick 4, the true `enemy-1-0` HP-loss impact was **rejected as a stale frame** after a recorded **2783ms** observation-to-submission interval; the deadline correctly refused old audio. At tick 7, a separate authoritative fatal injury had one `delivered` frame receipt (248ms) and one canonical original `AudioBufferSourceNode.start` correlation. This proves original scheduling provenance **only**.

Independent FFprobe counted **2 VP8 frames (688×397)** and **91 Opus packets** in the original same-window Dungeon WebM; the separate serial/WebGL video probe yielded **1 VP8 frame**. These remain sparse, non-matched recordings. There is **no accepted common-clock decoded PCM-impact/video alignment, three-angle set, 390px moving comparison, or Warden end-to-end proof**. The Chrome smoke passed but the realism acceptance remains failed/unverified. Counts from different recordings must not be interpreted as before/after FPS or cue-admission improvements.

**Stronger next priority from this genuine run:** investigate why a newly observed HP witness endured 2783ms before renderer acknowledgement even while other frame receipts occurred, and reduce live-frame delivery stalls. Never extend old sound beyond 400ms or backfill stale contacts. This clock-identity change intentionally does not claim to fix that core defect.
