# Game 7 — Hardening continuation review

**Date:** 2026-09-10  
**Repository / branch:** `my-edutu/Ai_games` / `feat/game7-premium-motorsport-upgrade`  
**Code revision:** `7de7b565657d8bb7137e20401f1f9ce1158b2bdb`  
**Review class:** implementer self-review; not independent certification  
**Verdict:** scoped hardening verified; overall premium upgrade remains in progress. Do not promote to R5 or claim all design requirements are satisfied.

## Delivered in this continuation

The broadcast no longer trusts a client-supplied timestamp or viewer ID to enforce cooldowns. HTTP participation uses a signed, HTTP-only, same-site session cookie; the server supplies reception time using a monotonic clock. Commands bind to the visible tournament and round. Cross-origin mutation, missing sessions, stale run/round references, malformed bodies, and duplicate requests are rejected before authority admission.

Operator control is disabled unless an explicit credential is configured. The old known default credential is removed. The standalone host binds to loopback by default. These are prototype controls, not a claim of production ingress security or verified viewer identity.

Authority admits only one pending/active global wind field at a time, with a 900-logical-tick cooldown and 32-command tournament cap. The final championship rejects wind influence. Requests received during introduction wait for the first racing tick; expiry is exclusive after 180 ticks. Accepted applications remain in the Assisted record category. An active field cannot be silently overwritten by a later direction.

Snapshots clone their inputs on both capture and restore. Capture normalizes the durable JSON representation before checksum computation, including optional contact-event fields. Restore checks configuration agreement, complete/disjoint competitor membership, matching statuses, integer logical counters/velocities, influence vector bounds, conflict state, and event sequence/history bounds. The new snapshot envelope explicitly requires `wind-policy-v2`; older input-policy snapshots require a fresh run, not silent migration.

Public events pass through an explicit type/field/value allowlist. Internal integrity diagnostic detail and participation identifiers do not cross into the public event/replay feeds.

Desktop and landscape layouts now fit fixed viewports instead of expanding around the Canvas intrinsic size. Clean feed fills exactly one viewport. Portrait mode deliberately scrolls and retains reachable audience controls. Browser checks now reject vertical clipping, horizontal overflow, out-of-viewport arena/HUD, and browser errors rather than checking horizontal overflow alone.

## Evidence

### Test-first observations

The existing local baseline passed 45 tests and the HTTP self-test. Seventeen additional hardening regressions were observed failing before their fixes; the final local suite passes 62/62 with no skips. Browser CI run `34462292226` (revision `e22ab42`) demonstrated the intended red gate: a 1143-pixel document clipped the arena in a 1080-pixel viewport. This was a real Chromium layout failure, not a setup error.

### Exact-code CI

GitHub Actions run **69**, ID **34464582959**, passed on `7de7b565657d8bb7137e20401f1f9ce1158b2bdb`:

- TypeScript build and Game 7 upgrade/foundation tests;
- authoritative HTTP self-test;
- authoritative ambient-nondeterminism scan;
- production dependency audit and recorded full development audit (zero reported vulnerabilities);
- all six browser capture scenarios;
- enforced 8 ms p99 authority tick budget.

Artifact **10146984794**, `game7-premium-upgrade-evidence-69`, contains the exact source archive and commit identity, browser manifest, screenshots, audit JSON and performance JSON. Its SHA-256 ZIP digest is `c38c9640577eee81923b50875f2aba3e9372a93861149ec84876ce5d40bb882f`. Downloaded source was compared against the locally tested implementation: all implementation and test contents match, ignoring final newlines; the continuation plan differs only in progress annotations.

### Browser inspection

Screenshots were inspected, not merely generated. The 1920x1080 Balanced/Assisted, 1366x768 Low, 844x390 Low and 1920x1080 clean-feed cases have no document overflow and retain the arena inside the viewport. All six captures report zero browser errors. The 390x844 portrait view has intentional vertical scrolling, no horizontal overflow, and its arena initially visible. This does not prove ten-second comprehension or low-bitrate legibility. At narrow size the marbles and numbers remain too small for a confident full accessibility sign-off, and the contender panel still requires scrolling.

### Authority performance

Measured on the CI AMD EPYC 7763 host, Node v22.23.2, Linux x64:

| Scenario | Samples | p99 tick | Worst sampled tick |
|---|---:|---:|---:|
| Ordinary runtime | 900 | 0.5495 ms | 1.5981 ms |
| Forced 32-marble contact fixture | 360 | 1.1966 ms | 1.6131 ms |

Both pass the declared 8 ms p99 budget. The dense fixture deliberately repositions bodies each tick to stress contact work; it is not evidence of a naturally occurring tournament distribution. These are short CPU measurements, not browser frame-rate, GPU, OBS compression, memory-soak or low-end hardware certification.

### Additional bounded seed campaign

A separate local campaign ran production `MarbleRuntime` rules on seeds `hardening-campaign-0` through `hardening-campaign-31`, half with a single allowed wind command. Each run was compared with a twin reference; JSON snapshots were restored at each round boundary.

Results: **32 valid champions; 32 exact five-round brackets; 32 matching reference replays; 160 round-boundary restores; 16 exactly-once wind applications**. All 160 rounds resolved by quota. Full results and the reproduction script accompany the conversation's review bundle. This is a bounded regression campaign, not a statistically calibrated balance study.

## Open blockers and unverified requirements

**P1 — Tournament pacing does not meet the approved design.** Default tournaments completed in **10.18–12.32 seconds** across this corpus. The approved design targets minute-scale rounds/tournaments. This hardening change does not stretch simulation time, slow authority for presentation, or mask the issue with long intermissions. A versioned gameplay/pacing pass and a new measured seed corpus are needed.

**P1 — Championship generator falls back in every sampled run.** All **32/32 championship rounds** used fallback arenas; other sampled rounds did not. Total fallback was **32/160 rounds**. The safe fallback keeps authority valid but does not establish the intended championship-course variety or challenge. Diagnose the validator/generator conflict, preserve broken seeds and test the repaired generator before changing its version.

**P1 — Full approved influence scope is unfinished.** Wind is operational; gate tempo, shield orb, cheer pulse, theme choice and next-arena selection still fail closed. The field currently follows the first eligible request, not an aggregated majority vote. Do not market six operational families or paid/provider integration.

**Further gameplay/presentation work:** the current AI still uses a simple lane-seeking policy; full bounded personality utility and decision-cadence validation are not closed. Result-bound replay coherence, simultaneous decisive camera framing, Canvas-level reduced motion, low-bitrate number readability, authentic material/rotation behavior, low-tier wind cues, and natural dense-contact behavior require targeted runtime/capture tests. The view is an improved Canvas prototype, not a measured ultra-realistic/4K-60 result.

**Operations/security limits:** anonymous session cookies are not verified people and do not solve multi-session bot abuse. Credentialed providers, production ingress/rate capacity, operator audit/roles, durable host checkpoint journaling, process-crash recovery/fencing, real output/audio health, rollback drills, independent reviews, 72-hour soak and seven-day canary are not complete. Checksums detect inconsistency, not malicious replacement by a party able to recompute them.

**Integration evidence:** the whole-catalogue `npm test` attempt exceeded the local execution budget without final totals. No whole-repository pass or merge-readiness claim is made. The focused Game 7 suite and exact-code CI passed. Other games and main were not modified or merged.

## Next implementation priority

Fix default tournament pacing and the systematic final-arena fallback before expanding spectacle. Keep the current branch for continued work; this review does not authorize production deployment, R-level promotion, or an automatic merge.
