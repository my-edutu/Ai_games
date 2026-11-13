# D04 — Silence must not leave clock-unverified HP fragments on the next frame (2026-11-13)

Status: **test-first source correction, native-verified; authentic moving A/V realism NOT accepted**.

## Scope, invariants, and reproducibility

- Repository: `my-edutu/Ai_games`.
- Exclusive branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting head for this increment: `bb8a92c4adf3063dbd3d28579b41cd26a18f849f`.
- Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324` (unchanged).
- Legacy `/dungeon` is the default; `?feedback=d04` remains experimental opt-in.
- No main, Draft PR #49, authoritative `games/ai-dungeon/src`, character rigs, camera, global lighting, or other-session branches edited.

## Observable D04-owned defect and cause

Previous genuine Chrome executions displayed multi-second CPU-side renderer calls during active combat, including legacy runs. This is **not established as a D04-origin performance stall**. When actual sound was muted / not opted in and a verified HP impact's visual shard was staged, a failed/non-monotonic WebGL receipt clock produced the terminal `visual-submission-unverified` decision. The controller correctly refused sound, but the retained visual renderer's `retireStaleCue` allowlist did **not** include this exact decision. Therefore, four HP shards could remain active in the retained GPU pool after a terminal rejected frame receipt and potentially appear on a later unrelated rendered frame.

The defect is about presentation cleanup and temporal causality. It is not evidence of actual sword contact, decoded pixels, or synchronized PCM.

## Red-green implementation

1. [Red regression `6f2b025`](https://github.com/my-edutu/Ai_games/commit/6f2b0256bccd6f68ec744c903109e02ef7c7feac): added a real D04 controller + retained visual-pool contract to `tests/foundation/dungeon-d04-stale-submission-visual-retirement.test.cjs`. It creates an authentic two-snapshot HP decrease with no audio opt-in, stages four injury shards, then simulates a genuine frame acknowledgment whose monotonic clock is invalid. It requires terminal provenance, **zero** remaining shards/drawable hit pool, no retroactive audio after a later gesture, and original resource limits.
2. [Expected red Actions run `43478661595`](https://github.com/my-edutu/Ai_games/actions/runs/43478661595): **302 passed / 1 failed (303 total)**. The failure was the targeted retention, `invalid CPU submission timing must retire its untrusted VFX before another draw`; actual active hit shards `4`, expected `0`. Not an unrelated setup or syntax failure.
3. [Fix `2cbc5ce`](https://github.com/my-edutu/Ai_games/commit/2cbc5cee3de7c0757a6360c575255849d07293a2): `public/ai-dungeon/physical-feedback-visuals.js` now accepts `visual-submission-unverified` as a terminal cue-specific cleanup reason, reusing the existing occupied-slot matrix hide, `instanceMatrix.needsUpdate`, visibility recount and stale-retirement telemetry.
4. [Corrected Actions run `43478828999`](https://github.com/my-edutu/Ai_games/actions/runs/43478828999): **303/303 native contracts passed**, and `npm run build` passed. The real Chrome job was still running at the point of native-contract inspection; do not infer a browser pass from native green.

## Deliberately unchanged protections

The fix uses no additional pool, buffer, voice, draw call or listener. It targets only the matching cue ID and excludes still-authoritative Warden warning geometry. It cannot create an attacker, mutate damage or move an actor. It preserves immutable HP-drop evidence; swings remain attempts, not proof of HP impact. It changes no opt-in, mute persistence, reduced-motion/flash, 32-awaiting-frame, 64-receipt, 400ms stale-audio, or source-start behavior.

The native mock proves that a particular rejected visual shard disappears from retained scene state. It does **not** prove the last submitted GPU pixels can be recalled or that actual encoded VP8 frames are uninterrupted.

## Genuine existing media review (older recordings, NOT candidate proof)

- Desktop original Dungeon WebM: **11 decoded VP8 frames**, maximum between-frame PTS gap **3.063s**; original Opus audio decodes to approximately **15.54s** of mono PCM.
- 390px mobile original Dungeon WebM: **10 decoded VP8 frames**, maximum gap **3.375s**; original Opus audio decodes to approximately **18.78s** of mono PCM.
- Decoded audio has nonzero waveform energy; this is **not** evidence of impact-sample synchronization. Both recordings were captured before this increment and do not provide matched three-viewpoint contact playback.
- Prior completed [real Chrome Actions `43471359650`](https://github.com/my-edutu/Ai_games/actions/runs/43471359650) passed five real-browser diagnostic scenarios but **failed** the strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` gate. Instrumentation found up to approximately **1,967ms desktop / 3,188ms mobile** in a renderer-call phase in one non-identical matched trial; precise values vary across trials. This is CPU timing, not GPU fence or D04 causation.

## Review and next dominant blocker

- Specification review: terminal, clock-unverified silent VFX may no longer remain in retained pools. Warden warning and sound authorization are unchanged.
- Engineering review: the reason allowlist was inconsistent with the controller's terminal decision. The fix is a one-reason, bounded cleanup path rather than an extra queue or a new timeout. Existing silent/foley contracts remain active.
- Remains **NOT ACCEPTED**: continuous matched before/after 3-viewpoint desktop and 390×844 moving video; missed swing, block, dodge, projectile, spell, verified HP impact, complete Warden warning/release/recovery/earned counter; decoded frame-to-original PCM contact alignment; WebGL loss and restart recovery; and 20-minute VFX/voice/receipt resource-soak evidence.
- **Next dominant obstacle:** multi-second real WebGL frame submission stalls, measured in legacy and D04. Escalate actual renderer profiling to its subsystem owner without editing camera/global lighting/other sessions; maintain D04's 400ms sound fail-closed rule. Also verify actual Chrome result for the corrected candidate, not just native tests.

Rollback, if required: revert `2cbc5ce` and its test commit exclusively on this isolated branch. Never promote D04 to default without a dedicated final review.
