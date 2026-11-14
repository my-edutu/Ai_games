# D04 — Authored Warden danger audio must match its canonical public warning (14 Nov 2026)

**State:** isolated, test-first source patch committed; full native CI and genuine post-patch browser playback **NOT YET VERIFIED**. Physical realism **NOT ACCEPTED**.

## Context and ownership

- Branch exclusively: `feat/dungeon-d04-combat-feedback-realism-20261108`; inspected prior branch head `131feafc2b498f6dbd6798971340c144c6893d1b`.
- Frozen-before comparison `281735d0910c6b2443648af976003d50412ee324` remains unchanged. Read `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, current physical cue planner, original foley engine, foundation tests, and game-audio/game-feel-vfx/performance skills.
- Protected boundaries unchanged: no `main`, PR #49, `games/ai-dungeon/src`, rigs, camera, lighting, other branches, or default spectator.

## Observable evidence and selected source defect

The latest completed actual Chrome job [43574567089](https://github.com/my-edutu/Ai_games/actions/runs/43574567089), recorded **before this correction**, passed five read-only render/capture diagnostics but rejected strict physical-preview acceptance: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Real HP loss was observed; a first injury cue was retired as `stale-frame` after **1992ms** observation-to-submission latency (**1702ms** inside measured renderer submission). That stall also occurs in legacy comparisons, so **D04 attribution is unproven** and it is not safe to lengthen the 400ms audio authorization deadline.

I also downloaded the genuine run artifact (ID `14105778161`) and inspected its actual VP8/Opus media with independent `ffprobe`: desktop live authority contained **9** decoded video frames, maximum **3.294s** PTS gap; the 390px mobile recording contained **10** frames, maximum **3.011s** gap. The primary combined A/V clip contained **2** frames and the later readback A/V clip **3** frames. Audio/video tracks existing do not prove contact timing; there are not three matched viewpoints or sample-synchronized impact sounds. These clips remain **partial, sparse, unaccepted real-game evidence**.

A separate genuine Warden danger-cadence source inspection revealed a fail-open audio path: while `ranged-release`, `spell-release` and `warden-release` required canonical public action IDs, both named `boss-warning-rising` and `boss-warning-final` could play their original synthesized warning recipe solely by name, even when `verified=false`, the purported owner was invented, the event ID was mismatched, or the future attack tick was already elapsed. This is a **source-confirmed authorization defect**, not an independently isolated real-game audio misfire.

## Test-first patch

1. [Test-only commit 2a8f376](https://github.com/my-edutu/Ai_games/commit/2a8f3764eb99a873e78764ceb3294e10a2f2ffb5): use the real public planner to construct a rising and final future danger warning and require exactly one foley onset for each; reject six variants (unverified cue, incorrect proof, invented actor, fake victim, mismatched canonical ID, expired attack tick). Invalid variants must consume neither a voice nor an ID/recorded onset.
2. [Minimal sound-source correction e92a7bd](https://github.com/my-edutu/Ai_games/commit/e92a7bd10483e0d557e92e0aca0589c06e19d39c): introduce `verifiedWardenWarningFoleyActor`; require the correct authored warning visual/audio/proof, positive bounded actor ID, null target, safe future attack tick, final warning exactly one tick ahead; bind the tuple to `sceneKey:tick:kind:actor:-`. Both authored warnings enter the same canonical admission gate, bounded event history and five-tick replay watermark already protecting physical sounds.
3. A real named Warden warning is **anticipation**, never impact proof. Anonymous `threat-warning` remains neutral and is not attributed to an invented Warden.

**Verification honesty:** The test was authored and committed before the patch, and inspection of the original condition shows it would accept malformed warnings. The local coding tunnel returned `Tunnel-client has not been seen for 300 seconds`. No native RED/GREEN execution or fresh browser completion was available through that tunnel at handoff. Do not report a new 331/331 result until the GitHub CI job actually completes.

## Preservation and review

The change allocates no new WebAudio nodes, noise buffers, voices, visual pools, queue entries, textures or game objects. Existing limits remain eight live voices, one 13,440-sample mono noise buffer, seven visual pools, 32 pending effects/awaiting-frame and 64 receipts. Scene/reset lifecycle, opt-in click, mute and persisted preference, frame-receipt gate, no-invented-hit semantics, reduced-motion/flash and default legacy spectator are unchanged.

**Specification review:** authored boss warnings require current future danger evidence, the generic anonymous warning stays generic, no HP or combat authority altered. **Quality review:** bounded immutable cue fields and no added hot-path allocations; tests cover real positive planner output and malformed negatives. Risk: full native tests and genuine A/V playback of the new warning authorization remain unverified; guard against falsely claiming completion.

**Rollback:** revert only the D04 sound-source correction on this branch if D10 integration finds an incompatibility; retain the negative test as the correct criterion.

## Next dominant blocker

Actual multi-second WebGL frame-delivery stalls dominate observable HP-impact quality, not the new bounded warning predicate. Continue matched legacy-versus-D04 renderer-phase forensics, then three-viewpoint 1440px/390px Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/HP-contact tracks, original PCM alignment and 20-minute soak. Never fabricate a hit or extend the sound deadline to hide a missed frame.
