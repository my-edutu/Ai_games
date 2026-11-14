# Round 11: idempotent live HUD

Base feature head: `73d885d865eb0594c8cc7dab66183e2c9822ba68`. The reproduction bundle uses its synthetic merge checkout `db5707062753c1acadac84efa3a1327d6e6b68a4` with main `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`.

## Reproduced defect and correction

A real-browser MutationObserver found 50 HUD mutations in 650 ms while every poll returned an identical retained public frame. The production app rewrote unchanged text and scene attributes; the overview reset its hidden attribute. The same observer now finds zero mutations. Changed values are compared individually; there is no revision-only early return that could hide captions or recovery state.

Tests exercise unchanged polling with ongoing 3D draws, a changed caption on the same snapshot revision, and disconnect/reconnect. All existing renderer performance assertions remain unchanged. No authority, geometry, shader, resolution, animation, control or game rule changes are included.

## Verification available before publication

- `node --check public/snake-stream/app.js`: passed.
- Focused `node --test tests/phase3/snake-*.test.cjs`: 28/28 passed before and after this change.
- Browser observer: red 50 mutations, green 0 mutations, no page errors, using Chromium 144/SwiftShader/Xvfb with exact source modules and a retained public frame.
- Full `npm test`: 530/531 passed, no skips/cancellations. The existing Eko Run headless timing test failed at p99 5.344828 ms against its 4 ms budget. This local result is not a green full-suite claim.
- Local HTTP navigation is administratively blocked. Offline browser diagnostics use Blob imports and in-memory snapshots, never an altered browser policy. They do not establish live-host integration. GitHub CI must verify the new browser tests and unchanged desktop pacing gate.

## Performance interpretation

Removing redundant writes is a verified waste reduction, not proof that the full-game FPS target is met. Fixed-scale queue experiments showed no useful improvement from four pending frames or removing explicit flush; neither experiment is retained. CSS/scene ablations are diagnostic-only and cannot satisfy acceptance.

## Review, rollout and rollback

Self-review: helper functions are hoisted, optional labels retain existence checks, new captions on unchanged revisions still update, and recovery paths use the same setters. No independent critic was available because the shared workspace tunnel was offline. Commercial visual victory and independent whole-game review remain open.

Keep PR 52 draft, unmerged and undeployed. Revert this checkpoint to restore unconditional HUD writes. Reproduction workflow artifacts contain only tracked source and locked public dependencies, not Git credentials or working state.
