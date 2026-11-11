# D04 — Source-Provenance Gate on Original Production Foley

Status: **isolated D04 source improvement; authentic Dungeon audiovisual acceptance UNVERIFIED**  
Owner: Session 4 — physical feedback / original sound only  
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`  
Inspected parent: `fe64ba68d54584882406a43b430c70cbd0a2d33f`  
Pinned BEFORE: `281735d0910c6b2443648af976003d50412ee324`  
Review gate: `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`

## Selected defect

The original foley synthesizer could play a `whoosh` using a cue with an incorrect public-action proof, or an `impact`/`fatal-impact` from an allegedly damaged victim paired with an invented attacker ID. Its `verifiedSwingFoleyActor` and `verifiedDamageFoleyVictim` checks controlled **polyphonic cooldown classification** only; they were not sound-admission gates. A direct engine call using an unverified cue could produce apparently causal physical audio. This was reproduced against the inspected source in an isolated V8 evaluation: two invalid cues each returned true and two voices appeared. This is a **reproducible source-level contract defect**, not recorded real-game A/V misbehavior.

## Test-first change

- `tests/foundation/dungeon-d04-strict-original-foley-provenance.test.cjs` adds four independently reviewable `node:test` cases. It tests malformed or anonymous sword actions, invented/misattributed HP impacts, valid distinct public swing/HP-loss witnesses, rejected-onset budget conservation, mute/re-enable cleanup, Warden release preservation and backward-compatible standalone audio audition.
- `public/ai-dungeon/original-combat-foley.js` adds `requireVerifiedContact` (default false). In this mode, original `whoosh` needs `verified===true` and a valid public sword-attempt contract; `impact` and `fatal-impact` need `verified===true` and a victim-only observed HP drop. Invalid contact cues make **no AudioNodes**, consume **no onset window**, and are counted as dropped. This is defense in depth in the owned sound synthesizer; the renderer still controls frame submission and scene authorization.
- `public/ai-dungeon/physical-combat-feedback.js` enables strict contact admission for **both** the initial owned original engine and the reconstructed engine after context/FX-output rebinding. External injected audio adapters retain their published contract and require independent integration review; unverified arbitrary recipes outside these three contact types are not claimed globally safe.

The historical generic synth audition surface remains opt-out/default in the standalone API so the older offline audio simulations still work. The **production D04 controller** opts into strict admission. No new sample, borrowed music, actor claim, authoritative mutation, frame timer, GPU effect or WebAudio node is introduced.

## Verification actually performed

1. Read `AGENTS.md`, D04 acceptance, pinned frozen commit metadata, current source and relevant specialty guides (game audio, game-feel VFX, physics, QA, performance), and inspected tracked model/clip availability.
2. Confirmed latest D04 branch head `fe64ba6` at start; created a **test-first** commit. Before production change, detached V8 evaluation of the real synthesizer with `requireVerifiedContact:true` still played both malformed sword and invented-attacker injury cues.
3. After the production fix, evaluated the fetched actual synth source in detached V8: **10/10** focused admission probes passed.
4. Executed the exact **four committed new test bodies** in a source-backed **adapted V8 harness**: **4/4 passed**.
5. Adapted existing original-foley suites (simultaneous witnessed swords, simultaneous witnessed victims, long noise tail): **16/16 passed**. Combined adapted count: **20/20**. These are not native Node tests.
6. Coding tunnel invocation returned `Tunnel-client has not been seen for 300 seconds`. The independent container has Node but cannot resolve `github.com` by DNS. GitHub connector provided source reads, branch-only commits and comparisons.
7. There were **no available tracked Dungeon .glb/.webm/.wav assets** in the inspected `public/ai-dungeon/models` tree (only `.gitignore`). The asset manifest lists licensed external sources but does not supply directly runnable tracked GLBs.

**NOT VERIFIED:** native `node --test`, `npm ci`, build, Playwright, genuine Dungeon WebGL drawing, browser opt-in WebAudio output, original PCM, synchronized frame-vs-sample latency, actual D04 gameplay quality, three viewpoints, desktop/390px mobile, Warden warning/release/recovery/earned counter, missed swing, block, dodge, arrow, spell, confirmed injury, ambiguous overlapping hits, WebGL recovery, low-end stall and 20-minute effect-density soak.

### Required reproduction on a connected worktree

```sh
npm ci
node --test tests/foundation/dungeon-d04-strict-original-foley-provenance.test.cjs \
  tests/foundation/dungeon-d04-simultaneous-verified-swing-foley.test.cjs \
  tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs \
  tests/foundation/dungeon-d04-foley-noise-tail.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
npm run dungeon:stream
```

Open the unchanged spectator at `/dungeon` and the isolated preview at `/dungeon?feedback=d04`; capture actual canvas video and opted-in original FX-bus audio for the **same** seed/run/floor/tick/checksum, three viewpoints, 1440×900 and 390×844. Compare frame onset and extracted PCM; do not treat simulated node scheduling or WAV-only audition as genuine synchronized playback.

## Independent review and limits

**Specification:** a sword attempt does not prove impact; only a victim-only observed HP decrease authorizes physical injury audio in the owned original sound engine. Unknown attackers are never filled in. Maintains manual gesture opt-in, persisted mute, reduced-motion/flash and rendered-frame acknowledgment.

**Quality:** strict rejection is constant-time and happens before node scheduling; rejected events cannot occupy the eight-voice pool or two-onset density windows. Resource limits remain at seven GPU effect pools, 102 instances, no more than seven effect draw calls and eight live original foley voices **by source contract**, not by WebGL/performance telemetry. These changes do not improve the visible blade trajectory or prove sound quality.

**Scope:** only D04-owned production sound/controller, foundation tests and this handoff. No main, Draft PR #49, `games/ai-dungeon/src`, rigs, animation controllers, environment, camera or global lighting modifications. Legacy `/dungeon` remains default; D04 only `?feedback=d04`. No merge/deploy. Rollback by reverting the isolated production commits (and targeted contracts) on this branch.

## Next dominant weakness

The visual ribbon remains an **authenticated skinned wrist proxy**, not verified actual GLB sword-tip travel. The full material/animation experience cannot be accepted until licensed model assets can run in the actual spectator, with matched three-angle recordings and original sound-bus capture. Separately, external injected sound adapters need equivalent contact proof at final D10 integration, without pretending that a successful foley-only unit test is actual hearing evidence.
