# Independent refinement engineering review

Date: 2026-10-30, 20:24 UTC
Reviewer: fresh read-only engineering critic (`refinement_review`)
Base: `c7eddc13574b3964c9149a15c5f3b2ced99ee113`

## Scope and verdict

Reviewed the working-tree refinement against the base commit, concentrating on `app.js`, `index.html`, `ux-v2.css`, `map-view.mjs`, `world.js`, `characters.js`, `progress.js`, and the changed tests. Read `AGENTS.md`, the approved 3D specification, and the repository's HUD, security/privacy, and performance guides. Followed the relevant unchanged scene host, public-snapshot producer, caption director, and AI explanation sources to check the affected interfaces.

**No unresolved confirmed defect remains in the reviewed refinement after two repairs.** The clipped Map focus ring and landscape Path notes overflow were both repaired by the integration owner and independently verified by this reviewer. No further confirmed public-state, resource-lifecycle, character-animation, map-drawing, or result/reconnect regression was found in the inspected changes. This limited engineering verdict does not satisfy the separate visual, motion, full-browser, or performance gates.

This is a source, lightweight-unit, and narrowly targeted fallback-layout review. At the integration owner's follow-up requests, the original layout reproduction and one post-repair verification were run with WebGL deliberately disabled, sequentially with no competing browser. No new 3D render was inspected, and no GPU, visual parity, or production-readiness conclusion is implied. The fixed Captain Toad benchmark remains unchanged. The reviewer wrote this document, temporary layout/focus screenshots, and the specifically requested current journal screenshot; product code, tests, and commits were not modified by this reviewer.

## Confirmed finding repaired during review

### P2 — The new Map disclosure clipped its keyboard focus indicator

**Introduced at:** `public/ai-maze-escape/ux-v2.css:35`.
**Repair verified at:** `public/ai-maze-escape/ux-v2.css:40`.

The new `.map-card` sets `overflow:hidden`, and its closed summary fills the card. The shared focus rule in `styles.css:1` draws a 2px outline with a positive 4px offset. As a result, the closed Map button's external outline falls entirely outside the container's clipping bounds. The element remains keyboard-operable, but a keyboard viewer loses the visible indication of which control is focused.

The integration owner added `.map-card>summary:focus-visible{outline-offset:-4px}`. The more specific rule moves the existing outline inside the summary and its clipping container. This source repair directly addresses the defect. The new browser test's focus assertions verify focus ownership; this reviewer additionally inspected the keyboard-focused result at 844×390. After Tab/Shift+Tab, the Map summary matched `:focus-visible`, with a solid 2px outline and a -4px offset. The screenshot at `/tmp/maze-refinement-map-focus.png` visibly shows the intact inset indicator.

**Disposition: fixed and independently verified in the browser.**

## Landscape finding repaired and independently reprobed

### P2 — Expanded Path notes overlaps captions and extends below the landscape viewport

**Relevant code:** `public/ai-maze-escape/ux-v2.css:35–37`; the existing landscape grid and sidebar rules at lines 7 and 28; `public/ai-maze-escape/styles.css:1`.

Portrait supplies an absolutely positioned explanation popup with a viewport-bounded width. Its containing intent card has no clipping overflow, and the popup opens upward; no source-level portrait clipping conflict was found.

Landscape retains the explanation in normal document flow, while the new rule explicitly removes its previous text clamp. At 844×390 the sidebar receives 290px between the masthead and captions, has no scroll treatment, and sits in a document whose landscape overflow is hidden. Opening the disclosure adds its complete 12px/18px explanation plus bottom padding to an already compact stack.

**Reproduction:** Start Chromium at 844×390, return `null` for WebGL/WebGL2 contexts before the app initializes, and fulfill `/maze/state` with the real `scenarios().exploration` frame from `scripts/capture-maze-3d.cjs`. The selected production sample is seed `maze-visual-reference-3`, tick 10. Open the native Path notes summary. The explanation is the ordinary short production text, “A required key is known; navigating to collect it.”

| Element | Closed top / bottom | Open top / bottom |
| --- | --- | --- |
| HUD | 54 / 344px | 54 / 344px |
| Path notes disclosure | 305.61 / 350.61px | 305.61 / 397.61px |
| Visible explanation | Hidden | 350.61 / 386.61px |
| Reserved captions | 351 / 385px | 351 / 385px |
| Viewport | 0 / 390px | 0 / 390px |

The open explanation occupies the caption band and its disclosure extends 7.61px below the viewport. `scrollY` remained zero and document height remained 390px. The inspected screenshot at `/tmp/maze-refinement-landscape-open.png` visibly confirms that the notes card consumes the right side of the caption row. Disabling 3D does not alter these sidebar/grid rules, so this is a UI layout defect rather than a graphics-performance inference.

**Repair:** The integration owner added an upward, absolutely positioned landscape popup at `ux-v2.css:41`, with a viewport-bounded width, maximum height, vertical scrolling, and opaque surface background. The browser regression now checks the popup's viewport and caption containment at 844×390.

**Independent post-repair result:** In one fresh browser, the same genuine exploration frame and the longer production fallback text both stayed wholly above the captions and inside the viewport:

| Case | Popup horizontal bounds | Popup vertical bounds | Visible text vertical bounds |
| --- | --- | --- | --- |
| Original real exploration frame | 541–831px | 179.06–245.06px | 194.06–230.06px |
| Longer production fallback text fixture | 541–831px | 161.06–245.06px | 176.06–230.06px |

For both cases, captions began at 351px, the native summary ended at 350.61px, and no internal scroll was needed. The short case's screenshot at `/tmp/maze-refinement-landscape-fixed.png` was inspected and shows the intact caption band. The longer case used the exact explanation extracted from `policy.ts:235` in a clearly identified UI text fixture; it was not presented as a recorded fallback game outcome. Assertions checked top/left/right bounds, separation from captions, text containment, and continued summary access.

**Disposition: fixed and independently verified in the browser for both requested text lengths.**

## Checks with no further confirmed finding

- **Native disclosures:** Map and Path notes use native `details`/`summary` elements. The Escape handler closes the focused open disclosure and restores its summary focus. Opening Map schedules its draw after layout; hidden/zero-size canvases now return before backing-store resize. The existing resize, poll, and settings paths continue drawing the active map. No duplicate poll or animation loop is introduced.
- **Result and reconnect truth:** Caption translations operate on disclosed caption strings and remove key/door identifiers from the visible narrative. Existing result data still determines result cards and labels. Failed polling updates visible `run-phase` to `RECONNECTING` before the terminal-card branches return, preserving the outcome and exposing connection loss; a later successful update restores the live/terminal label. This review found no new interference from the disclosure changes.
- **Public-state boundary:** Added vegetation grouping, shoreline strips, and foundation details depend on public coordinates and disclosed cells. Enlarged keys still require an uncollected public key in a disclosed cell. The new exit disc/crown is still gated on the disclosed exit cell. The change does not import private authority or generation state, infer hidden routes, or mutate snapshots. Cosmetic expansion around a known cell is not treated as evidence of an undisclosed passage.
- **World resources:** New key/portal geometries and materials enter the existing shared ownership sets. Rebuilds remove old prop groups and dispose instance batches; final disposal releases the shared geometries, materials, and textures. No per-frame allocations of these new resources were introduced. The updated unit test checks a finite resource budget and stable counts through successive real runs, rather than silently retaining obsolete exact counts.
- **Character resources and motion:** The scarf material enters the rig's material ownership set, and the added eye meshes use its shared sphere geometry. Gaze movement updates existing pivots; it does not allocate new meshes. Both character detail levels preserve the same articulation, handle production loss reasons, and dispose their tracked resources once. Code inspection establishes structure and lifecycle, not facial readability or motion quality in the rendered game.
- **Journal URLs:** `progress.js:33–37` validates same-origin `/maze/` image URLs before adding the capture timestamp through `URLSearchParams`. The change does not introduce HTML interpolation or expand the existing image-origin allowlist.
- **Tests:** The tick-progress browser assertion now accepts a genuine run transition as well as increasing ticks, avoiding a false failure when the run restarts. The additional fallback test covers a nonempty minimap draw, both disclosure closures/focus returns, and result reconnect status. The post-repair test revision also adds short-landscape popup containment. This reviewer inspected those assertions and independently verified the repaired layout and visible focus indicator through the targeted probes, without rerunning the entire browser suite.

## Verification performed and limits

Executed once, serially, without a build or browser:

```text
node --test --test-concurrency=1 \
  tests/phase3/maze-3d-world.test.cjs \
  tests/phase3/maze-3d-characters.test.cjs \
  tests/phase3/maze-3d-presentation.test.cjs \
  tests/phase3/catalogue-frontend-quality.test.cjs
```

All four file suites passed in 13.8 seconds. They contain 16 declared focused tests; this environment's runner reports file-level totals. `git diff --check` also passed. Tests used the existing compiled authority modules and imported the current browser world/character source directly. No authoritative source was changed by this refinement.

After that unit review, ran the specifically requested no-WebGL layout probe described above against `http://127.0.0.1:4185/maze`; it confirmed the expanded-disclosure defect. The first launch failed before opening a page because of the container's Chromium sandbox restriction; the same probe then ran successfully through the approved escalation mechanism. After the integration owner repaired the CSS, one authorized follow-up browser verified the short and long text cases and visible Map focus indicator. Each browser closed after its assigned work. No additional suite or 3D render was run. The integration owner separately reported a passing fallback disclosure/focus/reconnect test; this reviewer inspected its source but did not claim its run as independent evidence.

In the same post-repair browser, navigated to `/maze/progress` at 1440×1000 and refreshed `evidence/maze-3d/captures/progress.png` as requested. The full-page screenshot is 4359px tall, captured at `2026-10-30T20:23:34.243Z`, and displays evidence updated at 20:20 UTC. All eight existing image sources decoded successfully before capture; the fourth-pass placeholder remains explicitly uncaptured. The reviewer inspected the saved journal output. Its fresh screenshot date is not a claim that the older embedded gameplay captures depict the latest source.

Remaining evidence requirements are final desktop/portrait/landscape 3D captures and motion, current complete real-browser recovery/resource checks, and renewed independent visual comparison. Source structure and bounded JavaScript ownership do not substitute for browser memory, frame-time, perceptual readability, or benchmark evidence.

## Source identity

Fingerprints identify the reviewed product and test snapshots. CSS and browser-test hashes were refreshed after both repairs; journal hashes identify the record captured during the follow-up. The integration owner continued evidence/document work concurrently.

| File | SHA-256 |
| --- | --- |
| `public/ai-maze-escape/app.js` | `d906f590818e95a0eab3d23ddf6d7dee8fc91d919c7afe08b37b2e7bf2d90381` |
| `public/ai-maze-escape/index.html` | `bb7d7ad21902625c2df308e917ec4964960ecbb103d7cc86409a9530cfd13c8e` |
| `public/ai-maze-escape/ux-v2.css` | `7c01d2ab080cdb33cc246fd5c21f181e984469811af060518fc20648a97eeb50` |
| `public/ai-maze-escape/map-view.mjs` | `6363a6ef173db6e8f389b18466b67ecfb901e5f22c2eb51ab4bb00bc164aac10` |
| `public/ai-maze-escape/world.js` | `43992b65a9a93663c63ad3f0eec3b20b02c92569c0c10aa219582a0fceaaff6c` |
| `public/ai-maze-escape/characters.js` | `618d0a9bd4d3f8c741dd2519de1d31050b812bbf7444afe992088e09cfb2ba42` |
| `public/ai-maze-escape/progress.js` | `d1ea4b7f70a13bb51e5ca73992771d8d9a3dfd0c105ca122720a2e744a2e446a` |
| `tests/browser/maze-3d.spec.cjs` | `f8816b4c9c2f2e7f3412d9e2ed3efc223c883bb7ba543762a557293821e7145e` |
| `tests/phase3/maze-3d-world.test.cjs` | `ad3f9efbf17bc63bdeeb09926a372e31b818d227912f711d0eec29434bc9e971` |
| `tests/phase3/catalogue-frontend-quality.test.cjs` | `c3c8532b1f3dba2ba44d2881a98af11b8dd06cfa981f76e7b6a1e35def5b260d` |
| `public/ai-maze-escape/progress.json` | `724439d4b3de8a457c86c1c4402dcc111cccd7c800b481dfaf2dd070bd0766e4` |
| `evidence/maze-3d/captures/progress.png` | `2e6c3b285500e2779fbd246b62bcbb5cd69382240172d490023cebd691c798d9` |
