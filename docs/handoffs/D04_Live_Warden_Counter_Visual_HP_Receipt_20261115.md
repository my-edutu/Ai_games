# D04 — Earned Warden counter glyph must follow the actual public HP casualty

**Review state:** Source correction committed; corrected native/Chrome evidence **UNVERIFIED** at this handoff. This is not a production-readiness or audiovisual-parity claim.

## Scope and immutable boundary

Repository: `my-edutu/Ai_games`; isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.

Start commit: `2bed2212fddd808e77326b737f3807e5408743c3`. Frozen BEFORE comparison remains `281735d0910c6b2443648af976003d50412ee324`.

The D04 experiment stays behind `?feedback=d04`. Legacy remains the default. Nothing in `games/ai-dungeon/src`, character rigs, camera, lighting, other branches, main, or Draft PR #49 is modified.

## D04-only defect and smallest corrective slice

The source counter VFX ingress previously required only `cue.kind==='counter'` and `proof==='authority-counter-and-HP'`. Unlike counter **sound**, that condition did not validate the canonical victim-only HP/recovery receipt, nor did it require the same current Warden casualty. A reused or contradictory counter cue could therefore request a restrained Warden victory glyph even when the current public body had not lost the claimed HP. This is **a source-level false-success possibility**, not a counterfeit hit observed in six-view encoded footage.

1. [Regression `5161894`](https://github.com/my-edutu/Ai_games/commit/5161894e21133cfada01799c8576cc268dc61987): strict counter trials for forged HP/recovery/severity/IDs, stale run/tick, duplicate Warden IDs, wrong victim cell/identity/capacity, contradictory drawn HP, and the genuine exact prior-to-new health transition.
2. [Production `a96b6ea`](https://github.com/my-edutu/Ai_games/commit/a96b6ea9755d101dd7a661eb58fb515b86792468): the existing **strict D04** renderer now checks the shared canonical original-foley counter cue, then revalidates the unique same-tick Warden public HP and cell (bounded 96-unit search) before any retained body signal allocation. A present drawable body must match the current HP or precisely the proven pre-loss HP, with equal capacity. The standalone permissive geometry audition remains unchanged.

No attacker is derived or named. The actual counter result, HP, combat rules, actor animations, sound recipes, graphics pools, WebAudio consent, mute, reduced-motion/flash, deduplication, 400ms deadline, and frame-submission gate are unchanged. Validation happens once at emission, not during every frame.

## Verification boundaries

- **Test-first source commit:** pushed. Its [native RED workflow](https://github.com/my-edutu/Ai_games/actions/runs/43717602995) was canceled by branch concurrency before a native verdict; do **not** call it a confirmed failing native run.
- **Corrected native/Chrome workflow:** [43717730189](https://github.com/my-edutu/Ai_games/actions/runs/43717730189), queued/pending at inspection. Native pass, build pass, real-game VFX/audio effects and performance gains cannot yet be claimed for the new head.
- **Prior real-browser run:** [43712524049](https://github.com/my-edutu/Ai_games/actions/runs/43712524049), on earlier commit `13a9a55`: native checks passed, six real viewpoints collected 12 authority receipts each and five common HP-loss ticks, but no tick had universally drawable injury evidence; strict browser failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`.
- Independent local inspection of a **preceding** six-view original WebM bundle decoded 10/14/11 desktop and 15/16/15 mobile VP8 frames, each with Opus audio. This establishes an actual recorded canvas/audio track presence and sparse frame delivery, **not** contact-to-PCM alignment, realtime smoothness, or a new-head result.

## Review and remaining dominant weakness

Specification review: counter visual now honors the same canonically proven result family as original sound, including no attacker claim and no cross-scene victim transfer. Quality review: one strictly bounded snapshot/actor lookup per candidate counter, no new GPU buffer, mesh, draw, timer, node, or persistent queue. Risk: very late counter cues may be suppressed if public authority has advanced; the 400ms policy favors causal truth over late replay.

Next: obtain corrected native and genuine Chrome verdict, investigate **multi-second renderer submission phases** without blaming D04 unmeasured GPU cost, and independently decode matched 1440×900 / 390×844 moving contact and original PCM across three viewpoints. Warden warning/release/recovery/counter, swing miss, block, dodge, projectile, spell, death/restart and a 20-minute resource/consent/accessibility soak are still unaccepted.

Rollback: revert the production counter-visual admission commit alone if live verified counter glyphs are unexpectedly suppressed; retain the regression and compare genuine public HP receipts first.
