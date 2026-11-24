# Pass475 — original four-viewport visual A/B rejects Pass473 light-only candidate (2026-11-18 UTC)

## Exact-source native evidence

- Post-candidate visual SHA: `2b18dca43f49ad37bd7ebbd46439212ff7bf0803`. [Successful native workflow](https://github.com/my-edutu/Ai_games/actions/runs/44249648818) and [unaltered image artifact](https://github.com/my-edutu/Ai_games/actions/runs/44249648818/artifacts/14404415046).
- Pre-candidate verified comparator: `22be5c02c0fa1e9ac36256640d0190d994faa823`. [Successful native workflow](https://github.com/my-edutu/Ai_games/actions/runs/44237318037) and [unaltered image artifact](https://github.com/my-edutu/Ai_games/actions/runs/44237318037/artifacts/14398703284).
- Both ZIPs were retrieved, unpacked and SHA-256 checked against their own screenshot metadata. **40/40 sidecars each, 3/3 genuine gate chronology hashes each**. Original viewports include 320×740, 390×844, 844×390, 1280×900; no source screenshot was cropped or pixel-modified during review. Side-by-side composites served solely as inspection.
- Same public tick34 390×844 guardian brace differs mean absolute RGB **5.6368/255** between actual whole frames. Pip and Thornback remain crowded by the same stone/ornament stage; the physical danger is no more obvious at mobile size. Same tick94 390×844 earned lantern counter differs **4.5869/255** and Thornback remains masked by decorative architecture; the original Follow tick34 guardian screenshot is **pixel-identical** to comparator.
- Same tick464 390×844 pressure frame differs **20.2876/255**, but Pip is in a visibly different animation orientation and the physical shutter is not materially more legible. A difference statistic is not itself an artistic or gameplay gain.
- Pass474 [whole-repo CI](https://github.com/my-edutu/Ai_games/actions/runs/44249648835) passed all **895/895** source assertions before failing at missing `tiny:stream:self-test` and cascading expected phase artifact uploads. Not a Maze WebGL failure; no proof whole repository is green.

## Visual criticism

**Rejected.** The Pass473/474 event-light module was mechanically correct and native-browsable but it did not produce the significant original 3D Pip/Thornback/pressure separation demanded by the fixed official Nintendo screenshot comparator. Real scene readability and event coherence remain weak, especially foreground occlusion at 320/390 portrait. The subject's physical counter and hazard must dominate by meaningful composition/action, not minuscule global irradiance shifts. No fake missing geometry or renderer bug is alleged.

## Safe change

Roll back only the experimental light wiring and its temporary route and dedicated helper/test, restoring the exact Pass472 source blobs. Preserve every already proven scene/gameplay change before Pass473 and every strict framed full-body/6-reset/privacy threshold. Keep docs, ledger and live journal as one same-commit evidence trail. Require exact rollback-HEAD WebGL CI before acceptance. The separate coding workspace, fresh-context independent builder/critic and Ultracode were unavailable (`NOT_FOUND`); this is an explicitly single-reviewer decision, not an independently adjudicated Nintendo bar win. Keep draft PR #53 open, unmerged and undeployed.
