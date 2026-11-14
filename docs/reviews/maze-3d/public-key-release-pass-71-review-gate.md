# Pass71 — public key release (2026-11-02)

**Gate status: Source candidate only. Visual acceptance pending. Fixed original Nintendo Captain Toad reference still wins. Draft PR #53 stays open. No merge/deploy.**

## Actual-image baseline and independent critique limits

The preceding Pass70b [source-bound GitHub Actions workflow](https://github.com/my-edutu/Ai_games/actions/runs/41423111002) was successful, with [20 original native WebGL PNGs](https://github.com/my-edutu/Ai_games/actions/runs/41423111002/artifacts/13130469457). Recomputed all original SHA-256s: 18 individual sidecar images plus two extra transition PNGs recorded by the exact gate manifest, **20/20 match**. Native 320, 390, 844 and 1280 views preserve real full-bleed 3D, the compact actionable HUD, physical Pip/Thornback silhouette margins and 44px interactions. The first attempt at offshore environment detail created a gigantic floating sphere with a detached green cap and was correctly **rejected**. The repaired low, angular spires now visibly break the water instead of simulating another navigable destination. They remain a small background improvement, not Nintendo-level authored world-building.

Against [official Captain Toad: Treasure Tracker gameplay imagery](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/), the physical level lacks memorable independently readable objective moments, strong foreground/midground storytelling and actor-scale visual punch. This is a **lead review**, not a second fresh-context worker or blind A/B: the approved shared workspace reported a disconnected tunnel. Subagents and Ultracode could not be invoked. Do not claim source CI or image hashes establish visual parity.

## Small builder/critic pieces

| Piece | Builder | Source-safety critic | Native visual critic |
| --- | --- | --- | --- |
| Genuine key pickup | After previously public uncollected key at same cell becomes collected in later same-run tick and enters public inventory; never infer a hidden item | Four new pure tests require true inventory, earlier disclosure, monotonic tick, no terminal/new run and deterministic ordering | Must show a *real* public production key pickup in exact-head WebGL |
| 3D physical response | Eight original shared-shape octahedral shards released from the authentic former key cell; no floating UI copy or new gameplay authority | Resource creation once before frames, deterministic motion, teardown and short expiry, stable reduced-motion | Reject if shards invisible, look like another uncollected key, block Pip or occupy an invented room |
| Stall-safe event imaging | Cosmetic animation time uses same capped gate visual clock; authoritative simulation/counters not changed | Capture the actual PNG before declaring signal visible | New exact-source original **1280x900 and 390x844** PNGs must preserve SHA sidecars and **six real projected shards** even **after** screenshot |
| HUD / privacy and mobile | Existing low-text full-viewport stage, compact objective, key/countdown/discovery/danger, 44px controls remain | Do not weaken any 320/390/844/1280 full-model, privacy or accessibility test | Reject cropped guardian/Pip, occlusion, decorative prose, dead space, or unframed physical pickup |

## Current review decision

The new [original pickup implementation](https://github.com/my-edutu/Ai_games/commit/5e2bf7ee934409fe34a5d5dee695cd870fb18f55) and [visual clock/source-bound browser gate](https://github.com/my-edutu/Ai_games/commit/f32030a312374a0e3aeb8e8215d7b46591497d8e) are **committed**. The original production screenshot script searches consecutive seeded run observations, not a fabricated fixture or DOM-inserted collectible. Its evidence gate requires an actual picked-up key in public inventory, six physically in-frame modeled release shards at desktop and portrait, dated full-resolution PNG/hash/production-source sidecars, and no post-capture loss of the event.

**Do not accept Pass71 visually** until the new-source workflow finishes and its original PNGs are independently hash-verified and examined without cropping, then compared directly with the fixed official bar. Even successful render and full CI prove a localized feature, not the complete 3D game benchmark. Distinguish throttled CPU SwiftShader timings from real product GPU defects.

Largest remaining objective gap: the combined physical world/character story must become substantially more distinguishable and fun to watch at native 320px and desktop, with authentic cinematic cause/effect rather than additional dashboard writing.
