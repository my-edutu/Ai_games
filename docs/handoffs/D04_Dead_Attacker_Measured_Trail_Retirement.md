# D04 — Posthumous measured-sword trail retirement

**Status:** source-level candidate only; physical 3D audiovisual acceptance remains **UNVERIFIED**.
**Scope:** isolated `feat/dungeon-d04-combat-feedback-realism-20261108` only.
**Parent head inspected:** `2cd2e232f7ab8f1606c573ce1a149a5b3b398826`.
**Frozen comparison:** `281735d0910c6b2443648af976003d50412ee324`.
**Requirement:** `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, truthful swing/no false physical action, retained pool cleanup and submitted-frame audio.

## Observed source-level defect

A still-posed authored Vanguard with `action='attack'` and matching `actionTick` but `hp=0` could start a fresh trail. An already-measured trail could keep following a dead actor's animated wrist, remain drawable and qualify its queued whoosh for a later frame receipt. No authenticated living attack remained. This is a **simulated production-source reproduction**, not a finding from a genuine WebGL recording.

## Correction

- `public/ai-dungeon/physical-feedback-visuals.js`: refuse new measured melee trails once the same actor's observed HP is zero; when a retained trail loses its valid hand because that actor is dead, retire its GPU slot immediately and hide its old matrix. Missing/hot-swapped rigs are still temporarily hidden, not falsely classified as death. Added cumulative `retiredDeadTrails` resource accounting.
- `tests/foundation/dungeon-d04-dead-attacker-melee-trail.test.cjs`: four regression contracts, including creation rejection, in-flight death and pool retirement, independent HP-loss effect, and actual D04 controller frame-receipt refusal for a posthumous whoosh. These use original production imports with a simulated Three.js adapter; they do **not** render authentic character GLBs.

The authoritative rules, HP, attacking actor assignment, weapon rig, camera, global lighting, master soundstage and normal spectator are untouched. D04 remains opt-in through `?feedback=d04`.

## Test-first evidence / limits

1. The first test commit preceded the production fix. A detached V8 execution of the actual pre-fix renderer reproduced three violations: dead attack emitted a trail; dead animation kept its ribbon drawable; dead animation retained the slot.
2. After the production correction, the four committed regression callbacks ran **4/4 green** in a detached V8 adapter executing fetched current production renderer, cue planner, frame gate and controller bodies. The independent HP-loss case continued to generate legitimate victim fragments.
3. Source-backed integration submitted the real controller frame receipt after the actor changed from living measured swing to zero HP: `whoosh` sounds = **0**, receipt decision = `expired-visual`, dead-trail retirements = **1**.
4. The adapted retained renderer reported seven pools and 102 reserved instances. No new effect pool, draw call, buffer, voice, sample, sound file or authority mutation was added.
5. **Not executed:** native `node --test`, `npm ci`, build, Playwright, real GLB WebGL/WebAudio playback, 1440x900 and 390x844 matched three-viewpoint recordings, PCM/WebM comparison or 20-minute density/cleanup soak. The coding tunnel reported `Tunnel-client has not been seen for 300 seconds`; the separate working container could not resolve GitHub. GitHub Actions passing results were not established.

## Review, rollout and next investigation

The correction is bounded to **observed death**. An unavailable or invalid rig never implies that the actor has died. A real HP-loss reaction still requires its separate consecutive authority evidence; a swing still does not certify damage. Existing opt-in, muted preference, reduced motion/flash, scene reset, deduplication and receipt controls were not changed.

**Specification review:** source-level death attribution and pool cleanup are improved without modifying authority or introducing guessed contact. **Quality review:** simulation proves cue gating but cannot establish physical sword-tip location or proper audible onset. Do not adopt D04 as default, merge into main, or claim Diablo-IV-level realism.

**Next dominant weakness:** the observed skinned wrist is not a verified blade tip or bowstring/staff release socket; Warden release acoustics and a real miss/block/dodge/contact sequence require authentic multi-view animated GLB capture with the actual opt-in WebAudio bus.

**Retest when the coding tunnel reconnects:**

```sh
npm ci
node --test tests/foundation/dungeon-d04-dead-attacker-melee-trail.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then compare the same authoritative seed/run/floor/tick/checksum against frozen BEFORE, record three camera viewpoints at desktop and 390px mobile, prove source audio and rendered frames together, and complete the 20-minute bounded-resource soak. Failure to obtain these outputs remains a blocker, not a pass.
