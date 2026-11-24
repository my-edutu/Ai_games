# Game 2 Gauntlet — Pass57, Pip's source-truthful physical guardian startle (2026-11-01)

## Fixed benchmark and scope

[Draft PR #53](https://github.com/my-edutu/Ai_games/pull/53) against the **unchanged, SHA-pinned original Nintendo Captain Toad: Treasure Tracker screenshots** in [reference-manifest.json](./reference-manifest.json). Luigi's Mansion 3 and ASTRO BOT are supporting visual-quality references only. **Original Captain Toad still wins; no independent or blind benchmark victory.** Do not merge or deploy.

This independent judgeable unit is the **actual Pip / revealed Thornback physical action** at gameplay scale. It adds only cosmetic connected local articulated motion in `public/ai-maze-escape/characters.js`: knees bend/spread, torso recoils and crouches, head tilts, both arms brace with the existing held lantern, scarf trails. The pose responds exclusively to existing `attentionHeading` and `attentionStrength` computed from genuinely public disclosed guardian proximity. Pip's authoritative world transform/AI/rules and hidden map are never changed. With reduced motion, action is a stable static silhouette. With public encounter removed or a true terminal outcome, the physical warning resets completely. No new scene assets or render-frame geometries/materials allocated.

Source commits: [6f1b028](https://github.com/my-edutu/Ai_games/commit/6f1b028cad4295848cf3a268d65d4848a23c61af) physical response; [22b7351](https://github.com/my-edutu/Ai_games/commit/22b7351a45ee6c77d4a5892f7224a77139c00dc4) strict test; [0507aaf](https://github.com/my-edutu/Ai_games/commit/0507aaf1cfa7363ca97ea6af61a5385934fc55ad) genuine `-0` neutral-reset source bug fixed, not by changing tests.

## Real verification, exact source and dated WebGL

Initial focused [CI 41350933895](https://github.com/my-edutu/Ai_games/actions/runs/41350933895) correctly failed **1 of 46** Node checks for signed negative-zero residual recoil on a neutral state; the source fix set neutral offsets explicitly to `+0`. The exact corrected gameplay source [focused CI 41351065043](https://github.com/my-edutu/Ai_games/actions/runs/41351065043) **SUCCESS**: 46/46 node checks, real stream host, original Playwright full-resolution WebGL capture, strict native character-margin and 44px touch controls. Its [original 10-PNG + dated JSON manifest artifact 13100499184](https://github.com/my-edutu/Ai_games/actions/runs/41351065043/artifacts/13100499184) was downloaded and original SHA-256 recomputed: **10/10 matched** original source-bound image sidecars. Source commit `0507aaf1cfa7363ca97ea6af61a5385934fc55ad`; characters.js byte hash `9c921d311c163a4157ab110c8448f49f100470b364d5539cf5a11edfaa24b276`.

| Real original shot (no cropped gameplay canvas) | UTC 2026-11-01 | PNG SHA-256 | Full-size same-seed >12 RGB change vs Pass56 |
| --- | --- | --- | --- |
| Genuine tick13 1280×900 guardian | 21:16:39.960 | `2d7a205df0f648c8415107938337e386895991af141be53bb9a85d20c35a6544` | 0.7687% |
| Genuine tick13 390×844 guardian | 21:16:47.859 | `616312b6b0d773c6e678ed90cded5ea7a814f8c54d4a612a9374bd30446e2520` | 0.6289% |
| Genuine tick13 320×740 guardian | 21:16:53.196 | `fb5e4fe51c93a2e86099a2ae6e77110c7d92fea52af99fd562be0ccab9e9c885` | 0.5887% |
| Genuine tick13 844×390 guardian | 21:16:58.780 | `67c2091ce20bb0b8db118f9853d3177ca61429862629cbb3cf0b0c57112b504d` | 0.5396% |

Full original PNGs were inspected against source-identical Pass56 and the fixed official Nintendo benchmark. The changes are genuine and localized to the physical hero reaction, not a performance or quality percentage. Other six real known-key/discovered-exit/sealed-gate shots were **byte-identical in pixel values** to Pass56 as expected; the work did not touch those scenes. All true guardian viewports retain Pip and Thornback in-frame, native 320 and 390 full guardian margin, full-viewport WebGL canvas, four 44×44 touch controls and compact goal/time/keys/discovery/danger/intention/caption HUD; no text-wall regressions or relaxed thresholds. Explanations remain on-demand and public-state safe.

## Critic result / limits

**Direct unblinded lead image critique**: narrow improvement accepted — Pip visibly flinches, braces and raises both arms to an actually observed nearby warden, and remains in frame at 320px. **Overall fixed Captain Toad wins decisively**: clearer large-scale character acting, richer landmark-specific authored environments and faster readability of immediate objective/action. Native 320 still renders the two characters small despite being entirely uncropped. Original tick13 screen still has broad repetitive courts/water compared to Nintendo's compact story-led stages. This is **not** an independent critic or blind A/B; the separate shared-workspace tunnel reported `Tunnel-client has not been seen for 300 seconds`, so subagents and Ultracode could not run. Do not claim win.

Original current CI diagnostic SwiftShader CPU-limited p50 ~683ms desktop / 600ms portrait is **not** an actual hardware GPU FPS benchmark or independently established product defect. The separately tracked full monorepo CI [41351065041](https://github.com/my-edutu/Ai_games/actions/runs/41351065041) must be inspected without inferring green from focused screenshots; browser and other-game checks are independent.

**Next critic-refined smallest gaps:** source-authentic bigger, readable *Pip/Thornback acting at 320 while maintaining real native full-model bounds*; original layered encounter/world staging; real key-gate and exit micro-stories; visual evidence of each at 320/390/844/1280. No larger or invented AI actions, hidden state, lower contrast or accessibility regressions. The fixed Nintendo benchmark is NOT PASSED. **OPEN DRAFT, unmerged, undeployed.**
