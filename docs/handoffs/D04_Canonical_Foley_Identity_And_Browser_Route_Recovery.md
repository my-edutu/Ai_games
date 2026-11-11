# D04 — Canonical original foley event identity and real-browser route recovery

Status: **SOURCE-LEVEL FIX + NATIVE 28/28 NODE CHECKS VERIFIED; AUTHENTIC DUNGEON A/V NOT YET ACCEPTED.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting head inspected:
`2dc09f66bbfe5a744f88c1e58f4fccfa3be92f8f`. Frozen comparison:
`281735d0910c6b2443648af976003d50412ee324`.
Default spectator stays legacy; experiment requires `?feedback=d04`. Never merge into main or Draft PR #49 without final acceptance.

## Dominant audio integrity defect

Previously, strict production WebAudio checked `verified:true`, public-action / observed-victim proof,
and nonempty `cue.id` but **not that the ID belonged to the event presented**.
A retry could reuse the ID of another actor, victim, tick, event kind or run:
that mislabeled transient could sound if density/cooldown permitted.
The 128-entry accepted-ID cache alone did not prevent a *new* forged alias.

`isCanonicalVerifiedCombatFoleyCue` now checks bounded canonical run/floor, safe tick,
existing swing or victim-only HP-drop semantic proof, and the exact immutable
`scene:tick:kind:actor-or-'-':victim-or-'-'` identity emitted by the public D04 planner.
It runs only for whoosh/impact/fatal-impact on `requireVerifiedContact:true`;
generic standalone procedural sound auditions remain unchanged.
An invalid cue is dropped before any WebAudio source/node creation or density admission.
This guard tests **internal semantic coherence**, not independent proof of a hit:
only the public-snapshot planner may create independently observed HP injury.
No attacker is inferred for HP loss. An air whoosh is never contact.

## Red/green provenance

- Test-first commit: `f100d5d04f9c94af83850720ec099e70428916b0`,
  five `node:test` contracts covering mismatched attack, victim, scene, tick, kind,
  legitimate same-frame actors and standalone auditions.
- Production correction `a3d05d8c5b9bb343ddb87110ee2d12afe8f30126`
  followed by regex escape correction `b0b3cffa6af8c32ece0e22e118412405a9d77d08`.
- Preexisting fatal-impact test fixture falsely used `damage` for an actual
  `damage-fatal` kind; corrected on the isolated branch in
  `90af3a79abc5da87a4080343f6bf7d498e08975c`.
- Native GitHub Actions (Node 22, Ubuntu 24.04) run
  [42957658148](https://github.com/my-edutu/Ai_games/actions/runs/42957658148):
  **28/28 targeted foundation tests passed**, JavaScript syntax passed and
  `npm run build` passed. Five newly added contracts are included.
  Local native red execution was unavailable because the coding tunnel returned
  `Tunnel-client has not been seen for 300 seconds`; do not claim a measured red run.

## Actual browser evidence: failure found, not a visual pass

That same GitHub Actions run downloaded and SHA-verified all manifest CC0 model assets
and installed Chromium successfully. The genuine D04 Playwright preview nevertheless
**FAILED** during module startup: its trace shows HTTP 404 for
`/dungeon/warden-warning-lifecycle.js`, leaving
`window.__DUNGEON_RENDER_DIAGNOSTICS__?.physicalFeedback` undefined for 90 seconds.
The uploaded artifact has a Playwright video/trace/error-context showing the
visible **“THE 3D EXPEDITION IS NOT READY”** watchdog fallback.
This is a real integration failure, **not** a successful combat clip.

- Evidence run:
  https://github.com/my-edutu/Ai_games/actions/runs/42957658148
- Failure artifact:
  https://github.com/my-edutu/Ai_games/actions/runs/42957658148/artifacts/13827717826
- Test-first endpoint contract: `08ceb6ea695d8ae1e22db8ac144cf947078240ba`.
- Isolated stream allowlist repair: `5f5816cf1f9233a41f50f2e683f43ea3e2f09f55`
  in `scripts/serve-dungeon-stream.cjs`. No other routes, authority or rigs changed.
- D04-only CI workflow path watch updated: `7abc2ff2a48e57defe033258e32a8f78172cc766`.
  This starts a fresh browser acceptance attempt at the repaired head.
  **Do not label that attempt as passed until its actual workflow finishes successfully.**

## Resources, compatibility and unresolved review

There are no newly allocated buffers, audio voices, instanced meshes, GPU pools,
scene lights, or gameplay events. Previously declared maxima remain 8 original
WebAudio voices, 13,440 noise samples, 7 visual pools / 102 reserved instances,
32 pending, 32 awaiting frame and 64 receipts; measured browser stress caps
are still pending. Audio opt-in, persistent manual mute, reduced-motion/flash,
clocked receipt, density eviction and cleanup remain unchanged.

Specification review: malformed/mismatched ID cannot synthesize swing or injury;
the renderer must present true snapshot provenance. Engineering review:
strict canonical IDs are defense in depth, but synthetic test fixtures must
match the planner, and browser startup failure prevents any claim of audiovisual
quality. No independent actor-ID authorizer was added.

Remaining **UNVERIFIED**: three real moving-camera viewpoints at 1440x900
and 390x844; matched BEFORE/AFTER video+captured original PCM; Warden
warning/release/recovery/earned counter; miss, block, dodge, arrow, spell and
actual HP-confirmed impact with sample-aligned timing; and the 20-minute
device/stall/resource soak. A Playwright video track by itself is not recorded
original WebAudio, and an uploaded trace of a watchdog fallback is not proof
of successful rendering.

Next dominant weakness after startup and real-game verification:
the trail still follows the GLB *wrist* rather than actual blade-tip
geometry. Do not fabricate blade-tip measurement while genuine mounted sword
and animation data are unavailable in a local coding environment.

### Reproduction (isolated branch only)

```sh
npm ci
node --test tests/foundation/dungeon-d04-original-foley-cue-identity.test.cjs \
 tests/foundation/dungeon-d04-strict-original-foley-provenance.test.cjs \
 tests/foundation/dungeon-d04-foley-cue-idempotency.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-impact-foley.test.cjs \
 tests/foundation/dungeon-d04-simultaneous-verified-swing-foley.test.cjs
npm run build
npm run dungeon:assets:strict
npx playwright install --with-deps chromium
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Rollout: **opt-in only**. Rollback: revert solely D04 branch's relevant commits.
