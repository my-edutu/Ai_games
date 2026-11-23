# 2026-11-23 — bbce17 live full-serpent GPU transfer compaction (UNPROMOTED; NOT a performance or visual win)

## Provenance and decisive current-head evidence

Actual connected PR #52 is OPEN/DRAFT, branch `feat/autonomous-snake-3d-gauntlet`, head `bbce17cac5781b0a92ffe1bf55865cc8b8b06cea`. All six original Actions completed. Original [Chromium run #45019872777](https://github.com/my-edutu/Ai_games/actions/runs/45019872777) reports **10/17 complete WebGL submissions in the unchanged mandatory one-second desktop gate**, drawing buffer 751×415, with original 1920×1080 and 390×844 screen still clearly rectangular and under-emphasizing the hero. Original [native CI #45019872716](https://github.com/my-edutu/Ai_games/actions/runs/45019872716) failed 749/822. These are historical ORIGINAL-source measurements, not a candidate FPS result.

Source and pinned node_modules were obtained from [same-head offline reproduction run #45019872761](https://github.com/my-edutu/Ai_games/actions/runs/45019872761); `source-commit.txt` and both SHA256SUMS matched. The large previous physically connected seven-grove/ruined-coast plus cervical repair and static attributes bundle was cleanly applied locally to **exact parent**, then this one integrated new candidate was developed against it. Remote git clone had DNS failure; local Chromium normal localhost navigation returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`. No bypass or candidate 3D capture was attempted after the denial.

## Defect and RED acceptance

Original live 512-ring body backed both per-vertex banked normals and all indices with Float32/Uint32 despite normal components being unit-bounded and all 10,752 reserved high-detail vertices fitting 16-bit. That transfers/allocates 589,824 backing bytes even for a typical 48-segment drawn hero. Two new actual Three.js production actor RED tests failed 2/2 before implementation. The requirement was preserve EXACT Float32 position/UV, every original true triangle and portal discontinuity, bounded normal shader error and safe rollover for genuinely long (>65,535-vertex) snakes.

## Production change

The actual `serpent.mjs` now uses `Int16Array` signed **normalized** Three.js GPU normals with strict finite/unit bounds. It uses `Uint16Array` indices ONLY while the **worst-case full-detail** ring capacity remains addressable; genuine long-body reservation atomically upgrades to Uint32 at capacity growth, disposes previous geometry and continues rendering the complete untruncated body. Original Float32 positions and UVs, all model materials, shaders, textures, casts/shadows, public gameplay and cache-pressure/raster thresholds remain untouched. Both updated historical native allocation gates are **stricter smaller exact storage bounds**, retain original ceiling and original triangle/portal/reallocation assertions; the historical immutable `df113` ancestry check still reconstructs the byte-exact original digest using strictly recognized reversal bytes, and still rejects tampering.

Paired native Three.js against the **same exact original source with prior cumulative unpromoted changes** (not screenshot evidence): 48-detail, 96-overview and 48 segmented portal each preserve exact original 3D Float32 position/UV and every index/triangle; max decoded normal error <=0.000014177 per component. Each retained 512-ring backing uses **402,432 vs 589,824 bytes (31.77% smaller)**. A real high-detail 650-body case promoted to 32-bit indices as necessary and retained all 95,424 vertices/181,720 triangles, using 8,404,992 vs 9,437,184 bytes (10.94% smaller). Native evidence in `scripts/compare-snake-live-packed-20261123.mjs` and linked paired JSON; **these are backing byte counts, NOT real GPU time, memory usage, FPS or physical display presents**. No assets, geometry, light, cues or scene quality stripped.

## Regression

- TypeScript build PASS; original 900-tick real authority/private snapshot/restart/recovery PASS, checksum `82492d82`.
- New TDD RED 0/2 on prior candidate -> GREEN 2/2 with real `createSerpent` full geometry (48, 96, 650 and portal/high/low). Historical exact ancestor + both tightened original GPU buffer tests GREEN 3/3.
- 34-test proportional native selection **31/34**, exactly THREE unchanged-parent reproduced failures: legacy body capacity-equality (existing 448-cell growth), river-green pigment assertion, and stale director-camera allowlist. Both tests previously broken by new valid smaller storage were updated to assert stricter exact bounds and now PASS; no case removed.
- Ten real authoritative 28×16 deterministic headless games aimed at length 48 produced BYTE-IDENTICAL original and candidate JSON including per-run outcome, score, ticks and checksums. No authority changes or replay divergence.
- Full `npm test` attempted: large parallel suite contains known inherited native failures and could not be certified green within this run. Do not claim full green, browser pass, 45–90sec candidate uncut movie, unchanged >=17x3, real-device >=30 displayed FPS/p95, or independent whole-game critique.

## Review / decision

**SPECIFICATION:** source-exact long-body and portal native protection pass; no gameplay authority/fair-influence privacy contract altered. **QUALITY:** normal quantization max <=1.42e-5, immutable geometry/index and true 16-bit rollover passes. CPU cost of converting normals and physical GPU benefit are not benchmarked in Chromium; this does NOT cure the observed 225ms live GPU profile. **T0 UNSIGNED; T1 current-head visual SELF-REJECTED / cumulative candidate UNJUDGED; T2/T3 BUILDING; T4 HARD RED; INDEPENDENT ACCEPTANCE PENDING**.

Do NOT promote this candidate until original whole-game material/regression/real WebGL visual/motion evidence and the unchanged mandatory complete-render gate are available. The original draft branch remains unmodified; no merge, deploy, force push or Actions cancellation.
