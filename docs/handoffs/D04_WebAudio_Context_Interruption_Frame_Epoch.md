# D04 — Prevent WebAudio background/resume from replaying obsolete combat sounds

**Status: isolated source-level correction; full Dungeon A/V acceptance UNVERIFIED.**
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Starting observed head: `bfb9a72a3bc2f07aadc3c34b1b40a2a9f552a420`.
Permanent frozen Gauntlet BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

## Dominant observable defect

The D04 controller already tracked consent epochs around explicit mute and click. However, it did not observe `AudioContext.statechange`. A browser may suspend its audio clock after a sword cue is staged but before the WebGL receipt, or after WebAudio sources have been scheduled. A subsequent context resume could permit an obsolete queued event to sound against a newer visual frame. Without browser clips this was established as a **source-level event-lifecycle defect**, not as a proven field incidence rate.

A detached execution of the old production coordinator reproduced: no statechange observer, one old whoosh after simulated suspend/resume, and no cancellation of the old audio queue. This was an adapted V8 harness with synthetic visual and audio adapters, **not WebAudio or gameplay footage**.

## Implemented correction and contracts

- Subscribe to the existing D04 AudioContext's `statechange` when the context exposes the normal EventTarget API. Attach once and remove on controller dispose; dynamic `attachAudioContext` remains supported.
- On first transition away from `running` during an already user-authorized session, advance the audio cue epoch, clear the `awaitingPresentation` queue and flush any previously scheduled D04 foley voices. Queued presentation effects remain visual-only if their sound was planned in the old epoch.
- Treat repeated `interrupted`/`suspended` signals within one non-running interval idempotently. Clear the state-latch only when the context returns to `running`.
- **Do not silently set persisted manual mute or switch off the spectator sound toggle.** The same AudioContext belongs to the legacy ambient soundstage and UI. The user’s prior explicit opt-in remains valid for **newly observed** actions after resume, but never for a previously queued cue. Explicit mute remains persistent and never automatically resumes.
- `audioInterruptions` is a bounded scalar diagnostic; no added timer, renderer callback, visual pool, buffer, sample, listener accumulation or per-cue allocation.

Test-first refinement discovered an integration issue in the first local patch: treating an involuntary suspend as a manual mute desynchronized D04 state from the unchanged soundstage/UI. That behavior was rejected and replaced before this handoff. The final code revokes only stale D04 audio, **not** existing user permission. No app/HUD file was modified.

## Reproduction and checks

New `tests/foundation/dungeon-d04-audio-context-state-lifecycle.test.cjs` has five contracts:

1. Queued sword sound remains silent after suspend/resume, while retained art stays visible and new witnessed sword action is audible under the existing user opt-in.
2. Consecutive non-running states cause one interruption, while another after a true resume is counted separately; listener is removed at disposal.
3. Late AudioContext attachment is idempotent and a missing event API fails gracefully.
4. Already staged but **not submitted** sword sound is removed at suspend; no stale frame acknowledgment can play it.
5. Manual mute preference survives suspend/resume, with no automatic reauthorization.

**Observed adapted verification:** initial red test reproductions on exact fetched production code, followed by **5/5** source-adapted V8 scenarios matching the final implementation. Test and source strings passed JavaScript parsing. The V8 harness replaces module imports and uses synthetic render/foley adapters; it cannot certify native Node execution, Three.js, browser WebAudio sound, actual sample onset or captured media.

**NOT RUN:** `node --test`, full build, Playwright, original-PCM capture, real GLB animation, WebGL context-loss/recovery and 20-minute soak. The coding tunnel returned "Tunnel-client has not been seen for 300 seconds"; the separate container cannot resolve `github.com`. No matching GitHub CI workflow run/status was reported at inspection.

When the project worktree and assets are accessible, run:

```sh
node --test tests/foundation/dungeon-d04-audio-context-state-lifecycle.test.cjs \
 tests/foundation/dungeon-d04-optin-epoch-audio.test.cjs \
 tests/foundation/dungeon-d04-visual-audio-submission.test.cjs \
 tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Acceptance, ownership and rollback

Only `public/ai-dungeon/physical-combat-feedback.js`, the new D04 contract test and this handoff changed. The sound engine, character rigs, authoritative `games/ai-dungeon/src`, renderer, master soundstage, app/HUD, camera, global lighting, main branch, Draft PR #49 and other branches were not touched. The established seven retained pools (102 reserved instances), eight original foley voices, one retained generated noise buffer, 32 pending/32 awaiting/64 receipt limits, reduced-motion/flash and event/HP causal proof are unchanged.

The normal `/dungeon` spectator stays legacy; this correction only applies to `?feedback=d04`. Revert this isolated series if a genuine captured foreground/background test shows dropped new sound, a listener leak, or ambiguous consent behavior. **Do not merge** until D10’s integration review.

Still mandatory: authentic matched 1440×900 and 390×844 canvas+opt-in WebAudio clips from three viewpoints including Warden warning/release/recovery/counter, missed sword, block, dodge, arrow, spell and HP-confirmed impact; source-aligned frame/PCM timing; and a 20-minute resource soak. The repository's asset manifest refers to licensed external GLBs, but the branch does not contain genuine playable GLB assets or tracked Dungeon capture clips. No sound transformation score, frame-sync pass, or Diablo-IV-quality claim is made.

**Next dominant physical weakness:** movement-derived ribbons still use the authenticated wrist rather than measured sword-tip geometry. That requires the actual moving, licensed GLBs plus multi-view playback and source-aligned original audio before any blade-contact realism claim.
