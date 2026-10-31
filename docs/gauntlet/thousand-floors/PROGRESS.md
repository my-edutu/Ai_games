# Game 4 — THOUSAND: Gauntlet progress

## Current verdict: iteration 6 reviewed in the real game; benchmark not passed

Product source `bfa34ec1fb93d478d5ddb87c051ef8d8f602bd5d` adds ten distinct district material/light palettes, surface relief, gradient skies and original architectural landmarks. The compact iteration-5 HUD runs with the real campaign again. **535 local catalogue tests, 32 focused checks and six actual-game browser tests pass.** Five new high-quality WebGL stills were inspected across four districts and portrait, without recorded page/HTTP errors.

Read [iteration 6: exact evidence, costs and visual self-review](ITERATION-6.md). [Actual screenshot artifact](https://github.com/my-edutu/Ai_games/actions/runs/41164336812/artifacts/13029195358) is retained by CI for seven days; the capture script is committed for reproduction. The running progress page links directly to current district review routes.

The benchmark remains **not passed**. This retry was self-reviewed because the worker service stayed offline, not independently judged against ASTRO BOT. Character models and campaign rules were deliberately preserved. Repeated square platforms, sparse distant scenery and stronger expressive motion remain the largest gaps. The toolchain's two high-severity audit warnings also remain a release concern.

## Historical evidence through iteration 4

The image, counts and independent reviews below are the historical iteration-4 record, not current iteration-6 performance measurements. Current high-quality desktop stills report 26 textures and 102–205 draw calls; no hardware FPS or long-soak result is claimed.

Baseline `d1678cd` named Game 4 in the catalogue but had no playable Game 4 runtime. These captures therefore show the development of a new implementation from that verified starting point.

![Historical iteration-4 Game 4 capture](../../../evidence/thousand-floors/captures/iteration-4-desktop.jpg)

## Historical iteration-4 evidence

| Piece | Result | Evidence |
|---|---|---|
| Campaign and persistence | Focused checks pass; no remaining P1 found in the final bounded campaign review | [Campaign review 4](campaign-critic-round-4.md) |
| Character, environment and camera | Implemented; sampled exit-clipping defect corrected; reference still preferred | [Visual review 3](visual-critic-round-3.md) |
| Viewer controls and saved progress | Six Chromium functional checks pass in the supported low tier | [Verification record](VERIFICATION.md) |
| Resource lifecycle | Ten real generated district snapshots return to the exact initial 50 geometries / 13 textures | [Machine-readable evidence](../../../evidence/thousand-floors/verification.json) |
| High-quality performance and production operation | Unverified; high-tier capture is slow on this host | No hardware FPS or long-soak claim |

## Iteration history

1. **Baseline:** isolated branch, fixed references and shared interfaces. No existing runtime was passed off as a previous playable version.
2. **Iteration 1:** worker-driven campaign, original first cast and 3D platforms. [Desktop](../../../evidence/thousand-floors/captures/iteration-1-desktop.jpg), [portrait](../../../evidence/thousand-floors/captures/iteration-1-mobile.jpg). The [first visual critic](visual-critic-round-1.md) preferred the reference and returned environment depth, material distinction, articulation and mobile framing. [Campaign review 1](campaign-critic-round-1.md) found hazard-contact and impossible-save defects.
3. **Iteration 2:** stronger platform dressing, compact portrait HUD, interpolation and low exit beacon. [Desktop](../../../evidence/thousand-floors/captures/iteration-2-desktop.jpg), [portrait](../../../evidence/thousand-floors/captures/iteration-2-mobile.jpg). [Campaign review 2](campaign-critic-round-2.md) verified the contact fix and exposed reward/phase inconsistencies; [review 3](campaign-critic-round-3.md) found the final recovery-expiry invariant. Builders corrected each with regression evidence.
4. **Iteration 3:** a skinned articulated explorer, richer architecture/materials and geometry batching. [Desktop](../../../evidence/thousand-floors/captures/iteration-3-desktop.jpg), [portrait](../../../evidence/thousand-floors/captures/iteration-3-mobile.jpg). The [second visual critic](visual-critic-round-2.md) found an upcoming exit entering view too late and a world still dominated by isolated slabs.
5. **Iteration 4:** connected cliff terraces, lower galleries and distant settlements; anticipatory framing uses the authoritative route cursor and a stable scale. [Desktop](../../../evidence/thousand-floors/captures/iteration-4-desktop.jpg), [portrait](../../../evidence/thousand-floors/captures/iteration-4-mobile.jpg), [motion excerpt](../../../evidence/thousand-floors/captures/iteration-4-motion.mp4). Actual later-district captures: [Aqueduct, floor 102](../../../evidence/thousand-floors/captures/district-2-aqueduct.jpg), [Coral Archive, floor 403](../../../evidence/thousand-floors/captures/district-5-coral.jpg), [Crown, floor 902](../../../evidence/thousand-floors/captures/district-10-crown.jpg). The latest critic no longer reproduced the prior exit clipping in the sampled traversal and found no new actor/next-landing obstruction in the inspected material.

## Historical iteration-4 gaps

The largest presentation gap is district-specific primary architecture and material finish: repeated square caps, brick towers and regular surface treatment remain prominent. The agent follows one generated route per floor; alternative route selection is not implemented. The high-quality recordings are slow on this shared host, so real-time animation quality and hardware frame rate require further evidence. Broader accessibility, audio listening quality, context-loss recovery and production soak remain open.

No blind study is claimed: recognizable characters and HUDs reveal the sources. The [reference manifest](reference-evidence.md) records official clips, exact timestamps and comparison limits. Reference assets are not shipped as original game art. `ultracode` is unavailable in this environment; independent builder/fresh-critic roles were executed with the available subagents.

## Later iterations

6. **Iteration 5:** [compact UI and Journey panel](UI-ITERATION-5.md), originally verified through UI fixtures.
7. **Iteration 6:** [distinct district architecture and real-game verification](ITERATION-6.md), actual browser checks and captures, author self-review. No benchmark win claimed.

## Run and inspect

From the repository root: `npm ci`, then `npm run floors:stream`. Open **http://localhost:4184/floors/** and **http://localhost:4184/floors/progress**. The latter refreshes its evidence record every five seconds while open; it does not itself launch builders or create new iterations. See the [game README](../../../games/ai-vs-1000-floors/README.md) for controls, review URLs and validation commands.
