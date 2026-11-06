# Infinite Tower Climb — P0 runner-unblocker: immutable local source capture (2026-11-06)

**Active PR:** [Draft #68](https://github.com/my-edutu/Ai_games/pull/68), branch `feat/tower-transformation-gauntlet-20261101`; PR58 remains the live base and is not edited. **Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9` unchanged. **Verdict:** **NOT EVALUATED**.

## Largest verified current blocker

Inspected GitHub's actual workflow-run/job/artifact responses. [Capture 42189740735](https://github.com/my-edutu/Ai_games/actions/runs/42189740735), source `dfb866ed75cef2ea1d7f0d6129a5b9dee8c73e93`, still reports **all nine jobs QUEUED and zero artifacts**. [Quality 42189740850](https://github.com/my-edutu/Ai_games/actions/runs/42189740850) is also QUEUED; exact evidence HEAD `6d9e6d76bdaf9c8127912e1e7507e285d09f79a0` has [quality run 42190069764](https://github.com/my-edutu/Ai_games/actions/runs/42190069764) still queued. This is a **runner-allocation/execution blocker**; root cause (capacity, billing, permission or availability) cannot be established without runner administration access. Immutable-SHA concurrency already prevents superseding older jobs, but does not execute queued jobs. No new exact-source desktop or portrait WebM was obtained or inspected.

Historical [completed source-pinned visual run 42104896643](https://github.com/my-edutu/Ai_games/actions/runs/42104896643) at old candidate `8fd9018f` showed the guardian and physically earned doorway too small/unclear in portrait; no clean full-body 8→9 crossing was established from normal-speed film. This is the **largest actual observed film defect**. It is not evidence against the latest source.

## Concrete verified source change

Added [`scripts/tower-offline-evidence.sh`](https://github.com/my-edutu/Ai_games/blob/345d7f15f01cacc8bfd343b327b517949f1717c0/scripts/tower-offline-evidence.sh) at commit [345d7f15](https://github.com/my-edutu/Ai_games/commit/345d7f15f01cacc8bfd343b327b517949f1717c0), an alternative to indefinitely queued Actions **for a machine with a repository clone, Node 22+, Playwright Chromium prerequisites, and both commits available**:

- Requires the *exact 40-character candidate SHA* as its input; verifies the frozen baseline's local commit ancestry.
- Creates **detached temporary worktrees** for the frozen baseline and exact candidate; never checks out or moves either active branch, pushes, merges, or changes draft state.
- Copies only neutral, same-source capture harness files onto the baseline worktree. Protects the ORIGINAL `scripts/serve-tower-stream.cjs` blob and untouched game authority/renderer paths for both builds, refusing to capture if modified.
- Uses identical seeded, original 20Hz source game and CI software-rendered Chromium captures in native **960×600 desktop** and **390×844 portrait**, with real-time 60s+ gameplay test for ascent, danger/guardian floor 8, actual outcome/restart and supplemental moving floor 7.
- Retains both original WebM videos, source/host SHA sidecars and per-run logs, including failed captures, and executes existing source-event pairing into a **NOT EVALUATED** manifest. It explicitly does not assert full-motion film events, supported-device FPS, genuine blind preference or acceptance.

**Suggested invocation from an up-to-date clone with both commits fetched:** `bash scripts/tower-offline-evidence.sh <exact-candidate-SHA>`. It performs the source-only browser capture locally and writes artifacts under `artifacts/tower-offline-...`. This is a fallback, not a claim that the currently disconnected runtime ran it.

## Verification and next P0 action

- **Verified:** actual PR68 draft/head and immutable baseline value; GitHub run statuses, empty capture artifacts, source and original capture-harness contracts, new fallback file's GitHub commit. No PR58 edits.
- **NOT EXECUTED:** local fallback (no authenticated source checkout or browser/worker host available here), shell integration on a real workstation, Node build, 3,200-tick live campaign, original current-source WebM, event-matched visual footage, genuine independent reviewers or device frame-time/memory.
- **LOOKS / FEELS / PLAYS critics:** **0/5, 0/5, 0/5**; no randomization or review attempted.
- **Next highest-impact action:** run the exact-SHA fallback on an authenticated local/CI host with Chromium, inspect *full normal-speed WebM* from both viewports and source event alignment through guardian/crusher defeat → grounded bronze threshold crossing → floor nine → authentic outcome/restart. If the same film defect persists, fix the **complete action composition**, not another cosmetic unit patch. Perform repo tests/replay, hardware p50/p95/p99/memory, accessibility, then independent blind criticism only after matched footage exists.

**Safety:** baseline frozen, PR58 untouched, PR68 open draft; no force-push, merge, deploy, fabricated videos/reviews/outcomes or promoted quality verdict.
