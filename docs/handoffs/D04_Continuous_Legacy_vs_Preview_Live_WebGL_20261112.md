# D04 — Continuous real-authority legacy-versus-preview comparison

Date: 12 November 2026
Status: DIAGNOSTIC / REAL AUDIOVISUAL ACCEPTANCE STILL OPEN
Branch: feat/dungeon-d04-combat-feedback-realism-20261108
Frozen BEFORE: 281735d0910c6b2443648af976003d50412ee324
Starting head: 856b9f75433a6b546929a4f20c6de16389c45d76

## Dominant evidence defect

A previous authentic D04 HP-loss tick reached WebGL submission after 1,994 ms, including 1,680 ms in renderer.render, and correctly failed the unchanged 400ms audio deadline. Continuous D04 capture-on/off browser evidence later observed 1,505ms desktop / 1,697ms mobile worst render calls with recording off. A previous legacy-versus-D04 comparison used staged states, not a continuously advancing authority clock.

The unproven hypothesis is whether D04-owned GPU effects or shader warmup contribute to stalls under *continuous* playback. This must be measured before claiming a D04 production optimization would help.

## Isolated implementation

- tests/browser/dungeon-d04-continuous-mode-pair.cjs: read-only comparator requiring identical real public seed/run/floor/tick/checksum, tactical camera, focused actor, camera position/aim, viewport, software WebGL and exact pixel-ratio/shadow budget. Mismatches are excluded; all-observed worst render calls remain reported. Repeated valid states retain the slower timing, never the favorable sample.
- tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs: eight test-first cases covering valid pairing, >1s stalls, forged checksums, camera/raster drift, legacy accidentally running D04, capture contamination, absent sound consent, resource budget breaches and fabricated attacker attribution.
- tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs: reuses genuinely seeded DungeonRuntime.step() states with independent Node 250ms authority cadence, checks real Chrome Three.js at /dungeon (legacy) against /dungeon?feedback=d04, both capture off and genuinely opted into sound. It records frame/tick, direct-render time, raster budget, source-specific visual receipts and separate desktop 1440x900/mobile 390x844 screenshots. The original capture-on/off comparison remains.
- .github/workflows/dungeon-d04-foley-identity.yml: registers only D04-owned native and genuine Chrome verification.

The eight new Node tests failed first while the comparator was absent, then passed locally under Node 22 after implementation. The initial CI contract/build job for candidate a9dc6c3 had passed; browser execution was still running at documentation time. Do not claim Chrome acceptance until the completed workflow is inspected.

## Truth, performance and safety

No production game code, gameplay authority, animations, rigs, camera, lighting, global workflow, main or Draft PR #49 was changed. Legacy remains default; D04 remains opt-in.

A swing is never a hit. The comparator's optional injury receipt requires exact anonymous victim-specific HP-loss scene/tick/ID, submitted frame and a non-stale <=400ms observation-to-submission span. Neither later effects nor a text-inferred attacker can certify that injury.

No MediaRecorder starts in the new mode comparison, deliberately separating recorder cost. Both real UI sound buttons are clicked. No samples are decoded or synchronized. Any output keeps causedByD04=null, sampleSynchronized=false, impactAVAccepted=false. Serial software-WebGL runs do not share frame clocks or eliminate shader warmup/scheduling confounds.

For matched D04 frames, the comparator checks <=7 VFX draw calls and <=104 reserved instances. It leaves unchanged the 8-voice and 19,200-sample audio limits, 32/32/64 queue budgets, mute preference, reduced motion/flash and cleanup. Pixel-budget, view, checksum and damage-stage mismatches are excluded rather than falsified.

## Reproduce

    node --test tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs
    node --check tests/browser/dungeon-d04-continuous-mode-pair.cjs
    node --check tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs
    npm ci && npm run build && npm run dungeon:assets:strict
    D04_BROWSER_CHANNEL=chrome DUNGEON_REQUIRE_MODELS=1 npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs dungeon-d04-real-live-authority-capture-pair.spec.cjs

Artifacts include dungeon-d04-continuous-legacy-preview-evidence.json and real-mode screenshots with desktop1440/mobile390 plus -legacy/-d04 suffixes. Previous genuine WebM evidence is separate and still unaligned.

Specification review: source is read-only, all injury attribution stays anonymous, no legacy presentation change, no weakening the frame gate. Quality review: insufficient comparable ticks are an honest diagnostic; software-WebGL and dynamic pixel downshift prevent causal attribution; screenshots do not establish smooth motion or audible onset.

Rollback: revert the D04-only comparator, native test, same-file browser extension, workflow hook and this document.

## Still outstanding

Timely original impact receipts in live playback, complete Warden warning/release/recovery/counter, authenticated miss/block/dodge/projectile/spell A/V, 3 moving viewpoints with matched desktop/390px BEFORE/AFTER, measured blade-tip contact, decoded sound onset and 20-minute resource soak. No claim of physical-realism transformation or Diablo-IV parity.
