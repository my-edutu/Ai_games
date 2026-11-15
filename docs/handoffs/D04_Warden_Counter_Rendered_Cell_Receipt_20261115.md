# D04 — Earned Warden counter rendered-cell receipt (2026-11-15)

**Status:** isolated source correction and test-first contract; genuine audiovisual acceptance remains **UNVERIFIED / NOT ACHIEVED**. This is not a gameplay, character, camera, lighting, or global rendering change.

## Provenance / protected boundaries

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`, based on inspected head `606d9db06fcc3a37f824bf909991864e41009de5`.
- Frozen BEFORE milestone: `281735d0910c6b2443648af976003d50412ee324`; acceptance: `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`.
- RED regression commit: `7e9358b344a50454f32c82614cb7a510db247501`; Actions run [43750699017](https://github.com/my-edutu/Ai_games/actions/runs/43750699017) failed its native test step as intended.
- Production change: `1c9d68ddcc9c300e9ab60a56e1d6def0c0e736c3`. Stronger actual-root matrix assertion: `51e1d30879d45b59d599ca0f68a62a4cf76bdc31`.
- No changes to `games/ai-dungeon/src`, main, PR #49, rigs, camera, global lighting, or other branches.

## Corrected source-level presentation defect

The established D04 injury admission admits a **unique same-tick public HP victim** when the actually drawn root has reached its current cell but the actor's cached cell remains exactly one step behind. The *earned Warden counter* had an additional stricter check that rejected that identical verified HP transition solely because `actor.u.x/z` still held that previous cell. Original Warden sound and visual admission could therefore disagree even though the root and public casualty were consistent.

The counter witness now reuses `matchesRenderedHpVictimCell` together with `drawnHpMatchesObservedTransition`. The one-step exception is allowed **only** when the real root is within 0.58m of the CURRENT authoritative Warden victim tile and the unique public victim has matching identity, kind, faction, scene, tick, actual remaining HP, max HP and canonical damage delta. No attacker is inferred. It still rejects different max HP, two-cell cached positions, displaced roots, duplicate public IDs, a later tick and forged recovery proof. The source uses the already-existing helper; no new allocation, pool or audio channel was added.

The focused test checks a Warden whose `actor.u` holds `(x=3,z=4,hp=70)` while the uniquely verified current casualty is `(x=4,z=4,hp=42,maxHp=90)`. It asserts admission and that the actual **instanced signal matrix** is placed at the drawn root's deliberately off-grid position, not the grid centre. It then checks counterexamples and the unchanged 102-instance / seven-draw-call ceilings.

## Authentic browser evidence examined — previous branch head only

[GitHub Actions 43745190366](https://github.com/my-edutu/Ai_games/actions/runs/43745190366) ran the real Dungeon with original WebGL video and explicitly opted-in original sound. Native contracts and production build passed, but the browser job failed its strict authentic damage gate. Its own machine-readable verdict reports `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`, one authoritative HP casualty, a `stale-frame` injury receipt and **1,569ms** observation-to-submission age. This is not the current correction's replay.

The associated six-viewpoint artifact contains 1440×900 and 390×844 cinematic/tactical/chase captures with twelve common authoritative states and five common HP-loss ticks. Each viewpoint independently had one or two drawable HP-loss ticks, but **zero HP-loss ticks passed across all six**. Decoded VP8 frames show genuine distant dungeon scenes; Opus tracks exist but are **not** aligned to physical contact or verified PCM onset. The six recordings use different frame clocks. There are no valid Warden warning/release/recovery/counter, missed-sword, block, dodge, arrow, spell, two-incoming-threat or 20-minute soak acceptance verdicts here.

Matched normal-vs-D04 software-WebGL timing samples in that artifact do not establish D04 as the cause of intermittent multi-second render stalls. D04 effects alone must not be declared optimized by this source change.

## Verification and next gate

The coding tunnel was unavailable. The GitHub branch's native CI and new genuine-browser workflow are the verification path; until those finish, claim only source-level correctness and the observed RED test failure. Run the exact acceptance reproduction and inspect six matched original recordings and **decoded contact-vs-PCM**; do not convert WebM track presence into success. The 400ms submission limit, one-shot receipts, seven retained pools (102 instances), eight voices, consent/mute persistence and reduced-motion/flash safeguards are unchanged.

**Next dominant obstacle:** intermittent 1–2+ second software-WebGL submissions prevent timely real-impact visuals and sound. Investigate paired real renderer phases and genuine mobile 390px contact frames without changing the camera, characters, global renderer or authoritative simulation. The default remains legacy; enable this D04 experiment only with `?feedback=d04` until independent final integration review.
