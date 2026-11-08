# D04 — Preserve original combat noise through the complete cue envelope

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting head: `bfb0678892fbd217d81b064753bfd64c2acae6b1`.
Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324`.
Status: **SOURCE-LEVEL CORRECTION ONLY / REAL DUNGEON A/V UNVERIFIED**.

## Observable source defect and RED reproduction

The original synthesized noise texture was at most 280ms; the AudioBufferSourceNode
was not looping. Warden release (580ms), boss final warning (500ms),
fatal impact (430ms), defeat (600ms) and spell release (340ms) therefore lost
their noise bed before the scheduled recipe completed. Remaining resonators
could still sound, so this is an audible *layer-duration mismatch*, not
necessarily complete silence. A detached exact-branch-source WebAudio mock
confirmed Warden source `loop===undefined` and a 280ms, 13,441-sample
48kHz buffer. Earlier sample endpoints also mismatched, so naïve looping
could introduce discontinuities.

## Implementation / proof

Keep the existing **single** deterministic, originally generated mono noise
buffer and the same 19,200-sample limit. Brief symmetric ~3ms tapers bring
both ends to zero. Existing per-voice AudioBufferSourceNodes now loop until
their existing gain-envelope stop time. No new source per voice, imported
asset, oscillator, effect pool, draw call, gameplay signal, or simulation
write is introduced. WebAudio opt-in, mute, priorities, cooldown, eight-voice
limit, resource cleanup and D04-only `?feedback=d04` stay unchanged.

The candidate exact-module detached harness passed 11/11 behavioral assertions:
looping, one buffer, silent endpoints, deterministic generation, original
sample budget, continuation past 300ms, stop cleanup and mute cleanup.
The newly committed Node regression contracts cover five long recipes,
8/48/96kHz and full-voice saturation. **Those Node tests have not yet run
in the full repository** because the coding/browser tunnel is disconnected.
The mock tests establish contracts, not actual audible fidelity.

## Remaining acceptance / review and rollback

No tracked GLB, glTF, WAV, OGG, WebM, MOV or MP4 was present in the branch
tree. Genuine same-seed three-viewpoint BEFORE/AFTER game clips, 390px
mobile, full Warden cycle, missed/blocked/dodged attacks, WebGL frame-to-PCM
onset, low-end stalls and a 20-minute soak remain **UNVERIFIED**. Full build
and Playwright are likewise unverified; no CI runs were reported on the
starting head. Longer looping noise changes sound texture and requires
browser audition for loop flutter, perceived loudness and true peak.
Do not promote to default or claim Diablo IV parity. Rollback by reverting
this isolated commit. Next dominant weakness: verify physical sword-tip
tracking (currently a wrist proxy) and real captured audiovisual alignment.
