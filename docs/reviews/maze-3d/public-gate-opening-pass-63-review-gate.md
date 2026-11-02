# Pass63 — a gate must actually open in the 3D world

**Review date:** 2026-11-02T02:26:24.499Z  
**PR:** [#53 (open draft)](https://github.com/my-edutu/Ai_games/pull/53)  
**Primary bar:** [real Nintendo Captain Toad imagery](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/)  
**Verdict:** source-and-infrastructure candidate only; **Nintendo still wins**. No source-bound Pass63 original full-resolution WebGL capture of the actual opening moment or independent critic approval has been obtained.

## Specific gap and independently judgeable pieces

The previous [Pass62 real 14-image WebGL artifact](https://github.com/my-edutu/Ai_games/actions/runs/41373765475/artifacts/13110228983) shows authentic, fully in-frame Pip and Thornback in the native 320/390 portrait, 844 landscape and 1280 desktop. A scene still has far less instantly legible, physically causal action than the fixed Nintendo imagery. The smallest meaningful new event is a real known key opening a genuinely known gate, expressed without text.

1. **Authority/public knowledge:** `gate-moment.mjs` acts only on two genuine source snapshots from one run where an already observed gate changes from CLOSED to OPEN, rejects other runs, terminal, stale, just-revealed or unknown doors. It never opens a gate, moves AI, guesses a key, or reveals a hidden route.
2. **Physical rendering:** the existing actual bronze 3D gate-bar group is raised and compressed into its carved lintel for at most 0.85s, then completely hidden; it cannot re-seal the authority-open passage. Uses old geometry/material resources; no per-frame allocations.
3. **Accessibility:** reduced motion must skip the lift, allow a fully open presentation, and preserve existing real audible and text event caption (no decorative HUD narration).
4. **Product/static serving:** the new transitive import must return 200 JavaScript on `/maze/gate-moment.mjs` through the *real server* (not just by looking at source); browser must render genuine WebGL.
5. **Art/UX:** capture the actual same-seed same-run close→open event in 320×740 and 390×844, along with 844×390 and 1280×900, original full-frame WebGL PNG + exact source SHA/UTC JSON. Reject any hidden actor, off-screen physical silhouette, decorative invented event, overlapping bottom prose, unreachable 44px control, fabricated screenshot or acceptance derived only from test counts. Compare actual images directly with fixed official Nintendo stills, preferably blinded by a separate fresh critic.

## What was delivered

[43734cf](https://github.com/my-edutu/Ai_games/commit/43734cf963a5922dff1e11ee51473588d3f3ef4b) code and policy tests; [62a8605](https://github.com/my-edutu/Ai_games/commit/62a86056d6b07ea7faeeb6df22cd04489442a751) real-Three test loader and authored mesh assertions. The initial [focused run 41376639991](https://github.com/my-edutu/Ai_games/actions/runs/41376639991) failed *data: URL relative ESM resolution*, repaired without reducing any tests. The second [focused 41376912552](https://github.com/my-edutu/Ai_games/actions/runs/41376912552) completed Node phase work with zero failures but had real WebGL startup timeouts due the actual static server omission of the new module. This was not CPU throttling. [586df83](https://github.com/my-edutu/Ai_games/commit/586df8385160056f84fd336d036e081fc7ce90ae) fixes the actual route and adds an early 200/MIME browser check and exact SHA coverage for the new module. The source CI [41377400273](https://github.com/my-edutu/Ai_games/actions/runs/41377400273) and separate monorepo [41377400294](https://github.com/my-edutu/Ai_games/actions/runs/41377400294) had not finished when documented.

## Critical evidence gate / honest limitations

**No Pass63 screenshot is accepted yet**; prior Pass62 14 dated hashed images are baseline only. A standalone fresh-context critic, subagents and Ultracode were not available through the disconnected shared workspace; no blind A/B conducted. SwiftShader is severely CPU-limited on shared CI, but the two diagnosed failures above are actual ESM test-harness and product HTTP-serving defects, not rendering-speed evidence. The earlier [full-monorepo 41373765388](https://github.com/my-edutu/Ai_games/actions/runs/41373765388) failed three other-game Tiny Kingdom checks; no changes to other games were made.

The strongest remaining gap is **a genuinely staged, legible, fully modeled original playable world and autonomous physical action** rather than more HUD text or screenshot-count gains. Even if the gate passes all tests, it is only one small physical game-moment toward the primary quality bar. **No merge and no deployment.**
