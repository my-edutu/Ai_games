# D04 — Canonical HP art/foley admission (2026-11-15)

**Status: IN PROGRESS / NOT ACCEPTED.** Isolated `feat/dungeon-d04-combat-feedback-realism-20261108`, frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`. Do not merge main or PR #49. Legacy is default; D04 requires `?feedback=d04`.

## Observed issue and scope

The genuine [six-view Chrome recording](https://github.com/my-edutu/Ai_games/actions/runs/43671371988) had **zero HP-loss ticks drawable across all six viewpoints**, primarily blocked by large WebGL submission delays, including legacy. This change is **not a claim to fix stalls**.

A separate causality defect was confirmed by [test-first native RED](https://github.com/my-edutu/Ai_games/actions/runs/43684291613): D04's visual stage minted a retained hit-fragment fan merely from `proof:'observed-hp-drop'`, `verified:true`, and a cell even when HP metadata was null. The strict original sound engine already rejects that evidence, but the visual path was more permissive. RED specifically recorded `true !== false` on the null-delta case.

## Implementation

- Production `createPhysicalCombatFeedback` enables `requireVerifiedHpReceipt:true` only for its owned visual stage; injected adapters remain untouched.
- The visual hit path reuses the strict `isCanonicalVerifiedCombatFoleyCue` predicate already used by original audio. It requires coherent positive damage, max/remaining HP, severity, victim-only ID, scene/tick/kind/visual/audio and an observed victim cell; an attacker is never inferred.
- Validation occurs before seven retained pools are allocated. Invalid receipts cannot produce fracture art. Standalone geometry/visual auditions keep their existing permissive default to preserve isolated test fixtures.
- The 400ms audio deadline, run authority, WebGL submission receipt, legacy mode, rigs, camera and lighting are unchanged.

## Verification and acceptance status

Native test-first RED is confirmed. New contracts cover invalid/missing/contradictory HP deltas, fabricated attacker/source/ID, ordinary positive HP loss and fatal HP loss, plus strict production wiring. Corrected native GREEN and genuine Chrome playback must be reported only after workflow completion. No source-level test establishes actual decoded impact pixels or contact-to-PCM alignment.

Budgets unchanged: seven pools, at most 104 reserved VFX instances, eight sound voices, 32 awaiting-frame effects, 64 receipts, existing WebAudio gesture consent, mute persistence, reduced-motion/flash and cleanup/deduplication. No borrowed samples; all foley is local synthesis.

**Next dominant weakness:** mobile original impact still misses the real frame deadline under multi-second renderer stalls. Repeat real six-view playback and independently inspect VP8 pixels, Opus PCM and frame clocks. Complete Warden warnings/releases/recovery/counters, miss/block/dodge/arrow/spell, and 20-minute soak remain outstanding.
