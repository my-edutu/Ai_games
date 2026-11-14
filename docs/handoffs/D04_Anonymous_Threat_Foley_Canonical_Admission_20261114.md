# D04 — Strict anonymous warning sound admission (14 November 2026)

**Status:** D04-only code and native contracts GREEN; genuine audiovisual acceptance **NOT ACHIEVED**.

## Isolation and references

- Repository `my-edutu/Ai_games`, exclusive branch `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Actual starting HEAD `b5bf5f9eaef7ec7fc8593985806b138d5dc2d98b`; frozen BEFORE milestone `281735d0910c6b2443648af976003d50412ee324` was inspected as a historical comparison, not modified. The D04 original-foley file did not exist at that BEFORE milestone.
- Reviewable commits: [new test first](https://github.com/my-edutu/Ai_games/commit/61c1ed9015e7d142fff1e81c3fb0ffe961fab7f3), [wire test into isolated CI](https://github.com/my-edutu/Ai_games/commit/207b43d1077be303b2aa3642607377ff9d558af7), [correct production admission](https://github.com/my-edutu/Ai_games/commit/88e8ae6d1043dfc9b0a05a4bf2837a3ebe4f920a), [preserve valid eight-voice preemption fixture](https://github.com/my-edutu/Ai_games/commit/407bb8f30516deba130ae737e0ce30e1c73a683f).
- No changes to `main`, Draft PR #49, `games/ai-dungeon/src/**`, camera, rigs, lighting, game state or other teams' branches.

## Dominant D04-owned acoustic integrity defect

The public planner emits genuine anonymous `threat-warning` events for (a) public `telegraph` events with no actor identity and (b) a genuine Warden danger footprint without a uniquely witnessed Warden owner. Before this increment, the original production foley's strict admission gate did **not** require canonical proof for either `threat-warning` or its legacy recipe `boss-warning`. A malformed recipe-only request could therefore schedule an alert; an anonymous warning could carry a fabricated named actor. This is a production-source admission vulnerability demonstrated by inspection and regression contracts, **not** an independently heard gameplay recording.

The new `verifiedAnonymousThreatFoleyCue` requires exactly the public planner's neutral shape: `kind: 'threat-warning'`, matching `audio`, `visual: 'none'`, `verified: true`, proof `authority-event` or `authority-warning-unattributed`, and null actor, target, from and to. Strict `isCanonicalVerifiedCombatFoleyCue` also requires the scene/run/floor/tick/event ID tuple. Both `threat-warning` and orphaned `boss-warning` recipes now go through strict authority admission. The standalone non-strict procedural sound audition remains permissive; it never counts as genuine Dungeon A/V evidence.

A real anonymous alert still plays and remains **anonymous**. It cannot imply a Warden's position, release, hit, counterattack, HP loss or victim attribution. Rejected sounds do not allocate source nodes, consume the eight-voice budget or enter dedupe/event history. The accepted warning deduplicates on its canonical ID.

## Test-first and operational verification

1. A separate focused 3-test file was **committed before source implementation**, and the existing isolated CI workflow was amended to execute it. The pre-fix CI run [43608594645](https://github.com/my-edutu/Ai_games/actions/runs/43608594645) was canceled by subsequent branch pushes while it was queued; a native RED verdict is therefore **not verified**, despite source inspection predicting the failure. Do not claim a measured RED result.
2. Final [Actions run 43608831976](https://github.com/my-edutu/Ai_games/actions/runs/43608831976): **340/340 selected native tests passed, 0 failed**; production build **passed**. Three new tests specifically cover real public-planner anonymous threat and unowned Warden warnings, forged actor/identity/proof/audio and idempotency/no source allocation, and preservation of standalone auditions.
3. The only existing fixture updated was the eight-voice transactional-preemption contract. Its fifth low-priority live voice is now an actual canonical anonymous public-warning-shaped cue rather than fabricated raw `threat-warning` audio. All eight valid voices must remain alive if a later high-priority sound source allocation/start fails.
4. Isolated code comparison from starting HEAD shows only D04-owned sound source, new test, existing foley test, and CI workflow before this handoff. No authoritative replay/version/seed/checksum changes.
5. Coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. The GitHub connector handled source and tests; validation came from completed GitHub Actions. No local claims.

## Genuine real-game footage and unresolved acceptance

I inspected existing genuine desktop and 390px mobile VP8 contact sheets from an earlier completed Dungeon browser run. They show sparse overhead arena frames, **not** three matched moving contact viewpoints, blade passage or sample-accurate sound. The previous real Chrome run [43603952642](https://github.com/my-edutu/Ai_games/actions/runs/43603952642) completed five diagnostic browser cases but failed strict acceptance with `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Its phase receipts included a 2,465ms sampled desktop renderer phase and 2,749ms mobile renderer phase. Similar stalls appeared in legacy, so do not attribute the cause to D04.

This increment started genuine browser playback through the isolated CI job, but do not assert its final verdict, decoded PCM/VP8 alignment, verified three-viewpoint combat footage or 20-minute resource soak unless those artifacts have been independently inspected. Existing estimated WebAudio output timestamps are not decoded sample onsets.

## Resource, user-safety and rollback review

No new samples, media imports, WebAudio generators, gain changes, audio buffers, polling, timers, callbacks, GPU pools or effect instances. Existing limits remain <=8 original voices, one 13,440-sample mono generated buffer, 128 cue IDs, 7 retained visual pools, capped 32 pending / 32 awaiting-frame / 64 receipts and 400ms audio submission deadline. Gesture opt-in, persisted manual mute, reduced motion/flash, scene cleanup and output rebinding remain unchanged. The default spectator is legacy; D04 stays experimental only at `?feedback=d04`.

**Specification review:** only neutral warning acoustics changed; no new attacker, game result or actor-location inference. **Quality review:** reduces false warning sounds, but does not improve stalled WebGL rendering, body animations or independently measured acoustic synchronization. **Rollback:** revert the production source correction on this branch together with its strict test/fixture change if an unexpected regression is demonstrated; never merge to main as a workaround.

**Next dominant blocker:** attribute multi-second genuine WebGL frame-submission stalls, then gather matched run/floor/tick/checksum three-direction desktop and 390px mobile moving clips for actual sword miss/contact, guard, evade, ranger/cultist releases, Warden warning/release/recovery/earned counter/defeat and restart. Require original captured PCM, submitted visuals, opt-in/mute/reload/reduced-motion/flash trials and the 20-minute cleanup soak before considering audiovisual acceptance.
