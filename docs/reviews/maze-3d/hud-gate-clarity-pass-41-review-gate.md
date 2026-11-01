# Game 2 pass41 — truthful public key + sealed gate at a glance (2026-11-01)

**Source candidate only; original native screenshot and critics must accept it. Frozen Nintendo Captain Toad standard NOT PASSED.**

## Why this slice

Pass37 original production seed `maze-visual-reference-13`, tick21: Pip physically holds the exact key to a publicly disclosed actually CLOSED door, but the HUD still says **“Find a passage / Find the keys”**. This conflicts with the visible stakes and wastes the narrow 390px game's information hierarchy. The lead judged pass40 bright lagoon blobs visually distracting and reverted that water shader; the original actor/gate camera and best shoreline appearance remain intact.

## Source implementation

- Pure `publicHeldGateStatus(snapshot)` in the public-only map-view layer uses only `currentCell`, `width`, `height`, disclosed `cells`/`doors`/`inventory`, and the existing strength-gated `publicCarriedGateCue`; no secret key requirements, pathfinding, hidden cell or AI truth.
- Only when a truly adjacent publicly known CLOSED gate has an exactly carried matching key, and neither an accessible public landmark nor terminal/danger state takes priority, the UI reads **“Known sealed gate / Matching key in hand / Pip carries this gate's key. Its bars are still closed.”**
- Otherwise the original current goal, landmark and danger captions win unchanged. This does NOT claim an unlocked route or a key insertion. The original model, camera, material, lighting, water, draw-call count, and simulation are identical to pass37.
- Separate pure tests cover closed/key match, wrong/missing key, undisclosed door, remote gate, open gate and result; source-bound Chromium test asserts the visible message in the actual 3D keyed gate frame.

**Visual acceptance:** source-exact dated 390×844 and 1280×900 screenshots vs pass37 and official frozen SHA-pinned Nintendo frames; reject if mobile goal copy wraps excessively or shrinks actual diorama, danger/landmark priority lies, or HUD becomes too text-heavy. Confirm no hidden state and no scene illusions. Separate fresh-context critics/Ultracode blocked by shared workspace tunnel; SwiftShader CPU timings cannot prove hardware GPU performance. Draft PR #53 not merged/deployed.
