# D04 — Strict measured-sword presentation receipt

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Inspected parent:** `29de6f9a998602f0cc21539c674a353fcf4f6f2d`  
**Pinned BEFORE:** `281735d0910c6b2443648af976003d50412ee324`  
**Acceptance:** **IN PROGRESS — genuine Dungeon A/V UNVERIFIED**

## Defect and scope

The last D04 gate correctly rejected `visualAccepted:false` for a sword
and held a specifically reported hidden ribbon. But a visual adapter could
return `visualAccepted:true` while omitting `hasDrawableCue`, omitting
`hasLiveCue`, or reporting an unknown state. Both nullable reports then
fell through to `deliver`. A frame receipt was not proof of actual
measured hand passage, so this was an audible sword without reliable
drawn-weapon evidence.

For a normal-motion `requiresMeasuredBlade` cue, the pure D04 frame
gate now requires **affirmative true** for both retained-cue liveness
and individually drawable measured path, after real frame acknowledgment.
Absent verification yields the bounded terminal receipt
`unverified-blade-visual`, not a sound. An alive but explicitly
non-drawable trail remains `await-drawable-visual` until either a
genuine drawable submission or the original deadline/expiry.

Non-blade sounds remain backward-compatible: actual victim-only
HP loss, neutral block events, deliberate reduced-motion
sound-only alternatives, and other verified cues do not require a wrist
mesh. There is no new WebAudio node, GPU pool, allocation in the
render loop, or gameplay/rig/camera/lighting change.

## Test-first evidence

- Inspected `AGENTS.md`, D04 acceptance and pinned BEFORE commit
  `281735d`, current physical planner, controller, visuals, measured
  wrist module, original foley, existing timing tests, plus game-audio,
  game-feel-vfx, simulation-QA, and performance-optimization skills.
- On a standalone copy of the **exact inspected pure gate** under Node
  v22, two focused probes failed as expected: unknown drawable and
  unknown live evidence both returned `deliver`. Baseline **5/7**.
- Replaced only the strict sword-proof predicate in that local copy;
  **7/7** focused pure-gate checks passed. The seven new repository
  `node:test` contracts include injected controller adapters,
  genuine liveness+drawable acknowledgment, injury, reduced-motion,
  mute and reset. Their native execution remains **UNVERIFIED**.
- The coding tunnel returned `Tunnel-client has not been seen for
  300 seconds`; the disconnected local container could not reach GitHub
  by DNS. The GitHub connector was used for an isolated branch commit.
- The tracked branch tree had no Dungeon `.glb`, `.webm` or
  `.wav` assets. No authentic Three.js/gameplay/audio capture was
  possible. Standalone pure-gate assertions are **not** actual
  WebGL submission or audible PCM synchronization tests.

## Reproduction and acceptance

```sh
node --test tests/foundation/dungeon-d04-strict-blade-submission.test.cjs \
 tests/foundation/dungeon-d04-unmeasured-swing-audio-truth.test.cjs \
 tests/foundation/dungeon-d04-visual-audio-submission.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Three camera viewpoints, 1440×900 desktop and 390×844 mobile, the
full Warden warning/release/recovery/earned counter, missed swing,
block, dodge, projectile, spell, real HP impact and 20-minute density
and cleanup soak remain **UNVERIFIED**. The branch is still opt-in via
`?feedback=d04`; normal spectator stays default. Preserve the seven
visual pools/102 instances, eight voices, 32 pending/32 awaiting/64
receipts, user-gesture opt-in, persisted mute, reduced settings and
frame acknowledgment. Do not merge main/PR #49.

**Specification review:** missing a measurement cannot claim a
physical sword passage; authority, damage and attacker identity remain
unchanged. **Quality review:** adapters lacking the required proof
become silent in normal motion, deliberately conservative until valid
rig telemetry; genuine moving footage must confirm perceptual merit.
**Rollback:** revert this commit on isolated D04 branch only.
**Next weakness:** physical trail still measures a rig wrist, not a
verified blade tip; no real A/V/GLB evidence is yet available.
