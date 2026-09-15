# AI Escape Room Phase 3 Evidence

**Candidate scope:** immutable public render truth, responsive layout, public AI intent, browser source, output recovery and browser capture.

## Observed verification

| Verification | Result |
|---|---|
| `node --test tests/escape-room/phase3-presentation.test.cjs` | 7 passed, 0 failed |
| `node --test tests/escape-room/phase3-server.test.cjs` | 1 passed, 0 failed |
| `npm run escape-room:stream:self-test` | `ok:true`; authority stable; assets, privacy, recovery and restart verified |
| Desktop capture, 1920×1080 | zero browser exceptions; overflow 0; canvas 1692×968 |
| Phone-landscape capture, 844×390 | zero browser exceptions; overflow 0; canvas 616×278; objective/progress/intent/captions visible |
| Clean-feed capture, 1280×720 | zero browser exceptions; overflow 0; HUD and side rail hidden; stage/progress/captions retained |

## Regressions discovered and fixed

### Pre-viewer readiness false alarm

The first server health implementation treated the absence of a browser paint before OBS connected as frozen output. A failing integration test held the source without a viewer for more than three seconds and reproduced HTTP 503. The server now reports simulation readiness before the first viewer and activates output-paint/audio classification only after a state consumer connects.

### Invalid dynamic `dataset` key

The first browser source converted `reducedMotion` to `reduced-motion` and assigned it through `element.dataset[...]`. Hyphenated keys are invalid in `DOMStringMap`, so the application threw before rendering its first frame. A focused static regression now rejects that pattern and requires explicit `data-*` attributes. After the fix, desktop, phone and clean-feed captures populated live state with zero browser exceptions.

## Claims proved

- Presentation cannot receive hidden solution or oracle truth.
- Public frames are deep-frozen and bounded.
- Cosmetic camera/audio derivation does not mutate authority.
- Desktop, phone landscape and clean feed retain the required ten-second hierarchy.
- Muted and color-independent comprehension remains available through text, shape, symbol and captions.
- Browser state polling is serialized and abortable.
- Recovery uses the latest valid public frame and does not invent game continuity.
- CI is configured to launch the Escape Room stream source and retain Playwright captures.

## Evidence boundary

Local DevTools capture used the production HTML/CSS/JavaScript with a live fetched public frame because the installed Chromium policy blocks loopback page navigation. Full local-server navigation, continuous polling and screenshot capture remain an explicit Playwright CI gate. These artifacts are software verification, not elapsed livestream soak or external production evidence.
