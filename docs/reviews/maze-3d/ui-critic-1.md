# AI Maze Escape — independent UI critic, round 1

Date: 2026-10-30

## Verdict

**LOSE against the fixed Captain Toad reference.** The interface has a coherent visual identity and a viable responsive composition, but it does not yet support equally immediate, dependable adventure readability. The biggest remaining UI gap is the relationship between **the objective, genuine progress, and current phase**. The decorative mission title and a discovery percentage are more prominent than what the explorer must do next, and the result screen demonstrably overstates discovery.

This is a UI/readability verdict, not a substitute for a character, environment, animation, audio, or performance review. The comparison bar has not been lowered to “the page fits” or “the renderer works.”

## Evidence and independence

Inspected the actual application captures supplied for this review:

| Capture | Size | State represented |
| --- | --- | --- |
| `evidence/maze-3d/captures/desktop.png` | 1600 × 1000 | Exploration, tick 10 |
| `evidence/maze-3d/captures/mobile-portrait.png` | 390 × 844 | Same public exploration frame |
| `evidence/maze-3d/captures/mobile-landscape.png` | 844 × 390 | Same public exploration frame |
| `evidence/maze-3d/captures/result.png` | 1280 × 900 | Escape result, tick 21 |
| `evidence/maze-3d/captures/progress.png` | 1440 × 2374 | Earlier development-journal state |

Fixed references: `/tmp/maze-benchmark/toad-maze.jpg` and `/tmp/maze-benchmark/toad-scene.jpg`, the supplied official Captain Toad gallery stills. I formed the visual judgment before inspecting implementation and did not consult builder or other critic report files. The progress screenshot inherently contains an older review excerpt; that excerpt was not used as the basis of this verdict.

**Unblinded limitation:** the recognizable Nintendo character and the candidate's branding disclose provenance. No randomized unlabeled A/B or uninstructed-viewer comprehension test was performed. Reference and candidate have different aspect ratios and presentation contexts. The candidate is an autonomous spectator application and reasonably needs more explanation than a console game; parity does not require copying Nintendo's HUD. Static captures establish appearance at these frames, not touch usability, animation quality, compressed-stream readability, recovery behavior, or audio quality. No browser was opened because the parent was running recovery checks.

The capture manifest says these are production `MazeRuntime` / `MazePresentationController` public frames rendered by the actual application. I used its frame metadata only after the visual assessment, to verify the progress discrepancy.

## What works

- Forest green, warm cream, and amber form a consistent identity. The serif headings, line icons, thin dividers, and restrained panels belong together.
- The scene receives the majority of the desktop and landscape surface. It is not crowded by unrelated controls or diagnostics.
- Portrait has a deliberate reflow: scene first, two-column information beneath, captions on a reserved final row. The supplied frame has no visible horizontal clipping or colliding blocks.
- Captions remain outside the scene. The map occupies a consistent corner and is presented as the explorer's known map.
- The result overlay plainly reports an escape, and the journal visibly says “Not yet passed.” Neither screenshot claims a benchmark victory.

These are real strengths. The remaining failures are not a request for more ornament.

## Findings, ordered for the next builder pass

### 1. P1 — “Garden discovered” is false at escape

The result capture shows **100% Garden discovered**. The manifest for that same result frame records **75 known cells out of 187 total cells**, or **40.1%**. The exploration frame records 55/187, or 29.4%, matching its displayed 29%.

Source inspection identifies the cause:

- `public/ai-maze-escape/index.html`, `#progress`: label is “Garden discovered.”
- `public/ai-maze-escape/app.js`, `update()`: displays `snapshot.progressPermille`.
- `games/ai-maze-escape/src/presentation/snapshot.ts`, `buildMazeRenderSnapshot()`: forces `progressPermille` to 1000 when the outcome is escape, regardless of `discoveredCells`.

**Fix:** preserve authoritative simulation behavior and existing progress contracts. For this discovery label, derive the percentage from the already-public discovered-cell count and public dimensions, or change the label and visual treatment to an explicitly defined completion measure. The cleanest presentation-only repair is actual discovery percentage plus a separate “Escaped” outcome. An escape should not imply that every room was explored.

**Acceptance:** the supplied result frame reads 40% discovered and a distinct successful outcome; a truly fully discovered frame may read 100%. Do not expose undiscovered objects to calculate progress.

### 2. P1 — The primary hierarchy does not answer “what remains?”

At desktop size, “A way through.” is the dominant information object in the sidebar. The actual instructions are subordinate. Below it, 29% and 107:57 attract attention, while “1 key collected” does not establish whether the next useful milestone is another key, a locked passage, or finding the exit. The same slogan consumes scarce portrait and landscape space.

Captain Toad's sparse, robust icons and collectible slots are readable at a glance while the scene communicates the immediate route and goal. This candidate's refinement currently resides more in the page's typography than in the run's information hierarchy.

**Fix:** retain the identity, but make the first persistent game message a compact, state-specific objective. Use known facts already exposed by the public snapshot: for example, “Collect the known key,” “Find the exit,” or “Reach the known exit,” with concise inventory/exit state nearby. Reduce the decorative mission slogan on compact screens. Keep discovery as secondary exploration information.

The public snapshot does **not** currently expose an authoritative total key requirement. Do not invent an `x/y` denominator by counting hidden world objects. A truthful alternative is “1 key held · another key located” when `snapshot.keys` contains that known uncollected key, or “Exit not yet discovered” when `exitCell` is null. Only show a required total if it is explicitly public rule information.

**Acceptance:** an unfamiliar viewer can identify the current objective, held keys, known exit state, and phase without reading the small explanatory paragraph. Recheck the same frame at all three supplied sizes.

### 3. P1 — Terminal and AI-state language is inconsistent

The escape capture retains **LIVE EXPLORATION** at the top of the scene and **THE EXPLORER'S NEXT MOVE** above **Escaped**. The center overlay and caption communicate success, but the persistent labels describe ongoing action. On the exploration screen, **Returning Key** can be read as returning an object, while the paragraph means travelling to collect it.

Implementation confirms both issues:

- `index.html` hardcodes the status-strip text and intent-card eyebrow.
- `app.js` maps modes such as `seeking-key`, `escaping`, and `evading`, but actual `MazeIntentMode` values in `packages/game-contracts/src/index.ts` include `returning-key`, `unlocking-route`, `searching-exit`, `evading-threat`, `revising-map`, `fallback`, and `escaped`. Most therefore fall through to a mechanically spaced mode name.

**Fix:** map the real public modes to plain viewer language, and update phase labels from `frame.scene`. Examples: `returning-key` → “Collecting a known key”; `evading-threat` → “Avoiding a warden”; `revising-map` → “Trying another passage.” At result, show “Escape complete” / “Run result”; at intermission, “Next adventure.” Preserve authoritative explanations and do not fabricate unseen threats or routes. An exact next-run countdown should be shown only if an authoritative value exists.

**Acceptance:** every actual mode has an intentional viewer-facing label. Result, intermission, and reconnect captures contain no contradictory “live exploration” or “next move” framing. Focused contract checks should cover these behavior changes.

### 4. P2 — Compact layouts fit by making information too small

Portrait is orderly, but objective copy, inventory text, intent detail, and map labeling are small. Landscape is more severe: the avatar becomes a tiny visual token, while the narrow sidebar includes the slogan, objective, metrics, inventory, and intent. Essential labels remain readable only with close inspection. The map's title and ornamental note are too small to earn their space.

Current CSS supports the visual observation: compact objective text is 10px, intent detail 9px, several metric labels 8px, the intent eyebrow 6px, and the map title 5px. Portrait controls are roughly 32 × 34px; landscape icon buttons are 32px. These dimensions fit, but static screenshots alone cannot establish comfortable touch use.

**Fix:** simplify compact information before scaling it down. Prioritize current objective, key/exit state, and the latest caption; demote steps and decorative eyebrows. Use approximately 12px as a practical floor for essential phone text and around 44px target areas for touch controls, with reasonable spacing. Those are proposed design targets for the next iteration, not a certification of a particular accessibility standard. If the header cannot fit, shorten the brand or use a compact control group. Remove the minimap's miniature decorative copy rather than shrinking it further.

The scene/camera owner should also preserve a larger protagonist and immediate interactable at landscape size. The large area of water in that frame does not compensate for a very small decision-making subject.

**Acceptance:** capture 390 × 844 and 844 × 390 at native scale after simplifying. Objective and current action should be comfortable to read without zoom; controls should be easy to target; captions must retain their reserved area. A no-overflow test is necessary but insufficient.

### 5. P2 — The journal needs current evidence, with its existing honesty preserved

The inspected progress screenshot shows an old baseline, an unavailable first-integration image, and a pending mobile capture. It therefore does not document the functioning desktop and mobile scenes that this review inspected. That is a limitation of this **stale captured journal**, not proof that the actively edited journal still has those omissions.

The current `progress.js` inspected after the visual judgment already supports `review.verdict || review.status`, whereas the earlier capture labels its review “Unreviewed.” Do not report that captured old label as an unfixed current bug. Likewise, the source's polling behavior does not prove that the user has seen the newest evidence.

**Fix/verification:** after builders finish updating the records and image routes, recapture `/maze/progress`. It should show these real viewport captures, dates, the actual independent verdict, concrete remaining gaps, and the continuing distinction between software verification and visual parity. Retain “Not yet passed” until fresh output warrants another verdict.

## Smaller improvements

- The unlabeled thin bar in the intent card represents AI confidence in code but resembles another progress bar. Label its meaning accessibly and visually where useful, or remove it from the public compact view.
- “Route unlocked: door-1” leaks an implementation identifier into otherwise natural-language captions. A caption such as “A locked passage is now open” would match the presentation. Keep IDs in operator/debug output.
- `107:57` is not evidence of a timer formatting bug: the code converts tick budget to minutes and seconds. If such long budgets are normal, clarify the unit or choose a less ambiguous duration format; do not shorten authoritative time merely to create tension.
- The result overlay is clear but covers the central world. After correctness fixes, consider whether a smaller result treatment can preserve the explorer/exit moment while remaining unmistakable. This is secondary to truthful state.

## Recommended next loop

1. Fix discovery labeling/value, real intent-mode mapping, and phase-aware status text.
2. Rebalance compact hierarchy around the objective and known next milestone; enlarge essential text and touch areas by removing secondary copy.
3. Recapture the same fixed public exploration and result frames at the supplied dimensions, plus actual danger, intermission, and reconnect frames. Refresh the journal capture after evidence routes are populated.
4. Have a fresh critic inspect native-size captures before reading this report or the builder's explanation. Keep the fixed Nintendo references. A pass requires both truthful state and immediate game readability; layout containment alone will not change this verdict.

## Capture identity

SHA-256 of files actually inspected:

```text
desktop.png          ca5846a3fc3c0629a082c860d63abb57baf96427aee19f02236a8b8059aa8791
mobile-portrait.png  6a7063490be481e9715bcdd99f2eda679e40dcfacfd168968980773ad5e865f9
mobile-landscape.png 5e5979dac1ce3b977a47cfc95f014fbcd4ef9876f52ca424c9e8ee0fc36d0b56
result.png           c47e6e59ec813b90f14e7121cf4062e2d08a497dfcdf46151570b570f1a3602d
progress.png         1f27cb59a4a2b66ef4b934ff23f8223b67f182ea20bcbdb4c0a807010613cbad
```

No production code, captures, or test files were changed for this review. No browser tests were run by this critic.
