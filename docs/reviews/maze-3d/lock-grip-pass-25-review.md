# Game 2 Gauntlet — pass 25: physical keyed socket and gripped key (candidate)

**2026-10-31. Benchmark: NOT PASSED. Visual acceptance: PENDING fresh rendered output and separate critic.** PR #53 stays draft, unmerged and undeployed.

## Fixed comparison bar

Keep the hash-pinned official Nintendo Captain Toad gameplay images exactly as recorded in `docs/reviews/maze-3d/reference-manifest.json` (toad-scene SHA-256 `b33003efa5e943e27ddc9daa9d1c9a396313d5f0ee7bd836c731c4cbfc286d9b`; toad-maze SHA-256 `4c6a3e171ebd4125cf16de29db54f22089f1ba6f3ae85cd5d6059f30f262e8b7`). Supporting scene/character references remain Luigi's Mansion 3 and ASTRO BOT. Do not replace Nintendo frames with easier comparisons.

## Source changes and independently judgeable pieces

1. **Lock identity and depth.** [`5ccbbae`](https://github.com/my-edutu/Ai_games/commit/5ccbbaea0cb76b7554b41e8cd914af1a16e2f3cd) gives a genuinely disclosed, closed gate a larger layered metal socket with an actual circular/keyway profile, facing the follow camera in either doorway orientation. Its front ring and slot should remain visible behind the coral blocked-path diagonals, instead of disappearing into the old small brass blobs.
2. **Public-information and gate authority.** The physical socket only changes from gold to mint when the *exact* matching key is already carried in the public inventory. A merely observed matching key leaves a gold socket, an unrelated or undisclosed key adds no match marker, and only authoritative `door.open` can withdraw the barrier or lock. [`f6fd6da`](https://github.com/my-edutu/Ai_games/commit/f6fd6daac6ad8d898b882ef9f1a01b9f214f8452) expands model-state regressions without modifying the deterministic simulation.
3. **Pip's physical grip.** [`4a9f2de`](https://github.com/my-edutu/Ai_games/commit/4a9f2de6278b7da4d4744d3cfa9374db26f3186e) keeps the same raised glove/prop transform but changes a formerly all-mint floating loop into a mint bow and warm solid key teeth/shaft with a dark modeled grip at the glove. This remains a single reusable prop, shown only by the existing public key-to-closed-gate cue. [`aff967b`](https://github.com/my-edutu/Ai_games/commit/aff967baa6fe90c5e71722cac50163b82b0df378) adds a focused two-LOD color/material regression.

## Verification boundary and next review

- Last **completed** source-bound visual evidence is still **pass 24**: authentic production `maze-visual-reference-13`, tick 21, desktop and portrait frames, source/capture hashes and manifest in [CI artifact 13043996998](https://github.com/my-edutu/Ai_games/actions/runs/41204087109/artifacts/13043996998). Its real image shows a raised key that can resemble a detached pale loop; the lock and glove connection are not yet visually persuasive. Nintendo wins.
- The **new pass-25 candidate** is committed on the existing branch, but [candidate CI 41210379937](https://github.com/my-edutu/Ai_games/actions/runs/41210379937) was **queued at review time**. Do not represent this candidate as tested, captured or visually improved until its exact-source checks complete and real image hashes match. No new pass-25 screenshots are claimed here.
- Next, inspect and compare the candidate's *actual native 1280×900 and 390×844* gate frames against pass 24 and the unchanged Nintendo images, masked A/B where practical. Critic should separately judge key grip/shape, socket readability, key-to-lock causality, mobile scale and the still-too-open lagoon. Feed the largest measured gap back into the next iteration.
- Shared-workspace tunnel rejected fresh-context subagents (`Tunnel-client has not been seen for 300 seconds`); no separate critic was run and no Ultracode capability was available. The lead's source inspection and pass-24 screenshots cannot stand in for a fresh critic of pass 25. Software SwiftShader measurements on the CPU-throttled workspace are not hardware GPU FPS. Do not repeat inconclusive heavy probes.

**Gate remains OPEN. No benchmark win, merge, deployment or automation pause.**
