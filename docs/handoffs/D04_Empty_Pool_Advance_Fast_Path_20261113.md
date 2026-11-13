# D04 — Empty retained-pool advance fast path (13 November 2026)

**State:** Isolated opt-in performance/correctness increment; **NOT production/realism-accepted**. Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Normal `/dungeon` remains the legacy spectator. D04 is only `?feedback=d04`. No main/PR #49, authority, characters, camera or lighting changes.

## Focused defect and scope

Even when all seven retained D04 visual pools were empty, `physical-feedback-visuals.js::advance` traversed the **102 reserved instance positions** every frame. It made no GPU matrix writes in that state, but still performed unnecessary JavaScript scans during already sparse genuine WebGL playback. This is an isolated CPU hot-path inefficiency, **not proven to cause or resolve** the intermittent multi-second Chrome WebGL stalls (which were observed in legacy and D04 alike).

An early exit now applies **only when the maintained occupied-instance count is zero**. It resets that frame's seven diagnostic per-pool write counters, total write and upload-intent counters, increments the existing bounded advance frame counter, increments a bounded diagnostic `idleAdvanceSkips`, and returns without scanning vacant instances. A newly admitted cue resumes the full original visual pass; still-authoritative Warden warning instances, active swing trails, projectile effects and existing retirement logic cannot use this shortcut. No new pool, draw, buffer, voice, queue or persistent listener is created.

## Test-first chain

- [Red test commit d1fbe5a](https://github.com/my-edutu/Ai_games/commit/d1fbe5ae108eadb83f6aef984a275d428e1517f8): appended a production-visuals regression, **not an adapter mock**, to `tests/foundation/dungeon-d04-held-warning-gpu-update.test.cjs`. The test checks 12 idle frames have no 102-slot work (via bounded `idleAdvanceSkips`), zero writes/uploads and maintained counters, followed by a genuine authority-live Warden warning that still draws and retires on revocation.
- [Red CI 43370548002](https://github.com/my-edutu/Ai_games/actions/runs/43370548002): native contracts finished **244 passed / 245 total; one expected new regression failed** because `idleAdvanceSkips` did not exist. Browser job skipped when native contract failed. No flaky rerun was used to turn red green.
- [Production implementation c3b81f2](https://github.com/my-edutu/Ai_games/commit/c3b81f2d3b4e6368cd2432fb963930081162770b): only `public/ai-dungeon/physical-feedback-visuals.js` changed. No authoritative state, sound generation or post-WebGL receipt logic was changed.
- [Corrected CI 43370783033](https://github.com/my-edutu/Ai_games/actions/runs/43370783033): native contract/build and subsequent real-browser result must be inspected independently; the browser test is **not** a sync or quality pass simply because the workflow is triggered. Do not claim passing without a completed verdict.

## Actual browser evidence inspected (from **earlier** unchanged branch, not proof for this fast path)

[Previously completed genuine Chrome run 43363597511](https://github.com/my-edutu/Ai_games/actions/runs/43363597511) had successful native contracts/build and **failed** strict authentic injury acceptance. Its real authority tick 3→4 HP loss for `enemy-1-0` admitted retained injury art but did **not** obtain a timely WebGL frame: observation-to-submission **1,884ms**, renderer submission **1,768ms**, sound refused `stale-frame` as required by the unchanged 400ms deadline. A second tick-six injury was also late (**3,086ms** observed-to-submit). The same artifact's later tick-24 genuine injury produced one `delivered` controller receipt and recorded original `AudioBufferSource.start` scheduling; this is **not** decoded audible PCM or visual contact synchronization, and does not undo the failure of the first-injury gate. The media files have authentic VP8 and Opus tracks but sparse output and unaligned clocks; no claimed original-sound parity.

This separation matters: an empty-pool advance skip cannot materially improve a WebGL submission that was blocked for almost two seconds **while effects were active**. A broader, evidence-led profiling handoff to the owning renderer session is required rather than silently editing the global renderer here.

## Safety, review, and rollback

**Spec review:** `active===0` only; existing occupied-slot count already drives reset, retirement and allocation. Active danger-cell warnings are never skipped. Empty frames record zero D04 instance writes without inventing GPU upload measurement. HP-loss-only contact, swing whoosh, unidentifiable attacker, wall-clock 400ms deadline, submission acknowledgement, WebAudio explicit consent/mute persistence, reduced-motion/flash, replay IDs, scene cleanup and fixed seven-pool/102-instance/<=7 draw/<=8 voice/32/32/64 queue caps are unchanged.

**Quality review:** the new counter is saturated at `Number.MAX_SAFE_INTEGER` and only emitted through existing `stats()`. There is no new dynamic allocation in the fast path beyond the fixed seven-key diagnostic iteration and no shared-state authority mutation. Review runtime performance only with actual on/off matched browser traces; `idleAdvanceSkips` by itself is not an FPS gain.

**Rollback:** revert only implementation commit `c3b81f2` if regressions emerge, while retaining the red contract for redesign. Preserve this handoff and inspect later browser job results separately.

## Unmet D04 acceptance

Three matched moving camera viewpoints, desktop 1440×900 and mobile 390×844, actual Warden warning/release/recovery/counter, sword miss, block, dodge, projectile, spell, HP-impact and independently decoded PCM onset against real video PTS remain unverified. A 20-minute occupancy/voice cleanup soak remains incomplete. **Next dominant weakness:** large renderer/WebGL submission stalls under active moving combat, especially first authentic HP injury, with only sparse moving/sound tracks. Do not broaden D04 ownership or relax the existing 400ms fail-closed sound policy to hide that defect.
