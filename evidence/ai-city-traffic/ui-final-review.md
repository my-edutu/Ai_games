# City / Flow — independent final UI review

**Reviewed candidate:** UI revision 4, captured 2026-10-30 21:05:01–21:05:28 UTC.  
**Reviewer role:** fresh independent UI critic; product source remained read only.  
**Review scope:** mobile layout, queue interpretation with Experiment open and closed, View behavior, keyboard/focus behavior, and Follow masthead legibility. Vehicle-model quality is excluded from this review.

## Verdicts

**UI SPEC: PASS for the enumerated mobile/UI closure contract.** The current UI exposes accurate numeric queue information in the Experiment panel, retains it while the narrow panel scrolls, provides a 44 px View action, closes the panel when that action is used, centers the selected signal, and handles focus/Escape correctly. The fresh dedicated mobile test passed. This is a scoped UI contract verdict, not a whole-game or complete accessibility certification.

**UI QUALITY: FAIL — one reproducible P2 remains.** The new View action frames the busiest junction behind tall foreground buildings. The numeric map callout is centered, but the selected junction and its queued traffic cannot be inspected. This occurs at both 390 × 844 and 320 × 700. The screenshots expose a failure that the passing mechanical checks do not cover.

**Commercial comparison: NOT ESTABLISHED by this UI review.** The pinned references support readability and information-hierarchy criticism. They do not establish a whole-game win, parity, or production readiness. No UI-specific P1 was demonstrated.

## Evidence inspected directly

I launched the actual running game at `http://127.0.0.1:4311/traffic/` in local Playwright Chromium with SwiftShader, paused through the existing public operator API to keep the simulation stable, and used visible controls and real keyboard input for the reviewed behavior. Reduced motion was enabled. Every captured scene uses authoritative simulation tick **363**; the busiest selected signal is **J0 at (-72, -72), 3 queued vehicles**. Aggregate queue count is **22**.

I freshly opened all nine captured PNGs using the image inspection tool:

- `evidence/ai-city-traffic/ui-final/390-default.png`
- `evidence/ai-city-traffic/ui-final/390-experiment-overlay.png`
- `evidence/ai-city-traffic/ui-final/390-view-junction.png`
- `evidence/ai-city-traffic/ui-final/390-follow.png`
- `evidence/ai-city-traffic/ui-final/320-experiment-overlay.png`
- `evidence/ai-city-traffic/ui-final/320-experiment-scrolled.png`
- `evidence/ai-city-traffic/ui-final/320-view-junction.png`
- `evidence/ai-city-traffic/ui-final/1440-follow.png`
- `evidence/ai-city-traffic/ui-final/1440-follow-night.png`

I also opened `/tmp/city-traffic-references/mini-motorways-1.jpg` and `/tmp/city-traffic-references/cities-skylines-ii-3.jpg` directly. I read the Gauntlet specification, game PRD and audio/visual direction, previous UI closure review, repository Livestream HUD and Game Creative Direction skills, and the relevant current UI source and browser assertions.

### Fresh executable checks

`npx playwright test --config playwright.city-traffic.config.cjs --grep 'mobile reduced-motion'`

Result: **1 passed (29.0s), exit 0**. This includes the new summary/location/count assertions and View panel-close assertion, native control bounds, Escape from the demand slider, focus return, and Help dismissal.

`node evidence/ai-city-traffic/ui-final/inspect-ui.cjs`

Result: **40 checks passed, exit 0; 9 screenshots; no uncaught page errors**. The complete recorded data, element bounds, hit tests, snapshot signals, camera coordinates, and source hashes are in `evidence/ai-city-traffic/ui-final/probe-report.json`. These checks confirm DOM visibility, truthful values, keyboard behavior, and screen centering. They do **not** test 3D occlusion; the visual finding below therefore remains despite their pass result.

## Closure of the earlier findings

| Area | Result | Actual evidence |
|---|---|---|
| Persistent phone chrome | PASS within this scope | The 390 px default screen has a clear city area between compact top metrics/tools and the lower activity strip/dock. The phone sheet is temporary and internally scrollable. |
| Phone control targets | PASS for exercised controls | The dedicated mobile test verifies 44 px minimum dimensions for close, demand, pause, and speed controls. The new View button measured **64.72 × 44 px** at 390 px. |
| Numeric queue interpretation in Experiment, previous UI-06 | CLOSED | The actual open-panel captures display **J0 · Northwest / 3 queued**, matching the authoritative busiest signal. At 390 px the summary is at x=39, y=346, w=312, h=51; at 320 px it is at x=39, y=286, w=242, h=51. The text/count/button center hit tests are unobscured. |
| Numeric summary while narrow panel scrolls | PASS | At 320 × 700 the panel scrolls by **147 px**. Its heading and queue summary remain visible, while Signal timing and Roadworks become accessible. The summary remains at y=280–331. |
| Panel-closed queue cue | PASS for its text, FAIL for the associated 3D framing | Both closed-panel captures retain the persistent summary and a centered **J0 / 3 queued** map label. The label points through foreground buildings; see UI-08. |
| Keyboard opening/focus | PASS | Enter on Experiment focuses the demand slider. Escape closes the sheet and returns focus to Experiment. The close button also returns focus. View transfers focus to the city canvas. |
| Native Help/Escape | PASS | Help opens using its visible button, closes with Escape, and returns focus to its opener. |
| Follow masthead, previous UI-07 | CLOSED | At 1440 × 1000, the daytime masthead is visibly legible over the dark tower that caused the earlier problem. Night uses a dark backing with light text. The 390 px Follow screen retains a legible compact brand. The lower-left desktop explore hint is also readable. |

The earlier paused-speed toast was outside this focused rerun; its previous broad runtime closure belongs to the lead's separate evidence. I did not rerun it or infer a new result from source alone.

## Remaining P2 — UI-08: View centers a hidden junction

### Reproduction

1. Open the normal game at 390 × 844 with reduced motion; pause it through the public pause command.
2. Click Traffic, then Experiment. The current maximum is **J0 · Northwest, 3 queued**.
3. Click the visible **View** button.
4. The sheet closes, aerial mode is selected, and the canvas receives focus. The camera is at approximately **(1.92, 91.84, 8.64)** looking toward the J0 ground location.
5. In `390-view-junction.png`, foreground towers cover the target intersection. The **J0 / 3 queued** label appears over a tower roof. Repeat at 320 × 700: `320-view-junction.png` shows the same obstruction.

The callout centers exactly at x=195 on the 390 px screen and x=160 on the 320 px screen. Its centering is therefore not the defect. The 3D subject is hidden behind the foreground geometry.

### Why this matters

View is the interface's direct route from the numeric congestion summary to the actual city. Its current result prevents the user from observing the selected queue and makes the label appear associated with a building. That weakens the purpose of the new location cue during the traffic-analysis task. A user can potentially orbit manually, but the automatic View action should provide an inspectable starting frame.

### Requested correction and acceptance

Use a steeper or higher framing for this action, or choose a camera position that avoids the foreground obstruction. Preserve the truthful summary, keyboard focus, and accessible target dimensions. Recheck the actual J0 view at **both 390 × 844 and 320 × 700** after the change. Passing evidence is a visible junction and approach lanes below the correct label, with no blocking tower between the camera and the selected intersection. A centered DOM label alone is insufficient.

This is the only remaining P1/P2 finding demonstrated in this review. No product file was changed by the critic.

## Reference-grounded assessment and limits

The Mini Motorways reference separates roads, destinations, vehicles, and a numbered motorway clearly. It contains **no visible external control UI**, so it cannot support a claim about superior button targets, panel design, or keyboard handling. It is useful for the narrower observation that a traffic-analysis cue should lead the viewer to a traceable piece of network. The current occluded View result fails that observation.

The Cities: Skylines II reference is a population information layer: a contextual analysis panel, numerical categories, and a legend sit alongside a subdued city view. It supports checking that a selected layer retains its explanatory information. City / Flow's revised open-panel summary now satisfies that local hierarchy need. The screenshot is not a matched traffic-density, camera-scale, or motion comparison.

The checks used software-rendered Chromium, deviceScaleFactor 1, and a paused simulation. They do not measure real-device touch accuracy, mobile GPU performance, animation quality, audio, screen-reader behavior, or uninstructed-viewer comprehension. Paused FPS counters are not performance evidence. The critic has not judged the staged vehicle-quality revision.

## Candidate fingerprints

All four recorded source hashes were unchanged from the start to the end of these captures; `uiSourceStable` is true.

| File | SHA-256 |
|---|---|
| `public/ai-city-traffic/index.html` | `09e5e31da56dc46a97cdeadac1e6ae029b9bee7cfb0e39dfd9ddefc2bee52bdd` |
| `public/ai-city-traffic/styles.css` | `41d8d8313313059f5578df05e956ae3415d3fc4abcfc6827fc2d10a893db18d5` |
| `public/ai-city-traffic/main.mjs` | `0c8210d1e7d78d256f3e62961280835c961900d93bf5ac5db377aa6a12623f78` |
| `public/ai-city-traffic/world.mjs` | `2057b018c7be23c37c6b986a99f653477e2af06335a76095e8c621f779d1555a` |

**Handoff:** browser process closed and slot released. Return UI-08 to the builder, then inspect fresh post-fix output before issuing a UI quality pass.
