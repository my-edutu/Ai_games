# D04 — Skipped-action release observation integrity

**Scope:** isolated branch \`feat/dungeon-d04-combat-feedback-realism-20261108\`; parent \`aa60da30180097d6e93b3369fb80f1baa65f68d0\`; comparison BEFORE \`281735d0910c6b2443648af976003d50412ee324\`. **Real-game audiovisual acceptance: NOT VERIFIED.**

## Source-level defect selected

\`planPhysicalFeedback\` allowed a change of \`actionTick\` across up to five unobserved authority ticks to create a **physical** melee streak/whoosh, ranged launch, spell release, Warden cast release, or guard gesture at the latest observed pose. A valid action timestamp proves that the authority attempted something, **not that the intervening blade, projectile or casting gesture was seen**. During dropped polling frames this replays old transients at a later world pose, and can sound as if a Warden attack occurred after its genuine release. It does not establish HP damage, but it still creates false timing and location.

## Production correction

The action-release planning loop now requires \`next.tick===previous.tick+1\` (a one-tick gap) before emitting any physical action cues. The existing actor identity and actionTick transition checks still apply. A later **new**, adjacent-tick action remains eligible; an older held action is never replayed. The event stream (including neutral anonymous block sounds), authoritative hazard warnings, and independently HP-confirmed adjacent-tick injury remain governed by their existing rules. No damage attribution is added and no simulation mechanics are changed.

This is a conservative observation-quality gate: on missed polls, some **real** attack gestures are intentionally not presented, rather than rendered at a fabricated later phase. It does not solve visual synchronization after pose animation stalls without skipped authority ticks.

## Evidence from this session

Read \`AGENTS.md\`, \`docs/handoffs/D04_Real_3D_Preview_Acceptance.md\`, frozen BEFORE SHA, source planner, existing regression contracts, and the game-audio, game-feel-vfx, simulation-qa and performance-optimization skills.

Before editing, the **actual existing planner source**, compiled in an isolated V8 test harness without a browser, produced **nine** delayed physical-action cues across 2–5 tick gaps. After the one-gate patch, the same nine cases produced no cue; **five** valid consecutive action families retained their expected cues (14 candidate cases checked). This is a **detached source-execution check, not native Node tests, renderer output, actual Warden audio, or gameplay capture**.

Native regression contract authored: \`tests/foundation/dungeon-d04-skipped-action-gesture-integrity.test.cjs\`. The code tunnel was unavailable (\`Tunnel-client has not been seen for 300 seconds\`); therefore native repository tests, build, browser/GLB inspection and real A/V captures were **not run**. No representative WebM/PCM or authentic three-viewpoint footage was obtained.

## Resources, rollout, acceptance

Only \`public/ai-dungeon/physical-feedback-plan.js\` (planner), the regression-test file and this handoff change. Existing **7 visual pools / 102 reserved instances / ≤7 draw calls**, max **8** original foley voices, one ≤19,200-sample generated noise buffer, bounded pending/receipt lists, WebAudio consent and mute, reduced motion/flash, frame acknowledgment, cleanup and legacy spectator default are untouched. D04 remains opt-in with \`?feedback=d04\`.

On an environment with full assets:

\`\`\`sh
node --test tests/foundation/dungeon-d04-skipped-action-gesture-integrity.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-d04-skipped-injury-frame-integrity.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
\`\`\`

Compare real seeded run/floor/tick/checksum BEFORE vs D04 at 1440×900 and 390×844, from three camera directions. Capture genuine missed sword, HP-confirmed impact, guard/block, dodge, arrow/spell, and Warden warning/release/recovery/earned counter/defeat/restart. Record the real opt-in FX bus PCM with canvas frames, test stalls and mute/reload and perform a 20-minute resource soak. **Reject** if genuine adjacent action cues are dropped, delayed audio no longer matches weapon passage, or browser visual readability worsens. Do not infer quality scores or Diablo-IV parity from source checks.

**Specification review:** the change affects only optional presentation, preserves action-versus-injury causality and reduces unsupported physical timing assertions. **Quality review:** conservative loss of skipped action SFX is preferred to fictional late sound; authentic footage is still necessary to assess frequency/appearance. **Rollback:** revert this cohesive D04 commit without changing main/PR #49. **Next dominant weakness:** wrist-proxy sword trails without authenticated GLB blade-tip movement, plus pending original WebAudio/canvas synchronization evidence.
