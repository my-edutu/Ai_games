# Official gameplay reference evidence

Acquired and visually inspected on **2026-10-30 UTC**. These are independent publisher sources, not Game 4 output. This document records evidence and comparison limits; it does not award a win.

## Provenance and media

- ASTRO BOT source page: https://www.playstation.com/en-us/games/astro-bot/
- Luigi’s Mansion 3 source page: https://www.nintendo.com/us/store/products/luigis-mansion-3-switch/
- Downloaded original media, downloaded HTML provenance, extracted frames and contact sheets exist only under `/tmp/game4-gauntlet-references/`. They are excluded from shipped game assets.
- Media URLs below were observed literally in those official pages, then downloaded. No guessed clip timestamp or third-party capture is used.

### Actual ASTRO BOT gameplay video

Both official MP4s contain 2560 × 1440 video at 60000/1001 fps plus an audio stream (ffprobe). They are short edited website clips; frame rate metadata does not establish console or browser performance. Audio was not auditioned in this research task.

- **Spring-Loaded Run** — 17.557 seconds; local `/tmp/game4-gauntlet-references/astro-bot-dlc-03-spring-loaded-en-29oct24.mp4`. [Official MP4](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-03-spring-loaded-en-29oct24.mp4). SHA-256 `b669fb8a18c8e6ad25aae63dcf085f6a3f669687b85c542ddf08942dccdf2fd2`.
- **Rising Heat** — 17.834 seconds; local `/tmp/game4-gauntlet-references/astro-bot-dlc-05-rising-heat-en-29oct24.mp4`. [Official MP4](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4). SHA-256 `6e8fc2bfc7f44df1db3c8777f9d7b177cc0436f7cbb9cc091b2dc34dc1ff7af6`.

### Selected comparison frames

Timestamps are elapsed time from the first frame of the downloaded MP4, extracted with `ffmpeg -ss TIME -i SOURCE -frames:v 1 OUTPUT`. Frames retain the source dimensions. The image viewer may downscale previews. These are gameplay-camera/action frames, not cinematic character close-ups. Original website encoding exhibits compression blocks; do not mistake those for game material quality.

| ID | Exact local path | Source/time | What it visibly supports |
| --- | --- | --- | --- |
| A1 | `/tmp/game4-gauntlet-references/astro-bot-dlc-03-spring-loaded-en-29oct24-05s.jpg` | Spring-Loaded Run MP4, 00:05.000 | Behind-character view, small complete silhouette, equipped hands, route arrows, bright actionable foreground, water and ruins extending well beyond the path, natural props and distant landmarks. Useful for camera/action clarity, environment depth and material differentiation. |
| A2 | `/tmp/game4-gauntlet-references/astro-bot-dlc-05-rising-heat-en-29oct24-05s.jpg` | Rising Heat MP4, 00:05.000 | Player crossing dark rock above bright lava, several layers of rock and lava falls, destination platforms, animated-looking ambient actors. Useful for threat contrast, visual hierarchy and spatial staging. Motion requires the original clip. |
| A3 | `/tmp/game4-gauntlet-references/astro-bot-dlc-05-rising-heat-en-29oct24-08s.jpg` | Rising Heat MP4, 00:08.000 | Climbing pose with multiple limbs visible, metal rail against cliff, next handholds, leaf-like clumps, lava light and steep elevation. Useful for articulation, environmental surface breakup and vertical route readability. |

Supplemental official high-detail gameplay-camera stills are available locally as `Astro-Bot-key-features-screenshot-02-en-24may24.jpg` (water/garden run), `Astro-Bot-key-features-screenshot-04-en-24may24.jpg` (spring glove interaction in a glowing forest), and `Astro-Bot-key-features-screenshot-05-en-24may24.jpg` (boss action). Each URL follows the literal observed page URL `https://gmedia.playstation.com/is/image/SIEPDC/NAME?$1600px$`, with NAME equal to the filename without `.jpg`. These are publisher marketing stills showing gameplay action; prefer the timestamped MP4 frames for the main comparison. Screenshot 06 was deliberately not selected because a cinematic character close-up cannot establish gameplay presentation.

### Secondary floor identity evidence

- **L1, Luigi’s Mansion 3 Egyptian/pyramid room**: `/tmp/game4-gauntlet-references/luigi-official-5.jpg`, 1280 × 720. [Official gallery image](https://assets.nintendo.com/image/upload/q_auto/f_auto/dpr_2.0/store/software/switch/70010000001620/4ed43984dd7de804af55d407df1d96e9c91cfa318d861956d34339ab35dcf214). Third-person over-shoulder environment view with protagonist, flashlight cone, sand dunes, sculpted stepped pyramid, paired braziers/statues, central snake motif, and a dark starry ceiling/backdrop. This supports coherent floor identity through architecture, prop vocabulary, lighting and composition. It does not establish the full floor layout, other floors, pacing, animation or camera responsiveness. No HUD is present; do not claim that this isolated promotional screenshot proves live interactive capture.
- Other downloaded gallery stills remain in the temporary folder for provenance, but L1 is the selected staging reference. Returnal was not needed to fill this compact evidence set; no claim about its Tower of Sisyphus is inferred from an uninspected shot.

## Comparison procedure and constraints

1. Compare A1/A2/A3 with actual running Game 4 at a matched display size (for example 1280 × 720), preserving aspect ratio and keeping the protagonist visible. L1 is secondary support for floor identity. Do not resize only one side or substitute a cinematic screenshot.
2. Review the two MP4s alongside Game 4 moving output for complete traversal beats. In the original MP4s, look at body compression/extension, limb placement, secondary equipment motion, camera response, contact effects and the continuity of the safe route. A still cannot settle weight or motion.
3. Judge character silhouette/materials, animation/weight, environment detail/variety, camera/action readability and feedback only where the actual evidence supports them. These short publisher clips are sufficient to see presentation in motion but insufficient to establish input latency, complete UI behavior, accessibility, full campaign recovery or resource/performance stability.
4. Game 4 campaign completion, deterministic recovery, accessible controls, audio quality and performance need their own runtime/test evidence. MP4 stream metadata and a quiet reference HUD do not prove those dimensions.
5. Treat preference as a fresh critic’s judgment. No parity, console-quality, performance or overall win claim follows from acquiring this evidence.

## Concrete visual bar for the critic

The reference frames establish several inspectable expectations: a complete small articulated character readable against the scene; visually different metal, rubber/plastic, rock, foliage and water/lava; geometry and props continuing beyond the immediate platform; a clear next action despite dense surroundings; coherent themed architecture; and local lighting/contact cues anchoring the character. A Game 4 scene consisting chiefly of a clean route, repeated flat platforms and palette changes would still need evidence of comparable authored variety and environmental depth. This is a comparison criterion, not a finding about an unreviewed current build.
