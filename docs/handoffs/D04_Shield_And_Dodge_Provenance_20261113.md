# D04 — Guarded shield contact and witnessed evasion provenance (13 November 2026)

**Status: isolated incremental correctness change, NOT physical-realism accepted or integrated.**
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Normal spectator remains default; only `?feedback=d04` is experimental. Do not merge main or Draft PR #49.

## Finding and minimum vertical correction

In `public/ai-dungeon/physical-feedback-visuals.js::emit`, the previous D04 ingress checked only Manhattan-adjacent valid cells for `visual:'evade'` and only a nominal `authority-block-unique-guarded-hp` proof string for `visual:'block'`. It did not require matching public event kind, the exact verified evader proof, or a named defending actor for body-local art. Thus a crossed HP-injury cue or unverified empty-stone event could create false grit/shield particles. This is a **native code-level defect reproduced by test**, not an occurrence proven in prior real-game footage.

Dodge grit now requires `kind:'evade'`, `proof:'authority-event-and-observed-step'`, `verified:true`, nonempty evader identity and a legal one-cell source/destination. Block art now requires `kind:'block'`, `proof:'authority-block-unique-guarded-hp'`, `verified:true`, nonempty defender identity and a bounded source cell. The planner remains the authority for unique same-tick guard plus HP loss and unique observed legal step. The renderer does NOT identify a block attacker, infer a missed swing as contact, assign an evasive attacker, or mutate gameplay. Unattributed block events can still use neutral original sound; they never earn a localized defender glyph.

The existing known-good native dodge fixture was aligned to its canonical proof. The new regression exercises 11 invalid/crossed evidence cases and confirms that genuine witnessed dodge and guarded block remain drawable in the same retained pools.

## Reproducible red/green proof

- [Test-first commit `6b5062b`](https://github.com/my-edutu/Ai_games/commit/6b5062ba6fd4fd7e85f50906680a2b5bc0b6c273)
- [Red CI run 43383716155](https://github.com/my-edutu/Ai_games/actions/runs/43383716155): **271/272 native contracts passed**, with only the new `HP injury is not a dodge` assertion failing (actual true, expected false). Production browser was skipped.
- [Production correction `a225673`](https://github.com/my-edutu/Ai_games/commit/a2256731c652f9a29e5bfe1f89ed26b0a86499cd)
- [Corrected CI 43384054185](https://github.com/my-edutu/Ai_games/actions/runs/43384054185): **272/272 native contracts passed; production build succeeded**. The genuine Chrome `real-preview` job had not finished when this handoff was written. Its verdict is **unverified**, not passing.
- Focused manual reproduction: `node --test tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`; proportional integration: run the branch-specific native Actions suite and `npm run build`.

## Resource / provenance / rollout review

This change adds no new visual pool, instance, draw call, geometry, GPU buffer, procedural noise source, WebAudio voice, timer, listener, receipt or queue. Seven retained effect pools / 102 reserved instances and existing VFX, frame, audio and 400ms deadlines remain unchanged. No new audio is synthesized; all original WebAudio opt-in, persisted mute, reduced-flash, reduced-motion, deduplication, bounded cleanup and real WebGL receipt rules stay intact. No private / unlicensed audio or gameplay authority changes. Rollback: revert `a225673` on this D04 branch only, keeping the regression so the provenance weakening is visible. Source and test are D04-owned; no main, PR #49, `games/ai-dungeon/src`, rig, camera, global lighting or other branch changes.

## Authentic media inspected, without overclaiming

Previously available real-game **unaligned** desktop and 390px-mobile WebMs were decoded with local FFprobe; desktop contained 11 encoded VP8 frames (maximum adjacent presentation gap approximately 3.063s) and mobile 10 (3.375s), each with Opus audio packets. Encoded desktop video is 587×339 and mobile 386×517, not full native 1440×900 / 390×844 video tracks. Frames show actual overhead Dungeon world and characters. The sources predate this correction, lack three matched moving viewpoints and do not prove any impact onset against audible PCM. They are real-game media evidence of insufficient frame cadence, **not** an A/V sync pass or a current implementation comparison.

The prior completed authentic Chrome run [43376870950](https://github.com/my-edutu/Ai_games/actions/runs/43376870950) passed 5 browser diagnostics but failed the strict actual HP visual-submission acceptance (`AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`). It also had enormous stage wall times in both legacy and opt-in render modes; cause and attributable cost remain uncertain.

## Next dominant observable realism weakness

Genuine first HP-loss effects frequently reach WebGL too late under intermittent multi-second renderer/stage stalls, exceeding the original 400ms sound deadline. The correct behavior is silence and no stale visual, not pretending timely contact. Acquire matched seed/run/floor/tick/checksum **three-viewpoint moving** desktop and mobile footage of Warden warning/release/recovery/earned counter, real vs missed sword, block, dodge, arrow, spell and HP loss, with actual canvas + original opted-in audio, decoded PCM-onset/PTS alignment and a 20-minute cleanup soak. Separate D04 visual cost from baseline renderer work and capture encoder impact. No Diablo-IV parity or final integration claim is warranted.
