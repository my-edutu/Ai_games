# TGC-01 — a connected, playable guardian court

**2026-11-22; manual milestone; hourly automation paused.** This implements the first greybox gate in the user-approved *Tideglass Visual and Level-Design Blueprint v1.0*. It does not resume the old Gauntlet. The independent visual verdict accepts the bounded court milestone; the final Captain Toad / Luigi's Mansion 3 / ASTRO BOT quality bar remains **not met**.

## Baseline and scope

Started from exact draft PR #53 HEAD `a97eb68fe73aab44e3645b58e7352937e07e8b68`. Baseline [focused Maze run 45034946996](https://github.com/my-edutu/Ai_games/actions/runs/45034946996) succeeded. Its [original artifact 14760120466](https://github.com/my-edutu/Ai_games/actions/runs/45034946996/artifacts/14760120466) has ZIP SHA-256 `cf983a38e53b7271bdb9c49b4e50ea2b2f739efc8fe83d8b33329e5a0b8c16fa`; 42 original PNG/sidecar pairs were checked. Directly inspected 320/390 guardian frames showed the main structural problem: tall physical masonry divided Pip and Thornback into separate-looking compartments. Passing projected bounds did not make that a coherent encounter.

The new evidence is a different, explicitly authored level. Comparisons with the procedural baseline establish a structural before/after; they are **not** a same-seed pixel A/B.

This change builds real connected terrain, a real guardian-dependent gallery seal, and a complete autonomous key/gate/escape sequence. It deliberately stops at a readable greybox. No decorative micro-fix is counted as the milestone.

## What changed in the playable game

- `guardian-court-v1` is an explicit 17×11 level identity. Its 5×4 encounter court and key gallery occupy the same physical terrace. Every open route is a reciprocal authoritative passage. The surrounding grid has its only connection beyond the terminal exit, so it cannot bypass the encounter or either gate.
- The existing partial-observation policy makes every decision. An earned lantern parry releases a real closed gallery seal in the authority; an inventory key subsequently opens its matching exit gate. No scripted actor move, private route, forced action, or hidden-map camera target is supplied to the AI or renderer.
- The court renderer builds low boundaries and continuous deck only for actually published cells and genuine published edges. It keeps real closed edges and physical mechanisms. It uses existing geometry/material pools. Ordinary procedural levels keep their prior terrain and character presentation.
- The authored Follow camera uses the currently public actor pair, complete physical mesh bounds, and occupied HUD rectangles. It preserves orientation through warning/counter/withdrawal and fits the actual camera rather than cropping images, scaling bodies, or hiding the UI.
- The authored key pickup keeps its real dais, key, and empty socket but omits the tall theatre surround that obscured Pip. The old procedural shrine remains intact.
- A stable one-em numeric slot fixes a pre-existing font-dependent key-counter width. The old one-digit slot was only 8.59375 px under Noto Sans at mobile size and failed the unchanged >10 px visibility guard. Glyph size, text, ARIA, and 44 px control targets are unchanged.
- Ordinary restarts retain the authored level. An explicit next-profile audience selection returns to procedural generation on restart. Omitted layout identity preserves original procedural snapshots/checksums.

## Actual autonomous chronology

Seed: `tideglass-guardian-court-v1`; policy: `partial-observation`. No rejected actions occurred.

| Tick | Authoritative / observed event |
|---:|---|
| 0 | Pip starts the real approach. |
| 1 | The pressure mechanism is publicly discovered; subsequent inspections occur at 3, 5, and 7. |
| 8 | Thornback is first publicly visible on the shared court. |
| 9 | A real lantern parry occurs; Thornback withdraws from cell 93 to 94. The authority releases the guardian seal. |
| 14 | The gallery seal is first discovered, already open. |
| 19 | Pip collects the real gallery key. |
| 21 | Pip returns to the court-side junction. |
| 23 | The matching key gate opens during the legal traversal. |
| 24 | Pip reaches the actual exit and wins the run. |

Counter-to-key is **10 ticks**, below the unchanged ≤120 guard; complete escape is **24 ticks**, below the unchanged ≤200 guard. The actual live recording corroborates the public chronology and one run token with replay ticks 0–24. These are simulation ticks, not a frame-rate or polished-pacing claim. The chapter currently plays very quickly.

**Visibility limit:** the guardian seal releases outside the current discovered view at tick 9. The screenshots and video show it first disclosed open at tick 14. They do not show an on-camera seal-release animation. The later keyed exit gate is visibly closed, then opens in the uninterrupted recording.

## Original native evidence and rejected iterations

`tests/browser/maze-tgc01.spec.cjs` records nine beats at each native size: 320×740, 390×844, 844×390, and 1280×900. PNGs are complete native full frames. Each beat retains capture time, source commit, clean/dirty status, six actual frontend file SHA-256 hashes, image SHA-256, public snapshot, full actor bounds, occupied HUD boxes, and physical occlusion diagnostics. The frame-by-frame evidence replays every consecutive immutable public snapshot from one real autonomous simulation, slowing observation only. It parks the next game animation callback after a real render so the screenshot and diagnostic refer to the same rendered frame.

A separate test records the **unmodified live host** at 390×844: no intercepted responses, forced inputs, forced restart, injected clock, or animation hold. It waits for the host's ordinary next run, records the complete chapter, and verifies the actual replay. Native video, final full-frame PNG, and their hashes are retained.

The first local probes had an environment font defect: Chromium 140 selected installed OpenAI Sans WOFF2 system fonts and rendered zero-width text. Those images were rejected for HUD review. A local fontconfig override rejects that incompatible system-font path and selects Noto Sans. It does not change product CSS, typography requirements, screenshots, or CI thresholds.

The independent critic then rejected two actual composition defects in the first valid images: the 320-pixel goal card covered part of Thornback, and the key theatre obscured Pip's lower body. The physical camera/HUD fit and low key socket described above resolved them. The revised 20 warning/counter/key/gate/escape originals from 21:54–21:56 UTC, and original-size frames from the 17.32-second live recording, were independently inspected and hash-checked.

That review attaches to working-source hashes, not the unchanged baseline Git SHA alone:

| Source | SHA-256 at accepted spatial review |
|---|---|
| `scene.js` | `530c385f651bf780bce35d85b66e756c24900e9098131f8dfd69d1f2b799cfb2` |
| `world.js` | `b9dcf0d97d209077f89dbffdf64761db1ed44beb5b1fbd97c5fda9588dccb8f7` |

The subsequent numeric-slot correction has its own final CSS hash in the new evidence. A fresh **clean, final-commit** capture and CI result belong in the PR checkpoint and generated artifacts. The pre-commit captures are not mislabeled as exact baseline-HEAD gameplay. This review, source, tests, ledger, and journal ship together; no follow-up documentation-only commit should invalidate the critical exact-HEAD run.

## Independent reviews

**Specification / authority reviewer:** separately ran 22 tests and examined restore points 0/8/9/20, private-world perturbations with unchanged public observation, actual next-profile influence, and public event forwarding. No hidden seal identity/dependency was forwarded at the counter. Restores reached the same tick-24 result. No threshold weakening was found. This was a code/authority review, not pixel approval.

**Fresh-context visual critic:** accepted the bounded TGC-01 composition and visual playability milestone. All four viewports show distinct complete actors, a readable connected court, clear key pickup feet/socket, and understandable gate/escape outcomes. At the reviewed counter frames, largest absolute actor NDC values were 0.807 / 0.877 / 0.667 / 0.916 for 320 / 390 / 844 / 1280, within the unchanged ±0.95. Ten sampled body sightlines per viewport were clear; controls were at least 44×44 px. Measurements supported direct image inspection rather than replacing it.

The critic also inspected official Captain Toad gameplay and supporting official Luigi's Mansion 3 / ASTRO BOT images. **No Nintendo-quality win, blind A/B win, finished art, or production readiness is claimed.** Ultracode was unavailable; a separate builder and two independent review agents were actually available and used.

## Tests and their limits

- Baseline build, 309 phase-3 tests, unchanged six-reset browser guard, and stream self-test passed before implementation.
- The changed authority and presentation passed **547 Maze Node tests** across foundation and phases 2–6, with zero failures or skips. After the final court camera/key correction, all **311 phase-3 tests** passed again.
- The new four-view native suite, authored six-reset test, and actual live-host recording passed **6/6**. The six-reset record contains 18 samples across six real run identities, sampled geometry counts **34–74**, at most **4 textures**, initial spread **2**, and one reused public-guide geometry. This is a bounded resource sample, not a hardware GPU frame-rate claim.
- The existing native regression passed **18 tests** covering fallback/reconnect, sound, keyboard/presentation controls, original geometry resets, strict touch layout, earned victory and legacy native evidence. One pre-existing font-width failure is reported above; after the product CSS correction, its unchanged native WebGL test passed **1/1**. Final exact-commit capture and CI outcomes are recorded in the PR checkpoint.
- All existing physical ±0.95 NDC, applicable withdrawal silhouette, privacy/public-discovery, 44 px touch, original six-reset <100 geometry and ≤4 texture requirements remain intact.

Baseline [whole-repository workflow 45034946878](https://github.com/my-edutu/Ai_games/actions/runs/45034946878) was separately red: after 983 unit tests and the Maze stream self-test, its workflow context invoked missing `tiny:stream:self-test`. Downstream jobs were not established green. This unrelated integration failure is not silently fixed or converted into a Maze pass; final HEAD whole-repo status must be reported separately.

## Next manual gate and stop condition

The next presentation priority is the **readable cause and consequence of the counter at normal playback speed**, followed by coherent Tideglass architecture/material/light hierarchy. The current glow is localized near Pip; the raised lantern followed by recoil is visible, but HUD/captions still explain much of the cause. The accepted counter sidecar records `witnessedLanternConeVisible=false`, so it is not a visibly connected beam or polished impact. Sparse floor dressing and isolated fixtures also remain below the reference world-building standard.

Owner: the next user-approved manual art/action-staging milestone. Keep this physical floor, real dependencies, full actor silhouettes, and deterministic public-only rules as its foundation. Do not start another hourly loop or expand this milestone into more passes. Leave PR #53 open and draft. No merge, deployment, force-push, or automation restart.
