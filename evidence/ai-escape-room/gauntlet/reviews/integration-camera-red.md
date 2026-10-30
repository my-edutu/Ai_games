# Integration camera regressions — confirmed failing

Date: 2026-10-30. Actual browser runtime from localhost:4177, current uncommitted gauntlet renderer. Independent tests use deterministic production EscapeRuntime snapshots (seed `gauntlet-vault-reference-v1`, depth 8), not builder captures or fabricated result frames.

## P1: Follow misses the next focus when a later event shares the tick

`tests/browser/escape-room-gauntlet.spec.cjs`, test “Follow follows the next real focus even when a reveal follows puzzle-solved in the same tick”.

At tick 3, turn on Follow; its inspected object is `target-01`. Present actual tick 4, whose focus is `target-02` and whose events are `puzzle-solved` then `object-revealed`. Follow remains pressed and enabled, but its inspected object remains `target-01`. Expected `target-02`; received `target-01`.

Cause observed in current source: room3d.setState inspects only `events.at(-1)`, so the last reveal masks the solve/focus transition.

## P1: Confirmed escape leaves the Follow camera inspecting a decoy

`tests/browser/escape-room-gauntlet.spec.cjs`, test “a real escape batch returns the Follow camera to the room even when result is the final event”.

Turn on Follow while the actual pre-exit frame is 100% unlocked. Present actual terminal escape frame; its events include `escape` followed by `result`. The result copy confirms escape but `body[data-camera-mode]` remains `inspect` for the full 8-second assertion window. Expected `room`; received `inspect`.

The same last-event-only condition masks the escape event, so the final physical escape is not framed by the camera.

## Reproduction

`node node_modules/@playwright/test/cli.js test -c /tmp/escape-gauntlet-playwright.config.cjs -g 'Follow follows|real escape batch'`

Observed result: 2 tests failed for the expected behavior, not startup errors. Machine-readable report: `browser-camera-red.json`. First failure also reported a Playwright trace zip finalization error; this does not explain the observed object mismatch, which was captured directly by the assertion. Second failure retained a trace and DOM context.
