# D04 — Authority-revoked Warden warning retirement at real frame receipt (2026-11-16)

**Status:** isolated D04 fix committed; actual repository Node/build and corrected-head Chrome acceptance **UNVERIFIED**. This is not a combat-realism or production-readiness pass.

**Scope:** `feat/dungeon-d04-combat-feedback-realism-20261108` only; no main, PR #49, `games/ai-dungeon/src`, rigs, cameras, global lights, or other sessions. Frozen BEFORE comparison remains `281735d0910c6b2443648af976003d50412ee324`.

## Defect and causality

After D04 staged a genuine Warden warning, its public danger footprint could be revoked **between visual advance and the completed WebGL submission**. The controller correctly rejected the old warning's audio as `retired-warning`, but kept the retired glyphs in the signal instance pool until the following `advance()`. A frozen or delayed subsequent frame could preserve eight misleading danger tiles after authority had already withdrawn them. This is distinct from the earlier verified slow-render and HP-injury visibility failures; this correction does not solve those failures.

An audio timeout alone is **not** permission to erase an actively threatened cell. The fix therefore introduces exactly one explicit presentation-cleanup reason, `authority-revoked-warning`, guarded by the visual adapter's independently sampled **current** public Warden warning and its existing full danger-cell/scene/attack-tick validity check. It cannot retire other effects, including still-live warnings, or create attacker, target, strike, or HP evidence.

## Commits and touched files

1. [`88e2a99`](https://github.com/my-edutu/Ai_games/commit/88e2a99ea2b7b5e791b7fba9798e2b310f7063e2) — first commits two regressions in `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`: live warning survives, revoked warning promptly clears all eight GPU slots with dirty matrices and idempotent cleanup; controller's genuine frame receipt requests cleanup and rejects overdue warning sound.
2. [`9d8db0a`](https://github.com/my-edutu/Ai_games/commit/9d8db0a96516382d483537a2ef39fa931676a17e) — `public/ai-dungeon/physical-feedback-visuals.js` permits the new reason **only** when an actual snapshot getter exists and the original Warden danger is no longer live; preserves the default prohibition on removing live warning markers.
3. [`836d676`](https://github.com/my-edutu/Ai_games/commit/836d676b07c9bc5d5f587fa423cbde6cc17b1bdd) — `public/ai-dungeon/physical-combat-feedback.js` requests targeted retirement on the real frame-receipt's already-authorized `retired-warning` branch; leaves warning foley refused, never authorizes another sound.

No WebAudio buffer, listener, voice, VFX pool, draw call, authoritative tick, timer, or camera work was added. Seven existing retained pools and 102 reserved instances remain. The prior 8-voice cap, 32 pending/32 awaiting-frame/64 receipts, mute, opt-in, reduced-flash/motion, dedupe, reset, and 400ms audio deadline are unchanged. Normal `/dungeon` remains legacy default; experimental feedback still requires `?feedback=d04`.

## Verification, separated by evidence quality

**Executed isolated source-level RED/GREEN:** The shared coding tunnel reported `Tunnel-client has not been seen for 300 seconds`. Using the GitHub connector, the *actual* before and corrected visual-stage JavaScript modules were fetched and executed in a V8 isolate with bounded Three.js test doubles and the actual planner/Warden lifecycle code:
- BEFORE (`676c714`): eight verified warning cells admitted, live retirement = 0, after public cancellation retirement = **0**, eight stale signal slots remain (**RED**).
- Corrected: eight admitted, live retirement = **0**, after cancellation retirement = **8**, signal slots/draws = **0** (**GREEN**).
- Corrected controller module, actual planner and frame gate with a mock sound bus: one staged warning; genuine numeric frame receipt requests `authority-revoked-warning`, returns `retired-warning`, emits **zero** warning sounds.
- Committed test file parsed in V8; GitHub comparison confirms exactly three D04-owned implementation/test paths through `836d676`.

**Not verified:** This was **not** an executed Node `--test` RED/GREEN, `npm run build`, a new-head real Three.js/Chromium render, a decoded original-PCM alignment, or a 20-minute soak. Commit/status API exposed no corrected-head workflow verdict. Do not promote isolated V8 stubs to full repository test evidence.

**Historical genuine Dungeon evidence only:** [Previous Chrome run `43816409781`](https://github.com/my-edutu/Ai_games/actions/runs/43816409781) was on preceding head `99b6206`. It recorded cinematic, tactical and chase views at desktop and 390px mobile, but rejected strict A/V acceptance: five shared authoritative HP-loss ticks and **zero** injuries universally drawable across all six viewpoints. Real impact submissions took 2,217–2,985ms on some receipts; D04 CPU visual times were far smaller. Original PCM contact timing remains unverified. This defect's corrected effect was **not** observed in those old clips.

## Next steps and acceptance gates

When a coding/browser runtime is available, run `npm ci && npm run build`, then `node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs`, and `npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs` on the branch head. Obtain matched genuine source+opted-in-original-sound clips from cinematic/tactical/chase at 1440×900 and 390×844, including a cancelled warning crossing the real WebGL receipt. Inspect matrix/pixel evidence separately from `hasDrawableCue` and WebAudio scheduling receipts. Revalidate Warden warning, release, recovery, earned counter, miss, block, dodge, projectile, spell, HP-only impact, mute/reload, flash/motion reductions, renderer recovery, saturation and 20-minute cleanup soak.

**Dominant ongoing limitation:** multi-second WebGL submission delays and missing independently confirmed visible HP injuries; sample-aligned original sound is still unproved. The D04 isolated owner can observe and instrument its bounded effects but must not edit another session's renderer, camera, character rig, lighting, authoritative game or merge path.

**Rollback:** revert only `836d676` and `9d8db0a` if cancelled-hazard removal is visually incorrect; keep `88e2a99` regression as a reproduction. No default switch or integration merge without dedicated final D10 review.
