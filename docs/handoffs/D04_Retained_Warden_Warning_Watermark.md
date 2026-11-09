# D04 — Retained Warden danger-window chronology

**Status: isolated source-level correction for review; native suite, WebGL/WebAudio, genuine gameplay captures and acceptance UNVERIFIED.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`  
Parent inspected: `a9e47a06dcb5b6e6f9124af20387b261797afb4b`  
Frozen BEFORE milestone: `281735d0910c6b2443648af976003d50412ee324`.

## Dominant source-identified defect

The existing out-of-order tell guard compared incoming warnings only against **currently occupied** eight-slot signal markers. When a newer 300ms warning expired, its chronological evidence vanished. A delayed older warning could then appear as a fresh floor hazard. Likewise, after a genuine release glyph expired, a late warning for the **already released** strike could reappear. No real-game clip established frequency; the defect was reproduced in a detached committed-source JS harness.

## Correction and boundaries

- Keep at most **eight** scene/actor-keyed history records storing the last accepted real warning and latest genuine release; no new GPU pools, audio nodes, draws, timers, or authored assets.
- Reject a warning older than the last accepted Warden tell even after its VFX expired; reject warning attack ticks at or before an already witnessed **same-owner** release.
- Protect later attack windows and other owner/scene identities. Historical records never generate visual or sound cues, affect HP, or identify an attacker.
- Only remember an actually allocated danger marker or a verified public Warden release. Clear history on reset, disposal and floor/run changes.
- New `warningHistoryOwners` telemetry makes the memory bound observable. Existing `staleWarningCues` reflects discarded late warnings.

Changes confined to `public/ai-dungeon/warden-warning-lifecycle.js`, `public/ai-dungeon/physical-feedback-visuals.js`, focused tests, and this handoff. No authoritative `games/ai-dungeon/src`, rigs, camera, global lighting, default spectator, other branch, or default foley behavior changed. D04 stays behind `?feedback=d04`.

## Test-first / evidence

Detached source evaluation against the old production modules confirmed **two expected red outcomes**: expired-newer warning permitted older ghost, and expired release permitted spent ghost. Identical detached scenarios passed after the correction (**five of five** checks). This proves source-policy logic in an isolated evaluator, **not** native repository or browser integration.

Run when branch worktree and assets are available:

```sh
node --test tests/foundation/dungeon-d04-warden-warning-watermark.test.cjs tests/foundation/dungeon-d04-warden-warning-order.test.cjs tests/foundation/dungeon-d04-warden-warning-cells.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then collect matched authentic BEFORE and D04 WebM plus captured PCM at 1440×900 and 390×844 from three viewpoints. Verify real miss, HP-confirmed hit, block, dodge, arrow, spell, interrupted action, Warden warning/release/recovery/counter, ambiguous simultaneous threats, mute/opt-in and a 20-minute resource/cleanup soak. No authentic capture, waveform timing, GPU count or CI pass is claimed for this change.

## Review

Specification review: same scene and actor, bounded history, only authentic release and warning records, future threats preserved, run/floor reset, no fabricated HP/contact. Quality review: potential loss of older history after >8 distinct scene/actor records is an intentional budget tradeoff, and unexpected source tick ordering must be inspected in real footage. Roll back this isolated commit if real trial semantics disagree. D04 is **NOT ACCEPTED** as fully realistic; weapon-tip geometry and synchronized genuine playback remain critical blockers.
