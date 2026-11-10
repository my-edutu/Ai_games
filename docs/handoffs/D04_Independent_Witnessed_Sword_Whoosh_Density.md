# D04 — Independent witnessed sword attempts retain separate original air foley

**Status:** isolated source candidate; physical 3D/audio acceptance **UNVERIFIED**  
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Parent before test-first change:** `b135b5a8c26f767742589bee934fe97b3a8537b4`  
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`

## Dominant defect and causal correction

The original D04 noise foley applies one global 75ms `whoosh` cooldown. Two **independent, public, witnessed sword attempts** (e.g. Vanguard and Revenant), both admitted by the D04 rig/source/actual-frame presentation gates, can occur in one submitted frame. The second was silent even though its hand trail was individually authenticated. This is a missed *air-swing presentation*; it is **not** evidence of HP loss or contact.

A detached execution of the fetched production foley before the correction produced `[true,false,false]` for simultaneously admitted Vanguard/Revenant/Warden swing cues (desired bounded presentation `[true,true,false]`). The new foley uses a source-local short cooldown **only** when a cue matches the real planner's attempted-swing contract: `kind=swing`, `visual=trail`, `audio=whoosh`, `proof=authority-attempt-not-hit`, safe scene/tick and nonempty bounded actor ID. The D04 controller's existing real-pose and render-submission checks remain the actual permission gates: an arbitrary standalone sound cue is not equivalent to those witnesses.

Two independently witnessed swings may sound in a single 75ms window, but a third onset (including anonymous/unverified cues) is suppressed. One actor cannot double-trigger within the same window. A conservative global type cooldown remains for unverified air sounds. Successful emission alone updates the cooldowns. The per-actor map caps at 16 entries, shares the existing eight live voice limit and original mono generated noise buffer, and is cleared on mute, reset, flush and dispose. Already-implemented independent HP-loss injury polyphony is unchanged; no inferred attacker, target, hit, or additional material/audio asset exists.

## Test-first and verification evidence

- Inspected repository `AGENTS.md`, real D04 preview acceptance, the pinned BEFORE `app.js` and asset manifest, current planner/controller/render-frame gate/visual and audio production modules, prior handoffs, and the game-audio, game-feel-VFX and simulation-QA skills. The frozen baseline does not contain `original-combat-foley.js`; therefore this is a current-D04 versus current-D04 defect check, **not** a visual/audio A/B against the baseline.
- **RED (adapted real module):** first Vanguard whoosh true, concurrent independent Revenant false. No native repository run.
- **Test-first commit:** `9b4af843715d84f246c0411b50bff950b969a193` adds seven Node regression contracts: distinct actors, same actor, capped third onset, malformed/anonymous proof, expiry, mute/reset and 48-actor churn.
- **Implementation commit:** `b755305c23722fb09ddd9139dfaa7eab70e9573b` updates only `public/ai-dungeon/original-combat-foley.js`.
- **Adapted GREEN:** 16/16 exact fetched callback bodies from the new seven tests, six existing verified-injury polyphony tests and three existing phase/polyphony tests executed with the fetched production audio module and mock WebAudio in detached V8. The earlier standalone pre-fix probe failed as expected. These are **NOT native Node, CI, WebAudio rendering, or a real Dungeon 3D capture**.
- The separate local container cannot resolve GitHub DNS. No local repository worktree, installed GLBs, Playwright capture, captured original PCM or moving game footage was available to this run. No scores, sound loudness, real-time onset offsets, GLB physical contacts or image-quality claims were fabricated.

## Required native and genuine evidence

```sh
node --test tests/foundation/dungeon-d04-simultaneous-verified-swing-foley.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs \
 tests/foundation/dungeon-d04-polyphonic-noise-phase.test.cjs \
 tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

For the D04 acceptance review, record the **same authoritative run/seed/tick/checksum** from three camera viewpoints and both 1440×900 and 390×844: independent simultaneous sword misses, real HP-confirmed contact, block, dodge, projectile, spell, Warden warning/release/recovery/earned counter and restart. Capture real canvas + opt-in WebAudio bus with synchronized original WebM/PCM; explicitly distinguish waveform from delivered sync. Exercise opt-in, mute/reload, reduced motion/flash, WebGL recovery and the 20-minute density cleanup and compare with the frozen BEFORE.

## Boundary, specification review, quality review and rollback

No changes to authoritative `games/ai-dungeon/src`, characters/rigs, camera, global lighting, other sessions' branches, `main` or Draft PR #49. Normal spectator remains the default; D04 remains opt-in with `?feedback=d04`. Visual budget remains seven pools/102 reserved instances; WebAudio remains eight voices and one <=19,200-sample generated mono buffer. Audio consent, persisted mute, render acknowledgment, scene cleanup, reduced-motion/flash, IDs and bounded queues are inherited unchanged.

**Spec review:** both sounds describe independent *attempts*, never verified contact; only actual HP loss may authorize impact. **Quality review:** two concurrent noise layers may still mask other cues on a mobile speaker, and there is no browser mix/true-peak measurement; no production-quality verdict is possible. **Rollback:** revert `b755305c` and the associated tests/handoff on this D04 branch only.

**Next dominant unresolved weakness:** the visible sword ribbon measures wrist translation, not a licensed authenticated weapon-tip path. A real animated GLB and multi-view frame-aligned WebAudio capture are needed to judge blade passage and Warden strike timing honestly.
