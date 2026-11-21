# Game 2 pass36 — actual glove-to-socket directional pose (2026-11-01)

**Judgment: original native and desktop captures verified; only a small geometric direction improvement. Fixed Nintendo Captain Toad bar NOT PASSED. No independent critic verdict.**

## Source-builder change

[Product/test commit `62ed607`](https://github.com/my-edutu/Ai_games/commit/62ed60716e9446156fff2af30faf859ca872622f) keeps the key parented to Pip's articulated glove and orients its physical modeled tooth toward the existing actual recessed socket on the matching carried-key, publicly disclosed closed door. A reusable world socket-index reflects only current modeled public closed-door inventory; it is invalidated on object rebuild/disposal. This changes a presentation pose only; no authoritative actor movement, inserted key, unlocked gate, invented hidden passage, AI decision, key shaft stretching, camera or new mesh. Source tests cover both model detail levels, real 3D socket matching/reversed edge, unknown/open/lost-key state, invalid targets, neutral cleanup and guardian priority.

## Original current-source evidence, not invented or relabelled

[Exact-source focused CI `41296776902`](https://github.com/my-edutu/Ai_games/actions/runs/41296776902) **SUCCEEDED**: locked install, Maze presentation tests, stream-host checks, original browser rendering and upload. [Original artifact `13079133302`](https://github.com/my-edutu/Ai_games/actions/runs/41296776902/artifacts/13079133302) contains six actually rendered PNGs; all six original SHA-256 values match their corresponding dated manifests. Dated captured images on gameplay SHA `62ed60716e9446156fff2af30faf859ca872622f`, unchanged production seed `maze-visual-reference-13`, tick **21**, still-closed `door-2`, exact matching *publicly carried* key:

| Original source frame | UTC on Nov 1, 2026 | PNG SHA-256 | Actual tooth → socket |
| --- | --- | --- | --- |
| Native 390×844 | 10:18:23.019 | `b4463aae66167f625019ea7b8ba45dee7231741a61d768ed6ba4faefce4c7aca` | **84.4031 CSS px** (tip 121.79,259.55; socket 72.16,327.82) |
| Desktop 1280×900 | 10:18:19.711 | `1d337b0360bcfb7c137988ec0f3058a954b7be4a7969cca46e5131121891d77c` | **120.0479 CSS px** (tip 350.04,339.01; socket 279.45,436.11) |

Both source-mesh measurements improved versus the verified exact previous pass35 original frame (**92.0887 → 84.4031 px native; 130.9793 → 120.0479 px desktop**). But the lower gap is **not physical contact or a perceptual quality score**. Native 390px pass35→pass36 frame comparison changes **1,071 of 329,160 RGB pixels** (0.3254%), localized around Pip and key. The right-hand upper arch is cropped, lagoon dominates and actual glove/key/socket causality is still difficult to read unaided; a mint bow appears partly obscured beside his head. The source-bound direction is valid as a geometrical attempt, **not visually accepted**; direct original Nintendo Captain Toad still outperforms the frame.

## Detached critic gate and next pieces

A true fresh-context critic/subagent and Ultracode **remain unavailable**: shared workspace `exec_command` and `agents.status` return `Tunnel-client has not been seen for 300 seconds`. The above is the lead's original-image review, not an independent blind A/B. No physical gameplay contact or visual parity has been established. The older detached critics already preferred the fixed Nintendo benchmark. The full cross-game CI [run `41296776884`](https://github.com/my-edutu/Ai_games/actions/runs/41296776884) was still executing at this evidence checkpoint; do not call it green until actually completed.

Next split: (1) show a *truthful approach* by matching Pip's real disclosed position to the closed-door socket at a legally reachable adjacent stance, rather than shifting the prop to fake insertion; independently judge key/bow/glove visibility at native mobile scale, (2) frame the disclosed upper-right arch and reduce uninformative lagoon with a legible stage-first camera without exposing hidden topology, (3) finish hero/guardian acting and scene craftsmanship. For each slice compare actual same-seed viewport screenshot against genuine previous capture and frozen Nintendo reference, reject regression and request a new detached blind A/B when available. Do not merge/deploy, treat test counts as visual quality, or mistake CPU-throttled SwiftShader for real GPU FPS.

**PR #53 DRAFT, unmerged/undeployed. Fixed visual benchmark OPEN.**
