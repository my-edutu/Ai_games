# Game 2 Pass43 — dorsal split and physical ember seam review gate (2026-11-01)

**Current status: independently verified Nintendo benchmark NOT PASSED. Pass43 candidate awaits original source-bound screenshots and separate critic.**

## Fixed bar and smallest visual gap

Use the same two byte-frozen Nintendo Captain Toad gameplay frames and hashes in `reference-manifest.json`. Luigi's Mansion 3 supplies supporting expressive-creature readability, not a replacement quality bar. Source-bound [Pass42 original rendered comparison](./guardian-elytra-pass-42-review-gate.md) found only **0.1494%** of 1280×900 encounter pixels materially different from pass41, all on Thornback. At native size two genuine hinged dark shells remained nearly indistinguishable and the underside emissive was hidden from the overhead camera. Fix **only** that separately judgeable flaw; do not move game actors to fake proximity or disclose hidden state.

## Builder implementation

- [Source `f9054d9`](https://github.com/my-edutu/Ai_games/commit/f9054d90f61c653b4d33cf0ac7a47d7444f1dde4) increases the **same real pair of physically hinged elytra** around the existing three axes to a stronger source-derived public attention pose; each receives a narrow **parented 3D top-inner-edge ember fissure**. These are small original meshes, attached to the wing, not camera-facing sprites or new enemy entities.
- [Regression `d6fa8ae`](https://github.com/my-edutu/Ai_games/commit/d6fa8ae41d669f19dcbbe95b9697c4a42bf52632) strengthens actual threat-intensity rotation and verifies seam attachment and suppression in unseen/terminal states for balanced and detailed render rigs and reduced motion. Previous [`db4032f`](https://github.com/my-edutu/Ai_games/commit/db4032f5fd31bc8e4e61ef71721de08072a942ae) fixes strict negative-zero neutral pose; no false hidden or terminal cue remains.
- Reused immutable public threat proximity strength only; no authority, pathfinding, hidden maze topology, game rules, gate unlocking, camera positioning, procedural random state or release configuration changed. No new per-frame object construction.

## Critic and acceptance criteria

1. Complete exact `d6fa8ae` focused Node/production Chromium capture CI. Independently verify original `encounter-public.png`/JSON source hashes, actual UTC creation, same seed `maze-visual-reference-13` and same disclosed tick **13**, actual threat distance and on-screen actor count. A captured PNG means the *renderer executed*, not that the visual is accepted.
2. Compare **native** 1280×900 pass43 to pass42 [artifact 13085960259](https://github.com/my-edutu/Ai_games/actions/runs/41311276320/artifacts/13085960259), pass41 [artifact 13083881661](https://github.com/my-edutu/Ai_games/actions/runs/41306288258/artifacts/13083881661) and the exact unchanged Nintendo reference. Crop for explanation, but make acceptance at unscaled full-screen size. Verify the shell is now **two distinct plausible attached raised plates**, luminous top fissures are visible, leg/face and explorer remain readable, and the reef garden is still navigable. Full-model 3D animation review and phone guardian capture remain separate gates.
3. Reject if the accent is visually masked, looks like disconnected glowing wings, or a leg/body/camera edge is clipped. Quantitative pixel difference is useful for identifying real change, not an aesthetic score.
4. A separately instantiated **fresh-context critic** should judge original, unlabeled A/B output when shared workspace reconnects. Never turn a lead comparison into a claim of an independent victory.

**Honest runtime limitations:** shared workspace tunnel does not expose separate builders/critics or Ultracode at this run; GitHub Actions uses CPU-throttled software WebGL. No hardware FPS or benchmark parity is inferred. Keep PR #53 **draft, unmerged, undeployed**; do not lower or replace the Nintendo references.
