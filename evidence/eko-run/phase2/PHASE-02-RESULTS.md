# Eko Run Phase 2 — Precision Movement Results

## Status

`VERIFIED — deterministic mechanics-only precision movement scope`

## Verified runtime candidate

- Branch: `agent/eko-run-phase2`
- Runtime/evidence candidate: `af9d322115cd9c187d78823fd43bce0f938a3784`
- Game version: `0.2.0`
- Deterministic version: `2`
- Dedicated workflow: `Eko Run Phase 2 Movement`, run `34936307144`, **success** on the exact candidate SHA
- Full catalogue workflow: `Autonomous Games CI`, run `34936307163`, **success** on the exact candidate SHA
- Phase 2 runtime artifact: `eko-run-phase2-evidence`, artifact `10383279034`
- Artifact digest: `sha256:60fa522ce2e6281abe76cf546bd61d941f7eb0f017b7567d010d4a19c271c4e9`

## Scope verified

Phase 2 verifies the deterministic controller and graybox collision truth only:

- bounded ground acceleration, deceleration and air control;
- real walk-off-edge coyote time and expiry;
- jump input buffering and variable jump release;
- deterministic fast-motion wall/ceiling collision without outcome-critical tunnelling;
- bounded step and slope traversal;
- lower slide collider with legal stand/jump expansion only when clearance exists;
- explicit bounded vaulting over eligible low geometry, including full-body current/future path clearance;
- moving-solid overlap separation and previous-to-current swept crossing detection;
- full authoritative player body remains inside route bounds;
- ordinary landing control, landing compression state, severe-fall stumble and bounded automatic recovery;
- gameplay kill-plane failure separated from integrity failures;
- deterministic checkpoint restart using legal floor/support rather than arbitrary overhead collider tops;
- exactly one deterministic move-authority winner per tick with losing legal moves rejected as `MOVE_CONFLICT`;
- movement timers and outcome-critical route geometry included in checksum truth;
- snapshot/restore continuity through an in-progress vault;
- identical authority under 30/60/120 presentation-sampling schedules;
- Phase 1 replay, snapshot, version, command-ordering and render-snapshot regressions remain green.

## TDD / RED → GREEN evidence

| Cycle | Test-only RED SHA | RED evidence | Resolution / final evidence |
|---|---|---|---|
| Initial movement corpus | `6e924f17bf12d757d5d2952fea15af00a053f0e9` | full catalogue run `34932951294` failed as expected while Phase 1 evidence remained green | controller implemented beginning with `f51e1be53c5e5f38d96984ed9120500bf0ca79ca`; final candidate green |
| Review Pass 1 | `e82c27561eeeb15555ff02547511657fda87bbc6` | dedicated run `34933909354` failed; full run `34933909372` failed | moving-solid, vault clearance, restart support and command arbitration fixes; final candidate green |
| Review Pass 2 | `ba5dd1e19924114dfcf3e88133dd225b524b718a` | dedicated run `34935505191` failed; full run `34935505203` failed | full-body route-bound fix `553cbb59b86a520e92d9c99d2f8a77b63bc393df`; final candidate green |
| Review Pass 3 | `31f39597b08946eaae8adc08a695857b1be1fc8b` | dedicated run `34935752129` failed; full run `34935752132` failed | slide-jump clearance, swept moving-solid contact and fail-closed body-bound snapshot fixes; final candidate green |

The RED commits precede the corresponding production fixes. Phase 2 closure therefore does not rely on tests written only after implementation.

## Three specialist review passes

### Review Pass 1

Recorded in `PHASE-02-REVIEW-1.md`.

Material findings:

- vault path body/head clearance — fixed;
- moving solid overlap with stationary player — fixed;
- restart selecting overhead geometry as floor — fixed;
- accepted-command audit disagreeing with applied movement intent — fixed;
- real walk-off-edge coyote evidence gap — closed with traversal regression.

### Review Pass 2

Recorded in `PHASE-02-REVIEW-2.md`.

- mid-vault snapshot continuity — passed;
- future moving-solid vault clearance — passed;
- full-body route-bound enforcement — P1 found and fixed.

### Review Pass 3

Recorded in `PHASE-02-REVIEW-3.md`.

- slide-to-jump expansion beneath low roof — P1 found and fixed;
- fast moving solid full between-tick sweep — P1 found and fixed;
- snapshot body-bound invariant — P1 found and fixed.

**Final review state:** no unresolved stop-ship, P1 or P2 finding within the Phase 2 deterministic graybox movement scope.

## Mechanics-only experience review

The required full-rubric review is recorded in `PHASE-02-EXPERIENCE-REVIEW.md`.

- real-time review basis: fixed 60 Hz authoritative trajectories;
- slow-motion diagnosis basis: deterministic tick-by-tick state/contact/event stepping;
- full 100-point score: `40/100` because presentation/content categories intentionally absent from Phase 2 are scored `0 / deferred` rather than falsely marked complete;
- Phase 2-owned movement/physics and performance categories pass;
- camera, animation, art, Lagos identity, audio/VFX, mobile/HUD and accessibility presentation remain later-phase gates.

No aggregate score is used to override a stop-ship finding.

## Deterministic runtime evidence

Scenario: `phase2-graybox-authority-001`  
Seed: `eko-phase2-ci`

| Scenario | Ticks | Final checksum |
|---|---:|---|
| flat-control | 900 | `4a58f6750393de01` |
| vault | 30 | `eed1127e8719c6e2` |
| stumble-recovery | 120 | `4ff8d59645220b67` |
| moving-sweep | 1 | `f9eb4cb84ab6ebf7` |

Semantic event counts:

- `player.jumped`: 5
- `player.landed`: 6
- `player.slid`: 5
- `player.vaulted`: 1
- `player.stumbled`: 1

Determinism:

- repeat run: **pass**
- snapshot/restore continuation: **pass**
- uninterrupted checksum: `5001c2e0f4caae6c`
- restored checksum: `5001c2e0f4caae6c`
- required movement-event coverage: **pass**

## Performance evidence

Measured authoritative tick samples: `1,051`

| Metric | Result | Budget | Verdict |
|---|---:|---:|---|
| p50 | `0.127176 ms` | informational | pass |
| p95 | `0.258741 ms` | informational | pass |
| p99 | `0.321217 ms` | `< 4 ms` | pass |
| worst | `0.443234 ms` | `< 16.67 ms` | pass |

Both enforced budgets passed on the exact runtime candidate.

## Acceptance gate

- [x] Ground acceleration, braking and air control are deliberate and bounded.
- [x] Jump supports coyote time, input buffering and variable release.
- [x] Fast motion cannot tunnel through outcome-critical Phase 2 graybox geometry.
- [x] Ceiling, wall, step and slope contacts remain deterministic and penetration-safe within the declared collision tolerance.
- [x] Slide uses a lower collider and cannot expand through obstruction.
- [x] Vault is explicit, bounded, obstacle-eligible and collision-path validated.
- [x] Ordinary landing does not lock legal control; severe landing has bounded deterministic stumble/recovery.
- [x] Gameplay death is distinct from integrity failure and restart restores legal checkpoint support deterministically.
- [x] Identical authoritative inputs remain checksum-identical under 30/60/120 presentation sampling.
- [x] p99 and worst authoritative tick budgets pass in CI evidence.
- [x] Phase 1 deterministic foundation regressions remain green.
- [x] Three specialist review/improvement passes have no unresolved stop-ship/P1/P2 finding in Phase 2 scope.
- [x] Full catalogue CI is green on the exact runtime candidate.

## Explicit non-claims

Phase 2 does **not** claim completion of:

- Tayo character mesh, outfit art or animation clips;
- final Three.js rendering or final camera feel;
- Lagos street art, districts, traffic, pedestrians or hazard fairness;
- audio, VFX, HUD or spectator presentation;
- touch/mobile UI or final accessibility presentation;
- AI/autoplay policy or NPC intelligence;
- viewer interaction, economy, moderation or provider integrations;
- production persistence/recovery, long-running soak, canary or production readiness.

Those remain owned by later phases. A future presentation or content review may still require controller changes if it exposes a new stop-ship.

## Phase decision

**PASS — Phase 2 is verified for deterministic mechanics-only precision movement.**

The documentation closure commit that records this result must itself receive fresh exact-head dedicated Phase 2 CI and full catalogue CI before the branch is treated as ready to integrate.
