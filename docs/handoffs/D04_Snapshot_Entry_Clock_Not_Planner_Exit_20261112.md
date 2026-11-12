# D04 — Preserve the real snapshot entry time across synchronous feedback planning

Date: 2026-11-12
Status: **IN PROGRESS / NOT REALISM ACCEPTED / NOT AUDIOVISUALLY SYNCHRONIZED**
Ownership: isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108`
Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`
Starting head for this increment: `dea28ffc691b04c6ae8a8d8a398e3f0746ac6b49`

## Specific observable defect and minimal correction

Earlier genuine continuous Chrome/Three.js Dungeon playback has rejected the same witnessed real HP decrease as `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` while software-WebGL calls sometimes last multiple seconds. The 400ms late-foley gate must remain strict: delaying sound until an obsolete canvas submission is false feedback.

Source inspection found a separate causality error inside D04's *own* controller: `acceptSnapshot()` originally called `planPhysicalFeedback()` (including injected read-only `deriveDamageBeats`, `verifiedMeleeDelay`, and `resolveContact` callbacks) **before** sampling the timestamp assigned to *all* new injury and action cues. If synchronous cue planning consumed 650ms, the original injury was stamped as freshly observed *after* those 650ms. A subsequent WebGL acknowledgement could then authorize an old impact under a falsely shortened wall-clock age.

The fix samples the monotonic optional D04 clock **once at entry for each accepted newer same-scene public snapshot, before calling the synchronous cue planner**. All cues from the snapshot share the original stamp; legacy non-submission mode still never requires or samples this clock. This may add one O(1) optional clock read for a same-scene tick without cues, rather than masking expensive planning. No new timers, frames, meshes, voices, queues or unbounded histories.

Scope: `public/ai-dungeon/physical-combat-feedback.js` and `tests/foundation/dungeon-d04-snapshot-arrival-clock.test.cjs`. No changes to `games/ai-dungeon/src/**`, app/game authority, camera, character rigs, lighting, main, Draft PR #49 or other sessions.

## Test-first evidence

- Red test commit: `df67161a25cea10e1965abc8803ca106a3edb542`.
- [Red CI run 43233554528](https://github.com/my-edutu/Ai_games/actions/runs/43233554528): 209/211 native tests passed; **both new regressions failed for the intended source defect**. Specifically a 650ms simulated blocking damage-beat planner allowed a stale effect; the 125ms case reported its observed timestamp 125ms too late. The browser job was skipped because native contracts failed.
- Fix commit: `f2f313f516e13cae74ef49c5ba89ddf09e5b6c3d`.
- [Corrected CI run 43234194418](https://github.com/my-edutu/Ai_games/actions/runs/43234194418): **211/211 native tests passed and production build passed**. The genuine Chrome real-preview job was still running at the moment this handoff was drafted; do not imply it passed.

The 650ms test uses an injected synchronous, read-only planner clock advance with a genuine-by-fixture **consecutive public HP loss**, not fabricated successful hits. It requires: no aged injury effect, no audio, an `expired-pending-before-frame` receipt, real snapshot entry stamp, and no submitted frame ID. The complementary 125ms planning test requires the *same* entry stamp, genuine frame acknowledgement and timely allowed original audio. It does **not** establish sample-synchronized audible PCM.

## Specification review

- **Authority causality:** only consecutive real public HP drop produces the impact; the snapshot stamp is independent of guessed contact or shooter identity.
- **Timing:** no extended 400ms gate; planner execution time now counts toward it instead of being discarded. No sound before opt-in or actual WebGL acknowledgement.
- **Budgets:** 32 pending, 32 awaiting-frame, 64 receipts, seven retained pools, 104 maximum reserved instances, eight foley voices and one bounded generated-noise buffer unchanged.
- **Accessibility and lifecycle:** audio opt-in, manual mute persistence, reduced-motion/flash, run/floor restart, dedupe and scene cleanup unchanged.
- **Replay:** no authoritative tick, seed, rule, checksum, event ordering or gameplay configuration changes. Real-world clock changes presentation eligibility only, as designed.
- **Rollback:** revert fix commit to restore prior observation-stamping behavior; do not revert or merge any other session.

## Quality review and genuine evidence limitations

This is a load-bearing presentation-safety improvement, **not** a fix for the underlying multi-second WebGL stalls or a demonstrated improvement in combat physicality. The red/green tests are synthetic latency controls against real public-state-shaped injuries. Prior actual Dungeon screenshots and original WebM files were inspected from the older `43198249099` artifact; those samples visibly show the real world and hazard geometry, but the same WebM has just 8 desktop VP8 frames with multi-second gaps. It predates this fix and cannot be relabeled current-candidate synchronized A/V evidence.

Remaining acceptance: same-seed three-viewpoint moving actual gameplay at desktop and 390px, original miss/blocked/dodge/cast/projectile/HP impact, Warden warning/release/recovery/counter/defeat/restart, verified physical blade passage, decoded original audible onset compared to genuine frame submission, and a 20-minute resource soak. Continue investigating continuous-renderer stalls without attributing them to D04 absent controlled causal evidence.

The spectator default remains unchanged; new feedback only via `?feedback=d04`.
