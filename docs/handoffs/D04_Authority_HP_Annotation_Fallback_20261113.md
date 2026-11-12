# D04 — Authoritative HP reactions survive optional choreography failures (13 November 2026)

**State:** isolated D04 correctness repair; real physical A/V acceptance **NOT VERIFIED**. Target branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`; no change to main, Draft PR #49, gameplay authority, character rigs, camera, lighting, or other sessions. Default spectator remains legacy and physical D04 is opt-in `?feedback=d04`.

## Specific observable/code-level defect

A genuine adjacent-tick public HP loss could disappear from D04's physical impact stream whenever the OPTIONAL `deriveDamageBeats` presentation annotator returned `[]`, threw, supplied only one of two injuries, or reached its own smaller scan limit. The old implementation selected the annotator's result *instead of* the public HP-delta fallback. A malformed external beat could also ask for the 215ms timed-contact envelope despite contradicting the observed amount of HP loss.

This correctness defect was reproduced with three newly added tests. It was found during the continuing diagnosis of real-browser `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` and must **not** be presented as proof that it caused that particular Chrome failure or that WebGL stalls have been fixed.

## Narrow implementation

`public/ai-dungeon/physical-feedback-plan.js` now builds the finite damage-cue set from actual consecutive public snapshots alone (the previously existing `fallbackDamageBeats` path, 96-unit scan, max 18 beats). The optional choreography annotator may enrich only the presentation delay of an already-real victim. An annotation matches only when its id, kind, faction, position, exact HP delta, max HP and fatal flag match that observed victim. Inconsistent annotations cannot create a victim, suppress a real injury, or claim a physical attack. Damage cues still use `actorId:null`; a swing remains distinct from verified HP damage. The optional lane annotator may still request the established 215ms visual timing for matching real damage, but not assign an attacker or hit result.

No gameplay mutation, added GPU pool, audio node, weapon asset, camera move, global light, draw call, or changed WebAudio consent/400ms deadline. Original pending/awaiting/receipt bounds, reduced motion/flash, event deduplication and teardown remain unchanged. `tests/foundation/dungeon-d04-hp-damage-annotation-fallback.test.cjs` supplies regression contracts, and the isolated CI workflow now runs them and triggers on future planner changes.

## Verification and limitations

- [Red test-first CI 43326944656](https://github.com/my-edutu/Ai_games/actions/runs/43326944656): **227/230 native contracts passed; the 3 newly added tests failed as expected** (missing multiple genuine injuries; incomplete annotation; thrown/inconsistent metadata). The browser job was skipped because native contracts failed.
- Corrected implementation commit: [89c8d32](https://github.com/my-edutu/Ai_games/commit/89c8d323c1e71e6fbd3c2df03097d25b874ff26a).
- Corrected CI is tracked at [run 43327324309](https://github.com/my-edutu/Ai_games/actions/runs/43327324309). **Its status must be checked before claiming native test/build success or any new genuine browser evidence.** The prior real Chrome run [43316558772](https://github.com/my-edutu/Ai_games/actions/runs/43316558772) passed 5 of 6 browser trials but failed the strict genuine HP-damage visual admission gate. This fix has not been proven in an original encoded A/V pair.
- Earlier real recordings remain sparse and unaligned. There are no matched three-camera, desktop and 390px mobile new clips, no credible decoded impact-to-sample synchronization, no complete Warden warning/release/recovery/counter evidence, and no 20-minute resource soak. Standalone foley/native tests are **not** real Dungeon playback.

## Spec / quality review

Spec: one damage identity per truthful adjacent public HP decrease, no event-prose source attribution, one bounded 18-beat ceiling, no 400ms audio relaxation, opt-in only. Quality risks: fallback's bounded scan may still omit victims outside the first 96 public units; existing cue priority sorts may suppress lower-priority injuries beyond the 24-cue budget, and software-WebGL may miss even correctly created effects before the next drawable frame. Do not silently extrapolate from tests to physical audiovisual parity.

Next dominant rejection: independently measure actual HP-loss `expired-pending-before-frame` against the corrected planner in genuine moving Chrome with frame timings, three viewpoints and original audio, then isolate any remaining D04-owned stall cost. Existing legacy render stalls strongly suggest the performance cause is not solely D04.

Rollback: revert only the D04 planner fix commit if code regression is demonstrated; retain the failing regression contracts as requirements for a safe replacement. Keep the feature opt-in until dedicated final integration review.
