# D04 — Authenticated HP contact readable through late submitted frames (2026-11-16)

**State: isolated D04 improvement, source-level RED/GREEN only; genuine new-head audiovisual acceptance NOT verified.** Repository: `my-edutu/Ai_games`; permitted branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Never merge main or Draft PR #49 and never edit `games/ai-dungeon/src`, rigs, camera, global lighting or another session branch. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

## Dominant observable defect and limited ownership

[Earlier genuine D04 Chrome run 43935703801](https://github.com/my-edutu/Ai_games/actions/runs/43935703801) confirmed three frame-acknowledged, timely HP damage receipts but rejected full acceptance. Two real fatal-hit receipts at tick 38 recorded approximately **373ms** observation-to-submission and **NO_DRAWABLE_HP_EFFECT**. The same run captured three authentic viewpoints at desktop 1440×900 and mobile 390×844, matched five public HP-loss ticks, and still produced **zero shared ticks with proven drawable injury across all six**. Original WebM/Opus and sound-start receipts do not establish PCM onset synchronization. Measured renderer phases also ran into multiple seconds with D04 visual work often negligible; this patch does **not** claim to repair or explain renderer stalls.

Within D04's owned retained visual implementation, short canonical HP injuries were alive for only 380ms and the last tail faded rapidly. In the actual pre-change production module, a strict ordinary injury at a simulated 373ms WebGL advance had outer chip scale **0.176**, while a fatal injury had scale **0.195**; by 391ms neither survived. Those are **isolated source/mock readings, not decoded on-screen pixels**. A real receipt within the unchanged 400ms sound deadline could therefore have effectively invisible visual geometry even if the GPU submitted it.

## Test-first correction

Commits:
- [704ba339](https://github.com/my-edutu/Ai_games/commit/704ba3396d25bb5baf295dc68fd690af0596935e) introduced regression cases at 373ms/391ms and 400ms.
- [178b315](https://github.com/my-edutu/Ai_games/commit/178b3153a5554de80477722cbdc04117c1db94fb) aligned subsequent 18ms/9ms animation delta with measured wall-clock delta.
- [e38296c](https://github.com/my-edutu/Ai_games/commit/e38296c4b2bc719798e04ffdaaacc73ccc5bd8e8) updated the prior 386ms expiry assertion consistently with the new intended boundary.
- [c98b23f](https://github.com/my-edutu/Ai_games/commit/c98b23fc5d8f1b7797611e7793880c7c5d42b0fd) changed **only** `public/ai-dungeon/physical-feedback-visuals.js`: strict, authenticated HP injuries with a short requested life now retain their drawn instances for at least 398ms, with a gentler monotonic tail; original longer bounded recipes retain their preexisting upper life. Non-HP effects, standalone preview auditions, reduced-motion, reduced-flash opacity and original WebAudio are unchanged.

The old/new actual module ran in isolated V8 against the existing test's retained Three.js doubles and a stubbed canonical-fingerprint gate. The identical ordinary/fatal receipts changed as follows:

| Mocked effect | Before 373ms outer scale | Corrected 373ms | Before 391ms | Corrected 391ms | 400ms |
|---|---:|---:|---|---:|---|
| Verified ordinary HP loss | 0.176 | 0.464 | expired | 0.325 | retired |
| Verified fatal HP loss | 0.195 | 0.516 | expired | 0.361 | retired |

The strict source mock never increased the retained **102-instance** budget. A nonstrict preview and reduced-motion alternative still expired before 373ms. **These mock-derived numbers are not visual-perception scores, GPU proof, encoded video proof or audio-to-contact synchronization.** The native regression invokes the actual canonical validator; its final CI result must be checked separately.

The dedicated [D04 isolated workflow](https://github.com/my-edutu/Ai_games/actions/workflows/dungeon-d04-foley-identity.yml) runs exact-head native contracts/build and genuine Chromium smoke, preserving the strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` failure gate. Earlier test-only push workflows were canceled by superseding commits, so do not report a CI-confirmed RED or latest-head GREEN until the workflow finishes.

## Invariant and quality reviews

- **Causality:** only canonical, same-tick, unique public victim HP loss gets fragments. A swing, arrow release or cast never proves a hit; no attacker is inferred. No authority mutation, camera, rig, lighting or `games/ai-dungeon/src` edit.
- **Budgets:** seven retained GPU pools, 102 reserved instances, max seven D04 draw calls, no extra material/buffer/light, no additional WebAudio voice or generated noise. Existing 8-voice limit, 32 pending effects/audio-awaiting-frame, 64 receipts, bounded deduplication and disposal preserved.
- **Clock and accessibility:** 400ms original sound scheduling deadline unchanged and independently submission-gated. No stale audio replay, automatic opt-in, mute override or WebAudio recipe change. Reduced-motion and reduced-flash settings remain in their existing restrained mode; the brighter late scale applies only to strict visible HP evidence.
- **Risk:** keeping an already admitted small group of body-local chips readable slightly longer can modestly increase overlap at dense combat. The same retained caps and latest 400ms deadline prevent unlimited accumulation. A 398ms short chip is not evidence that its pixel was actually visible; a multi-second renderer stall still expires it.
- **Security and recovery:** read-only presentation; no external assets, borrowed sounds, data export, timer, listener or new resource lifecycle. Existing reset/recovery remain untouched. Roll back only this isolated D04 production commit if same-seed capture shows excessive clutter or a regression.

## Outstanding acceptance — must remain FAILED/UNVERIFIED until observed

1. Latest-head native suite and production build, then actual browser six matched recordings: cinematic/tactical/chase, desktop and 390px mobile, verified by seed/run/floor/tick/checksum.
2. Moving, independently decoded real contact pixels on the verified victim, including late 373ms receipts, without weakening the 400ms frame/audio deadline; inspect common-clock timing against separately decoded original PCM/WAV.
3. A real missed swing (whoosh only), real block, dodge, guided arrow, spell, interrupt, uncertain-actor HP loss and two simultaneous threats, with no fictitious impact.
4. Entire Warden warning/release/recovery/**earned** counter, defeat, reset and real warning cleanup; consent/mute/reload, accessibility modes, WebGL loss/restoration, foreground/background and 20-minute cleanup soak.
5. Independent blind comparison with frozen `281735d0910c6b2443648af976003d50412ee324`. No Diablo-IV parity, production readiness or full physical combat transformation claim.

**Next dominant weakness:** multi-second WebGL frame submission in the separately owned renderer, and no verified injury pixels/PCM-onset correlation across six viewpoints. Escalate renderer traces to its owner rather than changing protected renderer source or drawing a delayed fake hit.
