# Infinite Tower Climb — actual earned Pulse Shot becomes a staged 3D guardian duel (PR #68)

**2026-11-03 · SAME OPEN TRANSFORMATION, NOT A GAUNTLET PASS.**
Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9`.
Last gameplay+test source at authoring: `58904b44d112ea93027a3bdd9d95111cff4c24df`.
PR #58 remains independent; PR #68 remains draft. **LOOKS / FEELS / PLAYS: NOT EVALUATED** (0/5 genuine blind votes each).

## Actual gameplay reviewed before choosing the next problem

Downloaded and locally inspected the **real full-motion normal-speed WebM capture artifacts**, the associated source trace/motion metadata, and selected desktop/portrait raster frames from [capture run 41660405729](https://github.com/my-edutu/Ai_games/actions/runs/41660405729). All nine jobs completed. That run compares the frozen baseline to **older candidate `98b68f81949e7eff6c22fccbc7a7e23b8f48e04e`**; it DOES NOT show the newer guardian planted counterfire or this new scene code. Old candidate danger: [archive 13244105276](https://github.com/my-edutu/Ai_games/actions/runs/41660405729/artifacts/13244105276), baseline danger: [13242053851](https://github.com/my-edutu/Ai_games/actions/runs/41660405729/artifacts/13242053851). Old candidate outcome: [13241859193](https://github.com/my-edutu/Ai_games/actions/runs/41660405729/artifacts/13241859193).

The viewed older-source 960×600 danger video spans about 119s, and the 390×844 portrait version about 105s. Sampled frames at source-video wall times 5/25/50/70/95/115s show a functioning original articulated climber and world-space decks in foundry/ruins, but enormous machinery and shifting framing can dominate the small mobile encounter. Old baseline and candidate are visibly similar across many sampled moments; these are **builder visual observations**, not an independent preference verdict or aligned event-by-event comparison. The older candidate outcome recordings do include an authentic ended run and subsequent autonomous reset, but cannot certify the current branch. The clips are software-renderer captures, not supported-device FPS or latency.

## Systemic combat-visibility gap

The tactical agent can now fire an **earned real Pulse Shot** from source-authoritative supported footing and while a guardian genuinely charges, out to 210,000 source units with physical collision lane/facing/cooldown tests. Before this continuation the **guardian combat camera stops staging the boss at 90,000 units**, while the original tiny moving bullet/ribbon carries the earned long-distance action largely offscreen. Thus the visible 3D character, shot, guardian and physical lock did not consistently read as one fight even though the simulation fired real bolts.

## Connected real-game implementation

- The existing guardian shot stage now witnesses a **currently active player-owned physical projectile** travelling toward a live same-floor guardian. It rejects wrong owner/direction, wrong vertical collision lane, dead/inactive opponent, unsupported or deceased climber, missing source, terminal state and stale transport. It never predicts a hit, creates an attack, adds damage or moves the bolt.
- An original **cool alloy world-space counterfire plume** (four instances on low tier, six high) traces at most the bolt's observed **one fixed-step travel segment**. The guardian's original warm physical warning vanes can remain visible at the same moment: different source facts, bounded 1–2 depth-tested draws, no shadow casters or new lighting pass. Source tick/velocity own position, not the render clock. Same shader/geometry lifecycle is cleared on new run, stale state, renderer rebuild and disposal.
- The **portrait and desktop follow composition** now recognizes this exact alive projectile/guardian pair as an actual grounded ranged duel, permitting a *bounded* 135k ranged-combat staging distance only while the source projectile exists. It preserves the full hero + guardian silhouette, opaque tower sightline safeguards and independent airborne landing camera. Its actual projectile point participates in candidate camera selection. The **original skinned climber visor** turns toward this source guardian on the same condition, instead of the obsolete route marker.
- Original opt-in projectile-fire audio, authentic guardian HP-operated exterior mechanical seal, grounded recoil and earned evasive AI remain connected; no extra HUD, copied asset, network/sensor dependency or replay-authority change. Historical replay policy is untouched.

## Evidence and adversarial conditions

Focused regression tests prove actual projectile provenance, facing, height and active boss; source immutability; 3D exterior radius; low/high instancing budget; no imaginary hostile warning; simultaneous true charge and counterfire; safe clearing on staleness and renderer teardown; and the same observed source for portrait camera and skinned targeting. These are engineering safeguards, **never evidence of a successful Gauntlet transformation**.

Latest source-pinned [quality workflow 41666724688](https://github.com/my-edutu/Ai_games/actions/runs/41666724688) and [real motion capture workflow 41666724603](https://github.com/my-edutu/Ai_games/actions/runs/41666724603) were **queued/in progress at authoring**; do not assert outcomes. Earlier source `f7607ea` [technical integrity run 41661115647](https://github.com/my-edutu/Ai_games/actions/runs/41661115647) succeeded, but predates this new 3D combat framing.

**Critical open experience risk:** Even a truthful, well-placed pulse plume may be too small/brief to show an exciting duel in actual portrait motion, while staging a 135k fight could over-widen or occlude the actor. Only inspect the current-source full-motion 60+s normal-speed ascent/guardian/true outcome footage at matching seed/quality/native viewports, compare source-tick aligned A/B, and reject this framing if hero or landing regress. Full five fresh-context, blind randomized independent critics must judge each of LOOKS, FEELS and PLAYS (>=4/5 in each), with real-device p50/p95/p99/memory, accessibility, exact replay and renderer recovery before a transformation PASS.

No force-push, merge, deployment, frozen baseline reset or fictitious AAA/FPS claim. Continue the SAME open whole-game slice.
